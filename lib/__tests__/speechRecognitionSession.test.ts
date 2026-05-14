import { describe, it, expect, vi } from "vitest";
import { createSRSession } from "@/lib/speechRecognitionSession";

function makeMockSR() {
  let instanceCount = 0;
  const instances: MockSR[] = [];

  class MockSR {
    onresult: ((e: any) => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    continuous = false;
    interimResults = false;
    lang = "";
    start = vi.fn();
    stop = vi.fn();
    abort = vi.fn();

    constructor() {
      instanceCount++;
      instances.push(this);
    }
  }

  return {
    MockSR: MockSR as unknown as { new(): any },
    getInstanceCount: () => instanceCount,
    instances,
  };
}

describe("createSRSession", () => {
  it("creates only one SR instance across multiple start() calls", () => {
    const { MockSR, getInstanceCount } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start();
    session.start();

    expect(getInstanceCount()).toBe(1);
  });

  it("calls abort() when destroy() is called while recognition is active", () => {
    const { MockSR, instances } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start(); // active = true
    session.destroy();

    expect(instances[0].abort).toHaveBeenCalledTimes(1);
    expect(instances[0].stop).not.toHaveBeenCalled();
  });

  it("does NOT call abort() when destroy() is called after recognition already ended", () => {
    // Root cause of the original bug: calling stop/abort on an already-ended SR
    // instance re-activates the mic in Safari.
    const { MockSR, instances } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start();
    instances[0].onend?.(); // recognition ends naturally (active → false)
    session.destroy();      // should be a no-op on the rec instance

    expect(instances[0].abort).not.toHaveBeenCalled();
    expect(instances[0].stop).not.toHaveBeenCalled();
  });

  it("calls onEnd with accumulated final text when recognition ends", () => {
    const { MockSR, instances } = makeMockSR();
    const onEnd = vi.fn();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd, onError: vi.fn() }
    );

    session.start();
    const rec = instances[0];

    rec.onresult?.({
      resultIndex: 0,
      results: Object.assign([[{ transcript: "in the beginning" }]], {
        0: Object.assign([{ transcript: "in the beginning" }], { isFinal: true }),
      }),
    });
    rec.onend?.();

    expect(onEnd).toHaveBeenCalledWith("in the beginning");
  });

  it("resets accumulated text on each new start() so stale text does not bleed through", () => {
    const { MockSR, instances } = makeMockSR();
    const onEnd = vi.fn();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd, onError: vi.fn() }
    );

    // First session: say something
    session.start();
    instances[0].onresult?.({
      resultIndex: 0,
      results: Object.assign([[{ transcript: "first pass" }]], {
        0: Object.assign([{ transcript: "first pass" }], { isFinal: true }),
      }),
    });
    instances[0].onend?.();

    // Second session: fresh instance created after first ended; say nothing, just end
    session.start();
    instances[1].onend?.();

    expect(onEnd).toHaveBeenNthCalledWith(1, "first pass");
    expect(onEnd).toHaveBeenNthCalledWith(2, ""); // cleared between sessions
  });

  it("creates a new SR instance after the previous session ends (mic released)", () => {
    const { MockSR, getInstanceCount, instances } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start();
    instances[0].onend?.(); // session ends naturally
    session.start();        // next tap — should create a fresh instance

    expect(getInstanceCount()).toBe(2);
  });

  it("uses interim transcript as fallback when recognition ends with no final results", () => {
    const { MockSR, instances } = makeMockSR();
    const onEnd = vi.fn();
    const session = createSRSession(
      MockSR,
      { interimResults: true, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd, onError: vi.fn() }
    );

    session.start();
    // Interim result arrives (browser hasn't finalized yet)
    instances[0].onresult?.({
      resultIndex: 0,
      results: Object.assign([[{ transcript: "partial text" }]], {
        0: Object.assign([{ transcript: "partial text" }], { isFinal: false }),
      }),
    });
    // onend fires with no isFinal results (user tapped stop mid-utterance on Safari)
    instances[0].onend?.();

    expect(onEnd).toHaveBeenCalledWith("partial text");
  });

  it("does NOT call abort() when destroy() is called after onerror fired", () => {
    const { MockSR, instances } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start();
    instances[0].onerror?.(); // error fires (active → false)
    session.destroy();

    expect(instances[0].abort).not.toHaveBeenCalled();
    expect(instances[0].stop).not.toHaveBeenCalled();
  });

  it("stop() calls rec.stop() while recognition is active", () => {
    const { MockSR, instances } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start();
    session.stop();

    expect(instances[0].stop).toHaveBeenCalledTimes(1);
    expect(instances[0].abort).not.toHaveBeenCalled();
  });

  it("stop() does NOT call rec.stop() after recognition already ended", () => {
    const { MockSR, instances } = makeMockSR();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() }
    );

    session.start();
    instances[0].onend?.(); // recognition ends naturally (active → false)
    session.stop();          // user taps stop — should be a no-op

    expect(instances[0].stop).not.toHaveBeenCalled();
  });

  it("calls onError callback when recognition errors", () => {
    const { MockSR, instances } = makeMockSR();
    const onError = vi.fn();
    const session = createSRSession(
      MockSR,
      { interimResults: false, lang: "en-US" },
      { onTranscript: vi.fn(), onEnd: vi.fn(), onError }
    );

    session.start();
    instances[0].onerror?.();

    expect(onError).toHaveBeenCalledTimes(1);
  });
});

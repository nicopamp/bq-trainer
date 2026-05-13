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
    const rec = instances[0];
    rec.onresult?.({
      resultIndex: 0,
      results: Object.assign([[{ transcript: "first pass" }]], {
        0: Object.assign([{ transcript: "first pass" }], { isFinal: true }),
      }),
    });
    rec.onend?.();

    // Second session: say nothing, just end
    session.start();
    rec.onend?.();

    expect(onEnd).toHaveBeenNthCalledWith(1, "first pass");
    expect(onEnd).toHaveBeenNthCalledWith(2, ""); // cleared between sessions
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

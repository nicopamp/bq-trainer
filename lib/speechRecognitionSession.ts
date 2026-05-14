export interface SRSessionOptions {
  interimResults: boolean;
  lang: string;
}

export interface SRSessionCallbacks {
  onTranscript: (text: string) => void;
  /** Called with the full final transcript when recognition ends (empty string if nothing was said). */
  onEnd: (finalText: string) => void;
  onError: () => void;
}

export interface SRSession {
  start(): void;
  stop(): void;
  destroy(): void;
}

/**
 * Creates a reusable SpeechRecognition session that persists across start/stop cycles.
 * A single SR instance is constructed lazily on the first start() call and reused
 * on subsequent calls — preventing browsers from re-prompting for mic permission.
 */
export function createSRSession(
  SR: { new(): any },
  options: SRSessionOptions,
  callbacks: SRSessionCallbacks
): SRSession {
  let rec: any = null;
  let finalText = "";
  let active = false; // true only between rec.start() and onend/onerror firing

  function ensureRec() {
    if (rec) return rec;

    rec = new SR();
    rec.continuous = false;
    rec.interimResults = options.interimResults;
    rec.lang = options.lang;

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      callbacks.onTranscript(finalText || interim);
    };

    rec.onend = () => {
      active = false;
      const text = finalText;
      finalText = "";
      callbacks.onEnd(text);
    };

    rec.onerror = () => {
      active = false;
      callbacks.onError();
    };

    return rec;
  }

  return {
    start() {
      const r = ensureRec();
      finalText = "";
      active = true;
      r.start();
    },
    // Called by the user tapping stop — processes remaining audio via stop().
    stop() {
      if (active) rec?.stop();
    },
    // Called on unmount — abort() releases the mic immediately without processing
    // remaining audio. Guard with active so we don't call abort() on an already-ended
    // instance, which would re-activate it in some browsers (Safari).
    destroy() {
      if (active) rec?.abort();
      rec = null;
    },
  };
}

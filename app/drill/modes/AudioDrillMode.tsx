"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { speakText, stopSpeaking } from "@/lib/tts";
import { useVoiceGrading } from "@/lib/useVoiceGrading";
import type { DrillModeProps } from "../drillTypes";

export function AudioDrillMode({ header, item, vref, onResult, shortcuts }: DrillModeProps) {
  const [phase, setPhase] = useState<"listen" | "speak" | "ref">("listen");
  const [isPlaying, setIsPlaying] = useState(false);
  const [confirmedGrade, setConfirmedGrade] = useState<1 | 2 | 3 | 4>(1);
  const [refSelected, setRefSelected] = useState<string | null>(null);
  const [refInput, setRefInput] = useState("");
  const [refRevealed, setRefRevealed] = useState(false);

  const cueText = item.cueText;
  const remainder = item.text.slice(cueText.length).trim();
  const fullVref = `${item.book} ${vref}`;

  const [choices] = useState<string[]>(() => {
    const ch = item.chapter;
    const v = Number(item.verseNum);
    const distractors = [
      `${item.book} ${ch}:${v === 1 ? 2 : v - 1}`,
      `${item.book} ${ch === 1 ? 2 : ch - 1}:${v}`,
      `${item.book} ${ch + 1 > 9 ? ch - 1 : ch + 1}:${Math.max(1, v - 2)}`,
    ];
    return [fullVref, ...distractors].sort(() => Math.random() - 0.5);
  });

  const { start, isListening, transcript, gradeResult, autoGrade, voiceUnavailable, showManualGrade } =
    useVoiceGrading(remainder || item.text);

  // Sync confirmed grade whenever voice grading completes
  useEffect(() => {
    if (autoGrade !== null) setConfirmedGrade(autoGrade);
  }, [autoGrade]);

  // Register grade shortcuts in speak phase when grade buttons are visible
  useEffect(() => {
    const sc = shortcuts.current;
    if (phase !== "speak" || !showManualGrade) { sc.grade = null; return; }
    sc.grade = (g) => { setConfirmedGrade(g); setPhase("ref"); };
    return () => { sc.grade = null; };
  }, [phase, showManualGrade, shortcuts]);

  const handlePlayCue = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText(cueText, 0.82, () => setIsPlaying(false));
    }
  };

  const handleReadyToSpeak = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    }
    setPhase("speak");
    if (!voiceUnavailable) start();
  };

  const handleManualGrade = (g: 1 | 2 | 3 | 4) => {
    setConfirmedGrade(g);
    setPhase("ref");
  };

  // ── Listen phase ──
  if (phase === "listen") {
    return (
      <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
        {header}
        <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
          <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
          <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Listen to the opening words</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>Hear the start of the verse · then complete it aloud</div>
        </div>
        <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r-xl)", padding: 24, marginBottom: 18 }}>
            <button
              style={{ width: 64, height: 64, borderRadius: 32, background: "var(--saffron-500)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(201,132,44,.4)" }}
              onClick={handlePlayCue}
            >
              <Icon name={isPlaying ? "pause" : "play"} size={26} color="#fff" />
            </button>
            <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,.55)" }}>Tap to hear the opening words</div>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", marginTop: 12 }} onClick={handlePlayCue}>
              <Icon name={isPlaying ? "pause" : "rewind"} size={14} color="#fff" />
              {isPlaying ? "Pause" : "Replay"}
            </button>
          </div>
        </div>
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "16px 22px 28px" }}>
          <button className="btn btn-saffron btn-lg" style={{ width: "100%" }} onClick={handleReadyToSpeak}>
            Ready to speak <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        </div>
      </div>
    );
  }

  // ── Speak phase ──
  if (phase === "speak") {
    return (
      <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
        {header}
        <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
          <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
          <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Complete the verse</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>Speak the rest aloud after the opening words</div>
        </div>
        <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r-xl)", padding: 20, marginBottom: 14 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,.4)", marginBottom: 6, fontSize: 10 }}>opening words</div>
            <div className="t-display-italic" style={{ fontSize: 18, color: "rgba(255,255,255,.8)", lineHeight: 1.4 }}>&ldquo;{cueText}&rdquo;</div>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", marginTop: 12 }} onClick={handlePlayCue}>
              <Icon name={isPlaying ? "pause" : "rewind"} size={14} color="#fff" />
              {isPlaying ? "Pause" : "Replay"}
            </button>
          </div>

          {transcript && (
            <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: "var(--r-md)", background: "rgba(255,255,255,.05)" }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,.4)", marginBottom: 4, fontSize: 10 }}>you said</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)", fontStyle: "italic" }}>{transcript}</div>
            </div>
          )}

          {showManualGrade && (
            <div style={{ padding: "14px 18px", borderRadius: "var(--r-md)", background: gradeResult?.pass ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {gradeResult !== null
                  ? `${gradeResult.pass ? "Well done!" : "Not quite"} · ${Math.round(gradeResult.accuracy * 100)}% accuracy`
                  : "Grade manually"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {([1, 2, 3, 4] as const).map((g) => (
                  <button key={g} onClick={() => handleManualGrade(g)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                    {["Again", "Hard", "Good", "Easy"][g - 1]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
          {gradeResult !== null || voiceUnavailable ? (
            <button className="btn btn-saffron btn-lg" style={{ flex: 1 }} onClick={() => setPhase("ref")}>
              Identify the reference <Icon name="chevron-right" size={18} color="#fff" />
            </button>
          ) : (
            <button
              style={{ flex: 1, height: 56, borderRadius: 32, border: "none", cursor: "pointer", background: isListening ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onClick={start}
            >
              <Icon name="mic-fill" size={20} color="#fff" />
              <span className="t-display" style={{ fontSize: 16 }}>{isListening ? "Listening…" : "Tap & speak"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Ref phase ──
  const isLearning = item.state === "learning";
  const refCorrect = isLearning
    ? refSelected === fullVref
    : refInput.trim().toLowerCase() === fullVref.toLowerCase();
  const refAnswered = isLearning ? refSelected !== null : refRevealed;

  return (
    <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
      {header}
      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
        <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Identify the reference</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>
          {isLearning ? "Pick the reference" : "Type the reference"}
        </div>
      </div>
      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        {isLearning ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {choices.map((choice, i) => {
              const isCorrect = choice === fullVref;
              const isSelected = choice === refSelected;
              let bg = "rgba(255,255,255,.05)";
              let border = "1px solid rgba(255,255,255,.12)";
              if (refSelected) {
                if (isCorrect) { bg = "var(--leaf-500)"; border = "1px solid var(--leaf-500)"; }
                else if (isSelected) { bg = "var(--rust-500)"; border = "1px solid var(--rust-500)"; }
              }
              return (
                <button key={choice} onClick={() => !refSelected && setRefSelected(choice)} style={{ background: bg, border, borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: refSelected ? "default" : "pointer", color: "#fff", textAlign: "left", fontFamily: "var(--font-body)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, border: refSelected && isCorrect ? "none" : "1.4px solid rgba(255,255,255,.4)", background: refSelected && isCorrect ? "rgba(255,255,255,.18)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>
                    {refSelected && isCorrect ? <Icon name="check" size={12} color="#fff" strokeWidth={2.4} /> : String.fromCharCode(65 + i)}
                  </div>
                  <span className="t-display" style={{ fontSize: 20, fontWeight: 500 }}>{choice}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={refInput}
              onChange={(e) => !refRevealed && setRefInput(e.target.value)}
              disabled={refRevealed}
              placeholder={`e.g. ${item.book} 1:1`}
              style={{ width: "100%", padding: "16px 18px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r-lg)", fontSize: 20, fontFamily: "var(--font-display)", color: "#fff", outline: "none" }}
            />
            {!refRevealed && (
              <button className="btn btn-saffron btn-lg" style={{ width: "100%", marginTop: 12 }} onClick={() => setRefRevealed(true)} disabled={refInput.trim().length < 3}>
                Check
              </button>
            )}
            {refRevealed && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: "var(--r-md)", background: refCorrect ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
                <div style={{ fontWeight: 600 }}>{refCorrect ? "Correct!" : `Answer: ${fullVref}`}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {refAnswered && (
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "14px 22px 28px" }}>
          <button className="btn btn-saffron btn-lg" style={{ width: "100%" }} onClick={() => onResult(confirmedGrade, transcript || undefined, gradeResult?.accuracy ?? undefined)}>
            Next <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

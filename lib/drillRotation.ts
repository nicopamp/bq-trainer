export type DrillMode = "audio" | "finish_it" | "type_out" | "ref_to_verse";

const MODES: DrillMode[] = ["audio", "finish_it", "type_out", "ref_to_verse"];

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleRotation(order: string): DrillMode[] {
  if (order === "audio") {
    return ["audio", ...fisherYates(MODES.filter((m) => m !== "audio"))];
  }
  if (order === "type_out") {
    return ["type_out", ...fisherYates(MODES.filter((m) => m !== "type_out"))];
  }
  return fisherYates(MODES);
}

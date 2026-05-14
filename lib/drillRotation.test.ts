import { describe, it, expect } from "vitest";
import { shuffleRotation } from "./drillRotation";

const ALL_MODES = ["audio", "finish_it", "type_out", "ref_to_verse"];

describe("shuffleRotation", () => {
  it("mixed: returns all four modes exactly once", () => {
    const result = shuffleRotation("mixed");
    expect(result).toHaveLength(4);
    expect([...result].sort()).toEqual([...ALL_MODES].sort());
  });

  it("audio: first slot is always 'audio'; all four modes present", () => {
    const result = shuffleRotation("audio");
    expect(result[0]).toBe("audio");
    expect(result).toHaveLength(4);
    expect([...result].sort()).toEqual([...ALL_MODES].sort());
  });

  it("type_out: first slot is always 'type_out'; all four modes present", () => {
    const result = shuffleRotation("type_out");
    expect(result[0]).toBe("type_out");
    expect(result).toHaveLength(4);
    expect([...result].sort()).toEqual([...ALL_MODES].sort());
  });

  it("unknown order falls back to shuffling all four modes", () => {
    const result = shuffleRotation("unknown");
    expect(result).toHaveLength(4);
    expect([...result].sort()).toEqual([...ALL_MODES].sort());
  });

  it("produces different orderings across multiple calls (probabilistic)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(shuffleRotation("mixed").join(","));
    }
    // 4! = 24 possible orderings; 50 draws should yield more than 1 unique ordering
    expect(seen.size).toBeGreaterThan(1);
  });
});

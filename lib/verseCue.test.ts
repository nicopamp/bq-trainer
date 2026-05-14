import { describe, it, expect } from "vitest";
import { computeVerseCues } from "./verseCue";

describe("computeVerseCues", () => {
  it("single-verse chapter: cue is the first word", () => {
    const result = computeVerseCues([{ id: 1, text: "And it came to pass" }]);
    expect(result[1]).toBe("And");
  });

  it("all verses start with different first words: cue = 1 word each", () => {
    const verses = [
      { id: 1, text: "The former treatise have I made" },
      { id: 2, text: "Until the day in which he was taken up" },
      { id: 3, text: "To whom also he shewed himself alive" },
    ];
    const result = computeVerseCues(verses);
    expect(result[1]).toBe("The");
    expect(result[2]).toBe("Until");
    expect(result[3]).toBe("To");
  });

  it("several verses share the same first word: cue length varies", () => {
    const verses = [
      { id: 1, text: "And he said unto them" },
      { id: 2, text: "And they were all amazed" },
      { id: 3, text: "But Peter stood up" },
    ];
    const result = computeVerseCues(verses);
    // verses 1 and 2 share "And", so both need 2 words
    expect(result[1]).toBe("And he");
    expect(result[2]).toBe("And they");
    // verse 3 has unique first word
    expect(result[3]).toBe("But");
  });

  it("two verses share a long common prefix: cue expands past 5 words", () => {
    const verses = [
      { id: 1, text: "And it came to pass in those days that Jesus" },
      { id: 2, text: "And it came to pass in those days a decree" },
      { id: 3, text: "But the angel said unto her" },
    ];
    const result = computeVerseCues(verses);
    // first 7 words "And it came to pass in those" are shared; differentiated at word 8
    expect(result[1]).toBe("And it came to pass in those days that");
    expect(result[2]).toBe("And it came to pass in those days a");
    expect(result[3]).toBe("But");
  });

  it("two verses with identical full text: falls back to full text", () => {
    const verses = [
      { id: 1, text: "And he went" },
      { id: 2, text: "And he went" },
    ];
    const result = computeVerseCues(verses);
    expect(result[1]).toBe("And he went");
    expect(result[2]).toBe("And he went");
  });

  it("normalization: verses differing only by punctuation in the first word are treated as sharing that word", () => {
    const verses = [
      { id: 1, text: "And, behold, there was a man" },
      { id: 2, text: "And he answered and said" },
    ];
    const result = computeVerseCues(verses);
    // normalized first words are both "and" → not unique at 1 word
    expect(result[1]).toBe("And, behold,");
    expect(result[2]).toBe("And he");
  });

  it("normalization: punctuation stripped mid-word too", () => {
    const verses = [
      { id: 1, text: "LORD's name shall be praised" },
      { id: 2, text: "LORDs hosts are gathered" },
    ];
    const result = computeVerseCues(verses);
    // "lord's" → "lords" and "lords" → "lords" → both normalize to "lords" → not unique at 1 word
    expect(result[1]).toBe("LORD's name");
    expect(result[2]).toBe("LORDs hosts");
  });
});

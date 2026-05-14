import { describe, it, expect } from "vitest";
import { chunkVerse } from "./chunking";

describe("chunkVerse", () => {
  it("verse with no clause punctuation returns single-element array", () => {
    // Acts 1:1 opening phrase — no commas, semicolons, or colons
    expect(chunkVerse("The former treatise have I made")).toEqual([
      "The former treatise have I made",
    ]);
  });

  it("splits on comma, trailing comma preserved on first chunk", () => {
    // Acts 2:38 excerpt
    expect(chunkVerse("Repent, and be baptized")).toEqual([
      "Repent,",
      "and be baptized",
    ]);
  });

  it("splits on semicolon, trailing semicolon preserved on first chunk", () => {
    // Acts 1:9 excerpt
    expect(chunkVerse("he was taken up; and a cloud received him")).toEqual([
      "he was taken up;",
      "and a cloud received him",
    ]);
  });

  it("splits on colon, trailing colon preserved on first chunk", () => {
    // Acts 1:8 excerpt
    expect(chunkVerse("the Holy Ghost is come upon you: and ye shall be witnesses")).toEqual([
      "the Holy Ghost is come upon you:",
      "and ye shall be witnesses",
    ]);
  });

  it("long unpunctuated clause (>8 words) stays as a single chunk — no mid-phrase split", () => {
    expect(
      chunkVerse("And the multitude rose up together against them and beat them")
    ).toEqual(["And the multitude rose up together against them and beat them"]);
  });

  it("long unpunctuated clause with no punctuation anywhere returns single chunk", () => {
    expect(
      chunkVerse("and be baptized every one of you in the name of Jesus Christ for the remission of sins")
    ).toEqual([
      "and be baptized every one of you in the name of Jesus Christ for the remission of sins",
    ]);
  });

  it("empty string returns single-element array containing empty string", () => {
    expect(chunkVerse("")).toEqual([""]);
  });

  it("Acts 2:38 — splits only at commas, long unpunctuated clause stays whole", () => {
    expect(
      chunkVerse(
        "Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost."
      )
    ).toEqual([
      "Then Peter said unto them,",
      "Repent,",
      "and be baptized every one of you in the name of Jesus Christ for the remission of sins,",
      "and ye shall receive the gift of the Holy Ghost.",
    ]);
  });
});

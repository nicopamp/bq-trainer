import { describe, it, expect } from "vitest";
import { safeNextPath } from "./safeRedirect";

describe("safeNextPath", () => {
  const cases: [string, string | null, string][] = [
    ["null returns /home",               null,                   "/home"],
    ["empty string returns /home",       "",                     "/home"],
    ["/home passes through",             "/home",                "/home"],
    ["/chapter/3 passes through",        "/chapter/3",           "/chapter/3"],
    ["/home?x=1 passes through",         "/home?x=1",            "/home?x=1"],
    ["/home#anchor passes through",      "/home#anchor",         "/home#anchor"],
    ["// prefix is rejected",            "//evil.com",           "/home"],
    ["/\\ prefix is rejected",           "/\\evil.com",          "/home"],
    ["https:// is rejected",             "https://evil.com",     "/home"],
    ["http:// is rejected",              "http://evil.com",      "/home"],
    ["javascript: is rejected",          "javascript:alert(1)",  "/home"],
    ["no leading slash is rejected",     "evil.com/path",        "/home"],
  ];

  for (const [label, input, expected] of cases) {
    it(label, () => {
      expect(safeNextPath(input)).toBe(expected);
    });
  }

  it("custom fallback is honored when input is unsafe", () => {
    expect(safeNextPath("//evil.com", "/login")).toBe("/login");
  });

  it("custom fallback is ignored when input is safe", () => {
    expect(safeNextPath("/chapter/1", "/login")).toBe("/chapter/1");
  });
});

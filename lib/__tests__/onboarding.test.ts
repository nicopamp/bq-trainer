import { describe, it, expect } from "vitest";
import { isProfileComplete } from "@/lib/onboarding";

describe("isProfileComplete", () => {
  it("all fields filled → complete", () => {
    expect(isProfileComplete({ fullName: "Alice", quizCategory: "TBQ", church: "Grace" })).toBe(true);
  });

  it("empty fullName → incomplete", () => {
    expect(isProfileComplete({ fullName: "", quizCategory: "TBQ", church: "Grace" })).toBe(false);
  });

  it("whitespace-only fullName → incomplete", () => {
    expect(isProfileComplete({ fullName: "   ", quizCategory: "TBQ", church: "Grace" })).toBe(false);
  });

  it("no quizCategory → incomplete", () => {
    expect(isProfileComplete({ fullName: "Alice", quizCategory: "", church: "Grace" })).toBe(false);
  });

  it("empty church → incomplete", () => {
    expect(isProfileComplete({ fullName: "Alice", quizCategory: "EABQ", church: "" })).toBe(false);
  });

  it("whitespace-only church → incomplete", () => {
    expect(isProfileComplete({ fullName: "Alice", quizCategory: "EABQ", church: "  " })).toBe(false);
  });
});

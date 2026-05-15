import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { testSignInGate } from "./testSignInGate";

describe("testSignInGate", () => {
  const SECRET = "test-secret-value";

  beforeEach(() => {
    vi.stubEnv("E2E_TEST_SECRET", SECRET);
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows when env is non-production and secret matches", () => {
    expect(testSignInGate(SECRET)).toEqual({ allowed: true });
  });

  it("blocks when NODE_ENV is production even with correct secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(testSignInGate(SECRET)).toEqual({ allowed: false });
  });

  it("blocks when secret is wrong", () => {
    expect(testSignInGate("wrong-secret")).toEqual({ allowed: false });
  });

  it("blocks when supplied secret is null", () => {
    expect(testSignInGate(null)).toEqual({ allowed: false });
  });

  it("blocks when E2E_TEST_SECRET is unset", () => {
    vi.stubEnv("E2E_TEST_SECRET", "");
    expect(testSignInGate(SECRET)).toEqual({ allowed: false });
  });

  it("does not throw when supplied secret is a different length than expected", () => {
    expect(() => testSignInGate("short")).not.toThrow();
    expect(testSignInGate("short")).toEqual({ allowed: false });
  });

  it("does not throw when supplied secret is longer than expected", () => {
    expect(() => testSignInGate(SECRET + SECRET + SECRET)).not.toThrow();
    expect(testSignInGate(SECRET + SECRET + SECRET)).toEqual({ allowed: false });
  });

  it("blocks secret with trailing space even though base matches", () => {
    expect(testSignInGate(SECRET + " ")).toEqual({ allowed: false });
  });
});

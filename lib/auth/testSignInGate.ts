import { timingSafeEqual } from "crypto";

export function testSignInGate(suppliedSecret: string | null): { allowed: boolean } {
  if (process.env.NODE_ENV === "production") return { allowed: false };

  const expected = process.env.E2E_TEST_SECRET;
  if (!expected || !suppliedSecret) return { allowed: false };

  // Pad both to the same length so timingSafeEqual never throws on length mismatch
  const len = Math.max(expected.length, suppliedSecret.length, 64);
  const a = Buffer.from(expected.padEnd(len));
  const b = Buffer.from(suppliedSecret.padEnd(len));

  return { allowed: timingSafeEqual(a, b) };
}

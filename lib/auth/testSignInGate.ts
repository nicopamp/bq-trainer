import { timingSafeEqual } from "crypto";

export function testSignInGate(suppliedSecret: string | null): { allowed: boolean } {
  if (process.env.NODE_ENV === "production") return { allowed: false };

  const expected = process.env.E2E_TEST_SECRET;
  if (!expected || !suppliedSecret) return { allowed: false };

  // Normalize to same length with null-byte fill (not spaces) so trailing
  // whitespace differences are preserved and timingSafeEqual never throws
  const len = Math.max(expected.length, suppliedSecret.length, 64);
  const a = Buffer.alloc(len, 0);
  const b = Buffer.alloc(len, 0);
  a.write(expected);
  b.write(suppliedSecret);

  return { allowed: timingSafeEqual(a, b) };
}

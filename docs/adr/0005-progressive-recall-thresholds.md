# ADR 0005: Progressive recall thresholds in the Learn Flow

**Status:** Accepted  
**Date:** 2026-05-13

## Context

The Recall step (step 3 of the Learn Flow) requires 3 passing recitations before a verse Graduates. Pass/fail is determined by ASR Tolerance — word-overlap between the user's spoken transcript and the KJV target text.

The original implementation used a flat 75% threshold across all three passes. This was flagged as too lenient: a user could graduate a verse they hadn't really internalized, since 75% word overlap leaves significant room for missing key words.

The competing constraint is ASR accuracy. The Web Speech API produces artifacts on KJV archaisms (e.g., "thereof," "brethren," "aforetime"), proper names, and non-native accents. A 100% word-perfect threshold would cause false failures for users who actually know the verse.

## Decision

Replace the flat 75% threshold with a progressive curve across the three passes:

| Pass | Threshold |
|------|-----------|
| 1    | 80%       |
| 2    | 90%       |
| 3    | 95%       |

Pass 1 is forgiving enough to handle ASR noise on a first attempt. Pass 3 approaches word-perfect while still leaving a 5% margin for ASR artifacts on difficult KJV vocabulary.

The `ASR_PASS_THRESHOLD` constant in `lib/grading.ts` is replaced with a `RECALL_THRESHOLDS` array indexed by pass number.

## Consequences

- Users must genuinely improve pass-to-pass to Graduate a verse; they can no longer coast through on 3 identical 76% attempts.
- The mistake-highlighting UI (target verse with missed words highlighted) is now more important — users need to see exactly which words they're missing at each pass so they can close the gap between passes.
- If ASR quality degrades in a future browser update and legitimate recitations start failing at 90–95%, the thresholds may need to be tuned downward. Threshold values should be surfaced clearly in code (not buried as magic numbers).

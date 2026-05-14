# BQ Trainer

A spaced-repetition training app for Bible Quiz (BQ) competition. Competitors must memorize scripture word-perfect and recall verses under real-time pressure during matches. The app trains both initial memorization and long-term retention using the FSRS algorithm. Designed for multi-book support — currently seeded with Acts 1–9 KJV; new competition books are added via the seed script without code changes.

## Language

### Competition categories

**TBQ (Teen Bible Quiz)**:
The competition category for quizzers aged 12 and older who remain unmarried. The primary category this app is built for.
_Avoid_: teen quiz, junior quiz

**EABQ (English Adult Bible Quiz)**:
The competition category for quizzers aged 19 and older. English-language only. Shares the same rulebook and question formats as TBQ.
_Avoid_: adult quiz, senior quiz

**ABQ (Adult Bible Quiz)**:
The Spanish-language adult competition category. Out of scope for this app — no Spanish translation is planned.
_Avoid_: (do not conflate with EABQ)

### Competition concepts

**Quotation Question**:
A competition question requiring a word-perfect recitation of a complete verse. Zero tolerance — adding, omitting, or changing any word, syllable, or letter is incorrect.
_Avoid_: quote question, recitation question

**Quotation Completion Question**:
A competition question that gives the opening of a verse and requires the quizzer to perfectly complete the rest. Signaled by "Finish this verse, quote…"
_Avoid_: finish question, completion question

**Essence Question**:
Like a Quotation Question but paraphrase is acceptable — the meaning must be preserved, not the exact words.
_Avoid_: summary question

**Chapter Analysis Answer**:
An answer drawn from the official BQ Study Guide's structured chapter analysis — specific key phrases and clauses, not a free-form answer and not a perfect quotation. Training for this question type is a planned future feature; the Study Guide content is not yet available in structured form.
_Avoid_: outline answer, study guide answer

**Interruption**:
A competition mechanic where a quizzer buzzes in before the last word of a question, then must correctly complete the question before giving the answer. Requires both speed and precision. Out of scope for this app — accurately simulating a quizmaster's reading cadence is impractical; may be revisited as a future enhancement.
_Avoid_: buzz-in, early answer

**Quiz Out (forward)**:
A quizzer who answers 5 questions correctly in a match earns 20 bonus points and must leave the table.
_Avoid_: quizzing out, maxing out

**Quiz Out (backward)**:
A quizzer who answers 3 questions incorrectly must leave the table with no bonus.
_Avoid_: fouling out (distinct from foul out)

### App concepts

**Learn Flow**:
The 5-step initial memorization sequence (Read → Chunk → Trace → Recall → Graduate) that a quizzer completes once per verse before it enters spaced repetition. Not the same as a Drill.
_Avoid_: onboarding, tutorial, first pass

**Graduation**:
Completion of the Learn Flow. The verse moves from `learning` state to `review` state and receives its first FSRS schedule.
_Avoid_: finishing, completing, passing

**Drill**:
A spaced-repetition review session using one of four drill modes. Only verses in `review` or `mastered` state (or `learning` with a due date) appear in the Drill queue.
_Avoid_: quiz session, review session

**Practice**:
An off-schedule session using the same four Drill modes, initiated by the user regardless of FSRS due dates. Available from the home screen when no Drills are due. Distinct from a Drill, which is FSRS-triggered. The home screen CTA label is "Practice what you know."
_Avoid_: free drill, unscheduled drill, recall session

**Drill Mode**:
The format of a single drill question. Four modes exist: Audio, Finish-it, Type-out, Ref-to-verse. See individual definitions below.
_Avoid_: question type, exercise type

**Audio Mode**:
A drill mode where the quizzer hears the opening words of a verse, then must (1) complete the verse aloud, then (2) identify the reference. The reference response is adaptive: multiple-choice for verses in `learning` state, free-type once the verse reaches `review` state. Models the Quotation Completion Question competition format. Distinct from Finish-it, which drills spoken completion only with no reference identification.
_Avoid_: listen mode, reference quiz

**Finish-it Mode**:
A drill mode where the quizzer is shown the first portion of a verse and must speak the remainder aloud. Graded with ASR Tolerance (lenient word-overlap). No reference identification required.
_Avoid_: completion mode

**Type-out Mode**:
A drill mode where the quizzer types the full verse from memory. Graded word-perfect (strict). The primary competition-readiness training mode.
_Avoid_: typing mode, keyboard mode

**Ref-to-verse Mode**:
A drill mode where the quizzer is given a reference and must recite the full verse aloud. Graded with ASR Tolerance (lenient word-overlap).
_Avoid_: recitation mode

**Adaptive Reference Input**:
A mechanic within Audio Mode where the reference response format changes based on verse mastery — multiple-choice for newer verses, free-type for verses the quizzer has more experience with. Reduces scaffolding as confidence grows.
_Avoid_: progressive difficulty, difficulty scaling

**Mastered**:
A verse state indicating strong long-term retention (FSRS stability > 30 days, grade ≥ Good). Does not yet mean competition-ready — see Flagged Ambiguities.
_Avoid_: memorized, learned, known

**Event**:
A user-configured milestone with a name, date, and chapter scope. Can represent a practice deadline, a league meet, a regional, or a national competition. Events are maintained as an ordered list by date; the next upcoming event drives the home screen readiness display.
_Avoid_: competition date, meet date, deadline, milestone

**Event Scope**:
A contiguous chapter range an Event covers, always starting from chapter 1 — e.g., "chapters 1–3" for a practice deadline or "chapters 1–9" for a national. Competitions always cover chapters sequentially from the start; arbitrary chapter selections are not supported. Readiness signals on the home screen are calculated relative to the next Event's scope.
_Avoid_: chapter filter, coverage, chapter list

**Competition Season**:
The full ordered list of Events a user has configured for the current year. Typically progresses from smaller scope (practice, league) to full scope (regional, national), but the structure is variable and user-defined.
_Avoid_: schedule, calendar, timeline

**Stale**:
Display-only state for a verse that is overdue by more than stability × 1.5. Not persisted to the database; computed at render time.
_Avoid_: expired, overdue

**Word-Perfect**:
The strict grading standard applied to Type-out Mode: the quizzer's typed answer must match the KJV text exactly. Voice modes use ASR Tolerance instead. Word-perfect is the training ideal that all modes aim toward, but only Type-out enforces it mechanically.
_Avoid_: exact match, accurate

**ASR Tolerance**:
Lenient, word-overlap-based grading applied to all voice drill modes (Finish-it, Ref-to-verse, and the completion portion of Audio Mode). A transcript matching ≥ 75% of target words is a pass. Accounts for speech recognition errors on KJV archaisms, proper names, and accented speech. Voice modes are never strictly word-perfect; strict grading is reserved for Type-out.
_Avoid_: fuzzy matching, partial credit

## Relationships

- A **Verse** completes the **Learn Flow** once, then enters the **Drill** queue for spaced repetition
- Each **Drill** session uses one **Drill Mode** per verse
- **Graduation** is the boundary between **Learn Flow** and **Drill**
- **Word-Perfect** grading applies to **Type-out** strictly; **ASR Tolerance** modifies it for voice modes
- **Mastered** is an FSRS threshold, not a guarantee of **Quotation Question** readiness
- The next upcoming **Event** determines the home screen readiness display; its **Event Scope** defines which verses count toward readiness
- The home screen shows the **Event** countdown as the headline metric when within 60 days of the next Event; streak is the fallback when no Event is within that window
- A **Competition Season** is the ordered list of **Events**; each Event can have a different **Event Scope**
- The Drill queue always shows all due verses; "drill for next event" is a session-level shortcut that pre-applies the **Event Scope** filter — not a persistent setting

## Example dialogue

> **Dev:** "Should a quizzer who gets 80% word overlap on a Ref-to-verse pass?"
> **Domain expert:** "Yes, voice modes are lenient — ASR makes word-perfect grading unfair for users with accents. But the same quizzer needs to nail it exactly on Type-out."
>
> **Dev:** "Why does Audio Mode show the verse completion before asking for the reference?"
> **Domain expert:** "Because that's competition order — you have to know what the verse says before you can locate it. Reversing the order would make it easier but less realistic."
>
> **Dev:** "Does 'mastered' mean they're ready for competition?"
> **Domain expert:** "Not necessarily. Mastered means their FSRS stability is high — they probably remember it. But competition-readiness is a separate bar we haven't fully defined yet."

## Intentional scope boundaries

- **Interruption training**: out of scope. Simulating a quizmaster's reading cadence accurately is impractical; may be revisited as a future enhancement.
- **Chapter Analysis drill mode**: planned future feature. Blocked on obtaining the BQ Study Guide content in structured form.
- **Team and coach functionality**: out of scope. The app trains individual memorization; team strategy (substitutions, coaching, contest decisions) happens at practice and competition.
- **Translation support**: KJV-only. The `translation` column exists in the data model for future flexibility, but only KJV text will be seeded or trained against.

## Flagged ambiguities

- **"Competition-ready" is a distinct concept from "Mastered"**: `mastered` measures FSRS retention (stability > 30 days, grade ≥ Good) and determines review frequency. Competition-readiness requires demonstrated word-perfect recall under pressure and is not yet implemented as a state or signal in the app.

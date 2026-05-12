# Redesign Audio Mode as a two-part adaptive drill

The original Audio Mode (hear full verse → pick reference from 4 choices) was not aligned with any competition question format. We redesigned it to: hear opening words → identify reference + complete verse aloud. This directly models the Quotation Completion Question format from the rulebook, where quizzers must recognize a verse from its opening and recall the rest.

The response order is: complete the verse aloud first, then provide the reference. This mirrors how competition pressure actually works — the quizzer must recall the content before locating it.

The reference identification component uses Adaptive Reference Input: multiple-choice while the verse is in `learning` state (reducing cognitive load while still building familiarity), switching to free-type once the verse reaches `review` state (matching competition conditions where no choices are provided). The `review` boundary — graduation from the Learn Flow — is the natural threshold since it already indicates the quizzer has demonstrated sufficient recall. This separates Audio Mode clearly from Finish-it Mode, which drills spoken completion only with no reference component.

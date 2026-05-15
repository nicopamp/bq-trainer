-- Defense-in-depth CHECK constraints mirroring the Zod schemas in lib/actions/schemas.ts.
-- grade between 1 and 4 already exists on reviews from the initial migration.

alter table user_verses
  add constraint user_verses_learn_step_range
    check (learn_step between 0 and 5);

alter table events
  add constraint events_end_chapter_range
    check (end_chapter between 1 and 150),
  add constraint events_name_length
    check (length(name) between 1 and 80);

alter table profiles
  add constraint profiles_full_name_length
    check (length(full_name) between 1 and 80),
  add constraint profiles_church_length
    check (length(church) between 1 and 120);

alter table reviews
  add constraint reviews_transcript_length
    check (transcript is null or length(transcript) <= 2000);

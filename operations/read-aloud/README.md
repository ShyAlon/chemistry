# General Chemistry I theory read-aloud

This adds paragraph reading to the existing theory tab for course 84101, G1-G16. The normal scientific renderer stays the display owner. Worked-example, quiz, exam, glossary and separate reference/formula tabs are not narrated. Examples already visible inside theory remain ordinary theory content; hidden answers are never scraped.

`TheoryReader` uses the existing `Narrator`, one utterance per original theory block. Paragraphs are not split into sentence highlights. Headings, equations and figure captions are their own short blocks. Select by clicking non-interactive theory text or with the native paragraph selector. Formula tooltips and links retain their actions. Playback proceeds through the current topic only. Leaving theory or the topic unmounts and disposes the reader. Foreground loss also stops it. Pause cancels, then resume restarts the current block. Rate changes apply to the next utterance. Old callbacks cannot revive a stopped player.

The existing local-Hebrew voice filter remains unchanged. No remote or English fallback, audio files, microphone, reading history, analytics, new backend or external speech service is added. Browser/OS voice availability and actual pronunciation remain device-dependent. No background, locked-screen or universal offline promise is made.

## Content ownership

- Theory prose is read from the same source blocks used for display. `speech.js` expands notation and units for a literal reading; it does not infer scientific conclusions. Scientific display text, calculations, diagrams and constants are unchanged.
- `equation-readings.json` contains reviewed Hebrew readings for every current equation block, with the exact source text. `topic-sections.js` rejects a missing or changed equation source. Re-review both source and spoken wording when a formula changes, rather than mechanically accepting a changed snapshot.
- Gas-constant examples resolve the current constants registry at runtime, not a second hard-coded numerical value.
- Figure narration uses the existing explanatory caption. No SVG labels or decorative spectra are scraped. The current captions already explain the main relationship. Any new figure needing more explanation requires an authored description, not guessed visual interpretation.
- The selected spoken wording can be inspected in the reader settings, including formula readings. Literal inline notation and chemistry names need a real listening pass; mock events do not validate sound.

Current source inventory: 16 topics, 537 theory blocks, including 121 equations and 23 figures. Equation blocks are a subset of the total, not additional content or audio files.

## Verification

`tests/theory-read-aloud.test.js` checks coverage, unchanged display/source ownership, reviewed equations, constants, inline notation and isolation from the other learning tabs. `scripts/test-theory-read-aloud.mjs` runs only against the Firebase-stubbed build, blocks outside requests, visits all topics and checks paragraph-level events, pause/restart, formula selection, navigation disposal, missing voices and layout at 320/390/667/1280px. It is included in the normal browser gate. Its screenshots are visibly labelled synthetic with no audio.

The existing read-aloud trial and its tests remain as a small independent listening reference. The existing production/stub/browser/PWA/practice/papers/final-prep, progress, Rules and release checks still apply. Use the pinned Node 24 line and clean `npm ci` lifecycle behavior when preparing recovery bytes.

Before publication, inspect the phone/desktop UI and perform representative real-device listening for prose, formulas/units and diagram captions. A synthetic browser pass proves controls and highlighting events, not Hebrew pronunciation or perceived audio timing. The user reviews the UI before a PR and merges the tested PR.

The only related non-reader change is the explicitly reviewed PWA-help correction: progress is account-synced with an account-specific local copy, not local-only without sync. No storage or synchronization behavior is changed by this copy edit.

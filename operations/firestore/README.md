# Saved progress, small by design

Progress loss is low impact. This candidate therefore uses a UID-bound local cache and a small pending map, not revision histories, reset generations, durable recovery jobs or a conflict chooser. No activity service, Apps Script, scheduler, TTL, billing change or new provider is involved.

## Behavior

- Save existing quiz outcomes and the latest submitted mixed-practice result under `users/{uid}/studyProgress/{course}~{topicOrSession}`. The catalogue currently permits 58 records. No drafts, free-text answers, visits, dwell time or new analytics are saved.
- One localStorage entry per UID contains cached results and the latest pending value per question/result. Sign-out leaves it with its original UID. Legacy course-only keys remain untouched, unassigned and unuploaded. LocalStorage is not encrypted; project admins can access Firestore data.
- Only a server-acknowledged write earns the account-saved label. Offline results show device-saved. Storage failure warns that closing can lose pending work. Retry happens on reconnection, focus or the visible button, without a custom retry scheduler.
- Different-question writes merge. For the same question or practice, the latest successful server write wins, even if it came from an older offline device. There is no chooser, history, content-version migration or exact cross-device attempt count. Practice scores remain as submitted; the attempt count is labelled approximate.
- The local cache is intentionally not a multi-tab database. Concurrent tabs may overwrite local pending/cache entries. Accepted progress-loss tolerance does not weaken UID privacy or permit another account's data to be shown or sent.

## Reset is not privacy deletion

Ordinary progress reset reads the bounded collection, deletes the selected records in one atomic batch, then reads again to confirm removal. An offline/denied/racing reset is not announced as completed or silently queued for later. The UI requires pending synchronization to finish before reset. There is no reset log, generation fence or recovery daemon.

Reviewed limitation: an older offline device can later upload a pending answer and restore it after a progress reset. The reset confirmation says this explicitly and calls the action progress reset, not account deletion or personal-data erasure. The owner reviewed and approved this ordinary-reset limitation. It does not authorize privacy/account-data deletion, which remains separate.

The one retained privacy safeguard is `users/{uid}/studyAccess/closed`, an admin-only closure fence, denied to all clients. A separately authorized account closure must create that fence for the exact UID before deleting and verifying study records and removing Auth. Leave the fence against stale sessions. This is not a new closure UI or a promise of automatic cascades for other app data. Other devices' local copies cannot be remotely erased. No actual account is closed by tests.

## Tests and deployment boundary

Use `npm ci` with lifecycle scripts before preparing recovery output. Firebase's postinstall generates its defaults modules; skipping scripts can change production bytes even when every package version matches the lock. Local recovery preparation must mirror CI, not bypass the byte-match gate.

`npm test` covers the model/store and existing content checks. `npm run build` runs production and stub builds, then the browser/PWA/practice/papers/final-prep checks. The progress browser test blocks non-loopback requests and uses fake identities/data. Screenshots are synthetic UI previews, not proof of live sync.

`npm run rules:generate` adds catalogue-bounded owner-only validation to the preserved baseline. Adult declarations and write-only reports stay unchanged. No epoch/activity namespace is added. `npm run setup:rules` downloads Google's pinned SHA-256-checked Firestore emulator separately. `npm run test:rules` uses the real adapter/SDK and proposed Rules on a loopback `demo-` project, then stops it. Java 11+ and Node 24.12+ are required; CI uses the Node 24 line to match the SDK/test dependency engines. No Google login or credentials are needed. A narrow gRPC 1.13.6 override addresses inherited advisories without changing the Firebase SDK version.

A cold account refresh reads at most the current 58 progress records. Each answer uses one merged write plus Rules-dependent access checks; reset uses a bounded query, batch deletion and verification. These are design counts, not measured production billing. Quotas are shared with existing traffic. Keep billing disconnected and verify actual usage before rollout; no spending is authorized by a quota failure.

Review UI before opening a PR; the owner merges. Production Rules deployment and a bounded synthetic live progress check require separate exact approval and a fresh live baseline/configuration check. Source and emulator tests do not prove live permissions, network behavior or quota headroom. Activity collection and cleanup stay parked.

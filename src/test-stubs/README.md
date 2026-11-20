# Hermetic Firebase stubs for the browser test build

The browser suites (test:browser/pwa/practice/papers) run in local Chromium
with no network, accounts, or live models. The site-wide auth gate makes a
signed-in session a precondition for every study journey, so the test build
(`npm run build:test`, BROWSER_TEST_STUB=1) aliases the `firebase/*` imports
to these doubles. The production build (`vite build`) never touches them.

Doubles are deliberately thin:
- auth: immediately emits one fake signed-in learner; sign-in calls reject
  with auth/operation-not-allowed (the landing page is never reachable in
  the stub build; it is verified on the real build).
- firestore: the adult declaration always reads confirmed; writes resolve.
- ai: sendMessage returns one canned Hebrew reply.

If the app starts using a new firebase export, the matching stub must grow
the same export or the test build fails loudly at bundle time.

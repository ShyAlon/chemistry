# Dependency review, 20 November 2026

This content-only exam-preparation update does not change dependency versions or the lockfile. The dependency and devDependency maps match the reviewed main commit, and `package-lock.json` has no diff. The following are existing findings, not new vulnerabilities introduced by the teaching content.

## npm audit

The audit reports four high-severity package entries along one transitive chain: `firebase` -> `@firebase/firestore-compat` / `@firebase/firestore` -> `@grpc/grpc-js` 1.9.16. These are not four independent newly introduced defects. The underlying advisories are:

- https://github.com/advisories/GHSA-m9gg-hp2v-232j: high, certificate authorization context under certain configurations.
- https://github.com/advisories/GHSA-f596-whhp-79r4: low, server handler errors exposed in status messages.

The audit identifies grpc-js versions below 1.13.6 as affected. Its offered top-level remediation is a major Firebase version change, not an appropriate automatic fix in a content-only patch. No audit fix or dependency upgrade was applied.

## Shipped browser versus installed dependency

A production Vite/Rollup module-graph inspection resolves Firestore to `@firebase/firestore/dist/index.esm.js` and its shared ESM chunk. The graph contains no `@grpc/` modules. The installed Firestore package distinguishes browser ESM exports from Node exports, where gRPC is used.

For this static browser build, the flagged gRPC package is installed in the dependency tree but is not part of the shipped browser module graph. This does not certify every environment or future server-side use of these dependencies. It also does not establish a site compromise. It is evidence about this build's exposure only.

## Engine compatibility

The installed Firestore 4.20.0 package declares Node >=24.12.0, newer than the local Node 22.23.5 runtime. Installation and all local build/test gates completed, but passing tests do not erase the declared support mismatch. A dependency/runtime maintenance update should be evaluated separately from the exam-preparation content, with the existing auth/chat and browser/offline gates retained.

No paid or live model calls, credential changes, workflow reruns or security-rule changes were made during this review.

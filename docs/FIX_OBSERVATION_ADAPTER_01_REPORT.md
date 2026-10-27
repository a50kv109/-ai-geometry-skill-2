# FIX-OBSERVATION-ADAPTER-01 Report

**Date:** 2026-10-27
**Branch:** `feat/schematic-observation-integration`
**Starting HEAD:** `b1d7930f8fe2fae8701981c816b28728d95eb8b4`

## Result

The observation adapter is ready for an independent engineering re-evaluation on synthetic input. The change does not establish image-recognition quality, physical measurement accuracy, or production readiness.

## Worktree state and scope

At the start, the requested branch was checked out at the HEAD above. The worktree already contained edits to `README.md` and `package.json`, plus untracked integration-audit/cross-validation documents, the schematic example, and the adapter source/tests. These existing changes were preserved. No commit, push, merge, reset, rebase, or cleanup was performed.

This task changed the adapter source and tests, updated the adapter documentation in `README.md`, and added this report. The existing `package.json`, example, audit documents, and report of the earlier experiment were not rewritten. No files under the Geometry Skill mathematical core/headless implementation were changed, and the auxiliary Schematic Reasoning Core repository was not changed.

## Adapter fixes and verified contracts

- `confidence: null` is accepted and retained as `null`; the adapter does not invent a confidence value.
- Prepared values are deeply frozen, and connected-observation endpoint ID arrays are copied before freezing. Mutating the caller's input after preparation neither changes the prepared snapshot nor freezes caller-owned arrays.
- Application preflights the batch, checkpoints the target session, and rolls back if creation or final state inspection fails. Rollback failures are returned explicitly. Duplicate observations resolving to the same target connection are rejected rather than being reported as distinct created geometry.
- Homography validation and coordinate mapping normalize the matrix by its largest absolute coefficient. The singularity/conditioning test is based on the normalized matrix, so multiplying a valid homography by a nonzero scalar does not change acceptance or mapped coordinates.
- Verification reports are associated with the exact successful adapter result through a private weak association. The immutable result cannot have its ID arrays edited to include unrelated objects; verification subjects and references must both be connected geometry IDs from that application.
- `TARGET_CORE_MEASUREMENT_UNIT` declares the adapter target unit as `mm`. The target frame must be a `geometry-model` frame in millimeters, matching the core's measurement contract. No automatic unit conversion is performed; any scale conversion must be represented by the caller's explicitly directed homography.

## Regression controls

The focused adapter suite now has 19 passing checks, including controls for:

- explicit `confidence: null` preservation;
- the formerly rejected `1e-5 * I` homography;
- unchanged prepared geometry after attempts to mutate the prepared result and after mutation of the original input;
- rollback after a late target-core failure and after a failure during post-apply inspection;
- rejection of a verification result containing an object ID not produced by the applied batch;
- rejection of a non-`mm` target frame; and
- duplicate connected observations that otherwise could have been attributed to one target object.

These are synthetic contract tests. They do not test vision or image localization.

## Validation performed

| Command | Result |
|---|---|
| `npm run lint` | PASS, exit 0 (`tsc --noEmit`). |
| `npm run test:schematic-observation` | PASS, 19/19 checks. |
| `npm run example:schematic-observation` | PASS, exit 0. The target core verified the synthetic perpendicular relation; image localization and physical measurement accuracy remained `NOT_EVALUATED`. |
| `npm run test:all` (rerun without concurrent load) | PASS, exit 0; the complete chained project suite, including the adapter suite, completed. |
| `npm run build` | PASS, exit 0. Existing Vite warnings remain for browser externalization of Node `fs` and the 902.81 kB minified application chunk exceeding the 500 kB advisory threshold. |
| `git diff --check` | PASS, exit 0. |

No dependencies were added or installed. The first full-suite invocation ran concurrently with the production build and failed the existing GCM-11.1 one-second performance threshold. The full suite was rerun by itself and passed with exit code 0; the focused adapter suite passed in both runs.

## Remaining risks and limits

- Coordinates still come from the caller. A mathematically valid relation does not prove that the correct image features were localized.
- The adapter cannot verify that a supplied homography is calibrated correctly or that its declared units reflect the physical drawing. `mm` is the required target-core unit, not proof of physical scale.
- The target session's rollback API is the atomicity boundary. If the target core itself fails to roll back, the adapter reports the rollback failure, but cannot independently guarantee restoration. The current public API also has no way to discard a fork checkpoint after rollback, so a failed application can leave an unused internal checkpoint even when the visible geometry state is restored.
- No real-image recognition test, SRC end-to-end integration run, or independent physical measurement validation was performed for this fix.
- The existing target mathematical core and its behavior remain unchanged; its known limits around general triangle degeneracy and image evidence are outside this adapter task.

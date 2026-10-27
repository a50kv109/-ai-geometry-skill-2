# Geometry Skill Cross-Validation Report

**Task:** `GEOMETRY-SKILL-CROSS-VALIDATION-01`
**Date:** 2026-10-27 (Europe/Kyiv)
**Scope:** controlled synthetic-coordinate experiment across the current `ai-geometry-skill-2` adapter worktree and `schematic-reasoning-core`; no source implementation changes.

## 1. Repositories and starting state

| Repository | Branch / HEAD | State observed before experiment |
|---|---|---|
| Old stand: `outputs/ai-geometry-skill-2-checkout` | `feat/schematic-observation-integration`, `b1d7930f8fe2fae8701981c816b28728d95eb8b4` | Existing modifications: `README.md`, `package.json`; untracked `docs/SCHEMATIC_CORE_INTEGRATION_AUDIT.md`, `examples/schematic-observation/`, and `src/adapters/`. These were present before this task and were preserved. The new report is the only file added by this task. HEAD remains the base commit; the adapter is still working-tree content, not committed branch content. |
| New stand: `outputs/schematic-reasoning-core` | `main`, `589272df7761f52c34f066a0a68dcbd23a1dd192` | Tracked working tree clean. Existing ignored research/package assets are present. No tracked source changes were made. |

No dependencies were installed; no commit, push, merge, reset, or rebase was run. The Fiber SDK was not involved. Temporary harnesses were kept under `/tmp` and are not deliverables. The existing ignored `outputs/test-reports/local-real-image-check.json` was written by SRC's `npm test`; its bytes matched the pre-existing evidence copy (`bdf61d7a…`), and its modification time was restored from that identical copy.

## 2. Old stand: actual usable APIs and limits

The experiment used `HeadlessGeometrySession` from `src/headless/HeadlessGeometrySession.ts`:

- `create_point(x, y, {id})` creates finite-coordinate points and rejects duplicate IDs/non-finite coordinates.
- `connect(p1Id, p2Id, 'SEGMENT' | 'LINE')` creates segments or lines from distinct point IDs. Distinct IDs at equal coordinates are accepted by this API; a zero-length segment can be stored.
- `measure(id, 'SEGMENT_LENGTH')` returns segment length. `RADIUS` is also supported. Segment measurements currently label the unit `MM` in the core implementation.
- `verify(subjectId, relation, referenceId)` supports `PERPENDICULAR_TO`, `PARALLEL_TO`, `EQUAL_LENGTH`, and `POINT_ON_CIRCLE`, with receiver tolerance `1e-4`. Unsupported relations return `CAPABILITY_GAP`.
- `construct()` exposes existing perpendicular, parallel, angle-bisector, and perpendicular-bisector planners; `intersect()` delegates to existing line/segment/circle intersection routines; `observe('FULL'|'OBJECT'|'COMPACT'|'RELATIONS'|'CONSTRAINTS')` exposes state and selected derived views.

Limits relevant to this experiment:

- There is no generic triangle entity or public triangle-area/non-collinearity check. The session can store three points and three segments without deciding they form a non-degenerate triangle.
- There is no image annotation oracle. The core can check relations and measure the supplied coordinates; it cannot determine whether those coordinates came from the correct visible points.
- Segment-length results are labelled `MM`; the adapter accepts arbitrary target-frame `units`. This experiment therefore used a target frame declared in `mm`. Callers must not interpret the core's unit label as a conversion from other units.
- The session has `fork()`/`rollback()` APIs, but the observation adapter does not apply batches transactionally through them. No transaction behavior was assumed in this experiment.

## 3. New stand and adapter boundary

SRC is at commit `589272df7761f52c34f066a0a68dcbd23a1dd192`. `core/observations.js` normalizes generic observations with source/frame/quality/provider metadata. `core/coordinate-frames.js` validates declared frames and maps using row-major 3×3 homographies; the Origami module consumes four-corner paper boundaries and fold lines and reports automatic detection as unsupported. It is not a general triangle domain adapter.

The Geometry Skill adapter (`src/adapters/schematic-reasoning/observationAdapter.ts`) accepts `point`, `line`, and `segment` observations, requires a geometry-model target frame, requires a direct declared transform when source and target frame IDs differ, and applies them using existing Headless APIs. The test harness used SRC's generic `normalizeObservations()` output, then wrapped it in the adapter's batch envelope and added endpoint observation IDs. This is a small manual bridge; it is not an end-to-end Origami module -> generic triangle -> geometry adapter pipeline.

### Compatibility blocker found

SRC's normalizer sets omitted confidence to `null` (`core/observations.js`). The adapter accepts omitted confidence or a finite number, but rejects `null` (`observationAdapter.ts`, `validateCommonObservation`). Passing otherwise-valid normalized human annotations without confidence produced `INVALID_OBSERVATION` on every observation. For the geometric cases below, the disposable harness supplied `confidence: 1` solely to exercise the path; this fixture value is not evidence of certainty. This mismatch must be fixed or explicitly normalized at the adapter boundary before ordinary SRC output can be passed through unchanged.

## 4. Independent reference values

The reference values were computed independently from coordinates using Euclidean distance and the shoelace/determinant triangle-area formula:

`distance(P,Q) = hypot(Q.x-P.x, Q.y-P.y)`; `area = |(B-A) × (C-A)| / 2`.

They were not derived from `HeadlessGeometrySession` output.

| Case | Coordinates (A, B, C) | Independent lengths | Independent area |
|---|---|---|---:|
| 1. Right triangle | (0,0), (4,0), (0,3) | AB=4, AC=3, BC=5 | 6 |
| 2. General triangle | (0,0), (4,0), (1,3) | AB=4, AC=√10≈3.1622776602, BC=√18≈4.2426406871 | 6 |
| 3. Collinear | (0,0), (2,2), (4,4) | AB=√8≈2.8284271247, AC=√32≈5.6568542495, BC=√8≈2.8284271247 | 0 |
| 4. Coincident A/B | (0,0), (0,0), (0,3) | AB=0, AC=3, BC=3 | 0 |
| 5. Distorted C | (0,0), (4,0), (0,3.2) | AB=4, AC=3.2, BC=√26.24≈5.1224993899 | 6.4 |
| 6. Incomplete | A=(0,0), B=(4,0); no C | AB=4 | Not defined |

## 5. Controlled experiment results

The synthetic observation frame was `drawing-mm` and the target frame was `target-mm`, both explicitly declared in millimetres. An explicit identity homography connected the two frame IDs. SRC normalization emitted point and segment records; the harness attached endpoint IDs and passed them to the adapter. Each case used a fresh blank `HeadlessGeometrySession`. The right-angle result was queried by the existing core verifier, not by the adapter's `applyObservations()` report.

| Case | Transfer / observed geometry | Core checks / comparison | Status and interpretation |
|---|---|---|---|
| 1. Right triangle | Adapter accepted 3 points and 3 segments; IDs `sro_obs_A/B/C`, `seg_1..3`. Core lengths were 4, 3, 5. | `PERPENDICULAR_TO(seg_1, seg_2)` returned `true`, difference 0, threshold `1e-4`; independent values match. | **PASS** for synthetic coordinate transfer and the tested mathematical relation. `applyObservations().report.geometricConsistency` remains `NOT_RUN` until a separate verifier call is reported. |
| 2. General triangle | Adapter accepted 3 points/3 segments. Core lengths were 4, 3.1622776602, 4.2426406871. | `PERPENDICULAR_TO(AB, AC)` returned false, difference 0.3162277660. Independent lengths match. | **PASS** for transfer and expected negative relation control. |
| 3. Collinear points | Adapter accepted all three points and three segments; lengths match independent values. | The external reference area is zero. Core has no generic triangle degeneracy/area assertion, and the tested perpendicular predicate merely returned false. | **BLOCKED** for a core-issued “degenerate triangle” verdict. The adapter/core do not reject this as a triangle because no triangle object or such predicate is present. |
| 4. Coincident points | Adapter preparation succeeded; application rejected with `INVALID_COORDINATE` before creating any object (compact counts remained zero). | Direct Headless API control created distinct point IDs at the same coordinate, connected them, and measured a zero-length segment (`0 MM`). The verifier cannot use a zero-length direction vector for angle relations. | **PASS** for adapter preflight rejection; **FAIL** if the old core is expected to enforce geometric non-degeneracy by itself. Actual core behavior is permissive. |
| 5. C moved from y=3 to y=3.2 | Adapter accepted and transferred all geometry; core lengths were 4, 3.2, 5.1224993899. | The right-angle test still returned true (C remains on the same vertical ray). Lengths and independent area differ from the ideal case. Comparing measured lengths to the independently known reference detects the change; the relation check alone does not. | **PASS** for transfer. **FAIL** for the proposition that a passing right-angle test detects this coordinate distortion. The core correctly checks the supplied geometry; it does not know the expected source drawing. |
| 6. Incomplete observations | Two points and one segment were accepted. Core measured AB=4. | No triangle or area check could be made. Adapter reports input structure `VALID`; this means schema-valid, not semantically complete for a triangle. | **PASS** for partial primitive ingestion; **BLOCKED** for triangle properties/insufficient-data classification. |
| Repeatability | The right-triangle case rerun in a fresh session returned the same IDs and numerical outputs. | JSON result comparison after excluding the fixture label was identical. | **PASS** for this deterministic synthetic run; not a broad determinism or cross-runtime proof. |

### Homography and adapter negative controls

- An analytically known projective mapping `H=[1,0,0; 0,1,0; 0.1,0.2,1]` mapped `(2,3)` to `(2/1.8, 3/1.8)=(1.1111111111, 1.6666666667)`, preserving the declared transform and original coordinates in provenance. **PASS**, temporary harness, no real calibration.
- A scalar multiple `1e-5 * I` is projectively equivalent to identity, but `prepareObservations()` returned `INVALID_TRANSFORM` because the implementation compares the absolute determinant against `1e-12` (`det=1e-15`). **FAIL**, reproduced in a temporary harness. Homography validity is scale-dependent.
- Prepared results are mutable. A negative control changed the second prepared point's x coordinate to `NaN` after preparation. `applyObservations()` returned `TARGET_CORE_REJECTED`, but the first point remained in the session (`sro_obs_a`; count=1). **FAIL**, reproduced. This confirms the partial-application risk for caller-mutated prepared data.
- Static inspection: `reportTargetVerification(applied, verification)` does not check that `verification.subjectId/referenceId` are geometry IDs created by that `applied` batch. A result for other objects can be attached to this batch's `VERIFIED_BY_TARGET_CORE` report. **FAIL**, inferred from code; not executed in this experiment.
- Static inspection: target-frame units are not checked by the adapter, while `HeadlessGeometrySession.measure()` reports `MM`. Use only a target frame whose unit semantics match the core, or add explicit guarding in a later fix. **LIMITATION**, observed in source; this unit mismatch was avoided by using `mm` in these cases.

## 6. Three separate conclusions

### A. Correctness of transfer

**Partially supported on controlled synthetic inputs.** With explicit confidence and an explicit transform, the adapter mapped the listed point/segment coordinates to the expected IDs and frame, and target state measurements matched independent values. However, ordinary SRC-normalized observations with omitted confidence are rejected because SRC supplies `null`. A caller can mutate prepared data after validation, and failed application can leave partial state. The adapter's provenance contains the original observations and applied transform, but its verification helper does not bind a reported verification to the batch's own IDs.

### B. Geometric correctness of the old stand

**Supported for the tested metrics and relation on supplied coordinates.** Existing measurements matched the independent side-length calculations; the perpendicularity verifier accepted the 3-4-5 right angle and rejected the general triangle's non-right angle. The stand does not provide a generic triangle-area or degeneracy checker: collinear points are representable as points/segments and were not classified as a degenerate triangle. Direct core APIs also accept coincident-coordinate points with a zero-length segment, while the adapter rejects the collapsed segment during preflight.

### C. Correctness of image recognition

**NOT TESTED.** No observation in the triangle harness was produced by vision; all coordinates were synthetic and manually supplied. SRC's built-in Origami module is domain-specific: it requires a four-corner paper boundary and fold-line configuration, and its automatic detector is unsupported. The existing SRC local-scan test reads and hashes a real 614×945 PNG, but it consumes prior manually/analytically specified geometry, transforms that model, and explicitly reports pixel alignment as `NOT_VERIFIED`; it is not a recognition test and does not pass through the old geometry adapter.

## 7. Existing test results

Commands were run without source changes or dependency installation:

| Repository | Command | Result |
|---|---|---|
| `ai-geometry-skill-2-checkout` | `npm run test:all` | **PASS, exit 0.** Existing 31 suites plus the adapter suite (32 chained suites); the new adapter suite printed 11 passing checks. |
| `schematic-reasoning-core` | `npm test` | **PASS, exit 0.** Node test runner: 5 test files, 5 pass, 0 fail. The local-real-scan integration test's assertions cover a manually specified model, not pixel detection. |

No build or lint command was run; neither is evidence required for this geometry experiment. No automated image-recognition accuracy test was run.

## 8. Limitations and defects to carry forward

1. `confidence: null` emitted by the SRC normalizer is incompatible with the adapter validator.
2. A valid homography's acceptance depends on arbitrary matrix scale due the absolute determinant threshold.
3. A caller-mutated prepared batch can fail after partially mutating the target session; no transactional rollback is applied.
4. The verification-report helper does not bind checked subject/reference IDs to the applied batch.
5. The old stand verifies geometric relations among accepted coordinates; it cannot establish that the observations match an image. The 3.2 distortion retained a right angle, demonstrating this boundary.
6. The old stand has no general triangle-area/non-collinearity predicate, and its direct API permits zero-length segments between distinct point IDs.
7. The generic triangle-to-Origami pipeline is not a native SRC capability. The successful adapter experiment manually rewrapped generic normalized observations.
8. Frame units need an explicit contract: the adapter permits arbitrary model units, but core measurement records use `MM`.
9. The local real-image test writes an ignored report as a side effect. Its generated JSON matched an older evidence copy byte-for-byte; the original timestamp was restored. The tracked SRC tree remains clean.

## 9. Next step

Repair only the observation adapter on the existing isolated feature branch, without touching `HeadlessGeometrySession`, geometry construction, verifier semantics, SRC, or adding Fiber:

- accept the SRC normalizer's nullable confidence without inventing certainty;
- make application validate an immutable snapshot and atomic on any failure;
- make homography degeneracy/conditioning checks invariant to matrix scaling and add projective cases;
- require verification IDs to belong to the applied batch before reporting a batch-level result;
- define/validate target units against the core's measurement units;
- update documentation and add regression tests for each negative control above.

Then rerun both suites and this same six-case harness. Only after the fixes pass should a commit be considered. The current experiment demonstrates that the old stand can be a useful **mathematical checking contour for selected relations and segment lengths**, but it cannot serve as an image-recognition validator or a generic degenerate-triangle oracle.

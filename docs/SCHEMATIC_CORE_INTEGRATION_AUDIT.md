# Schematic Reasoning Core integration audit

## Repository and baseline

- Target: `a50kv109/-ai-geometry-skill-2`, cloned from `https://github.com/a50kv109/-ai-geometry-skill-2.git`.
- Base commit: `b1d7930f8fe2fae8701981c816b28728d95eb8b4`.
- Work branch: `feat/schematic-observation-integration`.
- Initial checkout was clean and matched `origin/main`; no user changes or ignored files existed at clone time. The original ZIP and prior temporary extraction remain untouched.
- Dependencies were installed from the documented npm workflow with `npm install --no-package-lock --ignore-scripts`; no lockfile was created or modified. `node_modules/` is ignored. The baseline build created ignored `dist/`; existing test commands created ignored research JSONL files. These generated artifacts are being preserved.

## Verified target architecture

- `src/headless/HeadlessGeometrySession.ts` is the external command interface and imports the target's existing `FullGeometryState`, `dispatchGeometryCommand`, construction planners, intersection functions, invariant checks, and verifier. Its point/line creation and `verify()` operations remain the only route the proposed adapter will use to create and check geometry.
- `src/engines/constructionCore.ts` defines the existing state/entities and macro-oriented `GeometryProvenance` (`macroType`, `sourceIds`, `groupId`). It does not have an observation provenance enum. A provider observation must therefore stay in a separate adapter sidecar and must not be mislabeled as a macro construction.
- `src/engines/verifierService.ts`, `HeadlessGeometrySession.verify()`, and the existing target rules own geometric verification. `src/kernel/`/`src/environment/` own their deterministic fact-derivation and environment contracts; no changes there are planned. GIEM remains isolated as mandated by `AGENTS.md`.
- `src/engines/project/projectSerializer.ts` and PGS-2D are existing persistence/interchange mechanisms; no change to their contract is planned.
- The target's model coordinates are centered Euclidean coordinates. `screenToModel`/`modelToScreen` implement canvas scale/rotation/translation only; neither is a document-camera transform.

## Verified reference mechanisms

- `core/observations.js` normalizes externally supplied records with source/frame/quality checks.
- `core/coordinate-frames.js` maps points using explicitly directed transformation metadata; its homography mapping and inverse behavior are tested in `tests/core.test.js`.
- `core/provenance.js` and `core/validation.js` separate observation provenance and input validity from downstream domain checks.
- `providers/host-agent-bridge.js` accepts observations already supplied by a host and does not run vision inference. The reference test suite passes 5/5 at commit `589272df7761f52c34f066a0a68dcbd23a1dd192`.
- Reference geometry and its validators will not be copied into or invoked as the target's authority.

## Baseline results before source edits

All required checks ran against base commit `b1d7930f8fe2fae8701981c816b28728d95eb8b4` after dependencies were available. Sandbox-only attempts initially failed to start `tsx` because Unix IPC was denied (`EPERM`); reruns with IPC permission completed:

| Command | Result | Evidence |
|---|---|---|
| `npm run test:kernel` | PASS, exit 0 | Kernel verification matrix completed; final output reports all 74 autonomous kernel tests passed. |
| `npm run test:env` | PASS, exit 0 | 18/18 environment contract tests passed. |
| `npm run test:all` | PASS, exit 0 | All 31 chained suites completed successfully; detailed log `/tmp/ais2-baseline-test-all.log`. |
| `npm run lint` | PASS, exit 0 | `tsc --noEmit`. |
| `npm run build` | PASS, exit 0 | Vite build completed; existing warnings note Node `fs` externalization and a >500 kB chunk. |

The package declares `bun.lock`, while `CONTRIBUTING.md` and README document `npm install`; `package.json` has no `packageManager`, and no npm lockfile is present. npm was used as documented, without writing a lockfile. Bun is unavailable in this environment.

## Compatibility boundaries

1. Only external observations and their metadata may be new. The target `HeadlessGeometrySession` constructs points and lines and checks relations; the adapter cannot mark the resulting coordinates as visually accurate or mathematically proven by itself.
2. Keep source image/provider/source-observation IDs, declared frame, original coordinates, confidence/uncertainty (only when supplied), and applied transform in a sidecar record because target `GeometryProvenance` means construction lineage.
3. Allow only an explicitly declared direct transform from the observation frame to the named target model frame. No implicit frame mixing or path search. Missing transform, unknown frames, non-finite values, or projective denominator near zero must return structured errors.
4. A projective mapping, if implemented, changes coordinates only. It does not prove image-localization or physical-measurement accuracy.
5. Preserve `VERIFIED` semantics. Report input structure and target-core geometry results separately from localization and physical scale, which remain not evaluated.
6. Manual and analytic code paths remain usable without importing the adapter.

## Implemented minimal changes

- `src/adapters/schematic-reasoning/observationAdapter.ts`: versioned typed observation envelope, strict validation, explicit one-step frame mapping, target-core application, provenance sidecar, and separated evidence statuses. No construction formula or provider registry was introduced.
- `src/adapters/schematic-reasoning/observationAdapter.test.ts`: 11 deterministic checks cover valid and malformed records, coordinate mapping, endpoint mismatch/no silent repair, source/provenance preservation, target-core verification and evidence boundaries.
- `examples/schematic-observation/index.ts`: runnable synthetic end-to-end example creates geometry through the existing `HeadlessGeometrySession` and asks its verifier to check perpendicularity. It does not inspect a real image.
- `package.json`: adds dedicated test and example scripts; adds the adapter suite to `test:all`.
- `README.md`: documents the optional adapter and its evidence limits.

## Final verification after changes

| Command | Result | Evidence |
|---|---|---|
| `npm run lint` | PASS, exit 0 | TypeScript `tsc --noEmit`; run after adapter and docs changes. |
| `npm run test:schematic-observation` | PASS, exit 0 | 11/11 focused adapter checks passed. |
| `npm run example:schematic-observation` | PASS, exit 0 | Synthetic points/lines were applied; target core verified perpendicularity; image localization and physical accuracy were both `NOT_EVALUATED`. |
| `npm run test:all` | PASS, exit 0 | All 31 existing suites and new adapter suite passed (32 chained suites). |
| `npm run build` | PASS, exit 0 | Production build completed. Existing warnings remain: Node `fs` externalized for browser compatibility and a 902.81 kB minified JS chunk exceeds 500 kB. |
| `git diff --check` | PASS, exit 0 | No whitespace errors. Core/headless/kernel/environment paths were not modified. |

## Deferred work and risks

- No live image model/provider, OCR, line detector, source-byte/hash store (the adapter accepts an optional caller-supplied SHA-256 but cannot verify bytes), or pixel-localization benchmark.
- No perspective-calibration UI, transform chains, nonlinear distortion, camera calibration, physical scale, uncertainty propagation, or CAD interpretation.
- Do not alter `GeometryProvenance`, canonical kernel paths, GIEM, project persistence, PGS-2D, or existing epistemic status transitions.
- Existing exact `HeadlessGeometrySession` creation and verification boundaries need to be respected in integration tests; free points/segments may not carry source observations inside target state, hence the sidecar is mandatory.

## Recommendation

Proceed with the adapter-only change on this isolated branch. Any input that cannot be safely mapped to the supported target model must remain outside `FullGeometryState` and return an actionable rejection. Implementation begins only after this audit and baseline are recorded.

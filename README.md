# AI Geometry Skill v1.0.0

> **System Version**: `v1.0.0`  
> **Status**: `FROZEN RESEARCH TOOL`  
> **Semantic Contract**: `v0.4`  
> **GSA Protocol**: `v0.1.0`  
> **PGS-2D Specification**: `v1.0`  
> **Core Principle**: `REASON OUTSIDE. VERIFY INSIDE.`

---

> **Canonical System Definition:**  
> **«AI Geometry Skill v1.0.0 is a deterministic, headless geometry verification and research instrument for external AI agents, with an explicit capability boundary and zero-trust inter-agent exchange.»**

*«The agent may be wrong. The stand must not be.»*

---

## 1. What is AI Geometry Skill?

The **AI Geometry Skill** provides external reasoning models (LLMs, AI coding agents, autonomous theorem provers) with a formal, deterministic, headless 2D Euclidean geometry sandbox. 

Instead of forcing language models to hallucinate floating-point arithmetic or guess spatial relationships, the Skill acts as an external **epistemic anchor**: the AI reasons about theorems, proof strategies, and hypotheses on the outside, while delegating Euclidean constructions, measurements, and predicate evaluations to a pure, deterministic kernel on the inside.

---

## 2. Run in 60 Seconds

The fastest path for an external AI agent to use the Skill programmatically:

```bash
# 1. Install dependencies
npm install

# 2. Run the canonical standalone verification example
npx tsx examples/basic-verification/index.ts
```

### Canonical TypeScript Usage:
```typescript
import { HeadlessGeometrySession } from './src/headless/HeadlessGeometrySession';

// 1. Initialize headless session
const session = new HeadlessGeometrySession({ profile: 'blank' });

// 2. Construct points and segments
session.create_point(0, 0, { id: 'P_A' });
session.create_point(4, 0, { id: 'P_B' });
session.create_point(0, 3, { id: 'P_C' });
const sAB = session.connect('P_A', 'P_B', 'SEGMENT').created[0].id;
const sAC = session.connect('P_A', 'P_C', 'SEGMENT').created[0].id;

// 3. Verify relations deterministically (fixed tolerance eps = 1e-4)
const result = session.verify(sAC, 'PERPENDICULAR_TO', sAB);
console.log(result.verified); // true (diff: 0, threshold: 0.0001)
```

---

## 3. Canonical Runtime Entry Point

For external AI agents, the **sole canonical runtime entry point** is:

```typescript
import { HeadlessGeometrySession } from './src/headless/HeadlessGeometrySession';
```

- **Headless First**: The Skill is a 100% headless mathematical instrument. The graphical UI is **not required** to execute constructions, measurements, or verifications.
- **Legacy API Notice**: `GeometryEnvironment` (`src/environment/GeometryEnvironment.ts`) is a **`LEGACY / HISTORICAL API`** preserved strictly for test contract compatibility and historical lineage. External AI agents should **always use `HeadlessGeometrySession`**.

---

## 4. System Architecture: Four Distinct Layers

The codebase is organized into four strictly decoupled layers:

```
AI Geometry Skill
        │
        ├── 1. Headless Runtime (src/headless/HeadlessGeometrySession.ts)
        │      └── Canonical entry point for external AI agents (Actions, Measurements, Verifications, GSA)
        │
        ├── 2. Geometry Core & Kernel (src/kernel/, src/engines/)
        │      └── Pure SSOT: FullGeometryState, analytical solvers, DAG recomputer, fixed eps = 1e-4 verifier
        │
        ├── 3. UI / Human Interface (src/components/, src/App.tsx)
        │      └── OPTIONAL visual client. The UI is a consumer, NEVER a prerequisite for Skill execution.
        │
        └── 4. Historical & Archive (docs/archive/, GeometryEnvironment)
               └── Project lineage and predecessor development materials preserved for provenance.
```

---

## 5. Start Here (Recommended Reading Order for AI Agents)

To integrate or use the Skill without trial and error, follow this canonical reading order:

1. **[`README.md`](./README.md)** — High-level overview, quick start, and system boundaries.
2. **[`docs/AI_GEOMETRY_SKILL_PASSPORT.md`](./docs/AI_GEOMETRY_SKILL_PASSPORT.md)** — Immutable formal specification of capabilities, predicates, and policies.
3. **[`docs/SKILL_CONTRACT.md`](./docs/SKILL_CONTRACT.md)** — Authoritative semantic action and verification contract.
4. **[`docs/CAPABILITY_MODEL.md`](./docs/CAPABILITY_MODEL.md)** — Explicit supported capabilities and declared capability gaps.
5. **[`examples/basic-verification/index.ts`](./examples/basic-verification/index.ts)** — Runnable minimal demonstration.
6. **[`src/headless/HeadlessGeometrySession.ts`](./src/headless/HeadlessGeometrySession.ts)** — Canonical runtime class implementation.
7. **[`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)** — Exact semantics of intersections, rootIndex, and non-assumptions.
8. **[`docs/GSA_SPECIFICATION.md`](./docs/GSA_SPECIFICATION.md)** — Zero-Trust artifact format and inter-agent exchange rules.
9. **[`docs/AGENT_GUIDANCE_DRA.md`](./docs/AGENT_GUIDANCE_DRA.md)** — Epistemic reasoning pattern (DRA: Recognize $\to$ Decide $\to$ Verify $\to$ Separate $\to$ Update).

---

## 6. Who is it for?

1. **AI Reasoning Agents**: Autonomous models exploring Euclidean proofs, seeking counterexamples, or discovering geometric invariants.
2. **Multi-Agent Systems**: Collaborating agents exchanging verified geometric theorems via self-describing GSA artifacts under a strict Zero-Trust protocol.
3. **Researchers & Automated Benches**: Systems requiring formal, deterministic verification of planimetric configurations without heavy interactive UI dependencies.

---

## 7. What problem does it solve?

- **LLM Hallucinations in Geometry**: Language models frequently guess angles, miscalculate Pythagorean triples, and hallucinate chord tangencies. The Skill evaluates relations analytically using IEEE 754 precision and fixed receiver-owned tolerances ($\varepsilon = 10^{-4}$).
- **Conflation of Fact and Narrative**: Conventional agent tool-calling often blurs the boundary between what the tool proved and what the model assumed. The Skill enforces a strict three-tier epistemic boundary:
  $$\text{TOOL-VERIFIED FACT} \neq \text{AGENT INTERPRETATION} \neq \text{AGENT HYPOTHESIS}$$
- **Untrusted Inter-Agent Claims**: In multi-agent pipelines, Agent A claiming a theorem does not make it true for Agent B. The Skill implements Zero-Trust exchange: $\text{Producer Claim} \neq \text{Receiver Truth}$.

---

## 8. What it CAN do (Supported Capabilities)

- **Primitives**: 2D analytical points, finite line segments, infinite lines, Euclidean circles.
- **Analytical Constructions**: Perpendicular lines, parallel lines, angle bisectors, perpendicular bisectors.
- **Exact Intersections**: Analytical solutions for Line $\times$ Line, Line $\times$ Circle, Segment $\times$ Segment.
- **Root Preservation**: Returns all analytical roots explicitly (`rootIndex: 0, 1`) along the directed line vector.
- **Metric Measurements**: Segment lengths, radii, and point-to-point Euclidean distances.
- **Strict Predicate Verification**: `PERPENDICULAR_TO`, `PARALLEL_TO`, `EQUAL_LENGTH`, `POINT_ON_CIRCLE` (tolerance $\varepsilon = 10^{-4}$).
- **Kinematics & Dynamic Geometry**: Moving free vertices (`move()`) dynamically cascades dependent macro constructions.
- **Scratchpads & Rollbacks**: `fork()` and `rollback()` create 100% isolated sandboxes for speculative exploration.
- **GSA / PGS-2D Packaging**: Export and import self-describing solution envelopes with independent Zero-Trust verification.
- **Canonical Coordinates & Addressing Layers**: Explicit transformations between Layer A (circular polar angle $\theta$), Layer B (1D boundary perimeter metric $s \in [0, P)$), and Layer C (Cartesian $(x, y)$), with deterministic sorting (`worldCanonicalOrdering`).
- **Runtime VerifierService (`src/engines/verifierService.ts`)**: Independent pre-execution plan validation (`validatePlan`) and post-execution geometric verification (`verifyGeometry`) ensuring strict mathematical compliance of perpendicular bisector macro constructions (perpendicularity, midpoint passage, equidistance).
- **Deterministic Reasoning Anchor (DRA)**: Structured reasoning discipline for AI agents (`docs/AGENT_GUIDANCE_DRA.md`) operationalizing `REASON OUTSIDE. VERIFY INSIDE.`

---

## 9. What it CANNOT do (Explicit Capability Boundaries)

The Skill is **not an omniscient automated theorem solver** and explicitly documents the following boundaries:

- **NO 3D Stereometry**: Strictly limited to 2D Euclidean planimetry ($\mathbb{R}^2$). Spatial polyhedra and 3D cross-sections are out of scope (`CAPABILITY GAP`).
- **NO Arbitrary Angle Measurement**: Verifies orthogonality ($90^\circ$) and parallelism ($0^\circ / 180^\circ$); does not measure arbitrary angles (`ANGLE_VALUE` is a `CAPABILITY GAP`).
- **NO Conflation of Polar Angles with Vertex Angles**: Polar coordinate angles $\theta \in [0, 360^\circ)$ are extrinsic circular addresses and cannot be substituted for internal polygon angles $\angle V$ (`GUARD-CANON-01`).
- **NO Compound Polygon Primitive**: Pentagons, trapezoids, etc., exist only as collections of segments (`POLYGON` is a `CAPABILITY GAP`).
- **NO Global Solution Branch Tree (`BranchTree`)**: `rootIndex` is a local parametric order ($t_0 < t_1$) along a directed line vector; reversing vector direction swaps root indices. It does not represent a persistent topological branch identity.
- **NO Automatic Intersection Recomputation**: Points created from `intersect()` are static materialized operation snapshots (`Materialized Snapshot != Live Relational Entity`). When parent lines move, intersected points do not automatically follow.
- **NO Bit-Identical Artifact Hashes**: `artifactId` uses `Date.now()`, causing timestamp variation in the GSA envelope even when the PGS-2D geometry payload is bit-deterministic.

---

## 10. GSA / PGS-2D & Zero-Trust Verification

- **GSA v0.1 (Geometric Solution Artifact)**: A self-describing JSON container encapsulating resolver metadata, PGS-2D geometry payload, and certified claims.
- **Zero-Trust Rule**:
  $$\text{Producer Claim} \neq \text{Receiver Truth}$$
- **Independent Verification**: When Agent B receives an artifact from Agent A, Agent B mounts the geometry into a clean session and evaluates all claims against its own local Stand kernel. Any discrepancy results in status `'MISMATCH'` and state rollback.
- **Identifier Compatibility Note**: For GSA/PGS interoperability, external agents should prefer sufficiently unique or prefixed object identifiers (e.g. `"P_A"`, `"P_B"`, `"P_C"`, `"seg_AB"`) rather than very generic literal identifiers such as `"A"`, `"B"`, `"C"`, because legacy/project-state namespace handling may produce collisions in some import/export pathways.

*Reference*: See [docs/GSA_SPECIFICATION.md](./docs/GSA_SPECIFICATION.md).

---

## 11. Public API Quick Reference (`HeadlessGeometrySession`)

> **Notice**: `HeadlessGeometrySession` is the **sole canonical external API**. The historical `GeometryEnvironment` is retained solely for legacy test suite contracts.

| Action / Capability | Public Method | Return Type | Description |
|:---|:---|:---:|:---|
| **Create Point** | `create_point(x, y, options?)` | `CompactActionResponse` | Adds an analytical point $(x, y)$ |
| **Connect** | `connect(p1, p2, type)` | `CompactActionResponse` | Constructs a `SEGMENT` or infinite `LINE` |
| **Create Circle** | `create_circle(center, radius)` | `CompactActionResponse` | Constructs a circle $C(O, R)$ |
| **Construct Macro** | `construct(type, params)` | `CompactActionResponse` | Executes deterministic macros: `PERPENDICULAR`, `PARALLEL`, `ANGLE_BISECTOR`, `PERPENDICULAR_BISECTOR` |
| **Intersect** | `intersect(id1, id2)` | `CompactActionResponse` | Returns array of analytical root points (snapshot) |
| **Move** | `move(pointId, x, y)` | `CompactActionResponse` | Displaces free vertex; cascades dependent macro geometry |
| **Observe** | `observe(mode, targetId?)` | `ObservationResult` | Modes: `COMPACT`, `FULL`, `OBJECT`, `PROVENANCE`, `RELATIONS`, `CONSTRAINTS`, `KNOWLEDGE` |
| **Measure** | `measure(id, type?)` | `MeasureResult` | Returns exact metric length or radius |
| **Verify** | `verify(sub, rel, ref)` | `VerificationResult` | Fixed tolerance verification ($\varepsilon = 10^{-4}$) |
| **Fork / Rollback** | `fork()`, `rollback(id)` | `string` / `boolean` | Isolated exploratory scratchpads |
| **Export GSA** | `exportSolutionArtifact()` | `GSASolutionArtifact` | Exports solution container |
| **Import GSA** | `importSolutionArtifact(gsa)` | `GSAImportReport` | Zero-Trust import and local verification |

---

## 12. What an External Agent Must Not Assume

1. **Do not assume `GeometryEnvironment` is the canonical API**: Use `HeadlessGeometrySession`.
2. **Do not assume the UI is required**: The Skill is 100% headless and does not require launching a browser or React app.
3. **Do not assume intersection points are live constraints**: `intersect()` returns materialized snapshots; they do not auto-recompute when parent entities move.
4. **Do not assume `rootIndex` is a permanent branch identity**: It is a local parametric result order ($t_0 < t_1$) along a directed vector.
5. **Do not assume GSA claims are automatically trusted**: The receiver must independently verify all claims locally under the Zero-Trust protocol.
6. **Do not assume capability gaps will be approximated**: The Skill returns a strict failure or `CAPABILITY GAP` and will never fabricate unsupported geometric results.
7. **Do not assume historical Stand documents define the current contract**: Canonical Skill behavior is defined by `docs/SKILL_CONTRACT.md`, `docs/AI_GEOMETRY_SKILL_PASSPORT.md`, and `HeadlessGeometrySession`.

---

## 13. Local Setup, Testing & Verification

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Reproducible Workflow

```bash
# 1. Install dependencies
npm install

# 2. Run the complete test suite (31/31 test suites)
npm run test:all

# 3. Run individual focused test suites
npm run test:kernel                 # Autonomous kernel tests (74 tests)
npm run test:env                    # Verification Stand contract tests (18 tests)
npm run test:contract-guards        # Headless contract guards (9 suites, 48 checks)
npm run test:canonical              # Canonical coordinates math (6 suites, 29 checks)
npm run test:canonical-integration  # End-to-end canonical integration (5 steps, 17 checks)
npm run test:spectral               # Experimental spectral analysis suite

# 4. Run TypeScript typecheck (0 errors)
npm run lint

# 5. Compile production build
npm run build

# 6. Run the minimal standalone example
npx tsx examples/basic-verification/index.ts
```

### Confirmed Audit Baseline
- **Autonomous Kernel Tests (`npm run test:kernel`)**: 74 / 74 PASS (100%)
- **Environment Contract Tests (`npm run test:env`)**: 18 / 18 PASS (100%)
- **Contract Guards Tests (`npm run test:contract-guards`)**: 9 / 9 suites PASS (48 assertions, 100%)
- **Canonical Coordinates Tests (`npm run test:canonical`)**: 6 / 6 suites PASS (29 assertions, 100%)
- **Canonical Integration Tests (`npm run test:canonical-integration`)**: 5 / 5 steps PASS (17 assertions, 100%)
- **Experimental Spectral Tests (`npm run test:spectral`)**: PASS (100%)
- **Total Test Suites Chained in `test:all`**: **31 / 31 PASS (100%)**
- **Typecheck (`tsc --noEmit`)**: **0 errors**
- **Production Build**: **Vite build clean (0 errors)**

---

## 13.1. Experimental Spectral Geometry Module (TSL-01 – TSL-08)

The skill includes an experimental spectral analysis module under `src/experimental/spectral/` (`FourierV2.ts`), providing complex Discrete Fourier Transform analysis, harmonic contour passport calculation, and reconstruction error bounding for 2D geometric shapes.

- **Run standalone spectral tests**:
  ```bash
  npm run test:spectral
  ```
- **CLI Research Utility**:
  ```bash
  npx tsx src/experimental/spectral/cli_research.ts <input_json_path>
  ```
- **Documentation**: See [`docs/spectral_passport_integration.md`](./docs/spectral_passport_integration.md) and [`docs/spectral_passport_schema.md`](./docs/spectral_passport_schema.md).

---

## 13.2. Geometric Invariant Evaluation Module (GIEM v0.1)

The **Geometric Invariant Evaluation Module (GIEM v0.1)** provides high-assurance, deterministic algebraic generation and coordinate-level invariant verification routines under strict mathematical isolation.

### Purpose & Supported Contracts:
- **Contract C1 (`PythagoreanTripleGenerator`)**: Exact integer generation and verification of primitive Pythagorean triples using arbitrary-precision `BigInt` arithmetic (Euclid's formula $m^2 - n^2, 2mn, m^2 + n^2$).
- **Contract C2 / C2.1 (`RightTriangleCircumcenter`)**: Thales' circumcenter calculation and zero-trust equidistance auditing under a hardened mixed absolute/relative numerical tolerance policy ($\varepsilon_{\text{abs}} = 10^{-7}, \varepsilon_{\text{rel}} = 10^{-6}$).
- **Contract C3 (`TriangleAreaInvariant`)**: Geometric area ratio invariant verification ($A_{\text{rectangle}} / A_{\text{triangle}} = 1/2$) dual-pathed against independent coordinate-level Gauss Shoelace polygon area calculations.

### Source Directory & Documentation:
- **Source Path**: `src/engines/giem/`
- **Specification & Audit Report**: [`docs/GIEM_V01_SPECIFICATION.md`](./docs/GIEM_V01_SPECIFICATION.md) (Status: `ACCEPTED_WITH_GAPS`, Audited Commit: `daf5a9b7d3d70c69f0f9793abcd7c760c8e1067f`).

### Epistemic Isolation Notice:
- **Level C Isolation**: GIEM is intentionally **not** integrated into `HeadlessGeometrySession` or runtime sessions, has no public barrel (`index.ts`) export, and does not alter `package.json`.
- **Import Policy**: External experimental scripts import modules via explicit file paths (e.g. `import { TriangleAreaInvariant } from '@/src/engines/giem/invariants/TriangleAreaInvariant'`).
- **Test Invocations**: Excluded from `npm run test:all` to keep canonical regression clean. Run directly via `npx tsx`:
  ```bash
  npx tsx src/engines/giem/tests/giem_staged.test.ts    # Contract C1 (11/11 PASS)
  npx tsx src/engines/giem/tests/circumcenter.test.ts   # Contract C2 (7/7 PASS)
  npx tsx src/engines/giem/tests/areaRatio.test.ts      # Contract C3 (28/28 PASS)
  ```

---

## 14. Documentation Map

All documentation is located in the [`docs/`](./docs/) directory using relative Markdown links:

- [`docs/AI_GEOMETRY_SKILL.md`](./docs/AI_GEOMETRY_SKILL.md) — Canonical navigational entry point.
- [`docs/AI_GEOMETRY_SKILL_PASSPORT.md`](./docs/AI_GEOMETRY_SKILL_PASSPORT.md) — Immutable Skill Passport v0.1 (identity, capabilities, boundaries, policies).
- [`docs/SKILL_CONTRACT.md`](./docs/SKILL_CONTRACT.md) — Semantic Contract v0.4 specifications.
- [`docs/CAPABILITY_MODEL.md`](./docs/CAPABILITY_MODEL.md) — Supported vs unsupported capabilities.
- [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md) — Unified capability gap register and non-assumptions.
- [`docs/AGENT_GUIDANCE_DRA.md`](./docs/AGENT_GUIDANCE_DRA.md) — Recommended agent reasoning pattern (DRA: Recognize $\to$ Decide $\to$ Verify $\to$ Separate $\to$ Update).
- [`docs/CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md`](./docs/CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md) — Normative Standard: Extrinsic Coordinates, Perimeter Parameterization, and Intrinsic Invariants.
- [`docs/verification/AI_GEOMETRY_SKILL_V1_0_0_FINAL_AUDIT.md`](./docs/verification/AI_GEOMETRY_SKILL_V1_0_0_FINAL_AUDIT.md) — Authoritative verification audit report.
- [`docs/GSA_SPECIFICATION.md`](./docs/GSA_SPECIFICATION.md) — GSA envelope and Zero-Trust verification.
- [`docs/PROVENANCE_EPISTEMIC_MODEL.md`](./docs/PROVENANCE_EPISTEMIC_MODEL.md) — Epistemic truth tiers and lineage.
- [`docs/GEOMETRY_RESEARCH_METHODOLOGY.md`](./docs/GEOMETRY_RESEARCH_METHODOLOGY.md) — Autonomous experimental protocol.
- [`docs/PATTERN_LIBRARY.md`](./docs/PATTERN_LIBRARY.md) — Audited Geometric Reasoning Pattern Palette.
- [`docs/spectral_passport_integration.md`](./docs/spectral_passport_integration.md) — Experimental Spectral Analysis and FourierV2 Integration (TSL-01 – TSL-08).
- [`docs/spectral_passport_schema.md`](./docs/spectral_passport_schema.md) — Spectral Passport Schema Hierarchy.
- [`docs/REASONING_GUIDANCE_PATTERNS.md`](./docs/REASONING_GUIDANCE_PATTERNS.md) — Catalog of Agent Reasoning Guidance Patterns.
- [`docs/GIEM_V01_SPECIFICATION.md`](./docs/GIEM_V01_SPECIFICATION.md) — Geometric Invariant Evaluation Module (GIEM v0.1) Specification, Contracts (C1–C3), Numerical Policy, and External Audit Report.

---

## 15. Project Lineage

AI Geometry Skill was developed from the Geometry Reasoning Stand research architecture and extracted as a standalone agent-facing instrument. Historical developmental materials, evolution notes, and earlier milestone documents are preserved in [`docs/archive/`](./docs/archive/) for academic reproducibility and lineage tracing. This terminology originates from the predecessor Geometry Reasoning Stand architecture and is retained for lineage/reference purposes; it is not required for basic headless Skill usage.

---

## 16. License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

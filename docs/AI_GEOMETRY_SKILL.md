# AI Geometry Skill (v1.0.0)
## Canonical Navigational Entry Point

> **System Version**: `v1.0.0`  
> **Status**: `FROZEN RESEARCH TOOL`  
> **Semantic Contract Version**: `v0.4`  
> **GSA Protocol Version**: `v0.1.0`  
> **PGS-2D Specification**: `v1.0`  
> **Core Principle**: `REASON OUTSIDE. VERIFY INSIDE.`

---

## 1. Purpose & Identity

The **AI Geometry Skill** is a deterministic, headless geometric verification and research instrument designed for external AI reasoning agents. It provides a formal analytical sandbox where external models can construct Euclidean geometry, observe topological and metric states, test derivation hypotheses, and exchange verified solutions under a zero-trust model.

*«The agent may be wrong. The stand must not be.»*

---

## 2. Architectural Blueprint & Four-Layer System

The architecture strictly decouples external epistemic reasoning from internal analytical truth across four distinct layers:

1. **Headless Runtime (`src/headless/HeadlessGeometrySession.ts`)**: The **canonical runtime entry point** for all external AI reasoning agents.
2. **Geometry Core & Kernel (`src/kernel/`, `src/engines/`)**: Pure, authoritative single source of truth (`FullGeometryState`), analytical solvers, and receiver-owned verification.
3. **UI / Presentation Layer (`src/components/`, `src/App.tsx`)**: An **optional** visual client. The UI is a consumer, not a prerequisite for using the Skill.
4. **Historical & Archive (`docs/archive/`, `GeometryEnvironment`)**: Preserved predecessor development materials and legacy environment API.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AI REASONING AGENT                               │
│        (Reasoning, Hypothesis Formation, Proof Strategy, DRA Guidance)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ calls Canonical Headless API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HEADLESS GEOMETRY SKILL FACADE                        │
│                         (HeadlessGeometrySession)                           │
│   ├── Actions: create_point, connect, create_circle, construct, intersect   │
│   ├── Kinematics: move, erase, reset, fork, rollback                        │
│   ├── Observations: observe(COMPACT | FULL | OBJECT | PROVENANCE)           │
│   ├── Measurements: measure(SEGMENT_LENGTH)                                 │
│   └── Verification: verify(PERPENDICULAR_TO, PARALLEL_TO, EQUAL_LENGTH...)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ executes on SSOT
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     GEOMETRY CORE & KERNEL (Pure SSOT)                      │
│   ├── FullGeometryState (Authoritative State)                               │
│   ├── Analytical Solvers (geometryIntersections.ts: line, circle, segment)  │
│   ├── Macro Reducer (constructionCore.ts: perpendicular, bisectors)         │
│   └── Strict Verification Engine (Fixed receiver tolerance: eps = 1e-4)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ exportSolutionArtifact()
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GSA v0.1 INTER-AGENT EXCHANGE ENVELOPE                   │
│   ├── Metadata & Canonical Resolver Reference (GitHub Stand Repository)     │
│   ├── PGS-2D Geometric Payload (Analytical objects, roles, coordinates)     │
│   └── Certified Claims & Measurements (Subject to Local Zero-Trust Check)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **API Disambiguation**: `HeadlessGeometrySession` is the **sole canonical external API**. The historical `GeometryEnvironment` (`src/environment/GeometryEnvironment.ts`) is a **`LEGACY / HISTORICAL API`** maintained solely for baseline contract test suites.

---

## 3. Public API & Verification Contract

- **Authoritative State**: `FullGeometryState` is the sole source of geometric truth.
- **Fixed Receiver Tolerance**: All predicate verifications enforce $\varepsilon = 10^{-4}$ owned by the stand; external agents cannot loosen verification thresholds.
- **Deterministic Compute**: Analytical intersection solvers and root ordering $P(t_0) < P(t_1)$ along the directed line vector are 100% deterministic.
- **Multiple Roots Preservation**: Equations returning multiple roots (e.g. secants) return all roots explicitly (`rootIndex: 0, 1`). No silent pruning.
- **State Inviolability**: Input validation errors ($NaN$, $\pm\infty$, missing IDs) reject commands before execution, leaving state 100% unmutated.

*Reference*: See [docs/SKILL_CONTRACT.md](./SKILL_CONTRACT.md) and [docs/VERIFICATION.md](./VERIFICATION.md).

---

## 4. Agent Guidance & Deterministic Reasoning Anchor (DRA)

The skill explicitly guides agents on *when* and *how* to use the tool without becoming an executable runtime solver:

1. **RECOGNIZE**: Identify formalizable geometric relations in the problem.
2. **DECIDE**: Assess if external deterministic verification materially strengthens reasoning. Conscious refusal (`DRA = NO`) is valid.
3. **VERIFY**: Project the minimal geometric fragment into the Stand.
4. **SEPARATE**: Strictly divide `TOOL-VERIFIED FACT` $\neq$ `AGENT INTERPRETATION` $\neq$ `AGENT HYPOTHESIS`.
5. **UPDATE**: Ground subsequent proof steps upon the verified anchor.

*Reference*: See [docs/AGENT_GUIDANCE_DRA.md](./AGENT_GUIDANCE_DRA.md).

---

## 5. Geometric Solution Artifact (GSA) & Zero Trust Transfer

- **Envelope**: Self-describing JSON artifact combining resolver metadata, PGS-2D payload, and certified claims.
- **Zero Trust Rule**: $\text{Producer Claim} \neq \text{Receiver Truth}$. Receiving agents reconstruct geometry into an isolated blank session and independently re-evaluate all certified claims against their local kernel.
- **Mismatch Rollback**: Any claim failure results in `status: 'MISMATCH'` and complete state rollback.
- **Identifier Compatibility Warning**: When constructing geometry for GSA export, prefer prefixed identifiers (e.g. `"P_A"`, `"P_B"`, `"P_C"`) instead of generic `"A"`, `"B"`, `"C"` to avoid collisions with legacy stand projection defaults.

*Reference*: See [docs/GSA_SPECIFICATION.md](./GSA_SPECIFICATION.md).

---

## 6. Known Limitations & Capability Gaps

The following boundaries are documented as non-blocking capability gaps for v1.0.0:

1. **Solution Branch Identity**: `rootIndex` is a local parametric order ($t_0 < t_1$) along the directed line vector; reversing vector direction swaps root indices. It is not a globally stable topological branch ID.
2. **Materialized Intersection Snapshots**: Points created via `intersect()` are static snapshots in `state.points` (`Materialized Snapshot != Live Relational Entity`). When parent lines move, intersected points do not automatically follow.
3. **Artifact Determinism**: `artifactId` uses `Date.now()` timestamping, causing varying envelope hashes for identical geometric states.
4. **Epistemic VANISHED State**: The internal transition `VERIFIED ➔ VANISHED ➔ VERIFIED` is maintained in the internal knowledge graph, but is `NOT REPRESENTABLE` via the public boolean `verify()` method.
5. **Angular Predicates**: Only orthogonal/parallel predicates are supported; arbitrary angle measurement (`ANGLE_VALUE`) is unsupported (`CAPABILITY GAP`).
6. **3D Stereometry**: Strictly limited to 2D Euclidean planimetry ($\mathbb{R}^2$). 3D solid geometry is out of scope (`CAPABILITY GAP`).

*Reference*: See [docs/KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) and [docs/CAPABILITY_MODEL.md](./CAPABILITY_MODEL.md).

---

## 7. Canonical Document Map

| Document | Purpose |
|:---|:---|
| [AI_GEOMETRY_SKILL.md](./AI_GEOMETRY_SKILL.md) | **This document**: Unified entry point and release map |
| [AI_GEOMETRY_SKILL_PASSPORT.md](./AI_GEOMETRY_SKILL_PASSPORT.md) | Immutable Skill Passport v0.1 (identity, capabilities, boundaries, policy) |
| [SKILL_CONTRACT.md](./SKILL_CONTRACT.md) | Authoritative Semantic Action and Verification Contract |
| [CAPABILITY_MODEL.md](./CAPABILITY_MODEL.md) | Supported vs unsupported capabilities (Capability Gaps) |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Unified capability gap register and What Not To Assume |
| [AGENT_GUIDANCE_DRA.md](./AGENT_GUIDANCE_DRA.md) | Recommended agent reasoning pattern (DRA) |
| [GSA_SPECIFICATION.md](./GSA_SPECIFICATION.md) | GSA envelope and Zero-Trust verification protocol |
| [PROVENANCE_EPISTEMIC_MODEL.md](./PROVENANCE_EPISTEMIC_MODEL.md) | Epistemic truth tiers and provenance lineage |
| [GEOMETRY_RESEARCH_METHODOLOGY.md](./GEOMETRY_RESEARCH_METHODOLOGY.md) | Autonomous experimental protocol |
| [PATTERN_LIBRARY.md](./PATTERN_LIBRARY.md) | Audited Geometric Reasoning Pattern Palette (GRPP) |

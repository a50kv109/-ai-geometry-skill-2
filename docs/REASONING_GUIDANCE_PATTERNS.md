# Reasoning Guidance Patterns for AI Agents (REASONING_GUIDANCE_PATTERNS.md)

> **Document Version**: `v1.0.0-conceptual`  
> **Status**: `NORMATIVE GUIDANCE & REASONING CATALOG`  
> **Scope**: External Agent Epistemic Architecture (Non-executable guidance layer over Stand Core v1.0.0)  
> **Related Documents**:  
> - [`docs/AGENT_GUIDANCE_DRA.md`](./AGENT_GUIDANCE_DRA.md) — The Core Deterministic Reasoning Anchor Specification  
> - [`docs/SKILL_CONTRACT.md`](./SKILL_CONTRACT.md) — Public HeadlessGeometrySession API v1.0.0  
> - [`docs/PATTERN_LIBRARY.md`](./PATTERN_LIBRARY.md) — Audited Geometric Reasoning Pattern Palette (GRPP)  
> - [`docs/CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md`](./CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md) — Three Coordinate Tiers  

---

## 1. Executive Vision: "Skill as Capability + Guidance"

A domain skill for autonomous AI agents must not be merely a library of callable function signatures. If an agent only sees function prototypes (`create_point`, `measure`, `verify`), it frequently commits two opposite failure modes:
1. **Tool Blindness**: The agent attempts to solve complex, error-prone numeric and metric systems entirely through internal token hallucination without realizing an exact verification instrument is available.
2. **Tool Spam / Calculator Conflation**: The agent mindlessly calls APIs for every trivial utterance, passing raw outputs directly into user answers without understanding what the tool actually established.

**The Solution**: A multi-tiered guidance catalog explaining **WHEN**, **WHY**, and **HOW** an agent should decide to externalize reasoning.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: GUIDANCE PATTERNS (Meta-Reasoning Layer)                            │
│ • How the agent recognizes, decides, isolates, and verifies external steps  │
│ • Catalog: DRA, STRUCTURE_RECOGNITION, STRATEGY_SELECTION, CONSCIOUS_REFUSAL│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Guides strategy selection
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: GEOMETRIC REASONING STRATEGIES (Domain Methodology)                 │
│ • Catalog of mathematical proving tactics and construction heuristics       │
│ • Auxiliary line construction, similar triangles, coordinate methods, etc.  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Translates to formal calls
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: DETERMINISTIC STAND & KERNEL (Epistemic Instrument)                 │
│ • HeadlessGeometrySession v1.0.0, ConstructionCore, Canonical Coordinates   │
│ • Deterministic execution, state inviolability, receiver tolerance ε=10⁻⁴   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Catalog of Reasoning Guidance Patterns

Each pattern conforms to a uniform schema:
- **Core Question**: The epistemic problem the agent is solving.
- **Trigger Indicators**: Conditions signaling when to consider this pattern.
- **Refusal Conditions**: When the agent must deliberately say "NO" to this pattern.
- **Expected Outcome**: What artifact or mental update is produced.
- **Stand Interaction**: How the pattern connects to the deterministic kernel.
- **Epistemic Division**: How truth boundaries are maintained.

---

### Pattern 1: `DRA` (Deterministic Reasoning Anchor)

- **Core Question**: *«Does this problem contain a formalizable fragment that should be made externally verifiable, and how do I ground my reasoning upon the returned mathematical fact?»*
- **Trigger Indicators**:
  - The reasoning chain depends on a brittle numeric calculation, trigonometric relation, or existence proof.
  - An exact verification or refutation will permanently eliminate downstream hallucination.
- **Refusal Conditions (`DRA = NO`)**:
  - The task is purely creative, pedagogical, linguistic, or metaphorical.
  - The step is trivial and easily proven in pure natural language logic.
  - The requested capability is an unsupported gap (`CAPABILITY_GAP`).
- **Expected Outcome**: A validated `TOOL-VERIFIED FACT` and an updated reasoning trajectory.
- **Stand Interaction**: Invokes `HeadlessGeometrySession` actions (`create_point`, `connect`, `measure`, `verify`).
- **Epistemic Division**:
  - `TOOL-VERIFIED FACT`: *«Point P lies on Circle C with tolerance $\varepsilon=10^{-4}$»*
  - `AGENT INTERPRETATION`: *«Therefore, the triangle inscribed is right-angled by Thales' theorem»*
  - `AGENT HYPOTHESIS`: *«Perhaps this holds for any third vertex along the upper arc»*

---

### Pattern 2: `STRUCTURE_RECOGNITION`

- **Core Question**: *«What underlying mathematical configuration is embedded in the user's natural language brief?»*
- **Trigger Indicators**:
  - Unstructured natural language text mentions entities like chords, angles, centers, distances, or intersections.
- **Refusal Conditions**:
  - The problem has no spatial, relational, or geometric structure (e.g. text summarization).
- **Expected Outcome**: An explicit relational model: primitive entities, constraints, and target unknowns.
- **Stand Interaction**: Maps problem statements into `GeometryState` specifications.
- **Epistemic Division**:
  - The structural model is an **Agent Abstraction**, not yet an established truth.

---

### Pattern 3: `STRATEGY_SELECTION`

- **Core Question**: *«Which domain proving method or representation is most appropriate for this configuration?»*
- **Trigger Indicators**:
  - Multiple valid mathematical approaches exist: synthetic Euclidean proof, analytical Cartesian coordinates, trigonometry, or vector algebra.
- **Refusal Conditions**:
  - The problem specifies an exact required method (e.g. *«Solve using coordinate geometry only»*).
- **Expected Outcome**: A selected derivation roadmap (e.g. *«Use Cartesian coordinates on unit circle»* vs *«Use synthetic angle chasing»*).
- **Stand Interaction**: Determines whether to call coordinate utilities (`src/utils/canonicalCoordinates.ts`) or macro constructions (`construct('PERPENDICULAR')`).
- **Epistemic Division**:
  - The strategy is an **Agent Plan**; failure to find a solution invalidates the plan, not the Stand.

---

### Pattern 4: `AUXILIARY_CONSTRUCTION`

- **Core Question**: *«What auxiliary geometric entity (altitude, median, parallel line, circumcircle) can reveal hidden invariants?»*
- **Trigger Indicators**:
  - Existing elements do not form a closed relational chain to the target fact.
  - Known geometric lemmas (e.g. Thales, Carnot, Euler line) require a reference circle or perpendicular line not yet present.
- **Refusal Conditions**:
  - The figure is already relationally complete.
  - Adding entities would create clutter or explosive combinatorial complexity.
- **Expected Outcome**: Addition of auxiliary entities tagged with `role: 'auxiliary'` in the construction DAG.
- **Stand Interaction**: Uses `construct('PERPENDICULAR')`, `construct('ANGLE_BISECTOR')`, `connect(p1, p2, 'LINE')`.
- **Epistemic Division**:
  - Auxiliary entities inherit strict provenance (`GeometryProvenance`), preventing them from being mistaken for base givens.

---

### Pattern 5: `INDEPENDENT_VERIFICATION`

- **Core Question**: *«Can this analytical result be cross-verified through an orthogonal, completely independent mathematical method?»*
- **Trigger Indicators**:
  - A claim has been derived, but potential algebraic or rounding drift exists.
  - Cross-checking between two independent formulas guarantees zero false positives.
- **Refusal Conditions**:
  - Only one mathematical method is physically possible in the active domain.
- **Expected Outcome**: Dual-engine or dual-formula convergence (e.g. Heron's Formula vs Shoelace Coordinate Formula).
- **Stand Interaction**: Compares `session.measure('SEGMENT_LENGTH')` with closed-form trigonometric formula $2R\sin(\Delta\theta/2)$.
- **Epistemic Division**:
  - Neither formula relies on the other's intermediate state.

---

### Pattern 6: `EPISTEMIC_SEPARATION`

- **Core Question**: *«Am I attributing to the tool only what it actually computed, and taking personal responsibility for the semantic leap?»*
- **Trigger Indicators**:
  - Preparing the final synthesis or answer for the human user or external reasoning consumer.
- **Refusal Conditions**:
  - Never refused. This is a mandatory invariant of the Stand.
- **Expected Outcome**: A clear, tripartite response structure:
  1. `TOOL-VERIFIED FACT`
  2. `AGENT INTERPRETATION`
  3. `AGENT HYPOTHESIS / REMAINING UNCERTAINTY`
- **Stand Interaction**: Extracts exact raw records from `CompactActionResponse` or `MeasureResult`.
- **Epistemic Division**:
  - Prevents the agent from claiming that a numerical measurement ($\text{diff} < 10^{-4}$) is a general formal synthetic proof for all $n$.

---

### Pattern 7: `STOP_OR_CONTINUE`

- **Core Question**: *«Do I have sufficient deterministic evidence to conclude, or does the proof chain remain open?»*
- **Trigger Indicators**:
  - After receiving a Stand response (`success: true` or `success: false`).
- **Refusal Conditions**:
  - If a core premise is refuted (`status: REFUTED`), the agent **must stop** and revise the hypothesis rather than continuing blindly.
- **Expected Outcome**: A decisive branch: complete the explanation, branch to an alternative hypothesis, or report an authentic `CAPABILITY_GAP`.
- **Stand Interaction**: Evaluates `verificationResult.verified` or `actionResponse.errorCode`.
- **Epistemic Division**:
  - Refusal to proceed on flawed premises is celebrated as high scientific discipline.

---

## 3. Applicability Map (How the Skill Advertises Itself)

To enable external agents to discover the skill during high-level planning, the skill exposes the following **Capability & Situation Map**:

| Situation Encountered in Natural Language | Recommended Guidance Pattern | Recommended Stand Capability |
| :--- | :---: | :--- |
| Metric properties, lengths, coordinates, circles | `STRUCTURE_RECOGNITION` $\to$ `DRA` | `create_point`, `connect`, `create_circle` |
| Verification of right angles, collinearity, parallelism | `DRA` $\to$ `EPISTEMIC_SEPARATION` | `verify('PERPENDICULAR_TO')`, `verify('PARALLEL_TO')` |
| Ambiguity in polygon vertex naming or ordering | `CANONICAL_ORDERING` | `worldCanonicalOrdering` (Tier 1 vs Tier 3 separation) |
| Missing connecting lines or altitudes | `AUXILIARY_CONSTRUCTION` | `construct('PERPENDICULAR')`, `construct('ANGLE_BISECTOR')` |
| Need to verify numeric results without bias | `INDEPENDENT_VERIFICATION` | `measure('SEGMENT_LENGTH')` cross-checked with Shoelace/Heron |
| Unsupported solid geometry (3D) or general angles | `CONSCIOUS_REFUSAL` | Report `CAPABILITY_GAP` (do NOT hallucinate tool calls) |

---

## 4. Architectural Invariant

> **Non-Negotiable Boundary**:  
> The patterns documented herein live strictly in the **Agent Guidance Layer** (`docs/`).  
> They do **not** mutate, wrap, or modify the frozen mathematical kernel (`src/kernel/`), the environment facade (`src/environment/`), or the public contract (`HeadlessGeometrySession v1.0.0`).  
> The stand remains purely deterministic: *"The agent may be wrong. The stand must not be."*

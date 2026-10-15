# AI Geometry Skill Passport

> **Document Version**: `0.1.0`  
> **Skill Target**: `AI Geometry Skill v1.0.0`  
> **Status**: `FROZEN_RESEARCH_TOOL`  
> **Standard Reference**: Inspired by the CSP-0.1 Passport/Runtime Separation Pattern  
> **Core Principle**: `SKILL = IMMUTABLE PASSPORT + RUNTIME BEHAVIOR`  
> **Epistemic Invariant**: `REASON OUTSIDE. VERIFY INSIDE.`

---

## 1. Passport Identity

```yaml
passport:
  schema: "AI-GEOMETRY-SKILL-PASSPORT"
  schema_version: "0.1"
  skill:
    name: "AI Geometry Skill"
    package: "ai-geometry-skill"
    version: "1.0.0"
    status: "FROZEN_RESEARCH_TOOL"
```

The **AI Geometry Skill Passport** is a formal, machine-readable declaration of the identity, capabilities, operational boundaries, epistemic guarantees, and execution policies of the **AI Geometry Skill v1.0.0**.

---

## 2. Identity & System Role

### 2.1 System Nature
The **AI Geometry Skill** is a **deterministic, headless geometry verification and research instrument** for external AI reasoning agents.

It is **NOT** an autonomous reasoning agent, an LLM chatbot, or a probabilistic theorem prover. It does not formulate proof strategies, guess geometric invariants, or hypothesize theorems.

### 2.2 Role in AI Agent Architecture
In a compound AI agent system, the Skill acts as a **Deterministic Epistemic Anchor**:
- **External AI Agent**: Formulates goals, constructs geometric hypotheses, plans derivation paths, and interprets mathematical meaning (*Reason Outside*).
- **AI Geometry Skill**: Executes Euclidean constructions analytically, measures metric quantities with floating-point precision, and evaluates formal predicates against fixed tolerances (*Verify Inside*).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL AI AGENT                                │
│       (Proof Strategy, Conjecture Formation, Epistemic Interpretation)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Calls Headless API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AI GEOMETRY SKILL                                │
│    (Deterministic Kinematics, Analytical Solvers, Fixed Receiver Check)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Classification

```yaml
classification:
  nature: "TOOL"
  action: "VERIFY"
  domain: "GEOMETRY_2D"
```

### Explanation of Classification Dimensions:
- **`nature: "TOOL"`**: A bounded, deterministic, machine-callable instrument. It contains zero autonomous reasoning loops, zero stochastic sampling, and zero external network calls.
- **`action: "VERIFY"`**: The primary function is analytical verification of geometric propositions and execution of Euclidean constructions. It acts as an authoritative checker, not a generator of ungrounded conjectures.
- **`domain: "GEOMETRY_2D"`**: Strictly confined to two-dimensional planar Euclidean geometry ($\mathbb{R}^2$).

---

## 4. Contract & Declared Public API

The Skill exposes an authoritative, headless TypeScript API implemented in `HeadlessGeometrySession`. Exactly **14 public operations** are declared in this contract:

```yaml
contract:
  interface: "HeadlessGeometrySession"
  operations:
    - name: "create_point"
      description: "Creates an authoritative 2D point (x, y) with an optional portable ID."
    - name: "connect"
      description: "Connects two points into a line, segment, or ray."
    - name: "create_circle"
      description: "Constructs a circle defined by center point and radius."
    - name: "construct"
      description: "Executes macro constructions (perpendicular, parallel, angle bisector)."
    - name: "intersect"
      description: "Solves analytical intersection between lines and circles, returning all roots."
    - name: "move"
      description: "Translates an unconstrained point and recomputes dependent DAG entities."
    - name: "erase"
      description: "Deletes an entity and cascades deletion to dependent children."
    - name: "observe"
      description: "Extracts state snapshots in COMPACT, FULL, OBJECT, or PROVENANCE profiles."
    - name: "measure"
      description: "Measures continuous metric quantities (SEGMENT_LENGTH)."
    - name: "verify"
      description: "Evaluates a binary geometric predicate against fixed receiver tolerance."
    - name: "fork"
      description: "Creates an isolated sandbox copy of the current state."
    - name: "rollback"
      description: "Restores the geometry state to a previously forked sandbox checkpoint."
    - name: "exportSolutionArtifact"
      description: "Exports current state and certified claims into a GSA v0.1 JSON envelope."
    - name: "importSolutionArtifact"
      description: "Imports a GSA envelope and performs local Zero-Trust verification."
```

---

## 5. Verification Capabilities & Predicates

```yaml
verification:
  deterministic: true
  receiver_threshold: 0.0001
  predicates:
    - name: "PERPENDICULAR_TO"
      semantics: "Normalized dot product |v1 · v2| < eps"
    - name: "PARALLEL_TO"
      semantics: "Normalized 2D cross product |v1 x v2| < eps"
    - name: "EQUAL_LENGTH"
      semantics: "Absolute length difference ||s1| - |s2|| < eps"
    - name: "POINT_ON_CIRCLE"
      semantics: "Radial distance error ||P - O| - R| < eps"
```

### Invariants:
1. **Receiver-Owned Tolerance**: The verification tolerance $\varepsilon = 10^{-4}$ ($0.0001$) is strictly owned and enforced by the Skill. External agents cannot negotiate, relax, or override this threshold.
2. **Boolean Decidability**: The `verify()` method evaluates to a deterministic boolean (`true` or `false`) accompanied by exact numerical difference metrics.

---

## 6. Geometry Domain & Capability Gaps

```yaml
domain:
  geometry: "2D Euclidean planar geometry"
  coordinate_space: "R^2"
  precision: "IEEE 754 double-precision float"
```

### Declared Capability Gaps (Non-Supported Features):
```yaml
capability_gaps:
  - id: "GAP-01"
    name: "3D Solid Geometry (Stereometry)"
    description: "Skill does not support 3D points (x, y, z), planes, polyhedra, or spatial cross-sections."
  - id: "GAP-02"
    name: "General Polygon Entities"
    description: "Triangles and polygons are represented as collections of points and segments; no monolithic Polygon object exists."
  - id: "GAP-03"
    name: "Arbitrary Angle Measurement"
    description: "Predicate ANGLE_VALUE in degrees is unsupported; angular relations are verified via orthogonal and parallel vector predicates."
  - id: "GAP-04"
    name: "Global Solution BranchTree"
    description: "Roots are indexed locally along the directed line vector (rootIndex 0, 1); persistent global branch trees are not tracked."
  - id: "GAP-05"
    name: "Reactive Intersection Snapshots"
    description: "Intersection points created via intersect() are static snapshots and do not automatically follow moving parent lines."
```

---

## 7. Input / Output Compatibility

```yaml
compatibility:
  input:
    representations:
      - "Formal programmatic method invocations (TypeScript / JavaScript)"
      - "Planar Cartesian coordinates (x: number, y: number)"
      - "Unique portable string identifiers (point IDs, segment IDs)"
      - "GSA JSON envelope (Geometric Solution Artifact v0.1)"
  output:
    representations:
      - "Authoritative FullGeometryState snapshots"
      - "Scalar metric measurements (SEGMENT_LENGTH)"
      - "Deterministic verification reports (verified: boolean, difference: number, threshold: number)"
      - "Constructive DAG provenance history"
      - "PGS-2D v1.0 configuration passport payload"
      - "GSA v0.1.0 inter-agent exchange container"
```

---

## 8. Epistemic Contract

The Skill enforces a strict epistemic pipeline:

$$\text{AGENT REASONING} \longrightarrow \text{AGENT HYPOTHESIS} \longrightarrow \text{GEOMETRY SKILL} \longrightarrow \text{TOOL-VERIFIED FACT} \longrightarrow \text{AGENT INTERPRETATION}$$

```yaml
epistemic_contract:
  tiers:
    - tier: "GIVEN"
      meaning: "Axiomatic initial conditions established at problem setup."
    - tier: "HYPOTHESIS"
      meaning: "Conjectured proposition generated by an external agent, unverified by the kernel."
    - tier: "TOOL-VERIFIED"
      meaning: "Proposition verified analytically by the Skill kernel within eps = 1e-4."
    - tier: "DERIVED"
      meaning: "Fact logically deduced from verified facts via canonical derivation rules."
    - tier: "INVALID"
      meaning: "Proposition analytically refuted by the Skill kernel (|diff| >= eps)."
    - tier: "VANISHED"
      meaning: "Internal state where dynamic point motion invalidated earlier geometric preconditions."
```

> **Epistemic Note on `VANISHED`**: The `VANISHED` status is maintained inside the internal research knowledge graph (`GeometryGraph`). In the public `verify()` API, an unfulfilled relation evaluates strictly to `verified: false`.

---

## 9. Deterministic Reasoning Anchor (DRA) Contract

```yaml
dra_contract:
  nature: "AGENT_GUIDANCE"
  is_runtime_api: false
  cycle:
    - step: 1
      name: "RECOGNIZE"
      action: "Identify geometric entities and formalizable relations in the prompt."
    - step: 2
      name: "DECIDE"
      action: "Determine whether to delegate to Skill or perform external symbolic reasoning."
    - step: 3
      name: "VERIFY"
      action: "Project minimal geometry into HeadlessGeometrySession and evaluate predicates."
    - step: 4
      name: "SEPARATE"
      action: "Isolate TOOL-VERIFIED FACT from AGENT INTERPRETATION and AGENT HYPOTHESIS."
    - step: 5
      name: "UPDATE"
      action: "Ground downstream proof arguments solely upon verified facts."
  conscious_refusal:
    valid_outcome: true
    condition: "Problem falls outside 2D planar Euclidean scope (e.g. 3D stereometry)."
```

---

## 10. Zero-Trust & GSA Inter-Agent Exchange

```yaml
exchange:
  artifact_name: "Geometric Solution Artifact (GSA)"
  format_version: "0.1.0"
  payload_schema: "PGS-2D v1.0"
  trust_model: "ZERO_TRUST"
  canonical_rule: "PRODUCER_CLAIM_NEQ_RECEIVER_TRUTH"
```

### Zero-Trust Verification Workflow:
1. **Produce**: Agent A constructs geometry, measures metrics, records certified claims, and exports a GSA envelope.
2. **Transfer**: Agent A transmits the serialized JSON GSA artifact to Agent B.
3. **Receive**: Agent B imports the GSA into a fresh, isolated `HeadlessGeometrySession`.
4. **Independent Verification**: Agent B's local stand reconstructs the geometry from the PGS payload and re-evaluates all certified claims against its own local kernel.
5. **Verdict**: If all claims pass, status is `ACCEPTED`. If any claim fails, status is `MISMATCH`, and the session state is completely rolled back.

---

## 11. Runtime Layer Separation

In accordance with the foundational separation:
$$\text{SKILL} = \text{IMMUTABLE PASSPORT} + \text{RUNTIME BEHAVIOR}$$

```yaml
runtime_layer:
  passport_role: "Static, frozen specification of capabilities, bounds, and policies."
  runtime_role: "Dynamic execution trace of a specific session instance."
  session_properties:
    authoritative_state: "FullGeometryState (Single Source of Truth)"
    kinematics: "Dynamic DAG recalculation on point movement"
    fault_tolerance: "State inviolability on invalid input (NaN/Infinity rejected prior to mutation)"
    epistemic_sandboxing: "Isolated scratchpads via fork() and rollback()"
```

---

## 12. Host Environment Requirements

```yaml
requirements:
  runtime:
    platform: "Node.js (>= 18.x) or modern ECMAScript environment"
    language: "TypeScript / JavaScript (ES2022+)"
  integration:
    mode: "Headless / in-process library import"
    entry_point: "src/headless/HeadlessGeometrySession.ts"
  dependencies:
    external_network: "NONE (100% offline deterministic execution)"
    llm_dependencies: "NONE (Kernel contains zero LLM/API calls)"
```

---

## 13. Operational Policy & Guarantees

```yaml
policy:
  geometry:
    rule: "NO MAGIC GEOMETRY"
    description: "The Skill must not fabricate, hallucinate, or approximate unsupported geometric entities."
  capability_handling:
    unsupported_request: "Conscious refusal / CAPABILITY_GAP"
  state_safety:
    rejection_guarantee: "Rejected operations leave FullGeometryState 100% unmutated."
```

---

## 14. Passport Immutability & Governance

1. **Immutable Specification**: This Passport reflects the frozen state of `AI Geometry Skill v1.0.0`. Neither external AI agents nor hosting orchestrators may alter the declared capabilities, predicates, or tolerances.
2. **Local Control**: Host agents retain complete autonomy over *whether* and *when* to invoke the Skill.
3. **Runtime Non-Mutation**: Runtime observations and execution histories cannot rewrite or expand the Passport.

---

## 15. Versioning

```yaml
versioning:
  passport_schema: "0.1"
  skill_version: "1.0.0"
  status: "FROZEN"
  policy: "Any modification to capabilities, tolerances, or API operations requires a new version release."
```

---

## 16. Complete Machine-Readable Passport (YAML)

```yaml
passport:
  schema: "AI-GEOMETRY-SKILL-PASSPORT"
  schema_version: "0.1"

  skill:
    name: "AI Geometry Skill"
    package: "ai-geometry-skill"
    version: "1.0.0"
    status: "FROZEN_RESEARCH_TOOL"

  identity:
    type: "deterministic_geometry_verification_instrument"
    mode: "headless"

  classification:
    nature: "TOOL"
    action: "VERIFY"
    domain: "GEOMETRY_2D"

  principles:
    primary: "REASON OUTSIDE. VERIFY INSIDE."
    epistemic: "The agent may be wrong. The stand must not be."
    geometry_rule: "NO MAGIC GEOMETRY"

  domain:
    geometry: "2D Euclidean planar geometry"
    coordinate_space: "R^2"
    precision: "IEEE 754 double precision float"

  contract:
    interface: "HeadlessGeometrySession"
    declared_operations_count: 14
    operations:
      - "create_point"
      - "connect"
      - "create_circle"
      - "construct"
      - "intersect"
      - "move"
      - "erase"
      - "observe"
      - "measure"
      - "verify"
      - "fork"
      - "rollback"
      - "exportSolutionArtifact"
      - "importSolutionArtifact"

  verification:
    deterministic: true
    receiver_threshold: 0.0001
    predicates_count: 4
    predicates:
      - "PERPENDICULAR_TO"
      - "PARALLEL_TO"
      - "EQUAL_LENGTH"
      - "POINT_ON_CIRCLE"

  capability_gaps:
    count: 5
    items:
      - "3D solid geometry (stereometry)"
      - "general polygon entities"
      - "arbitrary angle measurement (ANGLE_VALUE)"
      - "global solution BranchTree"
      - "reactive auto-recomputing intersection points"

  compatibility:
    input:
      - "formal geometry operations"
      - "cartesian coordinates (x, y)"
      - "portable identifiers"
      - "GSA JSON container"
    output:
      - "authoritative geometry state"
      - "scalar metric measurements"
      - "deterministic verification results"
      - "constructive DAG provenance"
      - "GSA v0.1.0 artifact"
      - "PGS-2D v1.0 passport"

  epistemic_model:
    tiers:
      - "GIVEN"
      - "HYPOTHESIS"
      - "TOOL-VERIFIED"
      - "DERIVED"
      - "INVALID"
      - "VANISHED"
    inviolable_separation: "TOOL-VERIFIED FACT != AGENT INTERPRETATION != AGENT HYPOTHESIS"

  dra_guidance:
    is_runtime_api: false
    cycle:
      - "RECOGNIZE"
      - "DECIDE"
      - "VERIFY"
      - "SEPARATE"
      - "UPDATE"
    conscious_refusal_valid: true

  exchange:
    artifact: "GSA"
    format_version: "0.1.0"
    geometry_schema: "PGS-2D"
    trust_model: "ZERO_TRUST"
    rule: "PRODUCER_CLAIM_NEQ_RECEIVER_TRUTH"

  requirements:
    runtime: "Node.js (>= 18.x) / TypeScript"
    mode: "headless"
    network: "offline"
    llm_calls_in_kernel: false

  policy:
    fabrication: false
    unsupported_request: "CAPABILITY_GAP"
    state_inviolability_on_error: true

  versioning:
    passport_schema: "0.1"
    skill_version: "1.0.0"
    status: "FROZEN"
```

---

## 17. Relationship to Cognitive Skill Passport (CSP) Standard

The **AI Geometry Skill Passport** is conceptually inspired by the architectural separation between **Passport** (immutable static definition of capabilities, contracts, and policies) and **Runtime Behavior** (ephemeral execution telemetry) formulated in the Cognitive Skill Passport (CSP) pattern.

It is a project-specific passport format tailored specifically to deterministic mathematical verification instruments. It does not claim formal compliance or certification under the general CSP specification unless validated by an independent CSP compliance suite.

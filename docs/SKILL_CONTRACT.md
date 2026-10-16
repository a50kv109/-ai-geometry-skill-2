# AI Geometry Skill — Semantic Contract v0.4

> **Version**: `v0.4`  
> **Status**: `FROZEN`  
> **Interface**: `HeadlessGeometrySession`  
> **Core Principle**: `REASON OUTSIDE. VERIFY INSIDE.`

---

## 1. Authoritative State Purity

- **Single Source of Truth (SSOT)**: `FullGeometryState` within the active session is the authoritative representation of Euclidean geometric truth.
- **Client Decoupling**: No client-side UI, DOM, or visual presentation layer can mutate or override the mathematical kernel.
- **State Inviolability on Rejection**: A command rejected by input validation ($NaN$, $\pm\infty$, unknown entity ID) or by the reducer before state commit guarantees that `FullGeometryState` remains unmutated.

---

## 2. Public Action Set

The external reasoning agent interacts solely via the following discrete commands in `HeadlessGeometrySession`:
- `create_point(x, y, options?)`: Creates an analytical point.
- `connect(p1Id, p2Id, type)`: Constructs a `SEGMENT` or infinite `LINE`.
- `create_circle(centerId, radius)`: Creates a Euclidean circle.
- `construct(macroType: 'PERPENDICULAR' | 'PARALLEL' | 'ANGLE_BISECTOR' | 'PERPENDICULAR_BISECTOR', params: object)`: Executes deterministic macro constructions.
- `intersect(id1, id2)`: Solves analytical intersection equations (`LINE x LINE`, `LINE x CIRCLE`, `SEGMENT x SEGMENT`, etc.) and returns materialized point snapshots.
- `move(pointId, x, y)`: Kinematically displaces a free vertex and cascades dependent macro geometry.
- `erase(entityId)`: Deletes an entity and cascades deletion to derived dependents.
- `reset()`: Clears active geometry to the initial profile baseline.
- `fork()` & `rollback(sandboxId)`: Creates isolated scratchpads for exploratory reasoning.
- `exportSolutionArtifact()`: Packages state, provenance, and certified claims into a GSA v0.1.0 container.
- `importSolutionArtifact(artifact)`: Imports a GSA container and executes local Zero-Trust verification.

---

## 3. Observations & Measurements

- **`observe(mode)`**: Returns structured, machine-readable representations:
  - `'COMPACT'`: Topology entity counts and active ID digests.
  - `'FULL'`: Complete analytical dictionaries of points, segments, lines, circles.
  - `'OBJECT'`: Detailed analytical parameters and role of a specific entity.
  - `'PROVENANCE'`: Origin history (`sourceIds`, `groupId`, `role`).
  - `'KNOWLEDGE'`: Active invariant and fact status.
- **`measure(entityId, type)`**: Returns high-precision numerical values (`SEGMENT_LENGTH`) as a `SemanticQuantity`.

---

## 4. Verification Contract & Receiver-Owned Tolerance

- **Fixed Receiver Tolerance**: All verification evaluates predicates using a non-negotiable tolerance $\varepsilon = 10^{-4}$ owned by the Stand. External agents cannot loosen or negotiate this bound.
- **Supported Predicates**:
  1. `PERPENDICULAR_TO`: $|\vec{v}_1 \cdot \vec{v}_2| < 10^{-4}$.
  2. `PARALLEL_TO`: $|\vec{v}_1 \times \vec{v}_2| < 10^{-4}$.
  3. `EQUAL_LENGTH`: $|l_1 - l_2| < 10^{-4}$.
  4. `POINT_ON_CIRCLE`: $|\|P - O\| - R| < 10^{-4}$.

---

## 5. Multiple Roots & Determinism

- **No Silent Root Pruning**: Operations with multiple algebraic solutions (such as line-circle secants) return all roots explicitly in an array with indexed identifiers (`rootIndex: 0, 1`).
- **Deterministic Parameter Ordering**: Roots are deterministically sorted along the directed line vector $P_1 \to P_2$ ($t_0 < t_1$).
- **Local Scope**: `rootIndex` represents local parametric ordering, not global Solution Branch Identity.

---

## 6. Architectural Guardrails & Isolation

- **Architectural Guardrails (Leak Protection)**: `HeadlessGeometrySession` acts as the strict interface boundary. It enforces the contract via input sanitization and invariant checks before/after mutations, ensuring no illegal states leak into the Core.
- **State Isolation (Sandboxing)**: `fork()` and `rollback()` are mechanisms for speculative exploration. The active `session.state` remains the single canonical truth, while sandboxes allow for branch-based hypothesis testing.

## 7. Canonical Geometry, Perimeter Parameterization & Epistemic Invariants

External reasoning agents interacting with geometry MUST uphold the three decoupled epistemic tiers defined in [CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md](./CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md):

1. **Extrinsic Observer Tier (Tier 1)**: Cartesian $(x, y)$ and polar angles $\theta_i = \operatorname{atan2}(y_i - y_O, x_i - x_O) \in [0, 2\pi)$ relative to circumcenter $O$. Polar angles are observer addresses, not polygon internal angles.
2. **Contour Parameterization Tier (Tier 2)**: 1D manifold arc coordinate $s \in [0, L)$ or normalized parameter $t = s/L \in [0, 1)$ measured from a designated anchor vertex along a defined orientation (CCW standard).
3. **Intrinsic Euclidean Invariants Tier (Tier 3)**: Frame-independent quantities invariant under $SE(2)$ (side lengths $a, b, c$, vertex angles $\alpha, \beta, \gamma$, area $S$, inradius $r$, circumradius $R$).
4. **Strict Guardrail**: Agents must NEVER equate a polar coordinate angle $\theta_P$ with an internal vertex angle $\angle P$. All invariant reasoning must be grounded in Tier 3 quantities.

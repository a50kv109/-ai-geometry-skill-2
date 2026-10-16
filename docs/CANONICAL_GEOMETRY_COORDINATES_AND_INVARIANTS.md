# Canonical Geometry: Extrinsic Coordinates, Perimeter Parameterization, and Intrinsic Invariants

> **Document Version**: `v1.0.0-normative`  
> **Status**: `NORMATIVE SPECIFICATION & RESEARCH CONTRACT`  
> **Audience**: AI Agents, Geometric Reasoning Planners, Kernel Architects  
> **Related Documents**:  
> - [`docs/GEOMETRY_MODEL.md`](./GEOMETRY_MODEL.md) — Single Source of Truth for Stand State  
> - [`docs/SEMANTIC_INTERFACE.md`](./SEMANTIC_INTERFACE.md) — Agent Semantic Interface Specification  
> - [`docs/CAPABILITY_MODEL.md`](./CAPABILITY_MODEL.md) — Verified vs Unsupported Capability Register  
> - [`docs/AI_GEOMETRY_SKILL_PASSPORT.md`](./AI_GEOMETRY_SKILL_PASSPORT.md) — Architectural Invariants  

---

## 1. Executive Motivation & The Core Categorical Distinction

In multi-agent collaborative geometry and automated theorem proving, external AI models frequently commit a fundamental **domain-level category error**:

$$\text{Error: Confusing Extrinsic Position Angle } \theta_i \text{ with Intrinsic Vertex Angle } \angle V_i$$

A geometric figure (such as a triangle $\triangle ABC$ inscribed in a circle $\mathcal{C}(O, R)$) exists simultaneously across **three strictly decoupled epistemic tiers**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER A: ANGULAR / POLAR ADDRESS (Circle Frame)                             │
│ • Origin O_world, Basis (e_x, e_y)                                          │
│ • Polar angle θ ∈ [0, 2π) or α_deg ∈ [0°, 360°) relative to +X axis         │
│ • Coordinate address of point on circle; NOT an internal polygon angle      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ s = R · θ  (or s = 2πR · α_deg / 360°)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER B: PERIMETER / CONTOUR COORDINATE (1D Boundary Arc Metric)            │
│ • Reference Anchor Vertex V_0, Traversal Orientation (CCW / CW)             │
│ • Arc length s ∈ [0, L) or Normalized Parameter t = s/L ∈ [0, 1)            │
│ • Invariant under Rigid Translations and Global Rotations of the contour    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ x = x_O + R cos θ, y = y_O + R sin θ
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER C: CARTESIAN POSITION (2D Euclidean Plane Model Coordinates)          │
│ • Direct coordinates (x, y) ∈ ℝ²                                            │
│ • Ground truth for distance metrics, intersections, and affine operations   │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **The Coordinate Addressing Canon**:
> A geometric point may possess multiple consistent addressing representations. Angular address (Layer A), coordinate along perimeter (Layer B), and Cartesian coordinates (Layer C) are distinct representations of a point's position, coupled by explicit mathematical transformations. They are **not interchangeable** without specifying the corresponding reference frame, host geometric object, and traversal orientation.

For a circle of radius $R$:
$$\text{Given } \alpha^\circ \in [0^\circ, 360^\circ) \implies s = 2\pi R \frac{\alpha^\circ}{360^\circ}, \quad t = \frac{\alpha^\circ}{360^\circ}$$
$$x = x_O + R \cos\left(\frac{2\pi \alpha^\circ}{360^\circ}\right), \quad y = y_O + R \sin\left(\frac{2\pi \alpha^\circ}{360^\circ}\right)$$

For a polygon boundary (e.g. triangle $\triangle ABC$):
The coordinate $s \in [0, a+b+c)$ accumulates piecewise along consecutive directed segments with distinct linear segments, while polar angles relative to the circumcenter vary non-linearly along each chord.

### 1.1. Mandatory Epistemic Boundaries & Non-Equivalences

External AI agents consuming this specification MUST strictly enforce five core boundary principles:

1. **Extrinsic Polar Angle $\neq$ Intrinsic Polygon Angle** (`GUARD-CANON-01`):
   - The polar coordinate $\theta \in [0, 360^\circ)$ represents an observer-dependent coordinate address on the bounding circle.
   - It does not equal the vertex interior angle $\angle V$. Equating them is a categorical error.
2. **Contour Coordinate $\neq$ Polar Angle**:
   - The contour perimeter coordinate $s \in [0, P)$ (or normalized parameter $t = s/P$) parameterizes the 1D polygon boundary.
   - On chords, the mapping between polar angle $\theta$ and perimeter coordinate $s$ is strictly non-linear.
3. **Representation Normalization $\neq$ Geometric Mutation**:
   - Canonical ordering (`worldCanonicalOrdering`) normalizes representation and assigns stable canonical roles (`P_0`, `P_1`, ...).
   - It does **not** alter, project, or mutate the underlying Euclidean coordinates $(x, y)$ or shape geometry.
4. **Preservation of `entityId` and Lineage Provenance**:
   - Canonical indexing attaches roles while strictly preserving the caller's `originalId`, entity lineage, and parent history.
5. **Deterministic Addressing $\neq$ Geometric Proof**:
   - Assigning canonical addresses or computing perimeter coordinates does not constitute a theorem proof.
   - Truth verification requires analytical predicate evaluation (`HeadlessGeometrySession.verify()`).

---

## 2. Mathematical Formalization of the Three Tiers

### 2.1. Tier 1: Extrinsic Coordinates (Observer-Dependent)

Let the Euclidean plane be equipped with an orthonormal Cartesian coordinate system $(O, \vec{e}_x, \vec{e}_y)$.

For a circle $\mathcal{C}$ centered at $O = (x_O, y_O)$ with radius $R > 0$:
1. The **extrinsic polar position angle** $\theta \in [0, 2\pi)$ of any point $P$ on $\mathcal{C}$ is uniquely defined by:
   $$\theta(P) = \operatorname{atan2}(y_P - y_O, \, x_P - x_O) \pmod{2\pi}$$
2. The Cartesian coordinates are recovered via:
   $$x_P = x_O + R \cos\theta, \quad y_P = y_O + R \sin\theta$$

#### Invariance Behavior:
- Under global rotation $\mathbf{R}_\phi$ by angle $\phi$: $\theta \mapsto (\theta + \phi) \pmod{2\pi}$.
- Under translation $\mathbf{T}_{\vec{v}}$: $\theta$ remains unchanged relative to $O$, but absolute coordinates $(x, y)$ translate.
- **Rule for AI Agents**: $\theta_P$ is an **address** on the circle, **never** an intrinsic angle of the polygon.

---

### 2.2. Tier 2: Perimeter & Contour Parameterization (1D Manifold)

A continuous closed curve (circle, polygon boundary) of total perimeter $L > 0$ defines a 1D Riemannian manifold $S^1$.

1. **Choice of Anchor Vertex / Datum**: Choose a reference anchor point $V_0$ on the contour such that $s(V_0) = 0$.
2. **Orientation**: Define standard mathematically positive orientation:
   - **Counter-Clockwise (CCW)**: Increasing $s$ traverses in the direction of positive angular increase ($\vec{e}_x \to \vec{e}_y$).
   - **Clockwise (CW)**: Reversed traversal direction.
3. **Metric Arc Length**:
   $$s \in [0, L), \quad \text{where } L = \oint_{\Gamma} \|\gamma'(u)\| du$$
4. **Normalized Contour Coordinate**:
   $$t = \frac{s}{L} \in [0, 1)$$

#### For the Circumscribed Circle $\mathcal{C}(O, R)$:
- Total perimeter: $L_{\mathcal{C}} = 2\pi R$.
- Given anchor point $P_0$ at angle $\theta_0$:
  $$s(P) = R \cdot \big((\theta(P) - \theta_0) \pmod{2\pi}\big)$$
  $$t(P) = \frac{(\theta(P) - \theta_0) \pmod{2\pi}}{2\pi}$$

#### For the Inscribed Triangle $\triangle ABC$:
- Total perimeter: $L_{\triangle} = a + b + c$, where $a = |BC|, b = |CA|, c = |AB|$.
- With anchor $A$ and CCW sequence $A \to B \to C$:
  - $s(A) = 0, \quad t(A) = 0$
  - $s(B) = c, \quad t(B) = \frac{c}{a + b + c}$
  - $s(C) = c + a, \quad t(C) = \frac{c + a}{a + b + c}$

---

### 2.3. Tier 3: Intrinsic Geometric Invariants (Frame-Independent)

Intrinsic quantities depend exclusively on the metric tensor of the polygon and are invariant under the special Euclidean group $SE(2)$ (translations and rotations):

1. **Side Lengths**:
   $$a = \|C - B\|, \quad b = \|A - C\|, \quad c = \|B - A\|$$
2. **Internal Vertex Angles**:
   $$\alpha = \angle BAC = \arccos\left(\frac{b^2 + c^2 - a^2}{2bc}\right) \in (0, \pi)$$
   $$\beta = \angle ABC = \arccos\left(\frac{c^2 + a^2 - b^2}{2ca}\right) \in (0, \pi)$$
   $$\gamma = \angle BCA = \arccos\left(\frac{a^2 + b^2 - c^2}{2ab}\right) \in (0, \pi)$$
   $$\alpha + \beta + \gamma = \pi \quad (180^\circ)$$
3. **Area ($S$) and Radii ($R, r$)**:
   $$p = \frac{a + b + c}{2}, \quad S = \sqrt{p(p - a)(p - b)(p - c)}$$
   $$R = \frac{abc}{4S}, \quad r = \frac{S}{p}$$

---

## 3. The Mathematical Bridge: Circle Subtended Angles vs Inscribed Angles

The deterministic relation connecting the circle's extrinsic angular coordinates to the triangle's intrinsic angles is given by the **Inscribed Angle Theorem** and **Carnot's Invariant**:

### 3.1. Subtended Central Angles
For consecutive vertices $A, B, C$ ordered counter-clockwise along the circle:
$$\Delta\theta_{AB} = (\theta_B - \theta_A) \pmod{2\pi}$$
$$\Delta\theta_{BC} = (\theta_C - \theta_B) \pmod{2\pi}$$
$$\Delta\theta_{CA} = (\theta_A - \theta_C) \pmod{2\pi}$$
$$\Delta\theta_{AB} + \Delta\theta_{BC} + \Delta\theta_{CA} = 2\pi \quad (360^\circ)$$

### 3.2. Direct Relation to Triangle Side Chords
Each side length is directly determined by the subtended central angle:
$$c = |AB| = 2R \sin\left(\frac{\Delta\theta_{AB}}{2}\right)$$
$$a = |BC| = 2R \sin\left(\frac{\Delta\theta_{BC}}{2}\right)$$
$$b = |CA| = 2R \sin\left(\frac{\Delta\theta_{CA}}{2}\right)$$

### 3.3. Relation to Inscribed Vertex Angles
For an acute triangle where the circumcenter $O$ lies strictly within $\triangle ABC$:
$$\angle C = \frac{1}{2} \Delta\theta_{AB}, \quad \angle A = \frac{1}{2} \Delta\theta_{BC}, \quad \angle B = \frac{1}{2} \Delta\theta_{CA}$$

```
                A (θ_A)
                /\
               /  \
              /    \
             /  O   \
            /   •    \
           /          \
  B (θ_B) /____________\ C (θ_C)

Central arc Δθ_BC = (θ_C - θ_B) mod 2π
Inscribed angle ∠A = Δθ_BC / 2
Side length a = |BC| = 2R · sin(Δθ_BC / 2)
```

---

## 4. Concrete Counterexample: Why $\theta \neq \angle V$

Consider an equilateral triangle $\triangle ABC$ inscribed in the unit circle $R = 1$ with vertices positioned at polar angles:
$$\theta_A = 30^\circ \quad (\pi / 6), \quad \theta_B = 150^\circ \quad (5\pi / 6), \quad \theta_C = 270^\circ \quad (3\pi / 2)$$

| Entity | Position Angle $\theta$ | Subtended Arc $\Delta\theta$ | Side Chord | Intrinsic Vertex Angle |
| :--- | :---: | :---: | :---: | :---: |
| Vertex $A$ | $30^\circ$ | $\Delta\theta_{BC} = 120^\circ$ | $a = 2 \sin 60^\circ = \sqrt{3}$ | $\angle A = 60^\circ$ |
| Vertex $B$ | $150^\circ$ | $\Delta\theta_{CA} = 120^\circ$ | $b = 2 \sin 60^\circ = \sqrt{3}$ | $\angle B = 60^\circ$ |
| Vertex $C$ | $270^\circ$ | $\Delta\theta_{AB} = 120^\circ$ | $c = 2 \sin 60^\circ = \sqrt{3}$ | $\angle C = 60^\circ$ |

**Failure Analysis**:
- $\theta_A = 30^\circ \ne \angle A = 60^\circ$
- $\theta_B = 150^\circ \ne \angle B = 60^\circ$
- $\theta_C = 270^\circ \ne \angle C = 60^\circ$

**Audited Rule**: Under **no circumstances** may an AI agent or test harness assert equality between a vertex's extrinsic polar coordinate $\theta$ and its internal geometric angle $\angle V$.

---

## 5. Canonical Identity & Ordering Standard (Canonical Passport)

To enable independent AI agents to reach deterministic consensus without out-of-band communication, geometric objects must adhere to a standardized canonical naming and ordering protocol.

### 5.1. Dual Canonical Ordering Modes

#### Mode A: Extrinsic Canonical Ordering (`WORLD_CANONICAL`)
- **Use Case**: Scene serialization, rendering, snapshot hashing, headless state comparison.
- **Rule**:
  1. Identify all polygon vertices $\{V_i\}_{i=1}^N$.
  2. Compute their polar coordinates $\theta_i = \operatorname{atan2}(y_i - y_O, x_i - x_O) \pmod{2\pi}$ in degrees $[0^\circ, 360^\circ)$ or radians $[0, 2\pi)$.
  3. Sort vertices in strictly ascending order: $0 \le \theta_0 \le \theta_1 \le \dots \le \theta_{N-1} < 360^\circ$.
  4. **Coincident & Tie-Break Policy**:
     - If two points have identical angles within machine arithmetic ($|\Delta\theta| < 10^{-9\circ}$), ordering is deterministically resolved by lexicographic comparison of `originalId`.
     - Points with nearly identical angles ($\Delta\theta < 10^{-4\circ}$) are preserved as distinct entities without silent pruning.
  5. **Topological Boundary Note**: Angles are normalized to $[0, 360^\circ)$ relative to the positive $+X$ semi-axis (CCW). Points immediately across the branch cut (e.g. $0.00001^\circ$ and $359.99999^\circ$) receive first ($P_0$) and last ($P_{N-1}$) indices; external agents must account for this branch cut when evaluating circular neighborhoods.
  6. Assign canonical labels: $V_0 \mapsto P_0, V_1 \mapsto P_1, \dots$

#### Mode B: Intrinsic Canonical Ordering (`INTRINSIC_SHAPE_CANONICAL`)
- **Use Case**: Congruence verification, theorem proving, isomorphic shape recognition independent of rotation.
- **Rule for Triangles**:
  1. Compute the three internal angles $(\alpha, \beta, \gamma)$ or side lengths $(a, b, c)$.
  2. Select the **Anchor Vertex**:
     - The vertex opposite the strictly longest side ($a_{\max}$).
     - In case of tie (isosceles triangle: $a = b > c$), select the apex opposite the unique side $c$.
     - In case of equilateral triangle ($a = b = c$), select the vertex with the minimal polar coordinate $\theta$ in the active frame as deterministic tie-breaker.
  3. Traverse vertices in **Counter-Clockwise (CCW)** order relative to the triangle interior normal.
  4. Designate vertices canonically as $(A_{\text{canon}}, B_{\text{canon}}, C_{\text{canon}})$.

---

## 6. Machine-Readable Schema (TypeScript Definitions)

The following interfaces define the normative contract for exchanging geometric state between agents:

```typescript
/**
 * Extrinsic address of a geometric point in the world frame.
 */
export interface ExtrinsicPointCoordinates {
  id: string;
  cartesian: { x: number; y: number };
  polarRelativeToCircle?: {
    centerId: string;
    radius: number;
    thetaRad: number;   // [0, 2π)
    thetaDeg: number;   // [0, 360)
  };
}

/**
 * 1D Contour parameterization coordinate.
 */
export interface ContourPerimeterCoordinates {
  contourId: string;
  totalPerimeter: number;
  anchorPointId: string;
  orientation: 'CCW' | 'CW';
  arcLength: number;          // s ∈ [0, totalPerimeter)
  normalizedParameter: number; // t = s / totalPerimeter ∈ [0, 1)
}

/**
 * Pure intrinsic invariants of a planar Euclidean triangle.
 * Strictly invariant under translation, rotation, and coordinate frame re-orientation.
 */
export interface IntrinsicTriangleInvariants {
  sides: {
    a: number; // |BC|
    b: number; // |CA|
    c: number; // |AB|
  };
  internalAnglesDeg: {
    alpha: number; // ∠BAC
    beta: number;  // ∠ABC
    gamma: number; // ∠BCA
  };
  area: number;
  circumradius: number;
  inradius: number;
  chirality: 'CCW' | 'CW';
}

/**
 * Unified Canonical Geometric Passport for an inscribed polygon.
 */
export interface CanonicalGeometricPassport {
  schemaVersion: '1.0.0-canonical';
  entityId: string;
  extrinsic: {
    circumcenter: { x: number; y: number };
    circumradius: number;
    sortedVerticesCCW: Array<{
      id: string;
      thetaDeg: number;
    }>;
  };
  contour: {
    perimeter: number;
    vertexParameters: Record<string, number>; // vertexId -> t ∈ [0, 1)
  };
  intrinsic: IntrinsicTriangleInvariants;
}
```

---

## 7. Strict Contract Guardrails for External Agents

External AI agents executing against `HeadlessGeometrySession` MUST respect the following invariants:

1. **`GUARD-CANON-01` (Type Separation)**: Never pass a polar angle $\theta$ to an API expecting an internal angle $\angle V$, and vice versa.
2. **`GUARD-CANON-02` (Monotonic Angular Wrap)**: When integrating or interpolating vertices along a circular arc, the angular displacement must be computed via:
   $$\text{diff}(\theta_1, \theta_2) = (\theta_2 - \theta_1 + 3\pi) \pmod{2\pi} - \pi \in [-\pi, \pi)$$
3. **`GUARD-CANON-03` (Epistemic Isolation)**: Extrinsic coordinates $(x, y, \theta)$ are subject to observational noise or coordinate re-indexing; analytical assertions must always be grounded in Intrinsic Invariants (sides, angles, ratios).
4. **`GUARD-CANON-04` (Zero Divergence)**: All measurements returned by `HeadlessGeometrySession.measure()` conform strictly to analytical closed-form derivations evaluated at $\varepsilon = 10^{-4}$.

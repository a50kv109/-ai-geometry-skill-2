# Geometric State & Construction Model (GEOMETRY_MODEL.md)

## 1. Single Source of Truth: `GeometryState`

All geometric entities in the Stand live in a unified, deterministic state structure defined in `src/engines/geometryState.ts` and `src/engines/constructionCore.ts`:

```typescript
export interface GeometryState {
  points: Record<string, GeometryPoint>;
  lines: Record<string, GeometryLine>;
  segments: Record<string, GeometrySegment>;
  circles: Record<string, GeometryCircle>;
  activeCluster?: string;
}
```

### Entity Primitives
- **`GeometryPoint`:** Holds Cartesian coordinates `(x, y)`, an optional parameter `u` (for points constrained to a circle or line), name label, and provenance metadata.
- **`GeometrySegment`:** Bounded segment defined by start point `p1Id` and end point `p2Id`.
- **`GeometryLine`:** Unbounded Euclidean line defined by two collinear point IDs `(p1Id, p2Id)`.
- **`GeometryCircle`:** Euclidean circle defined by center point ID `centerId` and radius point ID `radiusPointId` (or explicit metric radius $R$).

---

## 2. Construction DAG & Provenance Tracking

Every entity created through school tools or agent commands carries a `GeometryProvenance` record:

```typescript
export interface GeometryProvenance {
  macroType?: 'perpendicular' | 'parallel' | 'bisector' | 'midpoint' | 'intersection' | 'tangent';
  sourceIds?: string[];
  groupId?: string;
  constructionStep?: number;
}
```

### Construction Directed Acyclic Graph (DAG)
The entities form a strict DAG:
- **Base Primitives:** Independent points freely positioned in the plane (in-degree = 0).
- **Constrained Entities:** Points constrained to circles ($x = R\cos u, y = R\sin u$) or lines.
- **Derived Entities:** Perpendicular bisectors, intersection points, angle bisectors whose coordinates are functions of their parent entities.

---

## 3. Dynamic Dependency Recomputation (`dependencyRecomputer.ts`)

When a user or agent moves a vertex $P$:
1. The update is applied directly to $P$.
2. The `dependencyRecomputer` traverses the construction DAG in topological order.
3. All child points, segments, lines, and circles dependent on $P$ are recalculated using analytical closed-form formulas:
   - Intersection of two lines: Cramer's rule / 2D determinant.
   - Perpendicular through point: Normal vector $\vec{n} = (-d_y, d_x)$.
   - Angle bisector: Unit vector addition $\frac{\vec{u}}{\|\vec{u}\|} + \frac{\vec{v}}{\|\vec{v}\|}$.
   - Tangent to circle: Orthogonal ray at boundary point $\vec{d} \cdot \vec{OT} = 0$.

---

## 4. Analytical Precision & Tolerances

All geometric evaluations use consistent mathematical constants to avoid floating-point drift:
- Coordinate comparison epsilon: $\varepsilon = 10^{-4}$
- Metric distance tolerance: $\text{tol} = 0.5\text{ px}$
- Angular tolerance: $\pm 0.1^\circ$

---

## 5. Epistemic Tiers and Canonical Coordinate Model

To prevent semantic conflation between observer coordinate addresses and intrinsic geometric invariants, all entities adhere to the three-tier model formalized in [`docs/CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md`](./CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md):
- **Tier 1 (Extrinsic Coordinates)**: Cartesian $(x, y)$ and polar angles $\theta(P) = \operatorname{atan2}(y - y_O, x - x_O) \pmod{2\pi}$ relative to circumcenter $O$.
- **Tier 2 (Perimeter Parameterization)**: Arc length $s \in [0, L)$ and normalized parameter $t = s/L \in [0, 1)$ along the polygon or circle boundary from a canonical anchor vertex.
- **Tier 3 (Intrinsic Invariants)**: Metric invariants invariant under $SE(2)$ (side lengths $a, b, c$, vertex angles $\alpha, \beta, \gamma$, area $S$, radii $R, r$).

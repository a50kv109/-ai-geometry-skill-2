# Known Limitations & Capability Gap Register

> **System Version**: `v1.0.0`  
> **Status**: `FROZEN`  
> **Policy**: Explicit Documentation over Premature Claims

---

## 1. What an External Agent Must Not Assume

To prevent false reasoning, external AI agents interacting with AI Geometry Skill v1.0.0 must respect the following non-assumptions:

1. **Do not assume `GeometryEnvironment` is the canonical external API**:
   - `HeadlessGeometrySession` (`src/headless/HeadlessGeometrySession.ts`) is the **canonical runtime API**. `GeometryEnvironment` is legacy test scaffolding.
2. **Do not assume the UI or browser is required**:
   - The Skill is 100% headless. The React UI is merely an optional visual client.
3. **Do not assume every intersection point is a live relational constraint**:
   - `intersect()` returns materialized point snapshots. They do not automatically recompute if parent entities are subsequently moved.
4. **Do not assume `rootIndex` is a permanent, invariant branch identity**:
   - `rootIndex` is a local parametric result ordering ($t_0 < t_1$) along a directed line vector. Reversing vector direction swaps root indices.
5. **Do not assume a producer's GSA claim is automatically true**:
   - The Zero-Trust protocol dictates: $\text{Producer Claim} \neq \text{Receiver Truth}$. Receiving agents must independently verify claims locally.
6. **Do not assume the Skill will approximate or guess unsupported operations**:
   - The Skill returns strict failures or reports `CAPABILITY GAP` / conscious refusal. It never fabricates floating-point guesses.
7. **Do not assume historical Geometry Reasoning Stand documents define the current contract**:
   - Canonical Skill behavior is defined by `docs/SKILL_CONTRACT.md`, `docs/AI_GEOMETRY_SKILL_PASSPORT.md`, and `HeadlessGeometrySession`.

---

## 2. Explicit Capability Boundaries & Architectural Constraints

### 1. Solution Branch Identity & BranchTree
- **Classification**: `CAPABILITY GAP`
- **Behavior**: `rootIndex` represents local parametric ordering ($t_0 < t_1$) along the directed vector from $P_1$ to $P_2$. If the vector order is reversed ($P_2 \to P_1$), `rootIndex` values swap. A persistent global `BranchTree` tracking topological branches across continuous deformations is not implemented in v1.0.0.

### 2. Materialized Intersection Snapshots vs Live Relational Entities
- **Classification**: `IMPLEMENTATION BEHAVIOR / GAP`
- **Behavior**: 
  $$\text{INTERSECT} \longrightarrow \text{Candidate Geometric Intersection} \longrightarrow \text{Materialized Point Snapshot}$$
  Points created via `intersect()` are static snapshot coordinates placed in `state.points`. Unlike macro-derived constructions (e.g., perpendicular lines from `construct()`, which dynamically update when parent vertices move), intersection points do NOT automatically recompute when their parent lines or circles are translated via `move()`.

### 3. Kinematics & Dynamic Geometry Scope
- **Classification**: `IMPLEMENTATION BEHAVIOR`
- **Behavior**: Dynamic geometry updates via `move()` are supported for:
  - Free vertices (`role: 'FREE_PRIMITIVE'`).
  - Supported direct macro dependencies (perpendicular lines, parallel lines, angle bisectors).
  - Materialized intersection points and non-macro dependent entities are **not** live relational constraints and remain fixed at their creation coordinates.

### 4. GSA Identifier Compatibility & Namespace Collision Warning
- **Classification**: `IMPLEMENTATION BEHAVIOR / GAP`
- **Behavior**: If an external agent creates free points with exact literal IDs `'A'`, `'B'`, and `'C'`, `exportSolutionArtifact()` invokes the legacy Triangle Stand projector (`projectStateToPgsPassport`), which may cause segment ID and center point mismatches during Zero-Trust import.
- **Guidance**: External agents should prefer sufficiently unique or prefixed object identifiers (for example `"P_A"`, `"P_B"`, `"P_C"`, `"seg_AB"`) rather than very generic identifiers such as `"A"`, `"B"`, `"C"`.

### 5. Artifact Identity Timestamp Determinism
- **Classification**: `CAPABILITY GAP`
- **Behavior**: The `artifactId` field in the GSA envelope uses `gsa_${Date.now()}`. Re-exporting identical geometric states yields different string envelope IDs, although the underlying PGS-2D geometry payload remains 100% analytically deterministic.

### 6. Epistemic VANISHED State Visibility
- **Classification**: `NOT REPRESENTABLE THROUGH CURRENT PUBLIC SKILL API`
- **Behavior**: Truth decay is tracked internally within the research graph layers (`VERIFIED ➔ VANISHED ➔ VERIFIED`), but the public `verify()` method returns only a boolean status (`verified: false`). The discrete status `VANISHED` is not exported through the public interface.

### 7. Arbitrary Angular Measurement
- **Classification**: `CAPABILITY GAP`
- **Behavior**: The system evaluates perpendicularity ($90^\circ$) and parallelism ($0^\circ / 180^\circ$) via analytical dot and cross products, but does not provide an arbitrary angular measurement predicate `ANGLE_VALUE`.

### 8. Stereometry (3D Solid Geometry)
- **Classification**: `CAPABILITY GAP / OUT OF SCOPE`
- **Behavior**: The system operates strictly within $\mathbb{R}^2$ Euclidean planimetry. Spatial polyhedra and 3D cross-sections cannot be represented.

### 9. Spectral Analysis Reconstruction Fidelity
- **Classification**: `IMPLEMENTATION BEHAVIOR / GAP`
- **Behavior**: Spectral passports (Fourier-based) provide derived shape descriptors (contour approximation). Exact vertex recovery from the spectral passport *alone* is not guaranteed due to reconstruction error in truncated harmonic series. Exact identity preservation is only guaranteed when using the **Hybrid Spectral-Geometric Passport** containing coordinate-bearing `Landmark`s.

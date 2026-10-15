# AI Geometry Skill — Headless API Reference (v1.0.0)

> **Class**: `HeadlessGeometrySession`  
> **Source**: `src/headless/HeadlessGeometrySession.ts`  
> **Status**: `FROZEN_RESEARCH_TOOL`  
> **Interface Version**: `Semantic Contract v0.4`

---

## 1. Class Initialization & Lifecycle

```typescript
import { HeadlessGeometrySession } from './src/headless/HeadlessGeometrySession';

const session = new HeadlessGeometrySession({ profile: 'blank' });
```

### Methods:
- **`reset(options?: HeadlessSessionOptions): CompactActionResponse`**  
  Resets the session state back to initial options (e.g. blank plane or default triangle).
- **`fork(): { success: boolean; sandboxId: string }`**  
  Creates an isolated memory copy of `FullGeometryState` for speculative exploration.
- **`rollback(sandboxId: string): CompactActionResponse`**  
  Restores `FullGeometryState` from a saved sandbox snapshot.

---

## 2. Construction Commands

- **`create_point(x: number, y: number, options?: { id?: string; name?: string; on_circle?: boolean; z?: number }): CompactActionResponse`**  
  - Creates 2D Euclidean point $(x, y)$.
  - Rejects $NaN$/$\pm\infty$ with `INVALID_NUMERIC_INPUT`.
  - Rejects duplicate ID with `DUPLICATE_ID` (state unchanged).
  - Rejects 3D / $z$ coordinate with `CAPABILITY_GAP` (state unchanged).
- **`connect(p1Id: string, p2Id: string, type: 'SEGMENT' | 'LINE'): CompactActionResponse`**  
  - Connects two points into a segment or infinite line.
  - Idempotent: repeated connections return existing entity ID without creating duplicate ghost objects (`stateChanged: false`).
- **`create_circle(centerId: string, radius: number | string): CompactActionResponse`**  
  - Constructs circle $C(O, R)$ by numerical radius or radius point ID.
- **`construct(macroType: 'PERPENDICULAR' | 'PARALLEL' | 'ANGLE_BISECTOR' | 'PERPENDICULAR_BISECTOR', params: object): CompactActionResponse`**  
  - Executes deterministic macro constructions.
- **`intersect(id1: string, id2: string): CompactActionResponse`**  
  - Solves analytical intersections (Line $\times$ Line, Line $\times$ Circle, Circle $\times$ Circle, Segment $\times$ Segment).
  - Returns array of materialized snapshot points with indexed `rootIndex: 0, 1`.
  - If disjoint (no roots): returns `success: false`, `errorCode: 'NO_INTERSECTION'`, `stateChanged: false`.

---

## 3. Kinematics

- **`move(pointId: string, x: number, y: number): CompactActionResponse`**  
  - Displaces a free vertex and cascades dependent macro constructions.
  - Materialized intersection snapshot points remain fixed at their creation coordinates.
- **`erase(entityId: string): CompactActionResponse`**  
  - Erases entity and cascades deletion to dependent children.

---

## 4. Observations

- **`observe(mode: ObservationMode, targetId?: string): ObservationResult`**  
  - **`'COMPACT'`**: Entity counts and active IDs digest.
  - **`'FULL'`**: Complete state dictionary (`points`, `segments`, `lines`, `circles`) from `FullGeometryState`.
  - **`'OBJECT'`**: Detailed analytical coordinates and role for specific entity.
  - **`'RELATIONS'`**: Extracted semantic relations.
  - **`'CONSTRAINTS'`**: Invariant checks.
  - **`'KNOWLEDGE'`**: Epistemic facts and claims.
  - **`'PROVENANCE'`**: Construction lineage history.

---

## 5. Measurements & Verifications

- **`measure(targetId: string, metricType?: string): MeasureResult`**  
  - Returns `{ success: boolean, errorCode?: HeadlessErrorCode, error?: string, records: GSAMeasurementRecord[] }`.
  - Supported metrics: `'SEGMENT_LENGTH'`, `'RADIUS'`.
  - Unsupported metric returns `success: false, errorCode: 'CAPABILITY_GAP', records: []`.
  - Non-existent entity returns `success: false, errorCode: 'ENTITY_NOT_FOUND', records: []`.
- **`verify(subjectId: string, relationType: VerificationRelationType, referenceId?: string): HeadlessVerificationResult`**  
  - Evaluates relation against receiver-owned fixed tolerance $\varepsilon = 10^{-4}$.
  - Canonical predicates: `'PERPENDICULAR_TO'`, `'PARALLEL_TO'`, `'EQUAL_LENGTH'`, `'POINT_ON_CIRCLE'`.
  - Unsupported predicate returns `verified: false, errorCode: 'CAPABILITY_GAP'`.

---

## 6. GSA / Zero-Trust Artifacts

- **`exportSolutionArtifact(options?: object): GSASolutionArtifact`**  
  - Packages active geometry, provenance DAG, and certified claims into self-describing GSA v0.1.0 container.
- **`importSolutionArtifact(artifact: GSASolutionArtifact): GSAImportReport`**  
  - Imports geometry into isolated clean session and independently evaluates all certified claims locally.
  - Mismatch or corrupted claims report `status: 'MISMATCH'`.

# AI Geometry Skill — Portable AI Skill Specification (MVP v0.1)

> **Skill Name**: `ai-geometry-skill`  
> **Version**: `1.0.0`  
> **Status**: `FROZEN_RESEARCH_TOOL`  
> **Specification**: `Portable AI Skill MVP v0.1`  
> **Entry Point**: `src/headless/HeadlessGeometrySession.ts`  
> **Core Principle**: `REASON OUTSIDE. VERIFY INSIDE.`

---

## 1. Skill Discovery & Execution Workflow

External AI agents discovering this repository through GitHub or package registries follow this deterministic verification lifecycle:

```
GitHub / Repository Root
          │
          ▼
   skill.manifest.json ─── (Parse schema, inspect declared capabilities & tolerances)
          │
          ▼
       SKILL.md ─────────── (Read epistemic invariants and boundary contracts)
          │
          ▼
Check Runtime Available?
  ├── NO ──► RUNTIME_UNAVAILABLE ──► CONSCIOUS REFUSAL (No fabricated verifications)
  │
  └── YES
       │
       ▼
     Smoke Test / Capability Audit (scripts/capability-audit.ts)
       │
       ▼
  HeadlessGeometrySession (Construct primitives, measure metrics, verify predicates)
       │
       ▼
  Deterministic Verification Result (Tool-verified fact with receiver epsilon eps = 1e-4)
```

---

## 2. Foundational Epistemic Invariants

1. **`DECLARED ≠ DISCOVERED ≠ RUNTIME_CHECKED`**:
   - Capabilities listed in `skill.manifest.json` are *DECLARED*.
   - Exported methods found in source code are *DISCOVERED*.
   - Only capabilities executed and verified through `scripts/capability-audit.ts` against the live analytical kernel are *RUNTIME_CHECKED*.
2. **`DOCUMENTED ≠ RUNTIME VERIFIED`**:
   - Reading documentation does not substitute for executing the deterministic kernel.
3. **`TOOL-VERIFIED FACT ≠ AGENT INTERPRETATION ≠ AGENT HYPOTHESIS`**:
   - `TOOL-VERIFIED FACT`: Exact analytical metric or relation evaluated by the kernel ($\varepsilon = 10^{-4}$).
   - `AGENT INTERPRETATION`: Semantic conclusion drawn by the model (e.g., "$\triangle ABC$ is a right triangle").
   - `AGENT HYPOTHESIS`: Unverified conjecture awaiting verification.
4. **`CAPABILITY_GAP ≠ FALSE`**:
   - If an operation is unsupported (e.g. 3D stereometry, arbitrary angle values), the Skill returns `CAPABILITY_GAP`, **never** `verified: false` or a hallucinated floating-point approximation.
5. **`PRODUCER CLAIM ≠ RECEIVER TRUTH`**:
   - In multi-agent pipelines, receiving agents must independently re-verify all claims locally inside an isolated session under the Zero-Trust protocol.

---

## 3. Canonical Headless Runtime Usage

```typescript
import { HeadlessGeometrySession } from './src/headless/HeadlessGeometrySession';

// 1. Initialize session on blank plane
const session = new HeadlessGeometrySession({ profile: 'blank' });

// 2. Construct geometry
session.create_point(0, 0, { id: 'P_A' });
session.create_point(4, 0, { id: 'P_B' });
session.create_point(0, 3, { id: 'P_C' });

const sAB = session.connect('P_A', 'P_B', 'SEGMENT').created[0].id;
const sAC = session.connect('P_A', 'P_C', 'SEGMENT').created[0].id;

// 3. Measure exact metrics
const mAB = session.measure(sAB, 'SEGMENT_LENGTH');
console.log(mAB.records[0].value); // 4.0

// 4. Verify relations (fixed tolerance eps = 1e-4)
const check = session.verify(sAC, 'PERPENDICULAR_TO', sAB);
console.log(check.verified); // true (diff: 0, threshold: 0.0001)

// 5. Package into GSA container
session.recordCertifiedClaim('c1', 'PERPENDICULAR_TO', sAC, sAB);
const gsa = session.exportSolutionArtifact();
```

---

## 4. Canonical Predicates & Boundaries

| Predicate | Algebraic Verification Formula | Tolerance |
|:---|:---|:---:|
| **`PERPENDICULAR_TO`** | $|\vec{v}_1 \cdot \vec{v}_2| / (\|\vec{v}_1\| \|\vec{v}_2\|) < 10^{-4}$ | $\varepsilon = 10^{-4}$ (Fixed) |
| **`PARALLEL_TO`** | $|\vec{v}_1 \times \vec{v}_2| / (\|\vec{v}_1\| \|\vec{v}_2\|) < 10^{-4}$ | $\varepsilon = 10^{-4}$ (Fixed) |
| **`EQUAL_LENGTH`** | $|l_1 - l_2| < 10^{-4}$ | $\varepsilon = 10^{-4}$ (Fixed) |
| **`POINT_ON_CIRCLE`** | $|\|P - O\| - R| < 10^{-4}$ | $\varepsilon = 10^{-4}$ (Fixed) |

### Explicit Capability Boundaries (`CAPABILITY_GAP`):
- **3D Solid Geometry**: Out of scope (Planar 2D only).
- **Arbitrary Angular Measurement**: Only $90^\circ$ and $0^\circ/180^\circ$ verified; `ANGLE_VALUE` is a capability gap.
- **Compound Polygons**: Handled as sets of segments.
- **Intersection Snapshots**: `intersect()` produces static snapshots, not live reactive constraints.

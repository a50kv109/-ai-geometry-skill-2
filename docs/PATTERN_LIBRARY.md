# Geometric Reasoning Pattern Palette (GRPP) — Audit Summary

> **Status**: `FROZEN v1.0.0`  
> **Source Directory**: [`docs/patterns/`](./patterns/)

---

## 1. Audited Pattern Register

| Pattern ID | Pattern Title | Status in v1.0.0 | Empirical Evidence |
|:---|:---|:---:|:---|
| **PAT-06** | Construction $\neq$ Constraint | `VERIFIED` | Macros restore constraints on drag; intersections create static points. |
| **PAT-09** | State $\neq$ Topology | `VERIFIED` | Vertex coordinates mutate; entity incidence graph remains stable. |
| **PAT-13** | Layer-Specific Blast Radius | `VERIFIED` | Coordinate mutation radius diverges from relational truth radius. |
| **PAT-14** | Topological Elasticity | `PARTIAL` | Active for macro constructions; inactive for ad-hoc intersections. |
| **PAT-15** | Solution Branch Preservation | `PARTIAL` | All algebraic roots preserved, but rootIndex is local parametric order. |
| **PAT-21** | Experiment ➔ Observation ➔ Candidate | `VERIFIED` | Successfully demonstrated across Phase 4 and Phase 6 research cycles. |
| **PAT-26** | Object Identity $\neq$ Representation | `VERIFIED` | Points with identical coordinates $(0, 5)$ exhibit distinct lifecycle semantics. |
| **PAT-CANDIDATE** | Materialized Snapshot $\neq$ Live Entity | `CANDIDATE` | Empirically verified on Perpendicular Bisector vs Line-Circle Intersect. |

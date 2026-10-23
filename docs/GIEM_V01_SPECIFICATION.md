# Geometric Invariant Evaluation Module (GIEM v0.1) — Specification

> **Module Version**: `0.1.0`  
> **Status**: `FROZEN_FOR_AUDIT`  
> **System Scope**: `AI Geometry Skill v1.0.0`  
> **Architectural Role**: Isolated Deterministic Analytical & Invariant Verification Engine  
> **Epistemic Invariant**: "The agent may be wrong. The stand must not be."

---

## 1. Executive Summary & Purpose

The **Geometric Invariant Evaluation Module (GIEM)** is a high-assurance, deterministic evaluation engine designed for the AI Geometry Skill. GIEM provides formal algebraic generators, coordinate-level invariant evaluators, and zero-trust independent auditing routines for Euclidean geometry.

*Nomenclature Note*: In preliminary working drafts and early development iterations, the module was occasionally referred to as the "Geometric Invariant Engineering Module". The canonical, official project nomenclature is **Geometric Invariant Evaluation Module (GIEM)**.

GIEM v0.1 implements three core geometric contracts:
1. **Contract C1 (`PythagoreanTripleGenerator`)**: Exact integer generation and verification of primitive Pythagorean triples using arbitrary-precision `BigInt` arithmetic.
2. **Contract C2 / C2.1 (`RightTriangleCircumcenter`)**: Thales' circumcenter calculation and independent equidistance auditing for right-angled triangles under a hardened mixed absolute/relative numerical tolerance policy.
3. **Contract C3 (`TriangleAreaInvariant`)**: Geometric area ratio invariant verification ($A_{\text{rectangle}} / A_{\text{triangle}} = 1/2$) comparing exact analytical formulas against independent coordinate-level Gauss Shoelace polygon area calculations.

---

## 2. Epistemic Isolation & Architectural Boundaries

GIEM adheres strictly to the architectural invariants defined in `docs/ARCHITECTURE.md` and the AI Coding Agent Guidelines:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Geometry Skill Kernel                        │
│                                                                        │
│   src/kernel/canonicalPaths.ts             src/kernel/navigator.ts     │
│   CANONICAL_GRAPH (Frozen 30 Paths)        Deterministic Navigator     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Epistemic Firewall (Zero Mutation)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Canonical Runtime Session / Facade                    │
│                                                                        │
│   src/headless/HeadlessGeometrySession.ts (Canonical External API)     │
│   src/environment/GeometryEnvironment.ts  (Stand Facade)               │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ (Level C: Not Integrated)
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                   GIEM v0.1 (Isolated Engine)                          │
│                                                                        │
│   src/engines/giem/                                                    │
│   ├── contracts/types.ts           (Standard InvariantAuditReport)     │
│   ├── bridges/BigIntNumberBridge.ts (Safe Integer Conversion)          │
│   ├── utils/gcd.ts                 (Euclidean algorithm with % on BigInt)
│   ├── generators/PythagoreanTripleGenerator.ts (Contract C1)          │
│   ├── invariants/RightTriangleCircumcenter.ts  (Contract C2/C2.1)      │
│   ├── invariants/TriangleAreaInvariant.ts      (Contract C3)           │
│   └── tests/                                                           │
└────────────────────────────────────────────────────────────────────────┘
```

### Invariants Maintained:
1. **Zero Kernel Mutation**: GIEM code does not modify, import into, or mutate `src/kernel/canonicalPaths.ts`, `src/kernel/navigator.ts`, or `CANONICAL_GRAPH`.
2. **Unpolluted Runtime**: GIEM is not wired into `HeadlessGeometrySession` or the React visual client in v0.1.
3. **No External Side-Effects**: Pure deterministic calculations with zero network I/O, zero asynchronous operations, and zero random/probabilistic approximations.

---

## 3. Integration Level Architecture (A / B / C Taxonomy)

To prevent ambiguity between code completion and runtime enablement, GIEM distinguishes three levels of architectural integration:

| Integration Level | Description | Status in GIEM v0.1 | Evidence |
| :--- | :--- | :--- | :--- |
| **Level A: Codebase Presence** | Code exists, types compile, unit tests execute in isolation. | **ACTIVE (PASS)** | All files exist in `src/engines/giem/`, 100% test pass (C1: 11/11, C2: 7/7, C3: 28/28). |
| **Level B: Explicit Path Import** | Modules can be imported by explicit path into standalone test harnesses or scripts. | **ACTIVE (AVAILABLE)** | Modules can be imported via project root alias (`import { TriangleAreaInvariant } from '@/src/engines/giem/invariants/TriangleAreaInvariant'`) or relative path (`../engines/giem/...`). Bare non-relative specifiers without `@/` or `./` are not resolved under bundler module resolution. No barrel `index.ts` is exported to prevent accidental namespace leakage. |
| **Level C: Runtime / Public API Integration** | Connected to `HeadlessGeometrySession`, exported in public manifests, exposed to interactive UI, or embedded in GSA export. | **NOT INTEGRATED (FROZEN)** | `HeadlessGeometrySession.ts` contains 0 references to `giem`. No UI bindings exist. Intentionally withheld to guarantee epistemic isolation. |

---

## 4. Common Contracts & Reporting Schema

### 4.1. Status Codes (`GIEMStatus`)

All GIEM evaluation and audit routines return a standardized `GIEMStatus` enum value:

```typescript
export type GIEMStatus =
  | 'PASS'                    // Invariant holds and all preconditions/audits passed
  | 'INVALID_PARAMETER'       // Input failed mathematical preconditions (e.g. non-coprime, degenerate)
  | 'INVARIANT_VIOLATION'     // Geometric or algebraic invariant violated by candidate
  | 'NUMERIC_RANGE_EXCEEDED'  // Coordinate or value exceeds safe operating bounds
  | 'CAPABILITY_GAP'          // Operation outside current analytical capabilities
  | 'NOT_VERIFIED'            // Verification could not be finalized
  | 'INTERNAL_ERROR';         // Unexpected numerical or algorithmic fault
```

### 4.2. Invariant Audit Report Schema (`InvariantAuditReport`)

Every GIEM invariant implementation provides an independent `audit()` method returning a structured audit certificate:

```typescript
export interface InvariantAuditReport {
  contractId: string;
  status: GIEMStatus;
  inputSummary: Record<string, unknown>;
  preconditions: { passed: boolean; details?: string };
  primaryResult: unknown;
  auditResult: { passed: boolean; discrepancy?: number; details?: string };
  tolerancePolicy: TolerancePolicy;
  failureReason?: string;
  evidence: Record<string, unknown>;
  limitations: string[];
}
```

### 4.3. BigInt-to-Number Bridge (`BigIntNumberBridge`)

To protect IEEE-754 floating-point calculations from silent precision degradation when transitioning from exact `BigInt` arithmetic:
- **Safe Integer Bounds**: Values must strictly satisfy $\text{Number.MIN\_SAFE\_INTEGER} \le n \le \text{Number.MAX\_SAFE\_INTEGER}$ (i.e. $|n| \le 2^{53} - 1$). Values outside this range return `NUMERIC_RANGE_EXCEEDED`.
- **Coordinate Limit**: `validateCoordinateBounds(val, maxCoord = 1000000n)` enforces a conservative geometric limit to maintain numerical stability during subsequent coordinate transformations.

---

## 5. Specification of Geometric Contracts

### 5.1. Contract C1: Pythagorean Triple Generator (`PythagoreanTripleGenerator`)

- **Source**: `src/engines/giem/generators/PythagoreanTripleGenerator.ts`
- **Arithmetic**: 100% exact `BigInt` (zero floating-point error).
- **Mathematical Basis**: Euclid's Formula for primitive Pythagorean triples:
  $$a = m^2 - n^2, \quad b = 2mn, \quad c = m^2 + n^2$$
- **Preconditions**:
  1. Strict order and positivity: $m > n > 0$.
  2. Coprimality: $\gcd(m, n) = 1$ (computed via the Euclidean algorithm using modulo division `%` on `BigInt` in `src/engines/giem/utils/gcd.ts`).
  3. Opposite parity: $(m - n) \not\equiv 0 \pmod 2$.
- **Independent Auditor (`PythagoreanTripleGenerator.audit`)**:
  - Validates preconditions on parameters $m$ and $n$ ($m > n > 0$, $\gcd(m, n) = 1$, and $(m - n) \not\equiv 0 \pmod 2$).
  - Verifies strict positivity of sides: $a > 0, b > 0, c > 0$.
  - Independently verifies the exact algebraic Pythagorean identity: $a^2 + b^2 = c^2$.
  - Independently verifies primitivity of the triple: $\gcd(a, b, c) = 1$ (computed via `bigintGcdThree`).
  - *Scope clarification*: The auditor checks whether the target candidate $(a, b, c)$ is a valid primitive Pythagorean triple in the `BigInt` domain. In GIEM v0.1, it does not explicitly assert side-by-side component equality against $(m^2-n^2, 2mn, m^2+n^2)$; it verifies the mathematical invariant and primitivity properties.

---

### 5.2. Contract C2 / C2.1: Right Triangle Circumcenter (`RightTriangleCircumcenter`)

- **Source**: `src/engines/giem/invariants/RightTriangleCircumcenter.ts`
- **Arithmetic**: IEEE-754 Floating-Point with Hardened Mixed Tolerances.
- **Mathematical Basis**: Thales' Theorem — In a right-angled triangle $ABC$ with right angle at $B$, the circumcenter $M$ coincides with the midpoint of the hypotenuse $AC$:
  $$M = \left(\frac{A_x + C_x}{2}, \frac{A_y + C_y}{2}\right)$$
  Radius squared: $R^2 = \frac{\|AC\|^2}{4}$.

#### Numerical Constants & Tolerances:
- `MAX_COORD = 100000`: Coordinates outside $[-100000, 100000]$ or non-finite values return `NUMERIC_RANGE_EXCEEDED`.
- `MIN_LEG_SQ = 1e-12`: Triangles with leg squared length $\|BA\|^2 < 10^{-12}$ or $\|BC\|^2 < 10^{-12}$ are rejected as degenerate.
- `EPSILON_ABS = 1e-7`: Base absolute comparison threshold.
- `EPSILON_REL = 1e-6`: Base relative comparison threshold.

#### Hardened Scale-Dependent Verification:
1. **Right Angle Verification**: The dot product $\vec{BA} \cdot \vec{BC}$ must be zero within a scale-adjusted tolerance:
   $$|\vec{BA} \cdot \vec{BC}| \le \varepsilon_{\text{abs}} + \varepsilon_{\text{rel}} \cdot \max(\|\vec{BA}\|^2, \|\vec{BC}\|^2)$$
2. **Equidistance Invariant (Zero-Trust Candidate Audit)**:
   For circumcenter candidate $M$, distances to all three vertices must equal $R^2$:
   $$|\|MA\|^2 - R^2| \le \text{tol}(R^2), \quad |\|MB\|^2 - R^2| \le \text{tol}(R^2), \quad |\|MC\|^2 - R^2| \le \text{tol}(R^2)$$
   where $\text{tol}(R^2) = \varepsilon_{\text{abs}} + \varepsilon_{\text{rel}} \cdot R^2$.
   Any tampered, shifted, or invalid candidate is flagged as `INVARIANT_VIOLATION`.

---

### 5.3. Contract C3: Triangle Area Invariant (`TriangleAreaInvariant`)

- **Source**: `src/engines/giem/invariants/TriangleAreaInvariant.ts`
- **Arithmetic**: IEEE-754 Floating-Point with Dual-Path Validation.
- **Mathematical Basis**: For any right triangle with vertices $O = (0, 0)$, $X = (a, 0)$, $Y = (0, b)$ where $a > 0, b > 0$:
  - Area of triangle: $A_{\text{triangle}} = \frac{ab}{2}$.
  - An inscribed rectangle with vertices $O = (0, 0)$, $P = (a/2, 0)$, $Q = (a/2, b/2)$, $T = (0, b/2)$ has area:
    $$A_{\text{rectangle}} = \frac{a}{2} \cdot \frac{b}{2} = \frac{ab}{4}$$
  - Fundamental invariant ratio:
    $$\frac{A_{\text{rectangle}}}{A_{\text{triangle}}} = \frac{ab/4}{ab/2} = \frac{1}{2} = 0.5$$

#### Numerical Constants & Bounds:
- `MIN_SIDE = 1e-6`: Minimal side length ($a \ge 10^{-6}, b \ge 10^{-6}$) to avoid catastrophic cancellation and micro-scale precision loss.
- `MAX_COORD = 100000`: Maximum parameter dimension.
- `EXPECTED_RATIO = 0.5`: The invariant constant.
- `EPSILON_ABS = 1e-7`, `EPSILON_REL = 1e-6`: Dual tolerance policy.

#### Dual-Path Verification Protocol:
1. **Analytical Evaluation Path**: Computes $A_{\text{triangle}} = ab/2$, $A_{\text{rect}} = ab/4$, and $\text{ratio} = A_{\text{rect}} / A_{\text{triangle}}$.
2. **Independent Geometric Coordinate Path**:
   - Calculates polygon area from raw vertex coordinates using Gauss's Shoelace formula:
     $$A_{\text{shoelace}} = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$
   - Verified on $\triangle OXY$ and quadrilateral $OPQT$.
   - Validates that $P, Q, T$ match midpoint coordinates $(a/2, 0), (a/2, b/2), (0, b/2)$ within mixed tolerance.
3. **Zero-Trust Candidate Audit**:
   Detects false claims, falsified area numbers, tampered ratio values, or distorted vertex coordinates.

---

## 6. Numerical Policy & IEEE-754 Precision Discipline

| Realm | Domain | Approach | Rationale |
| :--- | :--- | :--- | :--- |
| **Number Theory / Triples** | Contract C1 | Exact `BigInt` | Integers cannot suffer floating-point roundoff; coprimality and parity are strictly algebraic. |
| **Coordinate Geometry** | Contracts C2, C3 | Mixed Absolute & Relative Floating-Point | Absolute tolerance alone fails at large coordinate scales; relative tolerance alone fails near zero. |
| **Cross-Boundary Conversions** | Bridge | Strict Guardrails (`BigIntNumberBridge`) | Forbids numbers above $2^{53} - 1$; prevents silent integer truncation when passing parameters. |

### The Mixed Tolerance Formula
For comparing measured quantity $V_{\text{actual}}$ against expected quantity $V_{\text{expected}}$:
$$\Delta = |V_{\text{actual}} - V_{\text{expected}}|$$
$$\text{Tolerance}(V_{\text{expected}}) = \varepsilon_{\text{abs}} + \varepsilon_{\text{rel}} \cdot |V_{\text{expected}}|$$
$$\text{Condition: } \Delta \le \text{Tolerance}(V_{\text{expected}})$$

This prevents false rejections across scales ranging from $10^{-6}$ to $10^{5}$.

---

## 7. Verification Baseline & Test Audit Summary

### 7.1. Test Execution Commands & Structure
The project `package.json` contains no generic `test` or `npm test` script. Furthermore, `npm run test:all` executes the 31 core regression suites and deliberately excludes GIEM suites to maintain strict Level C isolation.

GIEM unit and invariant tests are executed directly via `npx tsx` without modifying `package.json`:

```bash
# 1. GIEM Standalone Test Suites (Executed via npx tsx)
npx tsx src/engines/giem/tests/giem_staged.test.ts    # PASS (11/11 tests, 100%)
npx tsx src/engines/giem/tests/circumcenter.test.ts   # PASS (7/7 tests, 100%)
npx tsx src/engines/giem/tests/areaRatio.test.ts      # PASS (28/28 tests, 100%)
# Total GIEM standalone tests: 46/46 passed (100%)
```

### 7.2. Project Regression Baseline
All core system regression baselines continue to pass unconditionally:

```bash
# 2. Kernel Invariant Baseline (Canonical Graph)
npm run test:kernel                                  # PASS (74/74 tests, 100%)

# 3. Environment Contract Baseline (Stand Facade & Isolation)
npm run test:env                                     # PASS (18/18 tests, 100%)

# 4. Project Full Regression Suite
npm run test:all                                     # PASS (31/31 suites, 100%)

# 5. Typecheck & Build
npm run lint                                         # PASS (tsc --noEmit, 0 errors)
npm run build                                        # PASS (Clean bundle generation)
```

---

## 8. Capability Gaps & Roadmap to Public Release

Before GIEM can be promoted from an isolated analytical engine to a public-facing skill component, the following checklist must be satisfied:

1. **Stage C4 Decision (Aggregate Orchestrator / Multi-Invariant Verifier)**:
   - Determine whether a unified multi-contract auditor is required or whether contracts remain individual domain evaluators.
2. **Level C Public Surface Decision**:
   - Determine whether `HeadlessGeometrySession` should receive optional invariant audit adapters (e.g. `session.auditInvariant(contractId, params)`), or whether GIEM should remain strictly an out-of-band analytical verifier.
3. **Packaging / Export Decision**:
   - Determine whether to expose an explicit barrel export (`src/engines/giem/index.ts`) in `package.json` exports or maintain subpath imports.
4. **Zero-Trust GSA Integration**:
   - If GIEM invariants are to be included in GSA Solution Artifacts (`docs/GSA_SPECIFICATION.md`), define the certified claim predicate schema for GIEM proofs.

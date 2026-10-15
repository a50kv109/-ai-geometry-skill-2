# Geometry Verification Stand — Environment Contract (LEGACY)

> **Document Status**: `LEGACY / HISTORICAL ENVIRONMENT API`  
> **Notice for External AI Agents**: `HeadlessGeometrySession` (`src/headless/HeadlessGeometrySession.ts`) is the **sole canonical headless runtime API** for AI Geometry Skill v1.0.0.  
> `GeometryEnvironment` is preserved strictly for historical lineage and baseline contract test suites. External agents should refer to [`docs/SKILL_CONTRACT.md`](./SKILL_CONTRACT.md) for current public API operations.

---

This document specifies the legacy interface and operational contract provided by `GeometryEnvironment` (`src/environment/GeometryEnvironment.ts`).

---

## 1. Interface Specification

```typescript
export interface IGeometryEnvironment {
  // Lifecycle & State
  reset(initialState?: FactMap): StateObservation;
  observe(): StateObservation;
  setMode(mode: EnvironmentMode): void;
  getMode(): EnvironmentMode;

  // Oracle Solve
  solve(target: string): DerivationTrace;

  // Step Deduction
  step(ruleId: string): StepActionResult;

  // Numerical Verification
  verifyResult(
    target: string,
    proposedValue: number | string | boolean,
    tolerance?: number
  ): ResultVerificationReport;

  // Claim Predicate Verification
  verifyClaim(
    claimDescription: string,
    predicate: (facts: FactMap) => { valid: boolean; evidence: string; details?: any }
  ): ClaimVerificationReport;
}
```

---

## 2. Operation Semantics

### `reset(initialState?)`
- **State Change**: Resets `stepCount` to 0, clears `appliedRulesHistory`, and reinitializes known facts.
- **Returns**: Fresh `StateObservation`.

### `observe()`
- **State Change**: None. Strictly deterministic and idempotent.
- **Observation Boundary**:
  - `AGENT` mode: Only returns primary configuration (`R`, angles, coordinates). Conceals intermediate or target derived values.
  - `LEARNER` / `DEBUG` mode: Returns all current facts including intermediate derived facts.

### `solve(target)`
- **State Change**: None.
- **Action**: Runs the deterministic canonical graph solver.
- **Returns**: Full `DerivationTrace` detailing candidate paths, precondition checks, selected route, and final output.

### `step(ruleId)`
- **State Change**: If valid, updates known facts with `rule.provides = value`, increments `stepCount`, and appends `ruleId` to history.
- **Validation**:
  1. `UNKNOWN_STEP` if `ruleId` is not in canonical graph.
  2. `MISSING_INPUT` if required fact inputs are not in current known facts.
  3. `PRECONDITION_FAILED` if rule precondition evaluates to `false`.
  4. `VALID` if inputs present and precondition passes.

### `verifyResult(target, proposedValue, tolerance = 0.001)`
- **State Change**: None.
- **Action**: Solves `target` via canonical oracle and compares against `proposedValue`.
- **Status**:
  - `MATCH`: Difference $\le \text{tolerance}$.
  - `MISMATCH`: Difference $> \text{tolerance}$.
  - `INVALID_TARGET`: Target unsolvable from current state.

### `verifyClaim(claimDescription, predicate)`
- **State Change**: None.
- **Action**: Evaluates user-supplied or agent-supplied predicate against current ground truth state.
- **Status**:
  - `VALID`: Predicate returned `valid: true`.
  - `FALSIFIED`: Predicate returned `valid: false`.
  - `INSUFFICIENT_DATA`: Exception thrown or missing parameters.

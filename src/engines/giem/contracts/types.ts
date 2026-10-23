// src/engines/giem/contracts/types.ts
// GIEM v0.1 - Contract Types & InvariantAuditReport Schema

export type GIEMStatus =
  | 'PASS'
  | 'INVALID_PARAMETER'
  | 'INVARIANT_VIOLATION'
  | 'NUMERIC_RANGE_EXCEEDED'
  | 'CAPABILITY_GAP'
  | 'NOT_VERIFIED'
  | 'INTERNAL_ERROR';

export interface TolerancePolicy {
  epsilon: number;
  mode: 'ABSOLUTE' | 'RELATIVE' | 'EXACT_BIGINT';
}

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

export interface PythagoreanTriple {
  a: bigint;
  b: bigint;
  c: bigint;
}

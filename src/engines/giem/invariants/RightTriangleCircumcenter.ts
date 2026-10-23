// src/engines/giem/invariants/RightTriangleCircumcenter.ts
// Right Triangle Circumcenter Invariant & Auditor (C2) - Hardened Numeric Tolerance

import { InvariantAuditReport, GIEMStatus } from '../contracts/types';

export interface Point2D {
  x: number;
  y: number;
}

export class RightTriangleCircumcenter {
  // Hardened numerical tolerance policy for v0.1
  private static readonly EPSILON_ABS = 1e-7;
  private static readonly EPSILON_REL = 1e-6;
  private static readonly MIN_LEG_SQ = 1e-12; // Minimum squared leg length to prevent degenerate zero-division or micro-scaling issues
  private static readonly MAX_COORD = 100000;   // Conservative geo-kernel coordinate limit

  /**
   * Validates if a point coordinate is finite and within safe operating bounds.
   */
  private static isValidCoordinate(p: Point2D): boolean {
    return (
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      Math.abs(p.x) <= this.MAX_COORD &&
      Math.abs(p.y) <= this.MAX_COORD
    );
  }

  /**
   * Computes the circumcenter M (midpoint of hypotenuse AC) for a right triangle with right angle at B.
   */
  public static compute(A: Point2D, B: Point2D, C: Point2D): Point2D {
    if (!this.isValidCoordinate(A) || !this.isValidCoordinate(B) || !this.isValidCoordinate(C)) {
      throw new Error('NUMERIC_RANGE_EXCEEDED: Coordinates are non-finite or exceed safe bounds.');
    }

    const mx = (A.x + C.x) / 2;
    const my = (A.y + C.y) / 2;

    if (!Number.isFinite(mx) || !Number.isFinite(my)) {
      throw new Error('NUMERIC_RANGE_EXCEEDED: Circumcenter calculation produced non-finite result.');
    }

    return { x: mx, y: my };
  }

  /**
   * Performs an independent audit of the circumcenter invariant for a right triangle ABC (right angle at B).
   */
  public static audit(A: Point2D, B: Point2D, C: Point2D, candidateM?: Point2D): InvariantAuditReport {
    const inputSummary = { A, B, C, candidateM };

    // 1. Precondition checks: Finite coordinates and safe range
    const finiteA = this.isValidCoordinate(A);
    const finiteB = this.isValidCoordinate(B);
    const finiteC = this.isValidCoordinate(C);

    if (!finiteA || !finiteB || !finiteC) {
      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status: 'NUMERIC_RANGE_EXCEEDED',
        inputSummary,
        preconditions: { passed: false, details: 'Coordinates are non-finite or exceed MAX_COORD limits.' },
        primaryResult: null,
        auditResult: { passed: false, details: 'Precondition failed due to numerical range.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Coordinates exceed safe numerical range or are non-finite.',
        evidence: { finiteA, finiteB, finiteC },
        limitations: ['Evaluated in IEEE 754 Number domain with mixed absolute/relative tolerance.'],
      };
    }

    // 2. Precondition checks: Non-degenerate legs and right angle at B
    const vBA = { x: A.x - B.x, y: A.y - B.y };
    const vBC = { x: C.x - B.x, y: C.y - B.y };

    const lenBASq = vBA.x * vBA.x + vBA.y * vBA.y;
    const lenBCSq = vBC.x * vBC.x + vBC.y * vBC.y;

    if (!Number.isFinite(lenBASq) || !Number.isFinite(lenBCSq)) {
      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status: 'NUMERIC_RANGE_EXCEEDED',
        inputSummary,
        preconditions: { passed: false, details: 'Intermediate overflow in leg length calculation.' },
        primaryResult: null,
        auditResult: { passed: false, details: 'Non-finite intermediate calculation.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Intermediate numeric overflow.',
        evidence: { lenBASq, lenBCSq },
        limitations: [],
      };
    }

    if (lenBASq < this.MIN_LEG_SQ || lenBCSq < this.MIN_LEG_SQ) {
      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status: 'INVALID_PARAMETER',
        inputSummary,
        preconditions: { passed: false, details: 'Degenerate triangle: one or both legs have near-zero or zero length.' },
        primaryResult: null,
        auditResult: { passed: false, details: 'Micro or zero leg length detected.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Degenerate triangle geometry.',
        evidence: { lenBASq, lenBCSq },
        limitations: [],
      };
    }

    // Right angle check at B: dot product BA . BC == 0 with scaled tolerance
    const dotProduct = vBA.x * vBC.x + vBA.y * vBC.y;
    if (!Number.isFinite(dotProduct)) {
      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status: 'NUMERIC_RANGE_EXCEEDED',
        inputSummary,
        preconditions: { passed: false, details: 'Non-finite intermediate dot product.' },
        primaryResult: null,
        auditResult: { passed: false, details: 'Overflow in dot product.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Numeric overflow in angle check.',
        evidence: {},
        limitations: [],
      };
    }

    const maxLegLen = Math.sqrt(Math.max(lenBASq, lenBCSq));
    const rightAngleTolerance = this.EPSILON_ABS + this.EPSILON_REL * maxLegLen * maxLegLen;
    const isRightAngleAtB = Math.abs(dotProduct) <= rightAngleTolerance;

    if (!isRightAngleAtB) {
      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status: 'INVALID_PARAMETER',
        inputSummary,
        preconditions: { passed: false, details: `Angle at B is not 90 degrees. Dot product: ${dotProduct}, tolerance: ${rightAngleTolerance}` },
        primaryResult: null,
        auditResult: { passed: false, details: 'Not a right triangle with right angle at B.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Triangle is not right-angled at B.',
        evidence: { dotProduct, rightAngleTolerance },
        limitations: [],
      };
    }

    try {
      const primaryM = this.compute(A, B, C);
      const M = candidateM || primaryM;

      if (!this.isValidCoordinate(M)) {
        return {
          contractId: 'C2_CIRCUMCENTER_INVARIANT',
          status: 'NUMERIC_RANGE_EXCEEDED',
          inputSummary,
          preconditions: { passed: true },
          primaryResult: null,
          auditResult: { passed: false, details: 'Circumcenter coordinates exceed safe range.' },
          tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
          failureReason: 'Circumcenter out of bounds.',
          evidence: { M },
          limitations: [],
        };
      }

      // Independent audit calculations:
      const vAC = { x: C.x - A.x, y: C.y - A.y };
      const lenACSq = vAC.x * vAC.x + vAC.y * vAC.y;
      const expectedSqRadius = lenACSq / 4.0;

      // Independent distance squared checks from M to A, B, C
      const dMASq = (M.x - A.x) * (M.x - A.x) + (M.y - A.y) * (M.y - A.y);
      const dMBSq = (M.x - B.x) * (M.x - B.x) + (M.y - B.y) * (M.y - B.y);
      const dMCSq = (M.x - C.x) * (M.x - C.x) + (M.y - C.y) * (M.y - C.y);

      if (!Number.isFinite(expectedSqRadius) || !Number.isFinite(dMASq) || !Number.isFinite(dMBSq) || !Number.isFinite(dMCSq)) {
        return {
          contractId: 'C2_CIRCUMCENTER_INVARIANT',
          status: 'NUMERIC_RANGE_EXCEEDED',
          inputSummary,
          preconditions: { passed: true },
          primaryResult: primaryM,
          auditResult: { passed: false, details: 'Non-finite value in squared distance audit.' },
          tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
          failureReason: 'Numeric overflow in distance audit.',
          evidence: {},
          limitations: [],
        };
      }

      // Mixed absolute and relative tolerance policy for squared distance comparisons
      const scaleA = Math.max(1.0, Math.abs(dMASq), Math.abs(expectedSqRadius));
      const scaleB = Math.max(1.0, Math.abs(dMBSq), Math.abs(expectedSqRadius));
      const scaleC = Math.max(1.0, Math.abs(dMCSq), Math.abs(expectedSqRadius));

      const tolA = this.EPSILON_ABS + this.EPSILON_REL * scaleA;
      const tolB = this.EPSILON_ABS + this.EPSILON_REL * scaleB;
      const tolC = this.EPSILON_ABS + this.EPSILON_REL * scaleC;

      const errA = Math.abs(dMASq - expectedSqRadius);
      const errB = Math.abs(dMBSq - expectedSqRadius);
      const errC = Math.abs(dMCSq - expectedSqRadius);

      const passA = errA <= tolA;
      const passB = errB <= tolB;
      const passC = errC <= tolC;

      const auditPassed = passA && passB && passC;
      const status: GIEMStatus = auditPassed ? 'PASS' : 'INVARIANT_VIOLATION';

      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status,
        inputSummary,
        preconditions: { passed: true, details: 'All geometric and hardened numerical preconditions passed.' },
        primaryResult: primaryM,
        auditResult: {
          passed: auditPassed,
          discrepancy: Math.max(errA / scaleA, errB / scaleB, errC / scaleC),
          details: `errA: ${errA} (tol: ${tolA}), errB: ${errB} (tol: ${tolB}), errC: ${errC} (tol: ${tolC})`,
        },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: auditPassed ? undefined : 'Circumcenter invariant violated: squared distance discrepancy exceeds mixed absolute/relative tolerance.',
        evidence: {
          dMASq,
          dMBSq,
          dMCSq,
          expectedSqRadius,
          errA,
          errB,
          errC,
          tolA,
          tolB,
          tolC,
          dotProduct,
        },
        limitations: ['Evaluated in IEEE 754 Number domain with mixed tolerance (eps_abs=1e-7, eps_rel=1e-6).'],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        contractId: 'C2_CIRCUMCENTER_INVARIANT',
        status: message.includes('NUMERIC_RANGE') ? 'NUMERIC_RANGE_EXCEEDED' : 'INTERNAL_ERROR',
        inputSummary,
        preconditions: { passed: true },
        primaryResult: null,
        auditResult: { passed: false, details: message },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: message,
        evidence: {},
        limitations: [],
      };
    }
  }
}

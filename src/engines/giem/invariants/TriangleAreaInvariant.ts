// src/engines/giem/invariants/TriangleAreaInvariant.ts
// Triangle Area Ratio Invariant & Auditor (C3) - GIEM v0.1

import { InvariantAuditReport, GIEMStatus } from '../contracts/types';

export interface Point2D {
  x: number;
  y: number;
}

export interface RectangleVertices {
  O: Point2D;
  P: Point2D;
  Q: Point2D;
  T: Point2D;
}

export interface TriangleAreaResult {
  triangleArea: number;
  rectangleArea: number;
  ratio: number;
  vertices: RectangleVertices;
}

export interface CandidateAreaVerification {
  triangleArea?: number;
  rectangleArea?: number;
  ratio?: number;
  vertices?: Partial<RectangleVertices>;
}

export class TriangleAreaInvariant {
  // Hardened numerical tolerance policy for v0.1 (consistent with C2.1)
  public static readonly EPSILON_ABS = 1e-7;
  public static readonly EPSILON_REL = 1e-6;
  public static readonly MIN_SIDE = 1e-6;       // Minimum positive side length to prevent micro-scale underflow
  public static readonly MAX_COORD = 100000;     // Safe coordinate limit for geo-kernel operations
  public static readonly EXPECTED_RATIO = 0.5;  // 1/2 invariant

  /**
   * Validates if parameter is within safe operating coordinate bounds and finite.
   */
  private static isValidNumber(val: number): boolean {
    return Number.isFinite(val) && Math.abs(val) <= this.MAX_COORD;
  }

  /**
   * Calculates polygon area using the Shoelace formula (Gauss's area formula).
   */
  public static shoelaceArea(points: Point2D[]): number {
    let sum = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const curr = points[i];
      const next = points[(i + 1) % n];
      sum += curr.x * next.y - next.x * curr.y;
    }
    return Math.abs(sum) / 2.0;
  }

  /**
   * Computes the areas and ratio for a right triangle OXY and its inscribed rectangle OPQT.
   * O = (0, 0), X = (a, 0), Y = (0, b)
   * Rectangle vertices: O(0,0), P(a/2, 0), Q(a/2, b/2), T(0, b/2)
   */
  public static compute(a: number, b: number): TriangleAreaResult {
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > this.MAX_COORD || Math.abs(b) > this.MAX_COORD) {
      throw new Error('NUMERIC_RANGE_EXCEEDED: Parameters a or b exceed safe bounds or are non-finite.');
    }

    if (a <= 0 || b <= 0 || a < this.MIN_SIDE || b < this.MIN_SIDE) {
      throw new Error(`INVALID_PARAMETER: Sides a and b must be strictly positive and >= ${this.MIN_SIDE}.`);
    }

    const triangleArea = (a * b) / 2.0;
    const rectangleArea = (a * b) / 4.0;
    const ratio = rectangleArea / triangleArea;

    if (!Number.isFinite(triangleArea) || !Number.isFinite(rectangleArea) || !Number.isFinite(ratio)) {
      throw new Error('NUMERIC_RANGE_EXCEEDED: Intermediate calculation produced non-finite values.');
    }

    const vertices: RectangleVertices = {
      O: { x: 0, y: 0 },
      P: { x: a / 2.0, y: 0 },
      Q: { x: a / 2.0, y: b / 2.0 },
      T: { x: 0, y: b / 2.0 },
    };

    return {
      triangleArea,
      rectangleArea,
      ratio,
      vertices,
    };
  }

  /**
   * Performs an independent audit of the C3 Triangle Area Invariant.
   * - Uses independent Shoelace integration over polygon vertices.
   * - Validates against the theoretical ratio of 1/2 using mixed absolute/relative tolerance.
   * - Protects against false PASS by checking optional candidate results/vertices.
   */
  public static audit(
    a: number,
    b: number,
    candidate?: CandidateAreaVerification
  ): InvariantAuditReport {
    const inputSummary = { a, b, candidate };

    // 1. Numerical finiteness and range checks
    const finiteA = Number.isFinite(a);
    const finiteB = Number.isFinite(b);
    const inRangeA = finiteA && Math.abs(a) <= this.MAX_COORD;
    const inRangeB = finiteB && Math.abs(b) <= this.MAX_COORD;

    if (!inRangeA || !inRangeB) {
      return {
        contractId: 'C3_AREA_RATIO_INVARIANT',
        status: 'NUMERIC_RANGE_EXCEEDED',
        inputSummary,
        preconditions: { passed: false, details: `Parameters exceed safe range [${-this.MAX_COORD}, ${this.MAX_COORD}] or are non-finite.` },
        primaryResult: null,
        auditResult: { passed: false, details: 'Precondition failed due to numerical range.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Parameters exceed safe numerical range or are non-finite.',
        evidence: { a, b, inRangeA, inRangeB },
        limitations: ['Evaluated in IEEE 754 Number domain with mixed absolute/relative tolerance.'],
      };
    }

    // 2. Geometric validity checks: strictly positive and non-degenerate
    if (a <= 0 || b <= 0 || a < this.MIN_SIDE || b < this.MIN_SIDE) {
      return {
        contractId: 'C3_AREA_RATIO_INVARIANT',
        status: 'INVALID_PARAMETER',
        inputSummary,
        preconditions: { passed: false, details: `Sides a and b must be strictly positive and >= ${this.MIN_SIDE}. Received: a=${a}, b=${b}` },
        primaryResult: null,
        auditResult: { passed: false, details: 'Degenerate or non-positive side lengths.' },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: 'Parameters violate strictly positive side precondition.',
        evidence: { a, b, minSide: this.MIN_SIDE },
        limitations: [],
      };
    }

    try {
      // Primary calculation
      const primary = this.compute(a, b);

      // Independent Auditor calculation
      // Triangle OXY: O(0,0), X(a,0), Y(0,b)
      const triPoints: Point2D[] = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: 0, y: b },
      ];
      const auditTriangleArea = this.shoelaceArea(triPoints);

      // Rectangle OPQT: O(0,0), P(a/2,0), Q(a/2, b/2), T(0, b/2)
      // Check if candidate vertices are provided; if so, audit candidate vertices
      const rectO = candidate?.vertices?.O ?? primary.vertices.O;
      const rectP = candidate?.vertices?.P ?? primary.vertices.P;
      const rectQ = candidate?.vertices?.Q ?? primary.vertices.Q;
      const rectT = candidate?.vertices?.T ?? primary.vertices.T;

      const rectPoints: Point2D[] = [rectO, rectP, rectQ, rectT];

      // Validate rectangle vertices finiteness
      for (const pt of rectPoints) {
        if (!this.isValidNumber(pt.x) || !this.isValidNumber(pt.y)) {
          return {
            contractId: 'C3_AREA_RATIO_INVARIANT',
            status: 'NUMERIC_RANGE_EXCEEDED',
            inputSummary,
            preconditions: { passed: true },
            primaryResult: primary,
            auditResult: { passed: false, details: 'Candidate vertex coordinate out of safe range or non-finite.' },
            tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
            failureReason: 'Candidate vertex coordinate out of range.',
            evidence: { pt },
            limitations: [],
          };
        }
      }

      // Check candidate vertices vs expected coordinates if candidate supplied
      if (candidate?.vertices) {
        const expectedP = { x: a / 2.0, y: 0 };
        const expectedQ = { x: a / 2.0, y: b / 2.0 };
        const expectedT = { x: 0, y: b / 2.0 };
        const expectedO = { x: 0, y: 0 };

        const coordTol = this.EPSILON_ABS + this.EPSILON_REL * Math.max(1.0, a, b);

        const diffO = Math.hypot(rectO.x - expectedO.x, rectO.y - expectedO.y);
        const diffP = Math.hypot(rectP.x - expectedP.x, rectP.y - expectedP.y);
        const diffQ = Math.hypot(rectQ.x - expectedQ.x, rectQ.y - expectedQ.y);
        const diffT = Math.hypot(rectT.x - expectedT.x, rectT.y - expectedT.y);

        if (diffO > coordTol || diffP > coordTol || diffQ > coordTol || diffT > coordTol) {
          return {
            contractId: 'C3_AREA_RATIO_INVARIANT',
            status: 'INVARIANT_VIOLATION',
            inputSummary,
            preconditions: { passed: true },
            primaryResult: primary,
            auditResult: {
              passed: false,
              discrepancy: Math.max(diffO, diffP, diffQ, diffT),
              details: `Candidate rectangle vertices deviate from midpoint definitions. diffO=${diffO}, diffP=${diffP}, diffQ=${diffQ}, diffT=${diffT}`,
            },
            tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
            failureReason: 'Candidate rectangle vertices do not match midpoint definitions.',
            evidence: { diffO, diffP, diffQ, diffT, coordTol },
            limitations: [],
          };
        }
      }

      const auditRectangleArea = candidate?.rectangleArea !== undefined
        ? candidate.rectangleArea
        : this.shoelaceArea(rectPoints);

      const effectiveTriangleArea = candidate?.triangleArea !== undefined
        ? candidate.triangleArea
        : auditTriangleArea;

      if (!Number.isFinite(auditTriangleArea) || !Number.isFinite(auditRectangleArea) || effectiveTriangleArea <= 0) {
        return {
          contractId: 'C3_AREA_RATIO_INVARIANT',
          status: 'NUMERIC_RANGE_EXCEEDED',
          inputSummary,
          preconditions: { passed: true },
          primaryResult: primary,
          auditResult: { passed: false, details: 'Non-finite or non-positive Shoelace area computed.' },
          tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
          failureReason: 'Numeric anomaly in independent area computation.',
          evidence: { auditTriangleArea, auditRectangleArea },
          limitations: [],
        };
      }

      // Compute ratio
      const auditRatio = candidate?.ratio !== undefined
        ? candidate.ratio
        : (auditRectangleArea / effectiveTriangleArea);

      // Verify Shoelace areas match formula areas within mixed tolerance
      const scaleTri = Math.max(1.0, primary.triangleArea);
      const tolTri = this.EPSILON_ABS + this.EPSILON_REL * scaleTri;
      const triAreaDiff = Math.abs(primary.triangleArea - auditTriangleArea);
      const triAreaMatches = triAreaDiff <= tolTri;

      const scaleRect = Math.max(1.0, primary.rectangleArea);
      const tolRect = this.EPSILON_ABS + this.EPSILON_REL * scaleRect;
      const rectAreaDiff = Math.abs(primary.rectangleArea - this.shoelaceArea(rectPoints));
      const rectAreaMatches = rectAreaDiff <= tolRect;

      // Verify ratio equals 1/2 = 0.5 within mixed tolerance
      const tolRatio = this.EPSILON_ABS + this.EPSILON_REL * this.EXPECTED_RATIO;
      const ratioDiff = Math.abs(auditRatio - this.EXPECTED_RATIO);
      const ratioMatches = ratioDiff <= tolRatio;

      const auditPassed = triAreaMatches && rectAreaMatches && ratioMatches;
      const status: GIEMStatus = auditPassed ? 'PASS' : 'INVARIANT_VIOLATION';

      const discrepancy = Math.max(
        triAreaDiff / scaleTri,
        rectAreaDiff / scaleRect,
        ratioDiff / this.EXPECTED_RATIO
      );

      return {
        contractId: 'C3_AREA_RATIO_INVARIANT',
        status,
        inputSummary,
        preconditions: { passed: true, details: 'All geometric and hardened numerical preconditions passed.' },
        primaryResult: primary,
        auditResult: {
          passed: auditPassed,
          discrepancy,
          details: `auditRatio: ${auditRatio}, expected: ${this.EXPECTED_RATIO}, ratioDiff: ${ratioDiff} (tol: ${tolRatio}), triAreaDiff: ${triAreaDiff}, rectAreaDiff: ${rectAreaDiff}`,
        },
        tolerancePolicy: { epsilon: this.EPSILON_ABS, mode: 'RELATIVE' },
        failureReason: auditPassed
          ? undefined
          : 'Invariant violated: rectangle/triangle area ratio or polygon geometry deviates from 1/2.',
        evidence: {
          primaryTriangleArea: primary.triangleArea,
          primaryRectangleArea: primary.rectangleArea,
          primaryRatio: primary.ratio,
          auditTriangleArea,
          auditRectangleArea,
          auditRatio,
          expectedRatio: this.EXPECTED_RATIO,
          ratioDiff,
          tolRatio,
          triAreaDiff,
          rectAreaDiff,
        },
        limitations: [
          'Evaluated in IEEE 754 Number domain with mixed tolerance (eps_abs=1e-7, eps_rel=1e-6).',
          `Restricted to strictly positive a, b in [${this.MIN_SIDE}, ${this.MAX_COORD}].`,
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isRange = message.includes('NUMERIC_RANGE');
      const isParam = message.includes('INVALID_PARAMETER');
      const status: GIEMStatus = isRange
        ? 'NUMERIC_RANGE_EXCEEDED'
        : isParam
        ? 'INVALID_PARAMETER'
        : 'INTERNAL_ERROR';

      return {
        contractId: 'C3_AREA_RATIO_INVARIANT',
        status,
        inputSummary,
        preconditions: { passed: !isParam, details: message },
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

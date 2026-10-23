// src/engines/giem/generators/PythagoreanTripleGenerator.ts
// Pythagorean Triple Generator and Independent BigInt Auditor (C1)

import { PythagoreanTriple, InvariantAuditReport, GIEMStatus } from '../contracts/types';
import { bigintGcd, bigintGcdThree } from '../utils/gcd';

export class PythagoreanTripleGenerator {
  /**
   * Generates a primitive Pythagorean triple from parameters m and n using exact BigInt arithmetic.
   * Formulas:
   * a = m^2 - n^2
   * b = 2mn
   * c = m^2 + n^2
   */
  public static generate(m: bigint, n: bigint): PythagoreanTriple {
    if (m <= n || n <= 0n) {
      throw new Error(`INVALID_PARAMETER: Parameters must satisfy m > n > 0. Received m=${m}, n=${n}`);
    }
    if (bigintGcd(m, n) !== 1n) {
      throw new Error(`INVALID_PARAMETER: Parameters m and n must be coprime (gcd=1). Received m=${m}, n=${n}`);
    }
    if ((m - n) % 2n === 0n) {
      throw new Error(`INVALID_PARAMETER: Parameters m and n must have different parity. Received m=${m}, n=${n}`);
    }

    const m2 = m * m;
    const n2 = n * n;

    const a = m2 - n2;
    const b = 2n * m * n;
    const c = m2 + n2;

    return { a: a < 0n ? -a : a, b: b < 0n ? -b : b, c };
  }

  /**
   * Performs an independent BigInt audit of a Pythagorean triple (a, b, c) given parameters (m, n).
   */
  public static audit(m: bigint, n: bigint, triple?: PythagoreanTriple): InvariantAuditReport {
    const inputSummary = { m: m.toString(), n: n.toString() };

    // 1. Precondition check
    const mGtN = m > n;
    const nGt0 = n > 0n;
    const coprime = bigintGcd(m, n) === 1n;
    const diffParity = (m - n) % 2n !== 0n;
    const preconditionsPassed = mGtN && nGt0 && coprime && diffParity;

    if (!preconditionsPassed) {
      return {
        contractId: 'C1_PYTHAGOREAN_TRIPLE',
        status: 'INVALID_PARAMETER',
        inputSummary,
        preconditions: {
          passed: false,
          details: `m>n>0: ${mGtN && nGt0}, gcd(m,n)=1: ${coprime}, diffParity: ${diffParity}`,
        },
        primaryResult: null,
        auditResult: { passed: false, details: 'Skipped due to failed preconditions.' },
        tolerancePolicy: { epsilon: 0, mode: 'EXACT_BIGINT' },
        failureReason: 'Preconditions for primitive Pythagorean triple generation failed.',
        evidence: {},
        limitations: ['Evaluated strictly in BigInt domain.'],
      };
    }

    try {
      const generated = this.generate(m, n);
      const target = triple || generated;

      // Independent audit checks in BigInt
      const aPos = target.a > 0n;
      const bPos = target.b > 0n;
      const cPos = target.c > 0n;
      const positiveSides = aPos && bPos && cPos;

      const a2 = target.a * target.a;
      const b2 = target.b * target.b;
      const c2 = target.c * target.c;
      const pythagoreanIdentity = a2 + b2 === c2;

      const tripleGcd = bigintGcdThree(target.a, target.b, target.c);
      const isPrimitive = tripleGcd === 1n;

      const auditPassed = positiveSides && pythagoreanIdentity && isPrimitive;
      const status: GIEMStatus = auditPassed ? 'PASS' : 'INVARIANT_VIOLATION';

      return {
        contractId: 'C1_PYTHAGOREAN_TRIPLE',
        status,
        inputSummary,
        preconditions: { passed: true, details: 'All preconditions verified.' },
        primaryResult: { a: generated.a.toString(), b: generated.b.toString(), c: generated.c.toString() },
        auditResult: {
          passed: auditPassed,
          details: `positiveSides: ${positiveSides}, identity: ${pythagoreanIdentity}, isPrimitive: ${isPrimitive} (gcd=${tripleGcd})`,
        },
        tolerancePolicy: { epsilon: 0, mode: 'EXACT_BIGINT' },
        failureReason: auditPassed ? undefined : 'Pythagorean invariant or primitivity violated.',
        evidence: {
          targetA: target.a.toString(),
          targetB: target.b.toString(),
          targetC: target.c.toString(),
          tripleGcd: tripleGcd.toString(),
        },
        limitations: ['Evaluated strictly in BigInt domain.'],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        contractId: 'C1_PYTHAGOREAN_TRIPLE',
        status: message.includes('NUMERIC_RANGE') ? 'NUMERIC_RANGE_EXCEEDED' : 'INTERNAL_ERROR',
        inputSummary,
        preconditions: { passed: true },
        primaryResult: null,
        auditResult: { passed: false, details: message },
        tolerancePolicy: { epsilon: 0, mode: 'EXACT_BIGINT' },
        failureReason: message,
        evidence: {},
        limitations: [],
      };
    }
  }
}

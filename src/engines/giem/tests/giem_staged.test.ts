// src/engines/giem/tests/giem_staged.test.ts
// Staged Unit Tests for GIEM v0.1 (Stage A & Stage B: BigIntNumberBridge & PythagoreanTripleGenerator)

import { PythagoreanTripleGenerator } from '../generators/PythagoreanTripleGenerator';
import { BigIntNumberBridge } from '../bridges/BigIntNumberBridge';
import { InvariantAuditReport } from '../contracts/types';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`TEST FAILED: ${msg}`);
  }
  console.log(`✓ PASS: ${msg}`);
}

console.log('======================================================================');
console.log('RUNNING GIEM V0.1 STAGED TEST SUITE (STAGE A & STAGE B)');
console.log('======================================================================\n');

// --- 1. BIGINT NUMBER BRIDGE TESTS (STAGE A) ---
console.log('--- 1. BIGINT NUMBER BRIDGE ---');
{
  // Safe bounds
  const safeRes = BigIntNumberBridge.safeConvert(1234567890n);
  assert(safeRes.success === true && safeRes.value === 1234567890, '1.1: Safe BigInt conversion succeeds');

  const maxSafeRes = BigIntNumberBridge.safeConvert(BigInt(Number.MAX_SAFE_INTEGER));
  assert(maxSafeRes.success === true, '1.2: MAX_SAFE_INTEGER conversion succeeds');

  // Unsafe bounds (exceeding MAX_SAFE_INTEGER)
  const unsafeRes = BigIntNumberBridge.safeConvert(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
  assert(unsafeRes.success === false && unsafeRes.error?.includes('NUMERIC_RANGE_EXCEEDED'), '1.3: Unsafe BigInt conversion rejected with NUMERIC_RANGE_EXCEEDED');

  // Coordinate bounds check
  const coordOk = BigIntNumberBridge.validateCoordinateBounds(500000n, 1000000n);
  assert(coordOk.success === true, '1.4: Valid coordinate within geo-kernel limits');

  const coordBad = BigIntNumberBridge.validateCoordinateBounds(2000000n, 1000000n);
  assert(coordBad.success === false && coordBad.error?.includes('NUMERIC_RANGE_EXCEEDED'), '1.5: Out-of-bounds coordinate rejected');
}

// --- 2. PYTHAGOREAN TRIPLE GENERATOR & AUDITOR (STAGE B) ---
console.log('\n--- 2. PYTHAGOREAN TRIPLE GENERATOR & AUDITOR ---');
{
  // Standard primitive triple (m=2, n=1 -> 3, 4, 5)
  const t1 = PythagoreanTripleGenerator.generate(2n, 1n);
  assert(t1.a === 3n && t1.b === 4n && t1.c === 5n, '2.1: Generated (2,1) produces primitive triple (3,4,5)');

  const audit1 = PythagoreanTripleGenerator.audit(2n, 1n, t1);
  assert(audit1.status === 'PASS', '2.2: Audit report for (2,1) returns PASS');

  // Another primitive triple (m=3, n=2 -> 5, 12, 13)
  const t2 = PythagoreanTripleGenerator.generate(3n, 2n);
  assert(t2.a === 5n && t2.b === 12n && t2.c === 13n, '2.3: Generated (3,2) produces (5,12,13)');
  const audit2 = PythagoreanTripleGenerator.audit(3n, 2n, t2);
  assert(audit2.status === 'PASS', '2.4: Audit report for (3,2) returns PASS');

  // Negative tests: Invalid parameters (m <= n)
  let threw = false;
  try {
    PythagoreanTripleGenerator.generate(2n, 2n);
  } catch {
    threw = true;
  }
  assert(threw, '2.5: m <= n correctly throws error');
  const auditInvalidM = PythagoreanTripleGenerator.audit(2n, 2n);
  assert(auditInvalidM.status === 'INVALID_PARAMETER', '2.6: Audit returns INVALID_PARAMETER for m <= n');

  // Negative tests: Same parity (m=3, n=1 -> both odd)
  const auditParity = PythagoreanTripleGenerator.audit(3n, 1n);
  assert(auditParity.status === 'INVALID_PARAMETER', '2.7: Audit returns INVALID_PARAMETER for same parity');

  // Negative tests: Not coprime (m=4, n=2 -> gcd=2)
  const auditCoprime = PythagoreanTripleGenerator.audit(4n, 2n);
  assert(auditCoprime.status === 'INVALID_PARAMETER', '2.8: Audit returns INVALID_PARAMETER for non-coprime parameters');

  // Negative tests: False PASS prevention (passing tampered triple that breaks pythagorean identity)
  const tamperedTriple = { a: 3n, b: 4n, c: 6n }; // 3^2 + 4^2 != 6^2
  const auditTampered = PythagoreanTripleGenerator.audit(2n, 1n, tamperedTriple);
  assert(auditTampered.status === 'INVARIANT_VIOLATION', '2.9: Tampered triple correctly detected and returns INVARIANT_VIOLATION (no false PASS)');

  // Large BigInt test
  const largeM = 1000001n;
  const largeN = 1000000n;
  const largeTriple = PythagoreanTripleGenerator.generate(largeM, largeN);
  assert(largeTriple.c > 0n, '2.10: Large BigInt primitive triple generated successfully');
  const auditLarge = PythagoreanTripleGenerator.audit(largeM, largeN, largeTriple);
  assert(auditLarge.status === 'PASS', '2.11: Large BigInt triple audit passes');
}

console.log('\n======================================================================');
console.log('ALL GIEM STAGED TESTS PASSED (100%)');
console.log('======================================================================');

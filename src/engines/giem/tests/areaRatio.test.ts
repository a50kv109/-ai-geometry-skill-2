// src/engines/giem/tests/areaRatio.test.ts
// Isolated Unit Tests for GIEM v0.1 (Stage C3: TriangleAreaInvariant)

import { TriangleAreaInvariant } from '../invariants/TriangleAreaInvariant';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`TEST FAILED: ${msg}`);
  }
  console.log(`✓ PASS: ${msg}`);
}

console.log('======================================================================');
console.log('RUNNING GIEM V0.1 STAGE C3: TRIANGLE AREA INVARIANT TESTS');
console.log('======================================================================\n');

// --- 1. STANDARD PARAMETERS (a=4, b=3) ---
console.log('--- 1. STANDARD PARAMETERS (a=4, b=3) ---');
{
  const res = TriangleAreaInvariant.compute(4, 3);
  assert(Math.abs(res.triangleArea - 6) < 1e-9, '1.1: Triangle area for (4,3) equals 6');
  assert(Math.abs(res.rectangleArea - 3) < 1e-9, '1.2: Rectangle area for (4,3) equals 3');
  assert(Math.abs(res.ratio - 0.5) < 1e-9, '1.3: Area ratio equals 0.5');
  assert(res.vertices.P.x === 2 && res.vertices.P.y === 0, '1.4: Vertex P is (2, 0)');
  assert(res.vertices.Q.x === 2 && res.vertices.Q.y === 1.5, '1.5: Vertex Q is (2, 1.5)');
  assert(res.vertices.T.x === 0 && res.vertices.T.y === 1.5, '1.6: Vertex T is (0, 1.5)');

  const auditReport = TriangleAreaInvariant.audit(4, 3);
  assert(auditReport.status === 'PASS', '1.7: Standard (4,3) audit returns PASS');
  assert(auditReport.preconditions.passed === true, '1.8: Preconditions passed');
  assert(auditReport.auditResult.passed === true, '1.9: Audit result passed');
}

// --- 2. ANOTHER STANDARD CASE (a=12, b=5) ---
console.log('\n--- 2. ANOTHER STANDARD CASE (a=12, b=5) ---');
{
  const res = TriangleAreaInvariant.compute(12, 5);
  assert(Math.abs(res.triangleArea - 30) < 1e-9, '2.1: Triangle area for (12,5) equals 30');
  assert(Math.abs(res.rectangleArea - 15) < 1e-9, '2.2: Rectangle area for (12,5) equals 15');
  assert(Math.abs(res.ratio - 0.5) < 1e-9, '2.3: Ratio equals 0.5');

  const audit = TriangleAreaInvariant.audit(12, 5);
  assert(audit.status === 'PASS', '2.4: Audit returns PASS for (12,5)');
}

// --- 3. SMALL SCALE PARAMETERS ---
console.log('\n--- 3. SMALL SCALE (a=0.004, b=0.003) ---');
{
  const a = 0.004;
  const b = 0.003;
  const res = TriangleAreaInvariant.compute(a, b);
  assert(Math.abs(res.ratio - 0.5) < 1e-9, '3.1: Small scale ratio is 0.5');

  const audit = TriangleAreaInvariant.audit(a, b);
  assert(audit.status === 'PASS', '3.2: Small scale audit returns PASS');
}

// --- 4. LARGE SCALE PARAMETERS ---
console.log('\n--- 4. LARGE SCALE (a=40000, b=30000) ---');
{
  const a = 40000;
  const b = 30000;
  const res = TriangleAreaInvariant.compute(a, b);
  assert(res.triangleArea === 600000000, '4.1: Large scale triangle area is 600,000,000');
  assert(res.rectangleArea === 300000000, '4.2: Large scale rectangle area is 300,000,000');
  assert(res.ratio === 0.5, '4.3: Large scale ratio is exactly 0.5');

  const audit = TriangleAreaInvariant.audit(a, b);
  assert(audit.status === 'PASS', '4.4: Large scale audit returns PASS');
}

// --- 5. NEGATIVE TESTS: ZERO, NEGATIVE & MICRO PARAMETERS ---
console.log('\n--- 5. NEGATIVE TESTS (ZERO, NEGATIVE, MICRO SIDES) ---');
{
  // Zero side length
  let threwZero = false;
  try {
    TriangleAreaInvariant.compute(0, 5);
  } catch {
    threwZero = true;
  }
  assert(threwZero, '5.1: a=0 throws INVALID_PARAMETER in compute()');
  const auditZero = TriangleAreaInvariant.audit(0, 5);
  assert(auditZero.status === 'INVALID_PARAMETER', '5.2: a=0 audit returns INVALID_PARAMETER');

  // Negative side length
  const auditNeg = TriangleAreaInvariant.audit(-4, 3);
  assert(auditNeg.status === 'INVALID_PARAMETER', '5.3: a=-4 audit returns INVALID_PARAMETER');

  const auditBothNeg = TriangleAreaInvariant.audit(-4, -3);
  assert(auditBothNeg.status === 'INVALID_PARAMETER', '5.4: Both negative audit returns INVALID_PARAMETER');

  // Micro side length (< MIN_SIDE = 1e-6)
  const auditMicro = TriangleAreaInvariant.audit(1e-8, 2);
  assert(auditMicro.status === 'INVALID_PARAMETER', '5.5: Micro side < 1e-6 returns INVALID_PARAMETER');
}

// --- 6. NUMERIC RANGE & NON-FINITE PARAMETERS ---
console.log('\n--- 6. NUMERIC RANGE & NON-FINITE PARAMETERS ---');
{
  // Exceeds MAX_COORD = 100000
  const auditExceed = TriangleAreaInvariant.audit(200000, 10);
  assert(auditExceed.status === 'NUMERIC_RANGE_EXCEEDED', '6.1: a=200000 returns NUMERIC_RANGE_EXCEEDED');

  // NaN input
  const auditNaN = TriangleAreaInvariant.audit(NaN, 5);
  assert(auditNaN.status === 'NUMERIC_RANGE_EXCEEDED', '6.2: NaN input returns NUMERIC_RANGE_EXCEEDED');

  // Infinity input
  const auditInf = TriangleAreaInvariant.audit(10, Infinity);
  assert(auditInf.status === 'NUMERIC_RANGE_EXCEEDED', '6.3: Infinity input returns NUMERIC_RANGE_EXCEEDED');
}

// --- 7. FALSE PASS PREVENTION (TAMPERED CANDIDATES) ---
console.log('\n--- 7. FALSE PASS PREVENTION (TAMPERED CANDIDATES) ---');
{
  // Tampered candidate ratio
  const tamperedRatioAudit = TriangleAreaInvariant.audit(4, 3, { ratio: 0.75 });
  assert(tamperedRatioAudit.status === 'INVARIANT_VIOLATION', '7.1: Tampered ratio 0.75 detected as INVARIANT_VIOLATION');

  // Tampered candidate rectangle area
  const tamperedAreaAudit = TriangleAreaInvariant.audit(4, 3, { rectangleArea: 5.0 });
  assert(tamperedAreaAudit.status === 'INVARIANT_VIOLATION', '7.2: Tampered rectangle area detected as INVARIANT_VIOLATION');

  // Tampered candidate vertex Q (not midpoint of hypotenuse)
  const tamperedVerticesAudit = TriangleAreaInvariant.audit(4, 3, {
    vertices: {
      O: { x: 0, y: 0 },
      P: { x: 2, y: 0 },
      Q: { x: 3.5, y: 2.8 }, // Tampered Q
      T: { x: 0, y: 1.5 },
    },
  });
  assert(tamperedVerticesAudit.status === 'INVARIANT_VIOLATION', '7.3: Tampered vertex Q detected as INVARIANT_VIOLATION');
}

// --- 8. SHOELACE FORMULA INTEGRITY ---
console.log('\n--- 8. SHOELACE FORMULA INTEGRITY ---');
{
  const points = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ];
  const area = TriangleAreaInvariant.shoelaceArea(points);
  assert(Math.abs(area - 12) < 1e-9, '8.1: Shoelace correctly computes area 12 for 4x3 rectangle');
}

// --- 9. DETERMINISM CHECK ---
console.log('\n--- 9. DETERMINISM CHECK ---');
{
  const rep1 = TriangleAreaInvariant.audit(10, 8);
  const rep2 = TriangleAreaInvariant.audit(10, 8);
  assert(JSON.stringify(rep1) === JSON.stringify(rep2), '9.1: Sequential audits are 100% deterministic');
}

console.log('\n======================================================================');
console.log('ALL GIEM STAGE C3 TESTS PASSED (100%)');
console.log('======================================================================');

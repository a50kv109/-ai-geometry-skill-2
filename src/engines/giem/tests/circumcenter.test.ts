// src/engines/giem/tests/circumcenter.test.ts
// Isolated Unit Tests for GIEM v0.1 (Stage C & C2.1: RightTriangleCircumcenter with Hardened Tolerances)

import { RightTriangleCircumcenter } from '../invariants/RightTriangleCircumcenter';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`TEST FAILED: ${msg}`);
  }
  console.log(`✓ PASS: ${msg}`);
}

console.log('======================================================================');
console.log('RUNNING GIEM V0.1 STAGE C2.1: HARDENED CIRCUMCENTER TESTS');
console.log('======================================================================\n');

// --- 1. RIGHT TRIANGLE 3-4-5 ---
console.log('--- 1. RIGHT TRIANGLE 3-4-5 ---');
{
  const A = { x: 0, y: 3 };
  const B = { x: 0, y: 0 };
  const C = { x: 4, y: 0 };

  const center = RightTriangleCircumcenter.compute(A, B, C);
  assert(Math.abs(center.x - 2) < 1e-5 && Math.abs(center.y - 1.5) < 1e-5, '1.1: 3-4-5 circumcenter computed correctly at (2, 1.5)');

  const report = RightTriangleCircumcenter.audit(A, B, C);
  assert(report.status === 'PASS', '1.2: 3-4-5 audit report returns PASS');
}

// --- 2. SMALL SCALE & UNIT SCALE TRIANGLES ---
console.log('\n--- 2. SMALL SCALE & UNIT SCALE ---');
{
  // Small scale right triangle: legs 0.003 and 0.004, hypotenuse 0.005
  const A_small = { x: 0, y: 0.003 };
  const B_small = { x: 0, y: 0 };
  const C_small = { x: 0.004, y: 0 };

  const reportSmall = RightTriangleCircumcenter.audit(A_small, B_small, C_small);
  assert(reportSmall.status === 'PASS', '2.1: Small scale (0.003, 0.004, 0.005) audit returns PASS');
}

// --- 3. LARGE COORDINATES & BOUNDS ---
console.log('\n--- 3. LARGE COORDINATES & BOUNDS ---');
{
  // Large scale right triangle within MAX_COORD = 100000
  const A_big = { x: 0, y: 30000 };
  const B_big = { x: 0, y: 0 };
  const C_big = { x: 40000, y: 0 };

  const reportBig = RightTriangleCircumcenter.audit(A_big, B_big, C_big);
  assert(reportBig.status === 'PASS', '3.1: Large coordinate scale audit returns PASS');
}

// --- 4. NEGATIVE TESTS: NEAR-RIGHT, NON-RIGHT, DEGENERATE ---
console.log('\n--- 4. NEGATIVE TESTS ---');
{
  // Near-right angle (distorted from 90 deg)
  const A = { x: 0, y: 3 };
  const B = { x: 0, y: 0 };
  const C = { x: 4, y: 0.5 }; // Not quite perpendicular

  const reportNear = RightTriangleCircumcenter.audit(A, B, C);
  assert(reportNear.status === 'INVALID_PARAMETER', '4.1: Near-right angle rejected with INVALID_PARAMETER');

  // Zero / micro leg degenerate test
  const A_zero = { x: 0, y: 1e-15 };
  const B_zero = { x: 0, y: 0 };
  const C_zero = { x: 1, y: 0 };
  const reportZero = RightTriangleCircumcenter.audit(A_zero, B_zero, C_zero);
  assert(reportZero.status === 'INVALID_PARAMETER', '4.2: Micro/zero leg rejected with INVALID_PARAMETER');
}

// --- 5. NUMERIC RANGE & OUT OF BOUNDS ---
console.log('\n--- 5. NUMERIC RANGE ---');
{
  const A = { x: 200000, y: 0 }; // Exceeds MAX_COORD = 100000
  const B = { x: 0, y: 0 };
  const C = { x: 0, y: 200000 };

  const report = RightTriangleCircumcenter.audit(A, B, C);
  assert(report.status === 'NUMERIC_RANGE_EXCEEDED', '5.1: Out of bounds coordinate returns NUMERIC_RANGE_EXCEEDED');
}

// --- 6. FALSE PASS PREVENTION (TAMPERED CIRCUMCENTER) ---
console.log('\n--- 6. FALSE PASS PREVENTION ---');
{
  const A = { x: 0, y: 3 };
  const B = { x: 0, y: 0 };
  const C = { x: 4, y: 0 };

  const tamperedCenter = { x: 10, y: 10 };
  const report = RightTriangleCircumcenter.audit(A, B, C, tamperedCenter);
  assert(report.status === 'INVARIANT_VIOLATION', '6.1: Tampered circumcenter correctly detected and returns INVARIANT_VIOLATION');
}

console.log('\n======================================================================');
console.log('ALL GIEM STAGE C2.1 HARDENED TESTS PASSED (100%)');
console.log('======================================================================');

// src/utils/tests/canonicalCoordinates.test.ts
// Mathematical Contract and Boundary Verification for Canonical Coordinates
// Tests Layer A (Angular Address), Layer B (Perimeter/Contour Coordinate), Layer C (Cartesian Position)

import {
  normalizeAngleDeg,
  normalizeAngleRad,
  normalizeParam,
  circleAngleToArcLength,
  circleArcLengthToAngle,
  polarToCartesian,
  cartesianToPolar,
  computePolygonPerimeterProfile,
  polygonPerimeterToCartesian,
} from '../canonicalCoordinates';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✓ PASS: ${msg}`);
}

console.log('======================================================================');
console.log('RUNNING CANONICAL COORDINATES & PERIMETER MATHEMATICAL TEST SUITE');
console.log('======================================================================\n');

// 1. ANGLE NORMALIZATION (0, 360, negatives)
console.log('--- 1. ANGLE NORMALIZATION ---');
assert(normalizeAngleDeg(0) === 0, '1.1: normalizeAngleDeg(0) === 0');
assert(normalizeAngleDeg(360) === 0, '1.2: normalizeAngleDeg(360) === 0');
assert(normalizeAngleDeg(720) === 0, '1.3: normalizeAngleDeg(720) === 0');
assert(normalizeAngleDeg(-90) === 270, '1.4: normalizeAngleDeg(-90) === 270');
assert(normalizeAngleDeg(-360) === 0, '1.5: normalizeAngleDeg(-360) === 0');
assert(normalizeAngleDeg(450) === 90, '1.6: normalizeAngleDeg(450) === 90');

assert(Math.abs(normalizeAngleRad(0) - 0) < 1e-10, '1.7: normalizeAngleRad(0) === 0');
assert(Math.abs(normalizeAngleRad(2 * Math.PI) - 0) < 1e-10, '1.8: normalizeAngleRad(2π) === 0');
assert(Math.abs(normalizeAngleRad(-Math.PI / 2) - (3 * Math.PI / 2)) < 1e-10, '1.9: normalizeAngleRad(-π/2) === 3π/2');

// 2. CIRCLE ARC LENGTHS (CCW & CW)
console.log('\n--- 2. CIRCLE ARC LENGTHS (CCW vs CW) ---');
const R = 10;
const totalCirclePerimeter = 2 * Math.PI * R; // ~62.831853

// CCW 90 deg from 0
const ccw90 = circleAngleToArcLength(90, R, 'CCW', 0);
assert(Math.abs(ccw90.arcLength - (totalCirclePerimeter * 0.25)) < 1e-10, '2.1: CCW 90° arc length is 0.25 * 2πR');
assert(Math.abs(ccw90.normalizedParam - 0.25) < 1e-10, '2.2: CCW 90° normalizedParam is 0.25');

// CW 90 deg from 0 (traverses remaining 270 deg in CW direction)
const cw90 = circleAngleToArcLength(90, R, 'CW', 0);
assert(Math.abs(cw90.arcLength - (totalCirclePerimeter * 0.75)) < 1e-10, '2.3: CW 90° arc length is 0.75 * 2πR');
assert(Math.abs(cw90.normalizedParam - 0.75) < 1e-10, '2.4: CW 90° normalizedParam is 0.75');

// Inversion: Arc length back to angle
const backAngle = circleArcLengthToAngle(ccw90.arcLength, R, 'CCW', 0);
assert(Math.abs(backAngle.angleDeg - 90) < 1e-10, '2.5: Inversion s -> angleDeg matches 90°');

// 3. CARTESIAN CONVERSIONS (LAYER A <-> LAYER C)
console.log('\n--- 3. CARTESIAN CONVERSIONS ---');
const p0 = polarToCartesian(0, 100);
assert(Math.abs(p0.x - 100) < 1e-10 && Math.abs(p0.y - 0) < 1e-10, '3.1: 0° is (100, 0)');

const p90 = polarToCartesian(90, 100);
assert(Math.abs(p90.x - 0) < 1e-10 && Math.abs(p90.y - 100) < 1e-10, '3.2: 90° is (0, 100)');

const pPolar = cartesianToPolar({ x: 0, y: -50 });
assert(Math.abs(pPolar.radius - 50) < 1e-10, '3.3: (0, -50) has radius 50');
assert(Math.abs(pPolar.angleDeg - 270) < 1e-10, '3.4: (0, -50) has angle 270°');

// 4. POLYGON PERIMETER ACCUMULATION (TRIANGLE ABC)
console.log('\n--- 4. POLYGON PERIMETER ACCUMULATION ---');
// Right triangle with vertices (0,0), (4,0), (0,3). Sides: 4, 5, 3. Perimeter: 12.
const triVertices = [
  { id: 'V_0', x: 0, y: 0 },
  { id: 'V_1', x: 4, y: 0 },
  { id: 'V_2', x: 0, y: 3 },
];
const profile = computePolygonPerimeterProfile(triVertices);
assert(Math.abs(profile.totalPerimeter - 12) < 1e-10, '4.1: Triangle perimeter is exactly 12');
assert(profile.segments.length === 3, '4.2: Triangle has 3 segments');
assert(Math.abs(profile.segments[0].segmentLength - 4) < 1e-10, '4.3: Segment 0 (V_0 -> V_1) length is 4');
assert(Math.abs(profile.segments[1].segmentLength - 5) < 1e-10, '4.4: Segment 1 (V_1 -> V_2) length is 5');
assert(Math.abs(profile.segments[2].segmentLength - 3) < 1e-10, '4.5: Segment 2 (V_2 -> V_0) length is 3');

// 5. POINT ON POLYGON SIDES AND ACCUMULATION
console.log('\n--- 5. POINT ON POLYGON SIDES ---');
// s = 0 -> V_0 (0,0)
const pt0 = polygonPerimeterToCartesian(profile, triVertices, 0);
assert(Math.abs(pt0.point.x - 0) < 1e-10 && Math.abs(pt0.point.y - 0) < 1e-10, '5.1: s=0 is V_0 (0,0)');
assert(pt0.segmentIndex === 0, '5.2: s=0 is on segment 0');

// s = 2 -> midpoint of segment 0 (2, 0)
const pt2 = polygonPerimeterToCartesian(profile, triVertices, 2);
assert(Math.abs(pt2.point.x - 2) < 1e-10 && Math.abs(pt2.point.y - 0) < 1e-10, '5.3: s=2 is (2, 0)');

// s = 4 -> vertex V_1 (4, 0)
const pt4 = polygonPerimeterToCartesian(profile, triVertices, 4);
assert(Math.abs(pt4.point.x - 4) < 1e-10 && Math.abs(pt4.point.y - 0) < 1e-10, '5.4: s=4 transitions to V_1 (4, 0)');

// s = 6.5 -> midpoint of segment 1: V_1(4,0) to V_2(0,3) (s=4 to s=9, midpoint is s=6.5)
const pt6_5 = polygonPerimeterToCartesian(profile, triVertices, 6.5);
assert(Math.abs(pt6_5.point.x - 2) < 1e-10 && Math.abs(pt6_5.point.y - 1.5) < 1e-10, '5.5: s=6.5 is (2, 1.5)');

// s = 12 -> closure at V_0 (0, 0)
const pt12 = polygonPerimeterToCartesian(profile, triVertices, 12);
assert(Math.abs(pt12.point.x - 0) < 1e-10 && Math.abs(pt12.point.y - 0) < 1e-10, '5.6: s=12 (closure) wraps to V_0 (0, 0)');

// s = 14 -> wrapping around perimeter (14 mod 12 = 2) -> (2, 0)
const pt14 = polygonPerimeterToCartesian(profile, triVertices, 14);
assert(Math.abs(pt14.point.x - 2) < 1e-10 && Math.abs(pt14.point.y - 0) < 1e-10, '5.7: s=14 wraps to s=2 (2, 0)');

// 6. DEGENERATE AND MALFORMED INPUT REJECTIONS
console.log('\n--- 6. REJECTIONS ON MALFORMED / DEGENERATE INPUTS ---');
let caughtR = false;
try {
  circleAngleToArcLength(45, -5);
} catch (e) {
  caughtR = true;
}
assert(caughtR, '6.1: Negative radius R rejected');

let caughtDegeneratePoly = false;
try {
  computePolygonPerimeterProfile([
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 0, y: 0 },
    { id: 'C', x: 0, y: 0 },
  ]);
} catch (e) {
  caughtDegeneratePoly = true;
}
assert(caughtDegeneratePoly, '6.2: 0-perimeter degenerate polygon rejected');

let caughtTooFewVertices = false;
try {
  computePolygonPerimeterProfile([{ id: 'A', x: 0, y: 0 }, { id: 'B', x: 1, y: 1 }]);
} catch (e) {
  caughtTooFewVertices = true;
}
assert(caughtTooFewVertices, '6.3: Fewer than 3 vertices rejected');

console.log('\n======================================================================');
console.log('ALL CANONICAL COORDINATE MATHEMATICAL TESTS PASSED (100%)');
console.log('======================================================================\n');

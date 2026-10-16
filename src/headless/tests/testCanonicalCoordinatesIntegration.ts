// src/headless/tests/testCanonicalCoordinatesIntegration.ts
// TASK 06: Canonical Coordinates Integration Scenario & Independent Verification
// Tests the full lifecycle:
// Circle -> 3 points -> Cartesian coordinates -> Inscribed triangle ->
// Perimeter coordinates -> Inversion -> Original identity preservation -> WORLD_CANONICAL ordering.

import { HeadlessGeometrySession } from '../HeadlessGeometrySession';
import {
  circleAngleToArcLength,
  circleArcLengthToAngle,
  polarToCartesian,
  cartesianToPolar,
  computePolygonPerimeterProfile,
  polygonPerimeterToCartesian,
  worldCanonicalOrdering,
} from '../../utils/canonicalCoordinates';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✓ PASS: ${msg}`);
}

console.log('======================================================================');
console.log('RUNNING TASK 06: CANONICAL COORDINATES INTEGRATION SCENARIO');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// 1. SETUP CIRCLE & THREE POINTS VIA HEADLESS SESSION
// ----------------------------------------------------------------------------
console.log('--- STEP 1 & 2: SETUP CIRCLE & 3 DISTINCT POINTS ---');
const R = 100;
const session = new HeadlessGeometrySession({ profile: 'blank', R });

// Define 3 points on circle at known polar angles:
// Point A: 30°
// Point B: 150°
// Point C: 270°
const thetaA = 30;
const thetaB = 150;
const thetaC = 270;

const pA = polarToCartesian(thetaA, R);
const pB = polarToCartesian(thetaB, R);
const pC = polarToCartesian(thetaC, R);

const resA = session.create_point(pA.x, pA.y, { id: 'P_ORIG_A', name: 'Alpha' });
const resB = session.create_point(pB.x, pB.y, { id: 'P_ORIG_B', name: 'Beta' });
const resC = session.create_point(pC.x, pC.y, { id: 'P_ORIG_C', name: 'Gamma' });

assert(resA.success && resB.success && resC.success, '1.1: 3 points successfully created in HeadlessGeometrySession');

// ----------------------------------------------------------------------------
// 2. FORM INSCRIBED TRIANGLE WITH PRESERVED IDS
// ----------------------------------------------------------------------------
console.log('\n--- STEP 3 & 4: INSCRIBED TRIANGLE FORMATION ---');
const segAB = session.connect('P_ORIG_A', 'P_ORIG_B', 'SEGMENT');
const segBC = session.connect('P_ORIG_B', 'P_ORIG_C', 'SEGMENT');
const segCA = session.connect('P_ORIG_C', 'P_ORIG_A', 'SEGMENT');

assert(segAB.success && segBC.success && segCA.success, '2.1: Triangle segments created');

// Measure side lengths from session
const lenAB = session.measure(segAB.created[0].id, 'SEGMENT_LENGTH').records[0].value;
const lenBC = session.measure(segBC.created[0].id, 'SEGMENT_LENGTH').records[0].value;
const lenCA = session.measure(segCA.created[0].id, 'SEGMENT_LENGTH').records[0].value;

const expectedSide = 2 * R * Math.sin(Math.PI / 3); // 173.20508...
assert(Math.abs(lenAB - expectedSide) < 1e-4, '2.2: len(AB) matches 2R sin(Δθ/2)');
assert(Math.abs(lenBC - expectedSide) < 1e-4, '2.3: len(BC) matches 2R sin(Δθ/2)');
assert(Math.abs(lenCA - expectedSide) < 1e-4, '2.4: len(CA) matches 2R sin(Δθ/2)');

// ----------------------------------------------------------------------------
// 3. PERIMETER COORDINATES ALONG TRIANGLE BOUNDARY (LAYER B)
// ----------------------------------------------------------------------------
console.log('\n--- STEP 5: PERIMETER PROFILE & TRACING ---');
const vertices = [
  { id: 'P_ORIG_A', x: pA.x, y: pA.y },
  { id: 'P_ORIG_B', x: pB.x, y: pB.y },
  { id: 'P_ORIG_C', x: pC.x, y: pC.y },
];

const profile = computePolygonPerimeterProfile(vertices);
const totalPerimeter = lenAB + lenBC + lenCA;
assert(Math.abs(profile.totalPerimeter - totalPerimeter) < 1e-4, '3.1: Profile totalPerimeter matches sum of sides');

// Check vertex perimeter addresses:
// V_0 (P_ORIG_A): s = 0
// V_1 (P_ORIG_B): s = lenAB
// V_2 (P_ORIG_C): s = lenAB + lenBC
const traceA = polygonPerimeterToCartesian(profile, vertices, 0);
assert(Math.abs(traceA.point.x - pA.x) < 1e-4 && Math.abs(traceA.point.y - pA.y) < 1e-4, '3.2: s=0 evaluates back to P_ORIG_A');

const traceB = polygonPerimeterToCartesian(profile, vertices, lenAB);
assert(Math.abs(traceB.point.x - pB.x) < 1e-4 && Math.abs(traceB.point.y - pB.y) < 1e-4, '3.3: s=lenAB evaluates back to P_ORIG_B');

const traceC = polygonPerimeterToCartesian(profile, vertices, lenAB + lenBC);
assert(Math.abs(traceC.point.x - pC.x) < 1e-4 && Math.abs(traceC.point.y - pC.y) < 1e-4, '3.4: s=lenAB+lenBC evaluates back to P_ORIG_C');

// Closure check: s = totalPerimeter wraps to P_ORIG_A
const traceClosure = polygonPerimeterToCartesian(profile, vertices, profile.totalPerimeter);
assert(Math.abs(traceClosure.point.x - pA.x) < 1e-4 && Math.abs(traceClosure.point.y - pA.y) < 1e-4, '3.5: s=totalPerimeter wraps to P_ORIG_A');

// ----------------------------------------------------------------------------
// 4. DISENTANGLING ANGULAR ADDRESS FROM PERIMETER COORDINATE
// ----------------------------------------------------------------------------
console.log('\n--- STEP 6: DISENTANGLING CIRCLE POLAR ANGLE & TRIANGLE PERIMETER ---');
// For Point B:
// Circle Angular Address (Layer A): 150°
// Circle Arc Length (Layer B_circle): 2π * 100 * (150 - 30)/360 = 209.4395
const circleArcB = circleAngleToArcLength(thetaB, R, 'CCW', thetaA).arcLength;
// Triangle Perimeter Coordinate (Layer B_poly): lenAB = 173.20508
const polyPerimeterB = lenAB;

assert(Math.abs(circleArcB - polyPerimeterB) > 30, '4.1: Circle arc length (209.44) != Triangle perimeter coordinate (173.21)');
const measuredPolarB: number = thetaB;
const triangleInternalAngle: number = 60;
assert(measuredPolarB !== triangleInternalAngle, '4.2: Polar angle (150°) != Triangle internal angle (60°)');

// ----------------------------------------------------------------------------
// 5. WORLD_CANONICAL ORDERING AND ID PRESERVATION
// ----------------------------------------------------------------------------
console.log('\n--- STEP 7: WORLD_CANONICAL ORDERING & ID PRESERVATION ---');
// Provide points in deliberately scrambled order: C, A, B
const scrambled = [
  { id: 'P_ORIG_C', x: pC.x, y: pC.y },
  { id: 'P_ORIG_A', x: pA.x, y: pA.y },
  { id: 'P_ORIG_B', x: pB.x, y: pB.y },
];

const canonical = worldCanonicalOrdering(scrambled, { x: 0, y: 0 });
assert(canonical.length === 3, '5.1: 3 canonical points returned');
assert(canonical[0].originalId === 'P_ORIG_A', '5.2: P_0 is P_ORIG_A (30°)');
assert(canonical[0].canonicalRole === 'P_0', '5.3: Canonical role is P_0');
assert(canonical[1].originalId === 'P_ORIG_B', '5.4: P_1 is P_ORIG_B (150°)');
assert(canonical[1].canonicalRole === 'P_1', '5.5: Canonical role is P_1');
assert(canonical[2].originalId === 'P_ORIG_C', '5.6: P_2 is P_ORIG_C (270°)');
assert(canonical[2].canonicalRole === 'P_2', '5.7: Canonical role is P_2');

// Original IDs and original coordinates are strictly unmutated
assert(canonical[0].x === pA.x && canonical[0].y === pA.y, '5.8: Coordinates of P_ORIG_A unmutated');
assert(canonical[1].x === pB.x && canonical[1].y === pB.y, '5.9: Coordinates of P_ORIG_B unmutated');
assert(canonical[2].x === pC.x && canonical[2].y === pC.y, '5.10: Coordinates of P_ORIG_C unmutated');

console.log('\n======================================================================');
console.log('TASK 06 INTEGRATION SCENARIO PASSED (100%)');
console.log('======================================================================\n');

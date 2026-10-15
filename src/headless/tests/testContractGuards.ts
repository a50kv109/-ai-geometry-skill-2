// src/headless/tests/testContractGuards.ts
// Comprehensive Contract Guards & Hardening Regression Test Suite
// Verifies all strict contract guarantees: Duplicate ID, Idempotent Connect, 3D/Z rejection,
// Unknown Measures/Predicates, Intersections (none/tangent/secant), Observe FULL, State Inviolability, GSA Zero Trust.

import { HeadlessGeometrySession } from '../HeadlessGeometrySession';
import { FullObservation } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log('======================================================================');
console.log('RUNNING HEADLESS SKILL CONTRACT GUARDS TEST SUITE');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// 1. DUPLICATE POINT ID & STATE INVIOLABILITY
// ----------------------------------------------------------------------------
console.log('--- 1. DUPLICATE POINT ID ---');
const s1 = new HeadlessGeometrySession({ profile: 'blank' });
const p1Res = s1.create_point(10, 20, { id: 'P_ORIGINAL' });
assert(p1Res.success === true, '1.1: Original point created');

const snapBeforeDup = JSON.stringify((s1.observe('FULL') as FullObservation));
const p1Dup = s1.create_point(30, 40, { id: 'P_ORIGINAL' });
assert(p1Dup.success === false, '1.2: Duplicate point ID rejected with success=false');
assert(p1Dup.errorCode === 'DUPLICATE_ID', '1.3: Duplicate point ID errorCode is DUPLICATE_ID');
assert(p1Dup.stateChanged === false, '1.4: Duplicate point ID stateChanged is false');
const snapAfterDup = JSON.stringify((s1.observe('FULL') as FullObservation));
assert(snapBeforeDup === snapAfterDup, '1.5: State is 100% unmutated after DUPLICATE_ID rejection');

// ----------------------------------------------------------------------------
// 2. DUPLICATE CONNECT IDEMPOTENCY
// ----------------------------------------------------------------------------
console.log('\n--- 2. DUPLICATE CONNECT IDEMPOTENCY ---');
const s2 = new HeadlessGeometrySession({ profile: 'blank' });
s2.create_point(0, 0, { id: 'P_A' });
s2.create_point(4, 0, { id: 'P_B' });

const conn1 = s2.connect('P_A', 'P_B', 'SEGMENT');
assert(conn1.success === true && conn1.stateChanged === true, '2.1: First segment created');
const firstSegId = conn1.created[0].id;

const conn2 = s2.connect('P_A', 'P_B', 'SEGMENT');
assert(conn2.success === true, '2.2: Duplicate connect succeeds idempotently');
assert(conn2.stateChanged === false, '2.3: Duplicate connect stateChanged is false');
assert(conn2.created[0].id === firstSegId, '2.4: Duplicate connect returns existing segment ID');

// Reverse connection check
const conn3 = s2.connect('P_B', 'P_A', 'SEGMENT');
assert(conn3.success === true && conn3.stateChanged === false, '2.5: Reverse connect is idempotent');
assert(conn3.created[0].id === firstSegId, '2.6: Reverse connect returns existing segment ID');

const obsSegs = (s2.observe('FULL') as FullObservation).segments;
assert(Object.keys(obsSegs).length === 1, '2.7: Exactly 1 segment exists in state (no ghost duplicates)');

// ----------------------------------------------------------------------------
// 3. 3D / Z COORDINATE REJECTION
// ----------------------------------------------------------------------------
console.log('\n--- 3. 3D / Z COORDINATE REJECTION ---');
const s3 = new HeadlessGeometrySession({ profile: 'blank' });
const snapBefore3D = JSON.stringify((s3.observe('FULL') as FullObservation));

const zRes1 = s3.create_point(0, 0, { id: 'P_3D', z: 10 } as any);
assert(zRes1.success === false, '3.1: Point with z option rejected with success=false');
assert(zRes1.errorCode === 'CAPABILITY_GAP', '3.2: 3D point errorCode is CAPABILITY_GAP');
assert(zRes1.stateChanged === false, '3.3: 3D point stateChanged is false');

const zRes2 = (s3 as any).create_point(1, 2, 3);
assert(zRes2.success === false && zRes2.errorCode === 'CAPABILITY_GAP', '3.4: 3-argument point rejected as CAPABILITY_GAP');

const snapAfter3D = JSON.stringify((s3.observe('FULL') as FullObservation));
assert(snapBefore3D === snapAfter3D, '3.5: State is 100% unmutated after 3D rejection');

// ----------------------------------------------------------------------------
// 4. UNKNOWN MEASUREMENT & REAL MEASURE RESULT
// ----------------------------------------------------------------------------
console.log('\n--- 4. UNKNOWN MEASUREMENT & REAL MEASURE RESULT ---');
const s4 = new HeadlessGeometrySession({ profile: 'blank' });
s4.create_point(0, 0, { id: 'A' });
s4.create_point(0, 5, { id: 'B' });
const segAB = s4.connect('A', 'B', 'SEGMENT').created[0].id;

// Real measurement
const mReal = s4.measure(segAB, 'SEGMENT_LENGTH');
assert(mReal.success === true, '4.1: Real measurement returns success=true');
assert(mReal.records.length === 1 && mReal.records[0].value === 5, '4.2: Real measurement value is 5.0');

// Unknown metric
const mUnknown = s4.measure(segAB, 'HYPERBOLIC_CURVATURE');
assert(mUnknown.success === false, '4.3: Unknown measurement returns success=false');
assert(mUnknown.errorCode === 'CAPABILITY_GAP', '4.4: Unknown measurement errorCode is CAPABILITY_GAP');
assert(mUnknown.records.length === 0, '4.5: Unknown measurement records is empty');

// Unknown entity
const mNoEntity = s4.measure('NON_EXISTENT_ID', 'SEGMENT_LENGTH');
assert(mNoEntity.success === false, '4.6: Measurement on non-existent entity returns success=false');
assert(mNoEntity.errorCode === 'ENTITY_NOT_FOUND', '4.7: Unknown entity errorCode is ENTITY_NOT_FOUND');

// ----------------------------------------------------------------------------
// 5. UNKNOWN PREDICATE REJECTION
// ----------------------------------------------------------------------------
console.log('\n--- 5. UNKNOWN PREDICATE REJECTION ---');
const s5 = new HeadlessGeometrySession({ profile: 'blank' });
s5.create_point(0, 0, { id: 'A' });
s5.create_point(4, 0, { id: 'B' });
s5.create_point(0, 3, { id: 'C' });
const sAB = s5.connect('A', 'B', 'SEGMENT').created[0].id;
const sAC = s5.connect('A', 'C', 'SEGMENT').created[0].id;

const vUnknown = s5.verify(sAC, 'CONGRUENT_TRIANGLE' as any, sAB);
assert(vUnknown.verified === false, '5.1: Unknown predicate returns verified=false');
assert(vUnknown.errorCode === 'CAPABILITY_GAP', '5.2: Unknown predicate errorCode is CAPABILITY_GAP');

const vReal = s5.verify(sAC, 'PERPENDICULAR_TO', sAB);
assert(vReal.verified === true, '5.3: Real PERPENDICULAR_TO predicate returns verified=true');
assert(vReal.errorCode === undefined, '5.4: Valid predicate has no error code');

// ----------------------------------------------------------------------------
// 6. INTERSECTION SEMANTICS (NO_INTERSECTION / TANGENT / TWO_INTERSECTIONS)
// ----------------------------------------------------------------------------
console.log('\n--- 6. INTERSECTION SEMANTICS ---');
const s6 = new HeadlessGeometrySession({ profile: 'blank' });

// Circle at (0,0) radius 5
s6.create_point(0, 0, { id: 'O' });
const circ = s6.create_circle('O', 5).created[0].id;

// Case 6A: Disjoint line (no intersection)
s6.create_point(10, -5, { id: 'L1_A' });
s6.create_point(10, 5, { id: 'L1_B' });
const lineDisjoint = s6.connect('L1_A', 'L1_B', 'LINE').created[0].id;

const intDisjoint = s6.intersect(lineDisjoint, circ);
assert(intDisjoint.success === false, '6.1: Disjoint intersection returns success=false');
assert(intDisjoint.errorCode === 'NO_INTERSECTION', '6.2: Disjoint intersection errorCode is NO_INTERSECTION');
assert(intDisjoint.stateChanged === false, '6.3: Disjoint intersection stateChanged is false');
assert(intDisjoint.created.length === 0, '6.4: Disjoint intersection creates 0 points');

// Case 6B: Tangent line at x=5
s6.create_point(5, -5, { id: 'L2_A' });
s6.create_point(5, 5, { id: 'L2_B' });
const lineTangent = s6.connect('L2_A', 'L2_B', 'LINE').created[0].id;

const intTangent = s6.intersect(lineTangent, circ);
assert(intTangent.success === true, '6.5: Tangent intersection returns success=true');
assert(intTangent.created.length === 1, '6.6: Tangent intersection returns exactly 1 root');
assert(intTangent.created[0].rootIndex === 0, '6.7: Tangent root has rootIndex=0');
const tangentPt = (s6.observe('OBJECT', intTangent.created[0].id) as any).data;
assert(Math.abs(tangentPt.x - 5) < 1e-4 && Math.abs(tangentPt.y - 0) < 1e-4, '6.8: Tangent coordinate is (5, 0)');

// Case 6C: Secant line at y=3 (two intersections at x=-4 and x=4)
s6.create_point(-10, 3, { id: 'L3_A' });
s6.create_point(10, 3, { id: 'L3_B' });
const lineSecant = s6.connect('L3_A', 'L3_B', 'LINE').created[0].id;

const intSecant = s6.intersect(lineSecant, circ);
assert(intSecant.success === true, '6.9: Secant intersection returns success=true');
assert(intSecant.created.length === 2, '6.10: Secant intersection returns exactly 2 roots');
assert(intSecant.created[0].rootIndex === 0 && intSecant.created[1].rootIndex === 1, '6.11: Roots have indices 0 and 1');

// Case 6D: Snapshot semantics (moving parent does not auto-recompute intersection)
const intPtId = intSecant.created[0].id;
const initialPtX = (s6.observe('OBJECT', intPtId) as any).data.x;
s6.move('L3_A', -10, 4); // Move line endpoint
const postMovePtX = (s6.observe('OBJECT', intPtId) as any).data.x;
assert(initialPtX === postMovePtX, '6.12: Materialized intersection is a snapshot and did not mutate upon parent move');

// ----------------------------------------------------------------------------
// 7. OBSERVE FULL
// ----------------------------------------------------------------------------
console.log('\n--- 7. OBSERVE FULL ---');
const s7 = new HeadlessGeometrySession({ profile: 'blank' });
s7.create_point(0, 0, { id: 'P1' });
s7.create_point(1, 0, { id: 'P2' });
s7.connect('P1', 'P2', 'SEGMENT');
s7.create_circle('P1', 2);

const fullObs = s7.observe('FULL') as FullObservation;
assert(fullObs.mode === 'FULL', '7.1: Observe FULL returns mode FULL');
assert(Object.keys(fullObs.points).length === 2, '7.2: Full observation points dictionary matched');
assert(Object.keys(fullObs.segments).length === 1, '7.3: Full observation segments dictionary matched');
assert(Object.keys(fullObs.circles).length === 1, '7.4: Full observation circles dictionary matched');

// ----------------------------------------------------------------------------
// 8. GSA ZERO TRUST & CORRUPTION REJECTION
// ----------------------------------------------------------------------------
console.log('\n--- 8. GSA ZERO TRUST ---');
const s8Producer = new HeadlessGeometrySession({ profile: 'blank' });
s8Producer.create_point(0, 0, { id: 'P_A' });
s8Producer.create_point(4, 0, { id: 'P_B' });
s8Producer.create_point(0, 3, { id: 'P_C' });
const s8AB = s8Producer.connect('P_A', 'P_B', 'SEGMENT').created[0].id;
const s8AC = s8Producer.connect('P_A', 'P_C', 'SEGMENT').created[0].id;
s8Producer.recordCertifiedClaim('c_right_angle', 'PERPENDICULAR_TO', s8AC, s8AB);
const gsa = s8Producer.exportSolutionArtifact();

// Receiver verifies valid artifact
const s8Receiver = new HeadlessGeometrySession({ profile: 'blank' });
const importValid = s8Receiver.importSolutionArtifact(gsa);
assert(importValid.success === true && importValid.status === 'ACCEPTED', '8.1: Valid GSA accepted by Zero-Trust receiver');

// Receiver catches corrupted claim
const tamperedGsa = JSON.parse(JSON.stringify(gsa));
tamperedGsa.certifiedClaims.push({
  claimId: 'fake_claim',
  predicate: 'PERPENDICULAR_TO',
  subjectId: 'seg_1',
  referenceId: 'seg_1', // A segment cannot be perpendicular to itself!
  expectedStatus: 'VERIFIED',
});
const s8ReceiverCorrupt = new HeadlessGeometrySession({ profile: 'blank' });
const importCorrupt = s8ReceiverCorrupt.importSolutionArtifact(tamperedGsa);
assert(importCorrupt.success === false && importCorrupt.status === 'MISMATCH', '8.2: Tampered claim caught and rejected as MISMATCH');

console.log('\n======================================================================');
console.log('ALL CONTRACT GUARD TEST SUITES PASSED (100%)');
console.log('======================================================================');

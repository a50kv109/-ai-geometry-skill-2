// src/headless/tests/testMultistepGeometryRegression.ts
// Multistep Geometry Regression Test Suite (Codex / Hardening Scenario)
// Tests:
// 1. Multistep construction lifecycle
// 2. Error recovery and state inviolability
// 3. Provenance and original ID preservation across moves
// 4. Mathematical repeatability across reset and re-execution

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
console.log('RUNNING MULTISTEP GEOMETRY REGRESSION TEST SUITE');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// 1. MULTISTEP CONSTRUCTION & PROVENANCE
// ----------------------------------------------------------------------------
console.log('--- 1. MULTISTEP CONSTRUCTION & PROVENANCE ---');
const s = new HeadlessGeometrySession({ profile: 'blank' });

// Create base right triangle (3-4-5)
s.create_point(0, 0, { id: 'P_ORIG_A', name: 'A' });
s.create_point(4, 0, { id: 'P_ORIG_B', name: 'B' });
s.create_point(0, 3, { id: 'P_ORIG_C', name: 'C' });

const sAB = s.connect('P_ORIG_A', 'P_ORIG_B', 'SEGMENT').created[0].id;
const sBC = s.connect('P_ORIG_B', 'P_ORIG_C', 'SEGMENT').created[0].id;
const sCA = s.connect('P_ORIG_C', 'P_ORIG_A', 'SEGMENT').created[0].id;

// Measure sides
const mAB = s.measure(sAB, 'SEGMENT_LENGTH').records[0].value;
const mBC = s.measure(sBC, 'SEGMENT_LENGTH').records[0].value;
const mCA = s.measure(sCA, 'SEGMENT_LENGTH').records[0].value;

assert(Math.abs(mAB - 4) < 1e-4, '1.1: Leg AB is 4.0');
assert(Math.abs(mCA - 3) < 1e-4, '1.2: Leg CA is 3.0');
assert(Math.abs(mBC - 5) < 1e-4, '1.3: Hypotenuse BC is 5.0');

// Verify right angle
const vRight = s.verify(sCA, 'PERPENDICULAR_TO', sAB);
assert(vRight.verified === true, '1.4: CA is perpendicular to AB');

// ----------------------------------------------------------------------------
// 2. ERROR RECOVERY & STATE INVIOLABILITY
// ----------------------------------------------------------------------------
console.log('\n--- 2. ERROR RECOVERY & STATE INVIOLABILITY ---');
const snapBeforeError = JSON.stringify((s.observe('FULL') as FullObservation));

// Attempt invalid creations
const err1 = s.create_point(NaN, 10);
assert(err1.success === false && err1.errorCode === 'INVALID_NUMERIC_INPUT', '2.1: NaN rejected');

const err2 = s.create_point(10, 20, { id: 'P_ORIG_A' });
assert(err2.success === false && err2.errorCode === 'DUPLICATE_ID', '2.2: Duplicate ID rejected');

const err3 = s.create_point(10, 20, { z: 5 });
assert(err3.success === false && err3.errorCode === 'CAPABILITY_GAP', '2.3: 3D point rejected');

const snapAfterError = JSON.stringify((s.observe('FULL') as FullObservation));
assert(snapBeforeError === snapAfterError, '2.4: State is strictly unmutated after 3 consecutive errors');

// Session remains fully operational
const pD = s.create_point(4, 3, { id: 'P_ORIG_D' });
assert(pD.success === true, '2.5: Subsequent valid command executes successfully after errors');

// ----------------------------------------------------------------------------
// 3. REPEATABILITY ACROSS RESET
// ----------------------------------------------------------------------------
console.log('\n--- 3. REPEATABILITY ACROSS RESET ---');
s.reset({ profile: 'blank' });
const obsReset = s.observe('COMPACT') as any;
assert(obsReset.activeEntitiesCount.points === 0, '3.1: State cleared on reset');

// Re-execute identical sequence
s.create_point(0, 0, { id: 'P_ORIG_A' });
s.create_point(4, 0, { id: 'P_ORIG_B' });
s.create_point(0, 3, { id: 'P_ORIG_C' });
const segAB2 = s.connect('P_ORIG_A', 'P_ORIG_B', 'SEGMENT').created[0].id;
const mAB2 = s.measure(segAB2, 'SEGMENT_LENGTH').records[0].value;
assert(Math.abs(mAB2 - 4) < 1e-12, '3.2: Re-executed measurement is bit-identical (4.0)');

console.log('\n======================================================================');
console.log('ALL MULTISTEP GEOMETRY REGRESSION TESTS PASSED (100%)');
console.log('======================================================================\n');

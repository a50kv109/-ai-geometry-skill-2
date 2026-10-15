// src/headless/tests/testHeadlessSkillPoC.ts
// Test Suite for Headless AI Geometry Skill PoC (Phase 3)
// Covers Scenarios A through J

import { HeadlessGeometrySession } from '../HeadlessGeometrySession';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log('======================================================================');
console.log('RUNNING HEADLESS AI GEOMETRY SKILL PoC TEST SUITE (PHASE 3)');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// SCENARIO A: Create Triangle on Blank Sheet
// ----------------------------------------------------------------------------
console.log('--- SCENARIO A: Create Triangle on Blank Sheet ---');
const session = new HeadlessGeometrySession({ profile: 'blank' });

const rA = session.create_point(0, 0, { id: 'P_A' });
const rB = session.create_point(4, 0, { id: 'P_B' });
const rC = session.create_point(0, 3, { id: 'P_C' });

assert(rA.success && rB.success && rC.success, 'A.1: Points P_A, P_B, P_C created successfully');
assert(rA.created[0].id === 'P_A', 'A.2: Machine ID P_A recorded');

const rAB = session.connect('P_A', 'P_B', 'SEGMENT');
const rBC = session.connect('P_B', 'P_C', 'SEGMENT');
const rCA = session.connect('P_C', 'P_A', 'SEGMENT');

assert(rAB.success && rBC.success && rCA.success, 'A.3: Segments AB, BC, CA connected');
const segABId = rAB.created[0].id;
const segBCId = rBC.created[0].id;
const segCAId = rCA.created[0].id;

const obsCompact = session.observe('COMPACT') as any;
assert(obsCompact.activeEntitiesCount.points === 3, 'A.4: Active points count is 3');
assert(obsCompact.activeEntitiesCount.segments === 3, 'A.5: Active segments count is 3');

// ----------------------------------------------------------------------------
// SCENARIO B: Construct Perpendicular
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO B: Construct Perpendicular ---');
// Construct perpendicular to AB through P_C
const rPerp = session.construct('PERPENDICULAR', {
  reference: segABId,
  through: 'P_C',
});

assert(rPerp.success === true, 'B.1: Construct perpendicular succeeded');
assert(rPerp.created.length > 0, 'B.2: Perpendicular and auxiliary elements created');
const perpLineId = rPerp.created.find((c) => c.type === 'LINE')?.id;
assert(perpLineId !== undefined, 'B.3: Primary perpendicular line ID resolved');

// ----------------------------------------------------------------------------
// SCENARIO C: Verify Perpendicularity (Strict Epsilon: 1e-4)
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO C: Verify Perpendicularity ---');
const vPerp = session.verify(perpLineId!, 'PERPENDICULAR_TO', segABId);
assert(vPerp.verified === true, 'C.1: Line is verified perpendicular to AB');
assert(vPerp.threshold === 1e-4, 'C.2: Strict receiver-owned threshold 1e-4 enforced');
assert(vPerp.difference !== undefined && vPerp.difference < 1e-4, 'C.3: Difference is within strict threshold');

// Record certified claim for later export
session.recordCertifiedClaim('claim_perp_1', 'PERPENDICULAR_TO', perpLineId!, segABId);

// ----------------------------------------------------------------------------
// SCENARIO D: Measure Geometry
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO D: Measure Geometry ---');
const mAB = session.measure(segABId, 'SEGMENT_LENGTH');
const mBC = session.measure(segBCId, 'SEGMENT_LENGTH');
const mCA = session.measure(segCAId, 'SEGMENT_LENGTH');

assert(mAB.success && mAB.records.length > 0 && Math.abs(mAB.records[0].value - 4) < 1e-4, `D.1: AB length measured 4.0 (got ${mAB.records[0]?.value})`);
assert(mBC.success && mBC.records.length > 0 && Math.abs(mBC.records[0].value - 5) < 1e-4, `D.2: BC hypotenuse measured 5.0 (got ${mBC.records[0]?.value})`);
assert(mCA.success && mCA.records.length > 0 && Math.abs(mCA.records[0].value - 3) < 1e-4, `D.3: CA length measured 3.0 (got ${mCA.records[0]?.value})`);

// ----------------------------------------------------------------------------
// SCENARIO E: Move Vertex & Kinematics
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO E: Move Vertex ---');
const rMove = session.move('P_C', 0, 4);
assert(rMove.success === true, 'E.1: Move P_C to (0, 4) succeeded');
const mCAAfter = session.measure(segCAId, 'SEGMENT_LENGTH');
assert(mCAAfter.success && Math.abs(mCAAfter.records[0].value - 4) < 1e-4, `E.2: CA length updated dynamically to 4.0 (got ${mCAAfter.records[0]?.value})`);
const mBCAfter = session.measure(segBCId, 'SEGMENT_LENGTH');
assert(mBCAfter.success && Math.abs(mBCAfter.records[0].value - Math.hypot(4, 4)) < 1e-4, 'E.3: BC length updated dynamically to ~5.6568');

// ----------------------------------------------------------------------------
// SCENARIO F: Dynamic Geometry VALID -> INVALID -> VALID
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO F: Dynamic Geometry (VALID -> INVALID -> VALID) ---');
// In right-angled state at (0, 4), segCA (vertical) is perpendicular to segAB (horizontal)
const vF1 = session.verify(segCAId, 'PERPENDICULAR_TO', segABId);
assert(vF1.verified === true, 'F.1: [VALID] segCA is perpendicular to segAB');

// Invalidate: move P_C to (2, 4)
session.move('P_C', 2, 4);
const vF2 = session.verify(segCAId, 'PERPENDICULAR_TO', segABId);
assert(vF2.verified === false, 'F.2: [INVALID] segCA is NO LONGER perpendicular to segAB');

// Restore: move P_C back to (0, 4)
session.move('P_C', 0, 4);
const vF3 = session.verify(segCAId, 'PERPENDICULAR_TO', segABId);
assert(vF3.verified === true, 'F.3: [VALID RESTORED] segCA is perpendicular to segAB again');

// ----------------------------------------------------------------------------
// SCENARIO G: Two-Intersection Case (Multiple Roots Preserved with rootIndex)
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO G: Two-Intersection Case ---');
// Create a circle C(O(0,0), R=5) and a horizontal secant line through y=3
const rCirc = session.create_circle('P_A', 5);
const cId = rCirc.created[0].id;

const ptL1 = session.create_point(-10, 3, { id: 'P_L1' });
const ptL2 = session.create_point(10, 3, { id: 'P_L2' });
const rLine = session.connect('P_L1', 'P_L2', 'LINE');
const lineSecantId = rLine.created[0].id;

const rInt = session.intersect(cId, lineSecantId);
assert(rInt.success === true, 'G.1: Circle-Line intersection executed');
assert(rInt.created.length === 2, `G.2: Exactly 2 intersection roots found (got ${rInt.created.length})`);
assert(rInt.created[0].rootIndex === 0, 'G.3: First root has rootIndex: 0');
assert(rInt.created[1].rootIndex === 1, 'G.4: Second root has rootIndex: 1');

// Verify coordinates: x^2 + 3^2 = 5^2 => x = -4, +4
const obsP1 = session.observe('OBJECT', rInt.created[0].id) as any;
const obsP2 = session.observe('OBJECT', rInt.created[1].id) as any;
assert(Math.abs(obsP1.data.x - (-4)) < 1e-4 && Math.abs(obsP1.data.y - 3) < 1e-4, 'G.5: Root 0 coordinate is (-4, 3)');
assert(Math.abs(obsP2.data.x - 4) < 1e-4 && Math.abs(obsP2.data.y - 3) < 1e-4, 'G.6: Root 1 coordinate is (4, 3)');

// ----------------------------------------------------------------------------
// SCENARIO H: Invalid Numeric Input & State Inviolability
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO H: Invalid Numeric Input & State Inviolability ---');
const prevDigest = session.observe('COMPACT') as any;
const rBadPoint = session.create_point(NaN, Infinity);

assert(rBadPoint.success === false, 'H.1: Point with NaN/Infinity coordinates is rejected');
assert(rBadPoint.errorCode === 'INVALID_NUMERIC_INPUT', 'H.2: Error code is INVALID_NUMERIC_INPUT');

const nextDigest = session.observe('COMPACT') as any;
assert(
  prevDigest.activeEntitiesCount.points === nextDigest.activeEntitiesCount.points,
  'H.3: State remained 100% unmutated after rejected command'
);

// ----------------------------------------------------------------------------
// SCENARIO I: GSA Export (Self-Describing Artifact)
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO I: GSA Export ---');
const artifact = session.exportSolutionArtifact({
  goalDescription: 'Demonstrate right-angle triangle construction and perpendicular secant',
  agentReasoningTraceSummary: 'Constructed triangle ABC, verified perpendicularity, and found circle secants.',
});

assert(artifact.metadata.artifactType === 'GEOMETRIC_SOLUTION_ARTIFACT', 'I.1: Artifact format is GEOMETRIC_SOLUTION_ARTIFACT');
assert(artifact.producer.producerId === 'triangle-stand-skill', 'I.2: Producer metadata attached');
assert(artifact.resolver.resolverSkillId === 'triangle-stand-skill', 'I.3: Resolver reference attached');
assert(
  artifact.resolver.canonicalSource.repository === 'https://github.com/google-ai-studio/geometry-reasoning-stand',
  'I.4: Canonical repository reference included'
);
assert(artifact.pgsPayload !== undefined, 'I.5: PGS-2D payload encapsulated');
assert(artifact.provenance.length > 0, 'I.6: Provenance history recorded');
assert(artifact.certifiedClaims.length > 0, 'I.7: Certified claim included');

// ----------------------------------------------------------------------------
// SCENARIO J: GSA Import + Zero Trust Local Verification
// ----------------------------------------------------------------------------
console.log('\n--- SCENARIO J: GSA Import + Zero Trust Local Verification ---');
// Agent B initializes clean session
const sessionB = new HeadlessGeometrySession({ profile: 'blank' });

// 1. Valid import case
const importResult = sessionB.importSolutionArtifact(artifact);
assert(importResult.success === true, 'J.1: Artifact imported successfully by Agent B');
assert(importResult.status === 'ACCEPTED', 'J.2: Import status is ACCEPTED');
assert(importResult.localVerificationChecks.length > 0, 'J.3: Local verification executed on certified claims');
assert(importResult.localVerificationChecks[0].passed === true, 'J.4: Claim independently verified by Agent B Stand');

// 2. Corrupted claim case (Zero Trust test)
const corruptedArtifact = JSON.parse(JSON.stringify(artifact));
// Modify certified claim to claim perpendicularity between parallel lines
corruptedArtifact.certifiedClaims[0].subjectId = segABId;
corruptedArtifact.certifiedClaims[0].referenceId = segABId; // A line to itself is not perpendicular!

const sessionC = new HeadlessGeometrySession({ profile: 'blank' });
const corruptResult = sessionC.importSolutionArtifact(corruptedArtifact);
assert(corruptResult.success === false, 'J.5: Corrupted claim correctly rejected');
assert(corruptResult.status === 'MISMATCH', 'J.6: Status reported as MISMATCH');

// ----------------------------------------------------------------------------
// LIFECYCLE FORK & ROLLBACK TEST
// ----------------------------------------------------------------------------
console.log('\n--- LIFECYCLE: Fork & Rollback Test ---');
const forkRes = session.fork();
assert(forkRes.success && forkRes.sandboxId.startsWith('sandbox_'), 'L.1: Sandbox successfully forked');

// Mutate state in active session
session.create_point(100, 100, { id: 'P_Temp' });
const obsMutated = session.observe('COMPACT') as any;
assert(obsMutated.activeEntityIds.points.includes('P_Temp'), 'L.2: Temporary point added');

// Rollback
const rollbackRes = session.rollback(forkRes.sandboxId);
assert(rollbackRes.success === true, 'L.3: Rollback succeeded');
const obsRestored = session.observe('COMPACT') as any;
assert(!obsRestored.activeEntityIds.points.includes('P_Temp'), 'L.4: State restored, temporary point eliminated');

console.log('\n======================================================================');
console.log('ALL PHASE 3 HEADLESS SKILL SCENARIOS (A-J) PASSED WITH ZERO ERRORS');
console.log('======================================================================');

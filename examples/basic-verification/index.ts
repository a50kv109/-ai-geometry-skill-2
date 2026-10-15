// examples/basic-verification/index.ts
// Minimal standalone example demonstrating Headless AI Geometry Skill v1.0.0
// "REASON OUTSIDE. VERIFY INSIDE."

import { HeadlessGeometrySession } from '../../src/headless/HeadlessGeometrySession';

console.log('====================================================');
console.log('AI GEOMETRY SKILL v1.0.0 — BASIC VERIFICATION DEMO');
console.log('====================================================\n');

// 1. Initialize Headless Session on a blank canvas
const session = new HeadlessGeometrySession({ profile: 'blank' });

// 2. Construct Geometry: Triangle with vertices A(0,0), B(4,0), C(0,3)
console.log('[Step 1] Constructing geometry...');
session.create_point(0, 0, { id: 'A' });
session.create_point(4, 0, { id: 'B' });
session.create_point(0, 3, { id: 'C' });

const segAB = session.connect('A', 'B', 'SEGMENT').created[0].id;
const segAC = session.connect('A', 'C', 'SEGMENT').created[0].id;
const segBC = session.connect('B', 'C', 'SEGMENT').created[0].id;

console.log(`  - Points created: A(0,0), B(4,0), C(0,3)`);
console.log(`  - Segments connected: AB (${segAB}), AC (${segAC}), BC (${segBC})`);

// 3. Take Measurements
const resAB = session.measure(segAB, 'SEGMENT_LENGTH');
const resAC = session.measure(segAC, 'SEGMENT_LENGTH');
const resBC = session.measure(segBC, 'SEGMENT_LENGTH');

const lenAB = resAB.records[0]?.value;
const lenAC = resAC.records[0]?.value;
const lenBC = resBC.records[0]?.value;

console.log('\n[Step 2] Measuring metrics:');
console.log(`  - |AB| = ${lenAB}`);
console.log(`  - |AC| = ${lenAC}`);
console.log(`  - |BC| = ${lenBC} (Hypotenuse)`);

// 4. Verify Geometric Relation (Receiver-Owned Strict Verification)
console.log('\n[Step 3] Verifying perpendicularity (AC perp AB):');
const verification = session.verify(segAC, 'PERPENDICULAR_TO', segAB);

console.log(`  - Verified: ${verification.verified}`);
console.log(`  - Relation: ${verification.relation}`);
console.log(`  - Numerical difference: ${verification.difference}`);
console.log(`  - Receiver threshold: ${verification.threshold}`);
console.log(`  - Explanation: ${verification.explanation}`);

// 5. Export GSA (Geometric Solution Artifact)
console.log('\n[Step 4] Exporting solution artifact (GSA v0.1):');
session.recordCertifiedClaim('claim_right_angle', 'PERPENDICULAR_TO', segAC, segAB);
const gsa = session.exportSolutionArtifact({
  goalDescription: 'Verify right triangle ABC orthogonality',
  agentReasoningTraceSummary: 'Constructed legs of length 4 and 3, verified exact orthogonality.',
});

console.log(`  - Artifact ID: ${gsa.metadata.artifactId}`);
console.log(`  - Format Version: ${gsa.metadata.formatVersion}`);
console.log(`  - Objects in PGS payload: ${gsa.pgsPayload.objects.length}`);
console.log(`  - Certified claims: ${gsa.certifiedClaims.length}`);

console.log('\n[Success] Deterministic verification completed without LLM approximations.');

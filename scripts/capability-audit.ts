// scripts/capability-audit.ts
// Autonomous Capability Audit for Portable AI Skill MVP v0.1
// Enforces: DECLARED ≠ DISCOVERED ≠ RUNTIME_CHECKED
// "REASON OUTSIDE. VERIFY INSIDE."

import * as fs from 'fs';
import * as path from 'path';
import { HeadlessGeometrySession } from '../src/headless/HeadlessGeometrySession';
import { FullObservation } from '../src/headless/types';

interface AuditItem {
  capability: string;
  declared: boolean;
  discovered: boolean;
  runtimeChecked: boolean;
  status: 'RUNTIME_CHECKED' | 'DISCOVERED_ONLY' | 'DECLARED_ONLY' | 'MISSING';
  evidence: string;
}

console.log('======================================================================');
console.log('PORTABLE AI SKILL MVP v0.1 — RUNTIME CAPABILITY AUDIT');
console.log('======================================================================\n');

// 1. MANIFEST & SCHEMA INTEGRITY CHECK
console.log('[Phase 1] Inspecting Manifest & Schema Declarations...');
const manifestPath = path.resolve(process.cwd(), 'skill.manifest.json');
const schemaPath = path.resolve(process.cwd(), 'schemas/skill.manifest.schema.json');

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ FAIL: skill.manifest.json not found at ${manifestPath}`);
  process.exit(1);
}
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ FAIL: skill.manifest.schema.json not found at ${schemaPath}`);
  process.exit(1);
}

const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestRaw);
const schemaRaw = fs.readFileSync(schemaPath, 'utf8');
const schema = JSON.parse(schemaRaw);

console.log(`  ✓ Manifest loaded: ${manifest.name} v${manifest.version} (${manifest.status})`);
console.log(`  ✓ Schema loaded: ${schema.title} (${schema.description})`);

// 2. RUNTIME CAPABILITY CHECKS
console.log('\n[Phase 2] Executing Live Runtime Kernel Verification...');
const auditResults: AuditItem[] = [];

function recordAudit(
  capability: string,
  declaredInManifest: boolean,
  discoveredInSession: boolean,
  checkFn: () => { passed: boolean; evidence: string }
) {
  let passed = false;
  let evidence = '';
  try {
    const res = checkFn();
    passed = res.passed;
    evidence = res.evidence;
  } catch (err: any) {
    passed = false;
    evidence = `Runtime exception: ${err.message}`;
  }

  let status: AuditItem['status'] = 'MISSING';
  if (declaredInManifest && discoveredInSession && passed) {
    status = 'RUNTIME_CHECKED';
  } else if (!declaredInManifest && discoveredInSession) {
    status = 'DISCOVERED_ONLY';
  } else if (declaredInManifest && !discoveredInSession) {
    status = 'DECLARED_ONLY';
  }

  auditResults.push({
    capability,
    declared: declaredInManifest,
    discovered: discoveredInSession,
    runtimeChecked: passed,
    status,
    evidence,
  });

  const icon = passed ? '✓' : '❌';
  console.log(`  ${icon} [${status}] ${capability}: ${evidence}`);
}

// Check 1: 2D Point Creation & Duplicate Guard
recordAudit(
  'PLANAR_PRIMITIVES_2D',
  manifest.supportedCapabilities.includes('PLANAR_PRIMITIVES_2D'),
  typeof HeadlessGeometrySession.prototype.create_point === 'function',
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    const r1 = session.create_point(0, 0, { id: 'P1' });
    const r2 = session.create_point(4, 0, { id: 'P2' });
    const rDup = session.create_point(1, 1, { id: 'P1' });
    const passed = r1.success && r2.success && !rDup.success && rDup.errorCode === 'DUPLICATE_ID';
    return { passed, evidence: 'Points created at (0,0),(4,0); duplicate ID rejected with DUPLICATE_ID' };
  }
);

// Check 2: 3D / Z Coordinate Guard
recordAudit(
  '3D_COORDINATE_GUARD',
  manifest.capabilityGaps.includes('NO_3D_STEREOMETRY'),
  true,
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    const r3D = session.create_point(0, 0, { id: 'P3', z: 10 } as any);
    const passed = !r3D.success && r3D.errorCode === 'CAPABILITY_GAP' && !r3D.stateChanged;
    return { passed, evidence: '3D coordinate rejected with CAPABILITY_GAP; state unmutated' };
  }
);

// Check 3: Idempotent Segment / Line Connect
recordAudit(
  'CONNECT_IDEMPOTENCY',
  manifest.supportedCapabilities.includes('PLANAR_PRIMITIVES_2D'),
  typeof HeadlessGeometrySession.prototype.connect === 'function',
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    session.create_point(0, 0, { id: 'A' });
    session.create_point(4, 0, { id: 'B' });
    const c1 = session.connect('A', 'B', 'SEGMENT');
    const c2 = session.connect('A', 'B', 'SEGMENT');
    const passed = c1.success && c2.success && !c2.stateChanged && c1.created[0].id === c2.created[0].id;
    return { passed, evidence: `First connect created ${c1.created[0].id}; second connect returned same ID idempotently` };
  }
);

// Check 4: Exact Metric Measurements
recordAudit(
  'EXACT_METRIC_MEASUREMENTS',
  manifest.supportedCapabilities.includes('EXACT_METRIC_MEASUREMENTS'),
  typeof HeadlessGeometrySession.prototype.measure === 'function',
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    session.create_point(0, 0, { id: 'A' });
    session.create_point(0, 3, { id: 'C' });
    const sAC = session.connect('A', 'C', 'SEGMENT').created[0].id;
    const m = session.measure(sAC, 'SEGMENT_LENGTH');
    const mUnknown = session.measure(sAC, 'HYPERBOLIC_LENGTH');
    const passed = m.success && Math.abs(m.records[0].value - 3) < 1e-4 && !mUnknown.success && mUnknown.errorCode === 'CAPABILITY_GAP';
    return { passed, evidence: `Segment length measured exactly 3.0; unknown metric rejected with CAPABILITY_GAP` };
  }
);

// Check 5: Predicate Verification with Receiver Epsilon
recordAudit(
  'RECEIVER_OWNED_PREDICATE_VERIFICATION',
  manifest.supportedCapabilities.includes('RECEIVER_OWNED_PREDICATE_VERIFICATION'),
  typeof HeadlessGeometrySession.prototype.verify === 'function',
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    session.create_point(0, 0, { id: 'A' });
    session.create_point(4, 0, { id: 'B' });
    session.create_point(0, 3, { id: 'C' });
    const sAB = session.connect('A', 'B', 'SEGMENT').created[0].id;
    const sAC = session.connect('A', 'C', 'SEGMENT').created[0].id;
    const vPerp = session.verify(sAC, 'PERPENDICULAR_TO', sAB);
    const vUnknown = session.verify(sAC, 'NON_EXISTENT_PREDICATE' as any, sAB);
    const passed = vPerp.verified === true && vPerp.threshold === 1e-4 && vUnknown.verified === false && vUnknown.errorCode === 'CAPABILITY_GAP';
    return { passed, evidence: `PERPENDICULAR_TO verified at eps=1e-4; unknown predicate rejected with CAPABILITY_GAP` };
  }
);

// Check 6: Intersections (No Intersection / Tangent / Secant & Snapshot Semantics)
recordAudit(
  'ALGEBRAIC_INTERSECTIONS',
  manifest.supportedCapabilities.includes('ALGEBRAIC_INTERSECTIONS'),
  typeof HeadlessGeometrySession.prototype.intersect === 'function',
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    session.create_point(0, 0, { id: 'O' });
    const circ = session.create_circle('O', 5).created[0].id;

    // Disjoint
    session.create_point(10, 0, { id: 'D1' });
    session.create_point(10, 5, { id: 'D2' });
    const lDisjoint = session.connect('D1', 'D2', 'LINE').created[0].id;
    const intDisjoint = session.intersect(lDisjoint, circ);

    // Secant
    session.create_point(-10, 3, { id: 'S1' });
    session.create_point(10, 3, { id: 'S2' });
    const lSecant = session.connect('S1', 'S2', 'LINE').created[0].id;
    const intSecant = session.intersect(lSecant, circ);

    // Snapshot check
    const ptId = intSecant.created[0].id;
    const xInit = (session.observe('OBJECT', ptId) as any).data.x;
    session.move('S1', -10, 4);
    const xPost = (session.observe('OBJECT', ptId) as any).data.x;

    const passed =
      !intDisjoint.success &&
      intDisjoint.errorCode === 'NO_INTERSECTION' &&
      intSecant.success &&
      intSecant.created.length === 2 &&
      intSecant.created[0].rootIndex === 0 &&
      intSecant.created[1].rootIndex === 1 &&
      xInit === xPost;

    return { passed, evidence: 'Disjoint line -> NO_INTERSECTION, secant -> 2 roots (0, 1), parent move does not mutate snapshot' };
  }
);

// Check 7: Observe FULL
recordAudit(
  'OBSERVE_FULL_DICTIONARY',
  true,
  typeof HeadlessGeometrySession.prototype.observe === 'function',
  () => {
    const session = new HeadlessGeometrySession({ profile: 'blank' });
    session.create_point(0, 0, { id: 'A' });
    session.create_point(1, 1, { id: 'B' });
    session.connect('A', 'B', 'SEGMENT');
    const obs = session.observe('FULL') as FullObservation;
    const passed = obs.mode === 'FULL' && Object.keys(obs.points).length === 2 && Object.keys(obs.segments).length === 1;
    return { passed, evidence: 'Observe FULL returns complete dictionaries from FullGeometryState SSOT' };
  }
);

// Check 8: GSA Zero-Trust Packaging & Verification
recordAudit(
  'GSA_ZERO_TRUST_PACKAGING',
  manifest.supportedCapabilities.includes('GSA_ZERO_TRUST_PACKAGING'),
  typeof HeadlessGeometrySession.prototype.exportSolutionArtifact === 'function',
  () => {
    const producer = new HeadlessGeometrySession({ profile: 'blank' });
    producer.create_point(0, 0, { id: 'P_A' });
    producer.create_point(4, 0, { id: 'P_B' });
    producer.create_point(0, 3, { id: 'P_C' });
    const sAB = producer.connect('P_A', 'P_B', 'SEGMENT').created[0].id;
    const sAC = producer.connect('P_A', 'P_C', 'SEGMENT').created[0].id;
    producer.recordCertifiedClaim('c1', 'PERPENDICULAR_TO', sAC, sAB);
    const gsa = producer.exportSolutionArtifact();

    const receiver = new HeadlessGeometrySession({ profile: 'blank' });
    const reportValid = receiver.importSolutionArtifact(gsa);

    const corruptGsa = JSON.parse(JSON.stringify(gsa));
    corruptGsa.certifiedClaims.push({
      claimId: 'fake',
      predicate: 'PERPENDICULAR_TO',
      subjectId: sAB,
      referenceId: sAB,
      expectedStatus: 'VERIFIED',
    });
    const corruptReceiver = new HeadlessGeometrySession({ profile: 'blank' });
    const reportCorrupt = corruptReceiver.importSolutionArtifact(corruptGsa);

    const passed = reportValid.success && reportValid.status === 'ACCEPTED' && !reportCorrupt.success && reportCorrupt.status === 'MISMATCH';
    return { passed, evidence: 'Valid GSA accepted; tampered claim rejected as MISMATCH by Zero-Trust receiver' };
  }
);

// 3. SUMMARY MATRIX
console.log('\n======================================================================');
console.log('CAPABILITY AUDIT SUMMARY MATRIX');
console.log('======================================================================');
console.log('| Capability | Declared | Discovered | Runtime Checked | Status |');
console.log('|:---|:---:|:---:|:---:|:---|');
for (const item of auditResults) {
  const dec = item.declared ? 'YES' : 'NO';
  const disc = item.discovered ? 'YES' : 'NO';
  const run = item.runtimeChecked ? 'YES' : 'NO';
  console.log(`| ${item.capability} | ${dec} | ${disc} | ${run} | **${item.status}** |`);
}

const allPassed = auditResults.every((r) => r.runtimeChecked);
console.log('======================================================================');
if (allPassed) {
  console.log('✓ CAPABILITY AUDIT STATUS: ALL 8 RUNTIME CAPABILITIES VERIFIED (100% PASS)');
  console.log('======================================================================');
  process.exit(0);
} else {
  console.error('❌ CAPABILITY AUDIT STATUS: SOME CHECKS FAILED');
  console.log('======================================================================');
  process.exit(1);
}

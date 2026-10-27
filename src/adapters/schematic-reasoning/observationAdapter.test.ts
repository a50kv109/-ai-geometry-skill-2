import assert from 'node:assert/strict';
import { HeadlessGeometrySession } from '../../headless/HeadlessGeometrySession';
import { FullObservation } from '../../headless/types';
import {
  applyObservations,
  OBSERVATION_BATCH_SCHEMA,
  prepareObservations,
  reportTargetVerification,
  SchematicObservationBatch,
  TARGET_CORE_MEASUREMENT_UNIT,
} from './observationAdapter';

let passed = 0;
function test(name: string, run: () => void): void {
  run();
  passed++;
  console.log(`PASS ${passed}: ${name}`);
}

function validBatch(): SchematicObservationBatch {
  return {
    schemaVersion: OBSERVATION_BATCH_SCHEMA,
    source: { sourceId: 'fixture-drawing' },
    coordinateFrames: [{ id: 'model', kind: 'geometry-model', units: 'mm' }],
    transformations: [],
    targetFrameId: 'model',
    observations: [
      { observationId: 'a', objectType: 'point', geometry: { x: 0, y: 0 }, coordinateFrameId: 'model', sourceId: 'fixture-drawing', quality: 'approximate', providerId: 'fixture-host', confidence: 0.7, uncertainty: { unit: 'px', value: 1 } },
      { observationId: 'b', objectType: 'point', geometry: { x: 10, y: 0 }, coordinateFrameId: 'model', sourceId: 'fixture-drawing', quality: 'approximate', providerId: 'fixture-host', confidence: 0.7 },
      { observationId: 'c', objectType: 'point', geometry: { x: 5, y: -5 }, coordinateFrameId: 'model', sourceId: 'fixture-drawing', quality: 'human' },
      { observationId: 'd', objectType: 'point', geometry: { x: 5, y: 5 }, coordinateFrameId: 'model', sourceId: 'fixture-drawing', quality: 'human' },
      { observationId: 'horizontal', objectType: 'line', geometry: { a: { x: 0, y: 0 }, b: { x: 10, y: 0 } }, endpointObservationIds: ['a', 'b'], coordinateFrameId: 'model', sourceId: 'fixture-drawing', quality: 'approximate' },
      { observationId: 'vertical', objectType: 'line', geometry: { a: { x: 5, y: -5 }, b: { x: 5, y: 5 } }, endpointObservationIds: ['c', 'd'], coordinateFrameId: 'model', sourceId: 'fixture-drawing', quality: 'human' },
    ],
  };
}

function errorCodes(value: ReturnType<typeof prepareObservations>): string[] {
  return 'errors' in value ? value.errors.map((item) => item.code) : [];
}

test('valid observations map and enter the existing HeadlessGeometrySession; target verifier owns relation check', () => {
  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  const applied = applyObservations(prepared, session);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  assert.equal(applied.createdPointIds.length, 4);
  assert.equal(applied.createdGeometryIds.length, 2);
  const verification = session.verify(applied.createdGeometryIds[0], 'PERPENDICULAR_TO', applied.createdGeometryIds[1]);
  assert.equal(verification.verified, true);
  const report = reportTargetVerification(applied, verification);
  assert.equal(report.inputStructure.status, 'VALID');
  assert.equal(report.geometricConsistency.status, 'VERIFIED_BY_TARGET_CORE');
  assert.equal(report.imageLocalization.status, 'NOT_EVALUATED');
  assert.equal(report.physicalMeasurementAccuracy.status, 'NOT_EVALUATED');
});

test('homography applies only the explicitly directed image-to-model transform', () => {
  const batch = validBatch();
  batch.coordinateFrames = [
    { id: 'pixels', kind: 'image-pixel', units: 'px', width: 100, height: 100 },
    { id: 'model', kind: 'geometry-model', units: 'mm' },
  ];
  batch.transformations = [{ id: 'pixels-to-model', fromFrameId: 'pixels', toFrameId: 'model', kind: 'homography', matrix: [2, 0, 10, 0, 2, 20, 0, 0, 1] }];
  for (const observation of batch.observations) {
    observation.coordinateFrameId = 'pixels';
    if (observation.objectType === 'point') {
      observation.geometry = { x: observation.geometry.x / 2 - 5, y: observation.geometry.y / 2 - 10 };
    } else {
      observation.geometry = {
        a: { x: observation.geometry.a.x / 2 - 5, y: observation.geometry.a.y / 2 - 10 },
        b: { x: observation.geometry.b.x / 2 - 5, y: observation.geometry.b.y / 2 - 10 },
      };
    }
  }
  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const first = prepared.observations.find((item) => item.observationId === 'a');
  assert.deepEqual(first && first.objectType === 'point' ? first.geometry : null, { x: 0, y: 0 });
  assert.equal(first?.provenance.transformationApplied?.id, 'pixels-to-model');
});

test('confidence null is preserved and scalar-equivalent homography is accepted', () => {
  const batch = validBatch();
  batch.observations[0].confidence = null;
  batch.coordinateFrames.push({ id: 'pixels', kind: 'image-pixel', units: 'px' });
  batch.observations[0].coordinateFrameId = 'pixels';
  batch.transformations = [{ id: 'scaled-identity', fromFrameId: 'pixels', toFrameId: 'model', kind: 'homography', matrix: [1e-5, 0, 0, 0, 1e-5, 0, 0, 0, 1e-5] }];
  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  assert.equal(prepared.provenanceSidecar.find((item) => item.observationId === 'a')?.confidence, null);
  assert.deepEqual(prepared.observations.find((item) => item.observationId === 'a')?.objectType === 'point' ? prepared.observations.find((item) => item.observationId === 'a')?.geometry : null, { x: 0, y: 0 });
});

test('prepared endpoint references are copied without freezing or sharing caller-owned input', () => {
  const batch = validBatch();
  const sourceLine = batch.observations.find((item) => item.observationId === 'horizontal');
  assert.ok(sourceLine && sourceLine.objectType === 'line');
  if (!sourceLine || sourceLine.objectType !== 'line') return;

  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const mappedLine = prepared.observations.find((item) => item.observationId === 'horizontal');
  assert.ok(mappedLine && mappedLine.objectType === 'line');
  if (!mappedLine || mappedLine.objectType !== 'line') return;

  assert.notEqual(mappedLine.endpointObservationIds, sourceLine.endpointObservationIds);
  assert.equal(Object.isFrozen(sourceLine.endpointObservationIds), false);
  sourceLine.endpointObservationIds[0] = 'changed-after-prepare';
  sourceLine.geometry.a.x = 123;
  assert.deepEqual(mappedLine.endpointObservationIds, ['a', 'b']);
  assert.deepEqual(mappedLine.geometry.a, { x: 0, y: 0 });

  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  assert.equal(applyObservations(prepared, session).ok, true);
});

test('prepared values cannot be mutated to alter the batch later applied', () => {
  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  assert.throws(() => { (prepared.observations[1] as { geometry: { x: number; y: number } }).geometry.x = Number.NaN; }, TypeError);
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  assert.equal(applyObservations(prepared, session).ok, true);
});

test('late target-core failure rolls back all batch geometry and preserves pre-existing state', () => {
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  assert.equal(session.create_point(99, 99, { id: 'preexisting' }).success, true);
  const before = structuredClone(session.observe('FULL'));
  const originalConnect = session.connect.bind(session);
  let calls = 0;
  session.connect = ((...args: Parameters<typeof session.connect>) => {
    calls++;
    if (calls === 2) return { success: false, action: 'CONNECT', stateChanged: false, created: [], mutated: [], deleted: [], error: 'injected late failure', deltaDigest: '' };
    return originalConnect(...args);
  }) as typeof session.connect;
  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const applied = applyObservations(prepared, session);
  assert.equal(applied.ok, false);
  assert.deepEqual(session.observe('FULL'), before);
});

test('failure during post-apply state inspection rolls back the complete batch', () => {
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  assert.equal(session.create_point(99, 99, { id: 'preexisting' }).success, true);
  const before = structuredClone(session.observe('FULL'));
  const originalObserve = session.observe.bind(session);
  let calls = 0;
  session.observe = ((...args: Parameters<typeof session.observe>) => {
    calls++;
    if (calls === 2) throw new Error('injected final inspection failure');
    return originalObserve(...args);
  }) as typeof session.observe;

  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const applied = applyObservations(prepared, session);

  assert.equal(applied.ok, false);
  if (applied.ok) return;
  assert.ok(applied.errors.some((item) => item.code === 'TARGET_CORE_REJECTED'));
  assert.deepEqual(session.observe('FULL'), before);
});

test('verification from unrelated geometry is not attributed to this batch', () => {
  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  const applied = applyObservations(prepared, session);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  assert.throws(() => applied.createdGeometryIds.push('foreign-geometry'), TypeError);
  const unrelated = session.verify('manual-line', 'PERPENDICULAR_TO', 'another-line');
  const report = reportTargetVerification(applied, { ...unrelated, verified: true, subjectId: applied.createdGeometryIds[0], referenceId: 'foreign-id' });
  assert.equal(report.verificationAssociation.status, 'MISMATCHED');
  assert.equal(report.geometricConsistency.status, 'NOT_RUN');
});

test('non-millimeter target frame is rejected to prevent measurement unit mismatch', () => {
  assert.equal(TARGET_CORE_MEASUREMENT_UNIT, 'mm');
  const batch = validBatch();
  batch.coordinateFrames[0].units = 'inch';
  assert.ok(errorCodes(prepareObservations(batch)).includes('INVALID_FRAME'));
});

test('duplicate target connections do not make multiple observations share one geometry object', () => {
  const batch = validBatch();
  const duplicate = structuredClone(batch.observations.find((item) => item.observationId === 'horizontal'));
  assert.ok(duplicate && duplicate.objectType === 'line');
  if (!duplicate || duplicate.objectType !== 'line') return;
  duplicate.observationId = 'horizontal-copy';
  batch.observations.push(duplicate);
  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;

  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  const before = structuredClone(session.observe('FULL'));
  const applied = applyObservations(prepared, session);
  assert.equal(applied.ok, false);
  assert.deepEqual(session.observe('FULL'), before);
});

test('observation/source/provenance sidecar preserves supplied provider, uncertainty, confidence, and original coordinates', () => {
  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const point = prepared.provenanceSidecar.find((item) => item.observationId === 'a');
  assert.equal(point?.sourceId, 'fixture-drawing');
  assert.equal(point?.providerId, 'fixture-host');
  assert.equal(point?.quality, 'approximate');
  assert.equal(point?.confidence, 0.7);
  assert.deepEqual(point?.uncertainty, { unit: 'px', value: 1 });
  assert.deepEqual(point?.originalObservation.geometry, { x: 0, y: 0 });
});

test('approximate coordinates remain approximate and never establish localization or physical accuracy', () => {
  const prepared = prepareObservations(validBatch());
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  const applied = applyObservations(prepared, session);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  const approximate = applied.provenanceSidecar.find((item) => item.observationId === 'a');
  assert.equal(approximate?.quality, 'approximate');
  assert.equal(approximate?.targetGeometryId, 'sro_obs_a');
  assert.equal(applied.report.geometricConsistency.status, 'NOT_RUN');
  assert.equal(applied.report.imageLocalization.status, 'NOT_EVALUATED');
  assert.equal(applied.report.physicalMeasurementAccuracy.status, 'NOT_EVALUATED');
});

test('malformed coordinates and missing source attribution are rejected before core mutation', () => {
  const batch = validBatch();
  (batch.observations[0] as { geometry: { x: number; y: number } }).geometry.x = Number.NaN;
  batch.observations[1].sourceId = 'other-source';
  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, false);
  assert.ok(errorCodes(prepared).includes('INVALID_COORDINATE'));
  assert.ok(errorCodes(prepared).includes('SOURCE_MISMATCH'));
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  assert.equal(Object.keys((session.observe('FULL') as FullObservation).points).length, 0);
});

test('missing or ambiguous transform and mixed source frames fail explicitly', () => {
  const missing = validBatch();
  missing.coordinateFrames.push({ id: 'image', kind: 'image-pixel', units: 'px' });
  missing.observations[0].coordinateFrameId = 'image';
  assert.ok(errorCodes(prepareObservations(missing)).includes('MISSING_TRANSFORM'));

  const ambiguous = validBatch();
  ambiguous.coordinateFrames.push({ id: 'image', kind: 'image-pixel', units: 'px' });
  ambiguous.observations[0].coordinateFrameId = 'image';
  ambiguous.transformations = [
    { id: 'one', fromFrameId: 'image', toFrameId: 'model', kind: 'homography', matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
    { id: 'two', fromFrameId: 'image', toFrameId: 'model', kind: 'homography', matrix: [2, 0, 0, 0, 2, 0, 0, 0, 1] },
  ];
  assert.ok(errorCodes(prepareObservations(ambiguous)).includes('AMBIGUOUS_TRANSFORM'));

  const mixed = validBatch();
  mixed.coordinateFrames.push({ id: 'drawing', kind: 'drawing', units: 'local-unit' });
  mixed.observations.find((item) => item.observationId === 'horizontal')!.coordinateFrameId = 'drawing';
  assert.ok(errorCodes(prepareObservations(mixed)).includes('MISSING_TRANSFORM'));
});

test('singular transforms and projective denominator failures are rejected', () => {
  const singular = validBatch();
  singular.coordinateFrames.push({ id: 'image', kind: 'image-pixel', units: 'px' });
  singular.observations[0].coordinateFrameId = 'image';
  singular.transformations = [{ id: 'singular', fromFrameId: 'image', toFrameId: 'model', kind: 'homography', matrix: [1, 0, 0, 0, 0, 0, 0, 0, 0] }];
  assert.ok(errorCodes(prepareObservations(singular)).includes('INVALID_TRANSFORM'));

  const denominator = validBatch();
  denominator.coordinateFrames.push({ id: 'image', kind: 'image-pixel', units: 'px' });
  denominator.observations[0].coordinateFrameId = 'image';
  denominator.observations[0].geometry = { x: 0, y: 2 };
  denominator.transformations = [{ id: 'denominator-zero', fromFrameId: 'image', toFrameId: 'model', kind: 'homography', matrix: [0, 0, 1, 0, 1, 0, 1, 0, 0] }];
  assert.ok(errorCodes(prepareObservations(denominator)).includes('PROJECTIVE_DENOMINATOR'));
});

test('line that stops short of its declared point is rejected, never snapped or extended', () => {
  const batch = validBatch();
  const line = batch.observations.find((item) => item.observationId === 'horizontal');
  assert.ok(line && line.objectType === 'line');
  if (!line || line.objectType !== 'line') return;
  line.geometry.b = { x: 9.99, y: 0 };
  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, false);
  assert.ok(errorCodes(prepared).includes('ENDPOINT_MISMATCH'));
});

test('a displaced point is retained as an observation but the existing core rejects the false relation', () => {
  const batch = validBatch();
  const point = batch.observations.find((item) => item.observationId === 'd');
  assert.ok(point && point.objectType === 'point');
  if (!point || point.objectType !== 'point') return;
  point.geometry.x = 5.01;
  const vertical = batch.observations.find((item) => item.observationId === 'vertical');
  assert.ok(vertical && vertical.objectType === 'line');
  if (!vertical || vertical.objectType !== 'line') return;
  vertical.geometry.b.x = 5.01;
  const prepared = prepareObservations(batch);
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  const applied = applyObservations(prepared, session);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  const verification = session.verify(applied.createdGeometryIds[0], 'PERPENDICULAR_TO', applied.createdGeometryIds[1]);
  assert.equal(verification.verified, false);
  assert.equal(reportTargetVerification(applied, verification).geometricConsistency.status, 'REJECTED_BY_TARGET_CORE');
});

test('unsupported polygon/boundary observations are explicitly rejected instead of dropped', () => {
  const batch = validBatch();
  batch.observations.push({
    observationId: 'boundary',
    objectType: 'boundary',
    geometry: { points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] },
    coordinateFrameId: 'model',
    sourceId: 'fixture-drawing',
    quality: 'human',
  } as unknown as SchematicObservationBatch['observations'][number]);
  assert.ok(errorCodes(prepareObservations(batch)).includes('UNSUPPORTED_OBSERVATION'));
});

test('pre-existing manual HeadlessGeometrySession workflow remains independent of the adapter', () => {
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  assert.equal(session.create_point(0, 0, { id: 'manual-a' }).success, true);
  assert.equal(session.create_point(4, 0, { id: 'manual-b' }).success, true);
  const segment = session.connect('manual-a', 'manual-b', 'SEGMENT');
  assert.equal(segment.success, true);
  assert.equal(segment.created[0].type, 'SEGMENT');
});

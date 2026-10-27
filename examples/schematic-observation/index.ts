/**
 * Synthetic end-to-end demonstration. Coordinates are hand-authored fixtures;
 * this example does not inspect an image or claim localization accuracy.
 */
import { HeadlessGeometrySession } from '../../src/headless/HeadlessGeometrySession';
import {
  applyObservations,
  OBSERVATION_BATCH_SCHEMA,
  prepareObservations,
  reportTargetVerification,
  SchematicObservationBatch,
} from '../../src/adapters/schematic-reasoning/observationAdapter';

const batch: SchematicObservationBatch = {
  schemaVersion: OBSERVATION_BATCH_SCHEMA,
  source: { sourceId: 'synthetic-cross-fixture' },
  coordinateFrames: [
    { id: 'page-pixels', kind: 'image-pixel', units: 'px', width: 100, height: 100 },
    { id: 'geometry-model', kind: 'geometry-model', units: 'mm' },
  ],
  transformations: [
    {
      id: 'fixture-pixels-to-model',
      fromFrameId: 'page-pixels',
      toFrameId: 'geometry-model',
      kind: 'homography',
      matrix: [0.1, 0, 0, 0, 0.1, 0, 0, 0, 1],
    },
  ],
  targetFrameId: 'geometry-model',
  observations: [
    { observationId: 'left', objectType: 'point', geometry: { x: 0, y: 0 }, coordinateFrameId: 'page-pixels', sourceId: 'synthetic-cross-fixture', quality: 'human' },
    { observationId: 'right', objectType: 'point', geometry: { x: 100, y: 0 }, coordinateFrameId: 'page-pixels', sourceId: 'synthetic-cross-fixture', quality: 'human' },
    { observationId: 'top', objectType: 'point', geometry: { x: 50, y: -50 }, coordinateFrameId: 'page-pixels', sourceId: 'synthetic-cross-fixture', quality: 'human' },
    { observationId: 'bottom', objectType: 'point', geometry: { x: 50, y: 50 }, coordinateFrameId: 'page-pixels', sourceId: 'synthetic-cross-fixture', quality: 'human' },
    { observationId: 'horizontal-axis', objectType: 'line', geometry: { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } }, endpointObservationIds: ['left', 'right'], coordinateFrameId: 'page-pixels', sourceId: 'synthetic-cross-fixture', quality: 'human' },
    { observationId: 'vertical-axis', objectType: 'line', geometry: { a: { x: 50, y: -50 }, b: { x: 50, y: 50 } }, endpointObservationIds: ['top', 'bottom'], coordinateFrameId: 'page-pixels', sourceId: 'synthetic-cross-fixture', quality: 'human' },
  ],
};

const prepared = prepareObservations(batch);
if (!prepared.ok) {
  console.error(JSON.stringify(prepared.report, null, 2));
  process.exitCode = 1;
} else {
  const session = new HeadlessGeometrySession({ profile: 'blank', R: 1 });
  const applied = applyObservations(prepared, session);
  if (!applied.ok) {
    console.error(JSON.stringify(applied.report, null, 2));
    process.exitCode = 1;
  } else {
    const horizontal = applied.provenanceSidecar.find((record) => record.observationId === 'horizontal-axis')?.targetGeometryId;
    const vertical = applied.provenanceSidecar.find((record) => record.observationId === 'vertical-axis')?.targetGeometryId;
    if (!horizontal || !vertical) {
      throw new Error('Adapter did not return target geometry bindings for both lines.');
    }
    const targetResult = session.verify(horizontal, 'PERPENDICULAR_TO', vertical);
    const report = reportTargetVerification(applied, targetResult);
    console.log(JSON.stringify({
      targetVerification: report.geometricConsistency,
      imageLocalization: report.imageLocalization,
      physicalMeasurementAccuracy: report.physicalMeasurementAccuracy,
      targetGeometryIds: [horizontal, vertical],
      sourceCoordinatesRemainInSidecar: applied.provenanceSidecar.every((record) => record.originalObservation.sourceId === batch.source.sourceId),
      limitation: 'Synthetic coordinates only; no image was inspected and no localization accuracy was evaluated.',
    }, null, 2));
  }
}

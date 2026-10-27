import { HeadlessGeometrySession } from '../../headless/HeadlessGeometrySession';
import { FullObservation, HeadlessVerificationResult } from '../../headless/types';

export const OBSERVATION_BATCH_SCHEMA = 'schematic-observation-batch/1' as const;
export const ENDPOINT_MATCH_TOLERANCE = 1e-6;
export const TARGET_CORE_MEASUREMENT_UNIT = 'mm' as const;
const MACHINE_EPSILON = Number.EPSILON;
const GEOMETRY_ID_PREFIX = 'sro_obs_';

export type ObservationQuality = 'approximate' | 'exact-tool' | 'human' | 'derived' | 'qualitative';
export type CoordinateFrameKind = 'image-pixel' | 'normalized-image' | 'drawing' | 'geometry-model';

export interface ObservationPoint2D {
  x: number;
  y: number;
}

export interface ObservationCoordinateFrame {
  id: string;
  kind: CoordinateFrameKind;
  units: string;
  width?: number;
  height?: number;
}

export interface ObservationHomography {
  id: string;
  fromFrameId: string;
  toFrameId: string;
  kind: 'homography';
  matrix: number[];
}

interface ObservationCommon {
  observationId: string;
  coordinateFrameId: string;
  sourceId: string;
  providerId?: string;
  quality: ObservationQuality;
  confidence?: number | null;
  uncertainty?: unknown;
  evidence?: unknown[];
  limitations?: string[];
  text?: string | null;
}

export interface PointObservation extends ObservationCommon {
  objectType: 'point';
  geometry: ObservationPoint2D;
}

export interface ConnectedObservation extends ObservationCommon {
  objectType: 'segment' | 'line';
  geometry: { a: ObservationPoint2D; b: ObservationPoint2D };
  endpointObservationIds: [string, string];
}

export type SchematicObservation = PointObservation | ConnectedObservation;

export interface SchematicObservationBatch {
  schemaVersion: typeof OBSERVATION_BATCH_SCHEMA;
  source: { sourceId: string; sha256?: string };
  coordinateFrames: ObservationCoordinateFrame[];
  transformations: ObservationHomography[];
  targetFrameId: string;
  observations: SchematicObservation[];
}

export type AdapterErrorCode =
  | 'INVALID_BATCH'
  | 'INVALID_SOURCE'
  | 'INVALID_FRAME'
  | 'UNKNOWN_FRAME'
  | 'INVALID_TRANSFORM'
  | 'MISSING_TRANSFORM'
  | 'AMBIGUOUS_TRANSFORM'
  | 'INVALID_OBSERVATION'
  | 'UNSUPPORTED_OBSERVATION'
  | 'DUPLICATE_OBSERVATION_ID'
  | 'SOURCE_MISMATCH'
  | 'INVALID_COORDINATE'
  | 'PROJECTIVE_DENOMINATOR'
  | 'MISSING_ENDPOINT'
  | 'ENDPOINT_MISMATCH'
  | 'TARGET_ID_COLLISION'
  | 'TARGET_CORE_REJECTED';

export interface AdapterError {
  code: AdapterErrorCode;
  path: string;
  message: string;
  observationId?: string;
  frameId?: string;
  expected?: string;
}

export interface ObservationProvenanceSidecar {
  observationId: string;
  sourceId: string;
  sourceFrameId: string;
  targetFrameId: string;
  providerId?: string;
  quality: ObservationQuality;
  confidence?: number | null;
  uncertainty?: unknown;
  evidence?: unknown[];
  limitations?: string[];
  transformationApplied?: ObservationHomography;
  originalObservation: SchematicObservation;
  targetGeometryId?: string;
}

export interface MappedPointObservation {
  observationId: string;
  objectType: 'point';
  sourceFrameId: string;
  targetFrameId: string;
  geometry: ObservationPoint2D;
  geometryId: string;
  provenance: ObservationProvenanceSidecar;
}

export interface MappedConnectedObservation {
  observationId: string;
  objectType: 'segment' | 'line';
  sourceFrameId: string;
  targetFrameId: string;
  geometry: { a: ObservationPoint2D; b: ObservationPoint2D };
  endpointObservationIds: [string, string];
  provenance: ObservationProvenanceSidecar;
}

export type MappedObservation = MappedPointObservation | MappedConnectedObservation;

export interface EvidenceReport {
  inputStructure: { status: 'VALID' | 'INVALID'; errors: AdapterError[] };
  geometricConsistency: {
    status: 'NOT_RUN' | 'VERIFIED_BY_TARGET_CORE' | 'REJECTED_BY_TARGET_CORE';
    result?: HeadlessVerificationResult;
  };
  verificationAssociation: { status: 'NOT_CHECKED' | 'MATCHED' | 'MISMATCHED'; errors: string[] };
  imageLocalization: { status: 'NOT_EVALUATED' };
  physicalMeasurementAccuracy: { status: 'NOT_EVALUATED' };
}

export type PrepareObservationResult =
  | {
      ok: true;
      sourceId: string;
      sourceSha256?: string;
      targetFrameId: string;
      observations: MappedObservation[];
      provenanceSidecar: ObservationProvenanceSidecar[];
      report: EvidenceReport;
    }
  | { ok: false; errors: AdapterError[]; report: EvidenceReport };

export type ApplyObservationResult =
  | {
      ok: true;
      createdPointIds: string[];
      createdGeometryIds: string[];
      provenanceSidecar: ObservationProvenanceSidecar[];
      report: EvidenceReport;
      checkpointId: string;
    }
  | { ok: false; errors: AdapterError[]; report: EvidenceReport };

const trustedApplied = new WeakMap<object, { geometryIds: ReadonlySet<string> }>();

function error(
  code: AdapterErrorCode,
  path: string,
  message: string,
  details: Pick<AdapterError, 'observationId' | 'frameId' | 'expected'> = {}
): AdapterError {
  return { code, path, message, ...details };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFinitePoint(value: unknown): value is ObservationPoint2D {
  return (
    isRecord(value) &&
    typeof value.x === 'number' && Number.isFinite(value.x) &&
    typeof value.y === 'number' && Number.isFinite(value.y)
  );
}

function cloneObservation(observation: SchematicObservation): SchematicObservation {
  return structuredClone(observation);
}

const trustedPrepared = new WeakSet<object>();
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function determinant3x3(m: number[]): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

function normalizedMatrix(matrix: number[]): number[] | null {
  const scale = Math.max(...matrix.map(Math.abs));
  if (!Number.isFinite(scale) || scale === 0) return null;
  return matrix.map((value) => value / scale);
}

function matrixIsWellConditioned(matrix: number[]): boolean {
  const m = normalizedMatrix(matrix);
  if (!m) return false;
  const det = determinant3x3(m);
  if (!Number.isFinite(det) || det === 0) return false;
  const adj = [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ];
  const norm = (a: number[]) => Math.max(...[0, 1, 2].map((row) => Math.abs(a[row * 3]) + Math.abs(a[row * 3 + 1]) + Math.abs(a[row * 3 + 2])));
  const conditionProduct = norm(m) * norm(adj);
  return Number.isFinite(conditionProduct) && conditionProduct > 0 && Math.abs(det) / conditionProduct > 16 * MACHINE_EPSILON;
}

function mapHomography(point: ObservationPoint2D, matrix: number[]):
  | { ok: true; point: ObservationPoint2D }
  | { ok: false; denominator: number } {
  const m = normalizedMatrix(matrix);
  if (!m) return { ok: false, denominator: Number.NaN };
  const pointScale = Math.max(Math.abs(point.x), Math.abs(point.y), 1);
  const x = point.x / pointScale;
  const y = point.y / pointScale;
  const w = 1 / pointScale;
  const terms = [m[6] * x, m[7] * y, m[8] * w];
  const denominator = terms[0] + terms[1] + terms[2];
  const errorBound = (3 * MACHINE_EPSILON / (1 - 3 * MACHINE_EPSILON)) * terms.reduce((sum, term) => sum + Math.abs(term), 0);
  if (!Number.isFinite(denominator) || Math.abs(denominator) <= errorBound) {
    return { ok: false, denominator };
  }
  const mapped = {
    x: (m[0] * x + m[1] * y + m[2] * w) / denominator,
    y: (m[3] * x + m[4] * y + m[5] * w) / denominator,
  };
  return Number.isFinite(mapped.x) && Number.isFinite(mapped.y)
    ? { ok: true, point: mapped }
    : { ok: false, denominator };
}

function makeReport(errors: AdapterError[] = [], result?: HeadlessVerificationResult): EvidenceReport {
  return {
    inputStructure: { status: errors.length === 0 ? 'VALID' : 'INVALID', errors },
    geometricConsistency: {
      status: result ? (result.verified ? 'VERIFIED_BY_TARGET_CORE' : 'REJECTED_BY_TARGET_CORE') : 'NOT_RUN',
      result,
    },
    verificationAssociation: { status: 'NOT_CHECKED', errors: [] },
    imageLocalization: { status: 'NOT_EVALUATED' },
    physicalMeasurementAccuracy: { status: 'NOT_EVALUATED' },
  };
}

function validateCommonObservation(
  value: unknown,
  index: number,
  sourceId: string,
  frames: Map<string, ObservationCoordinateFrame>,
  errors: AdapterError[]
): value is SchematicObservation {
  const path = `observations[${index}]`;
  if (!isRecord(value)) {
    errors.push(error('INVALID_OBSERVATION', path, 'Observation must be an object.'));
    return false;
  }
  if (typeof value.observationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value.observationId)) {
    errors.push(error('INVALID_OBSERVATION', `${path}.observationId`, 'A stable observationId (1–128 safe characters) is required.'));
  }
  if (typeof value.sourceId !== 'string' || value.sourceId !== sourceId) {
    errors.push(error('SOURCE_MISMATCH', `${path}.sourceId`, 'Observation sourceId must match the batch source.', { observationId: typeof value.observationId === 'string' ? value.observationId : undefined }));
  }
  if (typeof value.coordinateFrameId !== 'string' || !frames.has(value.coordinateFrameId)) {
    errors.push(error('UNKNOWN_FRAME', `${path}.coordinateFrameId`, 'Observation must name a declared coordinate frame.', { observationId: typeof value.observationId === 'string' ? value.observationId : undefined, frameId: typeof value.coordinateFrameId === 'string' ? value.coordinateFrameId : undefined }));
  }
  if (!['approximate', 'exact-tool', 'human', 'derived', 'qualitative'].includes(String(value.quality))) {
    errors.push(error('INVALID_OBSERVATION', `${path}.quality`, 'Observation quality must use a declared Schematic Reasoning Core quality value.'));
  }
  if (value.quality === 'qualitative') {
    errors.push(error('UNSUPPORTED_OBSERVATION', `${path}.quality`, 'Qualitative-only observations cannot be converted to geometric coordinates.'));
  }
  if (value.providerId !== undefined && (typeof value.providerId !== 'string' || value.providerId.length === 0)) {
    errors.push(error('INVALID_OBSERVATION', `${path}.providerId`, 'providerId must be a non-empty string when supplied.'));
  }
  if (value.confidence !== undefined && value.confidence !== null && (typeof value.confidence !== 'number' || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1)) {
    errors.push(error('INVALID_OBSERVATION', `${path}.confidence`, 'confidence must be null or a finite value in [0, 1] when supplied.'));
  }
  if (typeof value.text !== 'undefined' && value.text !== null && typeof value.text !== 'string') {
    errors.push(error('INVALID_OBSERVATION', `${path}.text`, 'text must be a string or null when supplied.'));
  }
  return errors.every((item) => !item.path.startsWith(path));
}

/**
 * Validates normalized external observations and maps them once into the target
 * HeadlessGeometrySession model frame. No geometry is created or verified here.
 */
export function prepareObservations(input: unknown): PrepareObservationResult {
  const errors: AdapterError[] = [];
  if (!isRecord(input) || input.schemaVersion !== OBSERVATION_BATCH_SCHEMA) {
    errors.push(error('INVALID_BATCH', 'schemaVersion', `Expected schemaVersion '${OBSERVATION_BATCH_SCHEMA}'.`));
    return { ok: false, errors, report: makeReport(errors) };
  }

  if (!isRecord(input.source) || typeof input.source.sourceId !== 'string' || input.source.sourceId.length === 0) {
    errors.push(error('INVALID_SOURCE', 'source', 'A non-empty batch source.sourceId is required.'));
  } else if (input.source.sha256 !== undefined && (typeof input.source.sha256 !== 'string' || !/^[a-fA-F0-9]{64}$/.test(input.source.sha256))) {
    errors.push(error('INVALID_SOURCE', 'source.sha256', 'source.sha256 must be 64 hexadecimal characters when supplied.'));
  }
  if (!Array.isArray(input.coordinateFrames) || input.coordinateFrames.length === 0) {
    errors.push(error('INVALID_FRAME', 'coordinateFrames', 'At least one coordinate frame is required.'));
  }
  if (!Array.isArray(input.transformations)) {
    errors.push(error('INVALID_TRANSFORM', 'transformations', 'transformations must be an array.'));
  }
  if (typeof input.targetFrameId !== 'string') {
    errors.push(error('INVALID_FRAME', 'targetFrameId', 'targetFrameId is required.'));
  }
  if (!Array.isArray(input.observations)) {
    errors.push(error('INVALID_BATCH', 'observations', 'observations must be an array.'));
  }
  if (errors.length > 0) return { ok: false, errors, report: makeReport(errors) };

  const source = input.source as { sourceId: string; sha256?: string };
  const rawFrames = input.coordinateFrames as unknown[];
  const rawTransforms = input.transformations as unknown[];
  const rawObservations = input.observations as unknown[];
  const targetFrameId = input.targetFrameId as string;
  const frames = new Map<string, ObservationCoordinateFrame>();
  for (let i = 0; i < rawFrames.length; i++) {
    const frame = rawFrames[i];
    if (!isRecord(frame) || typeof frame.id !== 'string' || !frame.id ||
      !['image-pixel', 'normalized-image', 'drawing', 'geometry-model'].includes(String(frame.kind)) ||
      typeof frame.units !== 'string' || !frame.units) {
      errors.push(error('INVALID_FRAME', `coordinateFrames[${i}]`, 'Frame requires a unique id, supported kind, and explicit units.'));
      continue;
    }
    if (frames.has(frame.id)) {
      errors.push(error('INVALID_FRAME', `coordinateFrames[${i}].id`, `Duplicate frame id '${frame.id}'.`, { frameId: frame.id }));
      continue;
    }
    for (const dim of ['width', 'height'] as const) {
      if (frame[dim] !== undefined && (typeof frame[dim] !== 'number' || !Number.isFinite(frame[dim]) || frame[dim] <= 0)) {
        errors.push(error('INVALID_FRAME', `coordinateFrames[${i}].${dim}`, `${dim} must be a positive finite number when supplied.`, { frameId: frame.id }));
      }
    }
    frames.set(frame.id, frame as unknown as ObservationCoordinateFrame);
  }
  const targetFrame = frames.get(targetFrameId);
  if (!targetFrame || targetFrame.kind !== 'geometry-model' || targetFrame.units.trim().toLowerCase() !== TARGET_CORE_MEASUREMENT_UNIT) {
    errors.push(error('INVALID_FRAME', 'targetFrameId', `targetFrameId must identify a geometry-model frame using ${TARGET_CORE_MEASUREMENT_UNIT}, matching target-core measurements.`, { frameId: targetFrameId, expected: `geometry-model units=${TARGET_CORE_MEASUREMENT_UNIT}` }));
  }

  const transforms: ObservationHomography[] = [];
  const transformIds = new Set<string>();
  for (let i = 0; i < rawTransforms.length; i++) {
    const raw = rawTransforms[i];
    if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id || raw.kind !== 'homography' ||
      typeof raw.fromFrameId !== 'string' || typeof raw.toFrameId !== 'string' || !Array.isArray(raw.matrix) || raw.matrix.length !== 9 ||
      !raw.matrix.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      errors.push(error('INVALID_TRANSFORM', `transformations[${i}]`, 'Transform must declare id, kind=homography, source/destination frames, and nine finite matrix values.'));
      continue;
    }
    if (transformIds.has(raw.id)) {
      errors.push(error('INVALID_TRANSFORM', `transformations[${i}].id`, `Duplicate transform id '${raw.id}'.`));
      continue;
    }
    transformIds.add(raw.id);
    if (!frames.has(raw.fromFrameId) || !frames.has(raw.toFrameId)) {
      errors.push(error('INVALID_TRANSFORM', `transformations[${i}]`, 'Transform references an undeclared coordinate frame.'));
      continue;
    }
    const matrix = raw.matrix as number[];
    if (!matrixIsWellConditioned(matrix)) {
      errors.push(error('INVALID_TRANSFORM', `transformations[${i}].matrix`, 'Homography matrix is singular or numerically degenerate.'));
      continue;
    }
    transforms.push(raw as unknown as ObservationHomography);
  }

  const seenObservationIds = new Set<string>();
  for (let i = 0; i < rawObservations.length; i++) {
    const observation = rawObservations[i];
    if (!validateCommonObservation(observation, i, source.sourceId, frames, errors)) continue;
    const id = observation.observationId;
    if (seenObservationIds.has(id)) {
      errors.push(error('DUPLICATE_OBSERVATION_ID', `observations[${i}].observationId`, `Duplicate observationId '${id}'.`, { observationId: id }));
    }
    seenObservationIds.add(id);
    if (observation.objectType === 'point' && !isFinitePoint(observation.geometry)) {
      errors.push(error('INVALID_COORDINATE', `observations[${i}].geometry`, 'Point coordinates x/y must be finite numbers.', { observationId: id, frameId: observation.coordinateFrameId }));
    } else if (observation.objectType === 'segment' || observation.objectType === 'line') {
      if (!isRecord(observation.geometry) || !isFinitePoint(observation.geometry.a) || !isFinitePoint(observation.geometry.b)) {
        errors.push(error('INVALID_COORDINATE', `observations[${i}].geometry`, 'Line/segment geometry must contain finite a and b endpoints.', { observationId: id, frameId: observation.coordinateFrameId }));
      }
      if (!Array.isArray(observation.endpointObservationIds) || observation.endpointObservationIds.length !== 2 ||
        observation.endpointObservationIds.some((endpoint) => typeof endpoint !== 'string')) {
        errors.push(error('MISSING_ENDPOINT', `observations[${i}].endpointObservationIds`, 'Line/segment must reference two observed point endpoints; endpoints are never inferred or repaired.', { observationId: id }));
      }
    } else if (observation.objectType !== 'point') {
      errors.push(error('UNSUPPORTED_OBSERVATION', `observations[${i}].objectType`, `Unsupported observation type '${String(observation.objectType)}'.`, { observationId: id }));
    }
  }
  if (errors.length > 0) return { ok: false, errors, report: makeReport(errors) };

  const mappedPoints = new Map<string, ObservationPoint2D>();
  const mapped: MappedObservation[] = [];
  for (const observation of rawObservations as SchematicObservation[]) {
    const fromFrameId = observation.coordinateFrameId;
    const transformMatches = fromFrameId === targetFrameId
      ? []
      : transforms.filter((transform) => transform.fromFrameId === fromFrameId && transform.toFrameId === targetFrameId);
    if (fromFrameId !== targetFrameId && transformMatches.length === 0) {
      errors.push(error('MISSING_TRANSFORM', `observations.${observation.observationId}.coordinateFrameId`, 'No direct transform maps this observation frame to targetFrameId; inverse or chained transforms are not inferred.', { observationId: observation.observationId, frameId: fromFrameId, expected: `direct transform ${fromFrameId} -> ${targetFrameId}` }));
      continue;
    }
    if (transformMatches.length > 1) {
      errors.push(error('AMBIGUOUS_TRANSFORM', `observations.${observation.observationId}.coordinateFrameId`, 'More than one direct transform maps this observation frame to targetFrameId.', { observationId: observation.observationId, frameId: fromFrameId }));
      continue;
    }
    const matrix = transformMatches[0]?.matrix;
    const map = (point: ObservationPoint2D, path: string): ObservationPoint2D | null => {
      if (!matrix) return { x: point.x, y: point.y };
      const result = mapHomography(point, matrix);
      if (!result.ok) {
        errors.push(error('PROJECTIVE_DENOMINATOR', path, 'Homography denominator is zero, non-finite, or too close to zero.', { observationId: observation.observationId, frameId: fromFrameId }));
        return null;
      }
      return result.point;
    };
    const provenance: ObservationProvenanceSidecar = {
      observationId: observation.observationId,
      sourceId: observation.sourceId,
      sourceFrameId: fromFrameId,
      targetFrameId,
      providerId: observation.providerId,
      quality: observation.quality,
      confidence: observation.confidence,
      uncertainty: observation.uncertainty === undefined ? undefined : structuredClone(observation.uncertainty),
      evidence: observation.evidence === undefined ? undefined : structuredClone(observation.evidence),
      limitations: observation.limitations === undefined ? undefined : [...observation.limitations],
      transformationApplied: transformMatches[0] ? structuredClone(transformMatches[0]) : undefined,
      originalObservation: cloneObservation(observation),
    };
    if (observation.objectType === 'point') {
      const point = map(observation.geometry, `observations.${observation.observationId}.geometry`);
      if (!point) continue;
      mappedPoints.set(observation.observationId, point);
      mapped.push({
        observationId: observation.observationId,
        objectType: 'point',
        sourceFrameId: fromFrameId,
        targetFrameId,
        geometry: point,
        geometryId: `${GEOMETRY_ID_PREFIX}${observation.observationId}`,
        provenance,
      });
    } else {
      const a = map(observation.geometry.a, `observations.${observation.observationId}.geometry.a`);
      const b = map(observation.geometry.b, `observations.${observation.observationId}.geometry.b`);
      if (!a || !b) continue;
      mapped.push({
        observationId: observation.observationId,
        objectType: observation.objectType,
        sourceFrameId: fromFrameId,
        targetFrameId,
        geometry: { a, b },
        endpointObservationIds: [...observation.endpointObservationIds],
        provenance,
      });
    }
  }

  const observationById = new Map((rawObservations as SchematicObservation[]).map((item) => [item.observationId, item]));
  for (const item of mapped) {
    if (item.objectType === 'point') continue;
    for (let endpointIndex = 0; endpointIndex < 2; endpointIndex++) {
      const endpointId = item.endpointObservationIds[endpointIndex];
      const endpointObservation = observationById.get(endpointId);
      const mappedEndpoint = mappedPoints.get(endpointId);
      if (!endpointObservation || endpointObservation.objectType !== 'point' || !mappedEndpoint) {
        errors.push(error('MISSING_ENDPOINT', `observations.${item.observationId}.endpointObservationIds[${endpointIndex}]`, `Endpoint '${endpointId}' must refer to a valid point observation in the same batch.`, { observationId: item.observationId, frameId: item.sourceFrameId }));
        continue;
      }
      if (endpointObservation.sourceId !== item.provenance.sourceId) {
        errors.push(error('SOURCE_MISMATCH', `observations.${item.observationId}.endpointObservationIds[${endpointIndex}]`, 'Line endpoint and line must share the same source.'));
      }
      const lineEndpoint = endpointIndex === 0 ? item.geometry.a : item.geometry.b;
      const gap = Math.hypot(lineEndpoint.x - mappedEndpoint.x, lineEndpoint.y - mappedEndpoint.y);
      if (gap > ENDPOINT_MATCH_TOLERANCE) {
        errors.push(error('ENDPOINT_MISMATCH', `observations.${item.observationId}.geometry.${endpointIndex === 0 ? 'a' : 'b'}`, `Observed endpoint stops ${gap} model units from its referenced point; no snapping or extension is performed.`, { observationId: item.observationId, frameId: item.targetFrameId, expected: `distance <= ${ENDPOINT_MATCH_TOLERANCE}` }));
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors, report: makeReport(errors) };
  const provenanceSidecar = mapped.map((item) => item.provenance);
  const result: Extract<PrepareObservationResult, { ok: true }> = {
    ok: true,
    sourceId: source.sourceId,
    sourceSha256: source.sha256,
    targetFrameId,
    observations: mapped,
    provenanceSidecar,
    report: makeReport(),
  };
  deepFreeze(result);
  trustedPrepared.add(result);
  return result;
}

/**
 * Applies an already validated observation batch only through the existing
 * HeadlessGeometrySession public API. Source/evidence metadata stays in the
 * returned sidecar because target GeometryProvenance has construction meaning.
 */
export function applyObservations(
  prepared: Extract<PrepareObservationResult, { ok: true }>,
  session: HeadlessGeometrySession
): ApplyObservationResult {
  const errors: AdapterError[] = [];
  if (!prepared || !trustedPrepared.has(prepared)) {
    errors.push(error('INVALID_BATCH', 'prepared', 'Only an unmodified successful result from prepareObservations can be applied.'));
    return { ok: false, errors, report: makeReport(errors) };
  }
  const pointObservations = prepared.observations.filter((item): item is MappedPointObservation => item.objectType === 'point');
  const connectedObservations = prepared.observations.filter((item): item is MappedConnectedObservation => item.objectType !== 'point');
  const pointIdByObservation = new Map<string, string>();
  let full: FullObservation;
  try {
    full = session.observe('FULL') as FullObservation;
  } catch (cause) {
    errors.push(error('TARGET_CORE_REJECTED', 'session.observe', cause instanceof Error ? cause.message : 'Target core threw while checking the current session.'));
    return { ok: false, errors, report: makeReport(errors) };
  }

  for (const point of pointObservations) {
    if (full.points[point.geometryId]) {
      errors.push(error('TARGET_ID_COLLISION', `observations.${point.observationId}`, `Target point id '${point.geometryId}' already exists.`, { observationId: point.observationId, frameId: prepared.targetFrameId }));
    }
    pointIdByObservation.set(point.observationId, point.geometryId);
  }
  for (const connected of connectedObservations) {
    const start = pointIdByObservation.get(connected.endpointObservationIds[0]);
    const end = pointIdByObservation.get(connected.endpointObservationIds[1]);
    if (!start || !end || start === end) {
      errors.push(error('MISSING_ENDPOINT', `observations.${connected.observationId}.endpointObservationIds`, 'A connection requires two distinct mapped point observations.', { observationId: connected.observationId }));
      continue;
    }
    if (Math.hypot(connected.geometry.b.x - connected.geometry.a.x, connected.geometry.b.y - connected.geometry.a.y) < HeadlessGeometrySession.VERIFICATION_EPSILON) {
      errors.push(error('INVALID_COORDINATE', `observations.${connected.observationId}.geometry`, 'Coincident endpoints cannot form a target line or segment.', { observationId: connected.observationId, frameId: prepared.targetFrameId }));
    }
  }
  if (errors.length > 0) return { ok: false, errors, report: makeReport(errors) };

  let checkpoint: ReturnType<HeadlessGeometrySession['fork']>;
  try {
    checkpoint = session.fork();
  } catch (cause) {
    errors.push(error('TARGET_CORE_REJECTED', 'session.fork', cause instanceof Error ? cause.message : 'Target core threw while creating an atomicity checkpoint.'));
    return { ok: false, errors, report: makeReport(errors) };
  }
  if (!checkpoint.success || !checkpoint.sandboxId) {
    errors.push(error('TARGET_CORE_REJECTED', 'session.fork', 'Target core could not create an atomicity checkpoint.'));
    return { ok: false, errors, report: makeReport(errors) };
  }
  const rollbackFailure = (): ApplyObservationResult => {
    try {
      const rollback = session.rollback(checkpoint.sandboxId);
      if (!rollback.success) errors.push(error('TARGET_CORE_REJECTED', 'session.rollback', rollback.error ?? 'Failed to restore target-core state.'));
    } catch (cause) {
      errors.push(error('TARGET_CORE_REJECTED', 'session.rollback', cause instanceof Error ? cause.message : 'Target core threw while restoring the previous state.'));
    }
    return { ok: false, errors, report: makeReport(errors) };
  };

  const appliedSidecar = structuredClone(prepared.provenanceSidecar);
  const connectedGeometryIds = new Set<string>();

  try {
    for (const point of pointObservations) {
      const result = session.create_point(point.geometry.x, point.geometry.y, { id: point.geometryId, name: point.observationId });
      if (!result.success) {
        errors.push(error('TARGET_CORE_REJECTED', `observations.${point.observationId}`, result.error ?? 'Target core rejected point creation.', { observationId: point.observationId, frameId: prepared.targetFrameId }));
        break;
      }
      const sidecar = appliedSidecar.find((record) => record.observationId === point.observationId);
      if (sidecar) sidecar.targetGeometryId = point.geometryId;
    }
    if (errors.length === 0) {
      for (const connected of connectedObservations) {
        const startId = pointIdByObservation.get(connected.endpointObservationIds[0])!;
        const endId = pointIdByObservation.get(connected.endpointObservationIds[1])!;
        const result = session.connect(startId, endId, connected.objectType === 'line' ? 'LINE' : 'SEGMENT');
        if (!result.success || result.created.length !== 1) {
          errors.push(error('TARGET_CORE_REJECTED', `observations.${connected.observationId}`, result.error ?? 'Target core rejected line/segment creation.', { observationId: connected.observationId, frameId: prepared.targetFrameId }));
          break;
        }
        if (connectedGeometryIds.has(result.created[0].id)) {
          errors.push(error('TARGET_CORE_REJECTED', `observations.${connected.observationId}`, 'Multiple observations resolved to the same target geometry object.', { observationId: connected.observationId, frameId: prepared.targetFrameId }));
          break;
        }
        connectedGeometryIds.add(result.created[0].id);
        const sidecar = appliedSidecar.find((record) => record.observationId === connected.observationId);
        if (sidecar) sidecar.targetGeometryId = result.created[0].id;
      }
    }
    if (errors.length === 0) {
      const finalFull = session.observe('FULL') as FullObservation;
      const appliedPointIds = pointObservations.map((item) => item.geometryId);
      const appliedGeometryIds = connectedObservations.map((item) =>
        appliedSidecar.find((record) => record.observationId === item.observationId)?.targetGeometryId
      );
      if (appliedPointIds.some((id) => !finalFull.points[id]) ||
        appliedGeometryIds.some((id) => !id) ||
        new Set(appliedGeometryIds).size !== connectedObservations.length ||
        connectedObservations.some((item, index) =>
          item.objectType === 'line'
            ? !finalFull.lines[appliedGeometryIds[index]!]
            : !finalFull.segments[appliedGeometryIds[index]!]
        )) {
        errors.push(error('TARGET_CORE_REJECTED', 'session.state', 'Post-apply state does not contain every distinct geometry object from the batch.'));
      }
    }
  } catch (cause) {
    errors.push(error('TARGET_CORE_REJECTED', 'session.apply', cause instanceof Error ? cause.message : 'Target core threw during batch application.'));
  }
  if (errors.length > 0) return rollbackFailure();
  const appliedPointIds = pointObservations.map((item) => item.geometryId);
  const appliedGeometryIds = connectedObservations.map((item) =>
    appliedSidecar.find((record) => record.observationId === item.observationId)!.targetGeometryId!
  );
  const result: Extract<ApplyObservationResult, { ok: true }> = {
    ok: true,
    createdPointIds: appliedPointIds,
    createdGeometryIds: appliedGeometryIds,
    provenanceSidecar: appliedSidecar,
    report: prepared.report,
    checkpointId: checkpoint.sandboxId,
  };
  deepFreeze(result);
  trustedApplied.set(result, {
    geometryIds: new Set(appliedGeometryIds),
  });
  return result;
}

export function reportTargetVerification(
  applied: ApplyObservationResult,
  verification: HeadlessVerificationResult
): EvidenceReport {
  if (!applied.ok) return applied.report;
  const association = trustedApplied.get(applied);
  const errors: string[] = [];
  if (!association) errors.push('Applied result was not produced by this adapter or was altered.');
  if (!verification || typeof verification.verified !== 'boolean') errors.push('Verification result is invalid.');
  if (association && verification && typeof verification.verified === 'boolean') {
    if (!association.geometryIds.has(verification.subjectId)) errors.push('Verification subject is not a connected geometry created by this applied batch.');
    if (!verification.referenceId || !association.geometryIds.has(verification.referenceId)) errors.push('Verification reference is not a connected geometry created by this applied batch.');
  }
  if (verification?.relation === 'POINT_ON_CIRCLE') {
    errors.push('POINT_ON_CIRCLE cannot be associated because this adapter does not create circles.');
  }
  const report = makeReport([], errors.length ? undefined : verification);
  report.verificationAssociation = { status: errors.length ? 'MISMATCHED' : 'MATCHED', errors };
  return report;
}

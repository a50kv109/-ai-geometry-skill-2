// src/utils/canonicalCoordinates.ts
// Pure mathematical functions for Canonical Geometry Coordinate Representations
// Complies with CANONICAL_GEOMETRY_COORDINATES_AND_INVARIANTS.md
// Implements Layer A (Angular Address), Layer B (Perimeter/Contour Coordinate), Layer C (Cartesian Position)

export interface CartesianPoint2D {
  x: number;
  y: number;
}

export type TraversalOrientation = 'CCW' | 'CW';

/**
 * Normalizes an angle in degrees into canonical range [0, 360).
 */
export function normalizeAngleDeg(deg: number): number {
  if (!Number.isFinite(deg)) {
    throw new Error(`normalizeAngleDeg: Invalid angle ${deg}. Must be a finite number.`);
  }
  let normalized = deg % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  // Guarantee exact 0 if floating point rounding yields 360
  if (Math.abs(normalized - 360) < 1e-12) {
    return 0;
  }
  return normalized;
}

/**
 * Normalizes an angle in radians into canonical range [0, 2π).
 */
export function normalizeAngleRad(rad: number): number {
  if (!Number.isFinite(rad)) {
    throw new Error(`normalizeAngleRad: Invalid angle ${rad}. Must be a finite number.`);
  }
  const TWO_PI = 2 * Math.PI;
  let normalized = rad % TWO_PI;
  if (normalized < 0) {
    normalized += TWO_PI;
  }
  if (Math.abs(normalized - TWO_PI) < 1e-12) {
    return 0;
  }
  return normalized;
}

/**
 * Normalizes a cyclic perimeter parameter into canonical range [0, 1).
 */
export function normalizeParam(t: number): number {
  if (!Number.isFinite(t)) {
    throw new Error(`normalizeParam: Invalid parameter ${t}. Must be a finite number.`);
  }
  let normalized = t % 1;
  if (normalized < 0) {
    normalized += 1;
  }
  if (Math.abs(normalized - 1) < 1e-12) {
    return 0;
  }
  return normalized;
}

/**
 * LAYER A -> LAYER B:
 * Converts circle angular address (alpha in degrees) to perimeter arc length s.
 * @param alphaDeg Polar angle in degrees [0, 360)
 * @param R Circle radius > 0
 * @param orientation 'CCW' (default, mathematically positive) or 'CW'
 * @param originOffsetDeg Starting angle datum (default: 0 = +X axis)
 */
export function circleAngleToArcLength(
  alphaDeg: number,
  R: number,
  orientation: TraversalOrientation = 'CCW',
  originOffsetDeg: number = 0
): { arcLength: number; normalizedParam: number; totalPerimeter: number } {
  if (R <= 0 || !Number.isFinite(R)) {
    throw new Error(`circleAngleToArcLength: Invalid radius R=${R}. Must be strictly positive.`);
  }
  const normAlpha = normalizeAngleDeg(alphaDeg);
  const normOrigin = normalizeAngleDeg(originOffsetDeg);
  const totalPerimeter = 2 * Math.PI * R;

  let deltaDeg = normAlpha - normOrigin;
  if (deltaDeg < 0) {
    deltaDeg += 360;
  }

  if (orientation === 'CW') {
    deltaDeg = (360 - deltaDeg) % 360;
  }

  const normalizedParam = deltaDeg / 360;
  const arcLength = normalizedParam * totalPerimeter;

  return {
    arcLength,
    normalizedParam,
    totalPerimeter,
  };
}

/**
 * LAYER B -> LAYER A:
 * Converts circle perimeter arc length s to polar angle in degrees.
 */
export function circleArcLengthToAngle(
  arcLength: number,
  R: number,
  orientation: TraversalOrientation = 'CCW',
  originOffsetDeg: number = 0
): { angleDeg: number; angleRad: number } {
  if (R <= 0 || !Number.isFinite(R)) {
    throw new Error(`circleArcLengthToAngle: Invalid radius R=${R}. Must be strictly positive.`);
  }
  const totalPerimeter = 2 * Math.PI * R;
  let normalizedS = arcLength % totalPerimeter;
  if (normalizedS < 0) {
    normalizedS += totalPerimeter;
  }

  let deltaDeg = (normalizedS / totalPerimeter) * 360;
  if (orientation === 'CW') {
    deltaDeg = (360 - deltaDeg) % 360;
  }

  const angleDeg = normalizeAngleDeg(originOffsetDeg + deltaDeg);
  const angleRad = (angleDeg * Math.PI) / 180;

  return { angleDeg, angleRad };
}

/**
 * LAYER A -> LAYER C:
 * Converts circle polar angle to 2D Cartesian coordinates.
 */
export function polarToCartesian(
  alphaDeg: number,
  R: number,
  center: CartesianPoint2D = { x: 0, y: 0 }
): CartesianPoint2D {
  if (R < 0 || !Number.isFinite(R)) {
    throw new Error(`polarToCartesian: Invalid radius R=${R}.`);
  }
  const rad = (normalizeAngleDeg(alphaDeg) * Math.PI) / 180;
  return {
    x: center.x + R * Math.cos(rad),
    y: center.y + R * Math.sin(rad),
  };
}

/**
 * LAYER C -> LAYER A:
 * Converts 2D Cartesian coordinates to polar angle relative to center.
 */
export function cartesianToPolar(
  point: CartesianPoint2D,
  center: CartesianPoint2D = { x: 0, y: 0 }
): { radius: number; angleDeg: number; angleRad: number } {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const radius = Math.hypot(dx, dy);
  const angleRad = normalizeAngleRad(Math.atan2(dy, dx));
  const angleDeg = normalizeAngleDeg((angleRad * 180) / Math.PI);
  return { radius, angleDeg, angleRad };
}

/**
 * POLYGON PERIMETER ACCUMULATION (LAYER B):
 * Describes a point along a closed polygon contour.
 */
export interface PolygonVertexDefinition {
  id: string;
  x: number;
  y: number;
}

export interface PolygonPerimeterTrace {
  totalPerimeter: number;
  segments: Array<{
    segmentIndex: number;
    startVertexId: string;
    endVertexId: string;
    segmentLength: number;
    cumulativeStartS: number;
    cumulativeEndS: number;
  }>;
}

/**
 * Computes the cumulative metric profile of a closed polygon given ordered vertices.
 */
export function computePolygonPerimeterProfile(
  vertices: PolygonVertexDefinition[]
): PolygonPerimeterTrace {
  if (!vertices || vertices.length < 3) {
    throw new Error('computePolygonPerimeterProfile: Polygon must have at least 3 vertices.');
  }

  let totalPerimeter = 0;
  const segments: PolygonPerimeterTrace['segments'] = [];

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const segLen = Math.hypot(v2.x - v1.x, v2.y - v1.y);

    segments.push({
      segmentIndex: i,
      startVertexId: v1.id,
      endVertexId: v2.id,
      segmentLength: segLen,
      cumulativeStartS: totalPerimeter,
      cumulativeEndS: totalPerimeter + segLen,
    });
    totalPerimeter += segLen;
  }

  if (totalPerimeter <= 1e-12) {
    throw new Error('computePolygonPerimeterProfile: Degenerate polygon with 0 perimeter.');
  }

  return { totalPerimeter, segments };
}

/**
 * Maps a distance along polygon perimeter s in [0, totalPerimeter) to Cartesian coordinates (Layer C).
 */
export function polygonPerimeterToCartesian(
  profile: PolygonPerimeterTrace,
  vertices: PolygonVertexDefinition[],
  s: number
): {
  point: CartesianPoint2D;
  segmentIndex: number;
  segmentLocalT: number;
  normalizedParam: number;
} {
  const L = profile.totalPerimeter;
  let normalizedS = s % L;
  if (normalizedS < 0) {
    normalizedS += L;
  }
  const normalizedParam = normalizedS / L;

  // Locate the segment containing normalizedS
  for (let i = 0; i < profile.segments.length; i++) {
    const seg = profile.segments[i];
    const isLast = i === profile.segments.length - 1;
    // For last segment, include right boundary (closure)
    if (normalizedS >= seg.cumulativeStartS && (normalizedS < seg.cumulativeEndS || (isLast && normalizedS <= seg.cumulativeEndS))) {
      const localS = normalizedS - seg.cumulativeStartS;
      const localT = seg.segmentLength > 0 ? localS / seg.segmentLength : 0;
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      return {
        point: {
          x: v1.x + localT * (v2.x - v1.x),
          y: v1.y + localT * (v2.y - v1.y),
        },
        segmentIndex: i,
        segmentLocalT: localT,
        normalizedParam,
      };
    }
  }

  // Fallback to start
  return {
    point: { x: vertices[0].x, y: vertices[0].y },
    segmentIndex: 0,
    segmentLocalT: 0,
    normalizedParam: 0,
  };
}

/**
 * WORLD_CANONICAL Ordering (Mode A):
 * Extrinsic observer-dependent ordering for polygon vertices relative to circle center.
 * Sorts points strictly by polar angle θ in [0, 2π) (CCW starting from +X axis).
 * Preserves original IDs, original coordinates, and attaches canonical role/index.
 *
 * NOTE: This is an extrinsic ordering (coordinate-frame dependent).
 * It is NOT an SE(2) invariant shape classification.
 */
export interface WorldCanonicalPoint {
  canonicalIndex: number;
  canonicalRole: 'P_0' | 'P_1' | 'P_2' | string;
  originalId: string;
  x: number;
  y: number;
  thetaRad: number;
  thetaDeg: number;
}

export function worldCanonicalOrdering(
  points: Array<{ id: string; x: number; y: number }>,
  center: CartesianPoint2D = { x: 0, y: 0 },
  coincidentEpsilonDeg: number = 1e-4
): WorldCanonicalPoint[] {
  if (!points || points.length === 0) {
    return [];
  }

  // 1. Compute polar angle for each point
  const withPolar = points.map((p) => {
    const polar = cartesianToPolar({ x: p.x, y: p.y }, center);
    return {
      originalId: p.id,
      x: p.x,
      y: p.y,
      thetaRad: polar.angleRad,
      thetaDeg: polar.angleDeg,
    };
  });

  // 2. Sort ascending by polar angle [0, 360)
  withPolar.sort((a, b) => a.thetaDeg - b.thetaDeg);

  // 3. Check for distinctness / coincident angles under policy
  for (let i = 0; i < withPolar.length - 1; i++) {
    const diff = withPolar[i + 1].thetaDeg - withPolar[i].thetaDeg;
    if (diff < coincidentEpsilonDeg) {
      // Coincident or near-coincident angle: tie-break deterministically by originalId
      if (Math.abs(diff) < 1e-9 && withPolar[i + 1].originalId < withPolar[i].originalId) {
        const tmp = withPolar[i];
        withPolar[i] = withPolar[i + 1];
        withPolar[i + 1] = tmp;
      }
    }
  }

  // 4. Assign canonical role P_0, P_1, P_2...
  return withPolar.map((p, idx) => ({
    canonicalIndex: idx,
    canonicalRole: `P_${idx}`,
    originalId: p.originalId,
    x: p.x,
    y: p.y,
    thetaRad: p.thetaRad,
    thetaDeg: p.thetaDeg,
  }));
}

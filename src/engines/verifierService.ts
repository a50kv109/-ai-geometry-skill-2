// src/engines/verifierService.ts
import { FullGeometryState } from './constructionCore';
import { PerpendicularBisectorPlan } from './perpendicularBisector';
import { distance2D } from './geometryIntersections';

export type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'NOT_VERIFIED';

export interface VerifierResult {
  planValid: boolean;
  geometryValid: VerificationStatus;
  constructionPathVerified: VerificationStatus;
}

export function validatePlan(plan: PerpendicularBisectorPlan): boolean {
  return plan.success === true;
}

export function verifyGeometry(
  state: FullGeometryState,
  plan: PerpendicularBisectorPlan
): VerifierResult {
  if (!plan.success) {
    return {
      planValid: false,
      geometryValid: 'NOT_VERIFIED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  const { bisectorLineId, intersection1Id, intersection2Id, circleAId, circleBId } =
    plan.createdObjectIds;

  // 1. Check object existence
  const line = state.lines[bisectorLineId];
  const i1 = state.points[intersection1Id];
  const i2 = state.points[intersection2Id];
  const circA = state.circles[circleAId];
  const circB = state.circles[circleBId];

  if (!line || !i1 || !i2 || !circA || !circB) {
    return {
      planValid: true,
      geometryValid: 'REJECTED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  // 2. Retrieve source points via plan / provenance / commands
  let pAId: string | undefined;
  let pBId: string | undefined;

  if (line.provenance?.sourceIds && line.provenance.sourceIds.length >= 2) {
    pAId = line.provenance.sourceIds[0];
    pBId = line.provenance.sourceIds[1];
  } else {
    // Fallback to inspect plan commands
    const circleCmd = plan.commands.find(
      (c) => c.type === 'ADD_CIRCLE' && c.circle.id === circleAId
    );
    if (circleCmd && circleCmd.type === 'ADD_CIRCLE') {
      pAId = circleCmd.circle.centerId;
      pBId = circleCmd.circle.radiusPointId;
    }
  }

  if (!pAId || !pBId) {
    return {
      planValid: true,
      geometryValid: 'REJECTED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  const ptA = state.points[pAId];
  const ptB = state.points[pBId];

  if (!ptA || !ptB) {
    return {
      planValid: true,
      geometryValid: 'REJECTED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  // 3. Mathematical Verification
  // Vector AB and Vector I1I2
  const vAB = { x: ptB.x - ptA.x, y: ptB.y - ptA.y };
  const vI = { x: i2.x - i1.x, y: i2.y - i1.y };

  // Perpendicularity check (Dot product close to 0)
  const dot = vAB.x * vI.x + vAB.y * vI.y;
  if (Math.abs(dot) > 1e-5) {
    return {
      planValid: true,
      geometryValid: 'REJECTED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  // Midpoint passage check (Midpoint of AB must lie on line I1-I2)
  const mid = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };
  const vMidI1 = { x: mid.x - i1.x, y: mid.y - i1.y };
  const cross = vMidI1.x * vI.y - vMidI1.y * vI.x;
  if (Math.abs(cross) > 1e-5) {
    return {
      planValid: true,
      geometryValid: 'REJECTED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  // Equidistance check (dist(A, I1) == dist(B, I1))
  const dAI1 = distance2D(ptA, i1);
  const dBI1 = distance2D(ptB, i1);
  if (Math.abs(dAI1 - dBI1) > 1e-5) {
    return {
      planValid: true,
      geometryValid: 'REJECTED',
      constructionPathVerified: 'NOT_VERIFIED',
    };
  }

  return {
    planValid: true,
    geometryValid: 'VERIFIED',
    constructionPathVerified: 'NOT_VERIFIED',
  };
}

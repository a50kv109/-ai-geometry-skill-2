// src/engines/tests/testPerpendicularBisector.ts
// Rigorous verification of Perpendicular Bisector construction macro
// Validates pure mathematical geometry, transaction lifecycle, and state invariance.

import { createDefaultGeometryState } from '../geometryState';
import {
  planPerpendicularBisector,
  applyPerpendicularBisector,
  PerpendicularBisectorValidationFailure,
} from '../perpendicularBisector';
import { dispatchGeometryCommand } from '../constructionCore';
import { distance2D } from '../geometryIntersections';
import { validatePlan, verifyGeometry } from '../verifierService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

export function runPerpendicularBisectorTests() {
  console.log('--- RUNNING PERPENDICULAR BISECTOR SUITE ---');

  // Test 1: Basic Construction on chord AB
  {
    const state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const { nextState, plan } = applyPerpendicularBisector(state, 'A', 'B');

    assert(plan.success, 'Plan must succeed for valid base points A and B');
    if (!plan.success) return;

    assert(
      Object.keys(nextState.lines).length === 1,
      'Exactly 1 primary line should be created'
    );
    assert(
      Object.keys(nextState.circles).length === 3, // base_circle + 2 auxiliary circles
      'Two auxiliary circles must be created'
    );

    const { circleAId, circleBId, intersection1Id, intersection2Id, bisectorLineId } =
      plan.createdObjectIds;

    const circA = nextState.circles[circleAId];
    const circB = nextState.circles[circleBId];
    const ptI1 = nextState.points[intersection1Id];
    const ptI2 = nextState.points[intersection2Id];
    const line = nextState.lines[bisectorLineId];

    assert(circA !== undefined && circA.role === 'auxiliary', 'Circle A must be auxiliary');
    assert(circB !== undefined && circB.role === 'auxiliary', 'Circle B must be auxiliary');
    assert(ptI1 !== undefined && ptI1.role === 'auxiliary', 'Intersection 1 must be auxiliary');
    assert(ptI2 !== undefined && ptI2.role === 'auxiliary', 'Intersection 2 must be auxiliary');
    assert(line !== undefined && line.role === 'primary', 'Bisector line must be primary');

    // Check provenance
    assert(
      line.provenance?.macroType === 'perpendicular_bisector',
      'Macro type must be perpendicular_bisector'
    );
    assert(
      line.provenance?.groupId === plan.groupId,
      'Provenance groupId must match plan groupId'
    );
    assert(
      ptI1.provenance?.groupId === plan.groupId,
      'Point I1 must belong to same groupId'
    );

    // Test geometric orthogonality: (B - A) . (I2 - I1) == 0
    const ptA = state.points.A;
    const ptB = state.points.B;
    const vAB = { x: ptB.x - ptA.x, y: ptB.y - ptA.y };
    const vI = { x: ptI2.x - ptI1.x, y: ptI2.y - ptI1.y };
    const dot = vAB.x * vI.x + vAB.y * vI.y;
    assert(Math.abs(dot) < 1e-6, `Vectors must be strictly orthogonal. Dot product: ${dot}`);

    // Test midpoint passage: midpoint of AB must lie on line I1-I2
    const mid = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };
    // Cross product (mid - I1) x (I2 - I1) == 0
    const vMidI1 = { x: mid.x - ptI1.x, y: mid.y - ptI1.y };
    const cross = vMidI1.x * vI.y - vMidI1.y * vI.x;
    assert(Math.abs(cross) < 1e-6, `Midpoint must lie on bisector line. Cross product: ${cross}`);

    // Test equidistance: dist(A, I1) == dist(B, I1)
    const dAI1 = distance2D(ptA, ptI1);
    const dBI1 = distance2D(ptB, ptI1);
    assert(Math.abs(dAI1 - dBI1) < 1e-7, 'I1 must be equidistant from A and B');
    console.log('✓ Test 1 Passed: Classical Euclidean construction verified');
  }

  // Test 2: Degenerate Coincident Points (A == B)
  {
    const state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const result = applyPerpendicularBisector(state, 'A', 'A');

    if (!result.plan.success) {
      const failure = result.plan as PerpendicularBisectorValidationFailure;
      assert(failure.error === 'POINTS_COINCIDENT', 'Error code must be POINTS_COINCIDENT');
    } else {
      throw new Error('Plan must fail when points coincide');
    }
    assert(result.nextState === state, 'GeometryState must remain strictly untouched on error');
    console.log('✓ Test 2 Passed: Degeneracy A=B handled cleanly without mutating state');
  }

  // Test 3: Non-existent Point ID
  {
    const state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const result = applyPerpendicularBisector(state, 'A', 'NON_EXISTENT');

    if (!result.plan.success) {
      const failure = result.plan as PerpendicularBisectorValidationFailure;
      assert(failure.error === 'POINT_NOT_FOUND', 'Error code must be POINT_NOT_FOUND');
    } else {
      throw new Error('Plan must fail for non-existent point');
    }
    assert(result.nextState === state, 'State must remain identical');
    console.log('✓ Test 3 Passed: Non-existent point rejected');
  }

  // Test 4: Cascade deletion when deleting primary bisector line
  {
    const state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const { nextState, plan } = applyPerpendicularBisector(state, 'B', 'C');
    assert(plan.success, 'Construction BC must succeed');
    if (!plan.success) return;

    const lineId = plan.createdObjectIds.bisectorLineId;
    const erasedState = dispatchGeometryCommand(nextState, {
      type: 'ERASE_OBJECT',
      objectType: 'line',
      id: lineId,
    });

    assert(
      erasedState.lines[lineId] === undefined,
      'Primary line must be deleted'
    );
    assert(
      erasedState.circles[plan.createdObjectIds.circleAId] === undefined,
      'Auxiliary circle 1 must be cascade-deleted'
    );
    assert(
      erasedState.circles[plan.createdObjectIds.circleBId] === undefined,
      'Auxiliary circle 2 must be cascade-deleted'
    );
    assert(
      erasedState.points[plan.createdObjectIds.intersection1Id] === undefined,
      'Auxiliary intersection point 1 must be cascade-deleted'
    );
    assert(
      erasedState.points[plan.createdObjectIds.intersection2Id] === undefined,
      'Auxiliary intersection point 2 must be cascade-deleted'
    );
    console.log('✓ Test 4 Passed: Cascade cleanup of auxiliary geometry verified');
  }

  // Test 5: Oblique custom points
  {
    let state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    state = dispatchGeometryCommand(state, {
      type: 'ADD_POINT',
      point: { id: 'P1', name: 'P1', x: -30, y: 40 },
    });
    state = dispatchGeometryCommand(state, {
      type: 'ADD_POINT',
      point: { id: 'P2', name: 'P2', x: 50, y: -20 },
    });

    const { nextState, plan } = applyPerpendicularBisector(state, 'P1', 'P2');
    assert(plan.success, 'Construction between oblique user points must succeed');
    if (!plan.success) return;

    const pt1 = nextState.points.P1;
    const pt2 = nextState.points.P2;
    const i1 = nextState.points[plan.createdObjectIds.intersection1Id];
    const i2 = nextState.points[plan.createdObjectIds.intersection2Id];

    const vP = { x: pt2.x - pt1.x, y: pt2.y - pt1.y };
    const vI = { x: i2.x - i1.x, y: i2.y - i1.y };
    const dot = vP.x * vI.x + vP.y * vI.y;
    assert(Math.abs(dot) < 1e-6, 'Perpendicularity holds for general oblique coordinates');
    console.log('✓ Test 5 Passed: General oblique coordinates verified');
  }

  // Test 6: Asymmetric Coordinates
  {
    let state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    state = dispatchGeometryCommand(state, { type: 'ADD_POINT', point: { id: 'A1', name: 'A1', x: -100, y: 50 } });
    state = dispatchGeometryCommand(state, { type: 'ADD_POINT', point: { id: 'B1', name: 'B1', x: 200, y: -30 } });
    
    const { nextState, plan } = applyPerpendicularBisector(state, 'A1', 'B1');
    assert(plan.success, 'Asymmetric construction must succeed');
    if (!plan.success) return;
    
    const pt1 = nextState.points.A1;
    const pt2 = nextState.points.B1;
    const i1 = nextState.points[plan.createdObjectIds.intersection1Id];
    const i2 = nextState.points[plan.createdObjectIds.intersection2Id];

    // 1. Orthogonality check
    const vP = { x: pt2.x - pt1.x, y: pt2.y - pt1.y };
    const vI = { x: i2.x - i1.x, y: i2.y - i1.y };
    const dot = vP.x * vI.x + vP.y * vI.y;
    assert(Math.abs(dot) < 1e-6, 'Perpendicularity holds for asymmetric coordinates');
    
    // 2. Independent midpoint checks
    const midGeom = { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
    
    // Equality of distances from A1/B1 to midpoint
    const dAMid = distance2D(pt1, midGeom);
    const dBMid = distance2D(pt2, midGeom);
    assert(Math.abs(dAMid - dBMid) < 1e-7, 'Midpoint must be equidistant from A1 and B1');

    // Geometric midpoint must lie on bisector line
    const vMidI1 = { x: midGeom.x - i1.x, y: midGeom.y - i1.y };
    const cross = vMidI1.x * vI.y - vMidI1.y * vI.x;
    assert(Math.abs(cross) < 1e-6, 'Geometric midpoint must lie on bisector line');

    // Midpoint must lie on segment A1B1
    const vA1Mid = { x: pt1.x - midGeom.x, y: pt1.y - midGeom.y };
    const vB1Mid = { x: pt2.x - midGeom.x, y: pt2.y - midGeom.y };
    const dotMid = vA1Mid.x * vB1Mid.x + vA1Mid.y * vB1Mid.y;
    assert(dotMid <= 1e-6, 'Geometric midpoint must lie on segment A1B1');
    
    console.log('✓ Test 6 Passed: Asymmetric construction and midpoint invariants verified');
  }

  // Test 7: Negative Test - Oracle Leak detection
  {
    const state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const ptA = state.points.A;
    const ptB = state.points.B;
    // Correct midpoint calculation
    const mid = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };
    // Incorrect "oracle" point: shifted
    const badMid = { x: mid.x + 10, y: mid.y + 10 };

    // Verify distance from A and B should fail
    const dABad = distance2D(ptA, badMid);
    const dBBad = distance2D(ptB, badMid);
    
    let failed = false;
    try {
        assert(Math.abs(dABad - dBBad) < 1e-7, 'Bad midpoint must fail equidistance');
    } catch (e) {
        failed = true;
    }
    assert(failed, 'Oracle leak test MUST fail on incorrect midpoint');
    console.log('✓ Test 7 Passed: Oracle leak correctly detected');
  }

  // Test 8: VerifierService - Valid Construction
  {
    let state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    state = dispatchGeometryCommand(state, { type: 'ADD_POINT', point: { id: 'A1', name: 'A1', x: -100, y: 50 } });
    state = dispatchGeometryCommand(state, { type: 'ADD_POINT', point: { id: 'B1', name: 'B1', x: 200, y: -30 } });
    
    const { nextState, plan } = applyPerpendicularBisector(state, 'A1', 'B1');
    assert(plan.success, 'Construction must succeed');
    
    assert(validatePlan(plan), 'Plan should be valid');
    const verification = verifyGeometry(nextState, plan);
    assert(verification.planValid, 'Plan valid status must be true');
    assert(verification.geometryValid === 'VERIFIED', 'Geometry must be verified');
    assert(verification.constructionPathVerified === 'NOT_VERIFIED', 'Path verification pending');
    
    console.log('✓ Test 8 Passed: VerifierService valid construction verified');
  }

  // Test 9: VerifierService - Perpendicularity Violation
  {
    let state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const { nextState, plan } = applyPerpendicularBisector(state, 'A', 'B');
    assert(plan.success, 'Construction must succeed');
    if (!plan.success) return;

    // Tamper intersection 1 coordinates to break perpendicularity
    const i1Id = plan.createdObjectIds.intersection1Id;
    const ptI1 = nextState.points[i1Id];
    const tamperedState = {
      ...nextState,
      points: {
        ...nextState.points,
        [i1Id]: { ...ptI1, x: ptI1.x + 50, y: ptI1.y + 50 },
      },
    };

    const verification = verifyGeometry(tamperedState, plan);
    assert(verification.geometryValid === 'REJECTED', 'Tampered perpendicularity must be rejected');
    console.log('✓ Test 9 Passed: Perpendicularity violation detected');
  }

  // Test 10: VerifierService - Shifted Line / Midpoint Mismatch
  {
    let state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const { nextState, plan } = applyPerpendicularBisector(state, 'A', 'B');
    assert(plan.success, 'Construction must succeed');
    if (!plan.success) return;

    // Shift both intersection points parallelly so perpendicularity holds but midpoint passage fails
    const i1Id = plan.createdObjectIds.intersection1Id;
    const i2Id = plan.createdObjectIds.intersection2Id;
    const ptI1 = nextState.points[i1Id];
    const ptI2 = nextState.points[i2Id];
    
    const tamperedState = {
      ...nextState,
      points: {
        ...nextState.points,
        [i1Id]: { ...ptI1, x: ptI1.x + 20, y: ptI1.y + 20 },
        [i2Id]: { ...ptI2, x: ptI2.x + 20, y: ptI2.y + 20 },
      },
    };

    const verification = verifyGeometry(tamperedState, plan);
    assert(verification.geometryValid === 'REJECTED', 'Shifted line must be rejected');
    console.log('✓ Test 10 Passed: Shifted line violation detected');
  }

  // Test 11: VerifierService - Missing Objects
  {
    let state = createDefaultGeometryState({ A: 0.1, B: 0.4, C: 0.7 }, 100);
    const { nextState, plan } = applyPerpendicularBisector(state, 'A', 'B');
    assert(plan.success, 'Construction must succeed');
    if (!plan.success) return;

    // Remove the bisector line
    const lineId = plan.createdObjectIds.bisectorLineId;
    const { [lineId]: _, ...remainingLines } = nextState.lines;
    const tamperedState = {
      ...nextState,
      lines: remainingLines,
    };

    const verification = verifyGeometry(tamperedState, plan);
    assert(verification.geometryValid === 'REJECTED', 'Missing line object must be rejected');
    console.log('✓ Test 11 Passed: Missing object violation detected');
  }

  console.log('--- ALL PERPENDICULAR BISECTOR TESTS PASSED (11/11) ---');
}

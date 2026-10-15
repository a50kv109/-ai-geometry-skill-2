// src/headless/HeadlessGeometrySession.ts
// Autonomous Headless AI Geometry Session (Phase 3 PoC)
// Implements AI GEOMETRY SKILL SEMANTIC CONTRACT v0.3
// "REASON OUTSIDE. VERIFY INSIDE."
// ZERO UI DEPENDENCIES. ZERO NEW GEOMETRY ENGINES. REUSES CORE DIRECTLY.

import {
  FullGeometryState,
  GeometryPoint,
  GeometrySegment,
  GeometryLine,
  GeometryCircle,
  createDefaultGeometryState,
  dispatchGeometryCommand,
  calculateEuclideanDistance,
} from '../engines/constructionCore';
import {
  intersectCircleCircle,
  intersectLineCircle,
  intersectLineLine,
  intersectLineSegment,
  projectPointToLine,
  Point2D,
  GEOMETRY_EPSILON,
} from '../engines/geometryIntersections';
import { planPerpendicularLine } from '../engines/perpendicularLine';
import { planParallelLine } from '../engines/parallelLine';
import { planAngleBisector } from '../engines/angleBisector';
import { planPerpendicularBisector } from '../engines/perpendicularBisector';
import { deepCloneGeometryState } from '../engines/research/planeClone';
import { extractSemanticQuantities } from '../engines/configuration/semanticQuantity';
import { extractSemanticRelations } from '../engines/configuration/semanticRelation';
import { checkGeometryInvariants } from '../engines/invariants';
import { createGeometrySnapshot } from '../engines/temporalObserver';
import { buildConfigurationView } from '../engines/configuration/configurationProjector';
import { projectStateToPgsPassport } from '../engines/pgs/pgsProjector';
import { importPgsPassport } from '../engines/pgs/pgsImporter';
import { PGS2DPassport, PGSObject } from '../engines/pgs/types';
import {
  HeadlessSessionOptions,
  CompactActionResponse,
  ObservationMode,
  ObservationResult,
  ProvenanceObservation,
  FullObservation,
  VerificationRelationType,
  HeadlessVerificationResult,
  MeasureResult,
  GSASolutionArtifact,
  GSAImportReport,
  GSACertifiedClaim,
  GSAProvenanceRecord,
  GSAMeasurementRecord,
} from './types';

export class HeadlessGeometrySession {
  private state: FullGeometryState;
  private sandboxes: Map<string, FullGeometryState> = new Map();
  private sandboxCounter: number = 0;
  private intersectionCounter: number = 0;
  private certifiedClaimsStore: GSACertifiedClaim[] = [];
  private initialOptions: HeadlessSessionOptions;

  // Strict Receiver-Owned Tolerance Policy (Phase 3 Core Standard)
  public static readonly VERIFICATION_EPSILON = 1e-4;

  constructor(options: HeadlessSessionOptions = {}) {
    this.initialOptions = options;
    this.state = this.createInitialState(options);
  }

  // --------------------------------------------------------------------------
  // STATE INITIALIZATION & SANITIZATION HELPERS
  // --------------------------------------------------------------------------

  private createInitialState(options: HeadlessSessionOptions): FullGeometryState {
    const R = options.R ?? 100;
    if (options.profile === 'blank') {
      return {
        R,
        pointsU: { A: 0, B: 0, C: 0 },
        points: {},
        segments: {},
        lines: {},
        circles: {},
        pointCounter: 0,
        segmentCounter: 0,
        lineCounter: 0,
        circleCounter: 0,
      };
    }

    // Default Profile: Triangle Stand
    const defaultPointsU = options.pointsU ?? {
      A: 0.75,
      B: 0.08333333333333333,
      C: 0.25,
    };
    return createDefaultGeometryState(defaultPointsU, R);
  }

  private isFiniteNumber(val: unknown): val is number {
    return typeof val === 'number' && Number.isFinite(val);
  }

  private buildDeltaDigest() {
    return {
      totalEntities:
        Object.keys(this.state.points).length +
        Object.keys(this.state.segments).length +
        Object.keys(this.state.lines).length +
        Object.keys(this.state.circles).length,
      pointCount: Object.keys(this.state.points).length,
      segmentCount: Object.keys(this.state.segments).length,
      lineCount: Object.keys(this.state.lines).length,
      circleCount: Object.keys(this.state.circles).length,
    };
  }

  // --------------------------------------------------------------------------
  // 1. LIFECYCLE & WORKSPACE ISOLATION (reset, fork, rollback)
  // --------------------------------------------------------------------------

  public reset(options?: HeadlessSessionOptions): CompactActionResponse {
    const opts = options ?? this.initialOptions;
    this.state = this.createInitialState(opts);
    this.sandboxes.clear();
    this.sandboxCounter = 0;
    this.intersectionCounter = 0;
    this.certifiedClaimsStore = [];

    return {
      success: true,
      action: 'RESET',
      stateChanged: true,
      created: [],
      mutated: [],
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  public fork(): { success: boolean; sandboxId: string } {
    this.sandboxCounter++;
    const sandboxId = `sandbox_${this.sandboxCounter}`;
    // Reuses pure deepCloneGeometryState from research layer
    const cloned = deepCloneGeometryState(this.state);
    this.sandboxes.set(sandboxId, cloned);
    return { success: true, sandboxId };
  }

  public rollback(sandboxId: string): CompactActionResponse {
    const saved = this.sandboxes.get(sandboxId);
    if (!saved) {
      return {
        success: false,
        action: 'ROLLBACK',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Sandbox '${sandboxId}' not found.`,
        errorCode: 'SANDBOX_NOT_FOUND',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    this.state = deepCloneGeometryState(saved);
    return {
      success: true,
      action: 'ROLLBACK',
      stateChanged: true,
      created: [],
      mutated: Object.keys(this.state.points),
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  // --------------------------------------------------------------------------
  // 2. CONSTRUCTIVE ACTIONS (Skill Boundary Validation -> Core Reducer)
  // --------------------------------------------------------------------------

  public create_point(
    x: number,
    y: number,
    options?: { on_circle?: boolean; id?: string; name?: string; z?: number }
  ): CompactActionResponse {
    // 0. 3D / Z capability gap check
    if (
      (options as any)?.z !== undefined ||
      (arguments.length > 2 && typeof arguments[2] === 'number')
    ) {
      return {
        success: false,
        action: 'CREATE_POINT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: '3D coordinates (z) are not supported in 2D Planar Geometry.',
        errorCode: 'CAPABILITY_GAP',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // 1. Skill Input Sanitization
    if (!this.isFiniteNumber(x) || !this.isFiniteNumber(y)) {
      return {
        success: false,
        action: 'CREATE_POINT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Invalid coordinates: x=${x}, y=${y}. Coordinates must be finite numbers.`,
        errorCode: 'INVALID_NUMERIC_INPUT',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // Duplicate ID check: state unchanged, return DUPLICATE_ID
    if (options?.id && this.state.points[options.id]) {
      return {
        success: false,
        action: 'CREATE_POINT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Point with id '${options.id}' already exists.`,
        errorCode: 'DUPLICATE_ID',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    const nextCount = this.state.pointCounter + 1;
    const ptId = options?.id || `pt_${nextCount}`;
    const name = options?.name || ptId;

    // 2. Dispatch directly to Core reducer (SSOT)
    this.state = dispatchGeometryCommand(this.state, {
      type: 'ADD_POINT',
      point: {
        id: ptId,
        name,
        x,
        y,
        onCircle: options?.on_circle,
        role: 'primary',
      },
    });

    return {
      success: true,
      action: 'CREATE_POINT',
      stateChanged: true,
      created: [{ id: ptId, type: 'POINT', role: 'primary' }],
      mutated: [],
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  public connect(
    p1Id: string,
    p2Id: string,
    type: 'SEGMENT' | 'LINE'
  ): CompactActionResponse {
    // 1. Skill Input Sanitization
    const p1 = this.state.points[p1Id];
    const p2 = this.state.points[p2Id];

    if (!p1 || !p2) {
      return {
        success: false,
        action: 'CONNECT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Cannot connect: point '${!p1 ? p1Id : p2Id}' does not exist.`,
        errorCode: 'ENTITY_NOT_FOUND',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    if (p1Id === p2Id) {
      return {
        success: false,
        action: 'CONNECT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Cannot connect: endpoints '${p1Id}' and '${p2Id}' are identical.`,
        errorCode: 'POINTS_COINCIDENT',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // Duplicate connect idempotency: return existing segment/line ID without creating ghost duplicate
    if (type === 'SEGMENT') {
      const existingSeg = Object.values(this.state.segments).find(
        (s) => (s.p1Id === p1Id && s.p2Id === p2Id) || (s.p1Id === p2Id && s.p2Id === p1Id)
      );
      if (existingSeg) {
        return {
          success: true,
          action: 'CONNECT',
          stateChanged: false,
          created: [{ id: existingSeg.id, type: 'SEGMENT', role: existingSeg.role || 'primary' }],
          mutated: [],
          deleted: [],
          deltaDigest: this.buildDeltaDigest(),
        };
      }
    } else {
      const existingLine = Object.values(this.state.lines).find(
        (l) => (l.p1Id === p1Id && l.p2Id === p2Id) || (l.p1Id === p2Id && l.p2Id === p1Id)
      );
      if (existingLine) {
        return {
          success: true,
          action: 'CONNECT',
          stateChanged: false,
          created: [{ id: existingLine.id, type: 'LINE', role: existingLine.role || 'primary' }],
          mutated: [],
          deleted: [],
          deltaDigest: this.buildDeltaDigest(),
        };
      }
    }

    // 2. Dispatch to Core reducer
    if (type === 'SEGMENT') {
      const nextCount = this.state.segmentCounter + 1;
      const segId = `seg_${nextCount}`;
      this.state = dispatchGeometryCommand(this.state, {
        type: 'ADD_SEGMENT',
        segment: {
          id: segId,
          p1Id,
          p2Id,
          role: 'primary',
        },
      });

      return {
        success: true,
        action: 'CONNECT',
        stateChanged: true,
        created: [{ id: segId, type: 'SEGMENT', role: 'primary' }],
        mutated: [],
        deleted: [],
        deltaDigest: this.buildDeltaDigest(),
      };
    } else {
      const nextCount = this.state.lineCounter + 1;
      const lineId = `line_${nextCount}`;
      this.state = dispatchGeometryCommand(this.state, {
        type: 'ADD_LINE',
        line: {
          id: lineId,
          p1Id,
          p2Id,
          role: 'primary',
        },
      });

      return {
        success: true,
        action: 'CONNECT',
        stateChanged: true,
        created: [{ id: lineId, type: 'LINE', role: 'primary' }],
        mutated: [],
        deleted: [],
        deltaDigest: this.buildDeltaDigest(),
      };
    }
  }

  public create_circle(
    centerId: string,
    radSpec: number | string
  ): CompactActionResponse {
    // 1. Skill Input Sanitization
    const center = this.state.points[centerId];
    if (!center) {
      return {
        success: false,
        action: 'CREATE_CIRCLE',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Center point '${centerId}' not found.`,
        errorCode: 'ENTITY_NOT_FOUND',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    let radius: number | undefined;
    let radiusPointId: string | undefined;

    if (typeof radSpec === 'number') {
      if (!this.isFiniteNumber(radSpec) || radSpec <= 1e-4) {
        return {
          success: false,
          action: 'CREATE_CIRCLE',
          stateChanged: false,
          created: [],
          mutated: [],
          deleted: [],
          error: `Invalid circle radius: ${radSpec}. Radius must be positive.`,
          errorCode: 'INVALID_NUMERIC_INPUT',
          deltaDigest: this.buildDeltaDigest(),
        };
      }
      radius = radSpec;
    } else {
      const radPt = this.state.points[radSpec];
      if (!radPt) {
        return {
          success: false,
          action: 'CREATE_CIRCLE',
          stateChanged: false,
          created: [],
          mutated: [],
          deleted: [],
          error: `Radius point '${radSpec}' not found.`,
          errorCode: 'ENTITY_NOT_FOUND',
          deltaDigest: this.buildDeltaDigest(),
        };
      }
      radiusPointId = radSpec;
    }

    const nextCount = this.state.circleCounter + 1;
    const circleId = `circle_${nextCount}`;

    // 2. Dispatch to Core reducer
    this.state = dispatchGeometryCommand(this.state, {
      type: 'ADD_CIRCLE',
      circle: {
        id: circleId,
        centerId,
        radius,
        radiusPointId,
        role: 'primary',
      },
    });

    return {
      success: true,
      action: 'CREATE_CIRCLE',
      stateChanged: true,
      created: [{ id: circleId, type: 'CIRCLE', role: 'primary' }],
      mutated: [],
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  public construct(
    macroType: 'PERPENDICULAR' | 'PARALLEL' | 'ANGLE_BISECTOR' | 'PERPENDICULAR_BISECTOR',
    params: {
      reference?: string;
      through?: string;
      vertex?: string;
      arm1?: string;
      arm2?: string;
      p1Id?: string;
      p2Id?: string;
    }
  ): CompactActionResponse {
    let planResult: any;

    // Delegate strictly to existing transactional Core planners
    switch (macroType) {
      case 'PERPENDICULAR': {
        if (!params.reference || !params.through) {
          return this.buildPreconditionError('CONSTRUCT', 'PERPENDICULAR requires reference line/segment and through point.');
        }
        planResult = planPerpendicularLine(this.state, params.reference, params.through);
        break;
      }
      case 'PARALLEL': {
        if (!params.reference || !params.through) {
          return this.buildPreconditionError('CONSTRUCT', 'PARALLEL requires reference line/segment and through point.');
        }
        planResult = planParallelLine(this.state, params.reference, params.through);
        break;
      }
      case 'ANGLE_BISECTOR': {
        if (!params.vertex || !params.arm1 || !params.arm2) {
          return this.buildPreconditionError('CONSTRUCT', 'ANGLE_BISECTOR requires vertex, arm1, and arm2.');
        }
        planResult = planAngleBisector(this.state, params.vertex, params.arm1, params.arm2);
        break;
      }
      case 'PERPENDICULAR_BISECTOR': {
        if (!params.p1Id || !params.p2Id) {
          return this.buildPreconditionError('CONSTRUCT', 'PERPENDICULAR_BISECTOR requires p1Id and p2Id.');
        }
        planResult = planPerpendicularBisector(this.state, params.p1Id, params.p2Id);
        break;
      }
    }

    if (!planResult.success) {
      return {
        success: false,
        action: 'CONSTRUCT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: planResult.errorMessage,
        errorCode: planResult.error,
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // Execute atomic prepared commands on Core
    const prevState = this.state;
    this.state = dispatchGeometryCommand(this.state, {
      type: 'BATCH_COMMANDS',
      commands: planResult.commands,
    });

    const createdIds: { id: string; type: 'POINT' | 'SEGMENT' | 'LINE' | 'CIRCLE'; role: 'primary' | 'auxiliary' }[] = [];
    for (const [id, pt] of Object.entries(this.state.points)) {
      if (!prevState.points[id]) createdIds.push({ id, type: 'POINT', role: pt.role || 'primary' });
    }
    for (const [id, seg] of Object.entries(this.state.segments)) {
      if (!prevState.segments[id]) createdIds.push({ id, type: 'SEGMENT', role: seg.role || 'primary' });
    }
    for (const [id, line] of Object.entries(this.state.lines)) {
      if (!prevState.lines[id]) createdIds.push({ id, type: 'LINE', role: line.role || 'primary' });
    }
    for (const [id, circ] of Object.entries(this.state.circles)) {
      if (!prevState.circles[id]) createdIds.push({ id, type: 'CIRCLE', role: circ.role || 'primary' });
    }

    return {
      success: true,
      action: 'CONSTRUCT',
      stateChanged: true,
      created: createdIds,
      mutated: [],
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  // --------------------------------------------------------------------------
  // 3. MULTIPLE INTERSECTIONS (Preserves all roots with rootIndex)
  // --------------------------------------------------------------------------

  public intersect(entity1Id: string, entity2Id: string): CompactActionResponse {
    // 1. Resolve geometry representations
    const geom1 = this.resolveGeometryEntity(entity1Id);
    const geom2 = this.resolveGeometryEntity(entity2Id);

    if (!geom1 || !geom2) {
      return {
        success: false,
        action: 'INTERSECT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Entity '${!geom1 ? entity1Id : entity2Id}' not found for intersection.`,
        errorCode: 'ENTITY_NOT_FOUND',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // 2. Delegate directly to pure Core analytical intersection functions
    const pointsFound: Point2D[] = [];

    if (geom1.kind === 'LINE' && geom2.kind === 'LINE') {
      const pt = intersectLineLine(geom1.p1, geom1.p2, geom2.p1, geom2.p2);
      if (pt) pointsFound.push(pt);
    } else if (geom1.kind === 'LINE' && geom2.kind === 'SEGMENT') {
      const pt = intersectLineSegment(geom1.p1, geom1.p2, geom2.p1, geom2.p2);
      if (pt) pointsFound.push(pt);
    } else if (geom1.kind === 'SEGMENT' && geom2.kind === 'LINE') {
      const pt = intersectLineSegment(geom2.p1, geom2.p2, geom1.p1, geom1.p2);
      if (pt) pointsFound.push(pt);
    } else if (geom1.kind === 'SEGMENT' && geom2.kind === 'SEGMENT') {
      const pt = intersectLineSegment(geom1.p1, geom1.p2, geom2.p1, geom2.p2);
      if (pt) {
        const ptRev = intersectLineSegment(geom2.p1, geom2.p2, geom1.p1, geom1.p2);
        if (ptRev) pointsFound.push(pt);
      }
    } else if (geom1.kind === 'LINE' && geom2.kind === 'CIRCLE') {
      pointsFound.push(...intersectLineCircle(geom1.p1, geom1.p2, geom2.center, geom2.radius));
    } else if (geom1.kind === 'CIRCLE' && geom2.kind === 'LINE') {
      pointsFound.push(...intersectLineCircle(geom2.p1, geom2.p2, geom1.center, geom1.radius));
    } else if (geom1.kind === 'CIRCLE' && geom2.kind === 'CIRCLE') {
      pointsFound.push(...intersectCircleCircle(geom1.center, geom1.radius, geom2.center, geom2.radius));
    } else if (geom1.kind === 'SEGMENT' && geom2.kind === 'CIRCLE') {
      const linePts = intersectLineCircle(geom1.p1, geom1.p2, geom2.center, geom2.radius);
      // Filter strictly to segment parameter interval t in [0, 1]
      const dx = geom1.p2.x - geom1.p1.x;
      const dy = geom1.p2.y - geom1.p1.y;
      const lenSq = dx * dx + dy * dy;
      for (const lp of linePts) {
        const t = ((lp.x - geom1.p1.x) * dx + (lp.y - geom1.p1.y) * dy) / lenSq;
        if (t >= -GEOMETRY_EPSILON && t <= 1 + GEOMETRY_EPSILON) {
          pointsFound.push(lp);
        }
      }
    } else if (geom1.kind === 'CIRCLE' && geom2.kind === 'SEGMENT') {
      return this.intersect(entity2Id, entity1Id);
    }

    if (pointsFound.length === 0) {
      return {
        success: false,
        action: 'INTERSECT',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `No intersection found between '${entity1Id}' and '${entity2Id}'.`,
        errorCode: 'NO_INTERSECTION',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // 3. Register ALL found roots without silent pruning
    const created: { id: string; type: 'POINT'; role: 'auxiliary'; rootIndex: number }[] = [];
    pointsFound.forEach((pt, idx) => {
      this.intersectionCounter++;
      const id = `pt_int_${this.intersectionCounter}`;
      this.state = dispatchGeometryCommand(this.state, {
        type: 'ADD_POINT',
        point: {
          id,
          name: id,
          x: pt.x,
          y: pt.y,
          role: 'auxiliary',
          parentIds: [entity1Id, entity2Id],
        },
      });
      created.push({ id, type: 'POINT', role: 'auxiliary', rootIndex: idx });
    });

    return {
      success: true,
      action: 'INTERSECT',
      stateChanged: true,
      created,
      mutated: [],
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  // --------------------------------------------------------------------------
  // 4. KINEMATICS & TOPOLOGY MUTATIONS (move, erase)
  // --------------------------------------------------------------------------

  public move(pointId: string, x: number, y: number): CompactActionResponse {
    if (!this.isFiniteNumber(x) || !this.isFiniteNumber(y)) {
      return {
        success: false,
        action: 'MOVE',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Invalid move coordinates: x=${x}, y=${y}. Coordinates must be finite numbers.`,
        errorCode: 'INVALID_NUMERIC_INPUT',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    const pt = this.state.points[pointId];
    if (!pt) {
      return {
        success: false,
        action: 'MOVE',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Point '${pointId}' not found.`,
        errorCode: 'ENTITY_NOT_FOUND',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    // Dispatch directly to Core MOVE_POINT (cascades dependent updates)
    this.state = dispatchGeometryCommand(this.state, {
      type: 'MOVE_POINT',
      pointId,
      x,
      y,
    });

    return {
      success: true,
      action: 'MOVE',
      stateChanged: true,
      created: [],
      mutated: [pointId],
      deleted: [],
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  public erase(entityId: string): CompactActionResponse {
    let objectType: 'point' | 'segment' | 'line' | 'circle' | undefined;
    if (this.state.points[entityId]) objectType = 'point';
    else if (this.state.segments[entityId]) objectType = 'segment';
    else if (this.state.lines[entityId]) objectType = 'line';
    else if (this.state.circles[entityId]) objectType = 'circle';

    if (!objectType) {
      return {
        success: false,
        action: 'ERASE',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Entity '${entityId}' not found for deletion.`,
        errorCode: 'ENTITY_NOT_FOUND',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    if (entityId === 'O' || entityId === 'base_circle') {
      return {
        success: false,
        action: 'ERASE',
        stateChanged: false,
        created: [],
        mutated: [],
        deleted: [],
        error: `Base object '${entityId}' is immutable and cannot be deleted.`,
        errorCode: 'IMMUTABLE_BASE_OBJECT',
        deltaDigest: this.buildDeltaDigest(),
      };
    }

    const prevEntities = new Set([
      ...Object.keys(this.state.points),
      ...Object.keys(this.state.segments),
      ...Object.keys(this.state.lines),
      ...Object.keys(this.state.circles),
    ]);

    // Dispatch directly to Core ERASE_OBJECT (cascades macro groups and child lines)
    this.state = dispatchGeometryCommand(this.state, {
      type: 'ERASE_OBJECT',
      objectType,
      id: entityId,
    });

    const deleted: string[] = [];
    for (const id of prevEntities) {
      if (
        !this.state.points[id] &&
        !this.state.segments[id] &&
        !this.state.lines[id] &&
        !this.state.circles[id]
      ) {
        deleted.push(id);
      }
    }

    return {
      success: true,
      action: 'ERASE',
      stateChanged: deleted.length > 0,
      created: [],
      mutated: [],
      deleted,
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  // --------------------------------------------------------------------------
  // 5. OBSERVATIONS & INSPECTION (Targeted Observe)
  // --------------------------------------------------------------------------

  public observe(mode: ObservationMode, targetId?: string): ObservationResult {
    switch (mode) {
      case 'COMPACT': {
        return {
          mode: 'COMPACT',
          activeEntitiesCount: {
            points: Object.keys(this.state.points).length,
            segments: Object.keys(this.state.segments).length,
            lines: Object.keys(this.state.lines).length,
            circles: Object.keys(this.state.circles).length,
          },
          activeEntityIds: {
            points: Object.keys(this.state.points),
            segments: Object.keys(this.state.segments),
            lines: Object.keys(this.state.lines),
            circles: Object.keys(this.state.circles),
          },
        };
      }

      case 'FULL': {
        return {
          mode: 'FULL',
          points: this.state.points,
          segments: this.state.segments,
          lines: this.state.lines,
          circles: this.state.circles,
        };
      }

      case 'OBJECT': {
        if (!targetId) {
          return { mode: 'OBJECT', targetId: '', found: false };
        }
        if (this.state.points[targetId]) {
          const pt = this.state.points[targetId];
          return {
            mode: 'OBJECT',
            targetId,
            found: true,
            entityType: 'point',
            data: { x: pt.x, y: pt.y, onCircle: pt.onCircle, role: pt.role },
            provenance: pt.provenance,
          };
        }
        if (this.state.segments[targetId]) {
          const seg = this.state.segments[targetId];
          return {
            mode: 'OBJECT',
            targetId,
            found: true,
            entityType: 'segment',
            data: { p1Id: seg.p1Id, p2Id: seg.p2Id, length: seg.length, role: seg.role },
            provenance: seg.provenance,
          };
        }
        if (this.state.lines[targetId]) {
          const line = this.state.lines[targetId];
          return {
            mode: 'OBJECT',
            targetId,
            found: true,
            entityType: 'line',
            data: { p1Id: line.p1Id, p2Id: line.p2Id, role: line.role },
            provenance: line.provenance,
          };
        }
        if (this.state.circles[targetId]) {
          const c = this.state.circles[targetId];
          return {
            mode: 'OBJECT',
            targetId,
            found: true,
            entityType: 'circle',
            data: { centerId: c.centerId, radius: c.radius, role: c.role },
            provenance: c.provenance,
          };
        }
        return { mode: 'OBJECT', targetId, found: false };
      }

      case 'RELATIONS': {
        const relations = extractSemanticRelations(this.state);
        return {
          mode: 'RELATIONS',
          relationsCount: relations.length,
          relations,
        };
      }

      case 'CONSTRAINTS': {
        const snapshot = createGeometrySnapshot({
          pointsU: this.state.pointsU,
          R: this.state.R,
          scale: 1.0,
        });
        const invResults = checkGeometryInvariants(snapshot);
        return {
          mode: 'CONSTRAINTS',
          invariantsChecked: invResults.length,
          allPassed: invResults.every((r) => r.passed),
          invariants: invResults.map((r) => ({
            name: r.name,
            passed: r.passed,
            actual: r.actual,
            expected: r.expected,
          })),
        };
      }

      case 'KNOWLEDGE': {
        const config = buildConfigurationView(this.state);
        const claims = config.epistemicRegistry.map((e) => ({
          id: e.entityId,
          title: e.title,
          status: e.status,
          isProven: e.isProven,
        }));
        return {
          mode: 'KNOWLEDGE',
          claimsCount: claims.length,
          claims,
        };
      }

      case 'PROVENANCE': {
        const entries: ProvenanceObservation['entities'] = [];
        for (const [id, pt] of Object.entries(this.state.points)) {
          if (targetId && id !== targetId) continue;
          entries.push({
            id,
            originType: pt.provenance ? 'CONSTRUCTED_PRIMITIVE' : 'FREE_PRIMITIVE',
            role: pt.role || 'primary',
            macroType: pt.provenance?.macroType,
            sourceIds: pt.provenance?.sourceIds || pt.parentIds || [],
            groupId: pt.provenance?.groupId,
          });
        }
        for (const [id, seg] of Object.entries(this.state.segments)) {
          if (targetId && id !== targetId) continue;
          entries.push({
            id,
            originType: seg.provenance ? 'CONSTRUCTED_PRIMITIVE' : 'FREE_PRIMITIVE',
            role: seg.role || 'primary',
            macroType: seg.provenance?.macroType,
            sourceIds: seg.provenance?.sourceIds || [seg.p1Id, seg.p2Id],
            groupId: seg.provenance?.groupId,
          });
        }
        for (const [id, line] of Object.entries(this.state.lines)) {
          if (targetId && id !== targetId) continue;
          entries.push({
            id,
            originType: line.provenance ? 'CONSTRUCTED_PRIMITIVE' : 'FREE_PRIMITIVE',
            role: line.role || 'primary',
            macroType: line.provenance?.macroType,
            sourceIds: line.provenance?.sourceIds || [line.p1Id, line.p2Id],
            groupId: line.provenance?.groupId,
          });
        }
        return {
          mode: 'PROVENANCE',
          targetId,
          entities: entries,
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. MEASUREMENTS (Facade over Core Semantic Quantities)
  // --------------------------------------------------------------------------

  public measure(targetId: string, metricType?: string): MeasureResult {
    const supportedMetrics = ['SEGMENT_LENGTH', 'RADIUS'];
    if (metricType && !supportedMetrics.includes(metricType)) {
      return {
        success: false,
        errorCode: 'CAPABILITY_GAP',
        error: `Unsupported measurement type '${metricType}'. Supported: ${supportedMetrics.join(', ')}`,
        records: [],
      };
    }

    const pt = this.state.points[targetId];
    const seg = this.state.segments[targetId];
    const circ = this.state.circles[targetId];
    const line = this.state.lines[targetId];

    if (!pt && !seg && !circ && !line) {
      return {
        success: false,
        errorCode: 'ENTITY_NOT_FOUND',
        error: `Entity '${targetId}' not found for measurement.`,
        records: [],
      };
    }

    const records: GSAMeasurementRecord[] = [];

    // 1. Direct analytical query on state primitives for unrounded mathematical truth
    if (seg) {
      if (!metricType || metricType === 'SEGMENT_LENGTH') {
        records.push({
          entityId: targetId,
          semanticType: 'SEGMENT_LENGTH',
          value: seg.length,
          unit: 'MM',
        });
      }
    }

    if (circ) {
      if (!metricType || metricType === 'RADIUS') {
        records.push({
          entityId: targetId,
          semanticType: 'RADIUS',
          value: circ.radius,
          unit: 'MM',
        });
      }
    }

    if (records.length > 0) {
      return {
        success: true,
        records,
      };
    }

    // 2. Fall back to extracted semantic quantities (e.g. angles, ratios, derived arcs)
    const quantities = extractSemanticQuantities(this.state);
    const matched = quantities
      .filter((q) => {
        const targetMatch =
          q.context.entityId === targetId ||
          q.context.vertexId === targetId ||
          q.name.includes(targetId);
        if (!targetMatch) return false;
        if (metricType) return q.semanticType === metricType;
        return true;
      })
      .map((q) => ({
        entityId: targetId,
        semanticType: q.semanticType,
        value: q.value,
        unit: q.unit,
      }));

    if (matched.length > 0) {
      return {
        success: true,
        records: matched,
      };
    }

    return {
      success: false,
      errorCode: 'CAPABILITY_GAP',
      error: `No measurements available for entity '${targetId}' with type '${metricType || 'ANY'}'.`,
      records: [],
    };
  }

  // --------------------------------------------------------------------------
  // 7. VERIFICATION (Receiver-Owned Strict Epsilon Policy: 1e-4)
  // --------------------------------------------------------------------------

  public verify(
    subjectId: string,
    relationType: VerificationRelationType,
    referenceId?: string
  ): HeadlessVerificationResult {
    const EPS = HeadlessGeometrySession.VERIFICATION_EPSILON;

    const validRelations: VerificationRelationType[] = [
      'PERPENDICULAR_TO',
      'PARALLEL_TO',
      'EQUAL_LENGTH',
      'POINT_ON_CIRCLE',
    ];

    if (!validRelations.includes(relationType as any)) {
      return {
        verified: false,
        relation: relationType,
        subjectId,
        referenceId,
        explanation: `Unsupported predicate: '${relationType}'. Supported predicates: ${validRelations.join(', ')}`,
        errorCode: 'CAPABILITY_GAP',
        threshold: EPS,
      };
    }

    const getVector = (id: string): { dx: number; dy: number; len: number } | null => {
      const seg = this.state.segments[id];
      if (seg) {
        const p1 = this.state.points[seg.p1Id];
        const p2 = this.state.points[seg.p2Id];
        if (p1 && p2) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          return { dx, dy, len: Math.hypot(dx, dy) };
        }
      }
      const line = this.state.lines[id];
      if (line) {
        const p1 = this.state.points[line.p1Id];
        const p2 = this.state.points[line.p2Id];
        if (p1 && p2) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          return { dx, dy, len: Math.hypot(dx, dy) };
        }
      }
      return null;
    };

    switch (relationType) {
      case 'PERPENDICULAR_TO': {
        if (!referenceId) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId,
            explanation: 'PERPENDICULAR_TO requires reference line/segment.',
            threshold: EPS,
          };
        }
        const v1 = getVector(subjectId);
        const v2 = getVector(referenceId);
        if (!v1 || !v2 || v1.len < EPS || v2.len < EPS) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId,
            explanation: `One or both direction vectors cannot be resolved for '${subjectId}', '${referenceId}'.`,
            threshold: EPS,
          };
        }
        const dot = (v1.dx * v2.dx + v1.dy * v2.dy) / (v1.len * v2.len);
        const diff = Math.abs(dot);
        const verified = diff < EPS;
        return {
          verified,
          relation: relationType,
          subjectId,
          referenceId,
          explanation: verified
            ? `Normalized dot product |v1 . v2| = ${diff.toFixed(6)} < threshold (${EPS}). Lines are strictly perpendicular.`
            : `Normalized dot product |v1 . v2| = ${diff.toFixed(6)} exceeds threshold (${EPS}). Lines are NOT perpendicular.`,
          difference: diff,
          threshold: EPS,
        };
      }

      case 'PARALLEL_TO': {
        if (!referenceId) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId,
            explanation: 'PARALLEL_TO requires reference line/segment.',
            threshold: EPS,
          };
        }
        const v1 = getVector(subjectId);
        const v2 = getVector(referenceId);
        if (!v1 || !v2 || v1.len < EPS || v2.len < EPS) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId,
            explanation: `One or both direction vectors cannot be resolved for '${subjectId}', '${referenceId}'.`,
            threshold: EPS,
          };
        }
        const cross = (v1.dx * v2.dy - v1.dy * v2.dx) / (v1.len * v2.len);
        const diff = Math.abs(cross);
        const verified = diff < EPS;
        return {
          verified,
          relation: relationType,
          subjectId,
          referenceId,
          explanation: verified
            ? `Normalized cross product |v1 x v2| = ${diff.toFixed(6)} < threshold (${EPS}). Lines are strictly parallel.`
            : `Normalized cross product |v1 x v2| = ${diff.toFixed(6)} exceeds threshold (${EPS}). Lines are NOT parallel.`,
          difference: diff,
          threshold: EPS,
        };
      }

      case 'EQUAL_LENGTH': {
        if (!referenceId) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId,
            explanation: 'EQUAL_LENGTH requires reference segment.',
            threshold: EPS,
          };
        }
        const s1 = this.state.segments[subjectId];
        const s2 = this.state.segments[referenceId];
        if (!s1 || !s2) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId,
            explanation: `One or both segments '${subjectId}', '${referenceId}' not found.`,
            threshold: EPS,
          };
        }
        const diff = Math.abs(s1.length - s2.length);
        const verified = diff < EPS;
        return {
          verified,
          relation: relationType,
          subjectId,
          referenceId,
          explanation: verified
            ? `Lengths match: |${s1.length.toFixed(4)} - ${s2.length.toFixed(4)}| = ${diff.toFixed(6)} < threshold (${EPS}).`
            : `Length mismatch: |${s1.length.toFixed(4)} - ${s2.length.toFixed(4)}| = ${diff.toFixed(6)} exceeds threshold (${EPS}).`,
          difference: diff,
          threshold: EPS,
        };
      }

      case 'POINT_ON_CIRCLE': {
        const pt = this.state.points[subjectId];
        const circId = referenceId || 'base_circle';
        const circ = this.state.circles[circId];
        if (!pt || !circ) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId: circId,
            explanation: `Point '${subjectId}' or circle '${circId}' not found.`,
            threshold: EPS,
          };
        }
        const center = this.state.points[circ.centerId];
        if (!center) {
          return {
            verified: false,
            relation: relationType,
            subjectId,
            referenceId: circId,
            explanation: `Circle center '${circ.centerId}' not found.`,
            threshold: EPS,
          };
        }
        const dist = calculateEuclideanDistance(pt, center);
        const diff = Math.abs(dist - circ.radius);
        const verified = diff < EPS;
        return {
          verified,
          relation: relationType,
          subjectId,
          referenceId: circId,
          explanation: verified
            ? `Point-to-center distance ${dist.toFixed(4)} matches radius ${circ.radius.toFixed(4)} within ${EPS}.`
            : `Point-to-center distance ${dist.toFixed(4)} differs from radius ${circ.radius.toFixed(4)} by ${diff.toFixed(6)}.`,
          difference: diff,
          threshold: EPS,
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // 8. GSA EXPORT & IMPORT (Self-Describing Artifact & Zero Trust Verifier)
  // --------------------------------------------------------------------------

  public recordCertifiedClaim(
    claimId: string,
    predicate: VerificationRelationType,
    subjectId: string,
    referenceId?: string
  ): boolean {
    const check = this.verify(subjectId, predicate, referenceId);
    if (check.verified) {
      this.certifiedClaimsStore.push({
        claimId,
        predicate,
        subjectId,
        referenceId,
        expectedStatus: 'VERIFIED',
      });
      return true;
    }
    return false;
  }

  public exportSolutionArtifact(options?: {
    goalDescription?: string;
    agentReasoningTraceSummary?: string;
  }): GSASolutionArtifact {
    // 1. Build PGS-2D Passport
    let pgsPassport: PGS2DPassport;
    try {
      pgsPassport = projectStateToPgsPassport(this.state);
    } catch {
      // General/Blank state projector fallback
      pgsPassport = this.buildGeneralPgsPassport();
    }

    // 2. Build Provenance List
    const provenanceList: GSAProvenanceRecord[] = [];
    const obs = this.observe('PROVENANCE') as ProvenanceObservation;
    obs.entities.forEach((e) => {
      provenanceList.push({
        targetId: e.id,
        originType: e.originType,
        macroType: e.macroType,
        sourceIds: e.sourceIds,
        role: e.role,
        groupId: e.groupId,
      });
    });

    // 3. Build Measurements List
    const allQuantities = extractSemanticQuantities(this.state);
    const measurementsList: GSAMeasurementRecord[] = allQuantities.map((q) => ({
      entityId: q.context.entityId || q.context.vertexId || q.name,
      semanticType: q.semanticType,
      value: q.value,
      unit: q.unit,
    }));

    return {
      metadata: {
        artifactType: 'GEOMETRIC_SOLUTION_ARTIFACT',
        formatVersion: '0.1.0',
        artifactId: `gsa_${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      producer: {
        producerType: 'AI_GEOMETRY_SKILL',
        producerId: 'triangle-stand-skill',
        producerVersion: '0.3.0',
      },
      resolver: {
        resolverSkillId: 'triangle-stand-skill',
        compatibleContractVersion: '^0.3.0',
        canonicalSource: {
          repository: 'https://github.com/google-ai-studio/geometry-reasoning-stand',
          specificationDoc: 'docs/ENVIRONMENT_CONTRACT.md',
        },
        requiredCapabilities: [
          'IMPORT_GEOMETRY',
          'EVALUATE_PREDICATES',
          'CASCADE_RECOMPUTE',
          'MEASURE_METRICS',
        ],
      },
      pgsPayload: pgsPassport,
      provenance: provenanceList,
      certifiedClaims: [...this.certifiedClaimsStore],
      measurements: measurementsList,
      reasoningContext: options
        ? {
            goalDescription: options.goalDescription,
            agentReasoningTraceSummary: options.agentReasoningTraceSummary,
          }
        : undefined,
    };
  }

  public importSolutionArtifact(artifact: GSASolutionArtifact): GSAImportReport {
    // 1. Validate Artifact Metadata & Resolver Compatibility
    if (artifact.metadata.artifactType !== 'GEOMETRIC_SOLUTION_ARTIFACT') {
      return {
        success: false,
        status: 'REJECTED',
        message: 'Invalid artifact type. Expected GEOMETRIC_SOLUTION_ARTIFACT.',
        localVerificationChecks: [],
        error: 'INVALID_ARTIFACT_SCHEMA',
      };
    }

    // 2. Reconstruct State from PGS Payload
    let reconstructedState: FullGeometryState | undefined;
    try {
      const importResult = importPgsPassport(artifact.pgsPayload);
      if (importResult.success && importResult.geometryState) {
        reconstructedState = importResult.geometryState;
      }
    } catch {
      // Continue to general reconstructor fallback
    }

    if (!reconstructedState) {
      reconstructedState = this.reconstructGeneralPgsState(artifact.pgsPayload);
    }

    if (!reconstructedState) {
      return {
        success: false,
        status: 'REJECTED',
        message: 'Failed to reconstruct state from PGS payload.',
        localVerificationChecks: [],
        error: 'STATE_RECONSTRUCTION_FAILED',
      };
    }

    // Temporarily mount state to perform Zero Trust independent local verification
    const previousState = this.state;
    this.state = reconstructedState;

    // 3. ZERO TRUST: Perform independent local verification of certified claims
    const localChecks: GSAImportReport['localVerificationChecks'] = [];
    let allClaimsPassed = true;

    for (const claim of artifact.certifiedClaims) {
      const check = this.verify(claim.subjectId, claim.predicate, claim.referenceId);
      localChecks.push({
        claimId: claim.claimId,
        predicate: claim.predicate,
        subjectId: claim.subjectId,
        referenceId: claim.referenceId,
        passed: check.verified,
        difference: check.difference,
        threshold: check.threshold,
        explanation: check.explanation,
      });

      if (!check.verified) {
        allClaimsPassed = false;
      }
    }

    if (!allClaimsPassed) {
      // Revert state on claim verification mismatch
      this.state = previousState;
      return {
        success: false,
        status: 'MISMATCH',
        message: 'Zero Trust Verification Failed: Certified claims do not match local evaluation.',
        localVerificationChecks: localChecks,
      };
    }

    // State accepted into active session
    return {
      success: true,
      status: 'ACCEPTED',
      message: 'Artifact successfully imported and all certified claims independently verified.',
      localVerificationChecks: localChecks,
    };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  private resolveGeometryEntity(id: string):
    | { kind: 'LINE'; p1: Point2D; p2: Point2D }
    | { kind: 'SEGMENT'; p1: Point2D; p2: Point2D }
    | { kind: 'CIRCLE'; center: Point2D; radius: number }
    | null {
    if (this.state.lines[id]) {
      const line = this.state.lines[id];
      const p1 = this.state.points[line.p1Id];
      const p2 = this.state.points[line.p2Id];
      if (p1 && p2) return { kind: 'LINE', p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p2.y } };
    }
    if (this.state.segments[id]) {
      const seg = this.state.segments[id];
      const p1 = this.state.points[seg.p1Id];
      const p2 = this.state.points[seg.p2Id];
      if (p1 && p2) return { kind: 'SEGMENT', p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p2.y } };
    }
    if (this.state.circles[id]) {
      const c = this.state.circles[id];
      const center = this.state.points[c.centerId];
      if (center) return { kind: 'CIRCLE', center: { x: center.x, y: center.y }, radius: c.radius };
    }
    return null;
  }

  private buildGeneralPgsPassport(): PGS2DPassport {
    const objects: PGSObject[] = [];
    for (const [id, pt] of Object.entries(this.state.points)) {
      objects.push({
        type: 'Point2D',
        portableId: `pt_${id}`,
        localId: id,
        displayLabel: pt.name || id,
        role: pt.role === 'auxiliary' ? 'auxiliary_point' : 'vertex',
        x: pt.x,
        y: pt.y,
      });
    }
    for (const [id, seg] of Object.entries(this.state.segments)) {
      objects.push({
        type: 'Segment2D',
        portableId: `seg_${id}`,
        localId: id,
        displayLabel: id,
        role: seg.role === 'auxiliary' ? 'auxiliary_segment' : 'boundary_edge',
        p1Id: `pt_${seg.p1Id}`,
        p2Id: `pt_${seg.p2Id}`,
        length: seg.length,
      });
    }
    for (const [id, line] of Object.entries(this.state.lines)) {
      objects.push({
        type: 'Line2D',
        portableId: `line_${id}`,
        localId: id,
        displayLabel: id,
        role: line.role === 'auxiliary' ? 'auxiliary_line' : 'construction_line',
        p1Id: `pt_${line.p1Id}`,
        p2Id: `pt_${line.p2Id}`,
      });
    }
    for (const [id, c] of Object.entries(this.state.circles)) {
      objects.push({
        type: 'Circle2D',
        portableId: `circle_${id}`,
        localId: id,
        displayLabel: id,
        role: c.role === 'auxiliary' ? 'auxiliary_circle' : 'circumcircle',
        centerId: `pt_${c.centerId}`,
        radius: c.radius,
      });
    }

    return {
      meta: {
        format: 'PGS-2D',
        version: '0.1',
        generator: 'triangle-stand-headless-session',
        exportedAt: new Date().toISOString(),
        transferMode: 'EXACT_STATE',
      },
      sourceClaim: {
        verified: true,
        standId: 'triangle-stand-headless-session',
      },
      objects,
      topology: [],
      relations: [],
      measurements: [],
    };
  }

  private reconstructGeneralPgsState(pgs: PGS2DPassport): FullGeometryState | undefined {
    if (!pgs || !Array.isArray(pgs.objects)) return undefined;

    const state: FullGeometryState = {
      R: 100,
      pointsU: { A: 0, B: 0, C: 0 },
      points: {},
      segments: {},
      lines: {},
      circles: {},
      pointCounter: 0,
      segmentCounter: 0,
      lineCounter: 0,
      circleCounter: 0,
    };

    for (const obj of pgs.objects) {
      if (obj.type === 'Point2D') {
        const id = obj.localId || obj.portableId.replace(/^pt_/, '');
        state.points[id] = {
          id,
          name: obj.displayLabel || id,
          x: obj.x,
          y: obj.y,
          role: obj.role === 'auxiliary_point' ? 'auxiliary' : 'primary',
        };
      } else if (obj.type === 'Segment2D') {
        const id = obj.localId || obj.portableId.replace(/^seg_/, '');
        const p1Id = obj.p1Id.replace(/^pt_/, '');
        const p2Id = obj.p2Id.replace(/^pt_/, '');
        state.segments[id] = {
          id,
          p1Id,
          p2Id,
          length: obj.length ?? 0,
          role: obj.role === 'auxiliary_segment' ? 'auxiliary' : 'primary',
        };
      } else if (obj.type === 'Line2D') {
        const id = obj.localId || obj.portableId.replace(/^line_/, '');
        const p1Id = obj.p1Id.replace(/^pt_/, '');
        const p2Id = obj.p2Id.replace(/^pt_/, '');
        state.lines[id] = {
          id,
          p1Id,
          p2Id,
          role: obj.role === 'auxiliary_line' ? 'auxiliary' : 'primary',
        };
      } else if (obj.type === 'Circle2D') {
        const id = obj.localId || obj.portableId.replace(/^circle_/, '');
        const centerId = obj.centerId.replace(/^pt_/, '');
        state.circles[id] = {
          id,
          centerId,
          radius: obj.radius,
          role: obj.role === 'auxiliary_circle' ? 'auxiliary' : 'primary',
        };
      }
    }

    state.pointCounter = Object.keys(state.points).length;
    state.segmentCounter = Object.keys(state.segments).length;
    state.lineCounter = Object.keys(state.lines).length;
    state.circleCounter = Object.keys(state.circles).length;

    return state;
  }

  private buildPreconditionError(action: any, msg: string): CompactActionResponse {
    return {
      success: false,
      action,
      stateChanged: false,
      created: [],
      mutated: [],
      deleted: [],
      error: msg,
      errorCode: 'PRECONDITION_FAILED',
      deltaDigest: this.buildDeltaDigest(),
    };
  }

  // Raw state accessor for testing and verification
  public getRawState(): FullGeometryState {
    return this.state;
  }
}

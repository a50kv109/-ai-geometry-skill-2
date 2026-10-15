// src/headless/types.ts
// Semantic Types and Interfaces for AI Geometry Skill PoC (Phase 3)
// Strictly aligns with AI GEOMETRY SKILL CONTRACT v0.3
// "REASON OUTSIDE. VERIFY INSIDE."

import { FullGeometryState, GeometryProvenance, GeometryPoint, GeometrySegment, GeometryLine, GeometryCircle } from '../engines/constructionCore';
import { PGS2DPassport } from '../engines/pgs/types';
import { SemanticQuantity } from '../engines/configuration/semanticQuantity';
import { SemanticRelation } from '../engines/configuration/semanticRelation';

export type HeadlessProfile = 'triangle' | 'blank';

export interface HeadlessSessionOptions {
  profile?: HeadlessProfile;
  R?: number;
  pointsU?: { A: number; B: number; C: number };
}

export type HeadlessActionType =
  | 'CREATE_POINT'
  | 'CONNECT'
  | 'CREATE_CIRCLE'
  | 'CONSTRUCT'
  | 'INTERSECT'
  | 'MOVE'
  | 'ERASE'
  | 'RESET'
  | 'FORK'
  | 'ROLLBACK';

export interface CreatedEntitySummary {
  id: string;
  type: 'POINT' | 'SEGMENT' | 'LINE' | 'CIRCLE';
  role: 'primary' | 'auxiliary';
  rootIndex?: number;
}

export interface CompactActionResponse {
  success: boolean;
  action: HeadlessActionType;
  stateChanged: boolean;
  created: CreatedEntitySummary[];
  mutated: string[];
  deleted: string[];
  error?: string;
  errorCode?: HeadlessErrorCode;
  deltaDigest: {
    totalEntities: number;
    pointCount: number;
    segmentCount: number;
    lineCount: number;
    circleCount: number;
  };
}

export type HeadlessErrorCode =
  | 'INVALID_NUMERIC_INPUT'
  | 'DUPLICATE_ID'
  | 'CAPABILITY_GAP'
  | 'ENTITY_NOT_FOUND'
  | 'POINTS_COINCIDENT'
  | 'DEGENERATE_LINE'
  | 'DEGENERATE_ANGLE'
  | 'NO_INTERSECTION'
  | 'PRECONDITION_FAILED'
  | 'IMMUTABLE_BASE_OBJECT'
  | 'SANDBOX_NOT_FOUND'
  | 'UNKNOWN_ACTION'
  | 'UNKNOWN_PREDICATE'
  | 'UNKNOWN_MEASURE'
  | 'INVALID_ARTIFACT_SCHEMA'
  | 'INCOMPATIBLE_ARTIFACT_VERSION';

export type ObservationMode =
  | 'COMPACT'
  | 'FULL'
  | 'OBJECT'
  | 'RELATIONS'
  | 'CONSTRAINTS'
  | 'KNOWLEDGE'
  | 'PROVENANCE';

export interface CompactObservation {
  mode: 'COMPACT';
  activeEntitiesCount: {
    points: number;
    segments: number;
    lines: number;
    circles: number;
  };
  activeEntityIds: {
    points: string[];
    segments: string[];
    lines: string[];
    circles: string[];
  };
}

export interface FullObservation {
  mode: 'FULL';
  points: Record<string, GeometryPoint>;
  segments: Record<string, GeometrySegment>;
  lines: Record<string, GeometryLine>;
  circles: Record<string, GeometryCircle>;
}

export interface ObjectObservation {
  mode: 'OBJECT';
  targetId: string;
  found: boolean;
  entityType?: 'point' | 'segment' | 'line' | 'circle';
  data?: Record<string, unknown>;
  provenance?: GeometryProvenance;
}

export interface RelationsObservation {
  mode: 'RELATIONS';
  relationsCount: number;
  relations: readonly SemanticRelation[];
}

export interface ConstraintsObservation {
  mode: 'CONSTRAINTS';
  invariantsChecked: number;
  allPassed: boolean;
  invariants: {
    name: string;
    passed: boolean;
    actual: string;
    expected: string;
  }[];
}

export interface KnowledgeObservation {
  mode: 'KNOWLEDGE';
  claimsCount: number;
  claims: {
    id: string;
    title: string;
    status: string;
    isProven: boolean;
  }[];
}

export interface ProvenanceObservation {
  mode: 'PROVENANCE';
  targetId?: string;
  entities: {
    id: string;
    originType: 'FREE_PRIMITIVE' | 'CONSTRUCTED_PRIMITIVE' | 'INTERSECTION_RESULT';
    role: 'primary' | 'auxiliary';
    macroType?: string;
    sourceIds: string[];
    groupId?: string;
  }[];
}

export type ObservationResult =
  | CompactObservation
  | FullObservation
  | ObjectObservation
  | RelationsObservation
  | ConstraintsObservation
  | KnowledgeObservation
  | ProvenanceObservation;

export type VerificationRelationType =
  | 'PERPENDICULAR_TO'
  | 'PARALLEL_TO'
  | 'EQUAL_LENGTH'
  | 'POINT_ON_CIRCLE';

export interface HeadlessVerificationResult {
  verified: boolean;
  relation: VerificationRelationType;
  subjectId: string;
  referenceId?: string;
  explanation: string;
  difference?: number;
  threshold: number;
  errorCode?: HeadlessErrorCode;
}

export interface MeasureResult {
  success: boolean;
  errorCode?: HeadlessErrorCode;
  error?: string;
  records: GSAMeasurementRecord[];
}

export interface GSAProvenanceRecord {
  targetId: string;
  originType: 'FREE_PRIMITIVE' | 'CONSTRUCTED_PRIMITIVE' | 'INTERSECTION_RESULT';
  macroType?: string;
  sourceIds: string[];
  role: 'primary' | 'auxiliary';
  groupId?: string;
}

export interface GSACertifiedClaim {
  claimId: string;
  predicate: VerificationRelationType;
  subjectId: string;
  referenceId?: string;
  expectedStatus: 'VERIFIED';
}

export interface GSAMeasurementRecord {
  entityId: string;
  semanticType: string;
  value: number;
  unit: string;
}

export interface GSAReasoningContext {
  goalDescription?: string;
  agentReasoningTraceSummary?: string;
}

/**
 * Self-Describing Geometric Solution Artifact (GSA v0.1)
 * Encapsulates PGS-2D payload with provenance, certified claims, and resolver reference.
 */
export interface GSASolutionArtifact {
  metadata: {
    artifactType: 'GEOMETRIC_SOLUTION_ARTIFACT';
    formatVersion: '0.1.0';
    artifactId: string;
    createdAt?: string;
  };
  producer: {
    producerType: 'AI_GEOMETRY_SKILL';
    producerId: string;
    producerVersion: string;
  };
  resolver: {
    resolverSkillId: string;
    compatibleContractVersion: string;
    canonicalSource: {
      repository: string;
      specificationDoc: string;
    };
    requiredCapabilities: string[];
  };
  pgsPayload: PGS2DPassport;
  provenance: GSAProvenanceRecord[];
  certifiedClaims: GSACertifiedClaim[];
  measurements: GSAMeasurementRecord[];
  reasoningContext?: GSAReasoningContext;
}

export interface GSAImportReport {
  success: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'MISMATCH';
  message: string;
  localVerificationChecks: {
    claimId: string;
    predicate: VerificationRelationType;
    subjectId: string;
    referenceId?: string;
    passed: boolean;
    difference?: number;
    threshold: number;
    explanation: string;
  }[];
  error?: string;
}

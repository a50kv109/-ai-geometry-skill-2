# Changelog

All notable changes to **Geometry Reasoning Stand & AI Geometry Skill** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-skill] - 2026-10-04 — AI Geometry Skill v1.0.0 (FROZEN RESEARCH TOOL)

### Added
- **Headless AI Geometry Skill (`HeadlessGeometrySession`)**:
  - Pure headless interface for external AI reasoning agents without DOM/React dependencies.
  - Public action methods: `create_point`, `connect`, `create_circle`, `construct`, `intersect`, `move`, `erase`, `reset`, `fork`, `rollback`.
  - Structured observations: `COMPACT`, `FULL`, `OBJECT`, `PROVENANCE`, `KNOWLEDGE`.
  - High-precision metric measurements (`measure(id, 'SEGMENT_LENGTH')`).
  - Strict receiver-owned predicate verification (`verify()`) enforcing fixed threshold $\varepsilon = 10^{-4}$ for `PERPENDICULAR_TO`, `PARALLEL_TO`, `EQUAL_LENGTH`, `POINT_ON_CIRCLE`.
  - Non-destructive input validation ensuring 100% state inviolability on rejected commands.
- **Deterministic Reasoning Anchor (DRA) Agent Guidance**:
  - Formal guidance for external reasoning agents (`docs/AGENT_GUIDANCE_DRA.md`) operationalizing `REASON OUTSIDE. VERIFY INSIDE.`
  - 5-step loop: `RECOGNIZE ➔ DECIDE ➔ VERIFY ➔ SEPARATE ➔ UPDATE`.
  - Explicit three-tier epistemic boundary: `TOOL-VERIFIED FACT` $\neq$ `AGENT INTERPRETATION` $\neq$ `AGENT HYPOTHESIS`.
  - First-class support for conscious refusal (`DRA = NO`) and capability reporting (`CAPABILITY GAP / NOT REPRESENTABLE`).
- **Geometric Solution Artifact (GSA v0.1) & Zero-Trust Protocol**:
  - Self-describing JSON container encapsulating resolver metadata, PGS-2D geometry payload, lineage provenance, and certified claims.
  - Zero-Trust independent verification on consumer Stand: $\text{Producer Claim} \neq \text{Receiver Truth}$.
  - Automatic rollback on verification mismatch.
- **Unified Documentation Set**:
  - Canonical entry point (`docs/AI_GEOMETRY_SKILL.md`).
  - Semantic Contract v0.4 (`docs/SKILL_CONTRACT.md`).
  - Capability Model (`docs/CAPABILITY_MODEL.md`).
  - Epistemic & Lineage Model (`docs/PROVENANCE_EPISTEMIC_MODEL.md`).
  - GSA Specification (`docs/GSA_SPECIFICATION.md`).
  - Autonomous Research Methodology (`docs/GEOMETRY_RESEARCH_METHODOLOGY.md`).
  - Audited Pattern Library (`docs/PATTERN_LIBRARY.md`).
  - Unified Capability Gap Register (`docs/KNOWN_LIMITATIONS.md`).
- **Minimal Standalone Example**:
  - `examples/basic-verification/index.ts` demonstrating construction, measurement, verification, and GSA export.

### Audited & Verified
- Complete verification across 27 test suites (74 kernel, 18 environment, 11 headless blocks, 100% pass).
- TypeScript strict compilation with 0 errors.
- Final external black-box audit on 5 classical problem sets.

---

## [2.1.0] - 2026-09-25

### Added
- **Geometry Project Persistence (`GeometryProjectV1`)**:
  - Deterministic serialization/deserialization with versioned JSON format (`geometry-reasoning-stand-project`).
  - Strict validation layer with transaction safety (`INVALID PROJECT → NO STATE MUTATION`).
  - Dynamic Construction DAG restoration and complete dependency recomputation.
  - Browser UI menu for Save Project, Open Project, and New Project.
  - Semantic commands `SAVE_PROJECT` and `LOAD_PROJECT` for AI reasoning agents.
  - Expanded 30-test verification matrix (`npm run test:project`).
- **AAM Language Gateway v0.1**:
  - Natural language semantic intent extraction across Russian, Ukrainian, and English.
  - Dedicated interactive AAM workbench terminal with live two-layer trace (Language Kernel Intent $\to$ Stand Execution).
  - Extended deterministic relation verifier `VERIFY_RELATION` (parallel, perpendicular, diameter, Thales, point-on-circle).
  - Benchmark test suites: positive (20), negative (20), multilingual equivalence (10).
- **Multilingual Support (RU / UK / EN)**:
  - React Context localization (`src/i18n/`) with persistent language selection in localStorage.
  - UI language switcher placed in the top navigation header.

## [2.0.0] - 2026-09-24

### Initial Public V2 Release
*Version 2 represents an independent generation of the Stand featuring a frozen analytical kernel, strict epistemic separation, and a universal semantic interface. Version 1 was an earlier exploratory generation and is maintained separately.*

### Architecture & Paradigm
- **Frozen Baseline Mathematical Core:** Formally locked analytical geometry engine (`src/kernel/`, `src/engines/constructionCore.ts`) ensuring deterministic, repeatable calculations.
- **Epistemic Read-Only Presentation Layer:** Total separation between mathematical state (`GeometryState`) and the React UI. Components consume read-only passports and cannot compute or alter mathematical truth independently.
- **The Vanishing Property (Свойство Исчезновения):** Continuous dynamic evaluation of relations. When preconditions are broken by point movement, semantic relations instantly evaporate.
- **Universal Semantic Tool Interface:** Uniform machine-readable API (`src/engines/semantic/`) with exactly 20 commands for humans, automated scripts, and AI agents.

### Features & Capabilities
- **School Mode Canvas:** Dynamic 2D canvas with mouse dragging, snapping, and live dependency propagation.
- **School Constructions:** Points, segments, lines, circles, perpendicular bisectors, angle bisectors, orthogonal circle tangents, parallel lines, and heights.
- **Packet 1 (Triangle-Circle & Thales):** Inscribed triangles, chords, diameters, central-inscribed angle ratio ($2\alpha = \theta$), and Thales' right angle invariance.
- **Packet 2 (Fundamentals & Perpendiculars):** Analytical precondition checking for perpendicular bisectors, angle bisectors, and boundary/external circle tangents.
- **Configuration Passport (S-01, S-02, S-03):** Read-only projection extracting relations, construction steps, and LaTeX quantities without side effects.
- **Deterministic Natural Language Adapter:** Parsing common Russian and English geometric phrases into structured semantic commands.

### Test Baseline
- Complete suite of 21 test scripts in `package.json` (20 suites executed in `npm run test:all`) with 100% pass rate.

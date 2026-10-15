# Contributing to AI Geometry Skill

Thank you for your interest in contributing to **AI Geometry Skill**.

The AI Geometry Skill is a deterministic, headless geometry verification and research instrument for external AI reasoning agents. To preserve mathematical rigor and epistemic purity, all contributions must strictly adhere to the rules below.

---

## 1. Core Architectural Protections (Non-Negotiable)

1. **The Frozen Baseline Rule:** The core mathematical kernel (`src/kernel/`, `src/engines/constructionCore.ts`) is frozen.
   - Never modify the mathematical kernel or analytical formulas to "help" a specific unit test pass.
   - If an edge case fails, the issue must be resolved by fixing construction parameters or refining preconditions in canonical rules, never by adding ad-hoc calculation hacks.
2. **Authoritative State Purity (No Parallel State):**
   - `FullGeometryState` within `HeadlessGeometrySession` is the sole source of geometric truth.
   - Never create parallel coordinate stores, shadow caches, or secondary state machines.
3. **Receiver-Owned Verification:**
   - Predicates evaluate using fixed tolerance $\varepsilon = 10^{-4}$ owned by the Stand. External agents cannot loosen or negotiate this bound.
4. **Epistemic Isolation:**
   - Exploratory hypotheses and agent actions execute in isolated sandbox contexts via `fork()` and `rollback()`.
   - Failed or rejected operations must leave `FullGeometryState` completely unaltered (`stateChanged: false`).
5. **No AI/LLM Logic in Core:**
   - Do not introduce probabilistic models, heuristic approximations, or LLM-based solvers into the core mathematical kernel. *Reason outside. Verify inside.*

---

## 2. Development Workflow

### Prerequisites
- Node.js v18.x or higher
- npm v9.x or higher

### Local Setup
```bash
git clone https://github.com/a50kv109/ai-geometry-skill.git
cd ai-geometry-skill
npm install
```

### Running Autonomous Skill Tests
```bash
npm run test:headless
```

---

## 3. Mandatory Verification Baseline

Before opening a pull request, you MUST run and pass all test suites, type checking, and production builds:

```bash
# 1. Type check (strict TypeScript)
npm run lint

# 2. Kernel derivation suite (74 tests)
npm run test:kernel

# 3. Agent environment contract suite (18 tests)
npm run test:env

# 4. Headless Skill test suite (11 scenario blocks)
npm run test:headless

# 5. Full test suite (27 suites)
npm run test:all

# 6. Production build
npm run build
```

---

## 4. Documentation & Hygiene

- All documentation in `docs/` must use relative Markdown links without URL redirects.
- Never hardcode secrets, API keys, or personal credentials.
- Maintain strict typing throughout TypeScript files (`noImplicitAny`, proper return types).
- Clearly separate `TOOL-VERIFIED FACT`, `AGENT INTERPRETATION`, and `AGENT HYPOTHESIS`.

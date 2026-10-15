# Agent Guidance: Deterministic Reasoning Anchor (DRA)

> **Status**: `RECOMMENDED AGENT REASONING PATTERN / OBSERVED BEHAVIOR`  
> **Target Audience**: External AI Reasoning Agents interacting with the Geometry Reasoning Stand.  
> **Core Principle**: `REASON OUTSIDE. VERIFY INSIDE.`

---

## 1. Purpose & Scope

The **Deterministic Reasoning Anchor (DRA)** is an agent-facing reasoning guidance pattern. It is **not** an executable runtime API method, **not** an automated router, and **not** a solver inside the Geometry Core.

Conventional Tool Calling asks:
> *«Which tool function should I invoke?»*

The DRA pattern answers:
> *«Does the current reasoning task contain a formalizable fragment that should be made externally verifiable, and how do I ground my reasoning upon the returned mathematical fact without conflating fact and interpretation?»*

---

## 2. The 5-Step Operational Reasoning Loop

When encountering a task, the agent should consider the following recommended sequence:

```
                  1. RECOGNIZE
     Does the problem contain a formalizable geometric structure?
                         │
                         ▼
                    2. DECIDE
   Would deterministic verification materially improve confidence?
             │                             │
        YES  │                             │  NO
             ▼                             ▼
   [Project into Stand]           [Conscious Refusal]
   3. VERIFY                      Proceed with natural
   Execute Headless actions       language reasoning.
   and verify predicates.         Do NOT force tool calling.
             │
             ▼
        4. SEPARATE
   Strictly isolate TOOL-VERIFIED FACT from AGENT INTERPRETATION.
             │
             ▼
         5. UPDATE
   Update hypotheses and next steps based on the verified fact.
```

---

## 3. Strict Epistemic Separation Boundary

A core failure mode of reasoning agents is conflating tool output with agent narrative. When grounding reasoning on the Geometry Stand, the agent must enforce the following three-tier distinction:

| Epistemic Tier | Responsible Entity | Definition & Example |
|:---|:---:|:---|
| **TOOL-VERIFIED FACT** | **Geometry Stand (Kernel)** | The exact mathematical fact verified with strict numerical tolerance ($\varepsilon = 10^{-4}$).<br>*Example*: `PERPENDICULAR_TO: true (difference: 0.0)`. |
| **AGENT INTERPRETATION** | **External AI Agent** | The semantic meaning of that fact within the broader reasoning context.<br>*Example*: *«Therefore, triangle ABC has a 90° angle at vertex A and is right-angled.»* |
| **AGENT HYPOTHESIS** | **External AI Agent** | A conjecture or extrapolation yet to be proven.<br>*Example*: *«Therefore, the circumcenter must coincide with the midpoint of BC.»* |

The Stand is responsible **only** for what it deterministically evaluated. The agent retains full responsibility for the meaning and derivation built upon that anchor.

---

## 4. Conscious Refusal (Applicability Decision)

The decision `DRA = NO` is a first-class, valid outcome.

- **Use DRA (`DRA = YES`) when**:
  - The problem contains metric relations, coordinates, collinearity, perpendicularity, parallelism, or circular tangency.
  - An external deterministic proof or counterexample materially strengthens the proof chain.
- **Do NOT use DRA (`DRA = NO`) when**:
  - The task is purely creative, pedagogical, linguistic, or metaphorical (e.g., *«Invent a mnemonic for Thales' theorem»*).
  - The problem is trivial, self-evident in context, or does not involve formalizable geometric relations.
  - The agent would merely be engaging in unmotivated "tool spam".

---

## 5. Capability Gap Discipline

If a problem contains formal geometric structure, but the current Geometry Stand contract cannot represent or verify it:

```
[Required Structure Unsupported] ──► Report: CAPABILITY GAP / NOT REPRESENTABLE
```

The agent **MUST NOT**:
1. Hallucinate non-existent predicates (e.g., calling an imaginary `verifyAngle(108)`).
2. Manually compute the result and falsely label it as `TOOL-VERIFIED FACT`.
3. Force approximation of complex figures using unsupported primitives.

Reporting `CAPABILITY GAP / NOT REPRESENTABLE` is an accurate, highly valued scientific result.

---

## 6. GSA & Zero Trust Grounding

When sharing geometric proofs between agents:
- Producer Agent exports verified facts via the **Geometric Solution Artifact (GSA v0.1)**.
- Consumer Agent treats incoming claims as untrusted hypotheses:
  $$\text{Producer Claim} \neq \text{Receiver Truth}$$
- Consumer Agent executes local verification on its own Stand before accepting the anchor.

---

## 7. Architectural Placement

```
GEOMETRY KERNEL / CORE (SSOT)
  ├── Pure analytical geometry (Euclidean, IEEE 754)
  └── Zero knowledge of DRA, prompts, or agents.
            │
            ▼
HEADLESS GEOMETRY SKILL (Session Facade)
  ├── Exposes deterministic actions, observations, verifications
  └── Enforces state inviolability and receiver tolerance.
            │
            ▼
AGENT GUIDANCE (docs/AGENT_GUIDANCE_DRA.md)  <── [DRA LIVES HERE]
  ├── Non-executable advisory guidelines for reasoning models
  └── Explains WHEN, WHY, and HOW to ground reasoning on the Skill.
```

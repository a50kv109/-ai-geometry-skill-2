# Geometric Solution Artifact (GSA v0.1) & PGS-2D Specification

> **Format Version**: `0.1.0`  
> **Payload Specification**: `PGS-2D v1.0`  
> **Model**: Zero-Trust Independent Verification  
> **Rule**: $\text{Producer Claim} \neq \text{Receiver Truth}$

---

## 1. The GSA Envelope Structure

The Geometric Solution Artifact is a self-describing JSON container designed for inter-agent and inter-stand solution exchange:

```json
{
  "metadata": {
    "artifactType": "GEOMETRIC_SOLUTION_ARTIFACT",
    "formatVersion": "0.1.0",
    "artifactId": "gsa_1791100665158",
    "createdAt": "2026-10-04T07:57:45.158Z"
  },
  "producer": {
    "producerType": "AI_GEOMETRY_SKILL",
    "producerId": "triangle-stand-skill",
    "producerVersion": "0.3.0"
  },
  "resolver": {
    "resolverSkillId": "triangle-stand-skill",
    "compatibleContractVersion": "^0.3.0",
    "canonicalSource": {
      "repository": "https://github.com/google-ai-studio/geometry-reasoning-stand",
      "specificationDoc": "docs/ENVIRONMENT_CONTRACT.md"
    },
    "requiredCapabilities": [
      "IMPORT_GEOMETRY",
      "EVALUATE_PREDICATES",
      "CASCADE_RECOMPUTE",
      "MEASURE_METRICS"
    ]
  },
  "pgsPayload": { /* PGS-2D Passport */ },
  "provenance": [ /* Entity lineage records */ ],
  "certifiedClaims": [ /* Verified predicate assertions */ ],
  "measurements": [ /* Semantic metric quantities */ ],
  "reasoningContext": {
    "goalDescription": "Problem statement",
    "agentReasoningTraceSummary": "High-level proof trace"
  }
}
```

---

## 2. Zero-Trust Verification Lifecycle

```
  AGENT A (Producer)                     AGENT B (Consumer)
  ──────────────────                     ──────────────────
  Constructs geometry                    Receives GSA Envelope
  Evaluates predicates                   Unpacks PGS-2D Payload
  Attaches certifiedClaims               Mounts into clean, blank Stand
  Exports GSA Artifact                   Runs independent local verification
                                         If all pass: ACCEPTED
                                         If any fail: MISMATCH (State Rollback)
```

1. **State Isolation**: The consumer mounts the geometry in a clean session.
2. **Untrusted Hypotheses**: All `certifiedClaims` in the envelope are treated as untrusted claims.
3. **Local Evaluation**: The consumer's Stand runs its own local `verify()` with its own receiver-owned tolerance $\varepsilon = 10^{-4}$.
4. **Mismatch Rejection**: If any check fails, the session immediately reverts to its pre-import state with status `'MISMATCH'`.

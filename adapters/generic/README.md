# Generic Agent Tool Adapter — AI Geometry Skill

This directory contains integration documentation and standard function schemas for external AI agents (OpenAI Tool Calling, Anthropic Tools, Gemini Function Calling, LangChain, ReAct provers) to interact with **AI Geometry Skill**.

---

## 1. Adapter Architecture

External agent models reason about proofs on the outside and call tool functions that map directly to `HeadlessGeometrySession`:

```
   ┌────────────────────────────────────────────────────────┐
   │                   External AI Agent                    │
   │   (Hypothesis Generation, Proof Strategy, DRA Guidance)│
   └───────────────────────────┬────────────────────────────┘
                               │ JSON Tool Call
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  Generic Tool Adapter                  │
   │  (Maps tool parameters to HeadlessGeometrySession SSOT)│
   └───────────────────────────┬────────────────────────────┘
                               │ Executes
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            AI Geometry Skill Core Kernel               │
   │   (Deterministic Analytical Geometry, eps = 1e-4)      │
   └────────────────────────────────────────────────────────┘
```

---

## 2. Standard Tool Schemas (JSON Schema)

### `create_point`
```json
{
  "name": "create_point",
  "description": "Creates a 2D Euclidean point at coordinates (x, y).",
  "parameters": {
    "type": "object",
    "required": ["x", "y"],
    "properties": {
      "x": { "type": "number", "description": "X coordinate" },
      "y": { "type": "number", "description": "Y coordinate" },
      "id": { "type": "string", "description": "Optional unique point identifier (e.g. 'P_A')" }
    }
  }
}
```

### `connect`
```json
{
  "name": "connect",
  "description": "Connects two points into a finite SEGMENT or infinite LINE.",
  "parameters": {
    "type": "object",
    "required": ["p1Id", "p2Id", "type"],
    "properties": {
      "p1Id": { "type": "string", "description": "First point ID" },
      "p2Id": { "type": "string", "description": "Second point ID" },
      "type": { "type": "string", "enum": ["SEGMENT", "LINE"] }
    }
  }
}
```

### `measure`
```json
{
  "name": "measure",
  "description": "Measures metric properties (e.g. SEGMENT_LENGTH, RADIUS).",
  "parameters": {
    "type": "object",
    "required": ["targetId", "metricType"],
    "properties": {
      "targetId": { "type": "string", "description": "Target entity ID" },
      "metricType": { "type": "string", "enum": ["SEGMENT_LENGTH", "RADIUS"] }
    }
  }
}
```

### `verify`
```json
{
  "name": "verify",
  "description": "Deterministically verifies a geometric predicate with strict receiver tolerance (1e-4).",
  "parameters": {
    "type": "object",
    "required": ["subjectId", "relationType"],
    "properties": {
      "subjectId": { "type": "string", "description": "Subject entity ID" },
      "relationType": {
        "type": "string",
        "enum": ["PERPENDICULAR_TO", "PARALLEL_TO", "EQUAL_LENGTH", "POINT_ON_CIRCLE"]
      },
      "referenceId": { "type": "string", "description": "Reference entity ID" }
    }
  }
}
```

---

## 3. Protocol Rules for External Agents

1. **No Approximations**: Never guess floating-point answers. Delegate geometric assertions to `verify` or `measure`.
2. **Handle Rejections**: When an error or `CAPABILITY_GAP` is returned, treat it as a formal boundary. Do not retry with corrupted inputs.
3. **Epistemic Separation**: Keep tool results strictly labeled as `TOOL-VERIFIED FACT` in the conversation context.

# Security Policy — AI Geometry Skill

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The **AI Geometry Skill** is a headless geometric verification and research instrument running on Node.js and modern web engines.

If you discover a security vulnerability:

1. **Do NOT open a public GitHub issue.**
2. Send an email directly to the maintainer: **`A50kv109@gmail.com`** with the subject line `[SECURITY] AI Geometry Skill`.
3. Alternatively, use the private **Report a vulnerability** feature under the **Security** tab of the GitHub repository.
4. Provide a detailed summary, clear reproduction steps, and relevant environment information.

The maintainer will acknowledge receipt within 48 hours and coordinate a fix prior to any public disclosure.

---

## Security Invariants

1. **Zero Secret Leakage:** The Skill codebase contains zero hardcoded API keys, passwords, or personal credentials. The `.env.example` file serves purely as an environment variable template.
2. **Deterministic Client-Side / Headless Execution:** User constructions and agent commands are executed strictly through deterministic analytical TypeScript functions. The Skill never uses `eval()`, dynamic `Function` generation, or unvalidated external script injection.
3. **Workspace Isolation:** Exploratory hypotheses and agent actions execute in isolated sandbox contexts via `fork()` and `rollback()`, guaranteeing that unverified operations cannot corrupt the authoritative geometry state.

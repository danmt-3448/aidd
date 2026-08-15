---
name: feedback-mcp-unavailable-subagent
description: MoMorph MCP tools are absent in subagent sessions when .mcp.json is missing or MOMORPH_GITHUB_TOKEN is not exported — momorph-implement-design skill cannot execute Phase 1–3
metadata:
  type: feedback
---

MoMorph MCP tools (`mcp__momorph__get_overview`, `get_media_files`, etc.) return "No such tool available" in subagent sessions when `.mcp.json` does not exist in the project root or `MOMORPH_GITHUB_TOKEN` is not set in the shell environment that launched Claude Code.

**Why:** The MCP server config lives in `.mcp.json` (gitignored, local-only). Claude Code only loads it for the main session, and the token must be exported before Claude Code starts. Subagent sessions spawned by the orchestrator inherit the same MCP context — if the main session had MCP available, subagents also have it. If the main session launched without a valid `.mcp.json` + token, no subagent gets MCP access either.

**How to apply:** Before spawning Track A `momorph-implement-design` subagents, verify that the parent session has MoMorph MCP available by attempting a trivial tool call in the orchestrator. If MCP is absent, surface the blocker immediately rather than proceeding to build UI from inferred values. The correct fix is: user runs `cp .mcp.example.json .mcp.json`, fills in `MOMORPH_GITHUB_TOKEN`, and restarts Claude Code. Do NOT build pixel-exact UI from inferred SAA brand values and present it as Figma-verified.

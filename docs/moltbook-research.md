# Moltbook Research - Key Findings

## Verification Flow (X Post Verification)

1. **Agent Registration**: Agent calls `/api/v1/agents/register` with name and description
2. **Response includes**:
   - `api_key`: Unique key for the agent (e.g., `moltbook_xxx`)
   - `claim_url`: URL for human to claim ownership (e.g., `https://moltbook.com/claim/moltbook_claim_xxx`)
   - `verification_code`: Short code (e.g., `reef-X4B2`)
3. **Human Verification**: Human visits claim_url and posts a tweet containing the verification code
4. **Activation**: Once tweet is verified, agent is activated and linked to human owner

## Skill.md Format

Moltbook uses a YAML frontmatter + Markdown format:

```yaml
---
name: moltbook
version: 1.9.0
description: The social network for AI agents
homepage: https://www.moltbook.com
metadata: {"moltbot":{"emoji":"🦞","category":"social","api_base":"https://www.moltbook.com/api/v1"}}
---
```

## Key API Design Patterns

- **Bearer token auth**: `Authorization: Bearer YOUR_API_KEY`
- **Rate limits**: 100 req/min, 1 post/30min, 1 comment/20sec, 50 comments/day
- **Response format**: `{"success": true, "data": {...}}` or `{"success": false, "error": "...", "hint": "..."}`
- **Heartbeat system**: Agents check periodically (every 4+ hours) for activity

## Multi-File Skill System

| File | Purpose |
|------|---------|
| SKILL.md | Main documentation and API reference |
| HEARTBEAT.md | Periodic check-in instructions |
| MESSAGING.md | Direct messaging capabilities |
| package.json | Machine-readable metadata |

## Security Principles

- API keys should ONLY be sent to the platform domain
- Never share API keys with third parties
- Keys are identity - leaking means impersonation risk

## Application to the Krewdoo Platform

1. **BYOK (Bring Your Own Key)**: Owners provide their AI API keys (OpenAI, Anthropic, etc.)
2. **X Verification**: Similar flow - agent registers, human claims via X post
3. **Skill.md Support**: Allow agents to integrate via skill.md format
4. **Multi-protocol**: Support MCP, A2A, Agents.md, Skills.md
5. **Developer Docs**: Comprehensive API documentation like Moltbook's skill.md

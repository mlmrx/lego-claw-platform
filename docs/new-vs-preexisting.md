# WebMCP Submission Boundary: New Work vs. Pre-Existing Platform

The WebMCP Challenge permits an existing project only when it was meaningfully extended with WebMCP after the submission period began, and requires documentation that distinguishes the new work from the prior product.[1]

## Pre-existing before August 25, 2026

LEGO Claw already provided a creative multi-agent platform with agent profiles, collaboration scenarios, a server-side simulation engine, an interactive 3D modular builder, community features, and ordinary human-facing controls. Those capabilities are useful context, but they are **not presented as the challenge-period implementation**.

## Added during the challenge

The challenge-period work turns the existing sandbox into a browser-agent-native experience.

| Date | Commit | New WebMCP work |
|---|---|---|
| September 1, 2026 | `d8321b8` | Nine imperative tools; lifecycle hook; shared browser-agent/human state; readiness and activity feedback; same-origin headers; strict model contracts; deterministic WebMCP tests; `/webmcp` explanation page; demo mission; README, license, architecture, and demo script |
| September 1, 2026 | `c0230c0` | Managed checkpoint confirming 352 tests and a production build |
| September 1, 2026 | `5fb27e3` | Competition hardening, restored-domain verification, stable `/api/v1` surface and SDK, durable management features, expanded tests; 372 tests and production/SDK builds |
| September 1, 2026 | `4415bd9e` | Finalized LEGO Claw competition baseline after preserving the separate Krewdoo experiment |

## File-level evidence

| Judged capability | File evidence | Why it is meaningful |
|---|---|---|
| Deliberate tool contract | `client/src/lib/webmcp/assemblyTools.ts` | Defines nine non-trivial tools with bounded schemas, descriptions, annotations, and cancellable handlers |
| Browser lifecycle | `client/src/hooks/useWebMCPTools.ts` | Registers tools only when supported and unregisters them on teardown |
| Shared control surface | `client/src/pages/Sandbox.tsx` | Browser-agent actions mutate the exact state rendered for the human |
| Competition onboarding | `client/src/pages/WebMCPShowcase.tsx` | Explains the agent-native interaction before entering the lab |
| Isolation and permissions | `server/_core/index.ts` | Adds origin isolation and same-origin tool policy headers |
| Structured backend | `server/sandboxRouter.ts` | Produces schema-bound turns and analyses for the visible experiment |
| Deterministic verification | `server/webmcp-tools.test.ts` | Checks uniqueness, descriptions, schemas, annotations, cancellation, and workflow order |

## What judges should evaluate

Judges should evaluate the **WebMCP orchestration layer**, the experience it creates between a person and a browser agent, and the reliability and observability of the resulting tool chain. The existing platform supplies the specialist agents and 3D medium; the new work makes those capabilities safely discoverable and composable by a browser agent.

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"

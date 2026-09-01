# Krewdoo Assembly Lab — Devpost Submission Draft

## Tagline

**One browser agent assembles a whole creative crew.**

## Short description

Krewdoo Assembly Lab is a human-guided multi-agent assembly protocol exposed through WebMCP. A browser agent discovers specialist teammates, configures a constrained mission, advances their collaboration turn by turn, observes the evolving 3D artifact, and explains the collaboration pattern behind the result.

## Inspiration

Most browser agents operate alone. They can search a page or fill a form, but they rarely coordinate other intelligent actors or help a person understand how a team reached an outcome. We wanted to explore a more ambitious interaction model: **the browser agent as an orchestrator of a visible specialist crew**.

Krewdoo Assembly Lab started from an existing creative multi-agent sandbox. During the WebMCP Challenge submission period, we added a new WebMCP-native orchestration layer that turns a complicated sequence of UI decisions into a typed, observable collaboration loop. The submitted work is the WebMCP extension and its judge-facing experience, not the pre-existing platform.

## What it does

A person can ask their browser agent:

> “Choose the bridge challenge, pair an architect with a diplomat, run four observable turns, then explain whether they collaborated well.”

The agent first discovers the scenarios and specialist presets that the page actually supports. It then configures the visible mission, selects a bounded crew, and either advances the experiment one turn at a time or runs the configured mission. Each specialist's message, decision type, collaboration metrics, and changes to the shared 3D artifact appear in the same interface the person sees. Finally, the browser agent can inspect the run and request a structured collaboration analysis.

| Stage | WebMCP tools | Visible outcome |
|---|---|---|
| Discover | `list_scenarios`, `list_agent_presets` | The agent learns available challenges and specialists |
| Configure | `configure_mission`, `preview_mission` | Scenario, crew, mode, and turn budget update on screen |
| Execute | `run_next_turn`, `run_simulation` | The timeline, metrics, and 3D artifact evolve |
| Understand | `inspect_collaboration`, `analyze_collaboration` | The collaboration pattern and recommendations become inspectable |
| Reset | `reset_mission` | The local experiment returns to a clean state |

## Why WebMCP matters

The WebMCP imperative API lets a page register JavaScript tools that browser agents can discover and execute.[1] That makes Krewdoo Assembly Lab more reliable than screen-coordinate automation: the agent works with explicit scenario IDs, agent IDs, bounded turn counts, and structured results rather than guessing which visual control to click.

WebMCP is not a decorative integration here. The complete experience depends on a multi-tool chain: discover, configure, execute, inspect, and analyze. The person remains in control because all state-changing tools update the same visible page, step-by-step mode exposes every action, and nothing runs when the prepared demo mission is merely loaded.

## How we built it

The frontend is React and TypeScript. It registers nine imperative WebMCP tools through a lifecycle-aware hook that automatically unregisters the tools when the page is left. The tool definitions are separated from the React view, which makes their names, descriptions, JSON Schemas, annotations, and execution chain directly testable.

The tools operate the same state used by the human interface and call a typed tRPC backend. The backend runs specialist turns using Gemini 3 Flash with strict JSON-schema output, then renders the resulting structured assembly actions with React Three Fiber and Three.js. A separate structured analysis step evaluates role effectiveness, emergent behavior, and recommendations.

| Layer | Technology |
|---|---|
| Browser-agent interface | WebMCP imperative API and `webmcp-types` |
| Human interface | React 19, TypeScript, Tailwind CSS, Framer Motion |
| Typed application API | tRPC and Zod |
| Multi-agent simulation | Server-side model calls with strict JSON Schemas |
| 3D evidence | Three.js, React Three Fiber, Drei |
| Verification | Vitest, TypeScript, live end-to-end browser testing |

## Safety and trust

The tool contract follows WebMCP's security guidance: tool inputs use restrictive schemas; read-only behavior is annotated; tools returning model-generated text use `untrustedContentHint`; and cross-origin exposure is not enabled.[2] The deployment explicitly enables an origin-keyed agent cluster and restricts the `tools` permission to the same origin. Long-running tool handlers receive the browser-provided cancellation signal.

The mission itself is bounded to two-to-four agents and four-to-twelve turns. The one-click judge setup only prepares a four-turn mission; it does not execute anything. Every state change is reflected in the visible interface.

## Challenges we ran into

The hardest problem was not registering a tool; it was ensuring that browser-agent actions and human actions remained the same operation. We avoided a hidden automation layer by making the tools mutate the live React mission state that powers the visible page.

Model reliability was another challenge. The pre-existing simulation helper referenced a stale model and used unstructured JSON. We changed the flow to use a current low-latency model, strict response schemas, bounded output, explicit error diagnostics, deterministic tests, and a graceful fallback. Live validation reduced a failing turn to a reliable structured response in roughly one browser-agent interaction cycle.

Finally, we had to make a broad existing platform understandable in under three minutes. The result is a dedicated `/webmcp` story page and a one-click `/sandbox` judge mission focused on one memorable loop rather than every feature the platform contains.

## Accomplishments we are proud of

Krewdoo Assembly Lab demonstrates **nested agency**: one browser agent coordinates a team of in-application agents whose roles and behaviors are visible. The integration is meaningful, reversible, and testable. It also produces a tangible shared artifact, so collaboration is not just a transcript; judges can see what the crew assembled and how its decisions changed the result.

The new WebMCP layer includes nine tools, strict schemas, same-origin policy headers, cancellation-aware handlers, safety annotations, deterministic contract tests, responsive onboarding, a prepared judge mission, and an architecture-focused public story page.

## What we learned

WebMCP tools are most compelling when they expose a **coherent workflow**, not a collection of unrelated page actions. Tool descriptions are part of the product interface because they shape how an agent plans. We also learned that human observability improves the demo and the design: step-by-step execution made errors easier to diagnose and makes autonomy easier to trust.

## What's next

The underlying protocol is intentionally broader than construction pieces. A future mission could assemble a storyboard, product specification, lesson plan, software architecture, or music arrangement by swapping specialist roles and artifact adapters while preserving the same discover → configure → execute → inspect → analyze loop.

The platform now includes persisted build replay and a versioned TypeScript integration SDK. The next competition-focused milestone is intervention tooling that lets the human pause a run, replace a specialist, modify a constraint, and resume from a checkpoint, followed by an evaluation suite for tool selection, mission completion, invalid-ID recovery, and cancellation behavior.

## New work completed during the challenge period

The existing platform predates August 25, 2026. The following WebMCP-specific extension is the work submitted for judging, and its history is visible in dated commits:

| New submission-period work | Repository evidence |
|---|---|
| Nine-tool imperative WebMCP contract | `client/src/lib/webmcp/assemblyTools.ts` |
| Registration lifecycle and progressive enhancement | `client/src/hooks/useWebMCPTools.ts` |
| Shared human/browser-agent mission state | `client/src/pages/Sandbox.tsx` |
| Dedicated competition story | `client/src/pages/WebMCPShowcase.tsx` |
| Same-origin WebMCP headers | `server/_core/index.ts` |
| Current structured model helper | `server/_core/llm.ts` |
| Strict turn and analysis schemas | `server/sandboxRouter.ts` |
| Deterministic WebMCP contract tests | `server/webmcp-tools.test.ts` |
| Open-source license and implementation guide | `LICENSE`, `README.md` |

## Links to complete before submission

| Field | Value |
|---|---|
| Live project | `https://legoagents-qmc4sc7q.manus.space/webmcp` after publishing the latest checkpoint |
| Judge demo | `https://legoagents-qmc4sc7q.manus.space/sandbox` after publishing the latest checkpoint |
| Public source | `https://github.com/mlmrx/krewdoo` after the owner makes it public |
| Demo video | Add the public YouTube URL after recording and uploading |

## References

[1]: https://developer.chrome.com/docs/ai/webmcp/imperative-api "WebMCP imperative API"
[2]: https://developer.chrome.com/docs/ai/webmcp/secure-tools "Secure WebMCP tools"
[3]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"

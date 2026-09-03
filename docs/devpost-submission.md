# LEGO Claw: Assembly Lab — Paste-Ready Devpost Submission

## Submission fields

| Field | Paste-ready value |
| --- | --- |
| Project name | **LEGO Claw: Assembly Lab** |
| Tagline | **One browser agent assembles a whole creative crew.** |
| Live project | `https://legoclaw.com/webmcp` |
| Judge demo | `https://legoclaw.com/sandbox` |
| Source code | `https://github.com/mlmrx/lego-claw-platform` — **make public before submitting** |
| Demo video | `ADD_PUBLIC_YOUTUBE_URL` |
| Primary category | Machine Learning/AI; Web |

> **Do not submit while ****`ADD_PUBLIC_YOUTUBE_URL`**** remains, while the repository is private, or before resolving the third-party-trademark requirement described in ****`owner-submission-checklist.md`****.** The official rules require a working live URL, public licensed source repository, and public YouTube demonstration under three minutes.[1]

## Short description

LEGO Claw's Assembly Lab is a human-guided multi-agent assembly protocol exposed through WebMCP. A browser agent discovers specialist teammates, configures a bounded creative mission, advances their work turn by turn, inspects the evolving 3D artifact, and explains the collaboration pattern behind the result. Every tool action updates the same visible interface the person controls.

## Inspiration

Most browser agents operate alone. They can search a page or complete a form, but they rarely coordinate other intelligent actors or help a person understand how a team reached an outcome. We wanted to test a more ambitious interaction model: **the browser agent as an orchestrator of a visible specialist crew**.

LEGO Claw already had a creative multi-agent sandbox. During the WebMCP Challenge submission period, we added a WebMCP-native orchestration layer that turns a complicated sequence of UI decisions into a typed, observable collaboration loop. The judged work is this new WebMCP extension and its dedicated judge experience, not the pre-existing platform.

## What it does

A person can ask their browser agent:

> “Choose the bridge challenge, pair an architect with a diplomat, run four observable turns, then explain whether they collaborated well.”

The browser agent first discovers the scenarios and specialist presets that the page actually supports. It then configures the visible mission with validated IDs, a bounded crew, and a fixed turn budget. The agent can preview the plan, advance exactly one turn at a time, or run the mission to completion.

Each specialist's message, action type, collaboration metrics, and changes to the shared 3D artifact appear in the same interface the person sees. The human can inspect progress between turns. Finally, the browser agent can summarize the current run and request a structured collaboration analysis with a grade, pattern, observations, and recommendations.

| Stage | WebMCP tools | Visible outcome |
| --- | --- | --- |
| Discover | `list_scenarios`, `list_agent_presets` | The browser agent learns the real challenges and available specialists |
| Configure | `configure_mission`, `preview_mission` | The scenario, crew, mode, and turn budget update on screen |
| Execute | `run_next_turn`, `run_simulation` | The timeline, metrics, and 3D artifact evolve |
| Understand | `inspect_collaboration`, `analyze_collaboration` | Progress, collaboration patterns, and recommendations become inspectable |
| Reset | `reset_mission` | The experiment returns to a clean local state |

## Why this is a strong fit for WebMCP

Without WebMCP, configuring and interpreting a multi-agent experiment requires brittle visual automation across many controls. With WebMCP, the page publishes a deliberate contract: explicit scenario and agent identifiers, bounded inputs, structured results, accurate safety annotations, and cancellation-aware execution.[2]

The integration is not a decorative “agent button.” It is a coherent nine-tool sequence that lets the browser agent discover, configure, execute, inspect, and analyze a specialist crew. The human remains in control because state-changing tools update the visible page, the judge mission only prepares a run, and step-by-step mode provides a review point between every turn.

What was difficult before is now direct: one natural-language request can assemble the right specialist team, configure a constrained experiment, observe the shared artifact, and explain the team's behavior without hiding the process from the person.

## How we built it

The React and TypeScript frontend registers nine imperative WebMCP tools through a lifecycle-aware hook. The definitions are separated from the React view so names, descriptions, JSON Schemas, annotations, and execution paths are deterministic and directly testable.

The tools operate the same state used by the human interface and call a typed tRPC backend. The backend generates specialist turns with strict structured output, while React Three Fiber and Three.js render each structured assembly action. A separate analysis step evaluates role effectiveness, emergent behavior, and recommendations.

| Layer | Implementation |
| --- | --- |
| Browser-agent interface | WebMCP imperative API and `webmcp-types` |
| Human interface | React 19, TypeScript, Tailwind CSS, Framer Motion |
| Application API | tRPC and Zod |
| Multi-agent simulation | Server-side model calls with strict JSON Schemas |
| Visible evidence | Three.js, React Three Fiber, Drei |
| Verification | Vitest, TypeScript, production build, live browser testing |

## Safety and trust

Tool inputs use restrictive schemas; read-only behavior is annotated; handlers returning model-generated text use `untrustedContentHint`; and no cross-origin tool exposure is enabled.[3] Tools unregister when the page is left. Long-running handlers receive the browser-provided cancellation signal.

The server sets an origin-keyed agent-cluster header and limits the `tools` permission to the same origin. Mission inputs are bounded to two-to-four agents and four-to-twelve turns. The recommended judge flow uses four turns. Every state change is reflected in the interface.

## Challenges we ran into

The hardest problem was not registering a tool. It was ensuring that browser-agent actions and human actions remained the **same operation**. We avoided a hidden automation layer by making WebMCP handlers mutate the live mission state that powers the visible controls, timeline, metrics, and 3D scene.

Model reliability was another challenge. We changed the simulation path from loose text parsing to strict structured responses, bounded output, explicit diagnostics, deterministic contract tests, and a graceful fallback. We also kept the browser-provided cancellation signal through the WebMCP handler boundary.

Finally, the underlying platform is broad, while judges may spend only minutes with each entry. We built a focused `/webmcp` explanation page and a one-click `/sandbox` setup that prepare one memorable flow without executing actions before the user or browser agent starts them.

## Accomplishments we are proud of

Assembly Lab demonstrates **nested agency**: one browser agent coordinates a team of in-application agents whose roles, decisions, metrics, and artifact changes remain visible. The result is more than a transcript. The shared 3D object becomes tangible evidence of collective decisions.

The submission-period extension includes nine bounded tools, same-origin policy headers, cancellation-aware handlers, safety annotations, deterministic contract tests, responsive onboarding, a prepared judge mission, an architecture-focused story page, and complete new-versus-preexisting documentation.

## What we learned

WebMCP tools are strongest when they expose a coherent workflow rather than a collection of unrelated page actions. Tool names and descriptions are part of the product because they shape how an agent plans. Human observability also improves reliability: step-by-step execution made errors easier to diagnose and made autonomy easier to trust.

We also learned that a browser agent can act as an **orchestrator**, not only an operator. It can select complementary roles, manage a bounded collaboration, and interpret the behavior of other agents while sharing control with a person.

## What's next

The protocol can extend beyond modular construction. Future artifact adapters could support storyboards, lesson plans, product specifications, software architectures, or music arrangements while preserving the discover → configure → execute → inspect → analyze loop.

The next product milestones are persisted experiment comparison, human intervention tools that can replace a specialist or modify a constraint mid-run, and an evaluation suite for tool selection, completion, invalid-input recovery, and cancellation behavior.

## New work completed during the submission period

The platform predates August 25, 2026. The WebMCP extension was added on September 1, 2026 in commit `d8321b8`, with later competition hardening in `5fb27e3`. The active verified competition checkpoint is `4415bd9e`.[1]

| New submission-period work | Repository evidence |
| --- | --- |
| Nine-tool WebMCP contract | `client/src/lib/webmcp/assemblyTools.ts` |
| Registration lifecycle and progressive enhancement | `client/src/hooks/useWebMCPTools.ts` |
| Shared browser-agent/human mission state | `client/src/pages/Sandbox.tsx` |
| Serializable execution and structured failures | `client/src/lib/webmcp/safeExecution.ts` |
| Dedicated competition page | `client/src/pages/WebMCPShowcase.tsx` |
| Same-origin response headers | `server/_core/index.ts` |
| Strict turn and analysis contracts | `server/sandboxRouter.ts` |
| Deterministic tool tests | `server/webmcp-tools.test.ts` |
| Open-source implementation guide | `README.md`, `LICENSE`, `docs/` |

## Verification

The corrected competition baseline passed **387 tests in 31 files**, TypeScript validation, the production build, and the standalone TypeScript SDK build. A complete four-turn browser-level WebMCP journey also returned JSON-serializable results for discovery, configuration, preview, execution, inspection, analysis, and reset. The live routes returned HTTPS 200 during the final artifact audit.

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"

[2]: https://developer.chrome.com/docs/ai/webmcp/imperative-api "WebMCP imperative API"

[3]: https://developer.chrome.com/docs/ai/webmcp/secure-tools "Secure WebMCP tools"

[4]: https://webmcp.devpost.com/resources "WebMCP Challenge resources and FAQ"

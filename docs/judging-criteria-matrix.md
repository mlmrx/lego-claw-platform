# LEGO Claw Assembly Lab: Judging-Criteria Matrix

After a stage-one viability screen, eligible submissions are evaluated on four equally weighted criteria: WebMCP Leverage, Execution, Potential Impact, and Creativity & Ambition.[1]

| Criterion | Core claim | Product evidence | Best video moment | Repository evidence |
|---|---|---|---|---|
| **WebMCP Leverage** | One browser agent uses a coherent nine-tool protocol to orchestrate a specialist crew | Agent discovers scenarios and agents, configures a bounded mission, advances four observable turns, inspects, and analyzes | 0:40–2:05: visible tool calls change the live mission and artifact | `assemblyTools.ts`, `useWebMCPTools.ts`, `webmcp-tools.test.ts` |
| **Execution** | The integration is a complete human-and-agent product flow, not a tool-call proof of concept | Dedicated onboarding, prepared mission, visible timeline, 3D artifact, metrics, analysis, loading/error states | 0:00–0:35 and 1:05–1:50 | `WebMCPShowcase.tsx`, `Sandbox.tsx`, `sandboxRouter.ts` |
| **Potential Impact** | Agent teams are difficult to configure and evaluate; a browser agent can assemble the right crew while preserving human oversight | Bounded crew selection, step-by-step review, structured collaboration analysis | 1:05–2:10: each specialist contributes while the human retains control | Devpost narrative, tool catalog, security note |
| **Creativity & Ambition** | The browser agent becomes an orchestrator of other agents—nested agency—with a shared artifact as evidence | Browser agent coordinates architect, diplomat, engineer, and artist roles rather than acting alone | 0:00 hook and final 15 seconds | Architecture diagram and new-vs-preexisting evidence |

## Judge-memory anchors

| Moment | Phrase to repeat | Evidence |
|---|---|---|
| Opening | **“One browser agent assembles a whole creative crew.”** | Hero and request card |
| Configuration | **“Typed orchestration, not screen-coordinate guessing.”** | Scenario and agent IDs selected through tools |
| Execution | **“Every tool action changes the same page the human sees.”** | Timeline, metrics, and 3D canvas update |
| Analysis | **“The artifact is evidence; the analysis explains the team.”** | Final structure plus collaboration report |
| Closing | **“WebMCP turns the browser agent from operator into orchestrator.”** | Complete tool chain |

## Likely judge objections and answers

| Objection | Concise answer |
|---|---|
| “Is this just a pre-existing app?” | The platform predates the challenge; the entire browser-agent orchestration layer, nine tools, lifecycle, security headers, tests, story page, and judge flow were added during the submission period and are documented by commit and file. |
| “Could normal UI automation do this?” | It could attempt it, but would need to infer controls and state. WebMCP provides stable IDs, bounded schemas, explicit effects, structured results, and cancellation. |
| “Where is the human?” | State-changing tools update the visible interface, the recommended run is step-by-step, and the prepared demo does not execute anything until started. |
| “Why multiple agents?” | Specialist roles reveal coordination patterns that a single generic agent cannot demonstrate; the shared artifact and metrics make the collaboration inspectable. |
| “Is the implementation safe?” | The tools are same-origin, bounded, lifecycle-scoped, cancellation-aware, and accurately annotated; model-derived output is marked untrusted. |

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"

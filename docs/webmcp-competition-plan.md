# WebMCP Devpost Competition Plan

## Deadline and hard requirements

The submission deadline is **September 3, 2026 at 1:00 PM PDT**. The official rules require a working public URL, a public open-source repository with a visible license, a text description, and a public YouTube demo video under three minutes with audio. Because this project existed before August 25, the repository and submission must clearly distinguish the new WebMCP extension from the pre-existing product with dated commits.

| Requirement | Current status | Required action |
|---|---|---|
| Meaningful WebMCP extension after August 25 | Not yet implemented | Add a non-trivial imperative WebMCP tool suite and dated tests/docs |
| Working live URL | Manus subdomain works | Keep a public, authentication-free judge flow available through the end of judging |
| Public repository and visible license | Repository is private | Obtain user confirmation before making code public; add a recognized open-source license |
| Text description | Not prepared | Write criterion-aligned Devpost copy |
| Public demo video under three minutes | Not prepared | Produce a tight script and shot list; user records voice/video or explicitly requests media generation |
| Original work and clean IP | Current LEGO branding is high risk | Remove third-party trademark branding from the submitted build, video, screenshots, and repository |

## Judging strategy

The four judging criteria are equally weighted: **WebMCP Leverage, Execution, Potential Impact, and Creativity & Ambition**. A competitive entry therefore needs more than one decorative tool registration. The winning story should be that a browser agent becomes an active coordinator of a visible multi-agent creative system while the human remains in control.

> **Working concept:** The browser agent translates a person's intent into a structured build mission, assembles a complementary crew of specialist agents, advances the collaboration turn by turn, observes the evolving 3D artifact and cooperation metrics, and hands control back to the human at meaningful decision points.

The official showcase already contains a web-native 3D modeling suite, a 3D puzzle, a music sequencer, image editing, cards, crosswords, and shopping experiences. A generic "agent controls a brick builder" entry would therefore look derivative. The defensible concept is the **agentic assembly protocol**: one browser agent orchestrates a visible team of specialized in-app agents, while the human can inspect, interrupt, and redirect the collaboration. The 3D artifact is evidence of collective work rather than the product's entire identity.

The judge-facing page should call this experience **Assembly Lab**. This is a feature name, not a final company rebrand, and avoids blocking implementation on domain availability. Submission branding must not rely on LEGO trademarks because the official rules require entrants to own their work and prohibit unauthorized third-party trademarks in the demo video.

## Proposed WebMCP tool journey

| Tool | Purpose | Safety annotation |
|---|---|---|
| `list_scenarios` | Discover available collaboration challenges | Read-only |
| `list_agent_presets` | Discover specialist agents and strengths | Read-only |
| `configure_mission` | Set goal, scenario, constraints, crew, and turn budget in the visible UI | Reversible state change |
| `preview_mission` | Return the current mission state before execution | Read-only |
| `run_next_turn` | Advance exactly one agent turn so the human can inspect progress | State-changing; bounded |
| `run_simulation` | Run a bounded mission after configuration | State-changing; explicit limit |
| `inspect_collaboration` | Return concise progress, brick count, metrics, and latest action | Read-only; untrusted-content hint when returning agent text |
| `analyze_collaboration` | Produce post-run collaboration findings and recommendations | Read-only with respect to build state |
| `reset_mission` | Clear the local mission and return to configuration | Destructive but local; clearly described |

The primary demo should use a multi-step chain rather than a single call: discover scenarios, select a crew, configure a constrained mission, execute two or three turns, inspect progress, and request an analysis. Every state-changing tool must update the same visible interface a human uses.

## Two viable implementation scopes

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---|---|
| **Focused Assembly Lab** | Registers a coherent tool chain on the existing Agent Lab page, reuses working tRPC simulation procedures, and can be completed and tested before the deadline. Best balance of depth and reliability. | Existing hosting and built-in model usage | Medium |
| **Site-wide tool layer** | Exposes tools across Dream Build, social rooms, instructions, marketplace, and Agent Lab. Broader but much harder to explain, test, and demo in under three minutes. Higher chance of ambiguous tool selection. | Higher model calls and testing time | High |

The competition implementation should use the focused Assembly Lab approach. It demonstrates non-trivial WebMCP orchestration without risking the coherence and reliability scores.

## Security and quality constraints

Tool names and descriptions must remain concise, JSON Schemas must use clear enums and required fields, and outputs should stay below approximately 1,500 characters. Read-only tools receive `readOnlyHint: true`; tools that return model-generated or user-generated text receive `untrustedContentHint: true`. Long-running calls must honor cancellation signals. Tool handlers must validate state before mutation and return structured, actionable errors.

## Sources

- [Official challenge overview](https://webmcp.devpost.com/)
- [Official rules](https://webmcp.devpost.com/rules)
- [Official resources and FAQ](https://webmcp.devpost.com/resources)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Tool security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals)

# LEGO Claw Assembly Lab: WebMCP Tool Catalog

The canonical implementation is [`client/src/lib/webmcp/assemblyTools.ts`](../client/src/lib/webmcp/assemblyTools.ts). The page uses the WebMCP imperative API to register nine tools that act on shared, human-visible mission state.[1]

| Tool | Type | Input boundary | Visible effect | Trust annotation |
|---|---|---|---|---|
| `list_scenarios` | Read | Empty object only | None; returns supported scenario IDs and constraints | `readOnlyHint: true`, trusted static content |
| `list_agent_presets` | Read | Empty object only | None; returns specialist IDs and traits | `readOnlyHint: true`, trusted static content |
| `configure_mission` | Write | Exact scenario ID, 2–4 unique agent IDs, 4–12 turns, optional mode | Updates the visible scenario, crew, mode, and turn budget | State-changing; trusted validated inputs |
| `preview_mission` | Read | Empty object only | None; reports current configuration and execution state | `readOnlyHint: true` |
| `run_next_turn` | Write | Empty object only; receives cancellation signal | Adds one visible specialist turn and updates metrics/3D state | Model output marked untrusted |
| `run_simulation` | Write | Optional 4–12 turn override; receives cancellation signal | Runs the bounded mission and renders the result | Model output marked untrusted |
| `inspect_collaboration` | Read | Empty object only | None; summarizes progress, actions, conflicts, resolutions, and averages | Read-only model-derived content marked untrusted |
| `analyze_collaboration` | Write | Empty object only; receives cancellation signal | Adds a visible structured grade, pattern, observations, and recommendations | Model output marked untrusted |
| `reset_mission` | Write | Empty object only | Clears local selections, timeline, metrics, and analysis | State-changing local reset |

## Intended sequence

```text
list_scenarios
  → list_agent_presets
  → configure_mission
  → preview_mission
  → run_next_turn × 4
  → inspect_collaboration
  → analyze_collaboration
```

The sequence is intentionally composable. A browser agent may preview before executing, use `run_next_turn` for human review between actions, choose `run_simulation` for a bounded full run, inspect without requesting a new analysis, or reset and try a different crew.

## Security properties

The WebMCP security guidance recommends careful descriptions, restrictive input schemas, accurate side-effect annotations, treating tool output as untrusted when appropriate, and avoiding unnecessary cross-origin exposure.[2] Assembly Lab applies those controls as follows:

| Risk | Control |
|---|---|
| Invalid or invented IDs | The tool first exposes supported IDs; the application validates scenario and agent selections |
| Unbounded autonomous work | Crews are limited to 2–4 agents and runs to 4–12 turns |
| Hidden side effects | Every state-changing operation updates the visible page |
| Long-running execution | WebMCP cancellation signals propagate into run and analysis handlers |
| Prompt injection through generated text | Model-derived tool output uses `untrustedContentHint` |
| Cross-origin discovery | Tools are same-origin only; no cross-origin registration is enabled |
| Stale registrations | The React hook unregisters every tool on page teardown |

## References

[1]: https://developer.chrome.com/docs/ai/webmcp/imperative-api "WebMCP imperative API"
[2]: https://developer.chrome.com/docs/ai/webmcp/secure-tools "Secure WebMCP tools"

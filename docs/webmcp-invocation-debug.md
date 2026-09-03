# WebMCP Invocation Failure Diagnosis

**Reported:** September 2, 2026

## Specification findings

Chrome's imperative WebMCP guide defines `execute(input, { signal })` as the tool callback and recommends forwarding the supplied `AbortSignal` to long-running work. The callback may return a value or promise, but the WebMCP execution algorithm serializes the fulfilled result for delivery to the caller.[1]

The current WebMCP draft uses JSON serialization for imperative execution results. Values for which `JSON.stringify()` produces `undefined`, and values that throw during serialization such as circular structures, cause execution failure. A callback rejection or thrown exception also completes the invocation as a failure, which current Chrome surfaces through a generic message rather than the application error.[2]

## Confirmed application risks

The LEGO Claw delegate layer used optional chaining for four tools:

- `list_scenarios`
- `list_agent_presets`
- `preview_mission`
- `inspect_collaboration`
- `reset_mission`

If Chrome invoked one of these during the brief interval before the React action ref was populated, the callback fulfilled with `undefined`. That value cannot be serialized as a valid WebMCP result. The remaining delegates explicitly rejected while the page was not ready, and normal validation errors inside `configure_mission`, `run_next_turn`, and `analyze_collaboration` were allowed to escape. Those paths therefore became Chrome's generic invocation failure instead of an actionable tool result.

## Remediation contract

Every registered tool will be wrapped by one execution boundary that:

1. requires the inspector payload to be a plain JSON object;
2. converts `undefined` into an explicit success object;
3. verifies the output can round-trip through JSON serialization;
4. catches thrown and rejected errors and returns a safe failure object;
5. converts cancellation into a serializable aborted result;
6. logs the original exception with the tool name for developers; and
7. never returns DOM nodes, functions, symbols, `BigInt`, circular references, or other non-JSON values.

## Browser-level verification

The current Chromium environment does not expose native `document.modelContext`, so a minimal registration-compatible shim was installed before the SPA navigated to `/sandbox`. The real React hook registered all nine production tool definitions into that shim. The production callbacks—not copied test doubles—were then invoked with the same `(input, { signal })` shape used by the imperative API.

| Probe | Result |
|---|---|
| `list_scenarios` with `{}` | Returned all eight scenarios and round-tripped through `JSON.stringify()` |
| `list_scenarios` with a double-encoded JSON string | Returned `success: false`, `code: INVALID_INPUT`, and the correct `{}` guidance |
| `configure_mission` with an unknown scenario | Returned `success: false`, `code: EXECUTION_FAILED`, and an actionable discovery instruction instead of rejecting |
| `run_next_turn` with a pre-aborted signal | Returned `success: false`, `code: ABORTED`, `aborted: true` instead of throwing |
| Failure-result serialization | All three failure results serialized successfully |

This browser-level test confirms the identified undefined and raw-rejection paths are eliminated. A final native test in the WebMCP-enabled Chrome or ChatGPT client that reported the issue is still recommended after publishing the corrected checkpoint.

The first full back-to-back judge sequence revealed a second race: `configure_mission` updated React state asynchronously, so an immediately following `preview_mission` or `run_next_turn` could still see the previous render. Assembly Lab now keeps a synchronous internal WebMCP mission-state ref alongside visible React state. Each state-changing tool updates that ref before returning, while subsequent tools read it as the authoritative state for the invocation chain.

After that correction, one uninterrupted browser-level run successfully executed the complete recommended sequence. It discovered eight scenarios and six agents, configured Bridge Engineering with Architect and Diplomat, previewed a two-agent four-turn mission, completed four turns numbered 1–4, placed two pieces per turn, inspected eight accumulated pieces, generated an **A** collaboration analysis, and reset the mission. Every result in the chain survived JSON serialization.

## References

[1]: https://developer.chrome.com/docs/ai/webmcp/imperative-api "Chrome for Developers — WebMCP Imperative API"
[2]: https://github.com/webmachinelearning/webmcp/blob/main/index.bs "WebMCP Community Group Draft Specification"

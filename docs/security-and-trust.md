# WebMCP Security and Trust Notes

Assembly Lab treats WebMCP tools as a deliberate product interface rather than a shortcut around application controls. The implementation follows the WebMCP guidance to use precise descriptions, restrictive schemas, accurate side-effect annotations, untrusted-output labeling, and narrow origin exposure.[1]

| Trust boundary | Control | Code evidence |
|---|---|---|
| Browser-agent input | JSON Schemas reject extra properties and bound arrays and integers | `client/src/lib/webmcp/assemblyTools.ts` |
| Scenario and specialist selection | Tools expose exact IDs before configuration; application validates selections | `assemblyTools.ts`, `Sandbox.tsx` |
| Side effects | Read-only and state-changing tools are labeled separately | `assemblyTools.ts` annotations |
| Generated content | Model-derived turns, inspection, and analysis are marked with `untrustedContentHint` | `assemblyTools.ts` |
| Long-running work | Browser-provided `AbortSignal` reaches execution and analysis handlers | `useWebMCPTools.ts`, `assemblyTools.ts` |
| Human visibility | State-changing tools mutate the same React state rendered by the page | `Sandbox.tsx` |
| Autonomous scope | Crews are limited to 2–4 agents and missions to 4–12 turns | Tool schemas and server validation |
| Browser lifetime | Tools unregister when the page unmounts | `useWebMCPTools.ts` |
| Origin exposure | No cross-origin registration; response headers restrict tools to self | `server/_core/index.ts` |
| Regression risk | Deterministic tests verify names, descriptions, schemas, annotations, cancellation, and chain behavior | `server/webmcp-tools.test.ts` |

The one-click judge setup is intentionally non-executing: it prepares a bounded mission but does not start autonomous work. Step-by-step mode gives the person a natural review boundary after each specialist turn.

## References

[1]: https://developer.chrome.com/docs/ai/webmcp/secure-tools "Secure WebMCP tools"

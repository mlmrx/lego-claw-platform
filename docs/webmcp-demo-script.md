# LEGO Claw Assembly Lab: Demo Script, Shot List, and Captions

**Target runtime:** 2 minutes 35 seconds. The official rules require a public YouTube video shorter than three minutes, with audio that clearly demonstrates the project and explains how WebMCP is used.[1]

> **Blocking requirement:** The selected LEGO Claw brand uses a third-party trademark. The rules prohibit unauthorized third-party trademarks in the video. Record this script only after permission is confirmed or after a competition-safe visual and spoken rebrand.[1]

## Timed script

| Time | Screen action | Voiceover |
|---|---|---|
| 0:00–0:12 | Open `https://legoclaw.com/webmcp`; show the hero and request card. | “Most browser agents work alone. LEGO Claw's Assembly Lab lets one browser agent assemble and coordinate an entire specialist crew.” |
| 0:12–0:27 | Scroll through the four-stage protocol. | “WebMCP exposes a real workflow: discover, configure, execute, and understand. The agent does not guess at screen coordinates; it uses typed tools the site deliberately provides.” |
| 0:27–0:39 | Open `/sandbox`; hold on the readiness card. | “The page registers nine same-origin tools. Every state-changing tool updates the same interface I can see and control.” |
| 0:39–0:50 | Issue the prepared prompt in the ChatGPT browser. Keep the full prompt readable. | “I ask it to choose a bridge challenge, assemble complementary specialists, run four observable turns, and explain the collaboration.” |
| 0:50–1:05 | Show `list_scenarios`, `list_agent_presets`, and `configure_mission`; the page selects the mission and crew. | “First it discovers the exact scenarios and agent capabilities the page supports. Then it configures a bounded mission with validated IDs and four turns.” |
| 1:05–1:39 | Let the browser agent call `run_next_turn` four times. Keep the timeline and 3D canvas in frame. | “The architect defines the structure. The diplomat reinforces a shared plan. The engineer improves stability. Every message, metric, and artifact change stays visible, and I retain a review point between turns.” |
| 1:39–1:54 | Show the completed timeline, metrics, and rotate the 3D artifact once. | “This is not only a transcript. The shared artifact is evidence of their collective decisions, while the dashboard summarizes cooperation, quality, and communication.” |
| 1:54–2:12 | Show `inspect_collaboration` and `analyze_collaboration`; reveal the grade and pattern. | “Finally, the browser agent inspects the run and explains the collaboration pattern, key observations, and recommendations for the next crew.” |
| 2:12–2:27 | Return to `/webmcp`; show the security section or tool-chain card. | “Inputs are bounded. Side effects are labeled. Generated output is marked untrusted. Long-running actions can be cancelled, and tools remain same-origin.” |
| 2:27–2:35 | End on the hero and request card. | “WebMCP turns the browser agent from a solitary operator into a transparent orchestrator of collective intelligence.” |

## Capture settings

Record at 1920×1080, 30 frames per second, with browser zoom between 80% and 90%. Capture the browser window rather than the entire desktop. Use a quiet microphone, disable notifications, hide bookmarks and personal profile details, and do not display API keys, private repository pages, Devpost account data, or unrelated tabs.

Use only original narration and either no music or music you own and can prove is licensed. Record two complete takes. Choose the take with the clearest tool sequence rather than the most elaborate final model.

## On-screen captions

| Time | Caption |
|---|---|
| 0:02 | One browser agent. A whole creative crew. |
| 0:15 | Discover → Configure → Execute → Understand |
| 0:31 | 9 typed WebMCP tools |
| 0:53 | Real IDs. Bounded inputs. Shared state. |
| 1:08 | One visible specialist turn at a time |
| 1:42 | Artifact + metrics = inspectable teamwork |
| 1:57 | Structured collaboration analysis |
| 2:16 | Same-origin • cancellable • human-visible |
| 2:29 | Browser agent → crew orchestrator |

## Required proof shots

The final cut should visibly establish the project URL, WebMCP readiness, natural-language request, tool discovery, tool-driven configuration, four distinct turn calls, shared state updates, 3D artifact, structured analysis, and project name. Do not replace the live tool sequence with slides.

## YouTube metadata

**Title:** `LEGO Claw Assembly Lab — One Browser Agent Orchestrates a Creative AI Crew | WebMCP Challenge`

**Description:**

```text
Assembly Lab gives a browser agent a typed WebMCP protocol for discovering specialist AI agents, configuring a bounded mission, advancing collaboration one visible turn at a time, and analyzing the result.

Live demo: https://legoclaw.com/sandbox
How it works: https://legoclaw.com/webmcp
Source: https://github.com/mlmrx/lego-claw-platform

WebMCP Challenge submission. The submitted WebMCP extension was added during the challenge period; see the public README and docs/new-vs-preexisting.md for dated evidence.
```

**Thumbnail text:** `ONE BROWSER AGENT → A WHOLE AI CREW`

**Upload settings:** Public visibility; English language; captions uploaded or corrected; comments optional; no copyrighted music; verify playback while logged out.

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"

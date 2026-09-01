# Krewdoo Assembly Lab — Demo Script and Shot List

The target runtime is **2 minutes 35 seconds**, leaving twenty-five seconds below the competition's three-minute maximum. Record at 1080p with clear voice audio. Use the public Manus subdomain rather than a third-party-trademark domain. The video must be publicly viewable on YouTube when submitted.[1]

| Time | Screen action | Voiceover |
|---|---|---|
| 0:00–0:12 | Open `/webmcp`; show the hero and the browser-agent request card. | “Most browser agents work alone. Krewdoo lets one browser agent assemble and coordinate an entire specialist crew.” |
| 0:12–0:27 | Scroll briefly through the four-stage protocol. | “WebMCP exposes a real workflow: discover, configure, execute, and understand. The agent does not guess at screen coordinates; it uses typed tools the site deliberately provides.” |
| 0:27–0:37 | Click **Run the 60-second demo** and show the WebMCP status card. | “The lab registers nine same-origin tools. Every action updates the same interface I can see and control.” |
| 0:37–0:48 | In ChatGPT's browser, issue the prepared prompt. Keep the prompt fully visible. | “I ask it to choose the bridge challenge, pair complementary agents, run four observable turns, and explain the collaboration.” |
| 0:48–1:02 | Show `list_scenarios`, `list_agent_presets`, and `configure_mission` being called; the page selects the bridge and crew. | “First it discovers the actual scenarios and agent capabilities. Then it configures a bounded mission: three specialists and four turns.” |
| 1:02–1:36 | Let the browser agent call `run_next_turn` four times. Keep the timeline and 3D canvas visible. | “The architect defines the structure. The diplomat reinforces the shared plan. The engineer improves stability. Every message, metric, and artifact change stays visible, and I can stop between turns.” |
| 1:36–1:52 | Show the results dashboard and rotate the 3D artifact once. | “This is not just a conversation. The shared artifact is evidence of their collective decisions, while the dashboard summarizes cooperation, quality, and communication.” |
| 1:52–2:10 | Let the browser agent call `inspect_collaboration` and `analyze_collaboration`; show the grade and pattern. | “Finally, the agent explains the emergent leader–specialist pattern and recommends how to configure the next experiment.” |
| 2:10–2:27 | Return to `/webmcp` and show the security section. | “The tools use restrictive schemas, accurate safety annotations, same-origin permissions, cancellation signals, and bounded mission sizes.” |
| 2:27–2:35 | End on the hero and project name. | “Krewdoo Assembly Lab turns the browser agent from a solitary operator into a transparent orchestrator of collective intelligence.” |

## Recording checklist

Use ChatGPT's in-app browser, or Chrome 149+ with the WebMCP testing flag enabled. Verify the status card says **9 tools ready** before recording. Load the prepared demo mission, but refresh the page before the real take so the browser agent performs the configuration itself. Keep browser zoom between 80% and 90% so the timeline and 3D canvas fit together. Avoid displaying private account details, API keys, unpublished Devpost forms, or the repository while it remains private.

Record two complete takes. Choose the one with the clearest WebMCP tool sequence, not necessarily the most elaborate artifact. Do not cut away during configuration; the visible connection between tool calls and page state is central evidence for the WebMCP Leverage score.

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"

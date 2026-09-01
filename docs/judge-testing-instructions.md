# Judge Testing Instructions

No account or login is required for the WebMCP competition flow.

## Environment

Use either ChatGPT's in-app browser, which the challenge states supports WebMCP, or Google Chrome 149+ with WebMCP enabled through its experimental flag.[1] Ordinary browsers can use the human interface, but they will correctly show “WebMCP browser needed.”

| Resource | URL |
|---|---|
| Competition overview | [https://legoclaw.com/webmcp](https://legoclaw.com/webmcp) |
| Interactive Assembly Lab | [https://legoclaw.com/sandbox](https://legoclaw.com/sandbox) |
| Public source after owner enables visibility | [https://github.com/mlmrx/lego-claw-platform](https://github.com/mlmrx/lego-claw-platform) |

## Recommended 60–90 second test

1. Open `https://legoclaw.com/sandbox` in a WebMCP-capable browser.
2. Confirm the readiness panel reports **9 tools ready**.
3. Give the browser agent this prompt:

   > Choose the bridge challenge, pair an architect with a diplomat, add an engineer if useful, run four observable turns in step-by-step mode, then explain whether the crew collaborated well.

4. Confirm the browser agent discovers valid scenario and specialist IDs before configuring the mission.
5. Confirm the selected scenario, crew, mode, and four-turn budget update visibly.
6. Confirm each `run_next_turn` call adds one visible timeline card and can update the 3D artifact or metrics.
7. Confirm `inspect_collaboration` reports current progress without changing the mission.
8. Confirm `analyze_collaboration` adds a visible grade, pattern, observations, and recommendations.

## Expected tool sequence

```text
list_scenarios
list_agent_presets
configure_mission
preview_mission
run_next_turn × 4
inspect_collaboration
analyze_collaboration
```

The agent may omit `preview_mission`, add an extra inspection step, or choose a third specialist. Those are valid variations. The important behavior is that it uses supported IDs, respects the four-turn budget, and updates the same visible state as the human controls.

## Human-only fallback

If the browser does not expose WebMCP, click **Load judge demo**, select **Step by Step**, and use **Run Next Turn** four times. This demonstrates the underlying product behavior but not browser-agent tool discovery; judges should use the supported environment for WebMCP evaluation.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| “WebMCP browser needed” | Move to ChatGPT's in-app browser or enable WebMCP in Chrome 149+ and reload |
| Tools do not appear after enabling WebMCP | Hard-refresh `/sandbox`; verify the page is top-level and same-origin |
| A turn takes several seconds | Wait for the structured model response; the page shows progress and retains current state |
| Browser agent chooses an invalid ID | Ask it to call `list_scenarios` and `list_agent_presets` first |
| A long run should stop | Cancel the browser-agent action; the cancellation signal is passed into long-running handlers |

## References

[1]: https://webmcp.devpost.com/resources "WebMCP Challenge resources and FAQ"

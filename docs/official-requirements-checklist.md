# WebMCP Challenge Official Requirements Checklist

**Submission deadline:** September 3, 2026 at 1:00 PM Pacific Time. The official rules and challenge website are the controlling sources.[1]

| Requirement | LEGO Claw status | Evidence or required action |
|---|---|---|
| Eligible entrant | Owner confirmation required | Confirm age of majority, supported country/territory, no excluded relationship, and authority to submit |
| WebMCP-powered working project | Ready | Nine tools registered by `createAssemblyTools`; live judge flow at `/sandbox` |
| Existing project meaningfully extended after August 25 | Ready | Commit `d8321b8` dated September 1 plus `docs/new-vs-preexisting.md` |
| Working live URL | Ready | `https://legoclaw.com/webmcp` and `https://legoclaw.com/sandbox` return HTTPS 200 |
| Accessible in ChatGPT browser or Chrome 149+ | Implementation ready; owner final test required | Follow `docs/judge-testing-instructions.md` |
| English text description | Ready | `docs/devpost-submission.md` |
| Explain WebMCP fit and UX improvement | Ready | Devpost sections “Why this is a strong fit” and “What it does” |
| Explain what humans and agents can now do together | Ready | Nested browser-agent orchestration narrative |
| Brief implementation explanation | Ready | Devpost “How we built it,” README, architecture, tool catalog |
| Public source repository | **Blocked: owner action** | Change `mlmrx/lego-claw-platform` from private to public |
| Complete source and setup instructions | Ready once public | Repository includes application, schema, tests, README, and docs |
| Visible open-source license | File ready; visibility blocked | MIT `LICENSE` exists; confirm GitHub detects it after repository is public |
| Demo under three minutes | Script ready; recording required | Target length 2:35; use `docs/webmcp-demo-script.md` |
| Public YouTube video | **Blocked: owner action** | Record, upload publicly, and replace `ADD_PUBLIC_YOUTUBE_URL` |
| Audio explains product and WebMCP | Script ready | Narration covers problem, tools, visible execution, and security |
| No unauthorized third-party material | **Blocking legal decision** | Resolve LEGO trademark use and use only original or licensed audio/visual material |
| Free judge access through judging period | Ready if deployment remains published | Do not require login for `/webmcp` or `/sandbox`; keep live through winner announcement |
| Submission frozen after deadline | Owner action | Do not alter submission, submitted repository branch, or live deployment during judging unless explicitly permitted |

## Stage-one pass/fail check

The project clearly fits the theme of humans and agents interacting, collaborating, and creating together. The WebMCP implementation is non-trivial and drives a complete discover → configure → execute → inspect → analyze workflow rather than a single decorative tool call.[1]

## Final blocking items

The submission is **not ready to send** until the repository is public, the YouTube URL is present, eligibility is confirmed, and the third-party-trademark issue is resolved. These are not cosmetic recommendations; they follow explicit submission and intellectual-property requirements in the official rules.[1]

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"
[2]: https://webmcp.devpost.com/resources "WebMCP Challenge resources and FAQ"

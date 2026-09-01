# Owner-Only WebMCP Submission Checklist

This checklist separates finished artifacts from actions that require the project owner's accounts or legal decision. Do not submit until every **blocking** row is resolved.

| Priority | Action | Status | Exact completion test |
|---|---|---|---|
| **Blocking** | Confirm entrant eligibility and authority | Owner required | You satisfy the official eligibility rules and can represent the entrant/team |
| **Blocking** | Resolve the LEGO trademark issue | Owner/legal decision required | You have permission to use the third-party mark **or** remove it from the project name, UI shown in the video, video narration, screenshots, and submission |
| **Blocking** | Publish checkpoint `4415bd9e` | Owner required | `https://legoclaw.com/webmcp` and `/sandbox` show the finalized competition version in a fresh private window |
| **Blocking** | Make `mlmrx/lego-claw-platform` public | Owner required | Logged-out browser can open the repository and GitHub shows the MIT license near the repository header |
| **Blocking** | Record the demo using `webmcp-demo-script.md` | Owner required | Final cut is under 3:00 and clearly shows live WebMCP tool use with voice audio |
| **Blocking** | Upload the video publicly to YouTube | Owner required | Logged-out browser can play it; paste its URL into all `ADD_PUBLIC_YOUTUBE_URL` placeholders |
| **Blocking** | Join the challenge and create the Devpost project | Owner required | Project appears under “My projects” on the WebMCP challenge site |
| **Blocking** | Submit before September 3 at 1:00 PM PT | Owner required | Devpost shows the entry as submitted, not merely saved as a draft |
| Final QA | Test the live app in ChatGPT's browser or Chrome 149+ | Owner required | Status says “9 tools ready” and the recommended tool sequence completes |
| Final QA | Verify repository instructions from a clean clone | Prepared; owner spot-check | `pnpm install`, `pnpm check`, and `pnpm build` work without private files |
| Final QA | Freeze submitted assets during judging | Owner required | Do not edit the submission, submitted branch, or live app after the deadline unless permitted |

## Trademark warning

The official rules require the submission to be the entrant's original work, not violate third-party intellectual-property rights, and not include third-party trademarks in the demo video without permission.[1] **LEGO Claw cannot be treated as legally cleared merely because the domain or repository exists.** A disclaimer does not replace permission. This is the highest remaining eligibility risk.

If permission is unavailable, the lowest-risk operational response is to create a competition-only neutral brand, update the visible `/webmcp` and `/sandbox` headers, regenerate screenshots, and record the video without the third-party mark. The separately preserved Krewdoo checkpoint is not automatically legally cleared either; its preliminary name check identified similar brands and recommended professional review.

## Repository-publication steps

Open GitHub → `mlmrx/lego-claw-platform` → **Settings** → **General** → **Danger Zone** → **Change repository visibility** → **Public**. Confirm from a logged-out browser, then verify the LICENSE badge or About metadata. The rules do not provide a private-repository alternative.[2]

## Devpost form completion order

First paste the project name, tagline, live URL, repository URL, and description from `devpost-submission.md`. Add the public YouTube URL only after a logged-out playback check. Upload the three curated screenshots and architecture diagram from the final ZIP. Add testing instructions from `judge-testing-instructions.md`. Save a draft, preview the public project page, correct any truncation or broken links, and submit before the deadline.

## Post-submission freeze

The challenge FAQ says not to change the Devpost submission, repository, or live site after the submission period closes until winners are announced; if further development is necessary, use a separate branch or copy.[2]

## References

[1]: https://webmcp.devpost.com/rules "WebMCP Challenge official rules"
[2]: https://webmcp.devpost.com/resources "WebMCP Challenge resources and FAQ"

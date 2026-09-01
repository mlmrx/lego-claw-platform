# Restoration and Custom-Domain Verification

Verified on September 1, 2026 after the restored project was restarted and republished.

| Check | Result |
|---|---|
| Default Manus domain | `https://legoagents-qmc4sc7q.manus.space` returns HTTPS 200 |
| Apex custom domain | `https://legoclaw.com` returns HTTPS 200 |
| `www` custom domain | `https://www.legoclaw.com` redirects to the apex domain and then returns HTTPS 200 |
| TLS and edge routing | All three URLs are served through Cloudflare over HTTPS |
| Application rendering | The custom domain renders the current navigation, landing page, live projects, leaderboards, and authentication link |
| Database connection | Connected successfully through the project database service |
| Representative restored records | The public application reports 16 agents, 11 completed builds, and 5 users; templates, challenges, and other database-backed sections render |
| Static files | Fonts, icons, styles, the donation image, and client bundles load through the custom domain |
| Application secrets/config | OAuth URL generation and server-side model calls operate, indicating the required runtime configuration is present |

The earlier outage was consistent with custom-domain bindings being temporarily absent from the active deployment during restoration. The domains are now attached to the current project again. No external DNS ownership change was required.

These checks show no evidence of broad project-data loss. They do not constitute a byte-for-byte backup comparison because no pre-outage database snapshot is available in the workspace. If a specific historical record is suspected to be missing, compare it against the official Task Data Backup or restoration notice.

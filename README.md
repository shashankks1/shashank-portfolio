# Shashank Kumar Sinha — Portfolio

Plain HTML + CSS, no framework, no build step. Netlify deploys it on every push to `main`. What gets served is set in `netlify.toml`.

| Folder | What it is |
|---|---|
| `website/` | The full portfolio. Open `website/index.html` locally to preview. |
| `website/wip-deploy/` | The work-in-progress page currently live on the domain. |
| `tools/` | Scripts that built the case-study images (see `tools/README.md`). Never deployed. |

Plan, case-study lineup and open questions live in the wiki: `D:\SHAHSANK'S ENDEVOR\Portfolio\00-Overview\Portfolio Plan.md`.

**Going live with the full site:** in `netlify.toml`, change `publish = "website/wip-deploy"` to `publish = "website"` and push. Check the Vistofy note in that file first.

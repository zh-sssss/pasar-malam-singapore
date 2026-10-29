# Singapore Pasar Malam website

English interactive Mapbox website for the 2026 island-wide study: market distribution, commercial buildings and modelled ODA candidate zones, and reported brand connections. The three chapters share month, planning-area and announcement-status filters.

This repository contains website code only. Research inputs, map-runtime datasets, analysis exports, reports, audit records, local configuration and token files are excluded, including from the rewritten Git history. Those working files are retained on the author's computer. No analysis-download controls are provided.

The existing public website is https://zh-sssss.github.io/pasar-malam-singapore/. Its runtime resources belong to the separately published site, rather than this code-only checkout. Rewriting the code repository does not redeploy or delete that existing Pages deployment.

## Local development

Restore the reviewed runtime bundle into the ignored `data/` directory from the local project workspace. Create an ignored `mapbox-config.js` defining `window.MAPBOX_CONFIG = {accessToken: 'YOUR_PUBLIC_PK_TOKEN', style: 'mapbox://styles/mapbox/standard'}`. Serve the directory over HTTP. Allow the intended website domain in the Mapbox account. Never commit the configuration file or a real token.

The Python processing and deployment scripts are retained as code for local use. They require the separate local inputs and configuration; the brand chapter has a dedicated publication workflow described below. See SOURCES.md for attribution and interpretation limits. The MIT licence covers original code only.


## Brand atlas public chapter

The independent 3D chapter lives at `/brand-connections/`. Source code is copied
from the group project's `site/brand-connections` branch; group collaboration
continues there. The publication workflow preserves an explicit allowlist of
resources from the existing live website, then adds this chapter.

Reviewed display points are supplied at build time through the repository
Actions variable `BRAND_DISPLAY_POINTS_GZIP` (gzip + base64 JSON), outside Git
history. Its contents are the 150 allowlisted public business/market display
records, not original workbooks, reports or audit notes. The publication script
checks identifiers and permanent/temporary counts and retains source links and
precision labels. Geographic context and the existing public browser Mapbox
configuration are reused from the original deployed website. No token value or
configuration file is committed.

For a local publication check:

```sh
python scripts/prepare_brand_publication.py --local-runtime /local/path/runtime.json
```

The ignored `__brand_publish/` folder contains the complete deployable website.
The `brand-pages.yml` Actions workflow deploys this artifact with one-day Actions
artifact retention. No analysis export or download control is added. Public
browser resources remain readable as required for rendering the website.

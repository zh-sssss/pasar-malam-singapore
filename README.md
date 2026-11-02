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
precision labels. Mapbox Light supplies roads, parks, waterways and place labels in the chapter
palette. The existing public browser Mapbox configuration is reused from the
original deployed website. No token value or
configuration file is committed.

For a local publication check:

```sh
python scripts/prepare_brand_publication.py --local-runtime /local/path/runtime.json
```

The ignored `__brand_publish/` folder contains the complete deployable website.
The `brand-pages.yml` Actions workflow deploys this artifact with one-day Actions
artifact retention. No analysis export or download control is added. Public
browser resources remain readable as required for rendering the website.

## Community feedback

The right-edge "Share a stall. Suggest a spot." arrow switches the existing
brand map into a flat feedback view and slides in a right-hand questionnaire.
The brand rail is hidden; Back restores the original brand camera and controls.
The standalone route remains `brand-connections/feedback/`.
The hosted deployment is https://singapore-night-market-atlas.ushahidi.io/.
Brand/location contributions and vendor preferences use separate moderated surveys.
Optional photos are resized/re-encoded locally. Only editor-published location
reports enter the atlas on reload; vendor intentions never become store points.

The build runs `scripts/prepare_ushahidi_connection.py` to generate runtime-only
survey mapping and Ushahidi's official public anonymous-client configuration.
No administrator credential is used. Configuration and guest tokens are not
committed. The older optional `FEEDBACK_API_BASE` bridge override is supported;
without an override, the verified hosted v5 post/media guest connection is used.
The root website and baseline research records are preserved.

Category/location and 3+3 limits are checked by the website. Ushahidi requires
editor review. Editors must check reports submitted through other Ushahidi clients
as well. In Data view, include both new surveys in Filters and select Under review;
open a report to edit its brand/location fields and Publish or Archive it.

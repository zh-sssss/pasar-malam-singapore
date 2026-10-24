# Singapore Pasar Malam website

English interactive Mapbox website for the 2026 island-wide study: market distribution, commercial buildings and modelled ODA candidate zones, and reported brand connections. The three chapters share month, planning-area and announcement-status filters.

This repository contains website code only. Research inputs, map-runtime datasets, analysis exports, reports, audit records, local configuration and token files are excluded, including from the rewritten Git history. Those working files are retained on the author's computer. No analysis-download controls are provided.

The existing public website is https://zh-sssss.github.io/pasar-malam-singapore/. Its runtime resources belong to the separately published site, rather than this code-only checkout. Rewriting the code repository does not redeploy or delete that existing Pages deployment.

## Local development

Restore the reviewed runtime bundle into the ignored `data/` directory from the local project workspace. Create an ignored `mapbox-config.js` defining `window.MAPBOX_CONFIG = {accessToken: 'YOUR_PUBLIC_PK_TOKEN', style: 'mapbox://styles/mapbox/standard'}`. Serve the directory over HTTP. Allow the intended website domain in the Mapbox account. Never commit the configuration file or a real token.

The Python processing and deployment scripts are retained as code for local use. They require the separate local inputs and configuration; there is no automatic deployment workflow in this code-only repository. See SOURCES.md for attribution and interpretation limits. The MIT licence covers original code only.

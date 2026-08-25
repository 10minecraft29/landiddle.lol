# Landiddle.lol v3.2 — static-root hardened build

This site is plain static HTML/CSS/JS. There is no framework and no build step.

## Vercel
This package's `vercel.json` explicitly sets:
- Framework Preset: Other (`framework: null`)
- Build Command: blank
- Install Command: blank
- Output Directory: `.`
- explicit clean-route rewrites

All site files must be the root of the Vercel project, not inside another folder.

## Deployment checks
After deploying:
- `/health.txt` must say `LANDIDDLE_BUILD_V3_2_STATIC_ROOT_OK`
- `/diagnostic` must show `STATIC HTML LOADED.` and PASS for CSS, JS, and health
- `/` must contain the Landoodle Files gateway

If `/diagnostic` or `/health.txt` does not show those exact values, the custom domain is serving a different project/deployment or the Vercel Root Directory is incorrect.

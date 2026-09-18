<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Deployment topology: https reverse-proxy in front of the app

The site is served through **two** entry points. Code must work behind BOTH:

1. `https://tech-diagnostics.headscale.78.17.103.56.sslip.io/` — **production entry**.
   Caddy terminates TLS (https) and reverse-proxies to the Next.js server
   (`next start`, bound to `0.0.0.0:3000`). Caddy sends the standard proxy
   headers: `X-Forwarded-Proto: https`, `X-Forwarded-Host`.
2. `http://100.64.0.2:3000/` — direct LAN access (Tailscale IP), no proxy,
   plain http.

## Rules for code touching URLs, origins, redirects, or absolute links

- **Never hardcode the scheme (`http://` / `https://`) or a fixed origin when
  building absolute URLs server-side** (API responses returned to the browser,
  redirects, sitemap, webhook URLs, TileJSON/manifest rewriting, etc.).
- Derive the scheme from `X-Forwarded-Proto` (fallback `"http"` for direct
  access) and the host from `X-Forwarded-Host` (fallback `Host`). Example —
  `app/api/map/[...path]/route.ts`:
  ```ts
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : req.nextUrl.origin;
  ```
- Do NOT use `req.nextUrl.origin` as-is: the server listens on `0.0.0.0`, so it
  yields `http://0.0.0.0:3000` and breaks the public entry point.
- Same-origin resources (fetches the page JS makes) should use **relative
  paths** (`/api/...`) — they work on both entry points unchanged.
- Anything that produces `http://` URLs in responses served over https triggers
  browser mixed-content blocking (the resource silently fails from web
  workers/fetch). If a feature "works on LAN but is blank/broken via the
  https://sslip.io domain", first suspect a hardcoded `http://` origin in a
  server-generated payload.
- Prefer relative URLs; if an absolute URL is genuinely required, build it from
  the forwarded headers as above.

## Misc

- Production process: `next start --hostname 0.0.0.0 --port 3000`. A code
  change requires `npm run build` + server restart to appear on either entry
  point (there is no dev watcher running in production).

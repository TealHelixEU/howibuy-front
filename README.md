# HowiBuy Front-end

Web front-end for HowiBuy. It talks to the HowiBuy backend (`../tealhelix`, Quarkus,
`/api/howibuy/v1` on port 8180) and authenticates against the Keycloak realm
`tealhelix` on port 8280.

## Stack

Matches the other front-ends in these projects:

- **React 19** + **TypeScript** (Vite)
- **Jotai** for state
- **react-router** (library mode, `createBrowserRouter`)
- **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first config) + **daisyUI v5**
- **react-i18next** (English only for now)
- **OAuth2/OIDC** via `oidc-client-ts` + `react-oidc-context` (Authorization Code + PKCE)
- ESLint 10 (flat config, no compat layer) + Prettier, Vitest

## Getting started

```bash
npm install
npm run dev      # http://localhost:5175
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:run`.

Dev ports in use around here: 5174 is DietWise Backoffice, 8100 is ClaimsBuster, so this app
takes **5175** (`strictPort`, so a clash fails loudly instead of silently moving).

## Configuration

Settings resolve in this order (later wins): built-in fallback →
`.env.*` (`VITE_*`) → runtime `public/config.json` (fetched at startup, so it can
be edited per-deployment without a rebuild).

| Key                 | Env var                 | Default                                    |
| ------------------- | ----------------------- | ------------------------------------------ |
| Auth server / realm | `VITE_AUTH_SERVER_HOST` | `http://localhost:8280/realms/tealhelix`   |
| API base URL        | `VITE_API_SERVER_HOST`  | `http://localhost:8180/api/howibuy/v1`     |
| OIDC client id      | `VITE_OIDC_CLIENT_ID`   | `howibuy`                                  |

## Required backend / Keycloak setup

**The front-end cannot log in until these one-time changes are made.** Neither is done yet.

### 1. Keycloak `howibuy` client (realm `tealhelix`)

The realm already ships a public `howibuy` client
(`tealhelix-docker/tealhelix-docker-keycloak/src/main/docker/tealhelix-realm.json`), but its only
redirect URI is `http://localhost:8180/howibuy/`. Add the SPA origin:

- **Valid redirect URIs**: add `http://localhost:5175/*` (plus your prod origin)
- **Valid post logout redirect URIs**: add `http://localhost:5175/*`
- **Web origins**: `http://localhost:5175` (the realm export currently has `/*`)
- **PKCE**: `S256` (Advanced → Proof Key for Code Exchange Code Challenge Method) — `oidc-client-ts`
  always sends a code challenge; setting it on the client enforces it

Make the change in `tealhelix-realm.json` so it survives a container rebuild, not just in the admin console.

### 2. Backend CORS

`howibuy-container/howibuy/src/main/resources/application.properties` has no CORS configuration at
all, so browser calls from `:5175` to `:8180` will be blocked. Add:

```properties
quarkus.http.cors.enabled=true
%dev.quarkus.http.cors.origins=http://localhost:5175
```

## Project layout

```
src/
  api/        fetch wrapper that attaches the bearer token (apiFetch)
  auth/       UserManager (oidc-client-ts), RequireAuth guard
  config/     runtime/env app config loading + jotai atoms
  i18n/       react-i18next setup + translations
  layout/     AppLayout (daisyUI drawer) + nav item registry
  pages/      route screens
  routes/     react-router route tree
  main.tsx    bootstrap: load config → configure auth/api/i18n → render
```

Adding a screen is: a page under `pages/` (or a feature folder), a route in `routes/router.tsx`,
and an entry in `layout/navItems.ts`.

The whole app sits behind `RequireAuth`; the realm defines no application roles, so there is no
role gate. The current Home page is a placeholder that proves the bootstrap chain works — the visual
design is still open.

## Docker deploy

This repository includes a static web container:

- Build stage: Node + Vite
- Runtime stage: Nginx serving `dist/`

### Build image

```bash
docker build -t howibuy-front:local .
```

The env variable `VITE_BASE_PATH` controls the context path, so building like:

```bash
docker build --build-arg VITE_BASE_PATH=/howibuy/ -t howibuy-front:test .
```

makes the app available under `/howibuy`.

To set backend hosts at build time:

```bash
VITE_AUTH_SERVER_HOST=https://auth.example.com/realms/tealhelix \
VITE_API_SERVER_HOST=https://api.example.com/api/howibuy/v1 \
docker build -t howibuy-front:local .
```

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

## Backend / Keycloak setup

Logging in works in dev. What makes it work lives in `../tealhelix`, and is worth knowing when it stops
working.

### Keycloak `howibuy` client (realm `tealhelix`)

The realm's public `howibuy` client
(`tealhelix-docker/tealhelix-docker-keycloak/src/main/docker/tealhelix-realm.json`) carries:

- **Valid redirect URIs**: `http://localhost:5175/*` alongside `http://localhost:8180/howibuy/`. A prod
  origin still has to be added when there is one.
- **Post logout redirect URIs** and **web origins**: `+`, i.e. whatever the redirect URIs allow
- **PKCE**: `S256` (Advanced → Proof Key for Code Exchange Code Challenge Method) — `oidc-client-ts`
  always sends a code challenge, and the client enforces it

Changes belong in `tealhelix-realm.json`, not only in the admin console, so they survive a container
rebuild.

### Backend CORS

`application.properties` allows the SPA origin in dev
(`%dev.quarkus.http.cors.origins=http://localhost:5175`); the production value is deliberately empty.

### Any realm user can log in

Every end-user endpoint resolves the token's subject against `TH_USER_PROFILE.idm_id`, and the backend
creates that profile the first time a realm user calls it, so there is no provisioning step. A
`@dev`-context Liquibase changeset seeds the profile of the development user, `bob@krusty-krab.com`,
only to give it an internal id known in advance (the same as its subject).

### Two dev-only settings

| Setting | Dev | Otherwise |
| --- | --- | --- |
| `sfc.stability-window` | `PT1M` | `P30D` |
| Liquibase contexts | `@dev,appdata` | `appdata` |

Thirty days puts the compass's take-it-again path out of reach of any sitting, hence the minute. Both
follow from starting the API through the `howibuy-quarkus-dev` Maven profile, which puts Quarkus in its
`dev` profile.

## Project layout

```
src/
  api/        fetch wrapper that attaches the bearer token (apiFetch); a screen's load and reload (useLoaded)
  auth/       UserManager (oidc-client-ts), RequireAuth guard
  components/ UI components shared by the screens (ConfirmDialog, LoadFailure, ProgressBar, RichText)
  config/     runtime/env app config loading + jotai atoms
  dashboard/  the user's dashboard (a placeholder)
  handoff/    sessions a retailer hands over: redeeming the ticket, renewing the token
  i18n/       react-i18next setup + translations
  layout/     AppLayout (daisyUI drawer) + nav item registry
  pages/      route screens
  routes/     react-router route tree
  sfc/        Sustainable Food Compass: the questionnaire and its screens
  main.tsx    bootstrap: load config → configure auth/api/i18n → start a handed-over session → render
```

Adding a screen is: a page under `pages/` (or a feature folder), a route in `routes/router.tsx`,
and an entry in `layout/navItems.ts`.

The whole app sits behind `RequireAuth`, which admits one of two sessions: the user's own OIDC login,
or a session a retailer hands over by sending the user here with a one-time ticket in the URL fragment
(`#ticket=...`), which the app redeems at the API's `/handoff/redeem`. There is no role gate: the realm's
roles (`retailer`, `catalogue-sync`, `operator`) govern what retailer backends and operators may do in
the API, and the users of this app need none. `/` leads to the dashboard, so a login and a handover
link to `/` both land there.

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

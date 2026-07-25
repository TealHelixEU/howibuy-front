# HowiBuy Front-end

Web SPA for HowiBuy. It is a thin UI over the Quarkus backend in the sibling repo `../tealhelix`
(module `howibuy-container`, API `/api/howibuy/v1` on port 8180); it holds no business logic of its own.
See that repo's `CLAUDE.md` for its layering rules. This file covers the SPA only.

## Commands

- Dev server: `npm run dev` (Vite, port 5175, strict)
- One-shot tests: `npx vitest run` (`npm test` starts watch mode)
- Single test file: `npx vitest run src/pages/HomePage.test.tsx`
- Typecheck: `npx tsc --noEmit`
- Lint: `npx eslint src/` — formatting is Prettier-via-ESLint, so `npx eslint --fix` is how you format
- Production build: `npm run build` (runs `tsc` then `vite build`)

A change is not done until `npx vitest run`, `npx tsc --noEmit`, and `npx eslint src/` are all clean.

## Stack

React 19 · TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`) · Vite · Tailwind 4 + daisyUI ·
react-i18next · jotai · react-router · OIDC via `oidc-client-ts` + `react-oidc-context`.
Tests: Vitest + `@testing-library/react` on jsdom.

`@/` is the alias for `src/` (tsconfig + Vite). Source is indented with **tabs**.

Tailwind 4 is configured **CSS-first**: `src/index.css` holds `@import 'tailwindcss'`, `@plugin 'daisyui'`
and any `@theme` customisation. There is no `tailwind.config.js` and no PostCSS pipeline — the
`@tailwindcss/vite` plugin does the work, and `prettier-plugin-tailwindcss` reads the stylesheet
(`tailwindStylesheet` in `.prettierrc.json5`) to sort class names.

## Structure

```
src/
  components/        ONLY truly generic, reusable components
  <feature>/         a feature folder per screen area
    <Feature>Page.tsx
    <feature>.ts     data layer: the feature's types + fetch functions
    components/      components specific to this feature
  api/client.ts      apiFetch + ApiError
  auth/              OIDC user manager, RequireAuth guard
  config/            runtime AppConfig (loaded at startup) + fallback
  i18n/              en.json (only locale) + setup
  layout/ pages/ routes/
```

**The `src/components/` rule is objective:** a component belongs there **iff it imports nothing from a
feature folder**. The moment it imports from a feature, it belongs under that feature's `components/`.

Tests are co-located next to what they test and use relative imports (`./X`) so they move with the file.

## Data layer

Each feature's `<feature>.ts` wraps `apiFetch` from `@/api/client`. `apiFetch` attaches the bearer token,
returns `undefined` for 204, and throws `ApiError` (carrying `.status`) on any non-2xx.

## Auth & config

Login is OIDC (Authorization Code + PKCE) against the Keycloak realm `tealhelix` using the public client
`howibuy`. The whole route tree is behind `RequireAuth`; the realm defines no application roles, so there
is no role gate — add one only when the backend grows roles.

Runtime config (`authServerHost`, `apiServerHost`, `oidcClientId`) is loaded at startup and resolves
fallback → `.env.*` → `public/config.json`. The local-dev fallback in `config/model.ts` points at Keycloak
on `:8280` and the API on `:8180`.

**Not wired up yet:** the Keycloak `howibuy` client has no `http://localhost:5175/*` redirect URI and the
backend has no CORS configuration, so a real login has never been exercised. See README.md.

## Testing conventions

- **No `jest-dom`.** Assert with `expect(el).not.toBeNull()`, `(el as HTMLInputElement).value`,
  `el.className).toContain(...)` — not `toBeInTheDocument`/`toHaveClass`.
- Mock `react-i18next` with a manual factory so keys pass through:
  `vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))`.
- Mock the **data-layer module** (`vi.mock('@/<feature>/<feature>')`), not global `fetch`.
- All UI strings go through `t('feature.key')`, defined in `src/i18n/en.json`, grouped by feature.
  There is one locale today; add keys, don't hardcode strings.

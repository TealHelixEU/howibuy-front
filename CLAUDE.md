# HowiBuy Front-end

Web SPA for HowiBuy. It is a thin UI over the Quarkus backend in the sibling repo `../tealhelix`
(module `howibuy-container`, API `/api/howibuy/v1` on port 8180); it holds no business logic of its own.
See that repo's `CLAUDE.md` for its layering rules. This file covers the SPA only.

## Commands

- Dev server: `npm run dev` (Vite, port 5175, strict)
- One-shot tests: `npm run test:run` (`npm test` starts watch mode)
- Single test file: `npm run test:run -- src/pages/HomePage.test.tsx`
- Typecheck: `npm run typecheck` — covers both projects (`src` and `vite.config.ts`); a bare `tsc --noEmit`
  silently skips the Vite config, see [package.json-comments.md](package.json-comments.md). TypeScript is
  deliberately held at 6.x; the same file explains why, read it before upgrading to 7
- Lint: `npm run lint` — covers `src/` and `vite.config.ts`; formatting is Prettier-via-ESLint, so
  `npm run lint -- --fix` is how you format
- Production build: `npm run build` (typechecks, then `vite build`)
- Dependency check: `npm outdated` — versions are pinned exactly on purpose, so nothing refreshes on its own

Every Vite-invoking script passes `--configLoader native`, so use the npm scripts rather than bare `npx vite`
or `npx vitest` — see [package.json-comments.md](package.json-comments.md).

A change is not done until `npm run test:run`, `npm run typecheck`, and `npm run lint` are all clean.

## Stack

React 19 · TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`) · Vite · Tailwind 4 + daisyUI ·
react-i18next · jotai · react-router · OIDC via `oidc-client-ts` + `react-oidc-context`.
Tests: Vitest + `@testing-library/react` on jsdom.

`@/` is the alias for `src/` (tsconfig + Vite). Source is indented with **tabs**.

ESLint 10 runs a **plain flat config** (`eslint.config.js`, ESM) — no `FlatCompat`, no `@eslint/compat`, no
`@eslint/eslintrc`. React lint rules come from `@eslint-react/eslint-plugin` and `@stylistic/eslint-plugin`;
`eslint-plugin-react` is deliberately absent (it has not supported ESLint 10 since v7.37.5, April 2025 — don't
reintroduce it). `no-leaked-conditional-rendering` is type-aware, hence `projectService: true` in the config.

Version pins and `overrides` entries in `package.json` are not self-explanatory and JSON takes no comments, so
every deliberate pin or hold-back is justified in **[package.json-comments.md](package.json-comments.md)** —
read it before changing a version or dropping an override, and record the reasoning (with a date) when you add one.

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
  layout/            AppLayout + routeTitle.ts (page-title lookup)
    components/      TopBar, BrandLogo, PageTitleBand, FundingStrip, SiteInfoStrip
  pages/ routes/
```

**The `src/components/` rule is objective:** a component belongs there **iff it imports nothing from a
feature folder**. The moment it imports from a feature, it belongs under that feature's `components/`.

Tests are co-located next to what they test and use relative imports (`./X`) so they move with the file.

## Visual design

The UI follows **<https://tealhelix.eu/about-tealhelix/>** (a Divi site). Every value below was read from
that site's CSS, so there is no need to re-scrape it. The chrome is: a 66px top bar (logo left, nav right),
a page-title band, then the page, then two footer strips.

| | |
|---|---|
| Deep blue | `#0e4c6d` — headings, nav links, gradient start |
| Teal | `#0d7b7d` — links, active nav, gradient end |
| Muted teal | `#54a1a2` — site-info strip |
| Green / pale green | `#7cbf95` (band eyebrow at 10%) · `#e4ebc1` (funding strip) |
| Orange · off-white | `#f69560` · `#f4f4f4` (band title) |
| Body type | 400 / 16px / `lh 1.7` / `font-stretch 100%` |
| Headings | 500 / `lh 1` / `ls 1px` / `#0e4c6d` / `font-stretch 75%`; h1–h6 = 30·26·22·18·16·14px |
| Column | 80% wide, capped 1200px (`site-column`; widened to 92% below `md`) |
| Nav items | 18px / 600, `#0e4c6d`, active `#0d7b7d` |
| Title band | brand gradient + one oversized arc motif at 5%; eyebrow 900/40px uppercase watermark, title 34px with a `.05em` blue shadow |

Brand colours are `@theme` tokens (`brand-blue`, `brand-teal`, …) **and** feed a custom daisyUI theme named
`tealhelix`, so `btn`/`card`/`base-*` inherit them. daisyUI's own themes are switched off (`themes: false`),
and because a custom theme *replaces* rather than extends, that block must list every token it needs —
including the radius/size/border/depth ones. `site-column`, `title-band` and `title-band-pattern` are
`@utility` definitions in `src/index.css`.

The logo is three SVGs shown in order — `hib.svg`, `logo.svg`, `th.svg` — revealing progressively: the mark
alone below `md`, plus the HowiBuy wordmark from `md`, plus the TealHelix wordmark from `xl`. They carry
their own spacing, so they sit flush.

Each route names its band title via `handle: { titleKey }` in `src/routes/router.tsx`; `useRouteTitleKey()`
picks the deepest match that declares one, and the band is omitted when none does. Pages therefore do not
render their own `<h1>`.

**Type deviates from the brand on purpose:** the site uses Barlow, which has no Greek subset, so this app
uses Roboto's variable width axis for both roles. See
[package.json-comments.md](package.json-comments.md). Whoever owns the TealHelix brand should be told.

Deliberately *not* copied from the site: social links, the scroll-to-top control, the cookie widget.

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

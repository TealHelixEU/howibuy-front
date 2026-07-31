# Comments about the package.json

Since JSON does not allow comments and since `package.json` is central for any JS project and the
heart of its configuration, let's keep here any comments, decisions, design notes etc.


## Versioning policy - 25/07/2026

Every version is pinned exactly; no `^` or `~` ranges. `.npmrc` sets `save-exact=true`, so `npm install <pkg>`
keeps new entries that way without anyone having to remember.

The lockfile is committed and the Docker image builds with `npm ci`, so ranges would buy no reproducibility —
they would only let versions move without leaving a trace in the `package.json` diff. Pinning makes every
upgrade a deliberate, reviewable edit. When the policy was adopted, 10 of the 15 caret-ranged entries were
already resolving above their declared floor (`vite` was declared `^8.1.0` and running 8.1.5), which is exactly
the drift the pins make visible.

The cost is that nothing refreshes on its own, so re-check regularly:

```bash
npm outdated              # what has moved
npx npm-check-updates -i  # pick and apply, then run the full gate
```


## The `typecheck` script - 30/07/2026

`typecheck` runs `tsc` twice, once per project, rather than the shorter `tsc -b --noEmit`:

```
tsc -p tsconfig.json --noEmit && tsc -p tsconfig.node.json --noEmit
```

The two invocations are needed because the sources are split across two projects: `tsconfig.json` covers
`src`, and `tsconfig.node.json` covers `vite.config.ts`. Outside build mode `tsc` does not follow the
`references` entry, so a bare `tsc --noEmit` checks `src` alone and a type error in the Vite config goes
unreported — hence naming each project explicitly.

Build mode (`tsc -b --noEmit`) looks like the shorter way to check both and cannot work here: it requires
every project it builds to set `composite: true`, and then refuses `--noEmit` for those projects (`TS6310`)
because it needs their declaration output. Removing `composite` to satisfy the second demand only violates
the first (`TS6306`). Emitting for real would mean an `outDir` full of generated files for a config that
nothing imports. Two `-p` runs cost one extra process and check exactly the right files.

### `composite` and `references` are load-bearing

The `references` entry in `tsconfig.json` and the matching `composite: true` in `tsconfig.node.json` look
redundant, since nothing under `src` imports `vite.config.ts` and `typecheck` names both projects anyway.
They are there for **typescript-eslint**: its project service only auto-discovers files named `tsconfig.json`,
and reaches `tsconfig.node.json` by following the reference. Without it every type-aware rule fails on the
config file with

```
0:0  error  Parsing error: vite.config.ts was not found by the project service
```

TypeScript in turn requires a referenced project to be `composite` (`TS6306`), so the two settings stand or
fall together. Removing them means telling ESLint about the file some other way — `allowDefaultProject`, or
folding `vite.config.ts` into `tsconfig.json` — which works but buys nothing.


## `--configLoader native` on every Vite script - 30/07/2026

`native` makes Node load `vite.config.ts` directly as an ES module. The default (`bundle`) first bundles the
config with Rolldown, which quietly permits things ESM does not have — `__dirname` being the one that bit us.
Vite plans to make `native` the default in a future major, so opting in now turns those incompatibilities
into failures we see today rather than during an upgrade.

The flag is repeated on `dev`, `build`, `preview`, `test`, `test:run` and `coverage` because it cannot be set
anywhere central: it decides *how the config file is loaded*, so it lives on `InlineConfig` and not in
`vite.config.ts` itself, and there is no env-var equivalent (`VITE_CONFIG_NATIVE_IGNORE_WARNING` only
silences the compatibility warning). Bare `npx vite` or `npx vitest run` therefore still use the default
loader — prefer the npm scripts.

It is marked experimental in Vite 8.2.0. Verified there: production build (byte-identical output to the
default loader), the Vitest suite, and dev-server linting through `@nabla/vite-plugin-eslint`.


## `@fontsource-variable/roboto` - Roboto, not the brand's Barlow - 31/07/2026

The UI follows tealhelix.eu, which sets body text in **Barlow** and headings in **Barlow Condensed**.
Neither is used here, and the reason is coverage, not taste: both families ship only
`latin`, `latin-ext` and `vietnamese`. **There is no Greek subset, and no Cyrillic.** The app is going
multilingual and the project pilots in Greece, so Greek text would have silently fallen back to
Helvetica mid-page. Adding a Greek-only `unicode-range` override on top of Barlow was the alternative;
switching outright was chosen instead. Roboto is the closest match in character among the families that
cover Greek, and it covers Cyrillic too.

Two consequences worth knowing before anyone "tidies" the import in `src/index.css`:

```css
@import '@fontsource-variable/roboto/wdth.css';
```

- **`wdth.css`, not `index.css`.** The `wdth` build carries the width axis (`font-stretch: 75% 100%`)
  as well as the full weight range (`font-weight: 100 900`). That width axis is what replaces Barlow
  Condensed: `font-stretch: 100%` for body, `75%` for headings. Import the plain `index.css` and every
  heading silently renders un-condensed.
- **All subsets, on purpose.** Fontsource also publishes per-subset files (`latin-400.css` and friends).
  Do **not** narrow the import to those — that reintroduces exactly the gap we left Barlow over. It costs
  nothing to keep: the file declares one `@font-face` per subset with its own `unicode-range`, so an
  English page still downloads only `latin`. All nine subset files are emitted at build time and fetched
  on demand.

One dependency, one import, every weight and both widths, in every locale.

Note that this makes the app and the website disagree on type. That is a brand decision beyond this
repo — see the note in `CLAUDE.md`.


## Held back

Document any packages that are deliberately held back.

Format is the following - update the date every time you re-assess:

> ### package-name - dd/mm/yyyy - pinned version - newest version
>
> Reasoning...

### typescript - 25/07/2026 - 6.0.3 - 7.0.2

TypeScript 7.0 is the native (Go) compiler and **ships no programmatic API at all** — that returns in 7.1.
typescript-eslint refuses to load against it outright (`typescript-eslint does not support TS 7.0`), which takes
the whole lint step down, type-aware rules and all. It is not a version-range quibble that an override could
paper over: no released or prerelease typescript-eslint supports TS 7, and the maintainers put it 1-2 major
releases away ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).

TS 7 *can* be run today alongside a TS 6 API package, per Microsoft's documented side-by-side layout
(`"@typescript/native": "npm:typescript@7.0.2"` for the `tsc` binary plus
`"typescript": "npm:@typescript/typescript6@6.0.2"` for what tools import). That was tried and it works: lint
stays green, both compilers flag the same errors, and `tsc` gets ~3.4x faster (0.21s vs 0.71s on this codebase).

It was reverted anyway. Half a second on a project this size does not pay for two compilers in the tree, two sets
of type semantics (lint checking with TS 6 while the build checks with TS 7), a `tsc`/`tsc6` split that every
contributor has to learn, and an IDE caveat — the TS 6 API package has no `lib/tsserver.js`, so editors told to
use the workspace TypeScript find no language service.

**Revisit when TypeScript 7.1 ships the new API and typescript-eslint supports it.** At that point this becomes
an ordinary version bump of a single `"typescript"` entry, with no aliases and no split.


## Pinned

Document any packages that are pinned by overrides. Format and instructions are the same as for "Held back".

### unrs-resolver - 25/07/2026 - 1.11.1 - 1.12.x

Every 1.12.x release breaks `@/*` tsconfig-path resolution inside `eslint-import-resolver-typescript`,
which turns every aliased import into a phantom `import-x/no-unresolved` error. Keep the pin until a
1.12.x resolves aliases again.

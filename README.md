# Tarun Pradeep B — Portfolio

Cloud Engineer / DevOps portfolio built around the **Reliability Spine**
(`Commit → Build → Test → Container → Network → Cloud → Observe → Recover`) —
a real piece of information architecture, not decoration. Next.js App Router,
TypeScript, Tailwind v4, GSAP, React Three Fiber for the hero signature.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Verification

```bash
npm run verify     # lint + typecheck + unit tests + production build, chained
npm run test:e2e   # Playwright, against a production build (auto-builds + starts on :3100)
```

Individually: `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run test:watch`.

## Production preview

```bash
npm run build
npm run start -- -p 3200
```

## Project structure

- `app/` — routes (`/`, `/work`, `/work/[slug]`, `/about`, `/resume`, `/contact`), plus `sitemap.ts`, `robots.ts`, `icon.tsx`, `opengraph-image.tsx`, `not-found.tsx`.
- `components/` — organized by domain (`hero/`, `spine/`, `work/`, `about/`, `contact/`, `layout/`, `ui/`, `shared/`).
- `content/` — all site copy and data as typed TypeScript, not hardcoded in components. See **Editing content** below.
- `lib/` — motion tokens/hooks, Three.js helpers, SEO metadata builder.
- `tests/unit/` — Vitest + React Testing Library. `tests/e2e/` — Playwright.
- `scripts/` — standalone Playwright scripts for screenshotting routes/breakpoints outside the test suite (used during development, not part of `npm test`).

## Editing content

Everything factual lives in `content/*.ts` as typed data — never hunt through
component files to change copy.

**Adding or editing a project** — `content/projects.ts`. Flagship projects
(`kind: "flagship"`) get a full case-study page at `/work/[slug]`; lab
projects (`kind: "lab"`) are compact entries on the home page and `/work`
index only. To add a flagship project, copy an existing entry's shape and
give it a unique `slug` — the `/work/[slug]` route picks it up automatically
via `generateStaticParams`, no route file changes needed.

**Fields that are genuinely missing** — wrap the value as `{ status:
"needs-input", note: "..." }` instead of leaving it blank or guessing (see
`content/types.ts`'s `Field<T>` type). Nothing renders a public "Needs
input" callout — components simply omit the unavailable control instead of
announcing the gap, and the gap itself is tracked in `CONTENT_GAPS.md`.
Once real data exists, replace it with `{ status: "ready", value: ... }`
and remove the corresponding line from `CONTENT_GAPS.md`.

**Project screenshots** — a flagship project's `screenshot` field is a
`Field<{ src: string; alt: string }>`. Drop the image in `public/` and set
`{ status: "ready", value: { src: "/your-image.jpg", alt: "..." } }`. Until
then it renders code-generated architecture cover art
(`components/work/ProjectCoverArt.tsx`, built from the project's own real
`flow` string) — never a stock mockup.

**Experience** — `content/experience.ts`. `achievements` is a `Field<string[]>`
per role, for the same reason (the Stackly role currently has none supplied).

**Education** — `content/education.ts`, plain array, no Field<> wrapping (all
facts are known).

**Certifications** — `content/certifications.ts`. `issuerLink` and
`credentialId` are each `Field<string>` — most are currently `needs-input`.

**Skills taxonomy** — `content/skills.ts`, grouped by engineering domain. No
percentage bars or ratings by design (see the master build spec, §8).

**Site-wide facts** (name, email, GitHub/LinkedIn URLs, hero copy, about
narrative, résumé file) — `content/site.ts`. The `resumeFile` field is
currently `needs-input`; once a corrected-timeline PDF exists, drop it in
`public/` and set it to `{ status: "ready", value: { href: "/resume.pdf" } }`
— the `/resume` page and the hero's secondary CTA both pick it up automatically.

**Reliability Spine stages** — `content/spine.ts`. Each flagship project's
`spineStages` array (in `content/projects.ts`) references stage ids from
here; keep them in sync if a stage id ever changes.

## Deployment

Not yet deployed — no Vercel credentials are configured in this environment.
Once you have a Vercel account linked:

```bash
npx vercel login
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

Before deploying, update `content/site.ts`'s `url` field to the real
production domain (it's a placeholder right now) — this feeds the sitemap,
canonical metadata, and Open Graph tags.

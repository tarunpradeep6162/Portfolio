# Visual Audit — v2 (pre-rebuild baseline)

Reviewed from rendered screenshots (`/home/tarun/screenshots/visual-rebuild-v2/baseline/`)
at 375/768/1440px, all four primary routes. Not judged from source — from what
a visitor actually sees.

## Verdict

The site is structurally sound and factually honest, but reads as **internal
engineering documentation**, not a portfolio. Every section — hero, work,
spine walkthrough, capabilities, experience, certifications, lab — follows
the exact same rhythm: small accent-colored eyebrow, modest heading, a block
of content, then a large gap before the next identical block. Nothing about
the page tells you it was made *specifically* for a cloud/DevOps engineer
named Tarun Pradeep; the same template would hold together fine with the
copy swapped for any other technical profile. That sameness — not any single
element — is the core problem.

## Specific findings, by section

**Hero** — Headline occupies roughly a quarter of the viewport height, with
the remaining three-quarters left as unstructured dark space around it and
around the 3D topology. The topology itself reads as a handful of orange/blue
dots connected by a thin line — decorative, not "architectural cartography."
Immediately below the CTAs, the exact same 8-node topology repeats a second
time (the accessible fallback), so the very first thing a visitor scrolls
into is a near-duplicate of what they just saw.

**Selected Work** — Four identical bordered, rounded-corner cards in a 2×2
grid. All four show the literal text "NEEDS PROJECT SCREENSHOT" centered in a
large empty box — on the case-study page itself this box is roughly 720px
tall, meaning the single most prominent element on each project page is an
admission that the asset is missing. This is the single biggest issue on the
site.

**Reliability Spine walkthrough** — The same 8-node component from the hero,
rendered a *third* time on the home page, with no new information attached
(no connection back to which project uses which stage). Pure repetition.

**Capabilities** — Five columns of pill/badge chips, functionally a tag
cloud. No visual hierarchy between a core AWS skill and a minor one.

**Experience** — Plain reverse-chronological list, acceptable structurally,
but the Stackly entry publicly shows the literal string "Needs input:
detailed responsibilities..." — a visible admission of an incomplete
profile, directly in front of any recruiter.

**Certifications** — Bordered card grid, several with a second visible
"Needs input: issuer link / credential ID" line — same problem as above.

**Engineering lab** — A third instance of the bordered-card-plus-badges
pattern already used for Work and Capabilities.

**Mobile (375px)** — All of the above compounds: card after card after card
in a single column, spine repeated three times vertically, very little
sense of a designed reading path versus "stack everything and scroll."

## Patterns to eliminate (confirmed present)

- Repetitive rounded/bordered cards — Work grid, Certifications, Lab
- Repeated badge/pill collections — Capabilities, Lab, project tag rows
- Identical section structure repeated ~8 times top to bottom
- Small headings surrounded by large empty space — hero, every section header
- Publicly visible "Needs input" text — Stackly experience, 4 certifications
- Publicly rendered "Needs project screenshot" placeholder — all 4 case studies
- The same component (ReliabilitySpine) repeated 3× on one page with no
  differentiation between instances
- No full-bleed or asymmetric moment anywhere on the page — every section is
  centered, contained, and the same width

## What's *not* wrong (keep these)

- No purple gradients, no glassmorphism, no fake terminals, no fake metrics —
  the content itself is honest and specific
- Typography is legible and the mono/sans pairing is functional, just not
  distinctive yet
- The underlying data model (`content/*.ts`, `Field<T>`) is sound — the
  rebuild changes *rendering*, not the facts
- Accessibility (skip link, keyboard nav, reduced-motion, focus states) all
  verified working — must not regress

## Direction for the rebuild

Replace the uniform "eyebrow → heading → block → gap" rhythm with genuine
scale and layout variance per section. Give the topology one real job (the
Infrastructure Atlas, spec §3) instead of three redundant appearances.
Replace the two biggest visible failures first — the empty screenshot boxes
and the public "Needs input" text — since those are the most damaging to
first impression and the easiest to fix outright.

## Typography decision (Step 3-4)

Tested three pairings, rendered side by side at `/font-test` (screenshot:
`/home/tarun/screenshots/visual-rebuild-v2/font-test.png`):

- **A — Big Shoulders / IBM Plex Sans / IBM Plex Mono.** Extremely condensed
  industrial-signage feel. Thematically strong (blueprint/nameplate), but
  the condensation risks feeling cramped at the huge "TARUN PRADEEP" hero
  scale the brief calls for.
- **B — Space Grotesk / Source Serif 4 / JetBrains Mono.** Rejected. Space
  Grotesk has become a common "safe distinctive" choice across dev/SaaS
  sites in the last couple of years - closer to the cliché this rebuild is
  trying to move away from than a genuine differentiator.
- **C — Archivo Black / Public Sans / Space Mono. Selected.** Archivo Black
  has real authority at large display sizes without cramping. Public Sans
  is USWDS's own typeface - literally built for government/civic-infrastructure
  clarity and trust, which fits Tarun's reliability-and-security narrative
  more specifically than a generic tech-startup face. Space Mono gives data
  labels and the spine's stage names a geometric, technical character.
  Neither face is one of the AI-generation defaults (no Inter, no Fraunces/
  Instrument Serif, no Space Grotesk-as-safe-choice).

Applied across `app/layout.tsx` and `app/globals.css` (`--font-display`,
`--font-body`, `--font-mono` tokens), replacing the previous Bricolage
Grotesque / IBM Plex Sans / IBM Plex Mono system.

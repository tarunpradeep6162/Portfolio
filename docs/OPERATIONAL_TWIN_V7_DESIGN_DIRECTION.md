# Operational Twin V7 — Design Direction

## Existing V6 material language (audited from `app/globals.css`, not assumed)

V6 already has a real, working, two-mode material system — not a blank
slate:

| Token | Value | Current role |
|---|---|---|
| `--color-control-black` | `#06090d` | Primary dark surface ("Control" mode) |
| `--color-control-raised` | `#0d1218` | Raised dark surface |
| `--color-blueprint-navy` | `#111d2a` | Structural/secondary dark |
| `--color-cloud-linen` | `#eeefe8` | Primary light surface ("Field"/manual mode, via `[data-field="manual"]`) |
| `--color-cloud-white` | `#f8f8f3` | Raised light surface |
| `--color-systems-ink` | `#111820` | Light-mode text |
| `--color-signal-lime` | `#d8ff4f` | Accent — focus rings, selection, RC-01 scan/highlight |
| `--color-packet-blue` | `#748cff` | Secondary accent |
| `--color-signal-coral` | `#ff6847` | Warm/warning signal |
| `--color-telemetry-steel` | `#8996a3` | Muted text, structural lines |

Fonts: **Syne Variable** (display), **Manrope Variable** (body), **IBM Plex
Mono** (commands/metrics/IDs — already restricted to that role, matching
§8's "monospace only for commands, metrics, IDs" requirement exactly).

There is already a meaningful **Control ↔ Field** duality (`:root` = dark
"Control Room"; `[data-field="manual"]` = light "Field/manual" mode) — this
is real, specific existing material, not a generic dark-mode toggle. V7
should extend this duality, not discard it for the spec's suggested
starting palette wholesale.

### Token mapping decision

The master spec's suggested tokens (§8) are a *direction*, not a palette to
paste in. Mapped deliberately against what already exists:

| V7 semantic need | Decision | Reasoning |
|---|---|---|
| Verified/healthy state | Reuse `--color-signal-lime` | Already fills exactly this role (focus, selection, "this is active/correct") — introducing a second green would dilute an existing, working signal. |
| Data movement / System Trace | Reuse `--color-packet-blue` | Already named for this concept and already used as the secondary accent. No new token needed. |
| Evidence: "explained" (new third Proof Ledger state — V6's `Field<T>` only had ready/needs-input) | New token `--color-relay-cyan: #6FD3E0` (dark) / `#0A6070` (light-mode-safe) | Needs its own identity distinct from both "verified" (lime) and "missing" (below) — informational, not alarming. Cyan sits clearly apart from lime/blue/coral in hue. |
| Incident / limitation / missing evidence | New token `--color-incident-amber: #F2AD4E` (dark) / `#8A5A12` (light-mode-safe) | V6's existing `--color-signal-coral` reads as hard error/danger; Proof Ledger's "missing" state needs to read as "attention, not broken" — amber is the correct, distinct signal. Coral is preserved for genuine failures. |
| Recovery / rollback / historical (replay) state | New token `--color-recovery-violet: #9C8CFF` (dark) / `#5B3FD1` (light-mode-safe) | Genuinely new concept V6 never needed — Deployment Replay and Time Machine's "past stage" view need a visual identity distinct from "live." No existing token overlaps this hue. |

Three new tokens, not six — the other three semantic needs are already
served by what exists. Every light-mode value above was checked against
`--color-cloud-linen` (`#eeefe8`) with the real WCAG relative-luminance
formula, not eyeballed: relay-cyan 6.21:1, incident-amber 5.11:1,
recovery-violet 5.90:1 — all clear the 4.5:1 AA threshold for normal text
with margin, not just the 3:1 large-text/UI threshold.

## Three original design directions

### Direction A — "Instrument Deck"

The Operational Twin as a small cluster of large, legible physical
instruments — not a screen full of gauges, four or five real indicators
(one per thing that actually matters: build status, network posture, cloud
capacity, observability signal, recovery readiness). System Trace makes the
relevant instrument respond — a needle moves, a relay clicks over, a panel
segment lights — rather than everything reacting at once. Extends V6's
existing "Control Room" metaphor (the token names already say `control-*`)
literally: this *is* the control room the tokens were always describing.
Each project world's instrument cluster is generated from its real
`spineStages` array — Aurora shows 4 instruments, Jenkins shows 3 — so the
visual complexity is honest, not padded to look uniform.

**Risk and mitigation**: this is the direction most likely to slide into
"sci-fi HUD" if over-decorated. Mitigation is structural, not stylistic:
cap instrument count at what the real content supports (never invent a 5th
gauge to fill space), keep every label full-size and legible at a normal
viewing distance, and ban any readout that doesn't correspond to a real,
verifiable fact.

### Direction B — "Circuit Relay"

The Operational Twin as an inspection-camera view of a physical relay
board — nodes are junction points, edges are traced copper-colored
pathways, and System Trace is a literal current pulse traveling the board
in real time. Leans hard into `--color-packet-blue` as literal wire color.

**Risk**: closest of the three to "generic dark DevOps dashboard with
glowing lines" if the camera work and node design aren't unusually
restrained and specific — the underlying shape (nodes + traced edges) is
already close to what a hundred other infra-adjacent marketing sites do,
and the spec's reject-list names this pattern directly ("sci-fi HUD... tiny
unreadable labels" is exactly what this direction becomes under time
pressure).

### Direction C — "Pressure Map"

Infrastructure as a topographic/pressure-contour surface; incidents are
visible pressure fronts that visibly resolve as they're fixed — the most
literal reading of "Cloud infrastructure becoming understandable under
pressure."

**Risk**: the strongest single line, the weakest system. A weather metaphor
doesn't map cleanly onto `commit/build/test/container/network/cloud/
observe/recover` — forcing eight real delivery stages into "pressure
fronts" would require inventing a translation layer that doesn't correspond
to anything real, directly conflicting with §8's design thesis ("a
precisely engineered object whose internal state is visible," not a poetic
abstraction) and with the honesty requirements in §15.

## Selection: Direction A — "Instrument Deck"

**Chosen because it's the only one of the three that is simultaneously**:
(a) an extension of material that already exists and is already named for
this exact purpose (`control-black`, `control-raised`), satisfying "preserve
and evolve, rather than rebuild"; (b) structurally honest — instrument
count is derived from real `spineStages` data, so it cannot be padded or
faked, directly serving the evidence-honesty requirements in §15; (c) the
easiest of the three to keep restrained under the rendering-discipline
budget in §11 (a handful of large instanced meshes, not a dense particle
field or a large node/edge graph); (d) specific to *operations*, not to
infrastructure diagrams in the abstract — it reads as "the control room
Tarun actually watches," not as a stock network-topology visualization.

Direction B was the closest runner-up and remains a reasonable fallback if
Instrument Deck's per-project instrument variety proves visually
repetitive during implementation — but it's not being built as a parallel
system now; if a pivot is ever needed it will be a deliberate, documented
decision, not a silent one.

## Typography roles (confirmed, not changed)

- **Syne Variable**: display role — hero statement, section titles.
- **Manrope Variable**: body role — case-study prose, descriptions.
- **IBM Plex Mono**: commands, metrics, IDs, real system states only (System
  Trace stage labels, Proof Ledger status tokens, RC-01 console). Never used
  for a general heading.

No new font is being added. The existing three already satisfy every V7
typography requirement in §8; adding a fourth would cost font budget
(§12: "no more than +5% over V6 font baseline; prefer no increase") for no
demonstrated need.

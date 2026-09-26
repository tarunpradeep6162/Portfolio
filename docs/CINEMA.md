# Cinema layer

The site is directed like a film. Everything below is decorative and
progressive: reduced motion, low-power mode, missing WebGL and automation
(unless a test opts in with `?cinema=1`) all get the complete static site.

| Phase | What | Where |
| --- | --- | --- |
| 1 Film grade | Bloom + grade pass (grain, vignette, chromatic aberration, focus pull) on the 3D stage; CSS grain + vignette over 2D | `components/cinema/StageCanvas.tsx`, `FilmGrain.tsx` |
| 2 Persistent stage | One fixed canvas behind every page, subjects anchored to `[data-stage-anchor]` elements; dark sections with `.cinema-window` become windows onto it; pauses when RC-01/Atlas own the GPU | `CinemaStage.tsx`, `lib/cinema/stageStore.ts` |
| 3 Motion language | Shots: push / reveal / cut / settle / hold, as CSS `--ease-*` and GSAP `cinema.*` eases | `lib/motion/tokens.ts`, `lib/motion/gsapConfig.ts` |
| 4 Sound | Synthesized WebAudio drone, ticks, whooshes, impacts; off by default | `lib/cinema/sound.ts`, `SoundToggle.tsx`, `SoundBridge.tsx` |
| 5 Cold open | CSS title sequence, once per session, skippable | `components/shared/BootSequence.tsx` |
| 6 Hero shot | RC-01 in the Observatory: volumetric beam, floor rings, dust, dolly-and-pan on scroll | `StageCanvas.tsx` (`HeroSubject`) |
| 7 Kinetic type | Per-letter variable-weight name, pointer weight lens, reveal shots, scroll-velocity skew | `KineticName.tsx`, `VelocitySkew.tsx`, `SplitReveal.tsx` |
| 8 Camera path | Anchored subjects + focus pull + push-in when framed = one continuous take | `StageCanvas.tsx` (`Director`) |
| 9 Spine sequence | Scroll scrubs a simulated release; alert at Observe, recovery at Recover; 3D light column in sync | `components/spine/useReleaseRun.ts` |
| 10 Atlas film | Fly-through, failure, reroute, recovery; letterboxed | `components/atlas/AtlasSpatialScene.tsx` |
| 11 Case-study films | Cover push-in, count-up facts, chapter rail, before/after wipe | `components/work/film/*` |
| 12 Letterbox & slates | Chapter cards between acts; global letterbox via the cue bus | `ChapterSlate.tsx`, `Letterbox.tsx`, `lib/cinema/cues.ts` |
| 13 RC-01 performance | Walk-in, glitch cuts on mood change, points toward targets, voice-lit visor | `components/companion/RC01Model.tsx` |
| 14 Director mode | Tours letterbox the site with a shot slate; each step lands as a cut | `CompanionExperience.tsx` |
| 15 Likeness slot | `NEXT_PUBLIC_AVATAR_HEAD_URL=/avatar/head.glb` attaches a sculpted head to the rig | `lib/avatar/headModel.ts` |
| 16 Transitions | Diagonal wipe with a lime edge + camera whip; card-to-cover shared-element morph | `RouteTransition.tsx`, `lib/cinema/flip.ts` |
| 17 Cursor | rAF cursor with ring, scanner reticle over 3D, magnetic buttons, hover light | `components/shared/CustomCursor.tsx` |
| 18 Reactive world | Local time-of-day lighting moods; Atlas traffic follows live GitHub activity | `stageStore.ts` (`MOODS`), `lib/cinema/useGitHubPulse.ts` |
| 19 Performance | Idle-loaded stage (after the cold open), adaptive quality steps, no rendering when nothing shows through, curated still for no-3D visitors | `CinemaStage.tsx`, `StageCanvas.tsx` |
| 20 Trailer & credits | Recorded site trailer (`public/trailer/`), og:video, end-credits roll | `TrailerButton.tsx`, `EndCredits.tsx` |

Re-record the trailer: build, `next start`, then script a Playwright run with
`recordVideo` (see git history of this file's commit for the script).

# darkroom — Build State

Snapshot for a fresh Claude session to resume cleanly. **Last updated 2026-05-07** — recording / WAV-export feature was completely removed for legal reasons (capturing copyrighted source audio is the obvious risk; darkroom is now strictly a real-time processor with no path that writes audio to disk). Prior 2026-05-06 update covered Phase 5 export (now removed), real CC0 IRs, the Saturn tape-deck redesign, knob position ticks, and the LFO module extraction.

## TL;DR

- **Working file:** `darkroom.html` at the repo root.
- **Frozen reference:** `darkroom-dark.html` — old dark/forest aesthetic snapshot, untouched.
- **Worklets:** `darkroom/lib/soundtouch-processor.js` (stream tempo/pitch), `darkroom/lib/beat-repeat-processor.js` (freeze loops, OB-4 model), `darkroom/lib/scratch-processor.js` (turntable scratch), `darkroom/lib/sampler-buffer-processor.js` (60s rolling tap for sample-finding). The recorder worklet was deleted 2026-05-07 along with all WAV-export plumbing.
- **Real CC0 IRs:** `darkroom/irs/01-wood.wav` … `08-cave.wav` (1.1 MB total, mono 16-bit @ 48kHz, trimmed + normalized). Plate (02) and spring (03) stay procedural — they're gear, not rooms. Attribution at `darkroom/irs/ATTRIBUTIONS.txt`.
- **Local dev:** `python3 -m http.server 8765` from the worktree root → Chrome → `http://localhost:8765/darkroom.html`. Localhost is required for `getDisplayMedia`.
- **Worktree:** `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/elastic-swartz-30b73e`. Branch `claude/elastic-swartz-30b73e`. **Pushed to `main` regularly this session** — Jackson approves each push.
- **Live URL:** https://jacksonalexanderstudio.com/darkroom.html (PLAY mode default; `?studio` query reveals the studio toggle).

## Mode toggle (top-right of masthead)

The page operates in two modes, set by `data-mode` on `<body>`, persisted in `localStorage:darkroom:mode`. Default `play`.

- **PLAY** (default) — minimal audio-manipulation surface. Visible: source picker, master pod, sampler (tape + wave panel + BEAT REPEAT), FX rack.
- **`darkroom.studio` (beta)** — full production toolkit. All sections visible. **Locked by default on the public deploy** — append `?studio` to the URL to reveal the toggle. (Jackson chose a soft URL gate; no password — just hides the studio mode from casual visitors. Set in JS via `STUDIO_UNLOCKED = URL.has('studio')`, `<body class="dr-studio-locked">` toggles a CSS rule that hides the .studio mode pill.)

Switching to PLAY calls `DR.clock.stop()` to prevent ghost playback from a hidden sequencer.

## Page layout (top → bottom)

1. **Masthead** — `darkroom.ja` wordmark left, `[PLAY | darkroom.studio (beta)]` mode toggle + `v0.1` meta right. Studio toggle hidden when `dr-studio-locked` class is on `<body>`.
2. **Source picker** — 3 horizontal pills (TAB / DEVICE / FILE), each with a 2-word subtitle ("browser audio" / "system input" / "drop or browse").
3. **Global action bar** — RELEASE pill (A/B kill — bypasses all FX, restores prior state on disengage) + CLEAR ALL button (resets every FX module's knobs + bypass states to defaults, plus SCREW back to 1.000×, plus clears the RELEASE stash).
4. **TOP ROW** — three cards inline at the same top edge:
   - **Master pod** (left, ~280px) — source label + level meter + PRE/POST/GR meters + OUT knob. Soft limiter at -1 dBFS, 20:1.
   - **Tape deck card** (middle) — `.dr-tape-deck` bordered card with **digital Saturn** scratch artifact (replaced the Braun-style record disc 2026-05-06). See "Saturn deck" section.
   - **Wave/sample panel card** (right, flex:1) — Contains:
     - **Meta strip** (3-col grid `1fr auto 1fr`): SOURCE on left; [SCREW knob (64px) + REVERSE pill] truly centered; ELAPSED / BPM (with TAP button stacked under the value) / RATE cluster right-aligned.
     - **Waveform** (60s rolling buffer, 1024 peak columns, BPM bar grid overlay, playhead pip on right).
     - **BEAT REPEAT tool row** (label + amber trigger LED + 7 division pills: OFF / 1/32 / 1/16 / 1/8 / 1/4 / 1/2 / 1/1). Clicking a non-OFF division **auto-un-bypasses** beat-repeat (PLAY mode has no separate bypass UI for it).
     - (CREATE-only) Sampler controls (FREEZE/PREVIEW/ASSIGN), 8 sample pads (4×2 grid), 4 sample-pad ADSR knobs.
5. **Sample sequencer** (CREATE-only) — 8 rows × 16 steps. Subscribes to `DR.clock`.
6. **Instrument rack** (CREATE-only) — 2-col: 8 drum pads (left) + synth (right).
7. **Drum sequencer** (CREATE-only) — 8 rows × 16 steps. Header has PLAY/STOP + SWING + CLEAR.
8. **FX rack** (`.dr-rack`) — CSS Grid **6 columns** at desktop (6 → 3 → 2 → 1 responsive). **6 modules: EQ → FILTER → PHASER → LFO → DELAY → REVERB.** Each module is a pill-shaped tactile card (rounded `--r-xl`, cream gradient face, 1px border, soft drop shadow). Active state (un-bypassed) uses matte-black brushed look. Bypass dot stays moss.
9. *(no transport / export — removed 2026-05-07)*

Hero section titles (`.dr-section`) are globally hidden via `display: none`.

## Audio chain

```
source ─→ [soundTouch worklet, when SCREW ≠ default on streams] ─→ sourceGain ─→ scratchIn
                                                                                       ↑
                                                                                    padBus ←─ drum pads + synth + sampler PREVIEW + samplePadBus
                                                                                       ↑
                                                                                    samplePadBus ←─ sample pad voices (per-voice gainEnv ADSR)
                                                                                       ↑
                                                                                    synthBus → synthAnalyser → synth voices

scratchIn → [scratch worklet OR bridge] → scratchOut → samplerBuffer → inputAnalyser
        → eqLow → eqMid → eqHigh → filter → phaser → beatRepeat
        → delay (dry|line→tone→wet) → reverb (dry|conv→wet)
        → preAnalyser → limiter (-1 dBFS, 20:1) → master → outputAnalyser → destination
```

**Order changed 2026-05-06:** EQ now sits BEFORE FILTER (mix-engineer convention — tonal shaping before color processors).

**LFO is a control-rate side-channel** — modulates filter frequency/Q via `setTargetAtTime`. Not in the audio chain.

## Saturn deck (replaces the Braun-style scratchable disc)

`.dr-tape-disc` SVG with viewBox `-160 -160 320 320`. Composition:

- **Space backdrop** — radial gradient `oklch(0.20 0.05 260)` center → `oklch(0.04 0.02 240)` edge.
- **Starfield** — ~26 small white circles scattered, every third one twinkles via CSS `@keyframes` on staggered animation-delay (no JS).
- **Static moon + glow** at upper-right (outside any rotor — stays still while Saturn spins).
- **Three `.dr-tape-rotor` groups** that rotate in lockstep via shared `transform="rotate(angle)"`:
  1. **Back ring arcs** (drawn first, behind planet) — top-half arcs of two ellipses (outer rx=132 ry=38, inner rx=104 ry=30), tilted -9°.
  2. **Planet body** — `<circle r="80">` filled with `url(#knobFace)` (the same brushed-aluminum gradient as the knobs).
  3. **Front ring arcs** (drawn last, in front of planet) — bottom-halves of the same two ellipses.
- **Audio-reactive ring brightness** — JS energy follower in `updateRingFlash()`. Reads `inputAnalyser`'s 60–4000 Hz band (PRE-FX, so kicks/bass flare regardless of EQ/filter settings). Auto-baselined against rolling avg; flare = `(current − avg) × 8`. Pulses ring stroke-width (4→10px), opacity (~0.72→1.0), and a moss drop-shadow halo (0→20px). Decays per frame at `× 0.93`.
- **Ring orbit speed = playback rate** — `ringDashPhase` accumulates each frame at `effRate × RING_BASE_SPEED × dt`. `effRate` honors scratch velocity, REVERSE state (signed), and SCREW × RATE. SCREW down → ring slows; SCREW up → ring speeds up; REVERSE → ring orbit reverses; scratch → ring tracks drag velocity.
- **`tickTape` rotation** — also negates `effRate` when `TAPE.reverseEngaged` (the whole composition reverses tumble direction in lockstep with audio).

## Recording (REMOVED 2026-05-07)

Phase 5 export (ARM/REC/STOP → 16-bit PCM WAV download) was completely ripped out for legal reasons. Capturing copyrighted source material is the obvious risk. Removal touched: `dr-trans` HTML section + CSS, `armBtn`/`recBtn`/`transStatus`/`transTime`/`transFile` DOM refs, `DR.recordedSamples`/`DR.recording`/`DR.armed`/`DR.recStart`/`DR.recInterval`/`DR.onRecorderStopped` state, the `n.recordDest` MediaStreamDestination tap, `ensureRecorder()` / `concatFloat32()` / `encodeWAV()` functions, ARM and REC click handlers, the meta description's "and recording" phrase, and the `darkroom/lib/recorder-processor.js` worklet file. Net effect: no path on the page writes audio to disk. Sampler ring buffer + waveform are local visualization only and were left in place.

## State (DR.state shape — key parts)

- `DR.state.screw / .rate / .pitch` — source manipulation. RATE + PITCH have no UI knobs (pinned at 1.0/0); only SCREW is user-adjustable. Auto-bypass on the SoundTouch worklet at all-defaults.
- `DR.state.bypassed.{filter, eq, phaser, lfo, beatrepeat, delay, reverb, tempo}` — per-module bypass state. **`lfo` added 2026-05-06.**
- `DR.state.lfo.{shape, target, sync, division, rate, depth, phase, shLast}` — LFO shape (sine/tri/saw/square/S&H), target ('cut'|'res'|'both'), free or tempo-sync, RATE knob value, DEPTH knob value, internal phase. The legacy `enabled` flag was removed — bypass replaces it.
- `DR.state.beatRepeat.{division, lastDivision, lastBypassed}` — current division + tracking state for the gate that prevents BPM jitter from re-arming the worklet.
- `DR.state.delay.{bpm, bpmTouched, division, modifier, time, sync, feedback, tone, mix}` — `bpmTouched` is sticky after manual TAP and suppresses auto-BPM writes until reset.
- `DR.state.eq.{low, mid, high}.{freq, gain, q}` — three-band EQ.
- `DR.state.phaser.{rate, depth, feedback, mix, phase}` — 4-stage allpass.
- `DR.state.samplePads.{active, env, slots}` — 8 sample pad slots (CREATE).
- `DR.state.seq.{isPlaying, currentStep, swing, pattern, samplePattern}` — drum + sample sequencer (CREATE).
- `DR.sampler.{ring, ringFrames, writePos, totalFrames, peakMin, peakMax, isFrozen, frozenWritePos, inFrac, outFrac, preview}` — rolling buffer + waveform.
- `DR.clock.{isRunning, currentStep, nextNoteTime, subscribers}` — Chris Wilson lookahead scheduler at 16th-note resolution.
- `DR.applySyncedTime` — exposed globally so the auto-BPM detector can re-sync delay timing when it locks.

## Major modules + behavior

### Master pod (top row, left)
Source label, level bar, PRE/POST/GR meters, OUT knob.

### Sampler — Saturn deck (top row, middle)
280px scratchable Saturn artifact. Worklet-driven scratching with 30s rolling buffer.

### Sampler — wave/sample panel (top row, right)
Meta strip with SCREW + REVERSE centered, BPM/RATE/ELAPSED right-aligned. **TAP button stacks below the BPM value** (vertical, in the BPM cell). 60s waveform. BEAT REPEAT tool row.

### FX rack (PLAY-visible)
Six modules. All FX module headers have header (bypass dot, name, ↺ reset, ▾ collapse) — though FX rack collapse chevrons are hidden globally so modules are always expanded in the rack. **All 30 knobs have minimal tick marks** at 0% / 25% / 50% / 75% / 100% positions, charcoal at 0.6 opacity. Ticks are static reference points (sit outside `.dr-knob-rotor`); only the indicator pointer line rotates inside the rotor group.

#### EQ
Three-band: low shelf (120 Hz default), mid bell (1 kHz), high shelf (8 kHz). FabFilter Pro-Q-style draggable handles on the curve canvas — drag a band node to change frequency (X) and gain (Y); pinch/scroll for Q.

#### FILTER
Biquad LP/HP/BP, CUT (log) + RES knobs, FabFilter-style draggable cutoff handle on the curve canvas, live spectrum overlay.

#### PHASER
4-stage allpass with internal LFO (single sweep, not user-controlled). RATE / DEPTH / FB / MIX knobs.

#### LFO (new — extracted from FILTER 2026-05-06)
Standalone modulation source. Currently targets only filter CUT/RES/BOTH (back-compat). Has its own bypass dot. When bypassed, no modulation runs. When LFO is on but FILTER is bypassed, filter-target modulations are silently skipped (otherwise `setTargetAtTime` would override the bypass-parked filter values).

UI: vis canvas, 5-shape selector (sin/tri/saw/sq/S&H), TARGET row (CUT/RES/BOTH + SYNC), free-rate or tempo-sync division grid (1/16…2/1), RATE + DEPTH knobs.

#### DELAY
Beat-synced (1/32 to 2/1 + dotted/triplet modifiers), tap tempo (in meta strip now, not here), BPM display (in meta strip), TIME (auto-syncs from BPM × division), FB, TONE (LP on feedback), MIX. Vis: simulated tap positions decaying by FB.

#### REVERB
Convolution. 8 IRs:
- **01 wood** — Falkland Palace Royal Tennis Court (real)
- **02 plate** — procedural (gear, not a room)
- **03 spring** — procedural (gear, not a room)
- **04 tape** — Stairway, University of York (real)
- **05 hall** — Jack Lyons Concert Hall (real)
- **06 chamber** — Hamilton Mausoleum (real)
- **07 cathedral** — St. Paul's Cathedral (real)
- **08 cave** — Maes Howe (real)

`loadIR()` is async — first hit on a real-IR slot fetches the WAV (~50 ms), caches in `DR.irs[slot]`. Falls back to procedural on fetch failure.

#### Master clock (`DR.clock`)
Chris Wilson lookahead scheduler. BPM from `DR.state.delay.bpm` (the canonical master tempo). PLAY/STOP button in drum sequencer header drives `start() / stop()`.

## Knob system

`makeKnob(knobEl, opts)` factory at the top of the engine code:
- Each knob has an SVG with `viewBox -50 -50 100 100`.
- Inside the SVG: aluminum face circle (r=38), tick marks group (5 static lines at 0/25/50/75/100% positions, just outside the outer rim), outer ring (r=42), `<g class="dr-knob-rotor">` containing only the indicator line.
- `visual()` applies `transform="rotate(angle)"` to the rotor group, NOT the whole SVG. So ticks + rim + face stay anchored as reference geometry while only the indicator sweeps.
- The decorative moss arc (only on the SCREW knob) is also outside the rotor — its gap stays at the bottom always, reading as a "this is the dial's working range" indicator.

## Critical inline-comment markers in darkroom.html

When resuming, search for these to find load-bearing code:

- `─── ENGINE STATE ───` → `DR.state` shape
- `─── INIT (lazy, on first user gesture) ───` → `ensureCtx`, `buildChain`
- `─── PROCEDURAL IRs` → `IR_PRESETS` table for slots 02 + 03 (procedural plate + spring)
- `REAL_IR_PATHS` (around the procedural IRs section) → real CC0 IR paths for slots 01/04/05/06/07/08
- `─── KNOB INTERACTION ───` → `makeKnob` factory. Rotation now applied to `.dr-knob-rotor` child group.
- `─── SAMPLER ROLLING BUFFER + WAVEFORM ───` → `DR.sampler` state
- `─── DRUM PADS — synthesized 808 kit ───` → 8 voice synthesis recipes (CREATE-only)
- `─── SAMPLE PADS — 8 chops captured from the sampler ───` → SAMPLE_PAD_KEYS, etc. (CREATE-only)
- `─── MASTER CLOCK — Chris Wilson lookahead scheduler ───` → `DR.clock`
- `─── SCRATCH worklet (lazy) ───` → `ensureScratch`
- `─── BEAT REPEAT worklet ───` → `ensureBeatRepeat`. Sends explicit `{rearm: true}` port message on user actions; chunk-value drift alone never triggers recapture.
- `─── BYPASS (per module) ───` → `applyBypass` + `applyTempoBypass`. LFO bypass restores filter base values to stop in-flight `setTargetAtTime` ramps.
- `─── COLLAPSE / EXPAND (per module) ───` → chevron + header click handlers (chevrons hidden in FX rack now)
- `─── SECTION COLLAPSE ───` → section-level collapse (chevrons hidden in PLAY mode)
- `─── MODE TOGGLE — PLAY (default) / CREATE (beta) ───` → `applyMode`, localStorage persist, body data-mode attribute. Studio gate (`STUDIO_UNLOCKED`) sits here.
- `─── RELEASE — A/B compare ───` → master killswitch (formerly BYPASS ALL)
- `─── CLEAR ALL ───` → rack reset + bypass-all + SCREW reset + RELEASE-stash clear
- `─── PHASER LFO TICKER + MINI-VIS ───` → `tickPhaser` + `drawPhaserVis`
- `─── SYNTH OSCILLOSCOPE VISUALIZER ───` → `drawSynthVis`
- `─── EQ CURVE ───` → drag handlers + `drawEqCurve`
- `Audio-reactive Saturn ring` → `updateRingFlash` (ring brightness from RMS, ring orbit from playback rate)
- `─── TAPE DECK (TP-7 style scratch + auto-rotate) ───` → `tickTape`, `TAPE` state, scratch handlers. Rotor rotation negates `effRate` when REVERSE engaged.

## Critical gotchas (so future-Claude doesn't repeat known mistakes)

- **Don't ship audio-chain or worklet changes without verifying.** Always ask Jackson to test in-browser before treating it as done. Saved BUILD-STATE rule.
- **Worklet module cache is sticky.** After editing a worklet `.js`, bump the `?v=N` query in the `addModule(...)` call. Even hard-refreshes can keep stale worklet code. The beat-repeat worklet posts a one-shot `{workletVersion: N}` ping on construction so the main thread can `console.log` confirm the new code loaded.
- **CSS specificity overrides.** Twice this session a base `.dr-mod` style change was masked by a higher-specificity `[data-collapsed="true"]` or `[data-bypassed="true"]` rule. When making a base-style change, search for higher-specificity selectors in the same scope.
- **Watch SVG-attribute rotation vs CSS-property rotation.** Knob rotation moved from CSS `transform: rotate(...)` on the SVG element to SVG `transform="rotate(...)"` attribute on an inner `<g>` group. Mixing them can cause double-rotation or transform-origin surprises.
- **calc() + var() on SVG `stroke-width` is unreliable.** The audio-reactive ring effect was originally written with `stroke-width: calc(3 + 5 * var(--dr-ring-flash, 0))` and silently failed. Switched to direct JS `.style.strokeWidth = ...` writes per frame. Same lesson applies to other SVG numeric attributes.
- **TDZ on top-of-IIFE references.** Don't reference a `const` declared later in the IIFE from earlier code.
- **Stick to defined palette vars — no improvised oklch.** `--dr-panel-*`, `--dr-ink-*`, `--dr-moss`, `--dr-amber`, `--dr-coral` (matted-black; legacy name), `--dr-line`, `--dr-line-2`.
- **Throttle DOM writes for jittery numeric displays.** BPM detection at 60fps with sub-pixel layout shifts can visibly jiggle nearby elements.
- **`DR.state.sourceType` MUST be set on file load** — fixed 2026-05-06. The `play()` function created a BufferSource and set `DR.state.source` but never set `sourceType='buffer'`. Caused SCREW/RATE/PITCH to silently do nothing on file inputs (the buffer branch in `updateRateDetune` and `applyTempoBypass` was unreachable).

## What's pending (priority order)

### Audio quality
- **SoundTouch input-side gating** — fix stream-tempo drift at non-1× SCREW. Input arrives at realtime but is consumed at rate-dependent speed. SCREW < 1 → output buffer grows → latency creeps. SCREW > 1 → output starves → dropouts. Output-drain "fix" was tried 2026-05-04 and reverted (~20 audible clicks/sec at SCREW=0.7). Proper fix: input-side gating (skip pushing input when output FIFO is full, let SoundTouch's overlap-add cross-fade across the gap).

### Bigger UI / structural
- **Drag-and-drop FX module reordering** (~1.5h). User drags modules to rearrange the chain. Visual reorder + audio chain rewire. Pitch carefully — audio side is the load-bearing piece.
- **More LFO targets** — DELAY MIX / TIME, REVERB MIX, PHASER DEPTH, SCREW (pitch wobble), MASTER OUT. Self-contained change inside `tickLfo`'s target switch + new TARGET row buttons.
- **Sidechain compressor** (kick ducks samples + synth, ~1h). Web Audio note: `DynamicsCompressor` doesn't expose a true sidechain — needs an envelope follower (analyser tap on kick voice) driving a `GainNode` on `samplePadBus + synthBus`. Best as a master-pod-adjacent module pre-limiter with AMOUNT + ATTACK + RELEASE knobs.
- **Drum module gets its own zone** (CREATE). Combine drum pads + drum sequencer into one bordered "drums" zone.
- **Synth module gets its own zone** (CREATE). Break synth out of the 2-col instrument rack.

### Visual flourishes (Saturn register)
- **Independent ambient ring counter-rotation** — slow constant orbit of the inner ring vs outer ring (separate per-ring offset, plays continuously regardless of scratch).
- **Subtle planet wobble** — ±1 SVG-unit drift on the planet body over 6s, plus a slight independent drift on the moon (different phase). Pure CSS keyframes.
- **Bypass state dims the disc** — when RELEASE is active, fade the whole disc to ~70% opacity.
- **Comet streak** — every ~30s a tiny streak crosses the starfield. Risk: distracting. Skip unless Jackson asks.
- **Color-responsive bands tied to SCREW** — already partial (ring orbit speed). Could extend to ring color tint shifting with SCREW direction.

### Polish / cleanup (not blocking)
- **Remove diagnostic `console.log('[beat-repeat] capture', ...)` from the trigger handler.** Was added during the freeze-fix debugging; serves no end-user purpose now.
- **Decisions still on the table:**
  - **Single-typeface vs Jackson's stated two-font rule.** BUILD-STATE describes the system as DM Sans-only across all roles. Jackson's persistent memory says "Two fonts minimum per project — hard rule. Apply by default, propose pairing up front." Conflict still unresolved.
  - **"RELEASE" verb.** In audio, "release" usually means envelope release time. For an A/B-compare killswitch, "BYPASS" might read more directly. Subtitle "tap to release" compounds the overload.

### Deferred indefinitely
- **Looper concept** — pads + sequencer cover the chopping-and-replay use case. Could revisit OB-4-style perform/overdub as v2.
- **Stem separation** — ML model 50–200MB, runs at 0.1–0.5× realtime, 1–2s inherent latency. Not realistic in scope.

## Repo / branch

- Worktree: `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/elastic-swartz-30b73e`
- Branch: `claude/elastic-swartz-30b73e`
- Recent commits **all pushed to main** this session (Jackson approves each push). Latest at time of writing: `ef5f3a9` (LFO extraction).
- GitHub Pages picks up pushes to `main` in 1–10 min.

# darkroom — Build State

Snapshot for a fresh Claude session to resume cleanly. **Last updated 2026-07-11** — first-run UX session: (1) **DEMO source** — fourth input-bay pill; a 2-bar 120 BPM loop (kick/hats/snare/bass/Am7 stab) synthesized in an OfflineAudioContext on first click (`buildDemoBuffer()`/`loadDemo()`, cached in `demoBuffer`), routed through the same buffer path as FILE via `play()`, so SCREW/FX/beat-repeat behave identically; bay grid went 3→4 columns. (2) **Cold-load dimming** — `<body data-source="none|live">` flipped by `setSourceLive()` (called in `play()`, tab/device connect, `disconnectSource()`); while `none`, `.dr-toprow`/`.dr-globalbar`/`.dr-rack` sit at opacity .45 + desaturate so the input bay is the only awake element. (3) **Auto-raise MIX on engage** — `ENGAGE_DEFAULTS` map + `applyEngageDefaults()` in `toggleModBypass()`: engaging a module whose MIX is still 0% raises it to an audible default (SATURATE also raises DRIVE); user-set values are never overridden; A/B-restore intentionally skips it. (4) **Status line restored** — `setStatus()` had been writing to `.dr-bay-source`, which was deleted with the master pod on 2026-05-08, so every status/error message was silently invisible; a new `.dr-bay-source` line now sits under the input-bay pills (aria-live). (5) **Global MIDI toggle** — new MIDI pill in the global action bar (adopts the long-orphaned `dr-midi-pill`/`dr-midi-status` ids, so `midiSetStatus()` states render again); the ~49 per-knob LEARN pills only display while `body[data-midi="on"]` (persisted in `localStorage:darkroom:midiui`, restored on load with silent `midiEnable()` re-connect); bindings stay live regardless. (6) **RELEASE renamed A/B** — resolves the naming decision (release is overloaded with envelope-release); the global bar now reads A/B alone on the left, MIDI + CLEAR FX + CLEAR MIDI clustered right (`margin-left:auto` on the MIDI toggle). (7) **BPM displays "—"** until TAP or auto-detect lock (`tickBpm` gates the readout on `BPM.locked || bpmTouched`; CLEAR FX resets it to "—"). (8) **Signal-chain order** — the rack renders in processing order via CSS `order` rules (DOM order unchanged — physical reorder waits for drag-to-reorder); a JS-injected `.dr-mod-index` chip in every module head shows chain position 01–11 (`CHAIN_ORDER` array mirrors `buildChain()`); LFO gets `MOD` (control-rate, outside the path) and sits last. (9) **Hierarchy swap** — source pills grew (padding 16px, name 21px), master pod shrank (title 10px/ink-2, meter 84px, OUT knob 30px); blurb now leads with the demo loop. (10) **Orb video removed** — the YouTube placeholder iframe, IFrame-API reveal script, loading mask, clip path, and the dead `mountOrbVideo`/`unmountOrbVideo` pair are all gone; the orb is the brushed-aluminum sphere with vignette + specular, and the page now loads **zero external scripts**. (The iframe was also what froze headless/preview renderers.) (11) **Source-switch gaps closed** — `loadTabAudio` now mutes `sourceGain` while Chrome's share dialog is up, restores it on cancel and on a no-audio-track share (also ends that share's tracks so Chrome's sharing bar can't read as connected), and restores it on success after the new stream connects. Previous session summary (2026-05-12) follows: 6 new FX modules (BITCRUSH / SATURATE / CHORUS / FLANGER / AMBIENT / REV DLY), full Web MIDI learn with per-knob LEARN pills, master-pod compaction into the masthead, SCREW + REVERSE extracted from the wave panel into their own column, wave-panel meta-strip flattened to a 4-cell grid with TAP at the right, active-module matte-black skin on engage, orange waveform, CLEAR FX / CLEAR MIDI action buttons, and the new darkroom logo image replacing the text wordmark.

## TL;DR

- **Working file:** `darkroom.html` at the repo root.
- **Frozen reference:** `darkroom-dark.html` — old dark/forest aesthetic snapshot, untouched.
- **Logo:** `darkroom/assets/darkroom-logo.png` (replaces the text wordmark in the masthead; falls back to the h1 via `onerror` if the image fails).
- **Worklets:**
  - `darkroom/lib/soundtouch-processor.js` — stream tempo/pitch
  - `darkroom/lib/beat-repeat-processor.js` — freeze loops (OB-4 model)
  - `darkroom/lib/scratch-processor.js` — turntable scratch
  - `darkroom/lib/sampler-buffer-processor.js` — 60s rolling tap for sample-finding
  - `darkroom/lib/bitcrush-processor.js` — sample-rate decimator (sample-and-hold), lazy-loaded on first bitcrush engage
  - `darkroom/lib/capture-processor.js` — generic sample-accurate capture used by AMBIENT and REV DLY rings
  - (`recorder-processor.js` was deleted 2026-05-07 with the WAV-export feature for legal reasons)
- **Real CC0 IRs:** `darkroom/irs/01-wood.wav` … `08-cave.wav`. Plate (02) and spring (03) stay procedural. Attribution at `darkroom/irs/ATTRIBUTIONS.txt`.
- **Local dev:** `python3 -m http.server 8765` from the worktree root → Chrome → `http://localhost:8765/darkroom.html`. Localhost is required for `getDisplayMedia`.
- **Worktree:** `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/nostalgic-leavitt-99372b`. Branch `claude/nostalgic-leavitt-99372b`. **Pushed to `main` regularly this session** — Jackson approves each push.
- **Live URL:** https://jacksonalexanderstudio.com/darkroom.html (PLAY mode default; `?studio` query reveals the studio toggle).

## Mode toggle

The page operates in two modes, set by `data-mode` on `<body>`, persisted in `localStorage:darkroom:mode`. Default `play`. The masthead toggle pill was removed 2026-05-07 (PLAY is always on for the public deploy); the mode JS still runs but its `querySelectorAll` returns empty so the no-op handlers attach to nothing. CREATE-only sections remain hidden via CSS until someone manually flips body `data-mode`.

## Page layout (top → bottom)

1. **Masthead** — image logo on the left (`darkroom/assets/darkroom-logo.png`), with an instructional blurb under it; on the right, a compact **MASTER** pod (single horizontal row: MASTER label + POST meter bar + small OUT knob). The old 280px master sidebar was removed; PRE / GR meters and the source label were dropped.
2. **Source picker** — 3 horizontal pills (TAB / DEVICE / FILE).
3. **Global action bar** — RELEASE (A/B kill, restores prior state) + **CLEAR FX** (renamed from CLEAR ALL — resets every FX module's knobs + bypass states + SCREW + RELEASE stash) + **CLEAR MIDI** (wipes every CC binding from `localStorage:darkroom:midi` and resets every per-knob LEARN pill back to idle).
4. **TOP ROW** — three cards inline:
   - **Tape deck card** (left, ~280px) — Saturn artifact (see "Saturn deck"). Title "tape".
   - **SCREW + REVERSE column** (middle, ~160px) — two stacked bordered cards in a 3:1 height ratio. SCREW knob (72px dial, foundation control) on top; REVERSE pill on the bottom. Extracted from the wave panel meta strip 2026-05-08.
   - **Wave/sample panel card** (right, flex:1) — Contains:
     - **Meta strip** (CSS grid: `repeat(4, 1fr) auto`): 4 equal-width type packages — SOURCE / ELAPSED / BPM / RATE, all flush-left with label-above-value type. **TAP** button anchored at the far right, height stretched to match the type stack. Type sized down 2026-05-08 (label 9px, value 11px) for a Vignelli-restrained read; BPM value normalized to the same mono/11px/ink as the other values (was display-font 24px moss).
     - **Waveform** (60s rolling buffer, 1024 peak columns, BPM bar grid, playhead pip). Peak bars render in moss/orange (`oklch(0.64 0.18 35)`).
     - **BEAT REPEAT tool row** (label + amber LED + 7 division pills). Clicking a non-OFF division auto-un-bypasses.
     - (CREATE-only) Sampler controls (FREEZE/PREVIEW/ASSIGN), 8 sample pads, 4 ADSR knobs.
5. **Sample sequencer** (CREATE-only) — 8 rows × 16 steps.
6. **Instrument rack** (CREATE-only) — drum pads + synth.
7. **Drum sequencer** (CREATE-only) — 8 rows × 16 steps.
8. **FX rack** (`.dr-rack`) — 6 columns × 2 rows = **12 modules**:
   - Row 1: **EQ → FILTER → PHASER → LFO → DELAY → REVERB** (original 6, unchanged).
   - Row 2: **BITCRUSH → SATURATE → CHORUS → FLANGER → AMBIENT → REV DLY** (added 2026-05-08).
   - Each module is a pill-shaped tactile card. Engaged modules flip to a **metallic matte-black sheen** background (radial highlight at top-left + linear dark gradient); inner controls (knobs, pills, labels, vis canvas) keep their cream/aluminum look. Active modules also have moss canvas-borders and moss knob-value text.
   - **Every knob has a per-knob MIDI LEARN pill** below its value (fixed 42×14px, fully rounded; "MIDI" when idle, "CC X" when bound; moss/orange fill with white text when bound; right-click clears).

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
        → eqLow → eqMid → eqHigh → filter → phaser
        → bitcrush(rate worklet → waveshaper) → saturation → chorus → flanger
        → ambient → revdelay → beatRepeat
        → delay (dry|line→tone→wet) → reverb (dry|conv→wet)
        → preAnalyser → limiter (-1 dBFS, 20:1) → master → outputAnalyser → destination
```

Insertion point for the second-row FX was after PHASER, before BEAT REPEAT.

**LFO is a control-rate side-channel** — modulates filter frequency/Q via `setTargetAtTime`. Not in the audio chain.

## Saturn deck

`.dr-tape-disc` SVG with viewBox `-160 -160 320 320`. Composition unchanged from 2026-05-06 — space backdrop, 26 stars (some twinkling), static moon, three rotor groups (back rings, planet body, front rings). Audio-reactive ring brightness in `updateRingFlash()` reads the inputAnalyser's 60-4000 Hz band; ring orbit speed tracks playback rate × SCREW × REVERSE × scratch velocity.

**Orb video placeholder — REMOVED 2026-07-11.** The YouTube embed (and its IFrame-API reveal script, loading mask, and clip path) is gone; the orb is now the pure brushed-aluminum sphere with vignette + specular overlays. Rationale: a video unrelated to the audio being processed read as broken, and the embed was the heaviest asset on the page (it also froze headless/preview browser renderers).

## Recording (REMOVED 2026-05-07)

Phase 5 export was ripped out for legal reasons. No path on the page writes audio to disk. Sampler ring buffer + waveform are local visualization only.

## MIDI learn (added 2026-05-11)

**Per-knob LEARN pill** below every knob (`.dr-knob-midi-learn`). Click it → enables Web MIDI on first use (browser permission prompt), puts that knob in learn mode (amber pulse). Twist any CC on the controller → bound. Pill text flips to "CC X" with moss/orange fill + white text. Right-click clears that binding. Escape cancels learn.

- Bindings persist via `localStorage:darkroom:midi` as `{ ccNumber: paramName }`.
- Hot-plug works: `access.onstatechange` re-attaches inputs when controllers are connected/disconnected mid-session.
- `makeKnob().setNormalized(t)` (added 2026-05-11) takes a 0..1 value and routes it through the knob's native scale (log via `Math.pow`, linear via lerp). The MIDI bridge uses this so it doesn't need to know per-knob ranges or scale types.
- CC value 0-127 → `setNormalized(value / 127)`.
- Only CC messages (status 0xB0–0xBF) are listened to. Pitch bend / notes / etc. ignored.
- **CLEAR MIDI** in the action bar wipes everything (state + storage + pill labels).

## State (DR.state shape — key parts)

- `DR.state.screw / .rate / .pitch` — source manipulation. Only SCREW has a UI knob; RATE/PITCH pinned at 1.0/0. Auto-bypass on the SoundTouch worklet at all-defaults.
- `DR.state.bypassed.{tempo, filter, eq, phaser, lfo, beatrepeat, delay, reverb, bitcrush, saturation, chorus, flanger, ambient, revdelay}` — per-module bypass.
- `DR.state.bitcrush.{bits, rate, mix}` — bits 1-5 (depth) + rate 0.05-1.0 (decimator) + dry/wet.
- `DR.state.saturation.{drive, mix, type}` — type ∈ `tube|tape|fuzz|diode` selects waveshaper curve.
- `DR.state.chorus.{rate, depth, feedback, mix, shape, sync, division}` — shape ∈ `sine|triangle|square`; sync flag + division for tempo-sync mode.
- `DR.state.flanger.{rate, depth, feedback, mix, shape, sync, division}` — same architecture as chorus, shorter base delay (3ms) and wider FB.
- `DR.state.ambient.{bloom, depth, mix, intervals, frozen}` — bloom (grain density/length), depth (pitch spread), intervals ∈ `octave|fifth|fourth|minor7`, frozen flag locks the capture buffer.
- `DR.state.revdelay.{time, feedback, mix, sync, division}` — time 0.05–2s log, FB scales wet→capture re-feed.
- `DR.state.lfo.{shape, target, sync, division, rate, depth, phase, shLast}`.
- `DR.state.beatRepeat.{division, lastDivision, lastBypassed}`.
- `DR.state.delay.{bpm, bpmTouched, division, modifier, time, sync, feedback, tone, mix}`.
- `DR.state.eq.{low, mid, high}.{freq, gain, q}`.
- `DR.state.phaser.{rate, depth, feedback, mix, phase}`.
- `DR.state.samplePads.{active, env, slots}` — 8 slots (CREATE).
- `DR.state.seq.{...}` — drum + sample sequencer (CREATE).
- `DR.sampler.{...}` — rolling buffer + waveform.
- `DR.clock.{...}` — Chris Wilson lookahead scheduler.

## FX module summaries

### Row 1 (original)

**EQ** — Three-band (low shelf 120Hz, mid bell 1kHz, high shelf 8kHz). FabFilter-style draggable band handles on the curve canvas.

**FILTER** — Biquad LP/HP/BP, CUT (log) + RES. Draggable cutoff handle. Live spectrum overlay.

**PHASER** — 4-stage allpass, internal LFO. RATE / DEPTH / FB / MIX.

**LFO** — Standalone modulation source. Targets filter CUT/RES/BOTH (back-compat). 5 shapes (sin/tri/saw/sq/S&H), TARGET row, free-rate or tempo-sync, RATE + DEPTH.

**DELAY** — Beat-synced, tap tempo, division grid + dotted/triplet modifiers. TIME / FB / TONE (LP on FB) / MIX.

**REVERB** — Convolution. 8 IRs (6 real CC0 + 2 procedural). `loadIR()` async-fetches WAVs on first hit.

### Row 2 (added 2026-05-08)

**BITCRUSH** — WaveshaperNode quantizing to 2^N levels (BITS 1-5, narrowed range so every detent is audibly distinct) + sample-and-hold rate decimator via `bitcrush-processor.js` worklet (RATE 0.05-1.0, log scale, lazy-loaded). 5-segment LED ladder visually shows bit value. Vis: stepped staircase transfer curve.

**SATURATE** — WaveshaperNode with 4 selectable curve flavors (TUBE / TAPE / FUZZ / DIODE) via pill row. DRIVE + MIX. 4× oversampled to reduce aliasing. Vis: smooth S-curve transfer.

**CHORUS** — 15ms DelayNode modulated by selectable LFO shape (SIN/TRI/SQR). RATE / DEPTH / FB / MIX, plus tempo-sync (SYNC toggle + 1/16…1/1 division grid). Vis: animated sine waveform with playhead dot.

**FLANGER** — Same architecture as chorus, 3ms base delay + wider FB range for metallic comb sweep. Same shape selector + tempo sync.

**AMBIENT** — OB-4-style soundscape generator. Worklet-based sample-accurate capture into a 6s ring buffer; main-thread scheduler fires Hann-windowed grains at root-biased pitch transpositions. Intervals pill row (OCTAVES / 5THS / 4THS / MINOR 7THS) + FREEZE button (locks capture buffer for drone mode). Per-grain peak gain auto-scales with overlap so sparse and dense settings land at similar loudness. Vis: scrolling captured waveform with moss particle drift.

**REV DLY** — Every TIME ms grabs the last TIME seconds from a 4s ring (sample-accurate via `capture-processor.js` worklet), reverses, plays once via revdelayBus. FB feeds the wet output back into the capture for reversed-of-reversed textures. Tempo sync + division grid. Manual TRIGGER button fires a one-shot chunk. Vis: forward capture (top) + reversed playback (bottom, moss-tinted).

## Knob system

`makeKnob(knobEl, opts)` factory. Each knob's SVG has `viewBox -50 -50 100 100`. Inside: aluminum face circle (r=38), static tick marks group (5 lines at 0/25/50/75/100% positions), outer ring (r=42), `<g class="dr-knob-rotor">` with only the indicator line.

- `visual()` applies `transform="rotate(angle)"` to the rotor group so ticks + rim stay anchored.
- Returned API: `{ setValue, getValue, setNormalized }`. The new `setNormalized(t)` takes a 0..1 value and dispatches through the scale (log via `Math.pow`, linear via lerp). Used by the MIDI bridge.

## Active module skin (added 2026-05-12)

When a module is engaged (`data-bypassed="false"`), its container flips to a metallic matte-black sheen via a CSS rule (`background: radial-gradient(...) + linear-gradient(...)` with inset highlights). Only the surface changes — inner controls (knobs, pills, labels, vis canvas) keep their cream/aluminum look. Active modules also get:
- Moss canvas border (`.dr-mod canvas` → `border-color: var(--dr-moss)`)
- Moss knob value text (`.dr-knob-value` color shifts)

## Critical inline-comment markers in darkroom.html

When resuming, search for these to find load-bearing code:

- `─── ENGINE STATE ───` → `DR.state` shape
- `─── INIT (lazy, on first user gesture) ───` → `ensureCtx`, `buildChain`
- `── BITCRUSH curve generator` / `── SATURATION curves` → waveshaper helpers
- `─── BITCRUSH RATE worklet (lazy)` → `ensureBitcrushRate`
- `─── AMBIENT — granular soundscape engine` → ring buffer + grain scheduler
- `─── REVERSE DELAY engine` → chunk scheduler + reversal
- `─── MIDI bridge (Web MIDI API)` → `MIDI` namespace, learn flow
- `Per-knob LEARN pill` → injection of per-knob MIDI buttons
- `─── PROCEDURAL IRs` → `IR_PRESETS` for slots 02/03
- `REAL_IR_PATHS` → real CC0 IR paths
- `makeKnob` → knob factory (with `setNormalized` for MIDI)
- `─── SAMPLER ROLLING BUFFER + WAVEFORM ───`
- `─── DRUM PADS` / `─── SAMPLE PADS` (CREATE-only)
- `─── MASTER CLOCK ───`
- `─── SCRATCH worklet (lazy) ───`
- `─── BEAT REPEAT worklet ───`
- `─── BYPASS (per module) ───` → `applyBypass` + `applyTempoBypass`
- `─── COLLAPSE / EXPAND` → header click handlers (chevrons hidden in rack)
- `─── MODE TOGGLE — PLAY (default) / CREATE (beta) ───` → mode JS (now mostly no-op, toggle removed)
- `─── RELEASE — A/B compare ───`
- `─── CLEAR FX ───` / `CLEAR MIDI` handlers
- `Audio-reactive Saturn ring` → `updateRingFlash`
- `─── TAPE DECK (TP-7 style scratch + auto-rotate) ───` → `tickTape`, `TAPE` state
- `tickFxSync` → per-frame BPM × division → rate/time recompute for synced row-2 modules

## Critical gotchas

- **Don't ship audio-chain or worklet changes without verifying.** Always ask Jackson to test in-browser before treating it as done.
- **Worklet module cache is sticky.** After editing a worklet `.js`, bump the `?v=N` query in the `addModule(...)` call. Even hard-refreshes can keep stale worklet code.
- **CSS specificity overrides.** A base `.dr-mod` style change can be masked by `[data-collapsed="true"]` or `[data-bypassed="true"]` rules — always check higher-specificity selectors in the same scope.
- **iframe inside SVG foreignObject + clip-path is buggy in Chrome.** Used a wider foreignObject (480×320) + `overflow:visible` on the SVG to dodge the half-width rendering bug. A black SVG circle mask hides the iframe until the YouTube IFrame API confirms playback (polling `getCurrentTime()` ticks).
- **Sample-accurate ring capture requires a worklet** — `AnalyserNode` polling produces audible crackle on reversed playback (drift between system clock and audio clock). `capture-processor.js` solves it.
- **AMBIENT grain gain must scale inversely with overlap** — high BLOOM stacks 30+ grains; without `0.55 / max(3, overlap)` scaling, the wet signal clips. Hann windowing on each grain hides the seams.
- **MIDI shift-click was abandoned** for per-knob LEARN pills — pointerdown-on-dial fires for drag, can't reliably distinguish from shift+click on the same target. Explicit per-knob pills are cleaner UX anyway.
- **Stick to defined palette vars.** `--dr-panel-*`, `--dr-ink-*`, `--dr-moss` (the orange — yes the variable name is misleading, hue is ~35), `--dr-amber`, `--dr-coral`, `--dr-line`, `--dr-line-2`.
- **TDZ on top-of-IIFE references.** Don't reference a `const` declared later in the IIFE from earlier code.
- **`DR.state.sourceType` MUST be set on file load** — fixed 2026-05-06. Was causing SCREW/RATE/PITCH to silently no-op on file inputs.

## What's pending (priority order)

### Audio quality
- **SoundTouch input-side gating** — stream-tempo drift at non-1× SCREW (input arrives at realtime, consumed at rate-dependent speed → FIFO grows or starves). Output-drain fix was reverted (~20 audible clicks/sec). Proper fix is input-side gating in the worklet.

### Bigger UI / structural
- **Drag-and-drop FX module reordering** (~1.5h). Visual reorder + audio chain rewire.
- **More LFO targets** — currently only filter CUT/RES/BOTH. Extend to DELAY MIX/TIME, REVERB MIX, PHASER DEPTH, SCREW, MASTER OUT.
- **Sidechain compressor** (kick ducks samples + synth, ~1h). Needs envelope follower + GainNode on samplePadBus + synthBus.
- **Drum / synth modules get their own zones** (CREATE).

### Visual flourishes
- **Independent ambient ring counter-rotation** on the Saturn.
- **Subtle planet wobble** + slight independent moon drift.
- **Bypass state dims the disc** when RELEASE is active.
- **Comet streak** every ~30s across the starfield.

### Polish / cleanup
- **Remove diagnostic `console.log('[beat-repeat] capture', ...)`** from the trigger handler.
- **Sweep stale `.dr-master-wrap` CSS rules** — the element was removed but the rules still sit in the file (harmless dead code).
- **Decisions still on the table:**
  - Two-fonts-minimum rule (memory) vs single-typeface (current). Conflict unresolved.
  - ~~"RELEASE" verb vs "BYPASS"~~ — resolved 2026-07-11: renamed **A/B**.

### Deferred indefinitely
- **Looper concept** — pads + sequencer cover the use case. Could revisit as v2.
- **Stem separation** — ML model too heavy for browser.

## Repo / branch

- Worktree: `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/nostalgic-leavitt-99372b`
- Branch: `claude/nostalgic-leavitt-99372b`
- Recent commits all pushed to `main`. Latest at time of writing: `6448deb` (orange waveform + CLEAR FX/MIDI buttons).
- GitHub Pages picks up pushes to `main` in 1–10 min.

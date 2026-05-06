# darkroom — Build State

Snapshot for a fresh Claude session to resume cleanly. Last updated 2026-05-04 after a heavy session of UI restructuring: PLAY/CREATE mode toggle, sampler split into tape + wave panel cards, master pulled into a top-of-page row beside sampler, BEAT REPEAT moved out of FX rack into sampler tool row, FX rack moved to separate-pill modules, hero section titles globally hidden.

## TL;DR

- **Working file:** `darkroom.html` at the repo root.
- **Frozen reference:** `darkroom-dark.html` — old dark/forest aesthetic snapshot, untouched.
- **Worklets:** `darkroom/lib/soundtouch-processor.js` (stream tempo/pitch), `darkroom/lib/beat-repeat-processor.js` (freeze loops), `darkroom/lib/scratch-processor.js` (turntable scratching), `darkroom/lib/sampler-buffer-processor.js` (60s rolling buffer tap for sample-finding).
- **Local dev:** `python3 -m http.server 8765` from the worktree root → Chrome → `http://localhost:8765/darkroom.html`. Localhost is required for `getDisplayMedia`.
- **Worktree:** `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/elastic-swartz-30b73e`. Branch `claude/elastic-swartz-30b73e`. Not pushed; Jackson controls when this hits main.

## Mode toggle (top-right of masthead)

The page operates in two modes, set by the `data-mode` attribute on `<body>` and persisted in `localStorage:darkroom:mode`. Default is `play`.

- **PLAY** (default) — minimal audio-manipulation surface. Visible: source picker, master pod, sampler (tape + wave panel + BEAT REPEAT), FX rack. Hidden via CSS: sample pads grid, sample-pad ADSR, sample sequencer, instrument rack (drums + synth), drum sequencer, sampler controls (FREEZE/PREVIEW/ASSIGN), section collapse chevrons (+ any prior-collapsed sections force-expand).
- **`darkroom.studio` (beta)** — full production toolkit. All sections visible.

Switching to PLAY calls `DR.clock.stop()` to prevent ghost playback from a hidden sequencer.

## Page layout (top → bottom)

1. **Masthead** — `darkroom.ja` wordmark left, `[PLAY | darkroom.studio (beta)]` mode toggle + `v0.1` meta right. PLAY-pill active state uses a recessed darker-grey gradient (`--dr-panel` → `--dr-panel-4`), no color tint.
2. **Source picker** — 3 horizontal cards (TAB / DEVICE / FILE). Hero title hidden.
3. **Global action bar** (`.dr-globalbar`) — RELEASE pill (amber dot, pill shape, kills all FX as A/B compare) + CLEAR ALL button (resets all FX module knobs to defaults). Compact, sits flush above the toprow.
4. **TOP ROW** (`.dr-toprow`) — three cards inline at the same top edge:
   - **Master pod** (left, ~280px) — `.dr-mod[data-mod="master"]` article: source label + level meter + PRE/POST/GR meters + OUT knob. Soft limiter at -1 dBFS, 20:1.
   - **Tape deck card** (middle) — `.dr-tape-deck` bordered card with "tape" h4 title (top-left corner). Contains the 280px scratchable disc with amber stroke accents (rim, line, pinholes, spindle, 4 screw dots). NO floating spec text inside the disc.
   - **Wave/sample panel card** (right, flex:1) — `.dr-tape-panel` bordered card. Contains:
     - **Meta strip** (3-col grid `1fr auto 1fr`): SOURCE on left, [SCREW knob (64px) + REVERSE pill] truly centered, ELAPSED/BPM/RATE cluster right-aligned.
     - **Waveform** (60s rolling buffer, 1024 peak columns, BPM bar grid overlay, playhead pip on right).
     - **BEAT REPEAT tool row** (label + amber trigger LED + 7 division pills: OFF / 1/32 / 1/16 / 1/8 / 1/4 / 1/2 / 1/1). Active division lights amber.
     - (CREATE-only) Sampler controls (FREEZE/PREVIEW/ASSIGN), 8 sample pads (4×2 grid), 4 sample-pad ADSR knobs.
5. **Sample sequencer** (CREATE-only) — full-width, 8 sample-pad rows × 16 steps. Subscribes to `DR.clock`. Cells use `data-kind="sample"`.
6. **Instrument rack** (CREATE-only) — 2-col: 8 drum pads (left) + synth (right).
7. **Drum sequencer** (CREATE-only) — full-width, 8 drum rows × 16 steps. Header has PLAY/STOP + SWING knob + CLEAR. Cells use `data-kind="drum"`.
8. **FX rack** (`.dr-rack`) — CSS Grid 5 columns at desktop (5 → 3 → 2 → 1 responsive, skipping 4 to avoid orphans). 5 modules: FILTER / EQ / PHASER / DELAY / REVERB. Each module is a pill-shaped tactile card (rounded `--r-xl`, cream gradient face, 1px border, soft drop shadow). Active state (un-bypassed) uses **matte-black brushed look**: dark ink border + slightly recessed darker face + faint horizontal brushed-grain repeating gradient + deeper shadow. NO moss/green tint on the shell. The bypass dot stays moss as the small accent.
9. **Export** (`export`) — stub for phase 5. Hero title hidden (so it's effectively invisible until built out).
10. **Transport** — ARM, REC, time, file readout. Output recording (still mostly stub).

Hero section titles (`.dr-section`) are **globally hidden** via `display: none`. Each device has its own corner title (e.g. "tape" h4 inside the tape deck card, module names inside FX modules). The h3 elements stay in the DOM as collapse JS hookable elements.

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
        → filter → eqLow → eqMid → eqHigh → phaser → beatRepeat
        → delay (dry|line→tone→wet) → reverb (dry|conv→wet)
        → preAnalyser → limiter (-1 dBFS, 20:1) → master → outputAnalyser → destination
```

**Key audio nodes:**
- `sourceGain` — gain on the source-only path; sampler FREEZE ramps it to 0 (10ms) so PREVIEW can audition cleanly without source bleed. padBus joins scratchIn directly, bypassing sourceGain.
- `padBus` — entry for drum pads + synth + sample pads + sampler PREVIEW. Joins scratchIn alongside source.
- `samplePadBus` — separate gain node for sample pad voices. Routes into padBus. Future-proofing for sidechain compression (kick can duck samples but not drums).
- `samplerBuffer` (worklet) — passive tap inserted between scratchOut and inputAnalyser. Fills the 60s rolling ring buffer for sample-finding waveform.

## State (DR.state shape — not exhaustive, key parts)

- `DR.state.screw / .rate / .pitch` — source manipulation. RATE + PITCH no longer have UI knobs (pinned at 1.0 / 0); only SCREW is user-adjustable. Auto-bypass on SoundTouch worklet when all 3 at default.
- `DR.state.bypassed.{filter, eq, phaser, beatrepeat, delay, reverb, tempo}` — per-module bypass state.
- `DR.state.samplePads.{active, env: {atk, dec, sus, rel}, slots: [{buffer, durationMs, peaks, currentSrc, currentGain}]}` — 8 sample pad slots + global ADSR.
- `DR.state.seq.{isPlaying, currentStep, swing, pattern: {kick, snare, ...}, samplePattern: [...]}` — drum + sample sequencer patterns.
- `DR.sampler.{ring, ringFrames, writePos, totalFrames, peakMin, peakMax, isFrozen, frozenWritePos, inFrac, outFrac, preview}` — rolling buffer + waveform state.
- `DR.clock.{isRunning, currentStep, nextNoteTime, subscribers}` — Chris Wilson lookahead scheduler at sixteenth-note resolution. BPM pulled from `DR.state.delay.bpm`.

## Major modules + their state

### Master pod (top row, left)
- Source label, level bar, PRE/POST/GR meters, OUT knob (-24 to +12 dB). Limiter at -1 dBFS.

### Sampler — tape deck (top row, middle)
- 280px scratchable disc with amber design accents. Worklet-driven scratching with 30s rolling buffer.
- REVERSE pill (in the wave panel meta strip, NOT inside the deck) — amber dot + label, lights amber when sustained reverse engaged.
- Disc gestures take precedence; releasing snaps back to -1× if REVERSE on, else +1×.

### Sampler — wave/sample panel (top row, right)
- **Meta strip** centered SCREW + REVERSE between SOURCE (left) and ELAPSED/BPM/RATE (right). Throttled BPM/RATE display updates (4Hz BPM, change-only RATE) + fixed min-widths to prevent layout-shift jiggle of the SCREW knob during audio playback.
- **Waveform** — 60s rolling buffer captured by `sampler-buffer-processor.js` worklet. Renders 1024 peak columns + BPM bar overlay. Live-scroll by default; FREEZE pauses, shows in/out markers.
- **BEAT REPEAT tool** — moved here from FX rack. Discrete OFF + 6 divisions (1/32 to 1/1). Insert-effect; OFF is pass-through. Worklet captures + loops the last chunk-period at the chosen rate. Active division lights amber, trigger LED flashes amber on each capture.
- (CREATE-only) **Sampler controls** — FREEZE/LIVE toggle, PREVIEW (loops region through padBus → FX), ASSIGN (copies region to active sample pad). FREEZE mutes sourceGain to 0 (10ms ramp).
- (CREATE-only) **Sample pads** — 4×2 grid of 8 pads. Each holds an `AudioBuffer`. Click + Y/U/I/O/H/J/K/L keyboard triggers playback through `samplePadBus → padBus → FX`. Per-pad mono with smooth voice steal (release ramp on retrigger). Mini-waveform peaks (64 cols) per pad. Active selection is the ASSIGN target.
- (CREATE-only) **Sample-pad ADSR** — 4 knobs (atk/dec/sus/rel), single global envelope wraps every voice on every pad.

### Drum pads (CREATE-only, instrument rack left)
- 8 synthesized 808 voices: KICK / SNARE / CLAP / HAT / OPEN HAT / TOM LO / TOM HI / COWBELL.
- Trigger by click + Q/W/E/R/A/S/D/F. Routes through `padBus → scratchIn → FX`.
- Each pad function (`playKick(when)` etc.) accepts optional `when` for sequencer-scheduled playback.

### Synth (CREATE-only, instrument rack right)
- Subtractive monosynth, polyphonic via voice pool. 4 wave shapes, 6 ADSR/filter knobs.
- C major scale on Z X C V B N M `,`.
- Routes through `synthBus → synthAnalyser → padBus → FX`.

### Master clock (`DR.clock`)
- Chris Wilson lookahead scheduler. `setInterval(25ms)` peeks 0.1s ahead, schedules sixteenth-note ticks on AudioContext clock.
- BPM from `DR.state.delay.bpm`.
- Subscribers register `(stepIndex, audioTime) => …`. `stepIndex === -1` means stopped.
- PLAY/STOP button in drum sequencer header drives `DR.clock.start() / stop()`.

### Step sequencers (CREATE-only)
- **Drum sequencer** — `data-kind="drum"` cells. Pattern at `DR.state.seq.pattern[padId]`. Has the global PLAY/STOP + SWING (0–100, MPC shuffle on odd 16ths) + CLEAR.
- **Sample sequencer** — `data-kind="sample"` cells. Pattern at `DR.state.seq.samplePattern[padIdx]`. Shares `DR.clock` + PLAY/STOP + SWING with drum seq. Own CLEAR button.
- Cell tap-on auditions the corresponding pad.

### FX rack
- 5 modules: FILTER / EQ / PHASER / DELAY / REVERB (BEAT REPEAT relocated to sampler).
- Each is a self-contained pill-shaped card (no chassis frame around the rack).
- 5-column CSS Grid at desktop, responsive 5 → 3 → 2 → 1.
- Per-module collapse chevron HIDDEN globally inside `.dr-rack` (modules are always expanded).
- Active state (un-bypassed) = matte-black brushed look (dark border + recessed face + faint horizontal grain). NOT moss/green.
- Knobs in FX rack scope shrunk to 48×48 (vs 64×64 default) to fit narrow column widths.

### Section collapse mechanism
- Collapsible sections: sampler, sseq, instr, seq (drum), rack, master, export.
- Chevron buttons added via JS to each section's heading row. Position: absolute right edge.
- State persists in `localStorage:darkroom:collapsed`.
- HIDDEN entirely in PLAY mode (collapse is a CREATE-mode tool); previously-collapsed sections force-expand in PLAY.

## Visual / typography system

- **Single typeface:** DM Sans (`'DM Sans', system-ui, sans-serif`) used across all roles via `--dr-mono`, `--dr-disp`, `--dr-fx`, `--dr-sf`.
- **Strict palette — stick to defined vars only.** Jackson called this out explicitly: no improvised oklch values.
  - `--dr-panel / -2 / -3 / -4` — warm grey/cream tones.
  - `--dr-line / -2` — hairlines.
  - `--dr-ink / -dim / -2` — charcoal text.
  - `--dr-moss / -dim / -glow` — Braun orange accent (only color voice for accents like the bypass dot, sampler region overlay, the masthead `.ja`).
  - `--dr-amber` — warm yellow-orange. Used for "engaged action" indicators: REVERSE active, RELEASE active, BEAT REPEAT active division, BEAT REPEAT trigger LED, disc design lines/screws.
  - `--dr-coral` — repurposed as matted-black ink (legacy name, current value).
- **Tactile surfaces** (master pod, tape deck card, wave panel card, FX modules, drum pads, sample pads, REVERSE pill, RELEASE pill): cream gradient face + 1px border + inset top highlight + soft drop shadow + pressed-state inset shadow.

## Known issues / accepted tradeoffs

- **SoundTouch worklet — SCREW ≠ 1 unfixed on streams.** Input arrives realtime, consumed at rate-dependent speed. SCREW < 1 → output buffer grows → latency creeps. SCREW > 1 → output starves → dropouts. A bounded-output FIFO drain was attempted 2026-05-04 but reverted same day (chunky output drain caused ~20 audible clicks/sec at SCREW=0.7). The proper fix is **input-side gating**: skip pushing input when output buffer is full, letting SoundTouch's overlap-add cross-fade across the gap. Queued for re-attempt — pitch carefully and verify before merging.
- **Tape disc 30s rolling buffer.** Sustained reverse for >30s pins to oldest sample. Fine for short DJ-style gestures.
- **Sampler ring buffer 60s.** When frozen, after >60s the ring wraps and PREVIEW samples become stale.
- **REVERB IRs are still procedurally synthesized.** Real CC0 IRs queued.

## Pending work (priority order)

### Active — sampler reframe phases

The sampler reframe (sampler as the central "find a chop" device, with a 6-step beat-making workflow) is mostly done. Remaining phase:

- **Phase 5 — Export** (~2h). Real-time master capture → WAV (trivial, no deps) + MP3 via lamejs (~80KB). Hit RECORD on master, perform, hit STOP, file downloads. SP-404 model — no offline render.

### Bigger UI / structural work

- **Drag-and-drop FX module reordering** (~1.5h). User drags modules to rearrange the FX chain. Requires both visual reorder AND audio chain rewire (disconnect/reconnect every node in new order). Pitch carefully; the audio side is the load-bearing piece.
- **Sidechain compressor** (kick ducks samples + synth, ~1h). Web Audio note: `DynamicsCompressor` doesn't expose a true sidechain input — needs an envelope follower (analyser tap on kick voice) driving a `GainNode` on the samplePadBus + synthBus. Best as a master-pod-adjacent module pre-limiter with AMOUNT + ATTACK + RELEASE knobs.
- **Drum module gets its own zone** (todo #4). Combine drum pads + drum sequencer into ONE bordered "drums" zone with its own real estate.
- **Synth module gets its own zone** (todo #5). Break synth out of the 2-col instrument rack. Open question: synth's sequencer style (pitch-aware piano-roll vs fixed-root step grid vs live-only).
- **Tape deck identity pass** (todo #6). Less Braun, more darkroom. Disc styling has had an amber-accent pass; deeper visual identity work still queued.

### Audio quality

- **Input-side gating for SoundTouch** (re-attempt of the FIFO fix). See "Known issues" above. Fixes SCREW < 1 latency creep without the audible clicks the output-drain caused.
- **Real CC0 reverb IRs** (~45m). Replace 6 of the 8 procedural reverbs with openair.york.ac.uk recordings. Keep plate + spring procedural (gear, not rooms).

### Deferred / smaller

- **Playground tile registration** (~20m). Add darkroom as a tile in `playground.html`.
- **Looper concept dropped** — pads + sequencer cover the chopping-and-replay use case. Could revisit OB-4-style perform/overdub as a v2.
- **Stem separation** — deferred indefinitely. ML model 50–200MB, runs at 0.1–0.5× realtime, 1–2s inherent latency. Not realistic in scope.

### UI polish (Jackson-flagged "after the big build")

Jackson said explicitly he'll "go hard on the details of the buttons and functionality after the big build is complete." Not actionable mid-build, but the intention is recorded:
- Refine button micro-interactions
- Fine-tune visual hierarchy across the page
- Polish edge cases / animations / hover states

## Critical inline-comment markers in darkroom.html

When resuming, search for these to find load-bearing code:

- `─── ENGINE STATE ───` → `DR.state` shape
- `─── INIT (lazy, on first user gesture) ───` → `ensureCtx`, `buildChain`
- `─── PROCEDURAL IRs` → IR_PRESETS table for the 8 reverbs
- `─── KNOB INTERACTION ───` → `makeKnob` factory (document-level pointermove/up so knobs can't get stuck)
- `─── KNOB BINDINGS ───` → `const knobs = {}` plus all knob bindings (synth knobs MUST live here, not earlier in the IIFE — temporal-dead-zone bug bit us once)
- `─── SAMPLER ROLLING BUFFER + WAVEFORM ───` → DR.sampler state, ensureSamplerBuffer(), recomputeSamplerPeaks(), drawStrip render, FREEZE toggle, marker drag, PREVIEW extraction
- `─── DRUM PADS — synthesized 808 kit ───` → all 8 voice synthesis recipes (each accepts optional `when` for scheduled playback by the sequencer)
- `─── SAMPLE PADS — 8 chops captured from the sampler ───` → SAMPLE_PAD_KEYS, buildSamplePadGrid, selectSamplePad, triggerSamplePad, assignActivePad, mini-waveform render, keyboard listener
- `─── MASTER CLOCK — Chris Wilson lookahead scheduler ───` → `DR.clock` shape + scheduler. Subscribers fire with (stepIndex, audioTime). step=-1 means stopped.
- `─── STEP SEQUENCER — grid render, click handlers, clock subscription ───` → drum + sample sequencer grids, clock subscribers, PLAY/SWING/CLEAR
- `─── SAMPLE SEQUENCER ───` → buildSampleSeqGrid, clock subscriber for sample pads, sample CLEAR
- `─── SYNTH — subtractive monosynth (per-note voice) ───` → SYNTH state, startNote/endNote, voice pool
- `─── SCRATCH worklet (lazy) ───` → ensureScratch (loads on first disc gesture)
- `─── BEAT REPEAT worklet ───` → ensureBeatRepeat (loads on first un-bypass with division != off)
- `─── BYPASS (per module) ───` → applyBypass + applyTempoBypass
- `─── COLLAPSE / EXPAND (per module) ───` → chevron + header click handlers (chevrons hidden in FX rack now)
- `─── SECTION COLLAPSE ───` → section-level collapse mechanism (chevrons hidden in PLAY mode)
- `─── MODE TOGGLE — PLAY (default) / CREATE (beta) ───` → applyMode, localStorage persist, body data-mode attribute
- `─── RELEASE — A/B compare ───` → master killswitch (formerly BYPASS ALL)
- `─── CLEAR ALL ───` → rack reset button handler
- `─── PHASER LFO TICKER + MINI-VIS ───` → tickPhaser + drawPhaserVis
- `─── SYNTH OSCILLOSCOPE VISUALIZER ───` → drawSynthVis
- `─── EQ CURVE ───` → drag handlers + drawEqCurve (uses getFrequencyResponse for accurate response)

## Lessons learned this session (avoid repeating)

- **Don't ship audio-chain changes without verifying.** I shipped the SoundTouch FIFO drain "fix" then moved on; Jackson hit it hours later with audible crackle. Always ask Jackson to verify after any worklet/audio-routing change before treating it as done.
- **Watch CSS specificity overrides on top of base styles.** Twice this session I changed a base `.dr-mod` style and forgot the `[data-collapsed="true"]` override was beating it. When making a base-style change, search for higher-specificity selectors in the same scope and update them too.
- **Replacement edits at boundary lines.** If old_string ends right before a structural line (e.g. `function drawCurve() {`), include that line in new_string OR re-add it. I deleted `function drawCurve() {` once mid-replacement and it cascaded into a parse error.
- **TDZ on top-of-IIFE references.** Don't reference a `const` declared later in the IIFE from earlier code — TDZ throws and halts the rest of the IIFE, breaking unrelated wiring.
- **Stick to defined palette vars.** Jackson called this out: no improvised `oklch(...)` values. Use `--dr-panel-*`, `--dr-ink-*`, `--dr-moss`, `--dr-amber`, etc.
- **Throttle DOM writes for jittery numeric displays.** BPM detection at 60fps with sub-pixel layout shifts can visibly jiggle nearby elements (the SCREW knob seizure bug). Either throttle the update OR fix-width the affected cells.

## How to resume in a fresh session

1. `cd /Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/elastic-swartz-30b73e`
2. Verify `python3 -m http.server 8765` is running (or start it backgrounded)
3. Read `darkroom/BRIEF.md` for original design context, then this file for current state
4. Read Jackson's working-style memory file (`memory/MEMORY.md` in the user's auto-memory dir) before responding — strict rules on root-cause investigation, no acting without approval, palette discipline, etc.
5. Open `http://localhost:8765/darkroom.html` in Chrome
6. Hard-refresh (`Cmd-Shift-R`) when reloading after worklet changes — worklets are cached separately
7. After ANY audio-chain or worklet change, ask Jackson to verify in-browser before moving on

## Repo / branch

- Worktree: `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/elastic-swartz-30b73e`
- Branch: `claude/elastic-swartz-30b73e`
- Latest commit on this branch: `63384b3` (EQ + sync fix + stream cleanup, mid-2026-05-03). Everything since — phaser, beat repeat, tape scratch, REVERSE, instrument rack, drum pads, synth, scratch worklet, color swap, masthead refresh, RELEASE/CLEAR ALL, sampler reframe phases 1–4, mode toggle, master/sampler restructure, FX rack rebuild, BEAT REPEAT relocation, hero title removal, sourceGain mute on freeze — is uncommitted.
- Jackson controls when this hits main. Don't push without asking.

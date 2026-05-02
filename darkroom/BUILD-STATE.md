# darkroom — Build State

Snapshot of where the build is, written for a fresh Claude session to resume cleanly. Last updated mid-session during the dark→Rams visual pivot.

## TL;DR

- **Working file:** `darkroom.html` at the repo root (was the dark/forest version, in transition to Rams cream).
- **Frozen reference:** `darkroom-dark.html` — exact snapshot of the dark/forest version, committed to git. Always viewable as-is.
- **Design brief:** `darkroom/BRIEF.md` — original /shape output from May 1 session. Most decisions still hold; the visual register section is being revisited.
- **Local dev:** `python3 -m http.server 8765` from repo root, then Chrome → `http://localhost:8765/darkroom.html` (or `darkroom-dark.html`). Localhost is required for `getDisplayMedia`.

## Architecture

Single static HTML page, vanilla. Inline CSS, inline JS. Matches the rest of the Jackson Alexander Studio site's per-page-inline-styles pattern.

```
darkroom.html              ← main file (head + style + body + script all inline)
darkroom-dark.html         ← frozen dark-aesthetic snapshot
darkroom/
  BRIEF.md                 ← design brief from /shape
  BUILD-STATE.md           ← this file
  fonts/
    DepartureMono-Regular.woff2   ← self-hosted, technical-readout font
  lib/
    soundtouch-processor.js       ← AudioWorklet for time-stretch on streams
                                    (tuned to ~48ms latency, see comment in file)
    LICENSE-soundtouch.txt        ← LGPL license file
```

External fonts loaded via Google Fonts: **Workbench** (display, masthead), **Excon** via Fontshare CDN (control labels — Teenage-Engineering register), **Fragment Mono** (fallback for readouts), DM Sans (legacy from site nav).

## What's shipped (all 5 phases + extensions)

### Phase 1: visual skeleton
HTML + CSS scaffold. Modules render, knobs draw, no audio.

### Phase 2: file-input audio engine
Drop a file or click FILE → AudioBufferSource → effects chain → output. Native `playbackRate`/`detune` on the source for SCREW (zero added latency). Procedurally synthesized 8 reverb IRs at runtime. MediaRecorder writes captured output to Downloads (webm/opus). Real-time visualizations driven by AnalyserNodes: input strip waveform, FabFilter-style filter curve with live spectrum overlay, IR display, master pre/post/GR meters, input bay level.

### Phase 3: live tab + device routing
`getDisplayMedia({video:true, audio:{...}})` for tab capture with `suppressLocalAudioPlayback:true` (mutes the source tab so user only hears processed output) plus `echoCancellation/noiseSuppression/autoGainControl: false` (critical — Chrome applies voice DSP by default which wrecks music). Custom device picker popover via `enumerateDevices` + `getUserMedia` for any input including Loopback virtual devices.

### Phase 4: time-stretch worklet for streams
SoundTouch self-hosted at `darkroom/lib/soundtouch-processor.js`. Async `addModule` registration with graceful fallback. **Worklet inserted on-demand** — only when TEMPO/PITCH bypass is OFF. When bypassed, source connects directly to inputAnalyser, zero added latency. Worklet tuned to `setParameters(sampleRate, 40, 15, 8)` for ~48ms latency vs SoundTouch's default ~150ms.

**Dual-path engine:** files use native `playbackRate`/`detune` (zero latency, perfect screw). Streams use the worklet's `rate`/`tempo`/`pitchSemitones` params. Same knobs (SCREW/RATE/PITCH) drive both.

### Phase 5 in flight: visual pivot to Rams aesthetic
Currently in mid-pivot. Dark/moss/forest palette → cream/grey/orange/olive Rams palette. See "open decisions" below.

### Modules in the rack (5 total)
1. **TEMPO/PITCH** — SCREW (linked tempo+pitch macro), RATE (independent tempo), PITCH (semitones). Bypass actually swaps the worklet in/out of the chain on streams.
2. **FILTER** — biquad LP/HP/BP, CUT (log) + RES knobs, **FabFilter-style draggable cutoff handle on the curve canvas** (X = cut, Y = res), live spectrum behind, **plus FILTER LFO sub-section** (5 waveforms: SIN/TRI/SAW/SQ/S&H, free-rate or tempo-synced via SYNC toggle, division grid, target selector CUT/RES/BOTH, depth knob = ±2 octaves at full, animated mini-canvas with playhead, live curve animation when LFO is engaged).
3. **DELAY** — beat-synced (1/32 to 2/1 + dotted/triplet modifiers), tap tempo, BPM display, TIME (auto-syncs from BPM × division), FB (feedback), TONE (LP on feedback), MIX. Visualization shows simulated tap positions decaying by FB.
4. **REVERB** — 8 procedurally synthesized IRs (wood/plate/spring/tape/hall/chamber/cathedral/cave), IR display canvas shows decay envelope, SIZE + MIX knobs.
5. **MASTER** — soft limiter (DynamicsCompressor at -1 dBFS, ratio 20), pre/post/GR meters, OUT gain in dB.

### Sections above the rack
- **Masthead** — "darkroom" word in Workbench at clamp(72,12vw,148px), `BYPASS ALL · A · B` killswitch top-right (toggles all 4 module bypasses, hazard-amber when active, restores prior state on disengage).
- **Input bay** — TAB / DEVICE / FILE buttons (each ~22px Excon name + spec text in dr-fx). FILE + drag-drop anywhere. TAB opens Chrome share dialog. DEVICE opens custom popover with audio inputs.
- **Audio player ("hero section")** — TP-7-inspired tape deck disc on the left (280px, scratchable via pointerdown+drag, rotates with audio time), right panel has SOURCE/ELAPSED/BPM/RATE info row + live waveform strip + scratch hint. **Auto-BPM detector** runs onset-detection on the input analyser's bass band (60–200 Hz), median-filters intervals, octave-folds into 60–180 BPM, displays in Workbench at 24px with a confidence dot.
- **Scratch behavior** — angular velocity of the drag → playback rate, clamped 0.05× to 2.5× (forward only in v1; reverse + rolling-buffer time-machine queued for v2/Path B).

### Transport (below the rack)
ARM → REC → stops to write WAV/webm to Downloads. Time counter, file display.

### Per-module reset (`↺` glyph in module headers)
Resets that module's knobs to defaults plus mode/IR/division/LFO state. Filter reset also clears all LFO state (shape, target, sync, division, on/off).

### Default state on page load
**All 4 FX modules bypassed**, audio plays clean until user opts in. The bypass dot starts dim and lights up green when engaged. Stream connections don't insert the worklet until tempo bypass is disengaged → zero added latency on initial connect.

## Rams pivot — current state (Phase 5 v1 SHIPPED)

The cream/grey/Braun-orange/olive Rams aesthetic is shipped at v1. `darkroom.html` is the live working copy; `darkroom-dark.html` is the frozen pre-pivot snapshot for A/B comparison. Both viewable at localhost:8765 simultaneously.

### Color system (locked)
- **Panel base:** `oklch(0.83 0.013 80)` — warm grey canvas, like Braun T3 case body. Note: this is DARKER than module surfaces, so modules read as "elevated" on the canvas.
- **Panel-2:** `oklch(0.90 0.014 80)` — module/section surface
- **Panel-3:** `oklch(0.96 0.014 80)` — gradient highlight tone
- **Panel-4:** `oklch(0.76 0.016 78)` — recessed shadow tone
- **Ink:** `oklch(0.18 0.008 80)` — deep charcoal silkscreen
- **Primary control accent (was moss):** `oklch(0.64 0.18 35)` — Braun Hermes orange. Used on knob arcs, active modules, bypass dot active, mode buttons active, kill button active border, bay button active text.
- **Secondary visualization (was forest):** `oklch(0.50 0.11 130)` — olive-Braun green. Used on waveform peaks, IR display, filter spectrum overlay, level meters, source label, delay tap visualization.
- **Warning (was amber):** `oklch(0.52 0.18 25)` — signal red. Used on recording armed, clipping warning, kill active, playhead cursors.
- **Aluminum gradient stops** for tactile knob faces: `--dr-alu-hi 0.97`, `--dr-alu-mid 0.86`, `--dr-alu-lo 0.62` (all hue 80).

### Tactile surfaces (locked)
- **Lifted surfaces** (bay buttons, modules, transport, kill, tape) use a layered background:
  1. **Viewport-anchored radial sheen** at upper-left (`background-attachment: fixed`, ellipse 120vw × 80vh at 22% / 8%, max opacity 0.25) — creates a single shared world light source. As elements move past this point under scroll, their highlight position shifts naturally.
  2. **Compressed linear-gradient body** (0.92 → 0.90 lightness, only 0.02 range) — barely-perceptible matte, reads nearly flat.
  3. **Sharp top edge highlight** via `inset 0 1px 0 rgba(255,255,255,.92–1)`
  4. **Soft bottom inset shadow** via `inset 0 -1px 0 rgba(0,0,0,.05–.06)`
  5. **Tight ground shadow** + **soft elevation shadow** below.
- **Recessed surfaces** (waveform strip): inverted lighting — dark inset at top, no top highlight, gentle bottom edge highlight. Reads as cut-into-panel.
- **Press states** on bay buttons, kill, mode buttons, tap, transport: `:active` swaps to inset shadow (depressed feel) without translateY (per Jackson's no-jitter rule).

### Knob faces (locked)
- Shared SVG `<radialGradient id="knobFace">` defined globally in body, all knobs reference via `fill="url(#knobFace)"`
- Inner circle (r=38) = brushed-aluminum face with radial gradient simulating top-left light
- Outer circle (r=42) = decorative concentric rim line stroke
- Tick mark in deep charcoal at 2.4 stroke-width
- Soft outer drop shadow via CSS `filter: drop-shadow(0 2px 3px rgba(0,0,0,.18))`

### Tape disc (locked)
- Face stays `#050505` — becomes THE one dark element on the cream panel, like an ET66 calculator screen embedded in a Rams product.
- All on-disc text/lines hardcoded to light grey/white values so they read against the dark face (cannot use the now-charcoal `--dr-ink-dim`).

### Typography (locked)
- **Google Sans Code** (Google Fonts, weights 300–700) — masthead "darkroom" + BPM display + module names (TEMPO/PITCH, FILTER, DELAY, REVERB, MASTER) + input bay button names (TAB, DEVICE, FILE).
- **Excon** (Fontshare CDN) — control labels: knob labels, mode buttons, IR slot names, meter labels, transport buttons, LFO controls.
- **Departure Mono** (self-hosted in darkroom/fonts/) — technical readouts: knob values, time, IR slot numbers, on-disc text, filter/IR/delay canvas labels.
- Workbench is loaded via Google Fonts as a fallback for the masthead but Google Sans Code now leads.

### Future direction (deferred — pick up in fresh session)

Priority order for what's left:

1. **Real-space CC0 reverb IRs** — replace the 8 procedurally synthesized IRs with actual room recordings. Source: openair.hosted.york.ac.uk (CC license), or the IRCAM repository, or Fokke van Saane's archive. Need stereo, normalized, ideally 48kHz, total budget ~2MB. Save to `darkroom/irs/01-wood.wav` etc., update `loadIR()` in darkroom.html to fetch and decode WAV instead of calling `synthesizeIR()`. ~30–45 min of work.

2. **Playground tile registration** — add darkroom as a tile in `playground.html`. Edit the `items` array (around line 316), add a new entry under a new "Tools" category or under "Visualizers". Needs a thumbnail (could be a static screenshot of the cream UI, or a generated tile with the masthead text). The tile links to `darkroom.html`. ~20 min.

3. **Tape rolling buffer (Path B)** — the OB-4-style time-machine. Custom AudioWorklet with a circular Float32Array buffer (~30s default), playhead position param, scratch playback that can read backwards through the buffer. The current scratch is rate-modulation only (forward); Path B lets you rewind into the past on a live stream. Real engineering: ~1–2 hours. Architecture: replace or wrap the current SoundTouch worklet — needs careful state management so SCREW/RATE/PITCH still work alongside the rewind buffer.

4. **Site-wide orange→green accent migration** — `portfolio.html` and `playground.html` still show the legacy `#D95740` orange in their `--accent` variable. Per Jackson's memory note, mossy forest green is the new direction sitewide. Update the `--accent` value in those files to the new green. Note: darkroom itself just pivoted to Rams cream/orange so its accent is intentionally different — the sitewide migration is for the Jackson Alexander Studio site overall, not for darkroom.

5. **Rams polish iterations** — possibly fine-tune the knob highlight positions (currently radial light from top-left at 35%/30%), refine the press-state shadow falloff, double-check IR display + filter curve readability on cream, possibly add subtle texture (paper/grain) to the panel surfaces for more material feel. ~30–60 min.

6. **Phase 6+ stretch goals** — Web MIDI for Maschine pad mapping, preset save/load via localStorage, more reverb IRs, additional FX (phaser, saturation, tape character single-toggle).

## Critical inline-comment markers in darkroom.html

When resuming, search for these to find the load-bearing code:

- `─── ENGINE STATE ───` → DR object structure, all state lives here
- `─── INIT (lazy, on first user gesture) ───` → ensureCtx, buildChain
- `─── PROCEDURAL IRs` → IR_PRESETS table for the 8 reverbs
- `─── KNOB INTERACTION ───` → makeKnob factory (document-level pointermove/up so knobs never get stuck)
- `─── FILTER CURVE — pointer-driven` → drag-on-curve handlers
- `─── BYPASS (per module) ───` → applyBypass + applyTempoBypass (the latter swaps the worklet in/out for streams)
- `─── TAB AUDIO CAPTURE` → critical audio constraints documented inline
- `─── DEVICE PICKER` → enumerateDevices + popover
- `─── RECORDING ───` → MediaRecorder + WAV download
- `─── TAPE DECK (TP-7 style scratch + auto-rotate) ───` → disc rotation + scratch handler
- `─── AUTO BPM DETECTION` → onset-based detector
- `─── LFO TICKER + VIS` → filter LFO

## How to resume in a fresh session

1. `cd` to the repo root (worktree path: `/Users/jacksonalexander/Desktop/CLAUDE/.claude/worktrees/stoic-bassi-236d89`)
2. `python3 -m http.server 8765 &`
3. Read `darkroom/BRIEF.md` for original design context, then this file for build state
4. Open `http://localhost:8765/darkroom.html` (in-progress) or `http://localhost:8765/darkroom-dark.html` (frozen reference) in Chrome
5. Hard-refresh (`Cmd-Shift-R`) when reloading after worklet changes

If TAB capture is being tested: pick a tab playing audio, tick "Share tab audio" checkbox in Chrome's dialog. Music quality requires the audio constraints we've set; don't remove them.

## Repo / branch

Worktree branch: `claude/stoic-bassi-236d89`. Most recent commit: dark/forest snapshot before Rams pivot. Not pushed to remote — Jackson controls when this hits main.

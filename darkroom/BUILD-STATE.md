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

## Open decisions (mid-pivot)

### Visual direction
Pivoting from dark/moss/forest to Dieter Rams cream/grey/Braun-orange/olive-green. Confirmed:
- **Panel base:** warm cream `oklch(0.92 0.012 80)`
- **Ink:** deep charcoal `oklch(0.18 0.008 80)` on cream
- **Primary control accent:** Braun signal-orange `oklch(0.62 0.18 35)` (replacing moss)
- **Secondary visualization:** olive-Braun green `oklch(0.50 0.11 130)` (replacing forest)
- **Warning:** signal red `oklch(0.50 0.18 25)` (replacing amber)
- **3D buttons:** linear-gradient(180deg, light, base) + `inset 0 1px 0 rgba(255,255,255,.6)` + soft drop shadow. Pressed = inverted gradient + no shadow.
- **3D knobs:** SVG with radialGradient simulating brushed-aluminum dial under top-left light source, knurled rim hint, dark tick mark, CSS `filter: drop-shadow()` for the lift.
- **Tape disc:** stays dark (becomes THE one dark element on the page, like a calculator screen embedded in the cream panel).

### Future direction (deferred)
- **Path B for tape deck:** rolling buffer for stream rewind (OB-4 style time machine), reverse playback for files
- **Real-space CC0 IRs** to replace synthesized reverbs
- **Playground tile registration** so darkroom shows up on jacksonalexanderstudio.com/playground
- **Web MIDI** for Maschine pad mapping
- **Preset save/load** via localStorage

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

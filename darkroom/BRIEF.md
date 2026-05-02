# darkroom.ja — Design Brief

Single-page browser-based real-time audio processor. Hosted on the Playground section of jacksonalexanderstudio.com. Output of /shape session, May 2026.

---

## 1. Feature summary

`darkroom.ja` is a single-page browser-based real-time audio processor. Users point it at any audio source playing on their machine — a Chromium tab, a connected audio device, or a dropped file — and run that signal through a chain of real-time effects (tempo / pitch / filter / reverb / limiter) with optional WAV recording. Built for producers and music-aware listeners who want to bend audio without leaving the browser or opening a DAW.

## 2. Primary user action

Hear a song you're already listening to bent into a different shape, in under 30 seconds, with no setup. The single most important moment is the first knob turn — input → audible change → *oh*.

## 3. Design direction

**Abstract instrument schematic.** Reads as serious software the way an ECM Records sleeve reads as serious music — by what it withholds. No skeuomorphism. No fake metal, fake LEDs, fake screws, fake knob caps. Instrument-feeling comes from precision of layout, not imitation of textures. Modules render as labeled rectangles with line-drawn knob/slider geometry; signal flow is drawn as actual lines on the canvas connecting them. The face of the panel is the schematic.

**References pulled toward:**
- Buchla Music Easel actual panel (geometric shapes, curved signal lines, sparse labels)
- Iannis Xenakis polytope schematics (score-as-architecture)
- ECM Records sleeves under Manfred Eicher (restrained type, massive air, total seriousness without volume)
- Otl Aicher Munich '72 pictograms (function-clarity as aesthetic)
- FabFilter Pro-Q / Pro-MB UI (visualization as functional control — drag the curve, not just a knob mirror)
- David Carson's broken-grid energy — but only at masthead and section heads. Inside modules: Swiss discipline.

**References pulled away from:**
SSL channel-strip pastiche, 909 chiclet-button pastiche, Oakley X-Metal chrome maximalism, Y2K decimal-readout pastiche. None are literal references — the tool is its own object.

**Color discipline (three colors total):**
- Off-black panel `#0c0c0c` (matches existing site)
- Off-white type
- Mossy forest green for primary accent (matches recent green commit)
- One hazard amber used *only* for state changes (recording armed, clipping warning)

**Type:** Fragment Mono for all utility (already loaded sitewide). Masthead `darkroom.ja` set lowercase, spacious, confident — same family at larger optical size.

**Motion discipline:** the static schematic stays still. No masthead animation, no panel breathing, no module pumping. Reactivity lives only in the visualization elements (input strip, filter curve, IR display, meters) — those move because they display audio. Everything else is grounded.

## 4. Layout strategy

Single page, desktop-first (≥1280px). Mobile = informational redirect — the underlying audio APIs aren't usable on mobile.

```
┌────────────────────────────────────────────────────────────────────┐
│  darkroom.ja      v 1.0                          ← playground      │   masthead — Carson-broken allowed
├────────────────────────────────────────────────────────────────────┤
│  INPUT BAY                                                         │
│  [ TAB ]   [ DEVICE ]   [ FILE ]    source: ──── level: ▮▮▮▯▯     │   3 affordances always visible
├────────────────────────────────────────────────────────────────────┤
│  ▮▮▮▯▮▯▯▮▮▯▯▮▮▮▯ ── live waveform / spectrum strip ── ▮▯▮▮▯▮▮▯  │   visualization 1 (always live)
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──TEMPO/PITCH──┐──┌────FILTER────┐──┌────REVERB────┐──┌─MASTER─┐ │   the schematic
│  │ ◉rate ◉SCREW  │  │ ◢ curve drag │  │ ◢ IR shape   │  │ pre▮▮  │ │   modules + drawn signal flow
│  │       ◉pitch  │  │ ◉cut ◉res    │  │ ◉size ◉mix   │  │ post▮▮ │ │
│  │               │  │ live spectrum│  │ 01–08 select │  │ GR ▮   │ │
│  └───────────────┘  └──────────────┘  └──────────────┘  └────────┘ │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  ◉ ARM   ▶ REC                    darkroom-2026-05-01-22h47.wav    │   transport
└────────────────────────────────────────────────────────────────────┘
```

Carson-broken energy lives only at masthead and module section labels — a label rotated 90° up the side of a module, a version stamp bleeding off-grid. Inside modules: total grid discipline.

### TEMPO/PITCH module structure
SCREW is the headline control — larger geometry, centered. RATE and PITCH flank it smaller for fine independent control.
- **SCREW** — linked tempo+pitch macro. Default `1.00×`. Range `0.50×–1.50×`. Routes through native `playbackRate` (zero added latency, zero stretching artifact).
- **RATE** — independent tempo. Default `1.00×`. Routes through rubberband-wasm phase vocoder (~30ms latency).
- **PITCH** — independent pitch in semitones. Default `0 st`. Range `−12 st to +12 st`. Routes through rubberband.
- RATE/PITCH override SCREW when touched. Double-click any knob = snap to default.

### Visualization elements (5 — all functional, none decorative)
1. **Live input strip** along top of schematic — real-time waveform + spectrum of source signal. Always visible.
2. **FILTER frequency response curve** (FabFilter Pro-Q register) — draggable cutoff/resonance handles directly on the curve, with live spectrum behind. Numerical readouts mirror the drag.
3. **REVERB impulse-response display** — visualization of the loaded IR's actual decay envelope.
4. **MASTER meters** — pre-limiter input, post-limiter output, gain-reduction bar.
5. **Signal-flow lines** between modules — bright when the module is doing work, flat when bypassed.

## 5. Key states

- **Cold load** — input bay live, modules dimmed, three options named with one-line specs each. No empty-state preaching.
- **Live, no FX engaged** — source + level shown. Schematic fully drawn, all modules at neutral. Input strip animating with audio. Signal passes through unchanged.
- **Live, FX engaged** — non-neutral knobs render brighter, values show, signal-flow lines bright at active modules. Filter curve, IR display, and meters all reflecting current audio.
- **Recording armed** — hazard amber on record button, thin amber line along master output. Filename + duration tick up.
- **Recording stopped + saved** — amber clears, brief readout: filename + "saved to downloads."
- **Source disconnected mid-session** — input bay shows disconnect, schematic dims, level flat. One-line factual message.
- **Tab capture unsupported** (Safari/Firefox) — TAB option disabled with one-line explanation; other inputs unaffected.
- **Clipping** — amber pulses on master GR meter when limiter clamps hard.

## 6. Interaction model

- **Input pickup:** click TAB/DEVICE/FILE → native browser picker → live immediately. No "play" button. If a source is connected, the page is processing.
- **Knobs:** click-drag vertical or scroll-wheel. Double-click resets to default. Current value always visible.
- **Sliders:** click-drag along axis. Double-click resets.
- **Filter curve:** drag the curve handles directly to set cutoff and resonance. Knobs are redundant — both are valid input methods (matches FabFilter pattern).
- **Module bypass:** small geometric toggle per module; bypassed modules dim, signal-flow line through them flattens.
- **Record:** arm → start → stop → WAV writes to Downloads.
- **No projects, no presets, no save in v1.** Refresh = blank slate. Presets via localStorage are a v2 concern.

## 7. Content requirements

All copy in field-bulletin / instrument-catalog register. Short, declarative, technical. No marketing voice.

| Element | Copy |
|---|---|
| Masthead | `darkroom.ja  v 1.0  · real-time audio processor / browser-resident` |
| Input bay labels | `TAB`, `DEVICE`, `FILE` + one-line specs (`capture audio from a Chromium tab`, `pick an input from your audio interface`, `drop or select a local audio file`) |
| Module labels | `TEMPO/PITCH`, `FILTER`, `REVERB`, `MASTER` + tiny parenthetical (`phase vocoder + native rate`, `biquad, 12dB/oct`, `convolution, 8 IRs`, `soft limiter, −1.0 dBFS`) |
| Knob labels | `RATE`, `SCREW`, `PITCH`, `CUTOFF`, `RES`, `SIZE`, `MIX` — single words |
| Value readouts | Real units: `0.85×`, `−6 st`, `840 Hz`, `0.42`, `2.1 s`, `−4.0 dB` |
| Status | `Connected: tab — youtube.com`, `No source`, `Recording → darkroom-2026-05-01-22h47.wav`, `Saved to downloads` |
| Errors | `Browser does not support tab capture. Use Chrome, Arc, Brave, or Edge for this input.` / `Source disconnected.` / `File format not supported.` |
| Footer | `client-side only · no upload · for personal use` + back-link to Playground |

**Banned copy:** "Transform your sound." "Unleash your creativity." "Ready to dive in?" "Welcome!" Any greeting, aspirational verb, or wellness-brand register.

## 8. Reverb library (8 IRs)

| # | Name | Character | Approx. decay |
|---|---|---|---|
| 01 | wood room | tight, intimate | ~0.4s |
| 02 | plate | classic studio plate | ~1.8s |
| 03 | spring | vintage amp/dub | ~0.6s |
| 04 | tape echo | regenerating tape delay character | ~2.5s |
| 05 | hall | mid-size concert hall | ~2.4s |
| 06 | chamber | classical recording chamber | ~1.5s |
| 07 | cathedral | massive sacred space | ~5.0s |
| 08 | cave | dark, irregular | ~3.8s |

Selector shows numbered slots `01`–`08` with names below each. Total IR budget ~2MB, preloaded after page load. Source: synthesize plate/spring/tape-echo, source real spaces (hall, chamber, cathedral, cave) from CC0 IR collections.

## 9. Loudness / safety

- **Output gain default:** unity (0 dB). Same loudness as the source — no quiet-out-of-the-box surprise.
- **Master limiter ceiling:** −1.0 dBFS. Protects against reverb-feedback explosions and clipping. Engages only on extreme settings.
- **Gain-reduction visible** on master module so the user sees when the limiter is clamping.
- **Standard pro calibration** — same loudness profile as a typical plugin chain, not conservative-default-quiet.

## 10. Recommended references for implementation

When this moves to /impeccable craft:
- **spatial-design** — schematic layout, signal-flow drawing, panel composition
- **typography** — Carson-broken masthead vs. Swiss-discipline interior
- **interaction-design** — knob/slider patterns, drag-on-curve, value readouts
- **motion-design** — visualization motion, hazard amber pulse, record state transitions
- **anti-patterns** — actively check against SaaS / SSL / 909 / chrome traps

## 11. Open questions for build

- **Knob rendering style:** pure line (circle + tick) or further stylized? Prototype to pick.
- **Spectrum analyzer FFT size:** default 2048; profile and revisit if needed.
- **Filter curve interaction:** drag-on-curve + knobs as redundant inputs (matches FabFilter).
- **Mobile fallback:** informational redirect (`darkroom.ja runs on desktop browsers`).
- **Recording filename format:** `darkroom-YYYY-MM-DD-HHMM.wav` auto-named for v1.

## 12. Out of scope (v2+)

- Presets / save state (localStorage)
- Web MIDI mapping (Maschine pads → controls)
- Beat-synced delay with tap tempo
- Phaser, saturation, tape character
- Patch-cable visual routing
- Low-latency mode toggle
- IR library expansion beyond 8

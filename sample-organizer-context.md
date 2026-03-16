# Maschine Sample Organizer - Session Context

## What We Did
1. Installed librosa for audio analysis
2. Organized **1,464 Maschine 3 samples** (`~/Documents/native instruments/maschine 3/samples/`) into categorized subfolders using spectral audio analysis
3. Organized **212 Maschine 2 samples** (`~/Documents/Native Instruments/Maschine 2/Samples/` and `Recordings/`)
4. Categories: bass, drums, vocals, keys, guitar, synth, pads, fx, strings, loops, misc
5. Symlinks left at original file paths so Maschine projects can still find samples
6. Tagged 1,462 samples in Maschine's library database (`komplete.db3`) with proper categories
7. Cleaned 885 sample display names (stripped timestamp prefixes like `20250208T093446 - 1 -`)

## Current Issues That Need Fixing
- **Missing sample notification in Maschine** — 118 user sample files were already missing BEFORE we started (timestamps that don't exist anywhere on disk). Factory samples are confirmed intact at `/Users/Shared/`
- **The "other" category splitting** — worked but user wants to review/adjust results
- **Symlinks** — currently 181 working, 0 broken. But user may want to verify specific projects load correctly
- **Database backup** exists at: `~/Library/Application Support/Native Instruments/Maschine 3/komplete.db3.backup`

## Key File Locations
- **Organizer script**: `~/Library/Application Support/Claude/local-agent-mode-sessions/cff39687-dd3d-4673-a77e-f8a7fca709fd/2d592e5a-d1f0-49ec-958c-c02b441612e1/local_d2fbf065-dde8-4ad0-99df-9d1491ecf9e8/outputs/organize_samples.py`
- **Maschine 3 samples**: `~/Documents/native instruments/maschine 3/samples/`
- **Maschine 2 samples**: `~/Documents/Native Instruments/Maschine 2/Samples/` and `Recordings/`
- **Maschine library DB**: `~/Library/Application Support/Native Instruments/Maschine 3/komplete.db3`
- **DB backup**: `~/Library/Application Support/Native Instruments/Maschine 3/komplete.db3.backup`
- **Factory samples** (untouched): `/Users/Shared/Maschine 2 Library/` and `/Users/Shared/Maschine Central Library/`

## What User Wants To Change
- User said current state "is not correct and needs changes" — need to discuss specifics
- May want different categorization, filename formatting, or folder structure adjustments
- Close Maschine before making any DB changes

## Technical Notes
- Maschine .mxprj files are binary, store sample paths as relative strings like `Samples/filename.wav`
- komplete.db3 uses a custom SQLite collation called "KOMPLETE" — must register it in Python: `conn.create_collation("KOMPLETE", ...)`
- Maschine project files do NOT update automatically when files move — that's why we use symlinks
- The organize script only processes real files (not symlinks) at top level of each folder

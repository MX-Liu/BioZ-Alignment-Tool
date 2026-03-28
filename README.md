# BioZ Alignment Tool

Browser-based tools for reviewing synchronized BioZ, respiration strap, audio, and aligned gesture-label data.

This repository contains two main workflows:

- `bioz-aligner.html`: align BioZ and audio against respiration traces on a shared timeline, then export either the full shifted CSV or a selected segment.
- `label-editor.html`: review and correct label boundaries in an aligned CSV, then export a relabeled version.

No backend is required. Everything runs locally in the browser.

## Repository Contents

- `index.html`: dashboard entry page
- `bioz-aligner.html`: BioZ / respiration / audio alignment viewer
- `bioz-aligner.js`: aligner logic, chart rendering, and export
- `label-editor.html`: gesture label boundary editor
- `label-editor.js`: label-editor logic, boundary interaction, and export
- `label-editor.css`, `bioz-aligner.css`, `styles.css`: UI styling
- `app.js`: dashboard logic

## Browser Requirements

- Use a modern desktop browser.
- Chrome is the safest choice because the UI and copy were designed around a Chrome workflow.
- Audio import depends on the Web Audio API, so audio decoding must be supported by the browser for the selected file type.

## Quick Start

1. Open `index.html` in your browser.
2. Click either `BioZ aligner` or `Label editor` from the dashboard.
3. Load the required CSV file.
4. Optionally load audio in the BioZ aligner.
5. Review the signals, adjust alignment or boundaries, and export the result.

## Tutorial: BioZ Aligner

The BioZ aligner is for checking whether BioZ channels and audio line up correctly against the respiration straps.

### What You Need

- One synchronized CSV, for example `4_task1_synced_20hz.csv`
- Optional matching audio file such as `.m4a`, `.wav`, `.mp3`, `.aac`, or `.caf`

### Expected CSV Columns

The aligner expects a synchronized file with:

- a timeline column: `sync_timestamp_ms` or `timestamp_ms`
- BioZ channels: `txt_mag3`, `txt_mag4`
- respiration channels: `csv_ribmid`, `csv_ribright`, `csv_waistmid`, `csv_ribleft`

If these are missing, the file will be rejected.

### Step-by-Step Workflow

1. Open `bioz-aligner.html`.
2. Load the synchronized CSV with the `Synchronized CSV` file picker.
3. If you also want to align audio, load the matching recording with the `Audio file` picker.
4. Review the summary boxes:
   - `Session`
   - `Rows`
   - `Duration`
   - `Sample Rate`
   - `Audio`
   - `Audio Duration`
5. Inspect the plots:
   - `Session overview` shows the whole recording.
   - `Detail comparison` shows the current zoomed window.
   - All bands share the same time axis.
6. Recenter the detail view by clicking in the overview plot.
7. Change the zoom with:
   - `Detail window (seconds)`
   - `Zoom in`
   - `Zoom out`
   - `Reset`
8. Pan through time with:
   - the `Time scroll` bar
   - `Shift` + mouse wheel over a plot

### How Alignment Works

- The respiration traces stay fixed on the synchronized timeline.
- The BioZ shift moves the BioZ-derived traces left or right.
- The audio shift moves only the audio waveform left or right.
- Positive shift values move the signal later in time.
- Negative shift values move the signal earlier in time.

### Aligning BioZ to Respiration

1. Use `BioZ shift (ms)` for exact numeric changes.
2. Use the `BioZ shift slider` for coarse movement.
3. Use the `BioZ nudge` buttons for faster small adjustments.
4. Watch the `Alignment overlay` band:
   - `BioZ mean` is the average of the BioZ traces
   - `Resp mean` is the average of the respiration traces
5. Adjust until the peaks, valleys, and overall breathing rhythm line up visually.

### Aligning Audio

1. Load the audio file.
2. Use `Audio shift (ms)` or the `Audio shift slider`.
3. Use the `Audio nudge` buttons for quick corrections.
4. The audio waveform is shown on the same real time scale as the other plots.
5. Align it to obvious breathing events or BioZ/strap features that match the recording.

### Export Options

#### Save Shifted CSV

Use `Save shifted CSV` when you want a full synchronized CSV with the current BioZ shift applied.

What it does:

- applies the current BioZ shift to all `txt_*` columns
- keeps the respiration side fixed
- records the chosen audio shift as metadata

Added metadata columns:

- `txt_shift_applied_ms`
- `audio_shift_applied_ms`
- `audio_file_name`

This is the export you want if you are happy with the alignment for the full file.

### Segment Selection Tutorial

The aligner can also export only a chosen time interval.

#### Select a Segment

1. Click `Select on chart`.
2. Drag across either:
   - the `Session overview`, or
   - the `Detail comparison` plot
3. The selected interval will be highlighted.
4. Check the selection summary:
   - `Start`
   - `End`
   - `Duration`
   - `Audio Overlap`

Alternative:

- Click `Use visible range` to select exactly the current detail window.

If you want to remove it, click `Clear selection`.

#### Export the Selected Segment

- `Save selected CSV`: downloads only the selected aligned data interval
- `Save selected audio`: downloads only the overlapping shifted audio interval as a `.wav`
- `Save selected segment`: downloads both

The selected CSV also includes:

- `segment_start_ms`
- `segment_end_ms`
- `segment_duration_ms`
- `segment_start_jst`
- `segment_end_jst`

Notes:

- The selected CSV is clipped on the synchronized timeline.
- The selected audio respects the current audio shift.
- If the selected interval extends beyond the actual audio coverage, the tool exports the overlapping part only.

## Tutorial: Label Editor

The label editor is for correcting label transition times in an already aligned CSV.

### What You Need

- One aligned CSV with:
  - `timestamp_ms`
  - `activity_label`

Pressure-related fields are optional, but if they exist the editor will also show the pressure preview.

### What the Editor Shows

- `Session overview`: whole recording
- `Pressure preview`: nearest pressure frame to the selected time
- `Detail editor`: zoomed view with editable boundaries
- `Boundary editor`: list of detected label transitions

### Step-by-Step Workflow

1. Open `label-editor.html`.
2. Load the aligned CSV with the `Aligned CSV` picker.
3. Review the summary:
   - `Label Source`
   - `Segments`
   - `Boundaries`
   - `Duration`
4. Select a boundary in the boundary list.
5. The detail view will focus on the chosen transition.
6. Adjust the boundary in one of these ways:
   - drag the vertical boundary line directly in the detail plot
   - use `Previous` and `Next` to move between boundaries
   - use the nudge buttons
   - use keyboard shortcuts

### Keyboard Shortcuts

- `↑` / `↓`: previous / next boundary
- `Alt` + `←` / `→`: nudge by `0.01 s`
- `Shift` + `Alt` + `←` / `→`: nudge by `0.10 s`
- `R`: reset all boundaries

### Editor Options

- `Detail window (seconds)`: change the visible zoom window
- `Snap interval (ms)`: snap edited boundaries to a fixed time grid
- `Pressure shift (ms)`: shift pressure preview timing if pressure frames lag or lead the aligned timeline

### Exporting Corrected Labels

Use `Save relabeled aligned CSV` when boundary positions look correct.

The exported file:

- keeps the aligned timeline
- rewrites the label-related columns using the corrected boundaries
- updates pressure timing fields if pressure shift was used

## Recommended Workflow for a New Session

1. Start in the BioZ aligner.
2. Load the synchronized CSV.
3. Load the matching audio.
4. Align BioZ and audio against the respiration reference.
5. Export:
   - a full shifted CSV if you want the whole file aligned, or
   - a selected CSV/audio segment if you only need a specific interval
6. If you need label cleanup afterward, open the output in the label editor.
7. Correct label transitions and export the relabeled aligned CSV.

## Practical Tips

- Start with a large detail window, then reduce it when fine-tuning.
- Use the overview plot for navigation and the detail plot for decisions.
- Check several places in the session before deciding the alignment is correct.
- Use the alignment overlay to judge phase agreement faster than comparing many separate traces one by one.
- For segment export, check `Audio Overlap` before expecting a full audio clip.
- Keep an untouched original CSV in case you want to compare different alignment choices.

## Troubleshooting

### The CSV does not load

Check that:

- you selected the correct tool for the file
- the required timestamp column exists
- the required signal columns exist
- the file is comma-separated and includes a header row

### Audio does not appear

Check that:

- the audio file decoded successfully in the browser
- the audio shift is not pushing the waveform outside the visible window
- the loaded audio actually belongs to the same recording

### Selected audio export is shorter than expected

This usually means the selected time window extends outside the shifted audio coverage. The tool exports only the overlapping portion.

### Pressure preview says no pressure frame found

The CSV may not contain pressure data, or the current `Pressure shift (ms)` does not match the aligned timeline well enough.

## Output Summary

### BioZ aligner outputs

- full shifted CSV
- selected CSV segment
- selected audio segment as WAV

### Label editor outputs

- relabeled aligned CSV

## License

See `LICENSE`.

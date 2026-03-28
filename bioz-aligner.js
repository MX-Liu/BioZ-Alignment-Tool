const viewerState = {
  alignedFile: null,
  headers: [],
  rows: [],
  timestampField: null,
  sessionStartMs: null,
  sessionEndMs: null,
  detailCenterMs: null,
  viewWindowSec: 20,
  biozShiftMs: 0,
  audioFile: null,
  audioContext: null,
  audioBuffer: null,
  audioEnvelope: null,
  audioDurationMs: null,
  audioShiftMs: 0,
  sampleRateHz: null,
  traceSeries: [],
  selectionMode: false,
  selectionStartMs: null,
  selectionEndMs: null,
  selectionDrag: null,
};

const REQUIRED_FIELDS = [
  'txt_mag3',
  'txt_mag4',
  'csv_ribmid',
  'csv_ribright',
  'csv_waistmid',
  'csv_ribleft',
];

const SIGNAL_BANDS = [
  {
    key: 'bioz',
    label: 'BioZ mag3 / mag4 (z-score)',
    note: 'These traces come from the synchronized BioZ side and follow the BioZ shift control.',
    series: [
      { key: 'txt_mag3', label: 'mag3', color: '#00ffcc', shifted: true },
      { key: 'txt_mag4', label: 'mag4', color: '#c3ff56', shifted: true },
    ],
  },
  {
    key: 'resp',
    label: 'Respiration straps (z-score)',
    note: 'These traces stay fixed on the synchronized timeline and act as the reference.',
    series: [
      { key: 'csv_ribmid', label: 'ribmid', color: '#3bc2ff', shifted: false },
      { key: 'csv_ribright', label: 'ribright', color: '#ff9f43', shifted: false },
      { key: 'csv_waistmid', label: 'waistmid', color: '#f472b6', shifted: false },
      { key: 'csv_ribleft', label: 'ribleft', color: '#a78bfa', shifted: false },
    ],
  },
];

const TXT_DISCRETE_FIELDS = new Set(['txt_label']);
const AUDIO_ENVELOPE_BINS_PER_SECOND = 200;
const MIN_SELECTION_SPAN_MS = 10;
const JST_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hour12: false,
});

const ui = {
  alignedFileInput: document.getElementById('alignedFileInput'),
  alignedFileMeta: document.getElementById('alignedFileMeta'),
  audioFileInput: document.getElementById('audioFileInput'),
  audioFileMeta: document.getElementById('audioFileMeta'),
  sessionLabel: document.getElementById('sessionLabel'),
  rowCount: document.getElementById('rowCount'),
  sessionDuration: document.getElementById('sessionDuration'),
  sampleRate: document.getElementById('sampleRate'),
  audioLabel: document.getElementById('audioLabel'),
  audioDuration: document.getElementById('audioDuration'),
  selectionStartLabel: document.getElementById('selectionStartLabel'),
  selectionEndLabel: document.getElementById('selectionEndLabel'),
  selectionDurationLabel: document.getElementById('selectionDurationLabel'),
  selectionAudioOverlapLabel: document.getElementById('selectionAudioOverlapLabel'),
  windowSecondsInput: document.getElementById('windowSecondsInput'),
  biozShiftMsInput: document.getElementById('biozShiftMsInput'),
  biozShiftRange: document.getElementById('biozShiftRange'),
  audioShiftMsInput: document.getElementById('audioShiftMsInput'),
  audioShiftRange: document.getElementById('audioShiftRange'),
  statusBox: document.getElementById('statusBox'),
  resetShiftBtn: document.getElementById('resetShiftBtn'),
  resetAudioShiftBtn: document.getElementById('resetAudioShiftBtn'),
  saveShiftedBtn: document.getElementById('saveShiftedBtn'),
  selectionModeBtn: document.getElementById('selectionModeBtn'),
  selectVisibleRangeBtn: document.getElementById('selectVisibleRangeBtn'),
  clearSelectionBtn: document.getElementById('clearSelectionBtn'),
  saveSelectedDataBtn: document.getElementById('saveSelectedDataBtn'),
  saveSelectedAudioBtn: document.getElementById('saveSelectedAudioBtn'),
  saveSelectedSegmentBtn: document.getElementById('saveSelectedSegmentBtn'),
  shiftLabel: document.getElementById('shiftLabel'),
  audioShiftLabel: document.getElementById('audioShiftLabel'),
  viewportLabel: document.getElementById('viewportLabel'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomResetBtn: document.getElementById('zoomResetBtn'),
  timeScrollRange: document.getElementById('timeScrollRange'),
  traceList: document.getElementById('traceList'),
  overviewCanvas: document.getElementById('overviewCanvas'),
  detailCanvas: document.getElementById('detailCanvas'),
  biozShiftButtons: [...document.querySelectorAll('[data-shift-target="bioz"]')],
  audioShiftButtons: [...document.querySelectorAll('[data-shift-target="audio"]')],
};

initViewer();

function initViewer() {
  ui.alignedFileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    await loadAlignedFile(file);
  });
  ui.audioFileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    await loadAudioFile(file);
  });

  ui.windowSecondsInput.addEventListener('change', () => {
    const value = Number(ui.windowSecondsInput.value);
    viewerState.viewWindowSec = Number.isFinite(value) && value >= 4 ? value : 20;
    ui.windowSecondsInput.value = String(viewerState.viewWindowSec);
    updateViewportLabel();
    updateTimeScrollControl();
    drawAll();
  });

  ui.biozShiftMsInput.addEventListener('input', () => {
    const value = Number(ui.biozShiftMsInput.value);
    setBiozShiftMs(Number.isFinite(value) ? value : 0);
  });

  ui.biozShiftRange.addEventListener('input', () => {
    setBiozShiftMs(Number(ui.biozShiftRange.value) || 0);
  });
  ui.audioShiftMsInput.addEventListener('input', () => {
    const value = Number(ui.audioShiftMsInput.value);
    setAudioShiftMs(Number.isFinite(value) ? value : 0);
  });
  ui.audioShiftRange.addEventListener('input', () => {
    setAudioShiftMs(Number(ui.audioShiftRange.value) || 0);
  });

  ui.biozShiftButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.shiftDelta);
      if (Number.isFinite(delta)) {
        setBiozShiftMs(viewerState.biozShiftMs + delta);
      }
    });
  });
  ui.audioShiftButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.shiftDelta);
      if (Number.isFinite(delta)) {
        setAudioShiftMs(viewerState.audioShiftMs + delta);
      }
    });
  });

  ui.resetShiftBtn.addEventListener('click', () => setBiozShiftMs(0));
  ui.resetAudioShiftBtn.addEventListener('click', () => setAudioShiftMs(0));
  ui.saveShiftedBtn.addEventListener('click', exportShiftedCsv);
  ui.selectionModeBtn.addEventListener('click', () => {
    setSelectionMode(!viewerState.selectionMode);
  });
  ui.selectVisibleRangeBtn.addEventListener('click', selectVisibleRange);
  ui.clearSelectionBtn.addEventListener('click', () => {
    clearSelection();
    setStatus('Selection cleared.', false);
  });
  ui.saveSelectedDataBtn.addEventListener('click', exportSelectedCsv);
  ui.saveSelectedAudioBtn.addEventListener('click', exportSelectedAudioClip);
  ui.saveSelectedSegmentBtn.addEventListener('click', exportSelectedSegment);
  ui.zoomInBtn.addEventListener('click', () => adjustZoom(0.75));
  ui.zoomOutBtn.addEventListener('click', () => adjustZoom(1 / 0.75));
  ui.zoomResetBtn.addEventListener('click', () => {
    viewerState.viewWindowSec = 20;
    ui.windowSecondsInput.value = '20';
    updateViewportLabel();
    updateTimeScrollControl();
    drawAll();
  });
  ui.timeScrollRange.addEventListener('input', handleTimeScrollInput);

  ui.overviewCanvas.addEventListener('pointerdown', handleOverviewPointerDown);
  ui.detailCanvas.addEventListener('pointerdown', handleDetailPointerDown);
  ui.overviewCanvas.addEventListener('wheel', handleChartWheel, { passive: false });
  ui.detailCanvas.addEventListener('wheel', handleChartWheel, { passive: false });
  window.addEventListener('pointermove', handleSelectionPointerMove);
  window.addEventListener('pointerup', handleSelectionPointerUp);
  window.addEventListener('pointercancel', handleSelectionPointerUp);
  window.addEventListener('resize', () => {
    resizeCanvasToDisplaySize(ui.overviewCanvas);
    resizeCanvasToDisplaySize(ui.detailCanvas);
    drawAll();
  });

  resizeCanvasToDisplaySize(ui.overviewCanvas);
  resizeCanvasToDisplaySize(ui.detailCanvas);
  refreshViewerView();
}

async function loadAlignedFile(file) {
  if (!file) {
    clearAlignedFile();
    return;
  }

  try {
    const text = await file.text();
    const parsed = parseCsv(text);
    const timestampField = validateAlignedCsv(parsed.headers, parsed.rows);

    const rows = parsed.rows
      .map((cells) => Object.fromEntries(parsed.headers.map((header, index) => [header, cells[index] ?? ''])))
      .map((row) => {
        row[timestampField] = Number(row[timestampField]);
        return row;
      })
      .filter((row) => Number.isFinite(row[timestampField]))
      .sort((a, b) => a[timestampField] - b[timestampField]);

    if (!rows.length) {
      throw new Error('The synchronized CSV does not contain valid timestamp rows.');
    }

    viewerState.alignedFile = file;
    viewerState.headers = parsed.headers;
    viewerState.rows = rows;
    viewerState.timestampField = timestampField;
    viewerState.sessionStartMs = rows[0][timestampField];
    viewerState.sessionEndMs = rows[rows.length - 1][timestampField];
    viewerState.detailCenterMs = viewerState.sessionStartMs;
    viewerState.sampleRateHz = estimateSampleRate(rows, timestampField);
    viewerState.traceSeries = buildTraceSeries(rows);
    clearSelection({ draw: false });
    setBiozShiftMs(0, { draw: false });

    ui.alignedFileMeta.textContent = `${file.name} · ${rows.length} rows`;
    setStatus('Synchronized CSV loaded. Adjust the BioZ shift to compare it against the respiration channels.', false);
    refreshViewerView();
  } catch (error) {
    clearAlignedFile();
    setStatus(error instanceof Error ? error.message : 'Could not load synchronized CSV.', true);
  }
}

function clearAlignedFile() {
  viewerState.alignedFile = null;
  viewerState.headers = [];
  viewerState.rows = [];
  viewerState.timestampField = null;
  viewerState.sessionStartMs = null;
  viewerState.sessionEndMs = null;
  viewerState.detailCenterMs = null;
  viewerState.sampleRateHz = null;
  viewerState.traceSeries = [];
  viewerState.biozShiftMs = 0;
  viewerState.selectionMode = false;
  clearSelection({ draw: false });

  ui.alignedFileMeta.textContent = 'No file selected.';
  ui.biozShiftMsInput.value = '0';
  ui.biozShiftRange.value = '0';
  refreshViewerView();
}

async function loadAudioFile(file) {
  if (!file) {
    clearAudioFile();
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = getAudioContext();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const audioEnvelope = buildAudioEnvelope(decoded);

    viewerState.audioFile = file;
    viewerState.audioBuffer = decoded;
    viewerState.audioEnvelope = audioEnvelope;
    viewerState.audioDurationMs = audioEnvelope.durationMs;
    setAudioShiftMs(0, { draw: false });

    ui.audioFileMeta.textContent = `${file.name} · ${formatDuration(audioEnvelope.durationMs)}`;
    if (viewerState.rows.length) {
      setStatus('Audio loaded. Shift the waveform to align it with the BioZ and respiration traces.', false);
    } else {
      setStatus('Audio loaded. Load a synchronized CSV to view it on the shared timeline.', false);
    }
    refreshViewerView();
  } catch (error) {
    clearAudioFile();
    setStatus(error instanceof Error ? error.message : 'Could not load audio file.', true);
  }
}

function clearAudioFile() {
  viewerState.audioFile = null;
  viewerState.audioBuffer = null;
  viewerState.audioEnvelope = null;
  viewerState.audioDurationMs = null;
  viewerState.audioShiftMs = 0;

  ui.audioFileMeta.textContent = 'No audio selected.';
  ui.audioShiftMsInput.value = '0';
  ui.audioShiftRange.value = '0';
  refreshViewerView();
}

function validateAlignedCsv(headers, rows) {
  if (!rows.length) {
    throw new Error('The synchronized CSV is empty.');
  }
  const timestampField = detectTimestampField(headers);
  if (!timestampField) {
    throw new Error('The CSV must include sync_timestamp_ms or timestamp_ms.');
  }
  const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length) {
    throw new Error(`The CSV is missing required columns: ${missing.join(', ')}`);
  }
  return timestampField;
}

function detectTimestampField(headers) {
  if (headers.includes('sync_timestamp_ms')) {
    return 'sync_timestamp_ms';
  }
  if (headers.includes('timestamp_ms')) {
    return 'timestamp_ms';
  }
  return null;
}

function estimateSampleRate(rows, timestampField) {
  const diffs = [];
  for (let index = 1; index < rows.length; index += 1) {
    const diff = rows[index][timestampField] - rows[index - 1][timestampField];
    if (Number.isFinite(diff) && diff > 0) {
      diffs.push(diff);
    }
  }
  if (!diffs.length) {
    return null;
  }
  const medianDiff = median(diffs);
  return medianDiff > 0 ? 1000 / medianDiff : null;
}

function refreshViewerView() {
  updateSummary();
  updateSelectionSummary();
  updateButtons();
  updateShiftControls();
  updateSelectionUi();
  renderTraceList();
  updateViewportLabel();
  updateTimeScrollControl();
  drawAll();
}

function updateSummary() {
  ui.sessionLabel.textContent = viewerState.alignedFile ? stripExtension(viewerState.alignedFile.name) : '—';
  ui.rowCount.textContent = String(viewerState.rows.length);
  if (Number.isFinite(viewerState.sessionStartMs) && Number.isFinite(viewerState.sessionEndMs)) {
    ui.sessionDuration.textContent = `${((viewerState.sessionEndMs - viewerState.sessionStartMs) / 1000).toFixed(1)} s`;
  } else {
    ui.sessionDuration.textContent = '0.0 s';
  }
  ui.sampleRate.textContent = Number.isFinite(viewerState.sampleRateHz)
    ? `${viewerState.sampleRateHz.toFixed(2)} Hz`
    : '—';
  ui.audioLabel.textContent = viewerState.audioFile ? stripExtension(viewerState.audioFile.name) : '—';
  ui.audioDuration.textContent = Number.isFinite(viewerState.audioDurationMs)
    ? formatDuration(viewerState.audioDurationMs)
    : '—';
}

function updateButtons() {
  const hasRows = viewerState.rows.length > 0;
  const hasAudio = Boolean(viewerState.audioBuffer);
  const hasSelection = Boolean(getCommittedSelection());
  ui.resetShiftBtn.disabled = !hasRows || viewerState.biozShiftMs === 0;
  ui.resetAudioShiftBtn.disabled = !hasAudio || viewerState.audioShiftMs === 0;
  ui.saveShiftedBtn.disabled = !hasRows;
  ui.selectionModeBtn.disabled = !hasRows;
  ui.selectVisibleRangeBtn.disabled = !hasRows;
  ui.clearSelectionBtn.disabled = !hasSelection;
  ui.saveSelectedDataBtn.disabled = !hasSelection;
  ui.saveSelectedAudioBtn.disabled = !hasSelection || !hasAudio;
  ui.saveSelectedSegmentBtn.disabled = !hasSelection || !hasAudio;
  ui.zoomInBtn.disabled = !hasRows;
  ui.zoomOutBtn.disabled = !hasRows;
  ui.zoomResetBtn.disabled = !hasRows;
  ui.audioShiftMsInput.disabled = !hasAudio;
  ui.audioShiftRange.disabled = !hasAudio;
  ui.audioShiftButtons.forEach((button) => {
    button.disabled = !hasAudio;
  });
}

function updateShiftControls() {
  ui.biozShiftMsInput.value = String(viewerState.biozShiftMs);
  ui.biozShiftRange.value = String(Math.max(-5000, Math.min(5000, viewerState.biozShiftMs)));
  ui.shiftLabel.textContent = `${viewerState.biozShiftMs >= 0 ? '+' : ''}${viewerState.biozShiftMs} ms`;
  ui.audioShiftMsInput.value = String(viewerState.audioShiftMs);
  ui.audioShiftRange.value = String(Math.max(-10000, Math.min(10000, viewerState.audioShiftMs)));
  ui.audioShiftLabel.textContent = `${viewerState.audioShiftMs >= 0 ? '+' : ''}${viewerState.audioShiftMs} ms`;
}

function updateSelectionUi() {
  const selectionModeActive = viewerState.selectionMode && viewerState.rows.length > 0;
  ui.selectionModeBtn.classList.toggle('is-active', selectionModeActive);
  ui.selectionModeBtn.setAttribute('aria-pressed', String(selectionModeActive));
  [ui.overviewCanvas, ui.detailCanvas].forEach((canvas) => {
    const wrap = canvas.closest('.plot-canvas-wrap');
    if (wrap) {
      wrap.classList.toggle('selection-enabled', selectionModeActive);
    }
  });
}

function updateSelectionSummary() {
  const selection = getEffectiveSelection();
  if (!selection) {
    ui.selectionStartLabel.textContent = '—';
    ui.selectionEndLabel.textContent = '—';
    ui.selectionDurationLabel.textContent = '0.0 s';
    ui.selectionAudioOverlapLabel.textContent = viewerState.audioBuffer ? '0.0 s' : '—';
    return;
  }

  ui.selectionStartLabel.textContent = formatTime(selection.start);
  ui.selectionEndLabel.textContent = formatTime(selection.end);
  ui.selectionDurationLabel.textContent = formatDuration(selection.end - selection.start);

  const audioOverlap = getSelectedAudioOverlap(selection);
  if (!viewerState.audioBuffer) {
    ui.selectionAudioOverlapLabel.textContent = '—';
  } else if (!audioOverlap) {
    ui.selectionAudioOverlapLabel.textContent = '0.0 s';
  } else {
    ui.selectionAudioOverlapLabel.textContent = formatDuration(audioOverlap.durationMs);
  }
}

function setSelectionMode(enabled) {
  viewerState.selectionMode = Boolean(enabled) && viewerState.rows.length > 0;
  if (!viewerState.selectionMode) {
    viewerState.selectionDrag = null;
  }
  updateSelectionUi();
  updateSelectionSummary();
  drawAll();
}

function selectVisibleRange() {
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  setSelection(detailWindow.start, detailWindow.end);
  setStatus(
    `Selected the visible range (${formatDuration(detailWindow.end - detailWindow.start)}).`,
    false
  );
}

function clearSelection(options = {}) {
  const { draw = true } = options;
  viewerState.selectionStartMs = null;
  viewerState.selectionEndMs = null;
  viewerState.selectionDrag = null;
  updateSelectionSummary();
  updateButtons();
  if (draw) {
    drawAll();
  }
}

function setSelection(startMs, endMs, options = {}) {
  const { draw = true } = options;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    clearSelection({ draw });
    return;
  }
  const clampedStart = clampToSession(startMs);
  const clampedEnd = clampToSession(endMs);
  const start = Math.min(clampedStart, clampedEnd);
  const end = Math.max(clampedStart, clampedEnd);
  if (end - start < MIN_SELECTION_SPAN_MS) {
    clearSelection({ draw });
    return;
  }

  viewerState.selectionStartMs = start;
  viewerState.selectionEndMs = end;
  updateSelectionSummary();
  updateButtons();
  if (draw) {
    drawAll();
  }
}

function clampToSession(timestampMs) {
  if (!Number.isFinite(viewerState.sessionStartMs) || !Number.isFinite(viewerState.sessionEndMs)) {
    return timestampMs;
  }
  return Math.max(viewerState.sessionStartMs, Math.min(viewerState.sessionEndMs, timestampMs));
}

function getCommittedSelection() {
  if (
    !Number.isFinite(viewerState.selectionStartMs) ||
    !Number.isFinite(viewerState.selectionEndMs) ||
    viewerState.selectionEndMs - viewerState.selectionStartMs < MIN_SELECTION_SPAN_MS
  ) {
    return null;
  }
  return {
    start: viewerState.selectionStartMs,
    end: viewerState.selectionEndMs,
  };
}

function getEffectiveSelection() {
  if (
    viewerState.selectionDrag &&
    Number.isFinite(viewerState.selectionDrag.anchorMs) &&
    Number.isFinite(viewerState.selectionDrag.currentMs)
  ) {
    const start = Math.min(viewerState.selectionDrag.anchorMs, viewerState.selectionDrag.currentMs);
    const end = Math.max(viewerState.selectionDrag.anchorMs, viewerState.selectionDrag.currentMs);
    return { start, end };
  }
  return getCommittedSelection();
}

function getSelectedAudioOverlap(selection = getCommittedSelection()) {
  if (!selection || !viewerState.audioBuffer || !Number.isFinite(viewerState.sessionStartMs)) {
    return null;
  }
  const audioStartMs = viewerState.sessionStartMs + viewerState.audioShiftMs;
  const audioEndMs = audioStartMs + viewerState.audioBuffer.duration * 1000;
  const overlapStart = Math.max(selection.start, audioStartMs);
  const overlapEnd = Math.min(selection.end, audioEndMs);
  if (overlapEnd <= overlapStart) {
    return null;
  }
  return {
    start: overlapStart,
    end: overlapEnd,
    durationMs: overlapEnd - overlapStart,
    clipStartMs: overlapStart - audioStartMs,
    clipEndMs: overlapEnd - audioStartMs,
    clipped: overlapStart > selection.start || overlapEnd < selection.end,
  };
}

function startSelectionDrag(event, canvas, startMs, endMs) {
  if (!viewerState.selectionMode) {
    return;
  }
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  const anchorMs = xToTime(x, startMs, endMs, canvas.width);
  viewerState.selectionDrag = {
    pointerId: event.pointerId,
    canvas,
    startMs,
    endMs,
    anchorMs,
    currentMs: anchorMs,
  };
  if (typeof canvas.setPointerCapture === 'function') {
    canvas.setPointerCapture(event.pointerId);
  }
  updateSelectionSummary();
  drawAll();
}

function handleSelectionPointerMove(event) {
  const drag = viewerState.selectionDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }
  const rect = drag.canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  drag.currentMs = xToTime(x, drag.startMs, drag.endMs, drag.canvas.width);
  updateSelectionSummary();
  drawAll();
}

function handleSelectionPointerUp(event) {
  const drag = viewerState.selectionDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  if (typeof drag.canvas.releasePointerCapture === 'function') {
    try {
      drag.canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Ignore pointer capture release errors for browsers that already released it.
    }
  }

  const start = Math.min(drag.anchorMs, drag.currentMs);
  const end = Math.max(drag.anchorMs, drag.currentMs);
  viewerState.selectionDrag = null;

  if (end - start < MIN_SELECTION_SPAN_MS) {
    updateSelectionSummary();
    drawAll();
    return;
  }

  setSelection(start, end);
  setStatus(`Selected segment: ${formatDuration(end - start)}.`, false);
}

function renderTraceList() {
  const list = ui.traceList;
  list.innerHTML = '';
  const bands = getBandsToDraw();
  if (!bands.length) {
    list.classList.add('empty');
    list.textContent = 'No synchronized CSV loaded yet.';
    return;
  }

  list.classList.remove('empty');
  bands.forEach((band, index) => {
    const card = document.createElement('div');
    card.className = 'boundary-card';

    const header = document.createElement('div');
    header.className = 'boundary-card-header';

    const title = document.createElement('div');
    title.className = 'boundary-card-title';
    title.textContent = band.label;

    const badge = document.createElement('div');
    badge.className = 'boundary-card-badge';
    badge.textContent = `Band ${index + 1}`;

    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'boundary-card-meta';
    meta.textContent = band.note;

    const chipRow = document.createElement('div');
    chipRow.className = 'trace-card-chip-row';
    band.seriesList.forEach((series) => {
      const chip = document.createElement('div');
      chip.className = 'trace-chip';

      const swatch = document.createElement('span');
      swatch.className = 'trace-swatch';
      swatch.style.background = series.color;

      const label = document.createElement('span');
      label.textContent = `${series.label}${series.shifted ? ' (shifted)' : ''}`;

      chip.appendChild(swatch);
      chip.appendChild(label);
      chipRow.appendChild(chip);
    });

    const flag = document.createElement('div');
    flag.className = 'trace-card-flag';
    if (band.kind === 'audio') {
      flag.textContent = 'Audio shift applies to this band.';
    } else {
      flag.textContent = band.seriesList.some((series) => series.shifted)
        ? 'BioZ shift applies to this band.'
        : 'This band stays fixed on the synchronized timeline.';
    }

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(chipRow);
    card.appendChild(flag);
    list.appendChild(card);
  });
}

function setStatus(message, isError) {
  ui.statusBox.textContent = message;
  ui.statusBox.classList.toggle('error', Boolean(isError));
}

function buildTraceSeries(rows) {
  const normalizedByField = {};
  SIGNAL_BANDS.forEach((band) => {
    band.series.forEach((series) => {
      normalizedByField[series.key] = normalizeValues(
        rows.map((row) => toFiniteNumber(row[series.key]))
      );
    });
  });

  const bands = SIGNAL_BANDS.map((band) => ({
    key: band.key,
    label: band.label,
    note: band.note,
    seriesList: band.series.map((series) => ({
      label: series.label,
      color: series.color,
      shifted: series.shifted,
      values: normalizedByField[series.key],
    })),
  }));

  const biozAverage = averageSeries([
    normalizedByField.txt_mag3,
    normalizedByField.txt_mag4,
  ]);
  const respirationAverage = averageSeries([
    normalizedByField.csv_ribmid,
    normalizedByField.csv_ribright,
    normalizedByField.csv_waistmid,
    normalizedByField.csv_ribleft,
  ]);

  bands.push({
    key: 'alignment',
    label: 'Alignment overlay (z-score)',
    note: 'This band averages the two BioZ traces and the four respiration traces to make alignment changes easier to judge.',
    seriesList: [
      { label: 'BioZ mean', color: '#ffe066', shifted: true, values: biozAverage },
      { label: 'Resp mean', color: '#53d6ff', shifted: false, values: respirationAverage },
    ],
  });

  bands.forEach((band) => {
    band.range = computeBandRange(band.seriesList);
  });

  return bands;
}

function computeBandRange(seriesList) {
  let min = Infinity;
  let max = -Infinity;
  seriesList.forEach((series) => {
    series.values.forEach((value) => {
      if (Number.isFinite(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: -1, max: 1 };
  }

  const padding = Math.max(0.15, (max - min) * 0.08);
  return {
    min: min - padding,
    max: max + padding,
  };
}

function normalizeValues(values) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (!finiteValues.length) {
    return values.map(() => null);
  }

  const meanValue = finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
  const variance = finiteValues.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) / finiteValues.length;
  const std = Math.sqrt(variance) || 1;
  return values.map((value) => (Number.isFinite(value) ? (value - meanValue) / std : null));
}

function averageSeries(seriesList) {
  if (!seriesList.length) {
    return [];
  }
  const length = seriesList[0].length;
  const output = [];
  for (let index = 0; index < length; index += 1) {
    const values = seriesList
      .map((series) => series[index])
      .filter((value) => Number.isFinite(value));
    output.push(values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  }
  return output;
}

function setBiozShiftMs(value, options = {}) {
  const { draw = true } = options;
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  viewerState.biozShiftMs = rounded;
  updateShiftControls();
  updateButtons();
  if (draw) {
    drawAll();
  }
}

function setAudioShiftMs(value, options = {}) {
  const { draw = true } = options;
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  viewerState.audioShiftMs = rounded;
  updateSelectionSummary();
  updateShiftControls();
  updateButtons();
  if (draw) {
    drawAll();
  }
}

function adjustZoom(factor) {
  const current = viewerState.viewWindowSec || 20;
  viewerState.viewWindowSec = Math.max(4, Math.min(240, current * factor));
  ui.windowSecondsInput.value = String(Math.round(viewerState.viewWindowSec * 10) / 10);
  updateViewportLabel();
  updateTimeScrollControl();
  drawAll();
}

function handleTimeScrollInput() {
  if (!Number.isFinite(viewerState.sessionStartMs) || !Number.isFinite(viewerState.sessionEndMs)) {
    return;
  }
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  const offset = Number(ui.timeScrollRange.value);
  const windowSpan = detailWindow.end - detailWindow.start;
  const start = viewerState.sessionStartMs + offset;
  setDetailCenterMs(start + windowSpan / 2);
}

function setDetailCenterMs(centerMs) {
  if (!Number.isFinite(viewerState.sessionStartMs) || !Number.isFinite(viewerState.sessionEndMs)) {
    return;
  }
  const sessionStart = viewerState.sessionStartMs;
  const sessionEnd = viewerState.sessionEndMs;
  const windowMs = Math.max(4000, viewerState.viewWindowSec * 1000);
  const half = windowMs / 2;
  const minCenter = sessionStart + Math.min(half, (sessionEnd - sessionStart) / 2);
  const maxCenter = sessionEnd - Math.min(half, (sessionEnd - sessionStart) / 2);
  if (minCenter > maxCenter) {
    viewerState.detailCenterMs = (sessionStart + sessionEnd) / 2;
  } else {
    viewerState.detailCenterMs = Math.max(minCenter, Math.min(maxCenter, centerMs));
  }
  updateViewportLabel();
  updateTimeScrollControl();
  drawAll();
}

function panDetailWindow(deltaMs) {
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  setDetailCenterMs((detailWindow.start + detailWindow.end) / 2 + deltaMs);
}

function handleOverviewPointerDown(event) {
  if (!Number.isFinite(viewerState.sessionStartMs) || !Number.isFinite(viewerState.sessionEndMs)) {
    return;
  }
  if (viewerState.selectionMode) {
    startSelectionDrag(
      event,
      ui.overviewCanvas,
      viewerState.sessionStartMs,
      viewerState.sessionEndMs
    );
    return;
  }
  const x = getCanvasX(ui.overviewCanvas, event);
  setDetailCenterMs(
    xToTime(
      x,
      viewerState.sessionStartMs,
      viewerState.sessionEndMs,
      ui.overviewCanvas.width
    )
  );
}

function handleDetailPointerDown(event) {
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  if (viewerState.selectionMode) {
    startSelectionDrag(event, ui.detailCanvas, detailWindow.start, detailWindow.end);
    return;
  }
  const x = getCanvasX(ui.detailCanvas, event);
  setDetailCenterMs(
    xToTime(x, detailWindow.start, detailWindow.end, ui.detailCanvas.width)
  );
}

function handleChartWheel(event) {
  if (!event.shiftKey) {
    return;
  }
  event.preventDefault();
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  const windowSpan = detailWindow.end - detailWindow.start;
  const deltaUnits = event.deltaY === 0 ? event.deltaX : event.deltaY;
  const deltaMs = (deltaUnits / 120) * windowSpan * 0.12;
  panDetailWindow(deltaMs);
}

function updateViewportLabel() {
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    ui.viewportLabel.textContent = '—';
    return;
  }
  ui.viewportLabel.textContent = `${formatTime(detailWindow.start)} – ${formatTime(detailWindow.end)}`;
}

function updateTimeScrollControl() {
  const detailWindow = getDetailWindow();
  if (!detailWindow || !Number.isFinite(viewerState.sessionStartMs) || !Number.isFinite(viewerState.sessionEndMs)) {
    ui.timeScrollRange.disabled = true;
    ui.timeScrollRange.min = '0';
    ui.timeScrollRange.max = '0';
    ui.timeScrollRange.value = '0';
    return;
  }

  const sessionSpan = viewerState.sessionEndMs - viewerState.sessionStartMs;
  const windowSpan = detailWindow.end - detailWindow.start;
  const maxOffset = Math.max(0, Math.round(sessionSpan - windowSpan));
  const offset = Math.max(0, Math.round(detailWindow.start - viewerState.sessionStartMs));
  ui.timeScrollRange.min = '0';
  ui.timeScrollRange.max = String(maxOffset);
  ui.timeScrollRange.step = '1';
  ui.timeScrollRange.value = String(Math.min(maxOffset, offset));
  ui.timeScrollRange.disabled = maxOffset <= 0;
}

function getDetailWindow() {
  if (!Number.isFinite(viewerState.sessionStartMs) || !Number.isFinite(viewerState.sessionEndMs)) {
    return null;
  }

  const totalStart = viewerState.sessionStartMs;
  const totalEnd = viewerState.sessionEndMs;
  const windowMs = Math.max(4000, viewerState.viewWindowSec * 1000);
  const half = windowMs / 2;
  let center = Number.isFinite(viewerState.detailCenterMs)
    ? viewerState.detailCenterMs
    : totalStart + half;
  let start = center - half;
  let end = center + half;

  if (start < totalStart) {
    end += totalStart - start;
    start = totalStart;
  }
  if (end > totalEnd) {
    start -= end - totalEnd;
    end = totalEnd;
  }

  return {
    start: Math.max(totalStart, start),
    end: Math.min(totalEnd, end),
  };
}

function drawAll() {
  resizeCanvasToDisplaySize(ui.overviewCanvas);
  resizeCanvasToDisplaySize(ui.detailCanvas);
  drawOverview();
  drawDetail();
}

function drawOverview() {
  const ctx = ui.overviewCanvas.getContext('2d');
  const width = ui.overviewCanvas.width;
  const height = ui.overviewCanvas.height;
  clearCanvas(ctx, width, height);

  if (!viewerState.rows.length) {
    drawEmptyMessage(ctx, width, height, 'Load one synchronized CSV to display the alignment traces.');
    return;
  }

  drawTraceBands(ctx, {
    width,
    top: 8,
    height: height - 16,
    startMs: viewerState.sessionStartMs,
    endMs: viewerState.sessionEndMs,
    showLabels: false,
  });

  const detailWindow = getDetailWindow();
  if (detailWindow) {
    const x1 = timeToX(
      detailWindow.start,
      viewerState.sessionStartMs,
      viewerState.sessionEndMs,
      width
    );
    const x2 = timeToX(
      detailWindow.end,
      viewerState.sessionStartMs,
      viewerState.sessionEndMs,
      width
    );
    ctx.fillStyle = 'rgba(59, 194, 255, 0.12)';
    ctx.fillRect(x1, 0, x2 - x1, height);
    ctx.strokeStyle = 'rgba(59, 194, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, 1, x2 - x1, height - 2);
  }

  drawSelectionOverlay(ctx, {
    startMs: viewerState.sessionStartMs,
    endMs: viewerState.sessionEndMs,
    width,
    top: 0,
    height,
    label: false,
  });
}

function drawDetail() {
  const ctx = ui.detailCanvas.getContext('2d');
  const width = ui.detailCanvas.width;
  const height = ui.detailCanvas.height;
  clearCanvas(ctx, width, height);

  const detailWindow = getDetailWindow();
  if (!detailWindow || !viewerState.rows.length) {
    drawEmptyMessage(ctx, width, height, 'Load one synchronized CSV to inspect BioZ alignment.');
    return;
  }

  const traceHeight = height - 36;
  drawTraceBands(ctx, {
    width,
    top: 10,
    height: traceHeight,
    startMs: detailWindow.start,
    endMs: detailWindow.end,
    showLabels: true,
  });
  drawSelectionOverlay(ctx, {
    startMs: detailWindow.start,
    endMs: detailWindow.end,
    width,
    top: 10,
    height: traceHeight,
    label: true,
  });
  drawTimeTicks(ctx, width, detailWindow.start, detailWindow.end, traceHeight + 24);
}

function drawSelectionOverlay(ctx, { startMs, endMs, width, top, height, label }) {
  const selection = getEffectiveSelection();
  if (!selection) {
    return;
  }
  const visibleStart = Math.max(selection.start, startMs);
  const visibleEnd = Math.min(selection.end, endMs);
  if (visibleEnd <= visibleStart) {
    return;
  }

  const x1 = timeToX(visibleStart, startMs, endMs, width);
  const x2 = timeToX(visibleEnd, startMs, endMs, width);
  ctx.save();
  ctx.fillStyle = 'rgba(255, 157, 63, 0.14)';
  ctx.fillRect(x1, top, x2 - x1, height);
  ctx.strokeStyle = 'rgba(255, 176, 94, 0.92)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x1, top + 1, Math.max(0, x2 - x1), Math.max(0, height - 2));

  if (label) {
    const text = `Selected ${formatDuration(selection.end - selection.start)}`;
    ctx.fillStyle = '#fff1dc';
    ctx.font = '11px Inter, sans-serif';
    ctx.textBaseline = 'top';
    const textX = Math.max(12, Math.min(width - ctx.measureText(text).width - 12, x1 + 8));
    ctx.fillText(text, textX, top + 8);
  }
  ctx.restore();
}

function drawTraceBands(ctx, { width, top, height, startMs, endMs, showLabels }) {
  const bands = getBandsToDraw();
  const count = bands.length;
  if (!count) {
    drawEmptyMessage(ctx, width, height, 'No plot channels available in this CSV.');
    return;
  }

  const bandHeight = height / count;
  bands.forEach((band, index) => {
    const bandTop = top + index * bandHeight;
    if (band.kind === 'audio') {
      drawAudioBand(ctx, band, {
        width,
        top: bandTop,
        height: bandHeight,
        startMs,
        endMs,
        showLabel: showLabels,
      });
    } else {
      drawSingleBand(ctx, band, {
        width,
        top: bandTop,
        height: bandHeight,
        startMs,
        endMs,
        showLabel: showLabels,
      });
    }
  });
}

function drawSingleBand(ctx, band, { width, top, height, startMs, endMs, showLabel }) {
  ctx.fillStyle = 'rgba(9, 14, 22, 0.78)';
  ctx.fillRect(0, top, width, height);
  ctx.strokeStyle = 'rgba(146, 162, 184, 0.12)';
  ctx.strokeRect(0, top, width, height);

  const bandMin = band.range?.min ?? -1;
  const bandMax = band.range?.max ?? 1;
  const range = bandMax - bandMin || 1;
  const midY = top + height / 2;

  ctx.strokeStyle = 'rgba(146, 162, 184, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  const rows = viewerState.rows;
  const timeField = viewerState.timestampField;
  band.seriesList.forEach((series) => {
    ctx.beginPath();
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 1.6;
    let drawing = false;

    for (let index = 0; index < rows.length; index += 1) {
      const value = series.values[index];
      if (!Number.isFinite(value)) {
        drawing = false;
        continue;
      }
      const baseTimestamp = rows[index][timeField];
      const timestampMs = baseTimestamp + (series.shifted ? viewerState.biozShiftMs : 0);
      if (timestampMs < startMs || timestampMs > endMs) {
        drawing = false;
        continue;
      }

      const x = timeToX(timestampMs, startMs, endMs, width);
      const normalized = (value - bandMin) / range;
      const y = top + height - normalized * (height - 18) - 9;

      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  });

  if (showLabel) {
    ctx.fillStyle = '#dbe7f5';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(band.label, 12, top + 18);
    drawBandLegend(ctx, band.seriesList, width, top + 18);
    ctx.fillStyle = '#92a2b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(band.note, 12, top + 34);
  }
}

function drawAudioBand(ctx, band, { width, top, height, startMs, endMs, showLabel }) {
  ctx.fillStyle = 'rgba(9, 14, 22, 0.78)';
  ctx.fillRect(0, top, width, height);
  ctx.strokeStyle = 'rgba(146, 162, 184, 0.12)';
  ctx.strokeRect(0, top, width, height);

  const midY = top + height / 2;
  ctx.strokeStyle = 'rgba(146, 162, 184, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  const envelope = viewerState.audioEnvelope;
  if (envelope) {
    const audioStartMs = viewerState.sessionStartMs + viewerState.audioShiftMs;
    const audioEndMs = audioStartMs + envelope.durationMs;
    const overlapStart = Math.max(startMs, audioStartMs);
    const overlapEnd = Math.min(endMs, audioEndMs);
    if (overlapEnd > overlapStart) {
      const startOffsetMs = overlapStart - audioStartMs;
      const endOffsetMs = overlapEnd - audioStartMs;
      const startBin = findEnvelopeBinIndex(envelope.binEndTimesMs, startOffsetMs);
      const endBin = Math.min(
        envelope.minValues.length - 1,
        findEnvelopeBinIndex(envelope.binStartTimesMs, endOffsetMs)
      );
      const groupSize = Math.max(1, Math.ceil((endBin - startBin + 1) / width));
      ctx.strokeStyle = band.color;
      ctx.lineWidth = 1;
      for (let binIndex = startBin; binIndex <= endBin; binIndex += groupSize) {
        const groupEnd = Math.min(endBin, binIndex + groupSize - 1);
        let minValue = 1;
        let maxValue = -1;
        for (let innerIndex = binIndex; innerIndex <= groupEnd; innerIndex += 1) {
          minValue = Math.min(minValue, envelope.minValues[innerIndex]);
          maxValue = Math.max(maxValue, envelope.maxValues[innerIndex]);
        }
        const groupStartMs = audioStartMs + envelope.binStartTimesMs[binIndex];
        const groupEndMs = audioStartMs + envelope.binEndTimesMs[groupEnd];
        const timestampMs = (groupStartMs + groupEndMs) / 2;
        if (groupEndMs < startMs || groupStartMs > endMs) {
          continue;
        }
        const x = timeToX(timestampMs, startMs, endMs, width);
        const yTop = top + ((1 - maxValue) * 0.5) * (height - 18) + 9;
        const yBottom = top + ((1 - minValue) * 0.5) * (height - 18) + 9;
        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBottom);
        ctx.stroke();
      }
    }
  }

  if (showLabel) {
    ctx.fillStyle = '#dbe7f5';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(band.label, 12, top + 18);
    drawBandLegend(ctx, band.seriesList, width, top + 18);
    ctx.fillStyle = '#92a2b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(band.note, 12, top + 34);
  }
}

function drawBandLegend(ctx, seriesList, width, y) {
  let cursorX = width - 12;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '11px Inter, sans-serif';
  for (let index = seriesList.length - 1; index >= 0; index -= 1) {
    const series = seriesList[index];
    const text = series.label;
    const textWidth = ctx.measureText(text).width;
    cursorX -= textWidth;
    ctx.fillStyle = '#dbe7f5';
    ctx.fillText(text, cursorX, y);
    cursorX -= 10;
    ctx.fillStyle = series.color;
    ctx.fillRect(cursorX, y - 8, 8, 8);
    cursorX -= 16;
  }
  ctx.textAlign = 'left';
}

function drawTimeTicks(ctx, width, startMs, endMs, textY) {
  const totalMs = endMs - startMs;
  const approxCount = Math.max(2, Math.floor(width / 150));
  const rawStep = totalMs / approxCount;
  const step = niceStepMs(rawStep);
  const firstTick = Math.ceil(startMs / step) * step;
  ctx.strokeStyle = 'rgba(146, 162, 184, 0.12)';
  ctx.fillStyle = '#92a2b8';
  ctx.font = '11px Inter, sans-serif';
  for (let tick = firstTick; tick <= endMs; tick += step) {
    const x = timeToX(tick, startMs, endMs, width);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, textY - 22);
    ctx.stroke();
    ctx.fillText(relativeTimeText(tick - startMs), Math.max(6, x + 4), textY);
  }
}

function exportShiftedCsv() {
  if (!viewerState.rows.length || !viewerState.alignedFile) {
    return;
  }

  const shiftedRows = applyShiftedBiozAlignment();
  const headers = buildExportHeaders();
  const rows = shiftedRows.map((row) => headers.map((header) => row[header] ?? ''));
  const csvText = stringifyCsv(rows, headers);
  const shiftTag = viewerState.biozShiftMs >= 0
    ? `plus${Math.abs(viewerState.biozShiftMs)}`
    : `minus${Math.abs(viewerState.biozShiftMs)}`;
  downloadText(
    `${stripExtension(viewerState.alignedFile.name)}_bioz_shift_${shiftTag}ms.csv`,
    csvText,
    'text/csv'
  );
  setStatus(
    `Shifted CSV exported with BioZ shift ${viewerState.biozShiftMs >= 0 ? '+' : ''}${viewerState.biozShiftMs} ms and audio shift metadata ${viewerState.audioShiftMs >= 0 ? '+' : ''}${viewerState.audioShiftMs} ms.`,
    false
  );
}

function exportSelectedCsv(options = {}) {
  const { quiet = false } = options;
  if (!viewerState.rows.length || !viewerState.alignedFile) {
    return false;
  }
  const selection = getCommittedSelection();
  if (!selection) {
    if (!quiet) {
      setStatus('Select a segment before exporting selected data.', true);
    }
    return false;
  }

  const shiftedRows = applyShiftedBiozAlignment();
  const timeField = viewerState.timestampField;
  const segmentRows = shiftedRows
    .filter((row) => row[timeField] >= selection.start && row[timeField] <= selection.end)
    .map((row) => ({
      ...row,
      segment_start_ms: String(Math.round(selection.start)),
      segment_end_ms: String(Math.round(selection.end)),
      segment_duration_ms: String(Math.round(selection.end - selection.start)),
      segment_start_jst: formatJstIso(selection.start),
      segment_end_jst: formatJstIso(selection.end),
    }));

  if (!segmentRows.length) {
    if (!quiet) {
      setStatus('The selected segment does not contain any synchronized rows.', true);
    }
    return false;
  }

  const headers = buildExportHeaders([
    'segment_start_ms',
    'segment_end_ms',
    'segment_duration_ms',
    'segment_start_jst',
    'segment_end_jst',
  ]);
  const rows = segmentRows.map((row) => headers.map((header) => row[header] ?? ''));
  const csvText = stringifyCsv(rows, headers);
  downloadText(
    `${stripExtension(viewerState.alignedFile.name)}_${buildSegmentFileTag(selection)}.csv`,
    csvText,
    'text/csv'
  );

  if (!quiet) {
    setStatus(
      `Selected CSV exported for ${formatDuration(selection.end - selection.start)}.`,
      false
    );
  }
  return true;
}

function exportSelectedAudioClip(options = {}) {
  const { quiet = false } = options;
  if (!viewerState.audioBuffer || !viewerState.audioFile) {
    if (!quiet) {
      setStatus('Load audio before exporting a selected clip.', true);
    }
    return false;
  }

  const selection = getCommittedSelection();
  if (!selection) {
    if (!quiet) {
      setStatus('Select a segment before exporting audio.', true);
    }
    return false;
  }

  const audioOverlap = getSelectedAudioOverlap(selection);
  if (!audioOverlap) {
    if (!quiet) {
      setStatus('The selected segment does not overlap the shifted audio timeline.', true);
    }
    return false;
  }

  try {
    const clipBuffer = sliceAudioBuffer(
      viewerState.audioBuffer,
      audioOverlap.clipStartMs,
      audioOverlap.clipEndMs
    );
    const clipBlob = audioBufferToWavBlob(clipBuffer);
    downloadBlob(
      `${stripExtension(viewerState.audioFile.name)}_${buildSegmentFileTag(selection)}.wav`,
      clipBlob
    );
  } catch (error) {
    if (!quiet) {
      setStatus(
        error instanceof Error ? error.message : 'Could not export the selected audio segment.',
        true
      );
    }
    return false;
  }

  if (!quiet) {
    const suffix = audioOverlap.clipped ? ' Audio was trimmed to the available overlap.' : '';
    setStatus(
      `Selected audio exported for ${formatDuration(audioOverlap.durationMs)}.${suffix}`,
      false
    );
  }
  return true;
}

function exportSelectedSegment() {
  const csvSaved = exportSelectedCsv({ quiet: true });
  const audioSaved = exportSelectedAudioClip({ quiet: true });
  if (csvSaved && audioSaved) {
    const selection = getCommittedSelection();
    setStatus(
      `Selected segment exported as CSV and WAV for ${formatDuration(selection.end - selection.start)}.`,
      false
    );
    return;
  }
  if (!csvSaved) {
    setStatus('Could not export the selected CSV segment.', true);
    return;
  }
  setStatus('Could not export the selected audio segment.', true);
}

function buildExportHeaders(extraHeaders = []) {
  const headers = [...viewerState.headers];
  [
    'txt_shift_applied_ms',
    'audio_shift_applied_ms',
    'audio_file_name',
    ...extraHeaders,
  ].forEach((header) => {
    if (!headers.includes(header)) {
      headers.push(header);
    }
  });
  return headers;
}

function buildSegmentFileTag(selection) {
  const relativeStartMs = Math.max(0, Math.round(selection.start - viewerState.sessionStartMs));
  const relativeEndMs = Math.max(0, Math.round(selection.end - viewerState.sessionStartMs));
  return `segment_${relativeStartMs}ms_to_${relativeEndMs}ms`;
}

function applyShiftedBiozAlignment() {
  const rows = viewerState.rows;
  const timeField = viewerState.timestampField;
  const timestamps = rows.map((row) => row[timeField]);
  const txtHeaders = viewerState.headers.filter((header) => header.startsWith('txt_'));
  const numericTxtHeaders = inferNumericFields(rows, txtHeaders);
  const txtSeries = Object.fromEntries(
    txtHeaders.map((header) => [
      header,
      rows.map((row) => {
        if (numericTxtHeaders.has(header)) {
          return toFiniteNumber(row[header]);
        }
        return row[header] ?? '';
      }),
    ])
  );

  return rows.map((row) => {
    const targetTime = row[timeField] - viewerState.biozShiftMs;
    const updated = { ...row };
    txtHeaders.forEach((header) => {
      if (numericTxtHeaders.has(header) && !TXT_DISCRETE_FIELDS.has(header)) {
        updated[header] = formatExportValue(
          interpolateNumericValue(targetTime, timestamps, txtSeries[header])
        );
      } else {
        updated[header] = formatExportValue(
          nearestSeriesValue(targetTime, timestamps, txtSeries[header])
        );
      }
    });
    updated.txt_shift_applied_ms = String(viewerState.biozShiftMs);
    updated.audio_shift_applied_ms = String(viewerState.audioShiftMs);
    updated.audio_file_name = viewerState.audioFile ? viewerState.audioFile.name : '';
    return updated;
  });
}

function getBandsToDraw() {
  const bands = [...viewerState.traceSeries];
  if (viewerState.audioEnvelope && Number.isFinite(viewerState.sessionStartMs)) {
    bands.splice(2, 0, {
      key: 'audio',
      kind: 'audio',
      label: 'Audio waveform (mono envelope)',
      note: 'Imported audio shown as a mono waveform envelope on the shared timeline.',
      color: '#ff7b72',
      seriesList: [
        { label: 'audio', color: '#ff7b72', shifted: true },
      ],
    });
  }
  return bands;
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('This browser does not support the Web Audio API needed for audio import.');
  }
  if (!(viewerState.audioContext instanceof AudioContextClass)) {
    viewerState.audioContext = new AudioContextClass();
  }
  return viewerState.audioContext;
}

function buildAudioEnvelope(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels || 1;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    const channelData = audioBuffer.getChannelData(channelIndex);
    for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
      mono[sampleIndex] += channelData[sampleIndex] / channelCount;
    }
  }

  const samplesPerBin = Math.max(1, Math.floor(audioBuffer.sampleRate / AUDIO_ENVELOPE_BINS_PER_SECOND));
  const binCount = Math.ceil(length / samplesPerBin);
  const minValues = new Array(binCount);
  const maxValues = new Array(binCount);
  const binStartTimesMs = new Array(binCount);
  const binEndTimesMs = new Array(binCount);

  for (let binIndex = 0; binIndex < binCount; binIndex += 1) {
    const startSample = binIndex * samplesPerBin;
    const endSample = Math.min(length, startSample + samplesPerBin);
    let minValue = 1;
    let maxValue = -1;
    for (let sampleIndex = startSample; sampleIndex < endSample; sampleIndex += 1) {
      const value = mono[sampleIndex];
      if (value < minValue) {
        minValue = value;
      }
      if (value > maxValue) {
        maxValue = value;
      }
    }
    minValues[binIndex] = minValue;
    maxValues[binIndex] = maxValue;
    binStartTimesMs[binIndex] = (startSample / audioBuffer.sampleRate) * 1000;
    binEndTimesMs[binIndex] = (endSample / audioBuffer.sampleRate) * 1000;
  }

  return {
    sampleRate: audioBuffer.sampleRate,
    durationMs: (audioBuffer.length / audioBuffer.sampleRate) * 1000,
    minValues,
    maxValues,
    binStartTimesMs,
    binEndTimesMs,
  };
}

function findEnvelopeBinIndex(times, targetMs) {
  let left = 0;
  let right = times.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (times[mid] < targetMs) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}

function sliceAudioBuffer(audioBuffer, startMs, endMs) {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor((startMs / 1000) * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.ceil((endMs / 1000) * sampleRate));
  const frameCount = Math.max(0, endSample - startSample);
  if (frameCount <= 0) {
    throw new Error('The selected segment does not contain any audio samples.');
  }

  const context = getAudioContext();
  const clipped = context.createBuffer(
    audioBuffer.numberOfChannels,
    frameCount,
    audioBuffer.sampleRate
  );

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const sourceChannel = audioBuffer.getChannelData(channelIndex);
    clipped.copyToChannel(sourceChannel.slice(startSample, endSample), channelIndex, 0);
  }

  return clipped;
}

function audioBufferToWavBlob(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const channels = Array.from(
    { length: channelCount },
    (_, channelIndex) => audioBuffer.getChannelData(channelIndex)
  );

  let offset = 44;
  for (let frameIndex = 0; frameIndex < audioBuffer.length; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channelIndex][frameIndex]));
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, pcm, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function inferNumericFields(rows, headers) {
  const numericHeaders = new Set();
  headers.forEach((header) => {
    let foundValue = false;
    let isNumeric = true;
    rows.forEach((row) => {
      const value = row[header];
      if (value == null || value === '') {
        return;
      }
      foundValue = true;
      if (!Number.isFinite(Number(value))) {
        isNumeric = false;
      }
    });
    if (foundValue && isNumeric) {
      numericHeaders.add(header);
    }
  });
  return numericHeaders;
}

function interpolateNumericValue(targetTime, sourceTimes, sourceValues) {
  let left = 0;
  let right = sourceTimes.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (sourceTimes[mid] < targetTime) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  if (left < sourceTimes.length && sourceTimes[left] === targetTime) {
    const exact = sourceValues[left];
    return Number.isFinite(exact) ? exact : null;
  }

  const nextIndex = left;
  const previousIndex = left - 1;
  if (previousIndex < 0 || nextIndex >= sourceTimes.length) {
    return null;
  }

  const previousValue = sourceValues[previousIndex];
  const nextValue = sourceValues[nextIndex];
  if (!Number.isFinite(previousValue) || !Number.isFinite(nextValue)) {
    return null;
  }

  const previousTime = sourceTimes[previousIndex];
  const nextTime = sourceTimes[nextIndex];
  if (previousTime === nextTime) {
    return previousValue;
  }

  const ratio = (targetTime - previousTime) / (nextTime - previousTime);
  return previousValue + (nextValue - previousValue) * ratio;
}

function nearestSeriesValue(targetTime, sourceTimes, sourceValues) {
  let left = 0;
  let right = sourceTimes.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (sourceTimes[mid] < targetTime) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  const currentIndex = left;
  const previousIndex = left > 0 ? left - 1 : null;
  if (previousIndex == null) {
    return sourceValues[currentIndex] ?? '';
  }
  const currentDistance = Math.abs(sourceTimes[currentIndex] - targetTime);
  const previousDistance = Math.abs(sourceTimes[previousIndex] - targetTime);
  return previousDistance <= currentDistance
    ? sourceValues[previousIndex] ?? ''
    : sourceValues[currentIndex] ?? '';
}

function formatExportValue(value) {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '';
    }
    return Number.isInteger(value)
      ? String(value)
      : String(Number(value.toFixed(12)));
  }
  return String(value);
}

function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const records = [];
  let current = '';
  let inQuotes = false;
  for (const line of lines) {
    current += (current ? '\n' : '') + line;
    const quoteCount = countUnescapedQuotes(line);
    if (quoteCount % 2 === 1) {
      inQuotes = !inQuotes;
    }
    if (!inQuotes) {
      records.push(parseCsvLine(current));
      current = '';
    }
  }
  if (current) {
    records.push(parseCsvLine(current));
  }
  const nonEmpty = records.filter((row) => row.some((cell) => cell !== ''));
  return {
    headers: nonEmpty[0] || [],
    rows: nonEmpty.slice(1),
  };
}

function countUnescapedQuotes(line) {
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (line[index + 1] === '"') {
        index += 1;
      } else {
        count += 1;
      }
    }
  }
  return count;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function stringifyCsv(rows, headers) {
  const allRows = [headers, ...rows];
  return `${allRows
    .map((row) =>
      row
        .map((value) => {
          const text = value == null ? '' : String(value);
          if (/[",\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(',')
    )
    .join('\n')}\n`;
}

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0b1019';
  ctx.fillRect(0, 0, width, height);
}

function drawEmptyMessage(ctx, width, height, message) {
  ctx.fillStyle = '#92a2b8';
  ctx.font = '16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, width / 2, height / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function getCanvasX(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return event.clientX - rect.left;
}

function timeToX(timestampMs, startMs, endMs, width) {
  const span = endMs - startMs || 1;
  return ((timestampMs - startMs) / span) * width;
}

function xToTime(x, startMs, endMs, width) {
  const clampedX = Math.max(0, Math.min(width, x));
  return startMs + (clampedX / width) * (endMs - startMs);
}

function niceStepMs(rawStep) {
  const choices = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000];
  for (const choice of choices) {
    if (rawStep <= choice) {
      return choice;
    }
  }
  return 120000;
}

function relativeTimeText(ms) {
  const seconds = ms / 1000;
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${minutes}m ${remainder.toFixed(remainder >= 10 ? 0 : 1)}s`;
  }
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
}

function formatTime(timestampMs) {
  return JST_TIME_FORMATTER.format(new Date(timestampMs)).replace(',', '');
}

function formatJstIso(timestampMs) {
  const jstDate = new Date(timestampMs + 9 * 60 * 60 * 1000);
  return `${jstDate.toISOString().replace('Z', '')}+09:00`;
}

function formatDuration(durationMs) {
  const totalSeconds = durationMs / 1000;
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;
    return `${minutes}m ${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
  }
  return `${totalSeconds.toFixed(totalSeconds >= 10 ? 0 : 1)} s`;
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, '');
}

function downloadText(fileName, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(fileName, blob);
}

function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

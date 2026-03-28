const editorState = {
  alignedFile: null,
  alignedHeaders: [],
  alignedRows: [],
  sessionStartMs: null,
  sessionEndMs: null,
  detailCenterMs: null,
  viewWindowSec: 20,
  snapMs: 0,
  pressureShiftMs: 0,
  traceSeries: [],
  pressureFrames: [],
  segmentLabels: [],
  boundaries: [],
  initialBoundaries: [],
  activeBoundaryIndex: -1,
  draggingBoundaryIndex: -1,
  draggingPointerOffsetMs: 0,
};

const SIGNAL_SPECS = [
  {
    key: 'biozS1Mag',
    label: 'BioZ S1 Mag (z-score)',
    series: [
      { label: 'mag1', color: '#38bdf8', compute: (row) => Number(row.BioZ_S1_mag1), normalize: 'zscore' },
      { label: 'mag2', color: '#22d3ee', compute: (row) => Number(row.BioZ_S1_mag2), normalize: 'zscore' },
      { label: 'mag3', color: '#34d399', compute: (row) => Number(row.BioZ_S1_mag3), normalize: 'zscore' },
      { label: 'mag4', color: '#a3e635', compute: (row) => Number(row.BioZ_S1_mag4), normalize: 'zscore' },
    ],
  },
  {
    key: 'biozS2Mag',
    label: 'BioZ S2 Mag (z-score)',
    series: [
      { label: 'mag1', color: '#f59e0b', compute: (row) => Number(row.BioZ_S2_mag1), normalize: 'zscore' },
      { label: 'mag2', color: '#fb7185', compute: (row) => Number(row.BioZ_S2_mag2), normalize: 'zscore' },
      { label: 'mag3', color: '#c084fc', compute: (row) => Number(row.BioZ_S2_mag3), normalize: 'zscore' },
      { label: 'mag4', color: '#f472b6', compute: (row) => Number(row.BioZ_S2_mag4), normalize: 'zscore' },
    ],
  },
  {
    key: 'imuS1Acc',
    label: 'IMU S1 Acc Norm',
    series: [
      { label: 'norm', color: '#fbbf24', compute: (row) => vectorNorm(row, ['IMU_S1_acc_x', 'IMU_S1_acc_y', 'IMU_S1_acc_z']), normalize: 'minmax' },
    ],
  },
  {
    key: 'imuS2Acc',
    label: 'IMU S2 Acc Norm',
    series: [
      { label: 'norm', color: '#fb7185', compute: (row) => vectorNorm(row, ['IMU_S2_acc_x', 'IMU_S2_acc_y', 'IMU_S2_acc_z']), normalize: 'minmax' },
    ],
  },
  {
    key: 'imuS1Gyro',
    label: 'IMU S1 Gyro Norm',
    series: [
      { label: 'norm', color: '#a78bfa', compute: (row) => vectorNorm(row, ['IMU_S1_gyro_x', 'IMU_S1_gyro_y', 'IMU_S1_gyro_z']), normalize: 'minmax' },
    ],
  },
  {
    key: 'imuS2Gyro',
    label: 'IMU S2 Gyro Norm',
    series: [
      { label: 'norm', color: '#34d399', compute: (row) => vectorNorm(row, ['IMU_S2_gyro_x', 'IMU_S2_gyro_y', 'IMU_S2_gyro_z']), normalize: 'minmax' },
    ],
  },
];

const LABEL_COLORS = [
  '#3bc2ff',
  '#00ffcc',
  '#fbbf24',
  '#fb7185',
  '#a78bfa',
  '#34d399',
  '#f97316',
  '#f472b6',
  '#2dd4bf',
  '#60a5fa',
];

const BOUNDARY_HIT_PX = 14;
const MIN_BOUNDARY_GAP_MS = 40;
const LABEL_LANE_HEIGHT = 88;
const PRESSURE_PREVIEW_SCALE = 0.6;

const ui = {
  alignedFileInput: document.getElementById('alignedFileInput'),
  alignedFileMeta: document.getElementById('alignedFileMeta'),
  sessionLabel: document.getElementById('sessionLabel'),
  segmentCount: document.getElementById('segmentCount'),
  boundaryCount: document.getElementById('boundaryCount'),
  sessionDuration: document.getElementById('sessionDuration'),
  windowSecondsInput: document.getElementById('windowSecondsInput'),
  snapMsInput: document.getElementById('snapMsInput'),
  pressureShiftMsInput: document.getElementById('pressureShiftMsInput'),
  statusBox: document.getElementById('statusBox'),
  resetBoundariesBtn: document.getElementById('resetBoundariesBtn'),
  saveAlignedBtn: document.getElementById('saveAlignedBtn'),
  selectedBoundaryLabel: document.getElementById('selectedBoundaryLabel'),
  viewportLabel: document.getElementById('viewportLabel'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomResetBtn: document.getElementById('zoomResetBtn'),
  pressureFrameMeta: document.getElementById('pressureFrameMeta'),
  pressureCanvas: document.getElementById('pressureCanvas'),
  timeScrollRange: document.getElementById('timeScrollRange'),
  prevBoundaryBtn: document.getElementById('prevBoundaryBtn'),
  nextBoundaryBtn: document.getElementById('nextBoundaryBtn'),
  nudgeLeftLargeBtn: document.getElementById('nudgeLeftLargeBtn'),
  nudgeLeftBtn: document.getElementById('nudgeLeftBtn'),
  nudgeRightBtn: document.getElementById('nudgeRightBtn'),
  nudgeRightLargeBtn: document.getElementById('nudgeRightLargeBtn'),
  boundaryList: document.getElementById('boundaryList'),
  overviewCanvas: document.getElementById('overviewCanvas'),
  detailCanvas: document.getElementById('detailCanvas'),
};

initEditor();

function initEditor() {
  ui.alignedFileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    await loadAlignedFile(file);
  });

  ui.windowSecondsInput.addEventListener('change', () => {
    const value = Number(ui.windowSecondsInput.value);
    editorState.viewWindowSec = Number.isFinite(value) && value >= 4 ? value : 20;
    ui.windowSecondsInput.value = String(editorState.viewWindowSec);
    updateViewportLabel();
    drawAll();
  });

  ui.snapMsInput.addEventListener('change', () => {
    const value = Number(ui.snapMsInput.value);
    editorState.snapMs = Number.isFinite(value) && value >= 0 ? value : 0;
    ui.snapMsInput.value = String(editorState.snapMs);
  });

  ui.pressureShiftMsInput.addEventListener('change', () => {
    const value = Number(ui.pressureShiftMsInput.value);
    editorState.pressureShiftMs = Number.isFinite(value) ? value : 0;
    ui.pressureShiftMsInput.value = String(editorState.pressureShiftMs);
    drawPressureMap();
  });

  ui.resetBoundariesBtn.addEventListener('click', resetBoundaries);
  ui.saveAlignedBtn.addEventListener('click', exportRelabeledAlignedCsv);
  ui.zoomInBtn.addEventListener('click', () => adjustZoom(0.75));
  ui.zoomOutBtn.addEventListener('click', () => adjustZoom(1 / 0.75));
  ui.zoomResetBtn.addEventListener('click', () => {
    editorState.viewWindowSec = 20;
    ui.windowSecondsInput.value = '20';
    updateViewportLabel();
    updateTimeScrollControl();
    drawAll();
  });
  ui.timeScrollRange.addEventListener('input', handleTimeScrollInput);
  ui.prevBoundaryBtn.addEventListener('click', () => selectBoundary(editorState.activeBoundaryIndex - 1));
  ui.nextBoundaryBtn.addEventListener('click', () => selectBoundary(editorState.activeBoundaryIndex + 1));
  ui.nudgeLeftLargeBtn.addEventListener('click', () => nudgeBoundary(-100));
  ui.nudgeLeftBtn.addEventListener('click', () => nudgeBoundary(-10));
  ui.nudgeRightBtn.addEventListener('click', () => nudgeBoundary(10));
  ui.nudgeRightLargeBtn.addEventListener('click', () => nudgeBoundary(100));

  ui.overviewCanvas.addEventListener('pointerdown', handleOverviewPointerDown);
  ui.detailCanvas.addEventListener('pointerdown', handleDetailPointerDown);
  ui.overviewCanvas.addEventListener('wheel', handleChartWheel, { passive: false });
  ui.detailCanvas.addEventListener('wheel', handleChartWheel, { passive: false });
  window.addEventListener('pointermove', handleWindowPointerMove);
  window.addEventListener('pointerup', stopDraggingBoundary);
  window.addEventListener('keydown', handleKeyboardShortcuts);
  window.addEventListener('resize', () => {
    resizeCanvasToDisplaySize(ui.overviewCanvas);
    resizeCanvasToDisplaySize(ui.detailCanvas);
    resizeCanvasToDisplaySize(ui.pressureCanvas);
    drawAll();
  });

  resizeCanvasToDisplaySize(ui.overviewCanvas);
  resizeCanvasToDisplaySize(ui.detailCanvas);
  resizeCanvasToDisplaySize(ui.pressureCanvas);
  refreshEditorView();
}

async function loadAlignedFile(file) {
  if (!file) {
    clearAlignedFile();
    return;
  }

  try {
    const text = await file.text();
    const parsed = parseCsv(text);
    validateAlignedCsv(parsed.headers, parsed.rows);

    const rows = parsed.rows
      .map((row) => {
        const obj = Object.fromEntries(parsed.headers.map((header, index) => [header, row[index] ?? '']));
        obj.timestamp_ms = Number(obj.timestamp_ms);
        return obj;
      })
      .filter((row) => Number.isFinite(row.timestamp_ms))
      .sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    if (!rows.length) {
      throw new Error('Aligned CSV does not contain valid timestamp_ms rows.');
    }

    editorState.alignedFile = file;
    editorState.alignedHeaders = parsed.headers;
    editorState.alignedRows = rows;
    editorState.sessionStartMs = rows[0].timestamp_ms;
    editorState.sessionEndMs = rows[rows.length - 1].timestamp_ms;
    editorState.detailCenterMs = editorState.sessionStartMs;
    editorState.traceSeries = buildTraceSeries(rows);
    editorState.pressureFrames = buildPressureFrames(rows);

    const derived = deriveSegmentsAndBoundaries(rows);
    editorState.segmentLabels = derived.segmentLabels;
    editorState.boundaries = derived.boundaries;
    editorState.initialBoundaries = [...derived.boundaries];
    editorState.activeBoundaryIndex = derived.boundaries.length ? 0 : -1;
    if (editorState.activeBoundaryIndex >= 0) {
      editorState.detailCenterMs = editorState.boundaries[editorState.activeBoundaryIndex];
    }

    ui.alignedFileMeta.textContent = `${file.name} · ${rows.length} rows`;
    setStatus('Aligned CSV loaded. Drag the boundary lines to adjust labels.', false);
    refreshEditorView();
  } catch (error) {
    clearAlignedFile();
    setStatus(error instanceof Error ? error.message : 'Could not load aligned CSV.', true);
  }
}

function clearAlignedFile() {
  editorState.alignedFile = null;
  editorState.alignedHeaders = [];
  editorState.alignedRows = [];
  editorState.sessionStartMs = null;
  editorState.sessionEndMs = null;
  editorState.detailCenterMs = null;
  editorState.traceSeries = [];
  editorState.pressureFrames = [];
  editorState.pressureShiftMs = 0;
  editorState.segmentLabels = [];
  editorState.boundaries = [];
  editorState.initialBoundaries = [];
  editorState.activeBoundaryIndex = -1;
  editorState.draggingBoundaryIndex = -1;
  editorState.draggingPointerOffsetMs = 0;
  ui.pressureShiftMsInput.value = '0';
  ui.alignedFileMeta.textContent = 'No file selected.';
  refreshEditorView();
}

function validateAlignedCsv(headers, rows) {
  if (!rows.length) {
    throw new Error('Aligned CSV is empty.');
  }
  if (!headers.includes('timestamp_ms')) {
    throw new Error('Aligned CSV must include timestamp_ms.');
  }
  if (!headers.includes('activity_label')) {
    throw new Error('Aligned CSV must include activity_label.');
  }
}

function deriveSegmentsAndBoundaries(rows) {
  const segmentLabels = [];
  const boundaries = [];
  let previousLabel = buildSegmentLabel(rows[0]);
  segmentLabels.push(previousLabel);

  for (let index = 1; index < rows.length; index += 1) {
    const currentLabel = buildSegmentLabel(rows[index]);
    if (currentLabel.signature !== previousLabel.signature) {
      const previousTimestamp = rows[index - 1].timestamp_ms;
      const currentTimestamp = rows[index].timestamp_ms;
      boundaries.push((previousTimestamp + currentTimestamp) / 2);
      segmentLabels.push(currentLabel);
      previousLabel = currentLabel;
    }
  }

  return { segmentLabels, boundaries };
}

function buildSegmentLabel(row) {
  const label = row.activity_label && row.activity_label !== '' ? row.activity_label : 'null';
  const text = row.activity_label_text && row.activity_label_text !== '' ? row.activity_label_text : label;
  const trialIndex = row.activity_trial_index || '';
  const active = row.activity_active === 'True' || label !== 'null';
  return {
    label,
    text,
    trialIndex,
    active,
    signature: `${label}|||${text}|||${trialIndex}|||${active ? '1' : '0'}`,
  };
}

function refreshEditorView() {
  updateSummary();
  updateButtons();
  renderBoundaryList();
  updateSelectedBoundaryLabel();
  updateViewportLabel();
  updateTimeScrollControl();
  drawAll();
}

function updateSummary() {
  ui.sessionLabel.textContent = editorState.alignedFile ? stripExtension(editorState.alignedFile.name) : '—';
  ui.segmentCount.textContent = String(editorState.segmentLabels.length);
  ui.boundaryCount.textContent = String(editorState.boundaries.length);
  if (Number.isFinite(editorState.sessionStartMs) && Number.isFinite(editorState.sessionEndMs)) {
    ui.sessionDuration.textContent = `${((editorState.sessionEndMs - editorState.sessionStartMs) / 1000).toFixed(1)} s`;
  } else {
    ui.sessionDuration.textContent = '0.0 s';
  }
}

function updateButtons() {
  const hasAligned = editorState.alignedRows.length > 0;
  const hasBoundaries = editorState.boundaries.length > 0;
  const hasActiveBoundary = editorState.activeBoundaryIndex >= 0;
  ui.resetBoundariesBtn.disabled = !hasBoundaries;
  ui.saveAlignedBtn.disabled = !hasAligned;
  ui.zoomInBtn.disabled = !hasAligned;
  ui.zoomOutBtn.disabled = !hasAligned;
  ui.zoomResetBtn.disabled = !hasAligned;
  ui.prevBoundaryBtn.disabled = !(hasActiveBoundary && editorState.activeBoundaryIndex > 0);
  ui.nextBoundaryBtn.disabled = !(hasActiveBoundary && editorState.activeBoundaryIndex < editorState.boundaries.length - 1);
  ui.nudgeLeftLargeBtn.disabled = !hasActiveBoundary;
  ui.nudgeLeftBtn.disabled = !hasActiveBoundary;
  ui.nudgeRightBtn.disabled = !hasActiveBoundary;
  ui.nudgeRightLargeBtn.disabled = !hasActiveBoundary;
}

function renderBoundaryList() {
  const list = ui.boundaryList;
  list.innerHTML = '';
  if (!editorState.boundaries.length) {
    list.classList.add('empty');
    list.textContent = 'No boundaries available yet.';
    return;
  }
  list.classList.remove('empty');

  editorState.boundaries.forEach((boundaryMs, index) => {
    const left = editorState.segmentLabels[index];
    const right = editorState.segmentLabels[index + 1];

    const card = document.createElement('div');
    card.className = `boundary-card${index === editorState.activeBoundaryIndex ? ' selected' : ''}`;
    card.addEventListener('click', () => selectBoundary(index));

    const header = document.createElement('div');
    header.className = 'boundary-card-header';

    const title = document.createElement('div');
    title.className = 'boundary-card-title';
    title.textContent = `B${index + 1}: ${displaySegmentLabel(left)} -> ${displaySegmentLabel(right)}`;

    const badge = document.createElement('div');
    badge.className = 'boundary-card-badge';
    badge.textContent = `${((boundaryMs - editorState.sessionStartMs) / 1000).toFixed(3)} s`;

    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'boundary-card-meta';
    meta.textContent = `Timestamp: ${boundaryMs.toFixed(1)} ms | Clock: ${formatTime(boundaryMs)}`;

    const inputs = document.createElement('div');
    inputs.className = 'boundary-card-inputs';
    const field = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = 'Boundary timestamp (ms)';
    const input = document.createElement('input');
    input.className = 'boundary-time-input';
    input.type = 'number';
    input.step = '0.1';
    input.value = boundaryMs.toFixed(1);
    input.addEventListener('change', (event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        moveBoundary(index, value);
      }
    });
    input.addEventListener('click', (event) => event.stopPropagation());
    field.appendChild(span);
    field.appendChild(input);
    inputs.appendChild(field);

    const note = document.createElement('div');
    note.className = 'boundary-card-note';
    note.textContent = `Left segment: ${describeSegment(left)} | Right segment: ${describeSegment(right)}`;

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(inputs);
    card.appendChild(note);
    list.appendChild(card);
  });
}

function updateSelectedBoundaryLabel() {
  if (editorState.activeBoundaryIndex < 0 || !editorState.boundaries.length) {
    ui.selectedBoundaryLabel.textContent = 'none';
    return;
  }
  const left = editorState.segmentLabels[editorState.activeBoundaryIndex];
  const right = editorState.segmentLabels[editorState.activeBoundaryIndex + 1];
  ui.selectedBoundaryLabel.textContent = `${displaySegmentLabel(left)} -> ${displaySegmentLabel(right)}`;
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
  if (!detailWindow || !Number.isFinite(editorState.sessionStartMs) || !Number.isFinite(editorState.sessionEndMs)) {
    ui.timeScrollRange.disabled = true;
    ui.timeScrollRange.min = '0';
    ui.timeScrollRange.max = '0';
    ui.timeScrollRange.value = '0';
    return;
  }
  const sessionSpan = editorState.sessionEndMs - editorState.sessionStartMs;
  const windowSpan = detailWindow.end - detailWindow.start;
  const maxOffset = Math.max(0, Math.round(sessionSpan - windowSpan));
  const offset = Math.max(0, Math.round(detailWindow.start - editorState.sessionStartMs));
  ui.timeScrollRange.min = '0';
  ui.timeScrollRange.max = String(maxOffset);
  ui.timeScrollRange.step = '1';
  ui.timeScrollRange.value = String(Math.min(maxOffset, offset));
  ui.timeScrollRange.disabled = maxOffset <= 0;
}

function setStatus(message, isError) {
  ui.statusBox.textContent = message;
  ui.statusBox.classList.toggle('error', Boolean(isError));
}

function buildTraceSeries(rows) {
  return SIGNAL_SPECS.map((spec) => {
    return {
      key: spec.key,
      label: spec.label,
      seriesList: spec.series.map((seriesSpec) => {
        const rawValues = rows.map((row) => {
          const value = seriesSpec.compute(row);
          return Number.isFinite(value) ? value : null;
        });
        return {
          label: seriesSpec.label,
          color: seriesSpec.color,
          values: normalizeValues(rawValues, seriesSpec.normalize),
        };
      }),
    };
  });
}

function buildPressureFrames(rows) {
  const frames = [];
  const seen = new Set();
  for (const row of rows) {
    const matrixText = row.pressure_matrix_json;
    if (!matrixText) {
      continue;
    }
    const sourceTimestamp = Number(row.pressure_source_timestamp_ms);
    const frameIndex = row.pressure_frame_index ?? '';
    const dedupeKey = Number.isFinite(sourceTimestamp) ? `${sourceTimestamp}|${frameIndex}` : `${row.timestamp_ms}|${frameIndex}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    try {
      const matrix = JSON.parse(matrixText);
      const matrixRows = Array.isArray(matrix) ? matrix.length : 0;
      const matrixCols = matrixRows && Array.isArray(matrix[0]) ? matrix[0].length : 0;
      if (!matrixRows || !matrixCols) {
        continue;
      }
      const maxValue = matrix.reduce((rowMax, values) => Math.max(rowMax, ...values.map((value) => Number(value) || 0)), 0);
      frames.push({
        timestampMs: row.timestamp_ms,
        sourceTimestampMs: Number.isFinite(sourceTimestamp) ? sourceTimestamp : row.timestamp_ms,
        frameIndex: row.pressure_frame_index ?? '',
        dateTime: row.pressure_dateTime ?? '',
        rows: Number(row.pressure_rows) || matrixRows,
        cols: Number(row.pressure_cols) || matrixCols,
        matrix,
        matrixJson: matrixText,
        sum: Number(row.pressure_sum),
        mean: Number(row.pressure_mean),
        max: Number(row.pressure_max),
        nonzeroCount: Number(row.pressure_nonzero_count),
        deltaMs: Number(row.pressure_delta_ms),
        maxValue,
      });
      seen.add(dedupeKey);
    } catch {
      // Ignore malformed pressure frames and keep the editor usable.
    }
  }
  frames.sort((a, b) => a.timestampMs - b.timestampMs);
  return frames;
}

function normalizeValues(values, mode) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (!finiteValues.length) {
    return values.map(() => null);
  }
  if (mode === 'zscore') {
    const mean = finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
    const variance = finiteValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / finiteValues.length;
    const std = Math.sqrt(variance) || 1;
    return values.map((value) => (Number.isFinite(value) ? (value - mean) / std : null));
  }
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const scale = max - min || 1;
  return values.map((value) => (Number.isFinite(value) ? ((value - min) / scale) * 2 - 1 : null));
}

function meanOfColumns(row, columns) {
  const values = columns.map((column) => Number(row[column])).filter((value) => Number.isFinite(value));
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function vectorNorm(row, columns) {
  const values = columns.map((column) => Number(row[column]));
  if (values.some((value) => !Number.isFinite(value))) {
    return null;
  }
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

function adjustZoom(factor) {
  const current = editorState.viewWindowSec || 20;
  editorState.viewWindowSec = Math.max(4, Math.min(120, current * factor));
  ui.windowSecondsInput.value = String(Math.round(editorState.viewWindowSec * 10) / 10);
  updateViewportLabel();
  updateTimeScrollControl();
  drawAll();
}

function handleTimeScrollInput() {
  if (!Number.isFinite(editorState.sessionStartMs) || !Number.isFinite(editorState.sessionEndMs)) {
    return;
  }
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  const offset = Number(ui.timeScrollRange.value);
  const windowSpan = detailWindow.end - detailWindow.start;
  const start = editorState.sessionStartMs + offset;
  setDetailCenterMs(start + windowSpan / 2);
}

function setDetailCenterMs(centerMs) {
  if (!Number.isFinite(editorState.sessionStartMs) || !Number.isFinite(editorState.sessionEndMs)) {
    return;
  }
  const sessionStart = editorState.sessionStartMs;
  const sessionEnd = editorState.sessionEndMs;
  const windowMs = Math.max(4000, editorState.viewWindowSec * 1000);
  const half = windowMs / 2;
  const minCenter = sessionStart + Math.min(half, (sessionEnd - sessionStart) / 2);
  const maxCenter = sessionEnd - Math.min(half, (sessionEnd - sessionStart) / 2);
  if (minCenter > maxCenter) {
    editorState.detailCenterMs = (sessionStart + sessionEnd) / 2;
  } else {
    editorState.detailCenterMs = Math.max(minCenter, Math.min(maxCenter, centerMs));
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

function selectBoundary(index, options = {}) {
  const { recenter = true, scrollList = true } = options;
  if (!editorState.boundaries.length) {
    return;
  }
  const clamped = Math.max(0, Math.min(index, editorState.boundaries.length - 1));
  editorState.activeBoundaryIndex = clamped;
  if (recenter) {
    setDetailCenterMs(editorState.boundaries[clamped]);
  }
  updateButtons();
  renderBoundaryList();
  updateSelectedBoundaryLabel();
  if (!recenter) {
    updateViewportLabel();
    updateTimeScrollControl();
    drawAll();
  }
  if (scrollList) {
    const node = ui.boundaryList.children[clamped];
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }
}

function resetBoundaries() {
  editorState.boundaries = [...editorState.initialBoundaries];
  if (editorState.boundaries.length && editorState.activeBoundaryIndex < 0) {
    editorState.activeBoundaryIndex = 0;
  }
  if (editorState.activeBoundaryIndex >= 0) {
    setDetailCenterMs(editorState.boundaries[editorState.activeBoundaryIndex]);
  }
  setStatus('Boundaries reset to the uploaded activity labels.', false);
  refreshEditorView();
}

function nudgeBoundary(deltaMs) {
  if (editorState.activeBoundaryIndex < 0) {
    return;
  }
  moveBoundary(editorState.activeBoundaryIndex, editorState.boundaries[editorState.activeBoundaryIndex] + deltaMs);
}

function moveBoundary(index, valueMs, options = {}) {
  const { recenter = true } = options;
  const previous = index === 0 ? editorState.sessionStartMs : editorState.boundaries[index - 1];
  const next = index === editorState.boundaries.length - 1 ? editorState.sessionEndMs : editorState.boundaries[index + 1];
  if (!Number.isFinite(previous) || !Number.isFinite(next)) {
    return;
  }
  let clamped = applySnap(valueMs, editorState.snapMs);
  clamped = Math.max(previous + MIN_BOUNDARY_GAP_MS, clamped);
  clamped = Math.min(next - MIN_BOUNDARY_GAP_MS, clamped);
  editorState.boundaries[index] = clamped;
  editorState.activeBoundaryIndex = index;
  if (recenter) {
    setDetailCenterMs(clamped);
  }
  renderBoundaryList();
  updateButtons();
  updateSelectedBoundaryLabel();
  if (!recenter) {
    updateViewportLabel();
    updateTimeScrollControl();
    drawAll();
  }
}

function handleKeyboardShortcuts(event) {
  if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectBoundary(editorState.activeBoundaryIndex - 1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectBoundary(editorState.activeBoundaryIndex + 1);
  } else if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault();
    nudgeBoundary(event.shiftKey ? -100 : -10);
  } else if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault();
    nudgeBoundary(event.shiftKey ? 100 : 10);
  } else if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    resetBoundaries();
  }
}

function handleOverviewPointerDown(event) {
  if (!Number.isFinite(editorState.sessionStartMs) || !Number.isFinite(editorState.sessionEndMs)) {
    return;
  }
  const x = getCanvasX(ui.overviewCanvas, event);
  setDetailCenterMs(xToTime(x, editorState.sessionStartMs, editorState.sessionEndMs, ui.overviewCanvas.width));
}

function handleDetailPointerDown(event) {
  const detailWindow = getDetailWindow();
  if (!detailWindow || !editorState.boundaries.length) {
    return;
  }
  const x = getCanvasX(ui.detailCanvas, event);
  const hitIndex = findBoundaryHit(x, detailWindow.start, detailWindow.end, ui.detailCanvas.width);
  if (hitIndex < 0) {
    return;
  }
  selectBoundary(hitIndex, { recenter: false, scrollList: false });
  ui.detailCanvas.setPointerCapture(event.pointerId);
  editorState.draggingBoundaryIndex = hitIndex;
  editorState.draggingPointerOffsetMs =
    editorState.boundaries[hitIndex] - xToTime(x, detailWindow.start, detailWindow.end, ui.detailCanvas.width);
}

function handleWindowPointerMove(event) {
  if (editorState.draggingBoundaryIndex < 0) {
    return;
  }
  const detailWindow = getDetailWindow();
  if (!detailWindow) {
    return;
  }
  const x = getCanvasX(ui.detailCanvas, event);
  const pointerMs = xToTime(x, detailWindow.start, detailWindow.end, ui.detailCanvas.width);
  moveBoundary(editorState.draggingBoundaryIndex, pointerMs + editorState.draggingPointerOffsetMs, { recenter: false });
}

function stopDraggingBoundary() {
  editorState.draggingBoundaryIndex = -1;
  editorState.draggingPointerOffsetMs = 0;
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

function findBoundaryHit(x, startMs, endMs, width) {
  let bestIndex = -1;
  let bestDistance = Infinity;
  editorState.boundaries.forEach((boundary, index) => {
    if (boundary < startMs || boundary > endMs) {
      return;
    }
    const boundaryX = timeToX(boundary, startMs, endMs, width);
    const distance = Math.abs(boundaryX - x);
    if (distance <= BOUNDARY_HIT_PX && distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function getDetailWindow() {
  if (!Number.isFinite(editorState.sessionStartMs) || !Number.isFinite(editorState.sessionEndMs)) {
    return null;
  }
  const totalStart = editorState.sessionStartMs;
  const totalEnd = editorState.sessionEndMs;
  const windowMs = Math.max(4000, editorState.viewWindowSec * 1000);
  const half = windowMs / 2;
  let center = Number.isFinite(editorState.detailCenterMs) ? editorState.detailCenterMs : totalStart + half;
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
  resizeCanvasToDisplaySize(ui.pressureCanvas);
  drawOverview();
  drawDetail();
  drawPressureMap();
}

function drawOverview() {
  const ctx = ui.overviewCanvas.getContext('2d');
  const width = ui.overviewCanvas.width;
  const height = ui.overviewCanvas.height;
  clearCanvas(ctx, width, height);

  if (!editorState.alignedRows.length) {
    drawEmptyMessage(ctx, width, height, 'Load one aligned CSV to display its label boundaries.');
    return;
  }

  const traceHeight = height - 46;
  drawSegmentBackground(ctx, {
    width,
    top: 8,
    height: traceHeight,
    startMs: editorState.sessionStartMs,
    endMs: editorState.sessionEndMs,
    alpha: 0.08,
  });
  drawTraceBands(ctx, {
    width,
    top: 8,
    height: traceHeight,
    startMs: editorState.sessionStartMs,
    endMs: editorState.sessionEndMs,
    showLabels: false,
  });
  drawLabelLane(ctx, {
    width,
    top: traceHeight + 10,
    height: 28,
    startMs: editorState.sessionStartMs,
    endMs: editorState.sessionEndMs,
    compact: true,
  });

  const detailWindow = getDetailWindow();
  if (detailWindow) {
    const x1 = timeToX(detailWindow.start, editorState.sessionStartMs, editorState.sessionEndMs, width);
    const x2 = timeToX(detailWindow.end, editorState.sessionStartMs, editorState.sessionEndMs, width);
    ctx.fillStyle = 'rgba(59, 194, 255, 0.12)';
    ctx.fillRect(x1, 0, x2 - x1, height);
    ctx.strokeStyle = 'rgba(59, 194, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, 1, x2 - x1, height - 2);
  }
  drawBoundaryLines(ctx, {
    width,
    top: 8,
    height: traceHeight + 30,
    startMs: editorState.sessionStartMs,
    endMs: editorState.sessionEndMs,
    compact: true,
  });
}

function drawDetail() {
  const ctx = ui.detailCanvas.getContext('2d');
  const width = ui.detailCanvas.width;
  const height = ui.detailCanvas.height;
  clearCanvas(ctx, width, height);

  const detailWindow = getDetailWindow();
  if (!detailWindow || !editorState.alignedRows.length) {
    drawEmptyMessage(ctx, width, height, 'Load one aligned CSV and drag the boundary lines to edit labels.');
    return;
  }

  const traceHeight = height - LABEL_LANE_HEIGHT - 34;
  drawSegmentBackground(ctx, {
    width,
    top: 10,
    height: traceHeight,
    startMs: detailWindow.start,
    endMs: detailWindow.end,
    alpha: 0.1,
  });
  drawTraceBands(ctx, {
    width,
    top: 10,
    height: traceHeight,
    startMs: detailWindow.start,
    endMs: detailWindow.end,
    showLabels: true,
  });
  drawLabelLane(ctx, {
    width,
    top: traceHeight + 18,
    height: LABEL_LANE_HEIGHT,
    startMs: detailWindow.start,
    endMs: detailWindow.end,
    compact: false,
  });
  drawBoundaryLines(ctx, {
    width,
    top: 10,
    height: traceHeight + LABEL_LANE_HEIGHT + 18,
    startMs: detailWindow.start,
    endMs: detailWindow.end,
    compact: false,
  });
}

function drawSegmentBackground(ctx, { width, top, height, startMs, endMs, alpha }) {
  for (let index = 0; index < editorState.segmentLabels.length; index += 1) {
    const segmentStart = index === 0 ? editorState.sessionStartMs : editorState.boundaries[index - 1];
    const segmentEnd = index === editorState.boundaries.length ? editorState.sessionEndMs : editorState.boundaries[index];
    if (segmentEnd <= startMs || segmentStart >= endMs) {
      continue;
    }
    const clippedStart = Math.max(segmentStart, startMs);
    const clippedEnd = Math.min(segmentEnd, endMs);
    const x1 = timeToX(clippedStart, startMs, endMs, width);
    const x2 = timeToX(clippedEnd, startMs, endMs, width);
    const label = editorState.segmentLabels[index];
    ctx.fillStyle = colorForSegment(label, alpha);
    ctx.fillRect(x1, top, Math.max(1, x2 - x1), height);
  }
}

function drawTraceBands(ctx, { width, top, height, startMs, endMs, showLabels }) {
  const count = editorState.traceSeries.length;
  if (!count) {
    drawEmptyMessage(ctx, width, height, 'No plot channels available in this CSV.');
    return;
  }
  const bandHeight = height / count;
  editorState.traceSeries.forEach((band, index) => {
    const bandTop = top + index * bandHeight;
    drawSingleBand(ctx, band, {
      width,
      top: bandTop,
      height: bandHeight,
      startMs,
      endMs,
      showLabel: showLabels,
    });
  });
}

function drawSingleBand(ctx, band, { width, top, height, startMs, endMs, showLabel }) {
  const indices = getVisibleIndexBounds(startMs, endMs);
  ctx.strokeStyle = 'rgba(146, 162, 184, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + height / 2);
  ctx.lineTo(width, top + height / 2);
  ctx.stroke();

  let min = Infinity;
  let max = -Infinity;
  for (const series of band.seriesList) {
    for (let index = indices.start; index <= indices.end; index += 1) {
      const value = series.values[index];
      if (Number.isFinite(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = -1;
    max = 1;
  }
  const range = max - min || 1;
  const step = Math.max(1, Math.ceil((indices.end - indices.start + 1) / width));

  for (const series of band.seriesList) {
    ctx.beginPath();
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 1.4;
    let drawing = false;
    for (let index = indices.start; index <= indices.end; index += step) {
      const value = series.values[index];
      if (!Number.isFinite(value)) {
        drawing = false;
        continue;
      }
      const row = editorState.alignedRows[index];
      const x = timeToX(row.timestamp_ms, startMs, endMs, width);
      const normalized = (value - min) / range;
      const y = top + height - normalized * (height - 16) - 8;
      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  if (showLabel) {
    ctx.fillStyle = '#dbe7f5';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(band.label, 12, top + 18);
    if (band.seriesList.length > 1) {
      drawBandLegend(ctx, band.seriesList, width, top + 18);
    }
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

function drawLabelLane(ctx, { width, top, height, startMs, endMs, compact }) {
  ctx.fillStyle = 'rgba(15, 21, 32, 0.95)';
  ctx.fillRect(0, top, width, height);
  ctx.strokeStyle = 'rgba(34, 43, 61, 1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, top, width, height);

  for (let index = 0; index < editorState.segmentLabels.length; index += 1) {
    const segmentStart = index === 0 ? editorState.sessionStartMs : editorState.boundaries[index - 1];
    const segmentEnd = index === editorState.boundaries.length ? editorState.sessionEndMs : editorState.boundaries[index];
    if (segmentEnd <= startMs || segmentStart >= endMs) {
      continue;
    }
    const clippedStart = Math.max(segmentStart, startMs);
    const clippedEnd = Math.min(segmentEnd, endMs);
    const x1 = timeToX(clippedStart, startMs, endMs, width);
    const x2 = timeToX(clippedEnd, startMs, endMs, width);
    const label = editorState.segmentLabels[index];
    ctx.fillStyle = colorForSegment(label, compact ? 0.35 : 0.55);
    ctx.fillRect(x1, top + 10, Math.max(2, x2 - x1), height - 20);
    ctx.strokeStyle = colorForSegment(label, compact ? 0.7 : 0.9);
    ctx.strokeRect(x1, top + 10, Math.max(2, x2 - x1), height - 20);

    if (!compact) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(displaySegmentLabel(label), Math.max(10, x1 + 6), top + 28);
    }
  }

  if (!compact) {
    ctx.fillStyle = '#d7deea';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('activity_label segments', 10, top - 4);
    drawTimeTicks(ctx, width, startMs, endMs, top + height + 16);
  }
}

function drawBoundaryLines(ctx, { width, top, height, startMs, endMs, compact }) {
  editorState.boundaries.forEach((boundary, index) => {
    if (boundary < startMs || boundary > endMs) {
      return;
    }
    const x = timeToX(boundary, startMs, endMs, width);
    const selected = index === editorState.activeBoundaryIndex;
    const dragging = index === editorState.draggingBoundaryIndex;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = dragging ? 4 : selected ? 3 : 1.5;
    ctx.strokeStyle = dragging ? '#ffffff' : selected ? '#ffe4b5' : 'rgba(255, 255, 255, 0.55)';
    ctx.setLineDash(compact ? [] : selected ? [] : [6, 6]);
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
    ctx.restore();

    if (!compact) {
      ctx.beginPath();
      ctx.fillStyle = dragging ? '#ffffff' : selected ? '#ffe4b5' : '#fda4af';
      ctx.strokeStyle = '#0b1019';
      ctx.lineWidth = 2;
      ctx.arc(x, top + 16, dragging ? 9 : selected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
}

function drawTimeTicks(ctx, width, startMs, endMs, textY) {
  const totalMs = endMs - startMs;
  const approxCount = Math.max(2, Math.floor(width / 150));
  const rawStep = totalMs / approxCount;
  const step = niceStepMs(rawStep);
  const firstTick = Math.ceil(startMs / step) * step;
  ctx.strokeStyle = 'rgba(146, 162, 184, 0.14)';
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

function drawPressureMap() {
  const canvas = ui.pressureCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  clearCanvas(ctx, width, height);

  if (!editorState.pressureFrames.length) {
    ui.pressureFrameMeta.textContent = 'No pressure data found in this CSV';
    drawEmptyMessage(ctx, width, height, 'No pressure frames available.');
    return;
  }

  const targetTimestamp = getPressurePreviewTimestamp();
  const frame = getNearestPressureFrame(targetTimestamp);
  if (!frame) {
    ui.pressureFrameMeta.textContent = 'No matching pressure frame';
    drawEmptyMessage(ctx, width, height, 'No pressure frame near the selected time.');
    return;
  }

  const rows = frame.rows || frame.matrix.length;
  const cols = frame.cols || (frame.matrix[0] ? frame.matrix[0].length : 0);
  if (!rows || !cols) {
    ui.pressureFrameMeta.textContent = 'Pressure frame is empty';
    drawEmptyMessage(ctx, width, height, 'Pressure frame is empty.');
    return;
  }

  const padding = 20;
  const maxCellSize = Math.max(1, Math.min((width - padding * 2) / rows, (height - padding * 2) / cols));
  const cellSize = Math.max(1, maxCellSize * PRESSURE_PREVIEW_SCALE);
  const drawWidth = cellSize * rows;
  const drawHeight = cellSize * cols;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const scaleMax = frame.maxValue || frame.max || 1;

  ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.fillRect(offsetX - 1, offsetY - 1, drawWidth + 2, drawHeight + 2);

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const value = Number(frame.matrix[rowIndex]?.[colIndex]) || 0;
      ctx.fillStyle = pressureColor(value, scaleMax);
      const rotatedX = offsetX + (rows - 1 - rowIndex) * cellSize;
      const rotatedY = offsetY + colIndex * cellSize;
      ctx.fillRect(rotatedX, rotatedY, cellSize, cellSize);
    }
  }

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);

  const shiftedTimestampMs = getShiftedPressureTimestamp(frame);
  const deltaMs = Math.round(shiftedTimestampMs - targetTimestamp);
  const sumText = Number.isFinite(frame.sum) ? frame.sum.toFixed(1) : 'n/a';
  const maxText = Number.isFinite(frame.max) ? frame.max.toFixed(1) : frame.maxValue.toFixed(1);
  const shiftText = editorState.pressureShiftMs ? ` | shift ${editorState.pressureShiftMs >= 0 ? '+' : ''}${editorState.pressureShiftMs} ms` : '';
  ui.pressureFrameMeta.textContent = `frame ${formatTime(shiftedTimestampMs)} | delta ${deltaMs >= 0 ? '+' : ''}${deltaMs} ms${shiftText} | sum ${sumText} | max ${maxText}`;
}

function getPressurePreviewTimestamp() {
  if (editorState.draggingBoundaryIndex >= 0) {
    return editorState.boundaries[editorState.draggingBoundaryIndex];
  }
  if (editorState.activeBoundaryIndex >= 0) {
    return editorState.boundaries[editorState.activeBoundaryIndex];
  }
  return Number.isFinite(editorState.detailCenterMs) ? editorState.detailCenterMs : editorState.sessionStartMs;
}

function getNearestPressureFrame(timestampMs) {
  if (!editorState.pressureFrames.length || !Number.isFinite(timestampMs)) {
    return null;
  }
  let left = 0;
  let right = editorState.pressureFrames.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (getShiftedPressureTimestamp(editorState.pressureFrames[mid]) < timestampMs) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  const current = editorState.pressureFrames[left];
  const previous = left > 0 ? editorState.pressureFrames[left - 1] : null;
  if (!previous) {
    return current;
  }
  return Math.abs(getShiftedPressureTimestamp(previous) - timestampMs) <= Math.abs(getShiftedPressureTimestamp(current) - timestampMs)
    ? previous
    : current;
}

function getShiftedPressureTimestamp(frame) {
  const baseTimestamp = Number.isFinite(frame.sourceTimestampMs) ? frame.sourceTimestampMs : frame.timestampMs;
  return baseTimestamp + editorState.pressureShiftMs;
}

function pressureColor(value, maxValue) {
  if (!value || maxValue <= 0) {
    return 'rgba(15, 23, 42, 1)';
  }
  const t = Math.max(0, Math.min(1, value / maxValue));
  if (t < 0.25) {
    const local = t / 0.25;
    return `rgb(${Math.round(15 + local * 35)}, ${Math.round(23 + local * 70)}, ${Math.round(42 + local * 100)})`;
  }
  if (t < 0.5) {
    const local = (t - 0.25) / 0.25;
    return `rgb(${Math.round(50 + local * 80)}, ${Math.round(93 + local * 80)}, ${Math.round(142 - local * 60)})`;
  }
  if (t < 0.75) {
    const local = (t - 0.5) / 0.25;
    return `rgb(${Math.round(130 + local * 90)}, ${Math.round(173 + local * 50)}, ${Math.round(82 - local * 40)})`;
  }
  const local = (t - 0.75) / 0.25;
  return `rgb(${Math.round(220 + local * 35)}, ${Math.round(223 - local * 120)}, ${Math.round(42 - local * 30)})`;
}

function exportRelabeledAlignedCsv() {
  if (!editorState.alignedRows.length || !editorState.alignedFile) {
    return;
  }
  const relabeledRows = relabelAlignedRows();
  const shiftedPressureRows = applyShiftedPressureAlignment(relabeledRows);
  const headers = [...editorState.alignedHeaders];
  ['activity_label', 'activity_label_text', 'activity_trial_index', 'activity_active'].forEach((column) => {
    if (!headers.includes(column)) {
      headers.push(column);
    }
  });
  const rows = shiftedPressureRows.map((row) => headers.map((header) => row[header] ?? ''));
  const csv = stringifyCsv(rows, headers);
  downloadText(`${stripExtension(editorState.alignedFile.name)}_adjusted_labels.csv`, csv, 'text/csv');
}

function relabelAlignedRows() {
  let segmentIndex = 0;
  return editorState.alignedRows.map((row) => {
    while (segmentIndex < editorState.boundaries.length && row.timestamp_ms > editorState.boundaries[segmentIndex]) {
      segmentIndex += 1;
    }
    const label = editorState.segmentLabels[segmentIndex] || buildNullLabel();
    const updated = { ...row };
    updated.activity_label = label.label;
    updated.activity_label_text = label.text;
    updated.activity_trial_index = label.trialIndex;
    updated.activity_active = label.active ? 'True' : 'False';
    return updated;
  });
}

function applyShiftedPressureAlignment(rows) {
  if (!editorState.pressureFrames.length) {
    return rows;
  }
  return rows.map((row) => {
    const frame = getNearestPressureFrame(Number(row.timestamp_ms));
    if (!frame) {
      return row;
    }
    return applyPressureFrameToRow(row, frame);
  });
}

function applyPressureFrameToRow(row, frame) {
  const shiftedTimestampMs = getShiftedPressureTimestamp(frame);
  const updated = { ...row };
  updated.pressure_frame_index = frame.frameIndex ?? '';
  updated.pressure_source_timestamp_ms = String(Math.round(shiftedTimestampMs));
  updated.pressure_dateTime = new Date(shiftedTimestampMs).toISOString();
  updated.pressure_rows = String(frame.rows ?? '');
  updated.pressure_cols = String(frame.cols ?? '');
  updated.pressure_sum = Number.isFinite(frame.sum) ? String(frame.sum) : '';
  updated.pressure_mean = Number.isFinite(frame.mean) ? String(frame.mean) : '';
  updated.pressure_max = Number.isFinite(frame.max) ? String(frame.max) : '';
  updated.pressure_nonzero_count = Number.isFinite(frame.nonzeroCount) ? String(frame.nonzeroCount) : '';
  updated.pressure_matrix_json = frame.matrixJson ?? JSON.stringify(frame.matrix);
  updated.pressure_delta_ms = String(Math.round(shiftedTimestampMs - Number(row.timestamp_ms)));
  return updated;
}

function buildNullLabel() {
  return {
    label: 'null',
    text: 'null',
    trialIndex: '',
    active: false,
    signature: 'null|||null|||',
  };
}

function getVisibleIndexBounds(startMs, endMs) {
  const rows = editorState.alignedRows;
  let start = 0;
  while (start < rows.length && rows[start].timestamp_ms < startMs) {
    start += 1;
  }
  let end = rows.length - 1;
  while (end > start && rows[end].timestamp_ms > endMs) {
    end -= 1;
  }
  return {
    start: Math.max(0, start - 1),
    end: Math.min(rows.length - 1, end + 1),
  };
}

function displaySegmentLabel(label) {
  if (!label) {
    return 'unknown';
  }
  if (label.label === 'null') {
    return 'null';
  }
  if (label.trialIndex) {
    return `#${label.trialIndex} ${label.text}`;
  }
  return label.text;
}

function describeSegment(label) {
  if (!label) {
    return 'unknown';
  }
  if (label.label === 'null') {
    return 'null class';
  }
  return `${label.text}${label.trialIndex ? ` (trial ${label.trialIndex})` : ''}`;
}

function colorForSegment(label, alpha) {
  const base = label && label.label !== 'null'
    ? LABEL_COLORS[Math.abs(hashString(label.label)) % LABEL_COLORS.length]
    : '#475569';
  return hexToRgba(base, alpha);
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const intValue = Number.parseInt(value, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function applySnap(value, snapMs) {
  if (!snapMs) {
    return value;
  }
  return Math.round(value / snapMs) * snapMs;
}

function niceStepMs(rawStep) {
  const choices = [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000];
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
  return new Date(timestampMs).toISOString().slice(11, 23);
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, '');
}

function downloadText(fileName, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

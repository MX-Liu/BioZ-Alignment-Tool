const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const PRESSURE_SERVICE = '12345678-1234-1234-1234-1234567890ab';
const PRESSURE_CHAR = 'abcd1234-1234-1234-1234-1234567890ab';
const MAX_POINTS = 200;
const STUDY_STORAGE_KEY = 'ble_sensor_logger_study';
const STUDY_TOTAL_STEPS = 8;
const STUDY_TRIALS_PER_CHORD = 10;
const STUDY_CHORDS = ['C', 'Em', 'D', 'G'];
const STUDY_CALIBRATION_ROUNDS = 3;
const STUDY_EFFORT_ROUNDS = 3;
const STUDY_STRUMMING_CHORD_OPTIONS = ['C', 'Em'];
const STUDY_STRUMMING_BPMS = [60, 90, 120, 150];
const STUDY_STRUMMING_CUED_REPETITIONS = 20;
const STUDY_STRUMMING_SILENT_REPETITIONS = 20;
const STUDY_STRUMMING_TOTAL_REPETITIONS = STUDY_STRUMMING_CUED_REPETITIONS + STUDY_STRUMMING_SILENT_REPETITIONS;
const STUDY_STRUMMING_REST_DURATION_MS = 10000;
const STUDY_PHASE_DURATION_MIN_MS = 500;
const STUDY_POST_QUESTIONNAIRE_GROUP = 'postStudy';
const STUDY_STRUMMING_QUESTIONNAIRE_GROUP = 'postStrumming';
const STUDY_QUESTIONNAIRE_IDS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];
const STUDY_STRUMMING_QUESTIONNAIRE_IDS = ['Q8', 'Q9', 'Q10', 'Q11', 'Q12'];
const STUDY_QUESTIONNAIRE_RESPONSE_MIGRATION = {
  Q1: 'Q1',
  Q4: 'Q2',
  Q5: 'Q3',
  Q6: 'Q4',
  Q7: 'Q5',
  Q9: 'Q6',
  Q10: 'Q7',
};
const STUDY_CALIBRATION_EFFORTS = [
  {
    key: 'normal',
    label: 'Normal effort',
    shortLabel: 'NORMAL',
    instruction: 'Use your natural playing pressure.',
  },
];
const STUDY_CALIBRATION_PHASES = [
  { key: 'PLAY', durationMs: 8000, instruction: 'Play {CHORD} with your normal fretting pressure.', ding: true },
  { key: 'REST', durationMs: 2000, instruction: 'Rest before the next chord.' },
];
const STUDY_PHASES = [
  { key: 'REST', durationMs: 3000, instruction: 'Relax your left hand.' },
  { key: 'FORM CHORD', durationMs: 2000, instruction: 'Form: {CHORD}', ding: true },
  { key: 'HOLD STILL', durationMs: 2000, instruction: 'Hold still.' },
  { key: 'RELEASE', durationMs: 1000, instruction: 'Release.' },
];
const STUDY_EFFORT_PHASES = [
  { key: 'FORM NORMAL', durationMs: 5000, instruction: 'Form {CHORD} with normal force.', ding: true, effort: 'normal' },
  { key: 'RAMP TO HARD', durationMs: 5000, instruction: 'Increase pressure progressively until hard force.', effort: 'hard' },
  { key: 'RAMP TO LIGHT', durationMs: 5000, instruction: 'Reduce pressure progressively through normal until light force.', effort: 'light' },
  { key: 'REST', durationMs: 5000, instruction: 'Rest before the next chord.', effort: 'idle' },
];
const STUDY_STEP_TITLES = [
  'Participant information',
  'Chord familiarization',
  'Calibration session',
  'Chord Form-Hold-Release',
  'Effort Manipulation',
  'Post-study questionnaire',
  'Strumming speed',
  'Post-strumming questionnaire',
];
const STUDY_STEP_HINTS = [
  'Complete every required participant field before continuing to familiarization.',
  'Confirm all four chords and participant readiness before starting calibration.',
  'Finish the normal-effort calibration prompts to unlock the chord experiment.',
  'Complete the randomized chord trials before starting effort manipulation.',
  'Finish all effort rounds before opening the post-study questionnaire.',
  'Answer every questionnaire item before starting the guided strumming session.',
  'Complete the strumming speed session before opening the post-strumming questionnaire.',
  'Answer every post-strumming questionnaire item to finish the study guide.',
];

const state = {
  isMeasuring: false,
  eisChannelMode: 'together',
  sensor1: createSensorState('Sensor1'),
  sensor2: createSensorState('Sensor2'),
  sensor3: createSensorState('PiezoSensor'),
  latestRaw: null,
  selectedLabelIndex: 0,
  currentDataLabel: '0',
  labels: Array.from({ length: 10 }, (_, index) => String(index)),
  recording: {
    active: false,
    startMs: 0,
    customName: '',
    timestampTag: '',
    files: {},
  },
  study: createDefaultStudyState(),
};

const ui = {
  btnExportAllData: document.getElementById('btnExportAllData'),
  btnOpenStudy: document.getElementById('btnOpenStudy'),
  btnCloseStudy: document.getElementById('btnCloseStudy'),
  btnClearStudyData: document.getElementById('btnClearStudyData'),
  btnStudyFullscreen: document.getElementById('btnStudyFullscreen'),
  studyPage: document.getElementById('studyPage'),
  studyProgressText: document.getElementById('studyProgressText'),
  studySidebarStatus: document.getElementById('studySidebarStatus'),
  studySidebarHint: document.getElementById('studySidebarHint'),
  studyPrev: document.getElementById('studyPrev'),
  studyNext: document.getElementById('studyNext'),
  studyFooterProgress: document.getElementById('studyFooterProgress'),
  studyMessage: document.getElementById('studyMessage'),
  studySummary: document.getElementById('studySummary'),
  studyParticipantCompletion: document.getElementById('studyParticipantCompletion'),
  studyParticipantCompletionBar: document.getElementById('studyParticipantCompletionBar'),
  studyParticipantSummary: document.getElementById('studyParticipantSummary'),
  studyFamiliarizationProgress: document.getElementById('studyFamiliarizationProgress'),
  studyFamiliarizationProgressBar: document.getElementById('studyFamiliarizationProgressBar'),
  studyFamiliarizationSummary: document.getElementById('studyFamiliarizationSummary'),
  studyCalibrationStart: document.getElementById('studyCalibrationStart'),
  studyCalibrationStop: document.getElementById('studyCalibrationStop'),
  studyCalibrationStatus: document.getElementById('studyCalibrationStatus'),
  studyCalibrationTrial: document.getElementById('studyCalibrationTrial'),
  studyCalibrationTarget: document.getElementById('studyCalibrationTarget'),
  studyCalibrationTimer: document.getElementById('studyCalibrationTimer'),
  studyCalibrationProgressBar: document.getElementById('studyCalibrationProgressBar'),
  studyCalibrationPhaseSegment: document.getElementById('studyCalibrationPhaseSegment'),
  studyCalibrationLiveTimer: document.getElementById('studyCalibrationLiveTimer'),
  studyCalibrationLiveProgressBar: document.getElementById('studyCalibrationLiveProgressBar'),
  studyCalibrationLivePhaseSegment: document.getElementById('studyCalibrationLivePhaseSegment'),
  studyCalibrationLiveCue: document.getElementById('studyCalibrationLiveCue'),
  studyCalibrationChord: document.getElementById('studyCalibrationChord'),
  studyCalibrationEffort: document.getElementById('studyCalibrationEffort'),
  studyCalibrationChart: document.getElementById('studyCalibrationChart'),
  studyCalibrationInstruction: document.getElementById('studyCalibrationInstruction'),
  studyCalibrationStopFloating: document.getElementById('studyCalibrationStopFloating'),
  studyCalibrationCountNormal: document.getElementById('studyCalibrationCountNormal'),
  studyCalibrationChordCoverage: document.getElementById('studyCalibrationChordCoverage'),
  studyCalibrationSequenceHint: document.getElementById('studyCalibrationSequenceHint'),
  studyCalibrationChordStrip: document.getElementById('studyCalibrationChordStrip'),
  studyExperimentStart: document.getElementById('studyExperimentStart'),
  studyExperimentStop: document.getElementById('studyExperimentStop'),
  studyExperimentStatus: document.getElementById('studyExperimentStatus'),
  studyExperimentTrial: document.getElementById('studyExperimentTrial'),
  studyExperimentTimer: document.getElementById('studyExperimentTimer'),
  studyExperimentLiveTimer: document.getElementById('studyExperimentLiveTimer'),
  studyExperimentChordStrip: document.getElementById('studyExperimentChordStrip'),
  studyExperimentProgressBar: document.getElementById('studyExperimentProgressBar'),
  studyExperimentPhaseSegment: document.getElementById('studyExperimentPhaseSegment'),
  studyExperimentLiveProgressBar: document.getElementById('studyExperimentLiveProgressBar'),
  studyExperimentLivePhaseSegment: document.getElementById('studyExperimentLivePhaseSegment'),
  studyExperimentTimelineMarkers: document.getElementById('studyExperimentTimelineMarkers'),
  studyExperimentTimelineLabels: document.getElementById('studyExperimentTimelineLabels'),
  studyExperimentLiveCue: document.getElementById('studyExperimentLiveCue'),
  studyExperimentChord: document.getElementById('studyExperimentChord'),
  studyExperimentNextChord: document.getElementById('studyExperimentNextChord'),
  studyExperimentChart: document.getElementById('studyExperimentChart'),
  studyExperimentPhase: document.getElementById('studyExperimentPhase'),
  studyExperimentInstruction: document.getElementById('studyExperimentInstruction'),
  studyExperimentFullscreenFloating: document.getElementById('studyExperimentFullscreenFloating'),
  studyExperimentStopFloating: document.getElementById('studyExperimentStopFloating'),
  studyCountC: document.getElementById('studyCountC'),
  studyCountEm: document.getElementById('studyCountEm'),
  studyCountD: document.getElementById('studyCountD'),
  studyCountG: document.getElementById('studyCountG'),
  studyExperimentSequenceHint: document.getElementById('studyExperimentSequenceHint'),
  studyEffortStart: document.getElementById('studyEffortStart'),
  studyEffortStop: document.getElementById('studyEffortStop'),
  studyEffortStatus: document.getElementById('studyEffortStatus'),
  studyEffortTrial: document.getElementById('studyEffortTrial'),
  studyEffortTimer: document.getElementById('studyEffortTimer'),
  studyEffortLiveTimer: document.getElementById('studyEffortLiveTimer'),
  studyEffortChordStrip: document.getElementById('studyEffortChordStrip'),
  studyEffortProgressBar: document.getElementById('studyEffortProgressBar'),
  studyEffortLiveProgressBar: document.getElementById('studyEffortLiveProgressBar'),
  studyEffortLiveCue: document.getElementById('studyEffortLiveCue'),
  studyEffortChord: document.getElementById('studyEffortChord'),
  studyEffortChart: document.getElementById('studyEffortChart'),
  studyEffortTarget: document.getElementById('studyEffortTarget'),
  studyEffortPhase: document.getElementById('studyEffortPhase'),
  studyEffortInstruction: document.getElementById('studyEffortInstruction'),
  studyEffortFullscreenFloating: document.getElementById('studyEffortFullscreenFloating'),
  studyEffortStopFloating: document.getElementById('studyEffortStopFloating'),
  studyEffortCountC: document.getElementById('studyEffortCountC'),
  studyEffortCountEm: document.getElementById('studyEffortCountEm'),
  studyEffortCountD: document.getElementById('studyEffortCountD'),
  studyEffortCountG: document.getElementById('studyEffortCountG'),
  studyEffortSequenceHint: document.getElementById('studyEffortSequenceHint'),
  studyStrummingStart: document.getElementById('studyStrummingStart'),
  studyStrummingStop: document.getElementById('studyStrummingStop'),
  studyStrummingChordC: document.getElementById('studyStrummingChordC'),
  studyStrummingChordEm: document.getElementById('studyStrummingChordEm'),
  studyStrummingChordPreviewC: document.getElementById('studyStrummingChordPreviewC'),
  studyStrummingChordPreviewEm: document.getElementById('studyStrummingChordPreviewEm'),
  studyStrummingChordHint: document.getElementById('studyStrummingChordHint'),
  studyStrummingStatus: document.getElementById('studyStrummingStatus'),
  studyStrummingSpeed: document.getElementById('studyStrummingSpeed'),
  studyStrummingBeat: document.getElementById('studyStrummingBeat'),
  studyStrummingTimer: document.getElementById('studyStrummingTimer'),
  studyStrummingProgressBar: document.getElementById('studyStrummingProgressBar'),
  studyStrummingLiveCue: document.getElementById('studyStrummingLiveCue'),
  studyStrummingBpm: document.getElementById('studyStrummingBpm'),
  studyStrummingBeatCount: document.getElementById('studyStrummingBeatCount'),
  studyStrummingChordLabel: document.getElementById('studyStrummingChordLabel'),
  studyStrummingChordChart: document.getElementById('studyStrummingChordChart'),
  studyStrummingPulse: document.getElementById('studyStrummingPulse'),
  studyStrummingLiveTimerLabel: document.getElementById('studyStrummingLiveTimerLabel'),
  studyStrummingLiveTimer: document.getElementById('studyStrummingLiveTimer'),
  studyStrummingNextSpeed: document.getElementById('studyStrummingNextSpeed'),
  studyStrummingLiveProgressBar: document.getElementById('studyStrummingLiveProgressBar'),
  studyStrummingInstruction: document.getElementById('studyStrummingInstruction'),
  studyStrummingNext: document.getElementById('studyStrummingNext'),
  studyStrummingFullscreenFloating: document.getElementById('studyStrummingFullscreenFloating'),
  studyStrummingStopFloating: document.getElementById('studyStrummingStopFloating'),
  studyStrummingCount60: document.getElementById('studyStrummingCount60'),
  studyStrummingCount90: document.getElementById('studyStrummingCount90'),
  studyStrummingCount120: document.getElementById('studyStrummingCount120'),
  studyStrummingCount150: document.getElementById('studyStrummingCount150'),
  studyStrummingSequenceHint: document.getElementById('studyStrummingSequenceHint'),
  studyName: document.getElementById('studyName'),
  studyAge: document.getElementById('studyAge'),
  studyGender: document.getElementById('studyGender'),
  studyHandedness: document.getElementById('studyHandedness'),
  studyExperienceYears: document.getElementById('studyExperienceYears'),
  studyPracticeTime: document.getElementById('studyPracticeTime'),
  studyOpenChordProficiency: document.getElementById('studyOpenChordProficiency'),
  studyPlayStyle: document.getElementById('studyPlayStyle'),
  studyChordC: document.getElementById('studyChordC'),
  studyChordEm: document.getElementById('studyChordEm'),
  studyChordD: document.getElementById('studyChordD'),
  studyChordG: document.getElementById('studyChordG'),
  studyFamiliarizationNotes: document.getElementById('studyFamiliarizationNotes'),
  studyFamiliarizationReady: document.getElementById('studyFamiliarizationReady'),
  btnConnect1: document.getElementById('btnConnect1'),
  btnConnect2: document.getElementById('btnConnect2'),
  btnConnect3: document.getElementById('btnConnect3'),
  status1: document.getElementById('status1'),
  status2: document.getElementById('status2'),
  status3: document.getElementById('status3'),
  frequency: document.getElementById('frequency'),
  resistance: document.getElementById('resistance'),
  sweep: document.getElementById('sweep'),
  eisChannelMode: document.getElementById('eisChannelMode'),
  btnStartStop: document.getElementById('btnStartStop'),
  rateEis1: document.getElementById('rateEis1'),
  totalEis1: document.getElementById('totalEis1'),
  rateImu1: document.getElementById('rateImu1'),
  totalImu1: document.getElementById('totalImu1'),
  rateEis2: document.getElementById('rateEis2'),
  totalEis2: document.getElementById('totalEis2'),
  rateImu2: document.getElementById('rateImu2'),
  totalImu2: document.getElementById('totalImu2'),
  ratePressure3: document.getElementById('ratePressure3'),
  totalPressure3: document.getElementById('totalPressure3'),
  rawPacket: document.getElementById('rawPacket'),
  log: document.getElementById('log'),
  labelRow: document.getElementById('labelRow'),
  btnSave: document.getElementById('btnSave'),
  btnDiscard: document.getElementById('btnDiscard'),
  recStatus: document.getElementById('recStatus'),
  recTimer: document.getElementById('recTimer'),
  saveStatus: document.getElementById('saveStatus'),
  eis1Values: document.getElementById('eis1Values'),
  imu1Values: document.getElementById('imu1Values'),
  eis2Values: document.getElementById('eis2Values'),
  imu2Values: document.getElementById('imu2Values'),
  pressure3Values: document.getElementById('pressure3Values'),
};

const charts = {};
let nextRateMs = Date.now() + 1000;
let studyCalibrationTickHandle = 0;
let studyExperimentTickHandle = 0;
let studyEffortTickHandle = 0;
let studyStrummingTickHandle = 0;
let studyAudioContext = null;
const studyUiState = {
  validationStep: -1,
};

init();

function init() {
  initStudyFlow();
  setupLabelButtons();
  setupCharts();
  renderEmptyValueGrids();

  ui.btnExportAllData?.addEventListener('click', exportAllData);

  ui.btnConnect1.addEventListener('click', async () => {
    if (state.sensor1.connected) {
      disconnectSensor(1);
      return;
    }
    await connectSensor(1);
  });

  ui.btnConnect2.addEventListener('click', async () => {
    if (state.sensor2.connected) {
      disconnectSensor(2);
      return;
    }
    await connectSensor(2);
  });

  ui.btnConnect3.addEventListener('click', async () => {
    if (state.sensor3.connected) {
      disconnectSensor(3);
      return;
    }
    await connectPressureSensor();
  });

  ui.btnStartStop.addEventListener('click', async () => {
    if (!state.sensor1.connected && !state.sensor2.connected) {
      log('No sensor connected');
      return;
    }
    state.isMeasuring = !state.isMeasuring;
    await sendCommandToConnected();
    updateStartStopButton();
  });

  ui.eisChannelMode.addEventListener('change', () => {
    const selectedMode = ui.eisChannelMode.value;
    state.eisChannelMode = ['together', 'separate', 'compare'].includes(selectedMode)
      ? selectedMode
      : 'together';
    applyEisViewMode();
  });

  ui.btnSave.addEventListener('click', () => {
    if (!state.recording.active) {
      startRecording();
    } else {
      stopRecording({ save: true });
    }
  });

  ui.btnDiscard.addEventListener('click', () => {
    if (state.recording.active) {
      stopRecording({ save: false });
    } else {
      ui.saveStatus.textContent = 'Discarded.';
    }
  });

  window.addEventListener('beforeunload', () => {
    disconnectSensor(1);
    disconnectSensor(2);
    disconnectSensor(3);
  });

  setInterval(uiTick, 50);
  applyEisViewMode();
  updateStartStopButton();
}

function createSensorState(defaultName) {
  return {
    defaultName,
    name: defaultName,
    connected: false,
    device: null,
    server: null,
    txChar: null,
    rxChar: null,
    latestEis: null,
    latestImu: null,
    latestPressure: null,
    dirtyEis: false,
    dirtyImu: false,
    dirtyPressure: false,
    rateEis: 0,
    rateImu: 0,
    ratePressure: 0,
    totalEis: 0,
    totalImu: 0,
    totalPressure: 0,
    rxBuffer: new Uint8Array(0),
  };
}

function createDefaultStudyQuestionnaireResponses(questionIds = STUDY_QUESTIONNAIRE_IDS) {
  return questionIds.reduce((responses, questionId) => {
    responses[questionId] = '';
    return responses;
  }, {});
}

function normalizeStudyPercentageValue(value) {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'string' && value.trim() === '') return '';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '';
  return String(Math.max(0, Math.min(100, Math.round(numericValue))));
}

function getStudyQuestionnaireInputs(groupKey = '') {
  const selector = groupKey
    ? `[data-study-question][data-study-question-group="${groupKey}"]`
    : '[data-study-question]';
  return [...document.querySelectorAll(selector)];
}

function normalizeStudyQuestionnaireResponseValue(value) {
  return normalizeStudyPercentageValue(value);
}

function updateStudyQuestionnaireInputPresentation(input) {
  const questionId = input?.dataset.studyQuestion;
  if (!questionId) return;

  const valueElement = document.querySelector(`[data-study-question-value="${questionId}"]`);
  const normalizedValue = normalizeStudyQuestionnaireResponseValue(input.value) || '50';
  const isAnswered = input.dataset.studyQuestionAnswered === 'true';

  input.value = normalizedValue;
  input.style.setProperty('--study-slider-fill', `${normalizedValue}%`);
  input.classList.toggle('is-unanswered', !isAnswered);
  input.closest('.study-questionnaire-item')?.classList.toggle('is-unanswered', !isAnswered);

  if (valueElement) {
    valueElement.textContent = isAnswered ? normalizedValue : '--';
    valueElement.classList.toggle('is-unanswered', !isAnswered);
  }
}

function applyStudyQuestionnaireResponse(input, response) {
  if (!input) return;
  const normalizedValue = normalizeStudyQuestionnaireResponseValue(response);
  input.dataset.studyQuestionAnswered = normalizedValue !== '' ? 'true' : 'false';
  input.value = normalizedValue || '50';
  updateStudyQuestionnaireInputPresentation(input);
}

function readStudyQuestionnaireResponses(questionIds = STUDY_QUESTIONNAIRE_IDS, groupKey = STUDY_POST_QUESTIONNAIRE_GROUP) {
  const responses = createDefaultStudyQuestionnaireResponses(questionIds);
  const questionIdSet = new Set(questionIds);
  getStudyQuestionnaireInputs(groupKey).forEach((input) => {
    const questionId = input.dataset.studyQuestion;
    if (!questionId || !questionIdSet.has(questionId)) return;
    responses[questionId] = input.dataset.studyQuestionAnswered === 'true'
      ? normalizeStudyQuestionnaireResponseValue(input.value)
      : '';
  });
  return responses;
}

function updateStudyParticipantRangePresentation(input) {
  const fieldKey = input?.dataset.studyParticipantRange;
  if (!fieldKey) return;

  const valueElement = document.querySelector(`[data-study-participant-range-value="${fieldKey}"]`);
  const normalizedValue = normalizeStudyPercentageValue(input.value) || '50';
  const isAnswered = input.dataset.studyParticipantRangeAnswered === 'true';

  input.value = normalizedValue;
  input.style.setProperty('--study-slider-fill', `${normalizedValue}%`);
  input.classList.toggle('is-unanswered', !isAnswered);

  if (valueElement) {
    valueElement.textContent = isAnswered ? normalizedValue : '--';
    valueElement.classList.toggle('is-unanswered', !isAnswered);
  }
}

function applyStudyParticipantRangeValue(input, value) {
  if (!input) return;
  const normalizedValue = normalizeStudyPercentageValue(value);
  input.dataset.studyParticipantRangeAnswered = normalizedValue !== '' ? 'true' : 'false';
  input.value = normalizedValue || '50';
  updateStudyParticipantRangePresentation(input);
}

function readStudyParticipantRangeValue(input) {
  if (!input || input.dataset.studyParticipantRangeAnswered !== 'true') return '';
  return normalizeStudyPercentageValue(input.value);
}

function isStudyPercentageValue(value) {
  return normalizeStudyPercentageValue(value) !== '';
}

function migrateStudyQuestionnaireResponses(
  responses,
  questionIds = STUDY_QUESTIONNAIRE_IDS,
  migrationMap = STUDY_QUESTIONNAIRE_RESPONSE_MIGRATION,
) {
  const migratedResponses = createDefaultStudyQuestionnaireResponses(questionIds);
  if (!responses || typeof responses !== 'object') return migratedResponses;

  questionIds.forEach((questionId) => {
    if (Object.prototype.hasOwnProperty.call(responses, questionId)) {
      migratedResponses[questionId] = responses[questionId] || '';
    }
  });

  Object.entries(migrationMap).forEach(([legacyId, nextId]) => {
    if (migratedResponses[nextId]) return;
    if (!Object.prototype.hasOwnProperty.call(responses, legacyId)) return;
    migratedResponses[nextId] = responses[legacyId] || '';
  });

  return migratedResponses;
}

function migrateStudyChord(chord) {
  if (chord === 'F') return 'D';
  if (chord === 'Am') return 'Em';
  return chord;
}

function migrateStudyChordSequence(sequence) {
  if (!Array.isArray(sequence)) return [];
  return sequence.map((item) => {
    if (typeof item === 'string') return migrateStudyChord(item);
    if (!item || typeof item !== 'object') return item;
    return {
      ...item,
      chord: migrateStudyChord(item.chord),
    };
  });
}

function migrateStudyChordCounts(counts) {
  const migratedCounts = {
    C: 0,
    Em: 0,
    D: 0,
    G: 0,
    ...(counts || {}),
  };

  migratedCounts.D = Number(migratedCounts.D || 0) + Number(migratedCounts.F || 0);
  migratedCounts.Em = Number(migratedCounts.Em || 0) + Number(migratedCounts.Am || 0);
  delete migratedCounts.F;
  delete migratedCounts.Am;
  return migratedCounts;
}

function migrateStudyFamiliarization(familiarization) {
  return {
    C: Boolean(familiarization?.C),
    Em: Boolean(familiarization?.Em || familiarization?.Am),
    D: Boolean(familiarization?.D || familiarization?.F),
    G: Boolean(familiarization?.G),
    notes: familiarization?.notes || '',
    ready: Boolean(familiarization?.ready),
  };
}

function normalizeUnixTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value) {
    const parsedNumber = Number(value);
    if (Number.isFinite(parsedNumber)) return parsedNumber;
    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) return parsedDate;
  }
  return 0;
}

function migrateStudyCalibrationRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => {
    const startedAt = normalizeUnixTimestamp(record?.startedAt);
    const endedAt = normalizeUnixTimestamp(record?.endedAt);

    return {
      ...record,
      chord: migrateStudyChord(record?.chord || ''),
      startedAt,
      endedAt,
      durationMs: Number.isFinite(record?.durationMs)
        ? record.durationMs
        : Math.max(0, endedAt - startedAt),
    };
  });
}

function migrateStudyExperimentRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => {
    const formStartedAt = normalizeUnixTimestamp(record?.formStartedAt);
    const holdStartedAt = normalizeUnixTimestamp(record?.holdStartedAt);
    const releaseStartedAt = normalizeUnixTimestamp(record?.releaseStartedAt);
    const endedAt = normalizeUnixTimestamp(record?.endedAt);

    return {
      ...record,
      chord: migrateStudyChord(record?.chord || ''),
      formStartedAt,
      holdStartedAt,
      releaseStartedAt,
      endedAt,
      durationMs: Number.isFinite(record?.durationMs)
        ? record.durationMs
        : Math.max(0, endedAt - formStartedAt),
    };
  });
}

function migrateStudyEffortRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => {
    const startedAt = normalizeUnixTimestamp(record?.startedAt);
    const endedAt = normalizeUnixTimestamp(record?.endedAt);

    return {
      ...record,
      chord: migrateStudyChord(record?.chord || ''),
      startedAt,
      endedAt,
      durationMs: Number.isFinite(record?.durationMs)
        ? record.durationMs
        : Math.max(0, endedAt - startedAt),
    };
  });
}

function migrateStudyStrummingRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => ({
    ...record,
    phase: normalizeStudyStrummingPhase(record?.phase),
    type: record?.type || '',
    bpm: Number(record?.bpm) || 0,
    beat: Number(record?.beat) || 0,
    speedIndex: Number(record?.speedIndex) || 0,
    cuedAt: normalizeUnixTimestamp(record?.cuedAt),
    completedAt: normalizeUnixTimestamp(record?.completedAt),
  }));
}

function normalizeStudyStrummingPhase(phase) {
  const normalized = String(phase || '').trim().toLowerCase();
  if (normalized === 'cued') return 'cued';
  if (normalized === 'manual') return 'manual';
  if (normalized === 'rest') return 'rest';
  if (normalized === 'completed') return 'completed';
  return 'idle';
}

function normalizeStudyStrummingChord(chord) {
  return STUDY_STRUMMING_CHORD_OPTIONS.includes(chord) ? chord : '';
}

function createDefaultStudyStrummingCounts() {
  return STUDY_STRUMMING_BPMS.reduce((result, bpm) => {
    result[bpm] = 0;
    return result;
  }, {});
}

function createStudyPhaseDurationMap(phases) {
  return phases.reduce((durations, phase) => {
    durations[phase.key] = phase.durationMs;
    return durations;
  }, {});
}

function createDefaultStudySettings() {
  return {
    phaseDurationsMs: {
      calibration: createStudyPhaseDurationMap(STUDY_CALIBRATION_PHASES),
      experiment: createStudyPhaseDurationMap(STUDY_PHASES),
      effort: createStudyPhaseDurationMap(STUDY_EFFORT_PHASES),
    },
  };
}

function sanitizeStudyPhaseDurationMs(value, fallbackMs) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallbackMs;
  return Math.max(STUDY_PHASE_DURATION_MIN_MS, Math.round(numeric));
}

function migrateStudyPhaseDurationGroup(parsedGroup, phaseDefaults) {
  const defaults = createStudyPhaseDurationMap(phaseDefaults);
  return Object.keys(defaults).reduce((durations, phaseKey) => {
    durations[phaseKey] = sanitizeStudyPhaseDurationMs(parsedGroup?.[phaseKey], defaults[phaseKey]);
    return durations;
  }, {});
}

function migrateStudySettings(parsedSettings) {
  const defaults = createDefaultStudySettings();
  return {
    ...defaults,
    ...(parsedSettings || {}),
    phaseDurationsMs: {
      calibration: migrateStudyPhaseDurationGroup(parsedSettings?.phaseDurationsMs?.calibration, STUDY_CALIBRATION_PHASES),
      experiment: migrateStudyPhaseDurationGroup(parsedSettings?.phaseDurationsMs?.experiment, STUDY_PHASES),
      effort: migrateStudyPhaseDurationGroup(parsedSettings?.phaseDurationsMs?.effort, STUDY_EFFORT_PHASES),
    },
  };
}

function getStudyConfiguredPhases(groupKey, phaseDefaults) {
  const configuredDurations = state.study.settings?.phaseDurationsMs?.[groupKey] || {};
  return phaseDefaults.map((phase) => ({
    ...phase,
    durationMs: sanitizeStudyPhaseDurationMs(configuredDurations[phase.key], phase.durationMs),
  }));
}

function getStudyCalibrationPhases() {
  return getStudyConfiguredPhases('calibration', STUDY_CALIBRATION_PHASES);
}

function getStudyExperimentPhases() {
  return getStudyConfiguredPhases('experiment', STUDY_PHASES);
}

function getStudyEffortPhases() {
  return getStudyConfiguredPhases('effort', STUDY_EFFORT_PHASES);
}

function getStudyPhaseDurationMs(groupKey, phaseKey) {
  const phases = groupKey === 'calibration'
    ? getStudyCalibrationPhases()
    : groupKey === 'experiment'
      ? getStudyExperimentPhases()
      : getStudyEffortPhases();
  return phases.find((phase) => phase.key === phaseKey)?.durationMs || STUDY_PHASE_DURATION_MIN_MS;
}

function formatStudyDurationLabel(durationMs) {
  const seconds = durationMs / 1000;
  return Number.isInteger(seconds) ? `${seconds} s` : `${seconds.toFixed(1)} s`;
}

function formatStudyDurationInputValue(durationMs) {
  const seconds = durationMs / 1000;
  return Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1);
}

function createDefaultStudyState() {
  return {
    currentStep: 0,
    participant: {
      name: '',
      age: '',
      gender: '',
      handedness: '',
      experienceYears: '',
      practiceTime: '',
      openChordProficiency: '',
      playStyle: '',
    },
    familiarization: {
      C: false,
      Em: false,
      D: false,
      G: false,
      notes: '',
      ready: false,
    },
    calibration: {
      running: false,
      completed: false,
      sequence: [],
      currentTrialIndex: -1,
      currentChord: '',
      currentPhase: 'Waiting',
      phaseStartedAt: 0,
      currentTrialStartedAt: 0,
      currentEffort: '',
      counts: { normal: 0 },
      records: [],
      completedAt: '',
    },
    experiment: {
      running: false,
      completed: false,
      sequence: [],
      currentTrialIndex: -1,
      currentPhaseIndex: 0,
      trialStartedAt: 0,
      phaseStartedAt: 0,
      phaseTimestamps: {
        formStartedAt: 0,
        holdStartedAt: 0,
        releaseStartedAt: 0,
      },
      currentChord: '',
      currentPhase: 'Waiting',
      counts: { C: 0, Em: 0, D: 0, G: 0 },
      records: [],
      completedAt: '',
    },
    effort: {
      running: false,
      completed: false,
      sequence: [],
      currentTrialIndex: -1,
      currentPhaseIndex: 0,
      trialStartedAt: 0,
      phaseStartedAt: 0,
      currentChord: '',
      currentPhase: 'Waiting',
      currentEffort: 'idle',
      counts: { C: 0, Em: 0, D: 0, G: 0 },
      records: [],
      completedAt: '',
    },
    strumming: {
      running: false,
      completed: false,
      sequence: [...STUDY_STRUMMING_BPMS],
      selectedChord: '',
      currentSpeedIndex: -1,
      currentBpm: 0,
      currentPhase: 'idle',
      currentBeat: 0,
      totalBeats: 0,
      speedStartedAt: 0,
      lastCueAt: 0,
      nextCueAt: 0,
      counts: createDefaultStudyStrummingCounts(),
      records: [],
      completedAt: '',
    },
    questionnaire: {
      responses: createDefaultStudyQuestionnaireResponses(),
    },
    strummingQuestionnaire: {
      responses: createDefaultStudyQuestionnaireResponses(STUDY_STRUMMING_QUESTIONNAIRE_IDS),
    },
    settings: createDefaultStudySettings(),
    completed: false,
    completedAt: '',
  };
}

function initStudyFlow() {
  loadStudyState();
  populateStudyForm();
  renderStudyStep();
  renderStudySummary();
  renderStudyCalibration();
  renderStudyExperiment();
  renderStudyEffort();
  renderStudyStrumming();
  updateStudyFullscreenButtons();

  ui.btnOpenStudy?.addEventListener('click', openStudyPage);
  ui.btnCloseStudy?.addEventListener('click', closeStudyPage);
  ui.btnClearStudyData?.addEventListener('click', clearStudyData);
  ui.btnStudyFullscreen?.addEventListener('click', toggleStudyFullscreen);
  ui.studyPrev?.addEventListener('click', goToPreviousStudyStep);
  ui.studyNext?.addEventListener('click', handleStudyNext);
  ui.studyCalibrationStart?.addEventListener('click', startStudyCalibration);
  ui.studyCalibrationStop?.addEventListener('click', () => stopStudyCalibration({ resetMessage: false }));
  ui.studyCalibrationStopFloating?.addEventListener('click', () => stopStudyCalibration({ resetMessage: false }));
  ui.studyExperimentStart?.addEventListener('click', startStudyExperiment);
  ui.studyExperimentStop?.addEventListener('click', () => stopStudyExperiment({ resetMessage: false }));
  ui.studyExperimentFullscreenFloating?.addEventListener('click', toggleStudyFullscreen);
  ui.studyExperimentStopFloating?.addEventListener('click', () => stopStudyExperiment({ resetMessage: false }));
  ui.studyEffortStart?.addEventListener('click', startStudyEffort);
  ui.studyEffortStop?.addEventListener('click', () => stopStudyEffort({ resetMessage: false }));
  ui.studyEffortFullscreenFloating?.addEventListener('click', toggleStudyFullscreen);
  ui.studyEffortStopFloating?.addEventListener('click', () => stopStudyEffort({ resetMessage: false }));
  ui.studyStrummingStart?.addEventListener('click', startStudyStrumming);
  ui.studyStrummingStop?.addEventListener('click', () => stopStudyStrumming({ resetMessage: false }));
  ui.studyStrummingNext?.addEventListener('click', advanceStudyStrummingSession);
  ui.studyStrummingFullscreenFloating?.addEventListener('click', toggleStudyFullscreen);
  ui.studyStrummingStopFloating?.addEventListener('click', () => stopStudyStrumming({ resetMessage: false }));
  ui.studyStrummingChordC?.addEventListener('click', () => setStudyStrummingSelectedChord('C'));
  ui.studyStrummingChordEm?.addEventListener('click', () => setStudyStrummingSelectedChord('Em'));
  document.addEventListener('fullscreenchange', updateStudyFullscreenButtons);
  document.querySelectorAll('[data-study-phase-duration-input]').forEach((input) => {
    input.addEventListener('change', handleStudyPhaseDurationInput);
  });

  const studyInputs = [
    ui.studyName,
    ui.studyAge,
    ui.studyGender,
    ui.studyHandedness,
    ui.studyExperienceYears,
    ui.studyPracticeTime,
    ui.studyOpenChordProficiency,
    ui.studyPlayStyle,
    ui.studyChordC,
    ui.studyChordEm,
    ui.studyChordD,
    ui.studyChordG,
    ui.studyFamiliarizationNotes,
    ui.studyFamiliarizationReady,
    ...getStudyQuestionnaireInputs(),
  ].filter(Boolean);

  studyInputs.forEach((input) => {
    const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(eventName, () => {
      if (input.type === 'range' && input.dataset.studyQuestion) {
        input.dataset.studyQuestionAnswered = 'true';
        updateStudyQuestionnaireInputPresentation(input);
      }
      if (input.type === 'range' && input.dataset.studyParticipantRange) {
        input.dataset.studyParticipantRangeAnswered = 'true';
        updateStudyParticipantRangePresentation(input);
      }
      syncStudyStateFromForm();
      clearStudyMessage();
      renderStudyStep();
      renderStudySummary();
    });
  });
}

function openStudyPage() {
  syncStudyStateFromForm();
  ui.studyPage.hidden = false;
  ui.studyPage.setAttribute('aria-hidden', 'false');
  document.body.classList.add('study-open');
  renderStudyStep();
  renderStudySummary();
  renderStudyCalibration();
  renderStudyExperiment();
  renderStudyEffort();
  renderStudyStrumming();
}

function closeStudyPage() {
  syncStudyStateFromForm();
  ui.studyPage.hidden = true;
  ui.studyPage.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('study-open');
  document.body.classList.remove('study-calibration-focus');
  document.body.classList.remove('study-experiment-focus');
  document.body.classList.remove('study-effort-focus');
  document.body.classList.remove('study-strumming-focus');
}

function clearStudyData() {
  const confirmed = window.confirm('Clear all saved study data on this page? This will reset participant information plus calibration, experiment, effort, and strumming progress in this browser.');
  if (!confirmed) return;

  stopStudyCalibration({ resetState: false, resetMessage: false });
  stopStudyExperiment({ resetState: false, resetMessage: false });
  stopStudyEffort({ resetState: false, resetMessage: false });
  stopStudyStrumming({ resetState: false, resetMessage: false });

  state.study = createDefaultStudyState();
  studyUiState.validationStep = -1;

  try {
    window.localStorage.removeItem(STUDY_STORAGE_KEY);
  } catch (_) {
    // Ignore storage errors and continue resetting the in-memory state.
  }

  populateStudyForm();
  clearStudyMessage();
  persistStudyState();
  renderStudyStep();
  renderStudySummary();
  renderStudyCalibration();
  renderStudyExperiment();
  renderStudyEffort();
  renderStudyStrumming();
  setStudyMessage('Study data cleared. The study page has been reset.', false);
}

function loadStudyState() {
  const defaults = createDefaultStudyState();
  try {
    const raw = window.localStorage.getItem(STUDY_STORAGE_KEY);
    if (!raw) {
      state.study = defaults;
      return;
    }

    const parsed = JSON.parse(raw);
    const parsedCurrentStep = Number(parsed.currentStep);
    const migratedCurrentStep = Object.prototype.hasOwnProperty.call(parsed, 'consent') && Number.isFinite(parsedCurrentStep)
      ? Math.max(0, parsedCurrentStep - 1)
      : parsedCurrentStep;
    const migratedStrummingSequence = Array.isArray(parsed.strumming?.sequence) && parsed.strumming.sequence.length
      ? parsed.strumming.sequence.map((bpm) => Number(bpm)).filter((bpm) => STUDY_STRUMMING_BPMS.includes(bpm))
      : defaults.strumming.sequence;
    const isCurrentStrummingProtocol = (
      migratedStrummingSequence.length === STUDY_STRUMMING_BPMS.length &&
      STUDY_STRUMMING_BPMS.every((bpm, index) => migratedStrummingSequence[index] === bpm)
    );

    state.study = {
      ...defaults,
      ...parsed,
      currentStep: migratedCurrentStep,
      participant: {
        ...defaults.participant,
        ...(parsed.participant || {}),
      },
      familiarization: migrateStudyFamiliarization(parsed.familiarization),
      calibration: {
        ...defaults.calibration,
        ...(parsed.calibration || {}),
        sequence: migrateStudyChordSequence(parsed.calibration?.sequence),
        currentChord: migrateStudyChord(parsed.calibration?.currentChord || ''),
        records: migrateStudyCalibrationRecords(parsed.calibration?.records),
        counts: {
          ...defaults.calibration.counts,
          ...((parsed.calibration && parsed.calibration.counts) || {}),
        },
      },
      experiment: {
        ...defaults.experiment,
        ...(parsed.experiment || {}),
        sequence: migrateStudyChordSequence(parsed.experiment?.sequence),
        currentChord: migrateStudyChord(parsed.experiment?.currentChord || ''),
        phaseTimestamps: {
          ...defaults.experiment.phaseTimestamps,
          ...((parsed.experiment && parsed.experiment.phaseTimestamps) || {}),
        },
        counts: migrateStudyChordCounts(parsed.experiment?.counts),
        records: migrateStudyExperimentRecords(parsed.experiment?.records),
      },
      effort: {
        ...defaults.effort,
        ...(parsed.effort || {}),
        sequence: migrateStudyChordSequence(parsed.effort?.sequence),
        currentChord: migrateStudyChord(parsed.effort?.currentChord || ''),
        counts: migrateStudyChordCounts(parsed.effort?.counts),
        records: migrateStudyEffortRecords(parsed.effort?.records),
      },
      strumming: {
        ...defaults.strumming,
        ...(isCurrentStrummingProtocol ? (parsed.strumming || {}) : {}),
        sequence: isCurrentStrummingProtocol ? migratedStrummingSequence : defaults.strumming.sequence,
        selectedChord: isCurrentStrummingProtocol
          ? normalizeStudyStrummingChord(parsed.strumming?.selectedChord)
          : defaults.strumming.selectedChord,
        currentSpeedIndex: isCurrentStrummingProtocol && Number.isInteger(Number(parsed.strumming?.currentSpeedIndex))
          ? Number(parsed.strumming.currentSpeedIndex)
          : defaults.strumming.currentSpeedIndex,
        currentBpm: isCurrentStrummingProtocol ? Number(parsed.strumming?.currentBpm) || defaults.strumming.currentBpm : defaults.strumming.currentBpm,
        currentPhase: isCurrentStrummingProtocol ? normalizeStudyStrummingPhase(parsed.strumming?.currentPhase) : defaults.strumming.currentPhase,
        currentBeat: isCurrentStrummingProtocol
          ? Math.max(0, Math.min(STUDY_STRUMMING_CUED_REPETITIONS, Number(parsed.strumming?.currentBeat) || 0))
          : defaults.strumming.currentBeat,
        totalBeats: isCurrentStrummingProtocol ? Math.max(0, Number(parsed.strumming?.totalBeats) || 0) : defaults.strumming.totalBeats,
        speedStartedAt: isCurrentStrummingProtocol ? normalizeUnixTimestamp(parsed.strumming?.speedStartedAt) : defaults.strumming.speedStartedAt,
        lastCueAt: isCurrentStrummingProtocol ? normalizeUnixTimestamp(parsed.strumming?.lastCueAt) : defaults.strumming.lastCueAt,
        nextCueAt: isCurrentStrummingProtocol ? normalizeUnixTimestamp(parsed.strumming?.nextCueAt) : defaults.strumming.nextCueAt,
        counts: isCurrentStrummingProtocol
          ? STUDY_STRUMMING_BPMS.reduce((result, bpm) => {
            result[bpm] = Math.max(0, Math.min(STUDY_STRUMMING_TOTAL_REPETITIONS, Number(parsed.strumming?.counts?.[bpm]) || 0));
            return result;
          }, {})
          : createDefaultStudyStrummingCounts(),
        records: isCurrentStrummingProtocol ? migrateStudyStrummingRecords(parsed.strumming?.records) : defaults.strumming.records,
      },
      settings: migrateStudySettings(parsed.settings),
      questionnaire: {
        ...defaults.questionnaire,
        ...(parsed.questionnaire || {}),
        responses: {
          ...migrateStudyQuestionnaireResponses(parsed.questionnaire && parsed.questionnaire.responses),
        },
      },
      strummingQuestionnaire: {
        ...defaults.strummingQuestionnaire,
        ...(parsed.strummingQuestionnaire || {}),
        responses: {
          ...migrateStudyQuestionnaireResponses(
            parsed.strummingQuestionnaire && parsed.strummingQuestionnaire.responses,
            STUDY_STRUMMING_QUESTIONNAIRE_IDS,
            {},
          ),
        },
      },
    };
    state.study.currentStep = Math.max(0, Math.min(STUDY_TOTAL_STEPS - 1, Number(state.study.currentStep) || 0));
    state.study.strumming.totalBeats = getStudyCompletedStudyStrummingCount(state.study.strumming, state.study.strumming.sequence);
    const answeredStrummingQuestionnaireItems = STUDY_STRUMMING_QUESTIONNAIRE_IDS
      .filter((questionId) => state.study.strummingQuestionnaire.responses[questionId]).length;
    if (!state.study.strumming.completed || answeredStrummingQuestionnaireItems < STUDY_STRUMMING_QUESTIONNAIRE_IDS.length) {
      state.study.completed = false;
      state.study.completedAt = '';
    }
    state.study.calibration.running = false;
    state.study.experiment.running = false;
    state.study.effort.running = false;
    state.study.strumming.running = false;
  } catch (_) {
    state.study = defaults;
  }
}

function persistStudyState() {
  try {
    window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state.study));
  } catch (_) {
    // Ignore storage errors and keep the flow usable.
  }
}

function populateStudyForm() {
  const { participant, familiarization, questionnaire, strummingQuestionnaire } = state.study;
  ui.studyName.value = participant.name;
  ui.studyAge.value = participant.age;
  ui.studyGender.value = participant.gender;
  ui.studyHandedness.value = participant.handedness;
  ui.studyExperienceYears.value = participant.experienceYears;
  ui.studyPracticeTime.value = participant.practiceTime;
  applyStudyParticipantRangeValue(ui.studyOpenChordProficiency, participant.openChordProficiency);
  ui.studyPlayStyle.value = participant.playStyle;
  ui.studyChordC.checked = Boolean(familiarization.C);
  ui.studyChordEm.checked = Boolean(familiarization.Em);
  ui.studyChordD.checked = Boolean(familiarization.D);
  ui.studyChordG.checked = Boolean(familiarization.G);
  ui.studyFamiliarizationNotes.value = familiarization.notes;
  ui.studyFamiliarizationReady.checked = Boolean(familiarization.ready);
  getStudyQuestionnaireInputs(STUDY_POST_QUESTIONNAIRE_GROUP).forEach((input) => {
    const questionId = input.dataset.studyQuestion;
    applyStudyQuestionnaireResponse(input, questionId ? questionnaire.responses[questionId] : '');
  });
  getStudyQuestionnaireInputs(STUDY_STRUMMING_QUESTIONNAIRE_GROUP).forEach((input) => {
    const questionId = input.dataset.studyQuestion;
    applyStudyQuestionnaireResponse(input, questionId ? strummingQuestionnaire.responses[questionId] : '');
  });
}

function handleStudyPhaseDurationInput(event) {
  const input = event.currentTarget;
  const groupKey = input.dataset.studyPhaseGroup;
  const phaseKey = input.dataset.studyPhaseKey;
  if (!groupKey || !phaseKey || !state.study.settings?.phaseDurationsMs?.[groupKey]) return;

  if (state.study[groupKey]?.running) {
    rerenderStudyPhaseGroup(groupKey);
    return;
  }

  const seconds = Number(input.value);
  const nextDurationMs = Number.isFinite(seconds)
    ? Math.max(STUDY_PHASE_DURATION_MIN_MS, Math.round(seconds * 1000))
    : getStudyPhaseDurationMs(groupKey, phaseKey);

  state.study.settings.phaseDurationsMs[groupKey][phaseKey] = nextDurationMs;
  persistStudyState();
  rerenderStudyPhaseGroup(groupKey);
}

function rerenderStudyPhaseGroup(groupKey) {
  if (groupKey === 'calibration') {
    renderStudyCalibration();
    return;
  }
  if (groupKey === 'experiment') {
    renderStudyExperiment();
    return;
  }
  renderStudyEffort();
}

function renderStudyPhaseSettings(groupKey, phases, isRunning) {
  document.querySelectorAll('[data-study-phase-duration-input]').forEach((input) => {
    if (input.dataset.studyPhaseGroup !== groupKey) return;
    const phase = phases.find((item) => item.key === input.dataset.studyPhaseKey);
    if (!phase) return;
    input.value = formatStudyDurationInputValue(phase.durationMs);
    input.disabled = isRunning;
  });

  document.querySelectorAll('[data-study-phase-duration-label]').forEach((label) => {
    if (label.dataset.studyPhaseGroup !== groupKey) return;
    const phase = phases.find((item) => item.key === label.dataset.studyPhaseKey);
    if (!phase) return;
    label.textContent = formatStudyDurationLabel(phase.durationMs);
  });

  document.querySelectorAll('[data-study-phase-chip-label]').forEach((chip) => {
    if (chip.dataset.studyPhaseGroup !== groupKey) return;
    const phase = phases.find((item) => item.key === chip.dataset.studyPhaseKey);
    if (!phase) return;
    chip.textContent = `${chip.dataset.studyPhaseChipLabel} · ${formatStudyDurationLabel(phase.durationMs)}`;
  });

  if (groupKey === 'calibration') {
    const playDurationMs = phases.find((phase) => phase.key === 'PLAY')?.durationMs || 0;
    const restDurationMs = phases.find((phase) => phase.key === 'REST')?.durationMs || 0;
    const totalDurationMs = Math.max(1, playDurationMs + restDurationMs);
    const horizontalThreshold = document.getElementById('studyCalibrationThreshold');
    const verticalThreshold = document.getElementById('studyCalibrationLiveThreshold');
    const liveCaption = document.getElementById('studyCalibrationLiveCaption');

    if (horizontalThreshold) {
      horizontalThreshold.style.left = `${(playDurationMs / totalDurationMs) * 100}%`;
    }
    if (verticalThreshold) {
      verticalThreshold.style.top = `${(playDurationMs / totalDurationMs) * 100}%`;
    }
    if (liveCaption) {
      liveCaption.textContent = `Play ${formatStudyDurationLabel(playDurationMs)}, then rest ${formatStudyDurationLabel(restDurationMs)}`;
    }
  }

  if (groupKey === 'effort') {
    const activeDurationMs = phases
      .filter((phase) => phase.key !== 'REST')
      .reduce((sum, phase) => sum + phase.durationMs, 0);
    const restDurationMs = phases.find((phase) => phase.key === 'REST')?.durationMs || 0;
    const activeLabel = document.getElementById('studyEffortTrialDurationSummary');
    const restLabel = document.getElementById('studyEffortRestDurationSummary');

    if (activeLabel) {
      activeLabel.textContent = formatStudyDurationLabel(activeDurationMs);
    }
    if (restLabel) {
      restLabel.textContent = formatStudyDurationLabel(restDurationMs);
    }
  }
}

function syncStudyStateFromForm() {
  state.study.participant = {
    name: ui.studyName.value.trim(),
    age: ui.studyAge.value,
    gender: ui.studyGender.value,
    handedness: ui.studyHandedness.value,
    experienceYears: ui.studyExperienceYears.value,
    practiceTime: ui.studyPracticeTime.value,
    openChordProficiency: readStudyParticipantRangeValue(ui.studyOpenChordProficiency),
    playStyle: ui.studyPlayStyle.value,
  };

  state.study.familiarization = {
    C: ui.studyChordC.checked,
    Em: ui.studyChordEm.checked,
    D: ui.studyChordD.checked,
    G: ui.studyChordG.checked,
    notes: ui.studyFamiliarizationNotes.value.trim(),
    ready: ui.studyFamiliarizationReady.checked,
  };

  state.study.questionnaire = {
    responses: readStudyQuestionnaireResponses(STUDY_QUESTIONNAIRE_IDS, STUDY_POST_QUESTIONNAIRE_GROUP),
  };

  state.study.strummingQuestionnaire = {
    responses: readStudyQuestionnaireResponses(STUDY_STRUMMING_QUESTIONNAIRE_IDS, STUDY_STRUMMING_QUESTIONNAIRE_GROUP),
  };

  if (state.study.completed) {
    state.study.completed = false;
    state.study.completedAt = '';
  }

  persistStudyState();
}

function getStudyParticipantFieldConfigs() {
  return [
    {
      key: 'name',
      input: ui.studyName,
      getValue: () => state.study.participant.name,
      isComplete: (value) => Boolean(value),
      isValid: (value) => Boolean(value),
      pendingMessage: 'Use the participant alias or session identifier used for this study.',
      validMessage: 'Participant name recorded.',
      invalidMessage: 'Participant name is required.',
    },
    {
      key: 'age',
      input: ui.studyAge,
      getValue: () => state.study.participant.age,
      isComplete: (value) => String(value).trim() !== '',
      isValid: (value) => isPositiveNumber(value, { allowZero: false }),
      pendingMessage: 'Enter the participant age in whole years.',
      validMessage: 'Age recorded.',
      invalidMessage: 'Enter a valid age greater than 0.',
    },
    {
      key: 'gender',
      input: ui.studyGender,
      getValue: () => state.study.participant.gender,
      isComplete: (value) => Boolean(value),
      isValid: (value) => Boolean(value),
      pendingMessage: 'Choose the participant response exactly as reported.',
      validMessage: 'Gender recorded.',
      invalidMessage: 'Select the participant gender.',
    },
    {
      key: 'handedness',
      input: ui.studyHandedness,
      getValue: () => state.study.participant.handedness,
      isComplete: (value) => Boolean(value),
      isValid: (value) => Boolean(value),
      pendingMessage: 'This helps interpret posture and fretting strategy later.',
      validMessage: 'Handedness recorded.',
      invalidMessage: 'Select the participant handedness.',
    },
    {
      key: 'experienceYears',
      input: ui.studyExperienceYears,
      getValue: () => state.study.participant.experienceYears,
      isComplete: (value) => String(value).trim() !== '',
      isValid: (value) => isPositiveNumber(value, { allowZero: true }),
      pendingMessage: 'Use 0 for beginners with no prior guitar experience.',
      validMessage: 'Guitar experience recorded.',
      invalidMessage: 'Enter valid years of guitar experience.',
    },
    {
      key: 'practiceTime',
      input: ui.studyPracticeTime,
      getValue: () => state.study.participant.practiceTime,
      isComplete: (value) => String(value).trim() !== '',
      isValid: (value) => isPositiveNumber(value, { allowZero: true }),
      pendingMessage: 'Estimate typical practice time over a recent week.',
      validMessage: 'Weekly practice time recorded.',
      invalidMessage: 'Enter a valid weekly practice time.',
    },
    {
      key: 'openChordProficiency',
      input: ui.studyOpenChordProficiency,
      getValue: () => state.study.participant.openChordProficiency,
      isComplete: (value) => String(value).trim() !== '',
      isValid: (value) => isStudyPercentageValue(value),
      pendingMessage: 'Ask the participant to rate open-chord proficiency from 0 to 100.',
      validMessage: 'Open-chord proficiency recorded.',
      invalidMessage: 'Rate open-chord proficiency from 0 to 100.',
    },
    {
      key: 'playStyle',
      input: ui.studyPlayStyle,
      getValue: () => state.study.participant.playStyle,
      isComplete: (value) => Boolean(value),
      isValid: (value) => Boolean(value),
      pendingMessage: 'Choose the participant’s default playing approach.',
      validMessage: 'Usual playing style recorded.',
      invalidMessage: 'Select the usual playing style.',
    },
  ];
}

function getStudyFieldContainer(fieldKey) {
  return document.querySelector(`[data-study-field="${fieldKey}"]`);
}

function getStudyFieldHint(fieldKey) {
  const hintId = `study${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}Hint`;
  return document.getElementById(hintId);
}

function setStudyFieldState(fieldKey, stateKey, message) {
  const container = getStudyFieldContainer(fieldKey);
  const hint = getStudyFieldHint(fieldKey);
  const input = container?.querySelector('input, select, textarea');
  if (!container) return;

  container.classList.toggle('is-valid', stateKey === 'valid');
  container.classList.toggle('is-invalid', stateKey === 'invalid');
  container.classList.toggle('is-pending', stateKey === 'pending');
  if (input) {
    input.setAttribute('aria-invalid', String(stateKey === 'invalid'));
  }
  if (hint && message) {
    hint.textContent = message;
  }
}

function setStudyCardState(chord, stateKey) {
  const card = document.querySelector(`[data-study-chord="${chord}"]`);
  if (!card) return;
  card.classList.toggle('is-valid', stateKey === 'valid');
  card.classList.toggle('is-invalid', stateKey === 'invalid');
  card.classList.toggle('is-pending', stateKey === 'pending');
}

function renderStudyParticipantStatus(showErrors = false) {
  const fieldConfigs = getStudyParticipantFieldConfigs();
  const completionCount = fieldConfigs.reduce((count, config) => (
    count + (config.isValid(config.getValue()) ? 1 : 0)
  ), 0);

  fieldConfigs.forEach((config) => {
    const value = config.getValue();
    const complete = config.isComplete(value);
    const valid = config.isValid(value);
    const stateKey = showErrors && !valid ? 'invalid' : valid ? 'valid' : 'pending';
    const message = stateKey === 'invalid'
      ? config.invalidMessage
      : stateKey === 'valid'
        ? config.validMessage
        : config.pendingMessage;
    setStudyFieldState(config.key, stateKey, message);
  });

  if (ui.studyParticipantCompletion) {
    ui.studyParticipantCompletion.textContent = `${completionCount} / ${fieldConfigs.length} complete`;
  }
  if (ui.studyParticipantCompletionBar) {
    ui.studyParticipantCompletionBar.style.width = `${(completionCount / fieldConfigs.length) * 100}%`;
  }
  if (ui.studyParticipantSummary) {
    ui.studyParticipantSummary.textContent = completionCount === fieldConfigs.length
      ? 'Participant profile is ready. Continue to chord familiarization when you are satisfied with the entries.'
      : `${fieldConfigs.length - completionCount} required field${fieldConfigs.length - completionCount === 1 ? '' : 's'} still need attention before you can continue.`;
  }
}

function renderStudyFamiliarizationStatus(showErrors = false) {
  const familiarization = state.study.familiarization;
  const chordKeys = ['C', 'Em', 'D', 'G'];
  const completeCount = chordKeys.reduce((count, chord) => count + (familiarization[chord] ? 1 : 0), 0);

  chordKeys.forEach((chord) => {
    const stateKey = showErrors && !familiarization[chord]
      ? 'invalid'
      : familiarization[chord]
        ? 'valid'
        : 'pending';
    setStudyCardState(chord, stateKey);
  });

  const readyState = showErrors && !familiarization.ready
    ? 'invalid'
    : familiarization.ready
      ? 'valid'
      : 'pending';
  const readyMessage = readyState === 'invalid'
    ? 'Confirm readiness after all four chord cards have been checked.'
    : readyState === 'valid'
      ? 'The participant is marked as ready to continue.'
      : 'Confirm readiness after all four chord cards above have been checked.';
  const readyContainer = getStudyFieldContainer('familiarization-ready');
  const readyHint = document.getElementById('studyFamiliarizationReadyHint');
  readyContainer?.classList.toggle('is-valid', readyState === 'valid');
  readyContainer?.classList.toggle('is-invalid', readyState === 'invalid');
  readyContainer?.classList.toggle('is-pending', readyState === 'pending');
  if (readyHint) readyHint.textContent = readyMessage;

  if (ui.studyFamiliarizationProgress) {
    ui.studyFamiliarizationProgress.textContent = `${completeCount} / ${chordKeys.length} chords confirmed`;
  }
  if (ui.studyFamiliarizationProgressBar) {
    ui.studyFamiliarizationProgressBar.style.width = `${(completeCount / chordKeys.length) * 100}%`;
  }
  if (ui.studyFamiliarizationSummary) {
    if (completeCount === chordKeys.length && familiarization.ready) {
      ui.studyFamiliarizationSummary.textContent = 'Familiarization is complete. You can proceed to calibration.';
    } else if (completeCount < chordKeys.length) {
      ui.studyFamiliarizationSummary.textContent = `${chordKeys.length - completeCount} chord${chordKeys.length - completeCount === 1 ? '' : 's'} still need facilitator confirmation before the participant can continue.`;
    } else {
      ui.studyFamiliarizationSummary.textContent = 'All four chords are confirmed. Mark readiness to unlock calibration.';
    }
  }
}

function renderStudyOnboardingStatus() {
  const completedSteps = state.study.completed ? STUDY_TOTAL_STEPS : Math.max(0, state.study.currentStep);
  if (ui.studySidebarStatus) {
    ui.studySidebarStatus.textContent = `${completedSteps} of ${STUDY_TOTAL_STEPS} steps complete`;
  }
  if (ui.studySidebarHint) {
    ui.studySidebarHint.textContent = STUDY_STEP_HINTS[state.study.currentStep] || '';
  }
  if (ui.studyFooterProgress) {
    ui.studyFooterProgress.textContent = STUDY_STEP_TITLES[state.study.currentStep] || 'Study step';
  }

  renderStudyParticipantStatus(state.study.currentStep === 0 && studyUiState.validationStep === 0);
  renderStudyFamiliarizationStatus(state.study.currentStep === 1 && studyUiState.validationStep === 1);
}

function focusStudyField(fieldKey) {
  const chordFieldMap = {
    C: ui.studyChordC,
    Em: ui.studyChordEm,
    D: ui.studyChordD,
    G: ui.studyChordG,
    'familiarization-ready': ui.studyFamiliarizationReady,
  };
  const target = chordFieldMap[fieldKey]
    || getStudyParticipantFieldConfigs().find((config) => config.key === fieldKey)?.input
    || getStudyFieldContainer(fieldKey)?.querySelector('input, select, textarea');
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => target.focus(), 120);
}

function failStudyValidation(message, fieldKey) {
  studyUiState.validationStep = state.study.currentStep;
  setStudyMessage(message, true);
  renderStudyOnboardingStatus();
  if (fieldKey) focusStudyField(fieldKey);
  return false;
}

function handleStudyNext() {
  syncStudyStateFromForm();
  const isValid = validateStudyStep(state.study.currentStep);
  if (!isValid) return;

  studyUiState.validationStep = -1;

  if (state.study.currentStep < STUDY_TOTAL_STEPS - 1) {
    state.study.currentStep += 1;
    persistStudyState();
    clearStudyMessage();
    renderStudyStep();
    renderStudySummary();
    renderStudyCalibration();
    renderStudyExperiment();
    renderStudyEffort();
    renderStudyStrumming();
    return;
  }

  state.study.completed = true;
  state.study.completedAt = new Date().toISOString();
  persistStudyState();
  renderStudySummary();
  renderStudyStep();
  renderStudyCalibration();
  renderStudyExperiment();
  renderStudyEffort();
  renderStudyStrumming();
  setStudyMessage('Study guide completed. Participant information and progress were saved in this browser.', false);
}

function goToPreviousStudyStep() {
  if (state.study.currentStep === 0) return;
  syncStudyStateFromForm();
  studyUiState.validationStep = -1;
  state.study.currentStep -= 1;
  persistStudyState();
  clearStudyMessage();
  renderStudyStep();
  renderStudySummary();
  renderStudyCalibration();
  renderStudyExperiment();
  renderStudyEffort();
  renderStudyStrumming();
}

function validateStudyStep(stepIndex) {
  if (stepIndex === 0) {
    const { participant } = state.study;
    if (!participant.name) return failStudyValidation('Please enter the participant name.', 'name');
    if (!isPositiveNumber(participant.age, { allowZero: false })) return failStudyValidation('Please enter a valid age.', 'age');
    if (!participant.gender) return failStudyValidation('Please select the participant gender.', 'gender');
    if (!participant.handedness) return failStudyValidation('Please select the participant handedness.', 'handedness');
    if (!isPositiveNumber(participant.experienceYears, { allowZero: true })) {
      return failStudyValidation('Please enter valid years of guitar experience.', 'experienceYears');
    }
    if (!isPositiveNumber(participant.practiceTime, { allowZero: true })) {
      return failStudyValidation('Please enter a valid weekly practice time.', 'practiceTime');
    }
    if (!isStudyPercentageValue(participant.openChordProficiency)) {
      return failStudyValidation('Please rate open-chord proficiency from 0 to 100.', 'openChordProficiency');
    }
    if (!participant.playStyle) return failStudyValidation('Please select the usual playing style.', 'playStyle');
    return true;
  }

  if (stepIndex === 1) {
    const { familiarization } = state.study;
    const missingChord = ['C', 'Em', 'D', 'G'].find((chord) => !familiarization[chord]);
    if (missingChord) {
      return failStudyValidation('Please confirm practice for chords C, Em, D, and G.', missingChord);
    }
    if (!familiarization.ready) {
      return failStudyValidation('Please confirm that the participant is ready to continue.', 'familiarization-ready');
    }
    return true;
  }

  if (stepIndex === 2) {
    if (!state.study.calibration.completed) {
      return setStudyMessage('Please finish the calibration session before starting the chord experiment.', true);
    }
    return true;
  }

  if (stepIndex === 3) {
    if (!state.study.experiment.completed) {
      return setStudyMessage('Please finish the chord Form–Hold–Release experiment before starting the effort manipulation session.', true);
    }
    return true;
  }

  if (stepIndex === 4) {
    if (!state.study.effort.completed) {
      return setStudyMessage('Please finish the Effort Manipulation session before starting the post-study questionnaire.', true);
    }
    return true;
  }

  if (stepIndex === 5) {
    const missingQuestionId = STUDY_QUESTIONNAIRE_IDS.find((questionId) => !state.study.questionnaire.responses[questionId]);
    if (missingQuestionId) {
      return setStudyMessage(`Please answer ${missingQuestionId} in the post-study questionnaire.`, true);
    }
    return true;
  }

  if (stepIndex === 6) {
    if (!state.study.strumming.completed) {
      return setStudyMessage('Please finish the strumming speed experiment before starting the post-strumming questionnaire.', true);
    }
    return true;
  }

  if (stepIndex === 7) {
    const missingQuestionId = STUDY_STRUMMING_QUESTIONNAIRE_IDS.find((questionId) => !state.study.strummingQuestionnaire.responses[questionId]);
    if (missingQuestionId) {
      return setStudyMessage(`Please answer ${missingQuestionId} in the post-strumming questionnaire.`, true);
    }
    return true;
  }

  return true;
}

function renderStudyStep() {
  const steps = [...document.querySelectorAll('[data-study-step]')];
  steps.forEach((step) => {
    const index = Number(step.dataset.studyStep);
    const isActive = index === state.study.currentStep;
    step.hidden = !isActive;
  });

  const indicators = [...document.querySelectorAll('[data-step-indicator]')];
  indicators.forEach((item) => {
    const index = Number(item.dataset.stepIndicator);
    item.classList.toggle('active', index === state.study.currentStep);
    item.classList.toggle('complete', index < state.study.currentStep || (state.study.completed && index < STUDY_TOTAL_STEPS));
    if (index === state.study.currentStep) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  ui.studyProgressText.textContent = `Step ${state.study.currentStep + 1} of ${STUDY_TOTAL_STEPS}`;
  ui.studyPrev.disabled = state.study.currentStep === 0;
  ui.studyNext.textContent = state.study.currentStep === STUDY_TOTAL_STEPS - 1 ? 'Finish study guide' : 'Next step';
  renderStudyOnboardingStatus();
  renderStudyCalibration();
  renderStudyExperiment();
  renderStudyEffort();
  renderStudyStrumming();
}

function renderStudySummary() {
  if (!state.study.completed) {
    ui.studySummary.hidden = true;
    ui.studySummary.innerHTML = '';
    return;
  }

  const {
    participant,
    familiarization,
    calibration,
    experiment,
    effort,
    strumming,
    questionnaire,
    strummingQuestionnaire,
  } = state.study;
  const answeredQuestions = STUDY_QUESTIONNAIRE_IDS.filter((questionId) => questionnaire.responses[questionId]).length;
  const answeredStrummingQuestions = STUDY_STRUMMING_QUESTIONNAIRE_IDS
    .filter((questionId) => strummingQuestionnaire.responses[questionId]).length;
  ui.studySummary.hidden = false;
  ui.studySummary.innerHTML = [
    '<strong>Study setup complete.</strong>',
    `Participant: ${escapeHtml(participant.name)} · Age: ${escapeHtml(participant.age)} · ${escapeHtml(participant.handedness)}`,
    `Experience: ${escapeHtml(participant.experienceYears)} years · Weekly practice: ${escapeHtml(participant.practiceTime)} hours · Open-chord proficiency: ${escapeHtml(participant.openChordProficiency)}/100 · Style: ${escapeHtml(participant.playStyle)}`,
    `Familiarization complete for chords: C, Em, D, G${familiarization.notes ? ` · Notes: ${escapeHtml(familiarization.notes)}` : ''}`,
    `Calibration complete: ${STUDY_CALIBRATION_EFFORTS.map((effort) => `${effort.shortLabel} ${calibration.counts[effort.key] || 0}/${STUDY_CHORDS.length * STUDY_CALIBRATION_ROUNDS}`).join(' · ')}`,
    `Experiment complete: ${STUDY_CHORDS.map((chord) => `${chord} ${experiment.counts[chord] || 0}/${STUDY_TRIALS_PER_CHORD}`).join(' · ')}`,
    `Effort manipulation complete: ${STUDY_CHORDS.map((chord) => `${chord} ${effort.counts[chord] || 0}/${STUDY_EFFORT_ROUNDS}`).join(' · ')}`,
    `Post-study questionnaire complete: ${answeredQuestions}/${STUDY_QUESTIONNAIRE_IDS.length} responses recorded.`,
    `Strumming speed complete${strumming.selectedChord ? ` (${escapeHtml(strumming.selectedChord)} fretted)` : ''}: ${STUDY_STRUMMING_BPMS.map((bpm) => `${bpm} BPM ${strumming.counts[bpm] || 0}/${STUDY_STRUMMING_TOTAL_REPETITIONS}`).join(' · ')}`,
    `Post-strumming questionnaire complete: ${answeredStrummingQuestions}/${STUDY_STRUMMING_QUESTIONNAIRE_IDS.length} responses recorded.`,
  ].join('<br>');
}

function renderStudyCalibration() {
  if (!ui.studyCalibrationStatus) return;

  const calibration = state.study.calibration;
  const phases = getStudyCalibrationPhases();
  const totalTrials = STUDY_CHORDS.length * STUDY_CALIBRATION_EFFORTS.length * STUDY_CALIBRATION_ROUNDS;
  const completedTrials = STUDY_CALIBRATION_EFFORTS.reduce((sum, effort) => sum + (calibration.counts[effort.key] || 0), 0);
  const activePromptNumber = calibration.running && calibration.currentTrialIndex >= 0
    ? calibration.currentTrialIndex + 1
    : completedTrials;
  const effortMeta = getStudyCalibrationEffortMeta(calibration.currentEffort);
  const effortToken = toStudyCalibrationEffortToken(calibration.currentEffort);
  const phaseToken = toStudyCalibrationPhaseToken(calibration.currentPhase);
  const timeLeftMs = getStudyCalibrationPromptTimeLeftMs();
  const totalPromptDurationMs = getStudyCalibrationTotalPromptDurationMs();
  const countdownProgress = getStudyCalibrationPromptProgress(timeLeftMs, totalPromptDurationMs);
  const playProgress = getStudyCalibrationPlayProgress();
  const restProgress = getStudyCalibrationRestProgress();
  const phaseSegment = getStudyCalibrationPhaseSegmentState(totalPromptDurationMs);
  renderStudyPhaseSettings('calibration', phases, calibration.running);
  renderStudyCalibrationChordStrip(playProgress, phaseToken, restProgress);

  ui.studyCalibrationStatus.textContent = calibration.completed
    ? 'Completed'
    : calibration.running
      ? 'Running'
      : 'Ready';
  ui.studyCalibrationTrial.textContent = `${Math.min(activePromptNumber, totalTrials)} / ${totalTrials}`;
  ui.studyCalibrationTarget.textContent = effortMeta?.shortLabel || '—';
  ui.studyCalibrationTimer.textContent = `${formatSeconds(timeLeftMs / 1000)} s`;
  if (ui.studyCalibrationLiveTimer) {
    ui.studyCalibrationLiveTimer.textContent = `${formatSeconds(timeLeftMs / 1000)} s`;
  }
  if (ui.studyCalibrationChord) {
    ui.studyCalibrationChord.textContent = calibration.currentChord || '—';
  }
  if (ui.studyCalibrationEffort) {
    ui.studyCalibrationEffort.textContent = calibration.currentPhase || 'Waiting';
    ui.studyCalibrationEffort.dataset.effort = effortToken;
    ui.studyCalibrationEffort.dataset.phase = phaseToken;
  }
  if (ui.studyCalibrationLiveCue) {
    ui.studyCalibrationLiveCue.dataset.effort = effortToken;
    ui.studyCalibrationLiveCue.dataset.phase = phaseToken;
  }
  if (ui.studyCalibrationChart) {
    renderStudyChordChart(ui.studyCalibrationChart, calibration.currentChord, {
      extraTitle: effortMeta ? `${effortMeta.shortLabel} effort` : '',
      extraText: effortMeta?.instruction || '',
    });
    ui.studyCalibrationChart.hidden = !calibration.currentChord || calibration.currentPhase === 'REST';
  }
  if (ui.studyCalibrationInstruction) {
    ui.studyCalibrationInstruction.textContent = getStudyCalibrationInstruction();
  }
  ui.studyCalibrationStart.disabled = calibration.running;
  ui.studyCalibrationStop.disabled = !calibration.running;
  if (ui.studyCalibrationStopFloating) {
    ui.studyCalibrationStopFloating.hidden = !calibration.running;
  }
  ui.studyCalibrationProgressBar.style.width = `${countdownProgress}%`;
  ui.studyCalibrationProgressBar.dataset.phase = 'base';
  ui.studyCalibrationProgressBar.setAttribute('aria-valuemin', '0');
  ui.studyCalibrationProgressBar.setAttribute('aria-valuemax', '100');
  ui.studyCalibrationProgressBar.setAttribute('aria-valuenow', String(Math.round(countdownProgress)));
  if (ui.studyCalibrationPhaseSegment) {
    ui.studyCalibrationPhaseSegment.style.left = `${phaseSegment.startPercent}%`;
    ui.studyCalibrationPhaseSegment.style.width = `${phaseSegment.sizePercent}%`;
    ui.studyCalibrationPhaseSegment.dataset.phase = phaseToken;
  }
  if (ui.studyCalibrationLiveProgressBar) {
    ui.studyCalibrationLiveProgressBar.style.height = `${countdownProgress}%`;
    ui.studyCalibrationLiveProgressBar.dataset.phase = 'base';
    ui.studyCalibrationLiveProgressBar.setAttribute('aria-valuemin', '0');
    ui.studyCalibrationLiveProgressBar.setAttribute('aria-valuemax', '100');
    ui.studyCalibrationLiveProgressBar.setAttribute('aria-valuenow', String(Math.round(countdownProgress)));
  }
  if (ui.studyCalibrationLivePhaseSegment) {
    ui.studyCalibrationLivePhaseSegment.style.top = `${phaseSegment.startPercent}%`;
    ui.studyCalibrationLivePhaseSegment.style.height = `${phaseSegment.sizePercent}%`;
    ui.studyCalibrationLivePhaseSegment.dataset.phase = phaseToken;
  }
  ui.studyCalibrationCountNormal.textContent = `${calibration.counts.normal || 0} / ${STUDY_CHORDS.length * STUDY_CALIBRATION_ROUNDS}`;
  ui.studyCalibrationChordCoverage.textContent = `${completedTrials} / ${totalTrials}`;

  if (calibration.running && calibration.sequence.length) {
    const upcoming = calibration.sequence.slice(calibration.currentTrialIndex, calibration.currentTrialIndex + 5)
      .map((item) => `${item.chord} · ${getStudyCalibrationEffortMeta(item.effort)?.shortLabel || item.effort}`);
    ui.studyCalibrationSequenceHint.textContent = `Upcoming calibration prompts: ${upcoming.join(' → ')}`;
  } else if (calibration.completed) {
    ui.studyCalibrationSequenceHint.textContent = `All ${totalTrials} calibration prompts across ${STUDY_CALIBRATION_ROUNDS} rounds are complete.`;
  } else {
    ui.studyCalibrationSequenceHint.textContent = `The chord order will be shuffled for each of the ${STUDY_CALIBRATION_ROUNDS} rounds using normal force only.`;
  }

  const shouldFocusCalibration = Boolean(
    calibration.running &&
    state.study.currentStep === 2 &&
    ui.studyCalibrationLiveCue &&
    ui.studyPage &&
    !ui.studyPage.hidden,
  );
  document.body.classList.toggle('study-calibration-focus', shouldFocusCalibration);
  if (shouldFocusCalibration) {
    document.body.classList.remove('study-experiment-focus');
    document.body.classList.remove('study-effort-focus');
  }
}

function startStudyCalibration() {
  syncStudyStateFromForm();
  if (state.study.currentStep !== 2) {
    state.study.currentStep = 2;
    renderStudyStep();
  }

  stopStudyCalibration({ resetState: false, resetMessage: false });

  state.study.calibration = {
    running: true,
    completed: false,
    sequence: createStudyCalibrationSequence(),
    currentTrialIndex: -1,
    currentChord: '',
    currentPhase: 'Waiting',
    phaseStartedAt: 0,
    currentTrialStartedAt: 0,
    currentEffort: '',
    counts: { normal: 0 },
    records: [],
    completedAt: '',
  };

  beginStudyCalibrationTrial(0);
  studyCalibrationTickHandle = window.setInterval(updateStudyCalibrationClock, 100);
  clearStudyMessage();
  persistStudyState();
  renderStudyCalibration();
}

function stopStudyCalibration(options = {}) {
  const resetState = options.resetState !== false;
  const resetMessage = options.resetMessage !== false;

  if (studyCalibrationTickHandle) {
    window.clearInterval(studyCalibrationTickHandle);
    studyCalibrationTickHandle = 0;
  }

  if (resetState) {
    state.study.calibration.running = false;
    state.study.calibration.currentChord = '';
    state.study.calibration.currentPhase = 'Stopped';
    state.study.calibration.phaseStartedAt = 0;
    state.study.calibration.currentTrialStartedAt = 0;
    state.study.calibration.currentEffort = '';
    persistStudyState();
  }

  renderStudyCalibration();
  if (resetMessage) clearStudyMessage();
}

function createStudyCalibrationSequence() {
  const sequence = [];

  for (let round = 0; round < STUDY_CALIBRATION_ROUNDS; round += 1) {
    const shuffledChords = [...STUDY_CHORDS];
    for (let index = shuffledChords.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledChords[index], shuffledChords[swapIndex]] = [shuffledChords[swapIndex], shuffledChords[index]];
    }

    sequence.push(...shuffledChords.flatMap((chord) => (
      STUDY_CALIBRATION_EFFORTS.map((effort) => ({ chord, effort: effort.key, round: round + 1 }))
    )));
  }

  return sequence;
}

function beginStudyCalibrationTrial(trialIndex) {
  const calibration = state.study.calibration;
  const trial = calibration.sequence[trialIndex];
  if (!trial) {
    finishStudyCalibration();
    return;
  }

  calibration.currentTrialIndex = trialIndex;
  calibration.currentChord = trial.chord;
  calibration.currentEffort = trial.effort;
  calibration.currentPhase = 'PLAY';
  calibration.phaseStartedAt = Date.now();
  calibration.currentTrialStartedAt = calibration.phaseStartedAt;
  calibration.running = true;
  playStudyBeep();
  persistStudyState();
  renderStudyCalibration();
}

function updateStudyCalibrationClock() {
  const calibration = state.study.calibration;
  if (!calibration.running) return;

  const phase = getStudyCalibrationPhases().find((item) => item.key === calibration.currentPhase);
  if (!phase) {
    renderStudyCalibration();
    return;
  }

  if (Date.now() - calibration.phaseStartedAt >= phase.durationMs) {
    advanceStudyCalibrationTrial();
    return;
  }

  renderStudyCalibration();
}

function advanceStudyCalibrationTrial() {
  const calibration = state.study.calibration;
  if (!calibration.running) return;

  if (calibration.currentPhase === 'PLAY') {
    const effortKey = calibration.currentEffort;
    const trial = calibration.sequence[calibration.currentTrialIndex];
    const endedAt = Date.now();
    if (effortKey) {
      calibration.counts[effortKey] = (calibration.counts[effortKey] || 0) + 1;
    }
    if (trial) {
      calibration.records.push({
        trialIndex: calibration.currentTrialIndex,
        round: trial.round,
        chord: trial.chord,
        effort: effortKey,
        startedAt: calibration.currentTrialStartedAt,
        endedAt,
        durationMs: Math.max(0, endedAt - calibration.currentTrialStartedAt),
      });
    }

    const nextTrialIndex = calibration.currentTrialIndex + 1;
    if (nextTrialIndex >= calibration.sequence.length) {
      finishStudyCalibration();
      return;
    }

    calibration.currentPhase = 'REST';
    calibration.phaseStartedAt = Date.now();
    calibration.currentTrialStartedAt = 0;
    calibration.currentEffort = 'idle';
    calibration.currentChord = '';
    persistStudyState();
    renderStudyCalibration();
    return;
  }

  beginStudyCalibrationTrial(calibration.currentTrialIndex + 1);
}

function finishStudyCalibration() {
  if (studyCalibrationTickHandle) {
    window.clearInterval(studyCalibrationTickHandle);
    studyCalibrationTickHandle = 0;
  }

  state.study.calibration.running = false;
  state.study.calibration.completed = true;
  state.study.calibration.completedAt = new Date().toISOString();
  state.study.calibration.currentChord = '';
  state.study.calibration.currentPhase = 'Completed';
  state.study.calibration.phaseStartedAt = 0;
  state.study.calibration.currentTrialStartedAt = 0;
  state.study.calibration.currentEffort = 'completed';
  persistStudyState();
  renderStudyCalibration();
  setStudyMessage('Calibration session completed. You can continue to the chord experiment.', false);
}

function getStudyCalibrationInstruction() {
  const calibration = state.study.calibration;
  const playDurationMs = getStudyPhaseDurationMs('calibration', 'PLAY');
  const restDurationMs = getStudyPhaseDurationMs('calibration', 'REST');
  if (calibration.completed) return 'Calibration is complete. Continue to the next study step.';
  if (!calibration.running) return 'Press start to begin the randomized calibration sequence.';

  if (calibration.currentPhase === 'REST') return `Rest for ${formatStudyDurationLabel(restDurationMs)} before the next calibration chord starts automatically.`;

  const effortMeta = getStudyCalibrationEffortMeta(calibration.currentEffort);
  if (!effortMeta || !calibration.currentChord) return 'Preparing calibration prompt.';
  return `Play ${calibration.currentChord} with ${effortMeta.label.toLowerCase()} for ${formatStudyDurationLabel(playDurationMs)}. ${effortMeta.instruction}`;
}

function getStudyCalibrationTimeLeftMs() {
  const calibration = state.study.calibration;
  if (!calibration.running) return 0;
  const phase = getStudyCalibrationPhases().find((item) => item.key === calibration.currentPhase);
  if (!phase) return 0;
  return Math.max(0, phase.durationMs - (Date.now() - calibration.phaseStartedAt));
}

function getStudyCalibrationTotalPromptDurationMs() {
  return getStudyCalibrationPhases().reduce((sum, phase) => sum + phase.durationMs, 0);
}

function getStudyCalibrationPromptTimeLeftMs() {
  const calibration = state.study.calibration;
  if (!calibration.running) return 0;
  return getStudyCalibrationTimeLeftMs() + getStudyRemainingFutureCalibrationPhaseDurationMs(calibration.currentPhase);
}

function getStudyCalibrationPhaseDurationMs() {
  const calibration = state.study.calibration;
  if (!calibration.running) return 0;
  return getStudyCalibrationPhases().find((item) => item.key === calibration.currentPhase)?.durationMs || 0;
}

function getStudyRemainingFutureCalibrationPhaseDurationMs(currentPhase) {
  const phases = getStudyCalibrationPhases();
  const currentIndex = phases.findIndex((item) => item.key === currentPhase);
  if (currentIndex < 0) return 0;
  return phases.slice(currentIndex + 1).reduce((sum, phase) => sum + phase.durationMs, 0);
}

function getStudyCalibrationPromptProgress(timeLeftMs, totalPromptDurationMs) {
  const calibration = state.study.calibration;
  if (calibration.completed) return 100;
  if (!calibration.running || totalPromptDurationMs <= 0) return 0;
  return Math.max(0, Math.min(100, ((totalPromptDurationMs - timeLeftMs) / totalPromptDurationMs) * 100));
}

function getStudyCalibrationPhaseSegmentState(totalPromptDurationMs) {
  const calibration = state.study.calibration;
  const phases = getStudyCalibrationPhases();
  if (!calibration.running || totalPromptDurationMs <= 0) {
    return {
      startPercent: 0,
      sizePercent: 0,
    };
  }

  const currentPhaseIndex = phases.findIndex((item) => item.key === calibration.currentPhase);
  if (currentPhaseIndex < 0) {
    return {
      startPercent: 0,
      sizePercent: 0,
    };
  }

  const phase = phases[currentPhaseIndex];
  const phaseStartMs = phases
    .slice(0, currentPhaseIndex)
    .reduce((sum, item) => sum + item.durationMs, 0);
  const elapsedInPhaseMs = Math.max(0, Math.min(phase.durationMs, Date.now() - calibration.phaseStartedAt));

  return {
    startPercent: (phaseStartMs / totalPromptDurationMs) * 100,
    sizePercent: (elapsedInPhaseMs / totalPromptDurationMs) * 100,
  };
}

function toStudyCalibrationPhaseToken(phaseName) {
  const normalized = String(phaseName || '').trim().toLowerCase();
  if (normalized === 'play') return 'form';
  if (normalized === 'rest') return 'rest';
  if (normalized === 'completed') return 'completed';
  return 'idle';
}

function getStudyCalibrationEffortMeta(effortKey) {
  return STUDY_CALIBRATION_EFFORTS.find((item) => item.key === effortKey) || null;
}

function toStudyCalibrationEffortToken(effortKey) {
  if (effortKey === 'normal') return 'normal';
  if (effortKey === 'completed') return 'completed';
  return 'idle';
}

function renderStudyExperiment() {
  const experiment = state.study.experiment;
  const phases = getStudyExperimentPhases();
  const totalTrials = STUDY_CHORDS.length * STUDY_TRIALS_PER_CHORD;
  const completedTrials = STUDY_CHORDS.reduce((sum, chord) => sum + (experiment.counts[chord] || 0), 0);
  const activeTrialNumber = experiment.running && experiment.currentTrialIndex >= 0
    ? experiment.currentTrialIndex + 1
    : completedTrials;
  const display = getStudyExperimentDisplayState();
  const timeLeftMs = getStudyExperimentTimeLeftMs();
  const totalTrialDurationMs = getStudyTotalTrialDurationMs();
  const phaseToken = toStudyPhaseToken(experiment.currentPhase);
  const trialProgress = getStudyExperimentTrialProgress(timeLeftMs, totalTrialDurationMs);
  const chordProgress = getStudyExperimentChordProgress();
  const restProgress = getStudyExperimentRestProgress();
  const phaseSegment = getStudyExperimentPhaseSegmentState(totalTrialDurationMs);
  renderStudyPhaseSettings('experiment', phases, experiment.running);
  renderStudyExperimentChordStrip(chordProgress, phaseToken, restProgress);

  ui.studyExperimentStatus.textContent = experiment.completed
    ? 'Completed'
    : experiment.running
      ? 'Running'
      : 'Ready';
  ui.studyExperimentTrial.textContent = `${Math.min(activeTrialNumber, totalTrials)} / ${totalTrials}`;
  if (ui.studyExperimentChord) {
    ui.studyExperimentChord.textContent = display.title;
  }
  if (ui.studyExperimentNextChord) {
    ui.studyExperimentNextChord.textContent = getUpcomingStudyExperimentChord();
    ui.studyExperimentNextChord.parentElement.hidden = !shouldShowUpcomingStudyExperimentChord();
  }
  if (ui.studyExperimentChart) {
    ui.studyExperimentChart.hidden = !display.showChart;
    renderStudyExperimentChart(display.chartChord);
  }
  if (ui.studyExperimentPhase) {
    ui.studyExperimentPhase.textContent = experiment.currentPhase || 'Waiting';
  }
  if (ui.studyExperimentPhase) ui.studyExperimentPhase.dataset.phase = phaseToken;
  if (ui.studyExperimentLiveCue) ui.studyExperimentLiveCue.dataset.phase = phaseToken;
  ui.studyExperimentTimer.textContent = `${formatSeconds(timeLeftMs / 1000)} s`;
  if (ui.studyExperimentLiveTimer) {
    ui.studyExperimentLiveTimer.textContent = `${formatSeconds(timeLeftMs / 1000)} s`;
  }
  if (ui.studyExperimentInstruction) {
    ui.studyExperimentInstruction.textContent = getStudyExperimentInstruction();
  }
  ui.studyExperimentStart.disabled = experiment.running;
  ui.studyExperimentStop.disabled = !experiment.running;
  if (ui.studyExperimentFullscreenFloating) {
    ui.studyExperimentFullscreenFloating.hidden = !experiment.running;
  }
  if (ui.studyExperimentStopFloating) {
    ui.studyExperimentStopFloating.hidden = !experiment.running;
  }
  ui.studyExperimentProgressBar.style.width = `${trialProgress}%`;
  ui.studyExperimentProgressBar.dataset.phase = 'base';
  if (ui.studyExperimentPhaseSegment) {
    ui.studyExperimentPhaseSegment.style.left = `${phaseSegment.startPercent}%`;
    ui.studyExperimentPhaseSegment.style.width = `${phaseSegment.sizePercent}%`;
    ui.studyExperimentPhaseSegment.dataset.phase = phaseToken;
  }
  if (ui.studyExperimentLiveProgressBar) {
    ui.studyExperimentLiveProgressBar.style.height = `${trialProgress}%`;
    ui.studyExperimentLiveProgressBar.dataset.phase = 'base';
  }
  if (ui.studyExperimentLivePhaseSegment) {
    ui.studyExperimentLivePhaseSegment.style.top = `${phaseSegment.startPercent}%`;
    ui.studyExperimentLivePhaseSegment.style.height = `${phaseSegment.sizePercent}%`;
    ui.studyExperimentLivePhaseSegment.dataset.phase = phaseToken;
  }
  renderStudyExperimentTimeline();

  ui.studyCountC.textContent = `${experiment.counts.C || 0} / ${STUDY_TRIALS_PER_CHORD}`;
  ui.studyCountEm.textContent = `${experiment.counts.Em || 0} / ${STUDY_TRIALS_PER_CHORD}`;
  ui.studyCountD.textContent = `${experiment.counts.D || 0} / ${STUDY_TRIALS_PER_CHORD}`;
  ui.studyCountG.textContent = `${experiment.counts.G || 0} / ${STUDY_TRIALS_PER_CHORD}`;

  if (experiment.running && experiment.sequence.length) {
    const upcoming = experiment.sequence.slice(experiment.currentTrialIndex, experiment.currentTrialIndex + 6);
    ui.studyExperimentSequenceHint.textContent = `Upcoming randomized trials: ${upcoming.join(' → ')}`;
  } else if (experiment.completed) {
    ui.studyExperimentSequenceHint.textContent = 'All 40 randomized trials are complete.';
  } else {
    ui.studyExperimentSequenceHint.textContent = 'The trial order will be shuffled when the experiment starts.';
  }

  const shouldFocusExperiment = Boolean(
    experiment.running &&
    state.study.currentStep === 3 &&
    ui.studyExperimentLiveCue &&
    ui.studyPage &&
    !ui.studyPage.hidden,
  );
  document.body.classList.toggle('study-experiment-focus', shouldFocusExperiment);
  if (shouldFocusExperiment) {
    document.body.classList.remove('study-calibration-focus');
    document.body.classList.remove('study-effort-focus');
  }

  updateStudyFullscreenButtons();
}

async function toggleStudyFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    const target = ui.studyPage && !ui.studyPage.hidden ? ui.studyPage : document.documentElement;
    await target.requestFullscreen();
  } catch (_) {
    setStudyMessage('Full screen is not available in this browser.', true);
  }
}

function updateStudyFullscreenButtons() {
  const isFullscreen = Boolean(document.fullscreenElement);
  const label = isFullscreen ? 'Exit full screen' : 'Full screen';

  if (ui.btnStudyFullscreen) {
    ui.btnStudyFullscreen.textContent = label;
    ui.btnStudyFullscreen.setAttribute('aria-pressed', String(isFullscreen));
  }

  if (ui.studyExperimentFullscreenFloating) {
    ui.studyExperimentFullscreenFloating.textContent = label;
    ui.studyExperimentFullscreenFloating.setAttribute('aria-pressed', String(isFullscreen));
  }

  if (ui.studyEffortFullscreenFloating) {
    ui.studyEffortFullscreenFloating.textContent = label;
    ui.studyEffortFullscreenFloating.setAttribute('aria-pressed', String(isFullscreen));
  }

  if (ui.studyStrummingFullscreenFloating) {
    ui.studyStrummingFullscreenFloating.textContent = label;
    ui.studyStrummingFullscreenFloating.setAttribute('aria-pressed', String(isFullscreen));
  }
}

function getStudyExperimentDisplayState() {
  const experiment = state.study.experiment;

  if (experiment.running && experiment.currentPhase === 'REST') {
    return {
      title: 'REST',
      chartChord: '',
      showChart: false,
    };
  }

  if (experiment.running) {
    return {
      title: experiment.currentChord || '—',
      chartChord: experiment.currentChord,
      showChart: Boolean(experiment.currentChord),
    };
  }

  return {
    title: experiment.completed ? 'Done' : '—',
    chartChord: '',
    showChart: false,
  };
}

function toStudyPhaseToken(phaseName) {
  const normalized = String(phaseName || '').trim().toLowerCase();
  if (normalized === 'rest') return 'rest';
  if (normalized === 'form chord') return 'form';
  if (normalized === 'hold still') return 'hold';
  if (normalized === 'release') return 'release';
  if (normalized === 'completed') return 'completed';
  return 'idle';
}

function renderStudyCalibrationChordStrip(playProgress = 0, phaseToken = 'idle', restProgress = 0) {
  if (!ui.studyCalibrationChordStrip) return;

  const calibration = state.study.calibration;
  const sequence = Array.isArray(calibration.sequence) ? calibration.sequence : [];
  if (!sequence.length) {
    ui.studyCalibrationChordStrip.innerHTML = [
      '<div class="study-experiment-sequence-empty">',
      'The randomized calibration chord order will appear here after calibration starts.',
      '</div>',
    ].join('');
    return;
  }

  const windowSize = 5;
  let activeIndex = 0;
  if (calibration.completed) {
    activeIndex = Math.max(0, sequence.length - 1);
  } else if (calibration.running) {
    activeIndex = phaseToken === 'rest'
      ? Math.max(0, Math.min(sequence.length - 1, calibration.currentTrialIndex + 1))
      : Math.max(0, Math.min(sequence.length - 1, calibration.currentTrialIndex));
  } else if (calibration.currentTrialIndex >= 0) {
    activeIndex = Math.max(0, Math.min(sequence.length - 1, calibration.currentTrialIndex));
  }

  const preferredStart = Math.max(0, activeIndex - Math.floor(windowSize / 2));
  const startIndex = Math.min(preferredStart, Math.max(0, sequence.length - windowSize));
  const windowItems = sequence.slice(startIndex, startIndex + windowSize);

  ui.studyCalibrationChordStrip.classList.add('study-experiment-sequence-strip');
  ui.studyCalibrationChordStrip.innerHTML = windowItems.map((item, offset) => {
    const sequenceIndex = startIndex + offset;
    const chord = item?.chord || '';
    const shouldHighlightChord = sequenceIndex === activeIndex && phaseToken !== 'rest' && !calibration.completed;
    const isPast = calibration.completed || sequenceIndex < activeIndex;
    const isNext = !isPast && sequenceIndex > activeIndex;
    const progressPercent = isPast ? 100 : shouldHighlightChord ? playProgress : 0;
    const progressPhase = isPast ? 'completed' : shouldHighlightChord ? phaseToken : 'idle';
    const chordChartMarkup = getStudyChordChartMarkup(chord);
    const shouldShowActiveRest = phaseToken === 'rest' && sequenceIndex === activeIndex;
    const restProgressPercent = sequenceIndex < activeIndex || calibration.completed ? 100 : shouldShowActiveRest ? restProgress : 0;
    const restProgressPhase = sequenceIndex < activeIndex || calibration.completed ? 'completed' : shouldShowActiveRest ? 'rest' : 'idle';
    const restStripMarkup = offset > 0
      ? [
        `<div class="study-experiment-rest-strip${sequenceIndex < activeIndex || calibration.completed ? ' past' : ''}${isNext ? ' next' : ''}${shouldShowActiveRest ? ' active' : ''}" data-phase="${escapeHtml(restProgressPhase)}" aria-hidden="true">`,
        '<div class="study-experiment-rest-strip-body">',
        '<span class="study-experiment-rest-strip-label">Rest</span>',
        '</div>',
        '<div class="study-experiment-rest-progress">',
        `<div class="study-experiment-rest-progress-fill" data-phase="${escapeHtml(restProgressPhase)}" style="width: ${Math.max(0, Math.min(100, restProgressPercent))}%;"></div>`,
        '</div>',
        '</div>',
      ].join('')
      : '';

    return [
      restStripMarkup,
      `<div class="study-experiment-sequence-item${shouldHighlightChord ? ' active' : ''}${isPast ? ' past' : ''}${isNext ? ' next' : ''}" data-sequence-index="${sequenceIndex}" ${shouldHighlightChord ? 'aria-current="true"' : ''}>`,
      `<span class="study-experiment-sequence-position">${sequenceIndex + 1}</span>`,
      '<div class="study-experiment-sequence-chart-card">',
      `<strong class="study-experiment-sequence-label">${escapeHtml(chord)}</strong>`,
      chordChartMarkup,
      '</div>',
      '<div class="study-experiment-sequence-progress" aria-hidden="true">',
      `<div class="study-experiment-sequence-progress-fill" data-phase="${escapeHtml(progressPhase)}" style="width: ${Math.max(0, Math.min(100, progressPercent))}%;"></div>`,
      '</div>',
      '</div>',
    ].join('');
  }).join('');
}

function getStudyExperimentChordProgressMarkersMarkup() {
  const phases = getStudyExperimentPhases().filter((phase) => phase.key !== 'REST');
  const totalPlayableDurationMs = phases.reduce((sum, phase) => sum + phase.durationMs, 0);
  if (!phases.length || totalPlayableDurationMs <= 0) return '';

  let elapsedMs = 0;
  const markersMarkup = phases.map((phase, index) => {
    const positionPercent = (elapsedMs / totalPlayableDurationMs) * 100;
    const phaseToken = toStudyPhaseToken(phase.key);
    elapsedMs += phase.durationMs;
    return [
      `<span class="study-experiment-sequence-progress-marker${index === 0 ? ' start' : ''}"`,
      ` data-phase="${escapeHtml(phaseToken)}" style="left: ${Math.max(0, Math.min(100, positionPercent))}%;" aria-hidden="true"></span>`,
    ].join('');
  }).join('');

  return `<div class="study-experiment-sequence-progress-markers" aria-hidden="true">${markersMarkup}</div>`;
}

function renderStudyExperimentChordStrip(trialProgress = 0, phaseToken = 'idle', restProgress = 0) {
  if (!ui.studyExperimentChordStrip) return;

  const experiment = state.study.experiment;
  const sequence = Array.isArray(experiment.sequence) ? experiment.sequence : [];
  if (!sequence.length) {
    ui.studyExperimentChordStrip.innerHTML = [
      '<div class="study-experiment-sequence-empty">',
      'The 40-chord randomized order will appear here after the experiment starts.',
      '</div>',
    ].join('');
    return;
  }

  const windowSize = 5;
  const activeIndex = experiment.completed
    ? Math.max(0, sequence.length - 1)
    : Math.max(0, Math.min(sequence.length - 1, experiment.currentTrialIndex || 0));
  const preferredStart = Math.max(0, activeIndex - Math.floor(windowSize / 2));
  const startIndex = Math.min(preferredStart, Math.max(0, sequence.length - windowSize));
  const windowItems = sequence.slice(startIndex, startIndex + windowSize);
  const progressMarkersMarkup = getStudyExperimentChordProgressMarkersMarkup();

  ui.studyExperimentChordStrip.classList.add('study-experiment-sequence-strip');
  ui.studyExperimentChordStrip.innerHTML = windowItems.map((chord, offset) => {
    const sequenceIndex = startIndex + offset;
    const isActive = sequenceIndex === activeIndex;
    const shouldHighlightChord = isActive && phaseToken !== 'rest';
    const isPast = sequenceIndex < activeIndex;
    const isNext = sequenceIndex > activeIndex;
    const progressPercent = isPast ? 100 : isActive && phaseToken !== 'rest' ? trialProgress : 0;
    const progressPhase = isPast ? 'completed' : isActive && phaseToken !== 'rest' ? phaseToken : 'idle';
    const chordChartMarkup = getStudyChordChartMarkup(chord);
    const shouldShowActiveRest = sequenceIndex === activeIndex && phaseToken === 'rest';
    const restProgressPercent = sequenceIndex < activeIndex ? 100 : shouldShowActiveRest ? restProgress : 0;
    const restProgressPhase = sequenceIndex < activeIndex ? 'completed' : shouldShowActiveRest ? 'rest' : 'idle';
    const restStripMarkup = offset > 0
      ? [
        `<div class="study-experiment-rest-strip${sequenceIndex < activeIndex ? ' past' : ''}${sequenceIndex > activeIndex ? ' next' : ''}${shouldShowActiveRest ? ' active' : ''}" data-phase="${escapeHtml(restProgressPhase)}" aria-hidden="true">`,
        '<div class="study-experiment-rest-strip-body">',
        '<span class="study-experiment-rest-strip-label">Rest</span>',
        '</div>',
        '<div class="study-experiment-rest-progress">',
        `<div class="study-experiment-rest-progress-fill" data-phase="${escapeHtml(restProgressPhase)}" style="width: ${Math.max(0, Math.min(100, restProgressPercent))}%;"></div>`,
        '</div>',
        '</div>',
      ].join('')
      : '';

    return [
      restStripMarkup,
      `<div class="study-experiment-sequence-item${shouldHighlightChord ? ' active' : ''}${isPast ? ' past' : ''}${isNext ? ' next' : ''}" data-sequence-index="${sequenceIndex}" ${shouldHighlightChord ? 'aria-current="true"' : ''}>`,
      `<span class="study-experiment-sequence-position">${sequenceIndex + 1}</span>`,
      '<div class="study-experiment-sequence-chart-card">',
      `<strong class="study-experiment-sequence-label">${escapeHtml(chord)}</strong>`,
      chordChartMarkup,
      '</div>',
      '<div class="study-experiment-sequence-progress" aria-hidden="true">',
      `<div class="study-experiment-sequence-progress-fill" data-phase="${escapeHtml(progressPhase)}" style="width: ${Math.max(0, Math.min(100, progressPercent))}%;"></div>`,
      progressMarkersMarkup,
      '</div>',
      '</div>',
    ].join('');
  }).join('');
}

function renderStudyExperimentChart(chord) {
  renderStudyChordChart(ui.studyExperimentChart, chord);
}

function getStudyChordChartMarkup(chord) {
  const sourceCard = document.querySelector(`[data-study-chord="${chord}"]`);
  const sourceChart = sourceCard?.querySelector('.study-chord-chart');
  return sourceChart ? sourceChart.outerHTML : '<div class="study-live-chart-empty">Chord chart unavailable.</div>';
}

function renderStudyChordStrip(targetElement, activeChord, nextChord = '') {
  if (!targetElement) return;

  targetElement.innerHTML = STUDY_CHORDS.map((chord) => {
    const isActive = activeChord === chord;
    const isNext = !isActive && nextChord === chord;

    return [
      `<div class="study-experiment-chord-item${isActive ? ' active' : ''}${isNext ? ' next' : ''}" data-chord="${escapeHtml(chord)}" ${isActive ? 'aria-current="true"' : ''}>`,
      `<div class="study-experiment-chord-name">${escapeHtml(chord)}</div>`,
      getStudyChordChartMarkup(chord),
      '</div>',
    ].join('');
  }).join('');
}

function getActiveStudyExperimentChord() {
  const experiment = state.study.experiment;
  if (!experiment.running) return '';
  if (experiment.currentPhase === 'REST') return '';
  return experiment.currentChord || '';
}

function getQueuedStudyExperimentChord() {
  const experiment = state.study.experiment;
  if (!experiment.running) return '';
  if (experiment.currentPhase === 'REST') return experiment.currentChord || '';
  return '';
}

function shouldShowUpcomingStudyExperimentChord() {
  const experiment = state.study.experiment;
  return Boolean(experiment.running && experiment.currentPhase === 'REST');
}

function getUpcomingStudyExperimentChord() {
  if (!shouldShowUpcomingStudyExperimentChord()) return '—';
  return getQueuedStudyExperimentChord() || 'Finish';
}

function renderStudyEffortChordStrip(trialProgress = 0, phaseToken = 'idle', restProgress = 0) {
  if (!ui.studyEffortChordStrip) return;

  const effort = state.study.effort;
  const sequence = Array.isArray(effort.sequence) ? effort.sequence : [];
  if (!sequence.length) {
    ui.studyEffortChordStrip.innerHTML = [
      '<div class="study-experiment-sequence-empty">',
      'The randomized effort chord order will appear here after the session starts.',
      '</div>',
    ].join('');
    return;
  }

  const windowSize = 5;
  let activeIndex = 0;
  if (effort.completed) {
    activeIndex = Math.max(0, sequence.length - 1);
  } else if (effort.running) {
    activeIndex = phaseToken === 'rest'
      ? Math.max(0, Math.min(sequence.length - 1, effort.currentTrialIndex + 1))
      : Math.max(0, Math.min(sequence.length - 1, effort.currentTrialIndex || 0));
  } else if (effort.currentTrialIndex >= 0) {
    activeIndex = Math.max(0, Math.min(sequence.length - 1, effort.currentTrialIndex));
  }

  const preferredStart = Math.max(0, activeIndex - Math.floor(windowSize / 2));
  const startIndex = Math.min(preferredStart, Math.max(0, sequence.length - windowSize));
  const windowItems = sequence.slice(startIndex, startIndex + windowSize);

  ui.studyEffortChordStrip.classList.add('study-experiment-sequence-strip');
  ui.studyEffortChordStrip.innerHTML = windowItems.map((item, offset) => {
    const sequenceIndex = startIndex + offset;
    const chord = item?.chord || '';
    const shouldHighlightChord = sequenceIndex === activeIndex && phaseToken !== 'rest' && !effort.completed;
    const isPast = effort.completed || sequenceIndex < activeIndex;
    const isNext = !isPast && sequenceIndex > activeIndex;
    const progressPercent = isPast ? 100 : shouldHighlightChord ? trialProgress : 0;
    const progressPhase = isPast ? 'completed' : shouldHighlightChord ? phaseToken : 'idle';
    const chordChartMarkup = getStudyChordChartMarkup(chord);
    const shouldShowActiveRest = phaseToken === 'rest' && sequenceIndex === activeIndex;
    const restProgressPercent = sequenceIndex < activeIndex || effort.completed ? 100 : shouldShowActiveRest ? restProgress : 0;
    const restProgressPhase = sequenceIndex < activeIndex || effort.completed ? 'completed' : shouldShowActiveRest ? 'rest' : 'idle';
    const restStripMarkup = offset > 0
      ? [
        `<div class="study-experiment-rest-strip${sequenceIndex < activeIndex || effort.completed ? ' past' : ''}${isNext ? ' next' : ''}${shouldShowActiveRest ? ' active' : ''}" data-phase="${escapeHtml(restProgressPhase)}" aria-hidden="true">`,
        '<div class="study-experiment-rest-strip-body">',
        '<span class="study-experiment-rest-strip-label">Rest</span>',
        '</div>',
        '<div class="study-experiment-rest-progress">',
        `<div class="study-experiment-rest-progress-fill" data-phase="${escapeHtml(restProgressPhase)}" style="width: ${Math.max(0, Math.min(100, restProgressPercent))}%;"></div>`,
        '</div>',
        '</div>',
      ].join('')
      : '';

    return [
      restStripMarkup,
      `<div class="study-experiment-sequence-item${shouldHighlightChord ? ' active' : ''}${isPast ? ' past' : ''}${isNext ? ' next' : ''}" data-sequence-index="${sequenceIndex}" ${shouldHighlightChord ? 'aria-current="true"' : ''}>`,
      `<span class="study-experiment-sequence-position">${sequenceIndex + 1}</span>`,
      '<div class="study-experiment-sequence-chart-card">',
      `<strong class="study-experiment-sequence-label">${escapeHtml(chord)}</strong>`,
      chordChartMarkup,
      '</div>',
      '<div class="study-experiment-sequence-progress" aria-hidden="true">',
      `<div class="study-experiment-sequence-progress-fill" data-phase="${escapeHtml(progressPhase)}" style="width: ${Math.max(0, Math.min(100, progressPercent))}%;"></div>`,
      '</div>',
      '</div>',
    ].join('');
  }).join('');
}

function renderStudyChordChart(targetElement, chord, options = {}) {
  if (!targetElement) return;
  if (!chord) {
    targetElement.innerHTML = '<div class="study-live-chart-empty">Chord chart will appear here.</div>';
    return;
  }

  const sourceCard = document.querySelector(`[data-study-chord="${chord}"]`);
  const sourceChart = sourceCard?.querySelector('.study-chord-chart');
  if (!sourceChart || !sourceCard) {
    targetElement.innerHTML = '<div class="study-live-chart-empty">Chord chart unavailable.</div>';
    return;
  }

  const extraTitle = options.extraTitle ? escapeHtml(options.extraTitle) : '';
  const extraText = options.extraText ? escapeHtml(options.extraText) : '';

  targetElement.innerHTML = [
    '<div class="study-live-chart-meta">',
    extraTitle ? `<div class="study-live-chart-extra-title">${extraTitle}</div>` : '',
    extraText ? `<div class="study-live-chart-extra-text">${extraText}</div>` : '',
    '</div>',
    sourceChart.outerHTML,
  ].join('');
}

function startStudyExperiment() {
  syncStudyStateFromForm();
  if (!state.study.calibration.completed) {
    setStudyMessage('Please complete the calibration session before starting the chord experiment.', true);
    return;
  }

  if (state.study.currentStep !== 3) {
    state.study.currentStep = 3;
    renderStudyStep();
  }

  stopStudyExperiment({ resetState: false, resetMessage: false });

  state.study.experiment = {
    running: true,
    completed: false,
    sequence: createStudyExperimentSequence(),
    currentTrialIndex: 0,
    currentPhaseIndex: 0,
    trialStartedAt: 0,
    phaseStartedAt: 0,
    phaseTimestamps: {
      formStartedAt: 0,
      holdStartedAt: 0,
      releaseStartedAt: 0,
    },
    currentChord: '',
    currentPhase: 'Waiting',
    counts: { C: 0, Em: 0, D: 0, G: 0 },
    records: [],
    completedAt: '',
  };

  beginStudyExperimentTrial(0);
  studyExperimentTickHandle = window.setInterval(updateStudyExperimentClock, 100);
  clearStudyMessage();
  persistStudyState();
  renderStudyExperiment();
}

function stopStudyExperiment(options = {}) {
  const resetState = options.resetState !== false;
  const resetMessage = options.resetMessage !== false;

  if (studyExperimentTickHandle) {
    window.clearInterval(studyExperimentTickHandle);
    studyExperimentTickHandle = 0;
  }

  if (resetState) {
    state.study.experiment.running = false;
    state.study.experiment.currentChord = '';
    state.study.experiment.currentPhase = 'Stopped';
    state.study.experiment.phaseTimestamps = {
      formStartedAt: 0,
      holdStartedAt: 0,
      releaseStartedAt: 0,
    };
    state.study.experiment.currentTrialIndex = Math.max(
      state.study.experiment.currentTrialIndex,
      STUDY_CHORDS.reduce((sum, chord) => sum + (state.study.experiment.counts[chord] || 0), 0) - 1,
    );
    persistStudyState();
  }

  renderStudyExperiment();
  if (resetMessage) clearStudyMessage();
}

function createStudyExperimentSequence() {
  const sequence = [];
  STUDY_CHORDS.forEach((chord) => {
    for (let index = 0; index < STUDY_TRIALS_PER_CHORD; index += 1) {
      sequence.push(chord);
    }
  });

  for (let index = sequence.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [sequence[index], sequence[swapIndex]] = [sequence[swapIndex], sequence[index]];
  }

  return sequence;
}

function beginStudyExperimentTrial(trialIndex) {
  const experiment = state.study.experiment;
  const phases = getStudyExperimentPhases();
  const chord = experiment.sequence[trialIndex];
  if (!chord) {
    finishStudyExperiment();
    return;
  }

  const now = Date.now();
  experiment.currentTrialIndex = trialIndex;
  experiment.currentChord = chord;
  experiment.trialStartedAt = now;
  experiment.currentPhaseIndex = 0;
  experiment.phaseStartedAt = now;
  experiment.phaseTimestamps = {
    formStartedAt: 0,
    holdStartedAt: 0,
    releaseStartedAt: 0,
  };
  experiment.currentPhase = phases[0].key;

  applyStudyExperimentPhaseCue();
  renderStudyExperiment();
}

function updateStudyExperimentClock() {
  const experiment = state.study.experiment;
  if (!experiment.running) {
    stopStudyExperiment({ resetState: false, resetMessage: false });
    return;
  }

  const now = Date.now();
  const phase = getStudyExperimentPhases()[experiment.currentPhaseIndex];
  if (!phase) {
    finishStudyExperiment();
    return;
  }

  if (now - experiment.phaseStartedAt >= phase.durationMs) {
    advanceStudyExperimentPhase(now);
    return;
  }

  renderStudyExperiment();
}

function advanceStudyExperimentPhase(now) {
  const experiment = state.study.experiment;
  const phases = getStudyExperimentPhases();
  if (experiment.currentPhaseIndex < phases.length - 1) {
    experiment.currentPhaseIndex += 1;
    experiment.phaseStartedAt = now;
    experiment.currentPhase = phases[experiment.currentPhaseIndex].key;
    markStudyExperimentPhaseTimestamp(experiment.currentPhase, now);
    applyStudyExperimentPhaseCue();
    persistStudyState();
    renderStudyExperiment();
    return;
  }

  const chord = experiment.currentChord;
  experiment.records.push({
    trialIndex: experiment.currentTrialIndex,
    chord,
    formStartedAt: experiment.phaseTimestamps.formStartedAt,
    holdStartedAt: experiment.phaseTimestamps.holdStartedAt,
    releaseStartedAt: experiment.phaseTimestamps.releaseStartedAt,
    endedAt: now,
    durationMs: Math.max(0, now - (experiment.phaseTimestamps.formStartedAt || experiment.trialStartedAt || now)),
  });
  experiment.counts[chord] = (experiment.counts[chord] || 0) + 1;
  const nextTrialIndex = experiment.currentTrialIndex + 1;
  persistStudyState();

  if (nextTrialIndex >= experiment.sequence.length) {
    finishStudyExperiment();
    return;
  }

  beginStudyExperimentTrial(nextTrialIndex);
}

function applyStudyExperimentPhaseCue() {
  const experiment = state.study.experiment;
  const phase = getStudyExperimentPhases()[experiment.currentPhaseIndex];
  if (!phase) return;
  experiment.currentPhase = phase.key;
  if (phase.ding) playStudyBeep();
}

function markStudyExperimentPhaseTimestamp(phaseName, timestamp) {
  const experiment = state.study.experiment;
  if (phaseName === 'FORM CHORD') {
    experiment.phaseTimestamps.formStartedAt = timestamp;
    return;
  }
  if (phaseName === 'HOLD STILL') {
    experiment.phaseTimestamps.holdStartedAt = timestamp;
    return;
  }
  if (phaseName === 'RELEASE') {
    experiment.phaseTimestamps.releaseStartedAt = timestamp;
  }
}

function finishStudyExperiment() {
  if (studyExperimentTickHandle) {
    window.clearInterval(studyExperimentTickHandle);
    studyExperimentTickHandle = 0;
  }

  state.study.experiment.running = false;
  state.study.experiment.completed = true;
  state.study.experiment.completedAt = new Date().toISOString();
  state.study.experiment.currentPhase = 'Completed';
  persistStudyState();
  renderStudyExperiment();
  setStudyMessage('Chord Form–Hold–Release experiment completed. Continue to the Effort Manipulation step.', false);
}

function getStudyExperimentInstruction() {
  const experiment = state.study.experiment;
  if (experiment.completed) return 'All repetitions are complete. Continue to the Effort Manipulation step.';
  if (!experiment.running) return 'Press start to begin the randomized chord sequence.';

  const phase = getStudyExperimentPhases()[experiment.currentPhaseIndex];
  if (!phase) return 'Preparing next cue.';
  return phase.instruction.replace('{CHORD}', experiment.currentChord || '—');
}

function getStudyExperimentTimeLeftMs() {
  const experiment = state.study.experiment;
  if (!experiment.running) return 0;
  const phase = getStudyExperimentPhases()[experiment.currentPhaseIndex];
  if (!phase) return 0;
  return Math.max(0, phase.durationMs - (Date.now() - experiment.phaseStartedAt));
}

function getStudyTotalTrialDurationMs() {
  return getStudyExperimentPhases().reduce((sum, phase) => sum + phase.durationMs, 0);
}

function getStudyExperimentTrialProgress(timeLeftMs, totalTrialDurationMs) {
  const experiment = state.study.experiment;
  if (experiment.completed) return 100;
  if (!experiment.running || totalTrialDurationMs <= 0) return 0;
  const elapsedMs = Math.max(0, totalTrialDurationMs - timeLeftMs - getStudyRemainingFuturePhaseDurationMs(experiment.currentPhaseIndex));
  return Math.max(0, Math.min(100, (elapsedMs / totalTrialDurationMs) * 100));
}

function getStudyCalibrationPlayProgress() {
  const calibration = state.study.calibration;
  const playDurationMs = getStudyPhaseDurationMs('calibration', 'PLAY');

  if (calibration.completed) return 100;
  if (!calibration.running || calibration.currentPhase !== 'PLAY' || playDurationMs <= 0) return 0;

  const elapsedInPhaseMs = Math.max(0, Math.min(playDurationMs, Date.now() - calibration.phaseStartedAt));
  return Math.max(0, Math.min(100, (elapsedInPhaseMs / playDurationMs) * 100));
}

function getStudyCalibrationRestProgress() {
  const calibration = state.study.calibration;
  const restDurationMs = getStudyPhaseDurationMs('calibration', 'REST');

  if (calibration.completed) return 100;
  if (!calibration.running || calibration.currentPhase !== 'REST' || restDurationMs <= 0) return 0;

  const elapsedInPhaseMs = Math.max(0, Math.min(restDurationMs, Date.now() - calibration.phaseStartedAt));
  return Math.max(0, Math.min(100, (elapsedInPhaseMs / restDurationMs) * 100));
}

function getStudyExperimentChordProgress() {
  const experiment = state.study.experiment;
  const phases = getStudyExperimentPhases();
  const playablePhases = phases.filter((phase) => phase.key !== 'REST');
  const totalPlayableDurationMs = playablePhases.reduce((sum, phase) => sum + phase.durationMs, 0);

  if (experiment.completed) return 100;
  if (!experiment.running || totalPlayableDurationMs <= 0) return 0;

  const currentPhase = phases[experiment.currentPhaseIndex];
  if (!currentPhase || currentPhase.key === 'REST') return 0;

  const elapsedBeforeCurrentMs = phases
    .slice(0, experiment.currentPhaseIndex)
    .filter((phase) => phase.key !== 'REST')
    .reduce((sum, phase) => sum + phase.durationMs, 0);
  const elapsedInCurrentPhaseMs = Math.max(0, Math.min(currentPhase.durationMs, Date.now() - experiment.phaseStartedAt));
  const chordElapsedMs = elapsedBeforeCurrentMs + elapsedInCurrentPhaseMs;

  return Math.max(0, Math.min(100, (chordElapsedMs / totalPlayableDurationMs) * 100));
}

function getStudyExperimentRestProgress() {
  const experiment = state.study.experiment;
  const phases = getStudyExperimentPhases();
  const currentPhase = phases[experiment.currentPhaseIndex];

  if (experiment.completed) return 100;
  if (!experiment.running || !currentPhase || currentPhase.key !== 'REST' || currentPhase.durationMs <= 0) return 0;

  const elapsedInPhaseMs = Math.max(0, Math.min(currentPhase.durationMs, Date.now() - experiment.phaseStartedAt));
  return Math.max(0, Math.min(100, (elapsedInPhaseMs / currentPhase.durationMs) * 100));
}

function getStudyExperimentPhaseSegmentState(totalTrialDurationMs) {
  const experiment = state.study.experiment;
  const phases = getStudyExperimentPhases();
  if (!experiment.running || totalTrialDurationMs <= 0) {
    return {
      startPercent: 0,
      sizePercent: 0,
    };
  }

  const phase = phases[experiment.currentPhaseIndex];
  if (!phase) {
    return {
      startPercent: 0,
      sizePercent: 0,
    };
  }

  const phaseStartMs = phases
    .slice(0, experiment.currentPhaseIndex)
    .reduce((sum, item) => sum + item.durationMs, 0);
  const elapsedInPhaseMs = Math.max(0, Math.min(phase.durationMs, Date.now() - experiment.phaseStartedAt));

  return {
    startPercent: (phaseStartMs / totalTrialDurationMs) * 100,
    sizePercent: (elapsedInPhaseMs / totalTrialDurationMs) * 100,
  };
}

function getStudyRemainingFuturePhaseDurationMs(currentPhaseIndex) {
  const phases = getStudyExperimentPhases();
  if (!Number.isInteger(currentPhaseIndex) || currentPhaseIndex < 0) return 0;
  return phases.slice(currentPhaseIndex + 1).reduce((sum, phase) => sum + phase.durationMs, 0);
}

function renderStudyExperimentTimeline() {
  if (!ui.studyExperimentTimelineMarkers || !ui.studyExperimentTimelineLabels) return;

  const totalTrialDurationMs = getStudyTotalTrialDurationMs();
  const phases = getStudyExperimentPhases();
  let elapsedMs = 0;
  const points = phases.map((phase, index) => {
    const point = {
      key: phase.key,
      label: phase.key,
      timeLabel: `${formatSeconds(elapsedMs / 1000)} s`,
      position: totalTrialDurationMs > 0 ? (elapsedMs / totalTrialDurationMs) * 100 : 0,
      isActive: state.study.experiment.running && state.study.experiment.currentPhase === phase.key,
      isCompleted: state.study.experiment.completed,
      isStart: index === 0,
      isEnd: index === phases.length - 1,
    };
    elapsedMs += phase.durationMs;
    return point;
  });

  ui.studyExperimentTimelineMarkers.innerHTML = points.map((point) => [
    `<span class="study-phase-timeline-marker${point.isActive ? ' active' : ''}${point.isCompleted ? ' completed' : ''}${point.isStart ? ' start' : ''}${point.isEnd ? ' end' : ''}"`,
      ` style="top: ${point.position}%;" aria-hidden="true"></span>`,
  ].join('')).join('');

  ui.studyExperimentTimelineLabels.innerHTML = points.map((point) => [
    `<div class="study-phase-timeline-label${point.isActive ? ' active' : ''}${point.isCompleted ? ' completed' : ''}${point.isStart ? ' start' : ''}${point.isEnd ? ' end' : ''}"`,
    ` style="top: ${point.position}%;">`,
    `<span class="study-phase-timeline-phase">${escapeHtml(point.label)}</span>`,
    `<span class="study-phase-timeline-time">${escapeHtml(point.timeLabel)}</span>`,
    '</div>',
  ].join('')).join('');
}

function renderStudyEffort() {
  if (
    !ui.studyEffortStatus ||
    !ui.studyEffortTrial ||
    !ui.studyEffortTimer ||
    !ui.studyEffortCountC ||
    !ui.studyEffortCountEm ||
    !ui.studyEffortCountD ||
    !ui.studyEffortCountG ||
    !ui.studyEffortSequenceHint
  ) {
    return;
  }

  const effort = state.study.effort;
  const phases = getStudyEffortPhases();
  const totalTrials = STUDY_CHORDS.length * STUDY_EFFORT_ROUNDS;
  const completedTrials = STUDY_CHORDS.reduce((sum, chord) => sum + (effort.counts[chord] || 0), 0);
  const activeTrialNumber = effort.running && effort.currentTrialIndex >= 0
    ? effort.currentTrialIndex + 1
    : completedTrials;
  const display = getStudyEffortDisplayState();
  const effortToken = getStudyEffortToken();
  const timeLeftMs = getStudyEffortTimeLeftMs();
  const totalTrialDurationMs = getStudyEffortTrialDurationMs();
  const effortProgress = getStudyEffortTrialProgress(timeLeftMs, totalTrialDurationMs);
  const chordProgress = getStudyEffortChordProgress();
  const restProgress = getStudyEffortRestProgress();
  const phaseToken = toStudyEffortPhaseToken(effort.currentPhase);
  renderStudyPhaseSettings('effort', phases, effort.running);
  renderStudyEffortChordStrip(chordProgress, phaseToken, restProgress);

  ui.studyEffortStatus.textContent = effort.completed
    ? 'Completed'
    : effort.running
      ? 'Running'
      : 'Ready';
  ui.studyEffortTrial.textContent = `${Math.min(activeTrialNumber, totalTrials)} / ${totalTrials}`;
  if (ui.studyEffortChord) {
    ui.studyEffortChord.textContent = display.title;
  }
  if (ui.studyEffortChart) {
    ui.studyEffortChart.hidden = !display.showChart;
    renderStudyChordChart(ui.studyEffortChart, display.chartChord, {
      extraTitle: '',
      extraText: '',
    });
  }
  if (ui.studyEffortPhase) {
    ui.studyEffortPhase.textContent = effort.currentPhase || 'Waiting';
    ui.studyEffortPhase.dataset.phase = phaseToken;
  }
  if (ui.studyEffortLiveCue) {
    ui.studyEffortLiveCue.dataset.effort = effort.running ? effortToken : effort.completed ? 'completed' : 'idle';
  }
  if (ui.studyEffortLiveCue) {
    ui.studyEffortLiveCue.dataset.phase = phaseToken;
  }
  ui.studyEffortTimer.textContent = `${formatSeconds(timeLeftMs / 1000)} s`;
  if (ui.studyEffortLiveTimer) {
    ui.studyEffortLiveTimer.textContent = `${formatSeconds(timeLeftMs / 1000)} s`;
  }
  ui.studyEffortStart.disabled = effort.running;
  ui.studyEffortStop.disabled = !effort.running;
  if (ui.studyEffortFullscreenFloating) {
    ui.studyEffortFullscreenFloating.hidden = !effort.running;
  }
  if (ui.studyEffortStopFloating) {
    ui.studyEffortStopFloating.hidden = !effort.running;
  }
  if (ui.studyEffortLiveProgressBar) {
    ui.studyEffortLiveProgressBar.style.height = `${effortProgress}%`;
    ui.studyEffortLiveProgressBar.dataset.phase = phaseToken;
  }

  ui.studyEffortCountC.textContent = `${effort.counts.C || 0} / ${STUDY_EFFORT_ROUNDS}`;
  ui.studyEffortCountEm.textContent = `${effort.counts.Em || 0} / ${STUDY_EFFORT_ROUNDS}`;
  ui.studyEffortCountD.textContent = `${effort.counts.D || 0} / ${STUDY_EFFORT_ROUNDS}`;
  ui.studyEffortCountG.textContent = `${effort.counts.G || 0} / ${STUDY_EFFORT_ROUNDS}`;

  if (effort.running && effort.sequence.length) {
    const upcoming = effort.sequence.slice(effort.currentTrialIndex, effort.currentTrialIndex + 6)
      .map((item) => `${item.chord} · R${item.round}`);
    ui.studyEffortSequenceHint.textContent = `Upcoming effort trials: ${upcoming.join(' → ')}`;
  } else if (effort.completed) {
    ui.studyEffortSequenceHint.textContent = `All ${totalTrials} effort manipulation trials are complete.`;
  } else {
    ui.studyEffortSequenceHint.textContent = `The chord order will be shuffled for each of the ${STUDY_EFFORT_ROUNDS} rounds.`;
  }

  const shouldFocusEffort = Boolean(
    effort.running &&
    state.study.currentStep === 4 &&
    ui.studyEffortLiveCue &&
    ui.studyPage &&
    !ui.studyPage.hidden,
  );
  document.body.classList.toggle('study-effort-focus', shouldFocusEffort);
  if (shouldFocusEffort) {
    document.body.classList.remove('study-calibration-focus');
    document.body.classList.remove('study-experiment-focus');
  }

  updateStudyFullscreenButtons();
}

function getStudyEffortDisplayState() {
  const effort = state.study.effort;

  if (effort.running && effort.currentPhase === 'REST') {
    return {
      title: 'REST',
      chartChord: '',
      showChart: false,
    };
  }

  if (effort.running) {
    return {
      title: effort.currentChord || '—',
      chartChord: effort.currentChord,
      showChart: Boolean(effort.currentChord),
    };
  }

  return {
    title: effort.completed ? 'Done' : '—',
    chartChord: '',
    showChart: false,
  };
}

function toStudyEffortPhaseToken(phaseName) {
  const normalized = String(phaseName || '').trim().toLowerCase();
  if (normalized === 'rest') return 'rest';
  if (normalized === 'form normal') return 'form';
  if (normalized === 'ramp to hard') return 'hold';
  if (normalized === 'ramp to light') return 'release';
  if (normalized === 'completed') return 'completed';
  return 'idle';
}

function getStudyEffortToken() {
  const effort = state.study.effort;
  if (!effort.running) return effort.completed ? 'completed' : 'idle';
  const phase = getStudyEffortPhases()[effort.currentPhaseIndex];
  return phase?.effort || 'idle';
}

function getStudyEffortRoundLabel() {
  const effort = state.study.effort;
  const trial = effort.sequence[effort.currentTrialIndex];
  return trial?.round || 1;
}

function startStudyEffort() {
  syncStudyStateFromForm();
  if (!state.study.experiment.completed) {
    setStudyMessage('Please finish the chord Form–Hold–Release experiment before starting the effort manipulation session.', true);
    return;
  }

  if (state.study.currentStep !== 4) {
    state.study.currentStep = 4;
    renderStudyStep();
  }

  stopStudyEffort({ resetState: false, resetMessage: false });

  state.study.effort = {
    running: true,
    completed: false,
    sequence: createStudyEffortSequence(),
    currentTrialIndex: 0,
    currentPhaseIndex: 0,
    trialStartedAt: 0,
    phaseStartedAt: 0,
    currentChord: '',
    currentPhase: 'Waiting',
    currentEffort: 'normal',
    counts: { C: 0, Em: 0, D: 0, G: 0 },
    records: [],
    completedAt: '',
  };

  beginStudyEffortTrial(0);
  studyEffortTickHandle = window.setInterval(updateStudyEffortClock, 100);
  clearStudyMessage();
  persistStudyState();
  renderStudyEffort();
}

function stopStudyEffort(options = {}) {
  const resetState = options.resetState !== false;
  const resetMessage = options.resetMessage !== false;

  if (studyEffortTickHandle) {
    window.clearInterval(studyEffortTickHandle);
    studyEffortTickHandle = 0;
  }

  if (resetState) {
    state.study.effort.running = false;
    state.study.effort.currentChord = '';
    state.study.effort.currentPhase = 'Stopped';
    state.study.effort.currentEffort = 'idle';
    state.study.effort.currentTrialIndex = Math.max(
      state.study.effort.currentTrialIndex,
      STUDY_CHORDS.reduce((sum, chord) => sum + (state.study.effort.counts[chord] || 0), 0) - 1,
    );
    persistStudyState();
  }

  renderStudyEffort();
  if (resetMessage) clearStudyMessage();
}

function createStudyEffortSequence() {
  const sequence = [];

  for (let round = 0; round < STUDY_EFFORT_ROUNDS; round += 1) {
    const shuffledChords = [...STUDY_CHORDS];
    for (let index = shuffledChords.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledChords[index], shuffledChords[swapIndex]] = [shuffledChords[swapIndex], shuffledChords[index]];
    }

    sequence.push(...shuffledChords.map((chord) => ({ chord, round: round + 1 })));
  }

  return sequence;
}

function beginStudyEffortTrial(trialIndex) {
  const effort = state.study.effort;
  const phases = getStudyEffortPhases();
  const trial = effort.sequence[trialIndex];
  if (!trial) {
    finishStudyEffort();
    return;
  }

  const now = Date.now();
  effort.currentTrialIndex = trialIndex;
  effort.currentChord = trial.chord;
  effort.trialStartedAt = now;
  effort.currentPhaseIndex = 0;
  effort.phaseStartedAt = now;
  effort.currentPhase = phases[0].key;
  effort.currentEffort = phases[0].effort;

  applyStudyEffortPhaseCue();
  renderStudyEffort();
}

function updateStudyEffortClock() {
  const effort = state.study.effort;
  if (!effort.running) {
    stopStudyEffort({ resetState: false, resetMessage: false });
    return;
  }

  const now = Date.now();
  const phase = getStudyEffortPhases()[effort.currentPhaseIndex];
  if (!phase) {
    finishStudyEffort();
    return;
  }

  if (now - effort.phaseStartedAt >= phase.durationMs) {
    advanceStudyEffortPhase(now);
    return;
  }

  renderStudyEffort();
}

function advanceStudyEffortPhase(now) {
  const effort = state.study.effort;
  const phases = getStudyEffortPhases();
  if (effort.currentPhaseIndex < phases.length - 1) {
    effort.currentPhaseIndex += 1;
    effort.phaseStartedAt = now;
    effort.currentPhase = phases[effort.currentPhaseIndex].key;
    effort.currentEffort = phases[effort.currentPhaseIndex].effort;
    applyStudyEffortPhaseCue();
    persistStudyState();
    renderStudyEffort();
    return;
  }

  const trial = effort.sequence[effort.currentTrialIndex];
  effort.records.push({
    trialIndex: effort.currentTrialIndex,
    round: trial?.round || getStudyEffortRoundLabel(),
    chord: effort.currentChord,
    startedAt: effort.trialStartedAt,
    endedAt: now,
    durationMs: Math.max(0, now - effort.trialStartedAt),
  });
  const chord = effort.currentChord;
  effort.counts[chord] = (effort.counts[chord] || 0) + 1;
  const nextTrialIndex = effort.currentTrialIndex + 1;
  persistStudyState();

  if (nextTrialIndex >= effort.sequence.length) {
    finishStudyEffort();
    return;
  }

  beginStudyEffortTrial(nextTrialIndex);
}

function applyStudyEffortPhaseCue() {
  const effort = state.study.effort;
  const phase = getStudyEffortPhases()[effort.currentPhaseIndex];
  if (!phase) return;
  effort.currentPhase = phase.key;
  effort.currentEffort = phase.effort;
  if (phase.ding) playStudyBeep();
}

function finishStudyEffort() {
  if (studyEffortTickHandle) {
    window.clearInterval(studyEffortTickHandle);
    studyEffortTickHandle = 0;
  }

  state.study.effort.running = false;
  state.study.effort.completed = true;
  state.study.effort.completedAt = new Date().toISOString();
  state.study.effort.currentPhase = 'Completed';
  state.study.effort.currentEffort = 'completed';
  persistStudyState();
  renderStudyEffort();
  setStudyMessage('Effort Manipulation session completed. Continue to the post-study questionnaire.', false);
}

function getStudyEffortInstruction() {
  const effort = state.study.effort;
  if (effort.completed) return 'All three rounds are complete. Continue to the post-study questionnaire.';
  if (!effort.running) return 'Press start to begin the randomized effort manipulation sequence.';

  const phase = getStudyEffortPhases()[effort.currentPhaseIndex];
  if (!phase) return 'Preparing next cue.';
  return phase.instruction.replace('{CHORD}', effort.currentChord || '—');
}

function getStudyEffortTimeLeftMs() {
  const effort = state.study.effort;
  if (!effort.running) return 0;
  const phase = getStudyEffortPhases()[effort.currentPhaseIndex];
  if (!phase) return 0;
  return Math.max(0, phase.durationMs - (Date.now() - effort.phaseStartedAt));
}

function getStudyEffortTrialDurationMs() {
  return getStudyEffortPhases().reduce((sum, phase) => sum + phase.durationMs, 0);
}

function getStudyEffortTrialProgress(timeLeftMs, totalTrialDurationMs) {
  const effort = state.study.effort;
  if (effort.completed) return 100;
  if (!effort.running || totalTrialDurationMs <= 0) return 0;
  const elapsedMs = Math.max(0, totalTrialDurationMs - timeLeftMs - getStudyRemainingFutureEffortPhaseDurationMs(effort.currentPhaseIndex));
  return Math.max(0, Math.min(100, (elapsedMs / totalTrialDurationMs) * 100));
}

function getStudyEffortChordProgress() {
  const effort = state.study.effort;
  const phases = getStudyEffortPhases();
  const playablePhases = phases.filter((phase) => phase.key !== 'REST');
  const totalPlayableDurationMs = playablePhases.reduce((sum, phase) => sum + phase.durationMs, 0);

  if (effort.completed) return 100;
  if (!effort.running || totalPlayableDurationMs <= 0) return 0;

  const currentPhase = phases[effort.currentPhaseIndex];
  if (!currentPhase || currentPhase.key === 'REST') return 0;

  const elapsedBeforeCurrentMs = phases
    .slice(0, effort.currentPhaseIndex)
    .filter((phase) => phase.key !== 'REST')
    .reduce((sum, phase) => sum + phase.durationMs, 0);
  const elapsedInCurrentPhaseMs = Math.max(0, Math.min(currentPhase.durationMs, Date.now() - effort.phaseStartedAt));
  const chordElapsedMs = elapsedBeforeCurrentMs + elapsedInCurrentPhaseMs;

  return Math.max(0, Math.min(100, (chordElapsedMs / totalPlayableDurationMs) * 100));
}

function getStudyEffortRestProgress() {
  const effort = state.study.effort;
  const phases = getStudyEffortPhases();
  const currentPhase = phases[effort.currentPhaseIndex];

  if (effort.completed) return 100;
  if (!effort.running || !currentPhase || currentPhase.key !== 'REST' || currentPhase.durationMs <= 0) return 0;

  const elapsedInPhaseMs = Math.max(0, Math.min(currentPhase.durationMs, Date.now() - effort.phaseStartedAt));
  return Math.max(0, Math.min(100, (elapsedInPhaseMs / currentPhase.durationMs) * 100));
}

function getStudyRemainingFutureEffortPhaseDurationMs(currentPhaseIndex) {
  const phases = getStudyEffortPhases();
  if (!Number.isInteger(currentPhaseIndex) || currentPhaseIndex < 0) return 0;
  return phases.slice(currentPhaseIndex + 1).reduce((sum, phase) => sum + phase.durationMs, 0);
}

function setStudyStrummingSelectedChord(chord) {
  const normalizedChord = normalizeStudyStrummingChord(chord);
  if (!normalizedChord) return;
  if (state.study.strumming.running) return;
  state.study.strumming.selectedChord = normalizedChord;
  clearStudyMessage();
  persistStudyState();
  renderStudyStrumming();
}

function renderStudyStrummingChordPickerPreview(targetElement, chord) {
  if (!targetElement) return;
  if (targetElement.dataset.renderedChord === chord && targetElement.childElementCount > 0) return;
  targetElement.innerHTML = getStudyChordChartMarkup(chord);
  targetElement.dataset.renderedChord = chord;
}

function renderStudyStrumming() {
  if (
    !ui.studyStrummingStatus ||
    !ui.studyStrummingSpeed ||
    !ui.studyStrummingBeat ||
    !ui.studyStrummingTimer ||
    !ui.studyStrummingProgressBar ||
    !ui.studyStrummingSequenceHint
  ) {
    return;
  }

  const strumming = state.study.strumming;
  const sequence = Array.isArray(strumming.sequence) && strumming.sequence.length
    ? strumming.sequence
    : STUDY_STRUMMING_BPMS;
  const selectedChord = normalizeStudyStrummingChord(strumming.selectedChord);
  const totalTargetBeats = sequence.length * STUDY_STRUMMING_TOTAL_REPETITIONS;
  const currentBpm = strumming.currentBpm || sequence[0] || 0;
  const timeToNextCueMs = getStudyStrummingTimeToNextCueMs();
  const completedStrums = getStudyCompletedStudyStrummingCount(strumming, sequence);
  const overallProgress = strumming.completed
    ? 100
    : totalTargetBeats > 0
      ? Math.max(0, Math.min(100, (completedStrums / totalTargetBeats) * 100))
      : 0;
  const currentSpeedProgress = getStudyStrummingCurrentSessionProgress(strumming);
  const pulseIsActive = strumming.running
    && strumming.currentPhase === 'cued'
    && (Date.now() - (strumming.lastCueAt || 0)) < 160;
  const stageLabel = getStudyStrummingStageLabel(strumming);
  const timerLabel = getStudyStrummingTimerLabel(strumming);
  const timerValue = getStudyStrummingTimerValueText(strumming, timeToNextCueMs);
  const nextSpeedLabel = getStudyStrummingNextSpeedLabel();
  const canAdvanceSession = strumming.running && strumming.currentPhase === 'manual';

  ui.studyStrummingStatus.textContent = strumming.completed
    ? 'Completed'
    : strumming.running
      ? 'Running'
      : 'Ready';
  ui.studyStrummingSpeed.textContent = currentBpm ? `${currentBpm} BPM` : '— BPM';
  ui.studyStrummingBeat.textContent = stageLabel;
  ui.studyStrummingTimer.textContent = timerValue;
  ui.studyStrummingProgressBar.style.width = `${overallProgress}%`;

  if (ui.studyStrummingBpm) {
    ui.studyStrummingBpm.textContent = currentBpm ? `${currentBpm} BPM` : '— BPM';
  }
  if (ui.studyStrummingBeatCount) {
    ui.studyStrummingBeatCount.textContent = stageLabel;
  }
  if (ui.studyStrummingChordLabel) {
    ui.studyStrummingChordLabel.textContent = selectedChord || '—';
  }
  renderStudyStrummingChordPickerPreview(ui.studyStrummingChordPreviewC, 'C');
  renderStudyStrummingChordPickerPreview(ui.studyStrummingChordPreviewEm, 'Em');
  if (ui.studyStrummingChordChart) {
    renderStudyChordChart(ui.studyStrummingChordChart, selectedChord, {
      extraTitle: selectedChord ? 'Selected fretting chord' : '',
      extraText: selectedChord ? '' : '',
    });
    if (!selectedChord) {
      ui.studyStrummingChordChart.innerHTML = '<div class="study-live-chart-empty">Select C or Em to display the fretting chord.</div>';
    }
  }
  if (ui.studyStrummingPulse) {
    ui.studyStrummingPulse.classList.toggle('is-active', pulseIsActive);
  }
  if (ui.studyStrummingLiveTimerLabel) {
    ui.studyStrummingLiveTimerLabel.textContent = timerLabel;
  }
  if (ui.studyStrummingLiveTimer) {
    ui.studyStrummingLiveTimer.textContent = timerValue;
  }
  if (ui.studyStrummingNextSpeed) {
    ui.studyStrummingNextSpeed.textContent = nextSpeedLabel;
  }
  if (ui.studyStrummingLiveProgressBar) {
    ui.studyStrummingLiveProgressBar.style.width = `${currentSpeedProgress}%`;
  }
  if (ui.studyStrummingInstruction) {
    ui.studyStrummingInstruction.textContent = getStudyStrummingInstruction();
  }
  if (ui.studyStrummingNext) {
    ui.studyStrummingNext.hidden = !canAdvanceSession;
    ui.studyStrummingNext.disabled = !canAdvanceSession;
  }
  if (ui.studyStrummingChordC) {
    const isSelected = selectedChord === 'C';
    ui.studyStrummingChordC.classList.toggle('active', isSelected);
    ui.studyStrummingChordC.setAttribute('aria-pressed', String(isSelected));
    ui.studyStrummingChordC.disabled = strumming.running;
  }
  if (ui.studyStrummingChordEm) {
    const isSelected = selectedChord === 'Em';
    ui.studyStrummingChordEm.classList.toggle('active', isSelected);
    ui.studyStrummingChordEm.setAttribute('aria-pressed', String(isSelected));
    ui.studyStrummingChordEm.disabled = strumming.running;
  }
  if (ui.studyStrummingChordHint) {
    ui.studyStrummingChordHint.textContent = selectedChord
      ? `Selected chord: ${selectedChord}. The participant should fret this chord for all strumming speed blocks.`
      : 'Select the chord the participant should fret during all strumming speed blocks.';
  }
  if (ui.studyStrummingLiveCue) {
    ui.studyStrummingLiveCue.dataset.state = strumming.completed ? 'completed' : strumming.currentPhase || (strumming.running ? 'running' : 'idle');
  }

  ui.studyStrummingStart.disabled = strumming.running || !selectedChord;
  ui.studyStrummingStop.disabled = !strumming.running;
  if (ui.studyStrummingFullscreenFloating) {
    ui.studyStrummingFullscreenFloating.hidden = !strumming.running;
  }
  if (ui.studyStrummingStopFloating) {
    ui.studyStrummingStopFloating.hidden = !strumming.running;
  }

  if (ui.studyStrummingCount60) {
    ui.studyStrummingCount60.textContent = `${strumming.counts[60] || 0} / ${STUDY_STRUMMING_TOTAL_REPETITIONS}`;
  }
  if (ui.studyStrummingCount90) {
    ui.studyStrummingCount90.textContent = `${strumming.counts[90] || 0} / ${STUDY_STRUMMING_TOTAL_REPETITIONS}`;
  }
  if (ui.studyStrummingCount120) {
    ui.studyStrummingCount120.textContent = `${strumming.counts[120] || 0} / ${STUDY_STRUMMING_TOTAL_REPETITIONS}`;
  }
  if (ui.studyStrummingCount150) {
    ui.studyStrummingCount150.textContent = `${strumming.counts[150] || 0} / ${STUDY_STRUMMING_TOTAL_REPETITIONS}`;
  }

  if (strumming.completed) {
    ui.studyStrummingSequenceHint.textContent = `All ${sequence.length} speed blocks are complete.`;
  } else if (!strumming.running) {
    ui.studyStrummingSequenceHint.textContent = selectedChord
      ? `Selected chord: ${selectedChord}. Tempo blocks will run in order: 60 BPM, 90 BPM, 120 BPM, and 150 BPM, with ${formatStudyDurationLabel(STUDY_STRUMMING_REST_DURATION_MS)} of rest between speeds.`
      : `Select C or Em first. Then the tempo blocks will run in order: 60 BPM, 90 BPM, 120 BPM, and 150 BPM, with ${formatStudyDurationLabel(STUDY_STRUMMING_REST_DURATION_MS)} of rest between speeds.`;
  } else if (strumming.currentPhase === 'rest') {
    ui.studyStrummingSequenceHint.textContent = `Rest for ${formatStudyDurationLabel(STUDY_STRUMMING_REST_DURATION_MS)}. ${currentBpm} BPM starts automatically after the countdown.`;
  } else if (strumming.currentPhase === 'manual') {
    ui.studyStrummingSequenceHint.textContent = `Guided cues are complete for ${currentBpm} BPM. Ask the participant to strum ${STUDY_STRUMMING_SILENT_REPETITIONS} additional times without sound cues, then click Next.`;
  } else {
    ui.studyStrummingSequenceHint.textContent = `Guided cues in progress at ${currentBpm} BPM: ${strumming.currentBeat || 0} of ${STUDY_STRUMMING_CUED_REPETITIONS}.`;
  }

  const shouldFocusStrumming = Boolean(
    strumming.running &&
    state.study.currentStep === 6 &&
    ui.studyStrummingLiveCue &&
    ui.studyPage &&
    !ui.studyPage.hidden,
  );
  document.body.classList.toggle('study-strumming-focus', shouldFocusStrumming);
  if (shouldFocusStrumming) {
    document.body.classList.remove('study-calibration-focus');
    document.body.classList.remove('study-experiment-focus');
    document.body.classList.remove('study-effort-focus');
  }

  updateStudyFullscreenButtons();
}

function startStudyStrumming() {
  syncStudyStateFromForm();
  const missingQuestionId = STUDY_QUESTIONNAIRE_IDS.find((questionId) => !state.study.questionnaire.responses[questionId]);
  const selectedChord = normalizeStudyStrummingChord(state.study.strumming.selectedChord);
  if (!state.study.effort.completed) {
    setStudyMessage('Please finish the Effort Manipulation session before starting the strumming speed experiment.', true);
    return;
  }
  if (missingQuestionId) {
    setStudyMessage(`Please answer ${missingQuestionId} in the post-study questionnaire before starting the strumming speed experiment.`, true);
    return;
  }
  if (!selectedChord) {
    setStudyMessage('Please select C or Em as the fretting chord before starting the strumming speed experiment.', true);
    return;
  }

  if (state.study.currentStep !== 6) {
    state.study.currentStep = 6;
    renderStudyStep();
  }

  stopStudyStrumming({ resetState: false, resetMessage: false });

  const sequence = [...STUDY_STRUMMING_BPMS];
  state.study.strumming = {
    running: true,
    completed: false,
    sequence,
    selectedChord,
    currentSpeedIndex: 0,
    currentBpm: sequence[0],
    currentPhase: 'cued',
    currentBeat: 0,
    totalBeats: 0,
    speedStartedAt: 0,
    lastCueAt: 0,
    nextCueAt: 0,
    counts: createDefaultStudyStrummingCounts(),
    records: [],
    completedAt: '',
  };
  beginStudyStrummingCueBlock(0, Date.now(), { cueImmediately: true });

  studyStrummingTickHandle = window.setInterval(updateStudyStrummingClock, 50);
  clearStudyMessage();
  persistStudyState();
  renderStudyStrumming();
}

function stopStudyStrumming(options = {}) {
  const resetState = options.resetState !== false;
  const resetMessage = options.resetMessage !== false;

  if (studyStrummingTickHandle) {
    window.clearInterval(studyStrummingTickHandle);
    studyStrummingTickHandle = 0;
  }

  if (resetState) {
    state.study.strumming.running = false;
    state.study.strumming.currentSpeedIndex = -1;
    state.study.strumming.currentBpm = 0;
    state.study.strumming.currentPhase = 'idle';
    state.study.strumming.currentBeat = 0;
    state.study.strumming.lastCueAt = 0;
    state.study.strumming.nextCueAt = 0;
    state.study.strumming.speedStartedAt = 0;
    persistStudyState();
  }

  renderStudyStrumming();
  if (resetMessage) clearStudyMessage();
}

function updateStudyStrummingClock() {
  const strumming = state.study.strumming;
  if (!strumming.running) {
    stopStudyStrumming({ resetState: false, resetMessage: false });
    return;
  }

  if (strumming.currentPhase === 'rest' && (strumming.nextCueAt || 0) > 0 && Date.now() >= strumming.nextCueAt) {
    beginStudyStrummingCueBlock(strumming.currentSpeedIndex, Date.now(), { cueImmediately: true });
    return;
  }

  if (strumming.currentPhase === 'cued' && (strumming.nextCueAt || 0) > 0 && Date.now() >= strumming.nextCueAt) {
    triggerStudyStrummingCue(Date.now());
    return;
  }

  renderStudyStrumming();
}

function beginStudyStrummingCueBlock(speedIndex, now, options = {}) {
  const cueImmediately = options.cueImmediately !== false;
  const strumming = state.study.strumming;
  const sequence = Array.isArray(strumming.sequence) && strumming.sequence.length
    ? strumming.sequence
    : STUDY_STRUMMING_BPMS;
  const bpm = sequence[speedIndex];
  if (!bpm) {
    finishStudyStrumming();
    return;
  }

  strumming.currentSpeedIndex = speedIndex;
  strumming.currentBpm = bpm;
  strumming.currentPhase = 'cued';
  strumming.currentBeat = 0;
  strumming.speedStartedAt = 0;
  strumming.lastCueAt = 0;
  strumming.nextCueAt = cueImmediately ? now : now + getStudyStrummingBeatDurationMs(bpm);

  if (cueImmediately) {
    triggerStudyStrummingCue(now);
    return;
  }

  persistStudyState();
  renderStudyStrumming();
}

function triggerStudyStrummingCue(now) {
  const strumming = state.study.strumming;
  const sequence = Array.isArray(strumming.sequence) && strumming.sequence.length
    ? strumming.sequence
    : STUDY_STRUMMING_BPMS;
  const bpm = sequence[strumming.currentSpeedIndex];

  if (!strumming.running || !bpm || strumming.currentPhase !== 'cued') {
    finishStudyStrumming();
    return;
  }

  if ((strumming.currentBeat || 0) === 0) {
    strumming.speedStartedAt = now;
  }

  playStudyBeep();

  const beat = (strumming.currentBeat || 0) + 1;
  strumming.currentBpm = bpm;
  strumming.currentBeat = beat;
  strumming.lastCueAt = now;
  strumming.counts[bpm] = beat;
  strumming.totalBeats = getStudyCompletedStudyStrummingCount(strumming, sequence);
  strumming.records.push({
    type: 'guided-cue',
    phase: 'cued',
    speedIndex: strumming.currentSpeedIndex,
    bpm,
    beat,
    cuedAt: now,
  });

  if (beat >= STUDY_STRUMMING_CUED_REPETITIONS) {
    strumming.currentPhase = 'manual';
    strumming.nextCueAt = 0;
    strumming.lastCueAt = 0;
    persistStudyState();
    renderStudyStrumming();
    return;
  }

  strumming.nextCueAt = now + getStudyStrummingBeatDurationMs(bpm);
  persistStudyState();
  renderStudyStrumming();
}

function advanceStudyStrummingSession() {
  const strumming = state.study.strumming;
  if (!strumming.running || strumming.currentPhase !== 'manual') return;

  const now = Date.now();
  const sequence = Array.isArray(strumming.sequence) && strumming.sequence.length
    ? strumming.sequence
    : STUDY_STRUMMING_BPMS;
  const bpm = sequence[strumming.currentSpeedIndex];
  if (!bpm) {
    finishStudyStrumming();
    return;
  }

  strumming.counts[bpm] = STUDY_STRUMMING_TOTAL_REPETITIONS;
  strumming.totalBeats = getStudyCompletedStudyStrummingCount(strumming, sequence);
  strumming.records.push({
    type: 'manual-confirm',
    phase: 'manual',
    speedIndex: strumming.currentSpeedIndex,
    bpm,
    beat: STUDY_STRUMMING_TOTAL_REPETITIONS,
    completedAt: now,
  });

  const nextSpeedIndex = strumming.currentSpeedIndex + 1;
  if (nextSpeedIndex >= sequence.length) {
    finishStudyStrumming();
    return;
  }

  strumming.currentSpeedIndex = nextSpeedIndex;
  strumming.currentBpm = sequence[nextSpeedIndex];
  strumming.currentPhase = 'rest';
  strumming.currentBeat = 0;
  strumming.speedStartedAt = 0;
  strumming.lastCueAt = 0;
  strumming.nextCueAt = now + STUDY_STRUMMING_REST_DURATION_MS;
  persistStudyState();
  renderStudyStrumming();
}

function finishStudyStrumming() {
  if (studyStrummingTickHandle) {
    window.clearInterval(studyStrummingTickHandle);
    studyStrummingTickHandle = 0;
  }

  const lastBpm = STUDY_STRUMMING_BPMS[STUDY_STRUMMING_BPMS.length - 1];
  state.study.strumming.running = false;
  state.study.strumming.completed = true;
  state.study.strumming.completedAt = new Date().toISOString();
  state.study.strumming.currentPhase = 'completed';
  state.study.strumming.currentSpeedIndex = STUDY_STRUMMING_BPMS.length - 1;
  state.study.strumming.currentBpm = lastBpm;
  state.study.strumming.currentBeat = STUDY_STRUMMING_TOTAL_REPETITIONS;
  state.study.strumming.totalBeats = STUDY_STRUMMING_BPMS.length * STUDY_STRUMMING_TOTAL_REPETITIONS;
  state.study.strumming.nextCueAt = 0;
  state.study.strumming.counts = createDefaultStudyStrummingCounts();
  STUDY_STRUMMING_BPMS.forEach((bpm) => {
    state.study.strumming.counts[bpm] = STUDY_STRUMMING_TOTAL_REPETITIONS;
  });
  persistStudyState();
  renderStudyStrumming();
  setStudyMessage('Strumming speed experiment completed. Continue to the post-strumming questionnaire.', false);
}

function getStudyStrummingBeatDurationMs(bpm) {
  const numericBpm = Number(bpm);
  if (!Number.isFinite(numericBpm) || numericBpm <= 0) return 1000;
  return Math.round(60000 / numericBpm);
}

function getStudyStrummingTimeToNextCueMs() {
  const strumming = state.study.strumming;
  if (!strumming.running || !strumming.nextCueAt) return 0;
  return Math.max(0, strumming.nextCueAt - Date.now());
}

function getStudyStrummingNextSpeedLabel() {
  const strumming = state.study.strumming;
  const sequence = Array.isArray(strumming.sequence) && strumming.sequence.length
    ? strumming.sequence
    : STUDY_STRUMMING_BPMS;
  if (strumming.completed) return 'Finished';
  if (!sequence.length) return '—';
  if (strumming.currentPhase === 'rest') return `${strumming.currentBpm || sequence[0]} BPM`;
  const currentIndex = Math.max(-1, Number(strumming.currentSpeedIndex) || 0);
  const nextBpm = sequence[currentIndex + 1];
  return nextBpm ? `${nextBpm} BPM` : 'Finish';
}

function getStudyStrummingInstruction() {
  const strumming = state.study.strumming;
  const selectedChord = normalizeStudyStrummingChord(strumming.selectedChord);
  const currentBpm = strumming.currentBpm || STUDY_STRUMMING_BPMS[0];
  if (strumming.completed) return 'All strumming blocks are complete. Continue to the post-strumming questionnaire.';
  if (!strumming.running) {
    return selectedChord
      ? `Selected chord: ${selectedChord}. Press start to begin the guided strumming session at 60 BPM.`
      : 'Select C or Em as the fretting chord before starting the guided strumming session.';
  }
  if (strumming.currentPhase === 'rest') {
    return `Rest for ${formatStudyDurationLabel(STUDY_STRUMMING_REST_DURATION_MS)}. ${currentBpm} BPM begins automatically when the countdown reaches zero.`;
  }
  if (strumming.currentPhase === 'manual') {
    return `Please strum additional ${STUDY_STRUMMING_SILENT_REPETITIONS} times without the sound cues, then click Next when finished.`;
  }
  if ((strumming.currentBeat || 0) === 0) {
    return `Get ready for ${currentBpm} BPM. Match the first ${STUDY_STRUMMING_CUED_REPETITIONS} strums to the beep cues exactly.`;
  }

  const remainingBeats = Math.max(0, STUDY_STRUMMING_CUED_REPETITIONS - (strumming.currentBeat || 0));
  return `Keep strumming at ${currentBpm} BPM. Match every beep. ${remainingBeats} guided cue${remainingBeats === 1 ? '' : 's'} remaining.`;
}

function getStudyCompletedStudyStrummingCount(strumming, sequence = STUDY_STRUMMING_BPMS) {
  return sequence.reduce((sum, bpm) => sum + Math.max(0, Math.min(STUDY_STRUMMING_TOTAL_REPETITIONS, Number(strumming.counts?.[bpm]) || 0)), 0);
}

function getStudyStrummingCurrentSessionProgress(strumming) {
  if (strumming.completed) return 100;
  if (!strumming.running) return 0;
  if (strumming.currentPhase === 'manual') {
    return Math.round((STUDY_STRUMMING_CUED_REPETITIONS / STUDY_STRUMMING_TOTAL_REPETITIONS) * 100);
  }
  if (strumming.currentPhase !== 'cued') return 0;
  return Math.max(0, Math.min(100, ((strumming.currentBeat || 0) / STUDY_STRUMMING_TOTAL_REPETITIONS) * 100));
}

function getStudyStrummingStageLabel(strumming) {
  if (strumming.completed) return 'Complete';
  if (!strumming.running) return 'Ready';
  if (strumming.currentPhase === 'rest') return 'Rest';
  if (strumming.currentPhase === 'manual') return `Silent ${STUDY_STRUMMING_SILENT_REPETITIONS} more`;
  return `Guided ${strumming.currentBeat || 0} / ${STUDY_STRUMMING_CUED_REPETITIONS}`;
}

function getStudyStrummingTimerLabel(strumming) {
  if (strumming.currentPhase === 'rest') return 'Rest remaining';
  if (strumming.currentPhase === 'manual') return 'Waiting for Next';
  if (strumming.currentPhase === 'cued') return 'Time to next beep';
  if (strumming.completed) return 'Session status';
  return 'Time to next beep';
}

function getStudyStrummingTimerValueText(strumming, timeToNextCueMs) {
  if (strumming.currentPhase === 'rest' || strumming.currentPhase === 'cued') {
    return `${formatSeconds(timeToNextCueMs / 1000)} s`;
  }
  if (strumming.completed) return '—';
  if (!strumming.running) return '0.0 s';
  return '—';
}

function formatSeconds(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

function playStudyBeep() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  if (!studyAudioContext) {
    studyAudioContext = new AudioCtor();
  }

  if (studyAudioContext.state === 'suspended') {
    studyAudioContext.resume().catch(() => {});
  }

  const startAt = studyAudioContext.currentTime;
  const gain = studyAudioContext.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);
  gain.connect(studyAudioContext.destination);

  const oscillator = studyAudioContext.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(1046.5, startAt);
  oscillator.connect(gain);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.18);
}

function setStudyMessage(message, isError) {
  ui.studyMessage.textContent = message;
  ui.studyMessage.classList.toggle('error', Boolean(isError));
  ui.studyMessage.setAttribute('role', isError ? 'alert' : 'status');
  ui.studyMessage.setAttribute('aria-live', isError ? 'assertive' : 'polite');
  return false;
}

function clearStudyMessage() {
  ui.studyMessage.textContent = '';
  ui.studyMessage.classList.remove('error');
}

function isPositiveNumber(value, options = {}) {
  const allowZero = Boolean(options.allowZero);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return false;
  return allowZero ? parsed >= 0 : parsed > 0;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#39;';
  });
}

async function connectSensor(sensorId) {
  const sensor = getSensor(sensorId);
  try {
    log(`Selecting BLE device for sensor #${sensorId}...`);
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [NUS_SERVICE],
    });

    sensor.device = device;
    sensor.name = device.name || device.id || sensor.defaultName;
    device.addEventListener('gattserverdisconnected', () => onDisconnected(sensorId));

    log(`Connecting sensor #${sensorId}: ${sensor.name}`);
    const server = await device.gatt.connect();
    sensor.server = server;
    const service = await server.getPrimaryService(NUS_SERVICE);
    sensor.txChar = await service.getCharacteristic(NUS_TX_CHAR);
    sensor.rxChar = await service.getCharacteristic(NUS_RX_CHAR);

    await sensor.rxChar.startNotifications();
    sensor.rxChar.addEventListener('characteristicvaluechanged', (event) => {
      handleNotification(sensorId, event.target.value);
    });

    await writeTx(sensor.txChar, new Uint8Array([1]));
    sensor.connected = true;
    updateConnectionUI();
    log(`Sensor #${sensorId} connected`);
  } catch (error) {
    log(`Connect sensor #${sensorId} failed: ${error.message || error}`);
    sensor.connected = false;
    updateConnectionUI();
  }
}

async function connectPressureSensor() {
  const sensorId = 3;
  const sensor = getSensor(sensorId);
  try {
    log('Selecting BLE pressure device...');
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [PRESSURE_SERVICE] }],
      optionalServices: [PRESSURE_SERVICE],
    });

    sensor.device = device;
    sensor.name = device.name || device.id || sensor.defaultName;
    device.addEventListener('gattserverdisconnected', () => onDisconnected(sensorId));

    log(`Connecting pressure sensor: ${sensor.name}`);
    const server = await device.gatt.connect();
    sensor.server = server;
    const service = await server.getPrimaryService(PRESSURE_SERVICE);
    sensor.rxChar = await service.getCharacteristic(PRESSURE_CHAR);

    await sensor.rxChar.startNotifications();
    sensor.rxChar.addEventListener('characteristicvaluechanged', (event) => {
      handleNotification(sensorId, event.target.value);
    });

    sensor.connected = true;
    updateConnectionUI();
    log('Pressure sensor connected');
  } catch (error) {
    log(`Connect pressure sensor failed: ${error.message || error}`);
    sensor.connected = false;
    updateConnectionUI();
  }
}

function disconnectSensor(sensorId) {
  const sensor = getSensor(sensorId);
  try {
    if (sensor.device?.gatt?.connected) {
      sensor.device.gatt.disconnect();
    }
  } catch (_) {
    // no-op
  }
  onDisconnected(sensorId);
}

function onDisconnected(sensorId) {
  const sensor = getSensor(sensorId);
  sensor.connected = false;
  sensor.server = null;
  sensor.txChar = null;
  sensor.rxChar = null;
  sensor.device = null;
  sensor.name = sensor.defaultName;
  sensor.rxBuffer = new Uint8Array(0);

  if (!state.sensor1.connected && !state.sensor2.connected) {
    state.isMeasuring = false;
    updateStartStopButton();
  }

  updateConnectionUI();
  log(`Sensor #${sensorId} disconnected`);
}

async function sendCommandToConnected() {
  const frequency = parseInt(ui.frequency.value || '50000', 10);
  const resistance = parseInt(ui.resistance.value, 10);
  const sweepEnabled = ui.sweep.checked;
  const startBit = state.isMeasuring ? 1 : 0;
  const sweepBit = sweepEnabled ? 2 : 0;
  const command = startBit | sweepBit;

  const safeFrequency = Number.isFinite(frequency) ? clampUInt32(frequency) : 50000;
  const safeResistance = Number.isFinite(resistance) ? clampUInt32(resistance) : 1;
  const bytes = encodeCommandPacket(command, safeFrequency, safeResistance);
  const hex = toHex(bytes);

  let sent = 0;
  for (const sensor of [state.sensor1, state.sensor2]) {
    if (!sensor.connected || !sensor.txChar) continue;
    try {
      if (state.isMeasuring) {
        await writeTx(sensor.txChar, new Uint8Array([1]), { preferResponse: false });
      }
      await writeTx(sensor.txChar, bytes, { preferResponse: true });
      sent += 1;
      log(`TX ${sensor.name}: ${hex}`);
    } catch (error) {
      log(`Command send failed (${sensor.name}): ${error.message || error}`);
    }
  }

  if (sent === 0) {
    log('No connected sensor to send command');
  } else {
    log(`Command sent to ${sent} sensor(s): cmd=${command} freq=${safeFrequency} res=${safeResistance} sweep=${sweepEnabled}`);
  }
}

function handleNotification(sensorId, dataView) {
  const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
  if (!bytes.length) return;

  const sensor = getSensor(sensorId);
  state.latestRaw = bytes.slice();

  sensor.rxBuffer = concatUint8(sensor.rxBuffer, bytes);
  const { packets, remaining } = extractPackets(sensor.rxBuffer);
  sensor.rxBuffer = remaining;

  const parsed = [];
  packets.forEach((packet) => {
    const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    parsed.push(...parseBinaryAll(view));
  });

  parsed.forEach((item) => {
    if (item.type === 'EIS') {
      sensor.latestEis = item;
      sensor.dirtyEis = true;
      sensor.rateEis += 1;
      sensor.totalEis += 1;
      appendRecordingLine(sensorId, 'EIS', item);
    } else if (item.type === 'IMU') {
      sensor.latestImu = item;
      sensor.dirtyImu = true;
      sensor.rateImu += 1;
      sensor.totalImu += 1;
      appendRecordingLine(sensorId, 'IMU', item);
    } else if (item.type === 'PRESSURE') {
      sensor.latestPressure = item;
      sensor.dirtyPressure = true;
      sensor.ratePressure += 1;
      sensor.totalPressure += 1;
      appendRecordingLine(sensorId, 'PRESSURE', item);
    }
  });
}

function extractPackets(buffer) {
  const packets = [];
  let cursor = 0;

  while (buffer.length - cursor >= 4) {
    const id = readUInt32LE(buffer, cursor);
    const lengths = expectedLengthsForId(id);

    if (!lengths.length) {
      const next = findNextPacketStart(buffer, cursor + 1);
      if (next === -1) {
        cursor = Math.max(buffer.length - 3, 0);
        break;
      }
      cursor = next;
      continue;
    }

    const remaining = buffer.length - cursor;
    let packetLen = choosePacketLength(buffer, cursor, lengths);
    if (!packetLen) {
      break;
    }
    if (remaining < packetLen) {
      break;
    }

    packets.push(buffer.slice(cursor, cursor + packetLen));
    cursor += packetLen;
  }

  return {
    packets,
    remaining: buffer.slice(cursor),
  };
}

function expectedLengthsForId(id) {
  if (id === 1) return [40, 20];
  if (id === 2) return [28];
  if (id === 3) return [64, 24];
  if (id === 4) return [8];
  return [];
}

function choosePacketLength(buffer, offset, lengths) {
  const remaining = buffer.length - offset;
  const sorted = [...lengths].sort((a, b) => b - a);
  for (const len of sorted) {
    if (remaining < len) continue;

    const alt = sorted.find((other) => other !== len && remaining >= other);
    if (!alt) return len;

    const splitPos = offset + alt;
    if (isPacketStart(buffer, splitPos)) {
      return alt;
    }
    return len;
  }
  return 0;
}

function isPacketStart(buffer, offset) {
  if (offset + 4 > buffer.length) return false;
  const id = readUInt32LE(buffer, offset);
  return id === 1 || id === 2 || id === 3 || id === 4;
}

function findNextPacketStart(buffer, start) {
  for (let index = start; index <= buffer.length - 4; index += 1) {
    if (isPacketStart(buffer, index)) return index;
  }
  return -1;
}

function readUInt32LE(buffer, offset) {
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  ) >>> 0;
}

function concatUint8(left, right) {
  if (!left.length) return right.slice();
  if (!right.length) return left.slice();
  const merged = new Uint8Array(left.length + right.length);
  merged.set(left, 0);
  merged.set(right, left.length);
  return merged;
}

function parseBinaryAll(view) {
  if (view.byteLength < 4) return [];
  const id = view.getInt32(0, true);
  if (id === 1) return [parseEis(view)].filter(Boolean);
  if (id === 2) return [parseImu(view)].filter(Boolean);
  if (id === 3) {
    if (view.byteLength >= 64) {
      return [parseCombinedEis(view), parseCombinedImu(view)].filter(Boolean);
    }
    return [];
  }
  if (id === 4) return [parsePressure(view)].filter(Boolean);
  return [];
}

function parsePressure(view) {
  if (view.byteLength < 8) return null;
  return {
    type: 'PRESSURE',
    timestamp: Date.now(),
    adc: view.getInt32(4, true),
  };
}

function parseEis(view) {
  if (view.byteLength < 8) return null;
  const deg = (radians) => radians * (180 / Math.PI);
  const f32 = (offset) => (offset + 4 <= view.byteLength ? view.getFloat32(offset, true) : 0);
  return {
    type: 'EIS',
    timestamp: Date.now(),
    frequency: f32(4),
    magnitude1: f32(8),
    phase1: deg(f32(12)),
    magnitude2: f32(16),
    phase2: deg(f32(20)),
    magnitude3: f32(24),
    phase3: deg(f32(28)),
    magnitude4: f32(32),
    phase4: deg(f32(36)),
  };
}

function parseImu(view) {
  if (view.byteLength < 8) return null;
  const f32 = (offset) => (offset + 4 <= view.byteLength ? view.getFloat32(offset, true) : 0);
  return {
    type: 'IMU',
    timestamp: Date.now(),
    ax: f32(4),
    ay: f32(8),
    az: f32(12),
    gx: f32(16),
    gy: f32(20),
    gz: f32(24),
  };
}

function parseCombinedEis(view) {
  return parseEis(view);
}

function parseCombinedImu(view) {
  if (view.byteLength < 64) return null;
  const f32 = (offset) => (offset + 4 <= view.byteLength ? view.getFloat32(offset, true) : 0);
  return {
    type: 'IMU',
    timestamp: Date.now(),
    ax: f32(40),
    ay: f32(44),
    az: f32(48),
    gx: f32(52),
    gy: f32(56),
    gz: f32(60),
  };
}

function uiTick() {
  const now = Date.now();
  if (now >= nextRateMs) {
    nextRateMs = now + 1000;
    updateRateUI();
    if (state.recording.active) {
      const elapsedSec = Math.floor((now - state.recording.startMs) / 1000);
      ui.recTimer.textContent = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`;
    }
  }

  if (state.sensor1.dirtyEis) {
    state.sensor1.dirtyEis = false;
    renderEis(1, state.sensor1.latestEis);
  }
  if (state.sensor1.dirtyImu) {
    state.sensor1.dirtyImu = false;
    renderImu(1, state.sensor1.latestImu);
  }
  if (state.sensor2.dirtyEis) {
    state.sensor2.dirtyEis = false;
    renderEis(2, state.sensor2.latestEis);
  }
  if (state.sensor2.dirtyImu) {
    state.sensor2.dirtyImu = false;
    renderImu(2, state.sensor2.latestImu);
  }
  if (state.sensor3.dirtyPressure) {
    state.sensor3.dirtyPressure = false;
    renderPressure(state.sensor3.latestPressure);
  }
  if (state.latestRaw) {
    renderRaw(state.latestRaw);
    state.latestRaw = null;
  }
}

function updateRateUI() {
  ui.rateEis1.textContent = `${state.sensor1.rateEis} Hz`;
  ui.rateImu1.textContent = `${state.sensor1.rateImu} Hz`;
  ui.rateEis2.textContent = `${state.sensor2.rateEis} Hz`;
  ui.rateImu2.textContent = `${state.sensor2.rateImu} Hz`;
  ui.ratePressure3.textContent = `${state.sensor3.ratePressure} Hz`;

  ui.totalEis1.textContent = `${state.sensor1.totalEis} pkts`;
  ui.totalImu1.textContent = `${state.sensor1.totalImu} pkts`;
  ui.totalEis2.textContent = `${state.sensor2.totalEis} pkts`;
  ui.totalImu2.textContent = `${state.sensor2.totalImu} pkts`;
  ui.totalPressure3.textContent = `${state.sensor3.totalPressure} pkts`;

  state.sensor1.rateEis = 0;
  state.sensor1.rateImu = 0;
  state.sensor2.rateEis = 0;
  state.sensor2.rateImu = 0;
  state.sensor3.ratePressure = 0;
}

function updateConnectionUI() {
  ui.status1.textContent = state.sensor1.connected ? state.sensor1.name : 'Not connected';
  ui.status2.textContent = state.sensor2.connected ? state.sensor2.name : 'Not connected';
  ui.status3.textContent = state.sensor3.connected ? state.sensor3.name : 'Not connected';
  ui.status1.classList.toggle('ok', state.sensor1.connected);
  ui.status2.classList.toggle('ok', state.sensor2.connected);
  ui.status3.classList.toggle('ok', state.sensor3.connected);
  ui.btnConnect1.textContent = state.sensor1.connected ? 'Disconnect Sensor 1' : 'Connect Sensor 1';
  ui.btnConnect2.textContent = state.sensor2.connected ? 'Disconnect Sensor 2' : 'Connect Sensor 2';
  ui.btnConnect3.textContent = state.sensor3.connected ? 'Disconnect Sensor 3 (Pressure)' : 'Connect Sensor 3 (Pressure)';
  ui.btnStartStop.disabled = !state.sensor1.connected && !state.sensor2.connected;
}

function updateStartStopButton() {
  ui.btnStartStop.textContent = state.isMeasuring ? 'Stop' : 'Start';
  ui.btnStartStop.classList.toggle('stop', state.isMeasuring);
  ui.btnStartStop.classList.toggle('start', !state.isMeasuring);
}

function renderRaw(bytes) {
  const id = bytes.length >= 4
    ? (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24))
    : -1;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  ui.rawPacket.textContent = `dataID=${id} len=${bytes.length}\n${hex}`;
}

function renderEis(sensorId, data) {
  if (!data) return;
  const target = sensorId === 1 ? ui.eis1Values : ui.eis2Values;
  target.innerHTML = [
    kv('Frequency', `${data.frequency.toFixed(0)} Hz`),
    kv('Mag1', `${data.magnitude1.toFixed(1)} Ω`),
    kv('Phase1', `${data.phase1.toFixed(1)}°`),
    kv('Mag2', `${data.magnitude2.toFixed(1)} Ω`),
    kv('Phase2', `${data.phase2.toFixed(1)}°`),
    kv('Mag3', `${data.magnitude3.toFixed(1)} Ω`),
    kv('Phase3', `${data.phase3.toFixed(1)}°`),
    kv('Mag4', `${data.magnitude4.toFixed(1)} Ω`),
    kv('Phase4', `${data.phase4.toFixed(1)}°`),
  ].join('');

  pushChart(charts[`eisMag${sensorId}`], [
    data.magnitude1,
    data.magnitude2,
    data.magnitude3,
    data.magnitude4,
  ]);

  pushChart(charts[`eisMag${sensorId}Ch1`], [data.magnitude1]);
  pushChart(charts[`eisMag${sensorId}Ch2`], [data.magnitude2]);
  pushChart(charts[`eisMag${sensorId}Ch3`], [data.magnitude3]);
  pushChart(charts[`eisMag${sensorId}Ch4`], [data.magnitude4]);

  pushChart(charts[`eisPhase${sensorId}`], [
    data.phase1,
    data.phase2,
    data.phase3,
    data.phase4,
  ]);

  pushChart(charts[`eisPhase${sensorId}Ch1`], [data.phase1]);
  pushChart(charts[`eisPhase${sensorId}Ch2`], [data.phase2]);
  pushChart(charts[`eisPhase${sensorId}Ch3`], [data.phase3]);
  pushChart(charts[`eisPhase${sensorId}Ch4`], [data.phase4]);

  updateCompareEisCharts();
}

function renderImu(sensorId, data) {
  if (!data) return;
  const target = sensorId === 1 ? ui.imu1Values : ui.imu2Values;
  target.innerHTML = [
    kv('Ax', data.ax.toFixed(2)),
    kv('Ay', data.ay.toFixed(2)),
    kv('Az', data.az.toFixed(2)),
    kv('Gx', data.gx.toFixed(2)),
    kv('Gy', data.gy.toFixed(2)),
    kv('Gz', data.gz.toFixed(2)),
  ].join('');

  pushChart(charts[`imuAcc${sensorId}`], [data.ax, data.ay, data.az]);
  pushChart(charts[`imuGyro${sensorId}`], [data.gx, data.gy, data.gz]);
}

function renderPressure(data) {
  if (!data) return;
  ui.pressure3Values.innerHTML = [
    kv('Datatype', '4'),
    kv('ADC', String(data.adc)),
  ].join('');

  pushChart(charts.pressure3, [data.adc]);
}

function renderEmptyValueGrids() {
  const blankEis = [
    kv('Frequency', '--'), kv('Mag1', '--'), kv('Phase1', '--'), kv('Mag2', '--'),
    kv('Phase2', '--'), kv('Mag3', '--'), kv('Phase3', '--'), kv('Mag4', '--'), kv('Phase4', '--'),
  ].join('');
  const blankImu = [
    kv('Ax', '--'), kv('Ay', '--'), kv('Az', '--'), kv('Gx', '--'), kv('Gy', '--'), kv('Gz', '--'),
  ].join('');
  const blankPressure = [
    kv('Datatype', '--'), kv('ADC', '--'),
  ].join('');
  ui.eis1Values.innerHTML = blankEis;
  ui.eis2Values.innerHTML = blankEis;
  ui.imu1Values.innerHTML = blankImu;
  ui.imu2Values.innerHTML = blankImu;
  ui.pressure3Values.innerHTML = blankPressure;
}

function kv(key, value) {
  return `<div><strong>${key}</strong>: ${value}</div>`;
}

function setupCharts() {
  charts.eisMag1 = makeMultiLineChart('chartEisMag1', ['Mag1', 'Mag2', 'Mag3', 'Mag4'], ['#00ffcc', '#5dffa5', '#8bff79', '#c3ff56']);
  charts.eisPhase1 = makeMultiLineChart('chartEisPhase1', ['Phase1', 'Phase2', 'Phase3', 'Phase4'], ['#3bc2ff', '#4c9cff', '#6d7fff', '#905fff']);
  charts.imuAcc1 = makeMultiLineChart('chartImuAcc1', ['Ax', 'Ay', 'Az'], ['#00ffcc', '#5dffa5', '#8bff79']);
  charts.imuGyro1 = makeMultiLineChart('chartImuGyro1', ['Gx', 'Gy', 'Gz'], ['#ff9f43', '#ff7b43', '#ff5f99']);

  charts.eisMag2 = makeMultiLineChart('chartEisMag2', ['Mag1', 'Mag2', 'Mag3', 'Mag4'], ['#ff9f43', '#ffbc43', '#ffd543', '#ffe643']);
  charts.eisPhase2 = makeMultiLineChart('chartEisPhase2', ['Phase1', 'Phase2', 'Phase3', 'Phase4'], ['#ff5f99', '#ff7d8f', '#ff9a8a', '#ffb886']);
  charts.imuAcc2 = makeMultiLineChart('chartImuAcc2', ['Ax', 'Ay', 'Az'], ['#ff9f43', '#ffbc43', '#ffd543']);
  charts.imuGyro2 = makeMultiLineChart('chartImuGyro2', ['Gx', 'Gy', 'Gz'], ['#ff5f99', '#ff7d8f', '#ff9a8a']);
  charts.pressure3 = makeMultiLineChart('chartPressure3', ['Pressure ADC'], ['#3bc2ff']);

  charts.eisMag1Ch1 = makeMultiLineChart('chartEisMag1Ch1', ['Mag1'], ['#00ffcc']);
  charts.eisMag1Ch2 = makeMultiLineChart('chartEisMag1Ch2', ['Mag2'], ['#5dffa5']);
  charts.eisMag1Ch3 = makeMultiLineChart('chartEisMag1Ch3', ['Mag3'], ['#8bff79']);
  charts.eisMag1Ch4 = makeMultiLineChart('chartEisMag1Ch4', ['Mag4'], ['#c3ff56']);
  charts.eisPhase1Ch1 = makeMultiLineChart('chartEisPhase1Ch1', ['Phase1'], ['#3bc2ff']);
  charts.eisPhase1Ch2 = makeMultiLineChart('chartEisPhase1Ch2', ['Phase2'], ['#4c9cff']);
  charts.eisPhase1Ch3 = makeMultiLineChart('chartEisPhase1Ch3', ['Phase3'], ['#6d7fff']);
  charts.eisPhase1Ch4 = makeMultiLineChart('chartEisPhase1Ch4', ['Phase4'], ['#905fff']);

  charts.eisMag2Ch1 = makeMultiLineChart('chartEisMag2Ch1', ['Mag1'], ['#ff9f43']);
  charts.eisMag2Ch2 = makeMultiLineChart('chartEisMag2Ch2', ['Mag2'], ['#ffbc43']);
  charts.eisMag2Ch3 = makeMultiLineChart('chartEisMag2Ch3', ['Mag3'], ['#ffd543']);
  charts.eisMag2Ch4 = makeMultiLineChart('chartEisMag2Ch4', ['Mag4'], ['#ffe643']);
  charts.eisPhase2Ch1 = makeMultiLineChart('chartEisPhase2Ch1', ['Phase1'], ['#ff5f99']);
  charts.eisPhase2Ch2 = makeMultiLineChart('chartEisPhase2Ch2', ['Phase2'], ['#ff7d8f']);
  charts.eisPhase2Ch3 = makeMultiLineChart('chartEisPhase2Ch3', ['Phase3'], ['#ff9a8a']);
  charts.eisPhase2Ch4 = makeMultiLineChart('chartEisPhase2Ch4', ['Phase4'], ['#ffb886']);

  charts.cmpMagCh1 = makeMultiLineChart('chartCmpMagCh1', ['S1 Mag1', 'S2 Mag1'], ['#00ffcc', '#ff9f43']);
  charts.cmpMagCh2 = makeMultiLineChart('chartCmpMagCh2', ['S1 Mag2', 'S2 Mag2'], ['#5dffa5', '#ffbc43']);
  charts.cmpMagCh3 = makeMultiLineChart('chartCmpMagCh3', ['S1 Mag3', 'S2 Mag3'], ['#8bff79', '#ffd543']);
  charts.cmpMagCh4 = makeMultiLineChart('chartCmpMagCh4', ['S1 Mag4', 'S2 Mag4'], ['#c3ff56', '#ffe643']);
  charts.cmpPhaseCh1 = makeMultiLineChart('chartCmpPhaseCh1', ['S1 Phase1', 'S2 Phase1'], ['#3bc2ff', '#ff5f99']);
  charts.cmpPhaseCh2 = makeMultiLineChart('chartCmpPhaseCh2', ['S1 Phase2', 'S2 Phase2'], ['#4c9cff', '#ff7d8f']);
  charts.cmpPhaseCh3 = makeMultiLineChart('chartCmpPhaseCh3', ['S1 Phase3', 'S2 Phase3'], ['#6d7fff', '#ff9a8a']);
  charts.cmpPhaseCh4 = makeMultiLineChart('chartCmpPhaseCh4', ['S1 Phase4', 'S2 Phase4'], ['#905fff', '#ffb886']);
}

function applyEisViewMode() {
  const together = state.eisChannelMode === 'together';
  const separateMode = state.eisChannelMode === 'separate';
  const compareMode = state.eisChannelMode === 'compare';

  const cardEis1 = document.getElementById('cardEis1');
  const cardEis2 = document.getElementById('cardEis2');
  const cardCompare = document.getElementById('cardEisCompare');

  if (cardEis1) cardEis1.style.display = compareMode ? 'none' : 'block';
  if (cardEis2) cardEis2.style.display = compareMode ? 'none' : 'block';
  if (cardCompare) cardCompare.style.display = compareMode ? 'block' : 'none';

  for (const sensorId of [1, 2]) {
    const combined = document.getElementById(`eisCombined${sensorId}`);
    const separate = document.getElementById(`eisSeparate${sensorId}`);
    if (combined) combined.style.display = together ? 'block' : 'none';
    if (separate) separate.style.display = separateMode ? 'grid' : 'none';
  }
}

function updateCompareEisCharts() {
  const d1 = state.sensor1.latestEis;
  const d2 = state.sensor2.latestEis;

  if (!d1 && !d2) return;

  pushChart(charts.cmpMagCh1, [d1?.magnitude1, d2?.magnitude1]);
  pushChart(charts.cmpMagCh2, [d1?.magnitude2, d2?.magnitude2]);
  pushChart(charts.cmpMagCh3, [d1?.magnitude3, d2?.magnitude3]);
  pushChart(charts.cmpMagCh4, [d1?.magnitude4, d2?.magnitude4]);

  pushChart(charts.cmpPhaseCh1, [d1?.phase1, d2?.phase1]);
  pushChart(charts.cmpPhaseCh2, [d1?.phase2, d2?.phase2]);
  pushChart(charts.cmpPhaseCh3, [d1?.phase3, d2?.phase3]);
  pushChart(charts.cmpPhaseCh4, [d1?.phase4, d2?.phase4]);
}

function makeMultiLineChart(canvasId, labels, colors) {
  const datasets = labels.map((label, index) => ({
    label,
    borderColor: colors[index],
    backgroundColor: colors[index],
    pointRadius: 0,
    borderWidth: 1.5,
    data: [],
    tension: 0,
  }));

  return new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: [],
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: { legend: { display: true, labels: { color: '#d7deea' } } },
      scales: {
        x: { ticks: { display: false }, grid: { color: '#1f2330' } },
        y: { ticks: { color: '#d7deea' }, grid: { color: '#1f2330' } },
      },
    },
  });
}

function pushChart(chart, values) {
  if (!chart) return;
  chart.data.labels.push(chart.data.labels.length);
  chart.data.datasets.forEach((dataset, index) => {
    const nextValue = values[index];
    dataset.data.push(nextValue === undefined ? null : nextValue);
    if (dataset.data.length > MAX_POINTS) dataset.data.shift();
  });
  if (chart.data.labels.length > MAX_POINTS) chart.data.labels.shift();
  chart.update('none');
}

function setupLabelButtons() {
  ui.labelRow.innerHTML = '';
  state.labels.forEach((label, index) => {
    const button = document.createElement('button');
    button.className = 'label-btn';
    button.textContent = label;
    button.addEventListener('click', () => {
      state.selectedLabelIndex = index;
      state.currentDataLabel = button.textContent;
      refreshLabelButtons();
    });
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const renamed = window.prompt(`Rename label ${index}`, button.textContent);
      if (!renamed || !renamed.trim()) return;
      button.textContent = renamed.trim();
      state.labels[index] = button.textContent;
      if (state.selectedLabelIndex === index) state.currentDataLabel = button.textContent;
      refreshLabelButtons();
    });
    ui.labelRow.appendChild(button);
  });
  refreshLabelButtons();
}

function refreshLabelButtons() {
  [...ui.labelRow.querySelectorAll('.label-btn')].forEach((button, index) => {
    button.classList.toggle('active', index === state.selectedLabelIndex);
  });
}

function startRecording() {
  if (!state.sensor1.connected && !state.sensor2.connected && !state.sensor3.connected) {
    log('No sensor connected');
    return;
  }
  const customName = window.prompt('Enter save name (e.g. Subject01)');
  if (!customName || !customName.trim()) return;

  const timestampTag = formatTimestampTag(new Date());
  state.recording.active = true;
  state.recording.startMs = Date.now();
  state.recording.customName = sanitizeNamePart(customName);
  state.recording.timestampTag = timestampTag;
  state.recording.files = {};

  for (const sensorId of [1, 2]) {
    const sensor = getSensor(sensorId);
    const base = `${sanitizeNamePart(sensor.name)}_${state.recording.customName}_${timestampTag}`;
    state.recording.files[`${sensorId}_EIS`] = [
      `timestamp_ms,frequency,mag1,phase1,mag2,phase2,mag3,phase3,mag4,phase4,label`,
    ];
    state.recording.files[`${sensorId}_IMU`] = [
      `timestamp_ms,ax,ay,az,gx,gy,gz,label`,
    ];
    state.recording.files[`${sensorId}_EIS_name`] = `${base}_EIS.csv`;
    state.recording.files[`${sensorId}_IMU_name`] = `${base}_IMU.csv`;
  }

  const pressureBase = `${sanitizeNamePart(state.sensor3.name)}_${state.recording.customName}_${timestampTag}`;
  state.recording.files['3_PRESSURE'] = [
    'timestamp_ms,datatype,adc,label',
  ];
  state.recording.files['3_PRESSURE_name'] = `${pressureBase}_Pressure.csv`;

  ui.btnSave.textContent = 'Stop & Save';
  ui.recStatus.textContent = 'Recording…';
  ui.saveStatus.textContent = '';
  document.querySelector('.recorder')?.classList.add('recording-active');
}

function appendRecordingLine(sensorId, type, data) {
  if (!state.recording.active) return;
  const key = `${sensorId}_${type}`;
  const bucket = state.recording.files[key];
  if (!bucket) return;

  if (type === 'EIS') {
    bucket.push([
      Date.now(),
      data.frequency,
      data.magnitude1,
      data.phase1,
      data.magnitude2,
      data.phase2,
      data.magnitude3,
      data.phase3,
      data.magnitude4,
      data.phase4,
      csvEscape(state.currentDataLabel),
    ].join(','));
  } else if (type === 'IMU') {
    bucket.push([
      Date.now(),
      data.ax,
      data.ay,
      data.az,
      data.gx,
      data.gy,
      data.gz,
      csvEscape(state.currentDataLabel),
    ].join(','));
  } else if (type === 'PRESSURE') {
    bucket.push([
      Date.now(),
      4,
      data.adc,
      csvEscape(state.currentDataLabel),
    ].join(','));
  }
}

function stopRecording({ save }) {
  if (!state.recording.active) return;
  state.recording.active = false;
  ui.btnSave.textContent = '⏺ Save Data';
  ui.recTimer.textContent = '';
  document.querySelector('.recorder')?.classList.remove('recording-active');

  if (!save) {
    ui.recStatus.textContent = 'Ready to record';
    ui.saveStatus.textContent = '';
    state.recording.files = {};
    return;
  }

  const downloaded = [];
  for (const sensorId of [1, 2]) {
    for (const type of ['EIS', 'IMU']) {
      const key = `${sensorId}_${type}`;
      const nameKey = `${key}_name`;
      const lines = state.recording.files[key] || [];
      if (lines.length <= 1) continue;
      const filename = state.recording.files[nameKey];
      downloadText(filename, `${lines.join('\n')}\n`);
      downloaded.push(filename);
    }
  }

  const pressureLines = state.recording.files['3_PRESSURE'] || [];
  if (pressureLines.length > 1) {
    const pressureFile = state.recording.files['3_PRESSURE_name'];
    downloadText(pressureFile, `${pressureLines.join('\n')}\n`);
    downloaded.push(pressureFile);
  }

  ui.recStatus.textContent = downloaded.length
    ? `Saved ${downloaded.length} file(s) to Downloads`
    : 'No data captured';
  ui.saveStatus.textContent = downloaded.join('\n');
  state.recording.files = {};
}

function exportAllData() {
  syncStudyStateFromForm();

  const exportedAt = new Date();
  const baseName = buildExportBaseName(exportedAt);
  const downloaded = [];
  const snapshotFile = `${baseName}_all-data.json`;
  const snapshot = buildExportSnapshot(exportedAt);

  downloadFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'application/json;charset=utf-8');
  downloaded.push(snapshotFile);

  getBufferedRecordingExports(baseName).forEach(({ filename, text }) => {
    downloadText(filename, text);
    downloaded.push(filename);
  });

  ui.recStatus.textContent = downloaded.length === 1
    ? 'Exported study and session snapshot to Downloads'
    : `Exported ${downloaded.length} files to Downloads`;
  ui.saveStatus.textContent = downloaded.join('\n');
}

function downloadText(filename, text) {
  downloadFile(filename, text, 'text/csv;charset=utf-8');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeNamePart(raw) {
  const cleaned = String(raw).trim().replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned || 'NA';
}

function buildExportBaseName(date) {
  const participantName = state.study.participant.name || state.recording.customName || 'participant';
  return `ble_sensor_logger_${sanitizeNamePart(participantName)}_${formatTimestampTag(date)}`;
}

function buildExportSnapshot(exportedAt) {
  return {
    schemaVersion: 5,
    exportedAt: exportedAt.toISOString(),
    title: document.title,
    app: {
      isMeasuring: state.isMeasuring,
      eisChannelMode: state.eisChannelMode,
      currentDataLabel: state.currentDataLabel,
      labels: [...state.labels],
    },
    recording: {
      active: state.recording.active,
      startMs: state.recording.startMs,
      customName: state.recording.customName,
      timestampTag: state.recording.timestampTag,
      bufferedFiles: summarizeBufferedRecordingFiles(),
    },
    sensors: [
      serializeSensorState(1, state.sensor1),
      serializeSensorState(2, state.sensor2),
      serializeSensorState(3, state.sensor3),
    ],
    study: JSON.parse(JSON.stringify(state.study)),
    uiSelections: {
      frequency: ui.frequency?.value || '',
      resistance: ui.resistance?.value || '',
      sweep: ui.sweep?.value || '',
    },
  };
}

function summarizeBufferedRecordingFiles() {
  return Object.entries(state.recording.files)
    .filter(([key, value]) => !key.endsWith('_name') && Array.isArray(value))
    .map(([key, lines]) => ({
      key,
      rows: Math.max(0, lines.length - 1),
      filename: state.recording.files[`${key}_name`] || '',
    }));
}

function getBufferedRecordingExports(baseName) {
  const downloads = [];

  for (const sensorId of [1, 2]) {
    for (const type of ['EIS', 'IMU']) {
      const key = `${sensorId}_${type}`;
      const lines = state.recording.files[key] || [];
      if (lines.length <= 1) continue;

      downloads.push({
        filename: state.recording.files[`${key}_name`] || `${baseName}_sensor${sensorId}_${type.toLowerCase()}.csv`,
        text: `${lines.join('\n')}\n`,
      });
    }
  }

  const pressureLines = state.recording.files['3_PRESSURE'] || [];
  if (pressureLines.length > 1) {
    downloads.push({
      filename: state.recording.files['3_PRESSURE_name'] || `${baseName}_sensor3_pressure.csv`,
      text: `${pressureLines.join('\n')}\n`,
    });
  }

  return downloads;
}

function serializeSensorState(sensorId, sensorState) {
  return {
    sensorId,
    name: sensorState.name,
    connected: sensorState.connected,
    rateEis: sensorState.rateEis,
    rateImu: sensorState.rateImu,
    ratePressure: sensorState.ratePressure,
    totalEis: sensorState.totalEis,
    totalImu: sensorState.totalImu,
    totalPressure: sensorState.totalPressure,
    latestEis: sensorState.latestEis,
    latestImu: sensorState.latestImu,
    latestPressure: sensorState.latestPressure,
  };
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function formatTimestampTag(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function getSensor(sensorId) {
  if (sensorId === 1) return state.sensor1;
  if (sensorId === 2) return state.sensor2;
  return state.sensor3;
}

function log(message) {
  const now = new Date();
  const stamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  ui.log.textContent = `[${stamp}] ${message}`;
}

function encodeCommandPacket(command, frequency, resistance) {
  const bytes = new Uint8Array(12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, clampUInt32(command), true);
  view.setUint32(4, clampUInt32(frequency), true);
  view.setUint32(8, clampUInt32(resistance), true);
  return bytes;
}

function clampUInt32(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 0xFFFFFFFF) return 0xFFFFFFFF;
  return Math.trunc(value);
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function writeTx(characteristic, bytes, options = {}) {
  if (!characteristic) return;
  const preferResponse = Boolean(options.preferResponse);
  const canWriteResponse = Boolean(characteristic.properties?.write);
  const canWriteNoResponse = Boolean(characteristic.properties?.writeWithoutResponse);

  if (preferResponse && canWriteResponse) {
    await characteristic.writeValue(bytes);
    return;
  }
  if (canWriteNoResponse) {
    await characteristic.writeValueWithoutResponse(bytes);
    return;
  }
  if (canWriteResponse) {
    await characteristic.writeValue(bytes);
    return;
  }

  try {
    await characteristic.writeValueWithoutResponse(bytes);
  } catch (_) {
    await characteristic.writeValue(bytes);
  }
}

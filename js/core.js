// ── Core: 공통 상태, 초기화, TTS, 탭/대시보드 전환, 설정 ──

// ── State ──
const DAYS_KO = ["일","월","화","수","목","금","토"];
const today = new Date();
const todayDay = today.getDay();

let streak = parseInt(localStorage.getItem('streak') || '1');
let checkedDays = JSON.parse(localStorage.getItem('checkedDays') || '[]');
let done = localStorage.getItem('done_' + today.toDateString()) === '1';
let workerUrl = 'https://language-dashboard-worker.mamibj7.workers.dev';
let currentTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

// ── Init ──
function init() {
  // Date
  document.getElementById('today-date').textContent =
    today.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' });

  // Streak display
  document.getElementById('streak-num').textContent = streak;

  // Week dots
  const weekEl = document.getElementById('week-dots');
  DAYS_KO.forEach((d, i) => {
    const dot = document.createElement('div');
    dot.className = 'day-dot' +
      (checkedDays.includes(i) ? ' done' : '') +
      (i === todayDay && !checkedDays.includes(i) ? ' today' : '');
    dot.textContent = checkedDays.includes(i) ? '✓' : d;
    weekEl.appendChild(dot);
  });

  if (done) {
    const btn = document.getElementById('complete-btn');
    btn.textContent = '✅ 오늘 공부 완료!';
    btn.classList.add('done');
  }

  // Worker URL banner 항상 숨김 (URL 하드코딩됨)
  document.getElementById('api-banner').classList.add('hidden');

  updateTopicUI();
  renderPhrases();
  renderVocab();
  renderHints();
  renderQuiz();
  renderDialogue();
  renderPatterns();

  switchDashboard(currentDashboard, true);
}

// ── 미디어 공유/저장 ──
async function shareMedia(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('Share failed:', err.message);
  }
  // 공유 API 미지원 환경(PC 등) → 기존 다운로드 방식 폴백
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
}

// ── Speak ──
let _audio = null;
let _speakQueue = [];

function splitForTTS(text, maxLen) {
  // Google Translate TTS rejects/truncates requests over ~200 chars, so split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let cur = '';
  sentences.forEach(s => {
    if ((cur + s).length > maxLen && cur) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  });
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(c => c.length > 0);
}

function _playNextChunk() {
  const next = _speakQueue.shift();
  if (!next) { _audio = null; return; }
  const url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=en-US&client=tw-ob&q=' + encodeURIComponent(next);
  _audio = new Audio(url);
  _audio.onended = _playNextChunk;
  _audio.play().catch(() => {
    // fallback to Web Speech API on desktop
    if (!window.speechSynthesis) { _playNextChunk(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(next);
    u.lang = 'en-US'; u.rate = 0.9;
    const v = window.speechSynthesis.getVoices().find(x => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.onend = _playNextChunk;
    window.speechSynthesis.speak(u);
  });
}

function speak(text) {
  if (_audio) { _audio.pause(); _audio = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  _speakQueue = splitForTTS(text, 190);
  _playNextChunk();
}

// ── Tab switch ──
const TAB_NAMES = ['dialogue','phrases','vocab','role','quiz','pattern','ppt','opic','notes','companyDash','companyAsk'];
const DASHBOARDS = {
  english: {
    label: '📚 영어공부 대시보드',
    tabs: [
      { id: 'dialogue', label: '💬 대화' },
      { id: 'phrases', label: '📚 표현' },
      { id: 'vocab', label: '📖 단어' },
      { id: 'role', label: '🎭 롤플레잉' },
      { id: 'quiz', label: '🧠 퀴즈' },
      { id: 'pattern', label: '📐 패턴' },
      { id: 'opic', label: '🎤 오픽' },
    ],
  },
  company: {
    label: '💼 회사 대시보드',
    tabs: [
      { id: 'companyDash', label: '📊 대시보드' },
      { id: 'notes', label: '📒 기록' },
      { id: 'companyAsk', label: '🧠 질문하기' },
      { id: 'ppt', label: '📊 PPT' },
    ],
  },
};
let currentDashboard = localStorage.getItem('currentDashboard') || 'english';
let currentTabName = null;
let isRestoringHistory = false;
let pptInitialized = false;
let opicInitialized = false;
let notesInitialized = false;
let askChatInitialized = false;

function pushHistoryState(replace) {
  if (isRestoringHistory) return;
  const state = { dashboard: currentDashboard, tab: currentTabName, modal: null };
  history[replace ? 'replaceState' : 'pushState'](state, '', location.href);
}

function switchDashboard(name, _isInitial) {
  currentDashboard = name;
  localStorage.setItem('currentDashboard', name);
  document.getElementById('dash-btn-english').classList.toggle('active', name === 'english');
  document.getElementById('dash-btn-company').classList.toggle('active', name === 'company');

  const tabsEl = document.getElementById('dashboard-tabs');
  const dash = DASHBOARDS[name];
  tabsEl.innerHTML = dash.tabs.map((t, i) => `<button class="tab-btn${i === 0 ? ' active' : ''}" onclick="switchTab('${t.id}')">${t.label}</button>`).join('');

  switchTab(dash.tabs[0].id, true);
  pushHistoryState(_isInitial);
}

function switchTab(name, skipHistory) {
  TAB_NAMES.forEach(t => {
    document.getElementById('tab-' + t).classList.add('hidden');
  });
  document.getElementById('tab-' + name).classList.remove('hidden');
  currentTabName = name;
  const dash = DASHBOARDS[currentDashboard];
  document.querySelectorAll('#dashboard-tabs .tab-btn').forEach((b, i) => {
    b.classList.toggle('active', dash.tabs[i].id === name);
  });
  if (name === 'ppt' && !pptInitialized) {
    pptInitialized = true;
    notesLoadAll().then(renderPptNoteList);
  }
  if (name === 'opic' && !opicInitialized) {
    opicInitialized = true;
    renderOpicTopics();
  }
  if (name === 'notes' && !notesInitialized) {
    notesInitialized = true;
    notesLoadAll().then(renderNotesList);
  }
  if (name === 'companyDash') {
    notesLoadAll().then(renderCompanyDashboard);
  }
  if (name === 'companyAsk' && !askChatInitialized) {
    askChatInitialized = true;
    renderAskChat();
  }
  if (!skipHistory) pushHistoryState();
}

// ── 뒤로가기 버튼 처리 (모달/탭/대시보드 순서로 닫고 이동) ──
window.addEventListener('popstate', (e) => {
  isRestoringHistory = true;
  try {
    const state = e.state;
    const targetModal = state && state.modal;
    if (targetModal !== 'lightbox') closeMediaLightboxUI();
    if (targetModal !== 'noteForm') closeNoteFormUI();
    if (state) {
      if (state.dashboard && state.dashboard !== currentDashboard) {
        currentDashboard = state.dashboard;
        localStorage.setItem('currentDashboard', currentDashboard);
        document.getElementById('dash-btn-english').classList.toggle('active', currentDashboard === 'english');
        document.getElementById('dash-btn-company').classList.toggle('active', currentDashboard === 'company');
        const dash = DASHBOARDS[currentDashboard];
        document.getElementById('dashboard-tabs').innerHTML = dash.tabs.map(t => `<button class="tab-btn" onclick="switchTab('${t.id}')">${t.label}</button>`).join('');
      }
      if (state.tab) switchTab(state.tab, true);
    }
  } finally {
    isRestoringHistory = false;
  }
});

// ── Settings ──
function openSettings() {
  const input = document.getElementById('settings-api-input');
  if (geminiApiKey) input.value = geminiApiKey;
  document.getElementById('settings-status').classList.add('hidden');
  document.getElementById('settings-overlay').classList.remove('hidden');
}
function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
}
function saveSettings() {
  const key = document.getElementById('settings-api-input').value.trim();
  if (!key) return;
  geminiApiKey = key;
  localStorage.setItem('geminiApiKey', key);
  document.getElementById('settings-status').classList.remove('hidden');
  setTimeout(closeSettings, 1200);
}

// ── Worker URL ──
function saveWorkerUrl() {
  workerUrl = document.getElementById('worker-url-input').value.trim();
  if (workerUrl) {
    localStorage.setItem('workerUrl', workerUrl);
    document.getElementById('api-banner').classList.add('hidden');
  }
}

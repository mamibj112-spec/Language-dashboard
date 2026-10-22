// ── OPIc: 오픽 단계별 연습 + 스크립트 암기 ──

const OPIC_STAGES = [
  { id: 'intro', emoji: '🙋', label: '1. 자기소개' },
  { id: 'survey', emoji: '📋', label: '2. 설문 선택주제' },
  { id: 'role', emoji: '🎭', label: '3. 롤플레이' },
  { id: 'twist', emoji: '⚡', label: '4. 돌발질문' },
  { id: 'memorize', emoji: '📝', label: '5. 스크립트 암기' },
  { id: 'allpurpose', emoji: '🧰', label: '만능 답변' },
];

// ── 어떤 문제가 나와도 쓸 수 있는 만능 표현 모음 ──
const OPIC_ALLPURPOSE = [
  {
    category: '⏳ 시간 끌기 (생각할 시간 벌기)',
    items: [
      { en: "That's a really interesting question.", ko: "정말 흥미로운 질문이네요." },
      { en: "Let me think about that for a moment.", ko: "잠시 생각해 볼게요." },
      { en: "Well, there are a few things I'd like to mention.", ko: "음, 몇 가지 말씀드리고 싶은 게 있어요." },
      { en: "That's a great question, let me tell you about it.", ko: "좋은 질문이네요, 말씀드릴게요." },
    ],
  },
  {
    category: '💭 의견 제시',
    items: [
      { en: "In my opinion, ~", ko: "제 생각에는 ~" },
      { en: "Personally, I think ~", ko: "개인적으로 저는 ~라고 생각해요" },
      { en: "I believe that ~", ko: "저는 ~라고 믿어요" },
      { en: "From my point of view, ~", ko: "제 관점에서는 ~" },
    ],
  },
  {
    category: '📌 이유·근거 설명',
    items: [
      { en: "That's because ~", ko: "그건 ~때문이에요" },
      { en: "The main reason is that ~", ko: "가장 큰 이유는 ~라는 거예요" },
      { en: "This is mainly due to ~", ko: "이건 주로 ~때문이에요" },
    ],
  },
  {
    category: '📝 예시 들기',
    items: [
      { en: "For example, ~", ko: "예를 들면, ~" },
      { en: "To give you an example, ~", ko: "예를 하나 들어드리면, ~" },
      { en: "Let's say ~", ko: "가령 ~라고 해봐요" },
    ],
  },
  {
    category: '➕ 내용 추가·전환',
    items: [
      { en: "Also, ~", ko: "그리고, ~" },
      { en: "On top of that, ~", ko: "게다가, ~" },
      { en: "Besides that, ~", ko: "그 외에도, ~" },
      { en: "Speaking of which, ~", ko: "그러고 보니, ~" },
    ],
  },
  {
    category: '⚖️ 비교·대조',
    items: [
      { en: "Compared to before, ~", ko: "예전과 비교하면, ~" },
      { en: "Unlike ~, ~", ko: "~와 다르게, ~" },
      { en: "On the other hand, ~", ko: "반면에, ~" },
    ],
  },
  {
    category: '🏁 마무리',
    items: [
      { en: "That's about it.", ko: "이 정도인 것 같아요." },
      { en: "That's all I can think of for now.", ko: "지금 생각나는 건 이 정도예요." },
      { en: "Anyway, that's pretty much it.", ko: "아무튼, 대략 이 정도예요." },
      { en: "I hope that answers your question.", ko: "질문에 대한 답이 되었길 바라요." },
    ],
  },
  {
    category: '🆘 모르거나 막힐 때 (매우 중요!)',
    items: [
      { en: "Hmm, that's a tough question, but let me try.", ko: "음, 어려운 질문이지만 한번 대답해볼게요." },
      { en: "I haven't really thought about that before, but I'll give it a shot.", ko: "그건 딱히 생각해본 적 없지만, 한번 말해볼게요." },
      { en: "I'm not totally sure, but if I had to guess, I'd say ~", ko: "완전히 확신은 없지만, 굳이 말하자면 ~일 것 같아요" },
      { en: "Sorry, could you repeat the question, please?", ko: "죄송한데, 질문을 한 번 더 말씀해 주시겠어요?" },
    ],
  },
];
let opicAPOpen = {};
const OPIC_SURVEY_TOPICS = [
  { emoji: '🏠', label: '거주지' },
  { emoji: '💼', label: '직장/업무' },
  { emoji: '🎓', label: '학교/전공' },
  { emoji: '🎬', label: '영화감상' },
  { emoji: '🎵', label: '음악감상' },
  { emoji: '📚', label: '독서' },
  { emoji: '🏃', label: '운동/헬스' },
  { emoji: '✈️', label: '여행' },
  { emoji: '🍳', label: '요리' },
  { emoji: '🐶', label: '반려동물' },
  { emoji: '🛍️', label: '쇼핑' },
  { emoji: '👥', label: '모임/동호회' },
];
let opicStage = 'intro';

// ── 목표 등급 (AI 생성 문제/모범답안의 난이도에 반영) ──
const OPIC_LEVELS = ['IL', 'IM1', 'IM2', 'IH', 'AL'];
let opicTargetLevel = localStorage.getItem('opicTargetLevel') || 'IM2';

function setOpicLevel(lv) {
  opicTargetLevel = lv;
  localStorage.setItem('opicTargetLevel', lv);
  renderOpicLevelTabs();
}

function renderOpicLevelTabs() {
  const el = document.getElementById('opic-level-tabs');
  if (!el) return;
  el.innerHTML = OPIC_LEVELS.map(lv => `<button class="tab-btn${lv === opicTargetLevel ? ' active' : ''}" onclick="setOpicLevel('${lv}')" style="flex:1 1 0;min-width:0;padding:8px 0;">${lv}</button>`).join('');
}

function setOpicStage(id) {
  opicStage = id;
  document.getElementById('opic-result').innerHTML = '';
  renderOpicTopics();
}

function renderOpicTopics() {
  renderOpicLevelTabs();
  const tabsEl = document.getElementById('opic-stage-tabs');
  tabsEl.innerHTML = OPIC_STAGES.map(s => `
    <button class="tab-btn${s.id === opicStage ? ' active' : ''}" onclick="setOpicStage('${s.id}')" style="flex:none;">${s.emoji} ${s.label}</button>
  `).join('');

  const contentEl = document.getElementById('opic-stage-content');
  if (opicStage === 'survey') {
    contentEl.innerHTML = `<div style="font-size:15px;color:var(--muted);margin-bottom:8px;">실제 시험처럼, 설문에서 고를 법한 관심사 주제를 선택하세요</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${OPIC_SURVEY_TOPICS.map((t, i) => `<button class="tab-btn" onclick="loadOpicQuestions('survey','${t.label}','${t.emoji}')" style="flex:none;">${t.emoji} ${t.label}</button>`).join('')}
      </div>`;
  } else if (opicStage === 'intro') {
    contentEl.innerHTML = `<div style="font-size:15px;color:var(--muted);margin-bottom:8px;">시험 시작 시 항상 나오는 자기소개 단계예요 (1문항)</div>
      <button class="complete-btn" onclick="loadOpicQuestions('intro','자기소개','🙋')">▶ 자기소개 질문 받기</button>`;
  } else if (opicStage === 'role') {
    contentEl.innerHTML = `<div style="font-size:15px;color:var(--muted);margin-bottom:8px;">정보요청 → 대안제시 → 관련 과거경험으로 이어지는 롤플레이 세트예요 (3문항)</div>
      <button class="complete-btn" onclick="loadOpicQuestions('role','롤플레이','🎭')">▶ 롤플레이 세트 받기</button>`;
  } else if (opicStage === 'twist') {
    contentEl.innerHTML = `<div style="font-size:15px;color:var(--muted);margin-bottom:8px;">고난도 돌발 단계예요 — 비교/묘사/루틴 + 관련 이슈·뉴스·의견 (2문항)</div>
      <button class="complete-btn" onclick="loadOpicQuestions('twist','돌발질문','⚡')">▶ 돌발질문 받기</button>`;
  } else if (opicStage === 'memorize') {
    renderOpicMemorize();
  } else if (opicStage === 'allpurpose') {
    renderOpicAllPurpose();
  }
}

// ── 만능 답변 ──
function renderOpicAllPurpose() {
  const contentEl = document.getElementById('opic-stage-content');
  contentEl.innerHTML = `<div style="font-size:15px;color:var(--muted);margin-bottom:10px;">어떤 문제가 나와도 이 표현들로 답변을 이어갈 수 있어요. 통째로 외워두면 실전에서 든든해요.</div>` +
    OPIC_ALLPURPOSE.map((cat, ci) => `
      <div class="card" style="margin-bottom:10px;">
        <div style="font-weight:700;font-size:16px;margin-bottom:10px;">${cat.category}</div>
        ${cat.items.map((it, ii) => {
          const key = ci + '-' + ii;
          const open = !!opicAPOpen[key];
          return `
            <div class="phrase-item${open ? ' open' : ''}" onclick="toggleOpicAP('${key}')">
              <div class="phrase-row">
                <div class="phrase-en">${it.en}</div>
                <button class="spk-btn" onclick="event.stopPropagation();speak('${it.en.replace(/'/g, "\\'")}')">🔊</button>
              </div>
              ${open ? `<div class="phrase-ko">${it.ko}</div>` : `<div class="phrase-hint">👆 탭해서 한국어 보기</div>`}
            </div>`;
        }).join('')}
      </div>`).join('');
}

function toggleOpicAP(key) {
  opicAPOpen[key] = !opicAPOpen[key];
  renderOpicAllPurpose();
}

// ── 오픽 스크립트 암기 (내 스크립트 자료 기반) ──
// 지금 보고 있는 질문을 영어로 읽어주기 (질문 문장에 따옴표가 섞여 있어도 안전하게 데이터에서 직접 꺼냄)
function opicSpeakMemQuestion() {
  const data = getOpicMemData();
  const item = data && data[opicMemTopicIdx] && data[opicMemTopicIdx].items[opicMemItemIdx];
  if (item && item.q_en) speak(item.q_en.replace(/<[^>]*>/g, ''));
}

const OPIC_MEM_CATEGORIES = [
  { id: 'survey', label: '📋 설문조사 (14주제)', dataName: 'OPIC_SCRIPT_DATA' },
  { id: 'twist', label: '⚡ 돌발 (17주제)', dataName: 'OPIC_TWIST_DATA' },
  { id: 'role', label: '🎭 롤플레이 (11/12/15번)', dataName: 'OPIC_ROLE_DATA' },
];
let opicMemCategory = null;
let opicMemTopicIdx = null;
let opicMemItemIdx = null;
let opicMemRevealed = false;
let opicMemOverridesApplied = false;

const OPIC_MEM_DATASETS = {
  OPIC_SCRIPT_DATA: typeof OPIC_SCRIPT_DATA !== 'undefined' ? OPIC_SCRIPT_DATA : null,
  OPIC_TWIST_DATA: typeof OPIC_TWIST_DATA !== 'undefined' ? OPIC_TWIST_DATA : null,
  OPIC_ROLE_DATA: typeof OPIC_ROLE_DATA !== 'undefined' ? OPIC_ROLE_DATA : null,
};
function getOpicMemData() {
  const cat = OPIC_MEM_CATEGORIES.find(c => c.id === opicMemCategory);
  return cat ? OPIC_MEM_DATASETS[cat.dataName] : null;
}

// localStorage: { [category]: { [topicIdx]: { [itemIdx]: { en_script, ko_script, studyPoints, done } } } }
function loadOpicMemStore() {
  try { return JSON.parse(localStorage.getItem('opicMemStore') || '{}'); } catch { return {}; }
}
function saveOpicMemPatch(category, topicIdx, itemIdx, patch) {
  const store = loadOpicMemStore();
  store[category] = store[category] || {};
  store[category][topicIdx] = store[category][topicIdx] || {};
  store[category][topicIdx][itemIdx] = Object.assign({}, store[category][topicIdx][itemIdx], patch);
  localStorage.setItem('opicMemStore', JSON.stringify(store));
}
function applyOpicMemOverrides() {
  const store = loadOpicMemStore();
  OPIC_MEM_CATEGORIES.forEach(cat => {
    const data = OPIC_MEM_DATASETS[cat.dataName];
    const catStore = store[cat.id];
    if (!data || !catStore) return;
    Object.keys(catStore).forEach(ti => {
      const topic = data[ti];
      if (!topic) return;
      Object.keys(catStore[ti]).forEach(ii => {
        const item = topic.items[ii];
        if (!item) return;
        Object.assign(item, catStore[ti][ii]);
      });
    });
  });
}

// 오픽 스크립트를 문장/레벨 태그 단위로 줄바꿈해서 읽기 편하게 만든다
function formatScriptHtml(text) {
  if (!text) return '';
  let t = text.replace(/&lt;([^&]+)&gt;|<([^>]+)>/g, (m, a, b) => `@@TAG@@${a || b}@@TAG@@`);
  t = t.replace(/([.!?])\s+/g, '$1@@BREAK@@');
  return t.split('@@BREAK@@').map(seg => {
    seg = seg.trim();
    if (!seg) return '';
    const m = seg.match(/@@TAG@@([^@]+)@@TAG@@/);
    if (m) {
      const rest = seg.replace(/@@TAG@@[^@]+@@TAG@@/g, '').trim();
      return `<div class="script-level-tag">${m[1]}</div>` + (rest ? `<p>${rest}</p>` : '');
    }
    return `<p>${seg}</p>`;
  }).join('');
}

// ── 정답 스크립트 읽어주기 ──
// 스크립트 자료에는 영어 문장 사이에 <IL> 같은 등급 태그, "[   ] is ~: 내가 ~" 같은 한국어 학습 메모,
// 이메일·주소, (대체 표현) 등이 섞여 있어서 그대로 읽으면 이상하다. 영어 문장만 골라낸다.
function opicCleanScriptForSpeech(text) {
  if (!text) return '';
  const t = text
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;[^&]*&gt;/g, ' ')
    .replace(/<[^>]*>/g, ' ')                       // <IL>, <IM1/IM2> 등급 태그
    .replace(/\S+@\S+\.\S+/g, ' ')                  // 이메일
    .replace(/https?:\/\/\S+/g, ' ')                // 주소
    .replace(/\([^)]*\)/g, ' ')                     // (대체 표현) 괄호 메모
    .replace(/\[\s*script\s*\]/gi, ' ')             // [Script] 라벨
    .replace(/\[\s*([^\]]*?)\s*\]/g, (m, inner) => inner || '@@BLANK@@'); // [ Yesterday ] -> Yesterday, [   ] 빈칸은 메모 표시
  // 문장 단위로 자르기 (줄바꿈도 문장 경계로 취급)
  const kept = [];
  for (let seg of t.split(/\n+|(?<=[.!?])\s+/)) {
    // 한국어가 섞인 조각은 "영어 표현: 한국어 뜻 + 이어지는 영어 문장" 형태라, 마지막 한글 뒤쪽 영어만 남김
    let lastKo = -1;
    for (let i = 0; i < seg.length; i++) if (/[\u3131-\uD79D]/.test(seg[i])) lastKo = i;
    if (lastKo >= 0) seg = seg.slice(lastKo + 1);
    seg = seg.replace(/^[\s:=.,;"'\-→]+/, '').replace(/\s+/g, ' ').trim();
    if (!seg) continue;
    if (/@@BLANK@@|~|=|→/.test(seg)) continue;      // 문형 메모 (예: "I like ~ = I love ~")
    if (/^P\d+\.?$/.test(seg)) continue;            // P12. 같은 페이지 번호
    if (!/[A-Za-z]{2,}/.test(seg)) continue;
    kept.push(seg);
  }
  return kept.join(' ');
}

function opicSpeakMemScript() {
  const data = getOpicMemData();
  const item = data && data[opicMemTopicIdx] && data[opicMemTopicIdx].items[opicMemItemIdx];
  const text = item && opicCleanScriptForSpeech(item.en_script);
  if (text) speak(text);
}

function renderOpicMemorize() {
  const contentEl = document.getElementById('opic-stage-content');
  document.getElementById('opic-result').innerHTML = '';

  if (!opicMemOverridesApplied) {
    applyOpicMemOverrides();
    opicMemOverridesApplied = true;
  }

  if (opicMemCategory === null) {
    contentEl.innerHTML = `<div style="font-size:15px;color:var(--muted);margin-bottom:8px;">내 스크립트 자료로 암기 연습해요. 분류를 고르세요</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${OPIC_MEM_CATEGORIES.map(c => `<button class="tab-btn" onclick="opicMemCategory='${c.id}';opicMemTopicIdx=null;opicMemItemIdx=null;renderOpicMemorize()" style="text-align:left;">${c.label}</button>`).join('')}
      </div>`;
    return;
  }

  const data = getOpicMemData();
  if (!data) {
    contentEl.innerHTML = `<div style="color:var(--danger);">⚠️ 스크립트 데이터를 불러오지 못했어요.</div>`;
    return;
  }

  if (opicMemTopicIdx === null) {
    contentEl.innerHTML = `
      <button class="tab-btn" onclick="opicMemCategory=null;renderOpicMemorize()" style="margin-bottom:10px;">← 분류 목록</button>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${data.map((t, i) => {
          const done = t.items.filter(it => it.done).length;
          return `<button class="tab-btn" onclick="opicMemTopicIdx=${i};opicMemItemIdx=null;renderOpicMemorize()" style="flex:none;">${t.topic}${done ? ` (✔${done}/${t.items.length})` : ''}</button>`;
        }).join('')}
      </div>`;
    return;
  }

  const topic = data[opicMemTopicIdx];

  if (opicMemItemIdx === null) {
    contentEl.innerHTML = `
      <button class="tab-btn" onclick="opicMemTopicIdx=null;renderOpicMemorize()" style="margin-bottom:10px;">← 주제 목록</button>
      <div style="font-weight:700;margin-bottom:8px;">${topic.fullTitle}</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${topic.items.map((it, i) => `
          <button class="opic-q-item" onclick="opicMemItemIdx=${i};opicMemRevealed=false;renderOpicMemorize()" style="${it.en_script ? '' : 'opacity:0.6;'}">${it.done ? '✅ ' : ''}${i + 1}. ${it.title}${it.en_script ? '' : ' (스크립트 없음)'}</button>
        `).join('')}
      </div>`;
    return;
  }

  const item = topic.items[opicMemItemIdx];

  contentEl.innerHTML = `
    <button class="tab-btn" onclick="opicMemItemIdx=null;renderOpicMemorize()" style="margin-bottom:10px;">← ${topic.topic} 목록</button>
    <div class="card">
      <div style="font-size:14px;color:var(--muted);margin-bottom:4px;">${topic.topic} · ${opicMemItemIdx + 1}/${topic.items.length}</div>
      <div style="font-weight:700;font-size:17px;margin-bottom:8px;">${item.title}</div>
      <div class="opic-q-box">
        <div class="opic-q-label">❓ 질문 <button class="spk-btn" onclick="opicSpeakMemQuestion()">🔊 영어로 듣기</button></div>
        <div class="opic-q-en">${item.q_en}</div>
        <div class="opic-q-ko">${item.q_ko}</div>
      </div>
      ${item.en_script ? `
        <div style="padding:12px;border-radius:12px;background:var(--surface-alt);border:1px solid var(--line-soft);margin-bottom:10px;">
          <div style="font-size:14px;color:var(--accent-strong);font-weight:600;margin-bottom:8px;">🇰🇷 한국어 스크립트 (이걸 보고 영어로 떠올려보세요)</div>
          <div style="font-size:16px;line-height:1.7;" class="script-text">${formatScriptHtml(item.ko_script)}</div>
        </div>
        ${opicMemRevealed ? `
          <div style="padding:12px;border-radius:12px;background:rgba(21,128,61,0.08);border:1px solid rgba(21,128,61,0.25);">
            <div style="font-size:14px;color:var(--success);font-weight:600;margin-bottom:8px;">🇺🇸 정답 스크립트 <button class="spk-btn" onclick="opicSpeakMemScript()">🔊 영어로 듣기</button></div>
            <div style="font-size:16px;line-height:1.8;" class="script-text">${formatScriptHtml(item.en_script)}</div>
          </div>
          <button class="complete-btn" onclick="opicMemRevealed=false;renderOpicMemorize()" style="margin-top:10px;background:var(--surface-alt);">🙈 다시 가리기</button>
          <button class="complete-btn ${item.done ? 'done' : ''}" onclick="toggleOpicMemDone()" style="margin-top:10px;${item.done ? '' : 'background:var(--accent-strong);'}">${item.done ? '✅ 외웠어요 (취소하려면 클릭)' : '☑️ 외웠어요 체크'}</button>
          <div id="opic-study-points" style="margin-top:10px;">${renderOpicStudyPoints(item)}</div>
        ` : `
          <button class="complete-btn" onclick="opicMemRevealed=true;renderOpicMemorize()">👀 영어 스크립트 보기</button>
        `}
      ` : `
        <div style="color:var(--warning);font-size:15px;margin-bottom:10px;">이 질문은 원본 자료에 모범 스크립트가 없어요.</div>
        <button class="complete-btn" id="opic-gen-script-btn" onclick="generateOpicScript(${opicMemTopicIdx},${opicMemItemIdx})">✨ AI로 모범답안 만들기</button>
        <div id="opic-gen-script-result"></div>
      `}
      <div style="display:flex;gap:8px;margin-top:10px;">
        ${opicMemItemIdx > 0 ? `<button class="tab-btn" onclick="opicMemItemIdx=${opicMemItemIdx - 1};opicMemRevealed=false;renderOpicMemorize()">← 이전</button>` : ''}
        ${opicMemItemIdx < topic.items.length - 1
          ? `<button class="tab-btn" onclick="opicMemItemIdx=${opicMemItemIdx + 1};opicMemRevealed=false;renderOpicMemorize()">다음 →</button>`
          : `<button class="tab-btn" onclick="opicMemTopicIdx=null;opicMemItemIdx=null;opicMemRevealed=false;renderOpicMemorize()">처음으로 ↺</button>`}
      </div>
    </div>`;
}

function toggleOpicMemDone() {
  const topic = getOpicMemData()[opicMemTopicIdx];
  const item = topic.items[opicMemItemIdx];
  item.done = !item.done;
  saveOpicMemPatch(opicMemCategory, opicMemTopicIdx, opicMemItemIdx, { done: item.done });
  renderOpicMemorize();
}

// 정리 화면의 🔊 버튼들이 읽을 문장 (따옴표가 섞여도 안전하게 번호로 참조)
let opicStudySpeakTexts = [];

// 예문 한 줄: 영어(🔊) + 한국어 해석
function opicStudyExampleHtml(ex, label) {
  if (!ex || !ex.en) return '';
  const i = opicStudySpeakTexts.push(ex.en) - 1;
  return `
    <div style="margin-top:6px;padding:8px 10px;border-radius:8px;background:var(--accent-wash);">
      ${label ? `<div style="font-size:13px;color:var(--accent-strong);font-weight:700;margin-bottom:2px;">${label}</div>` : ''}
      <div style="font-size:15px;font-weight:600;color:var(--ink);line-height:1.6;">${ex.en} <button class="spk-btn" style="font-size:13px;padding:0 6px;vertical-align:middle;" onclick="speak(opicStudySpeakTexts[${i}])">🔊</button></div>
      ${ex.ko ? `<div style="font-size:14px;color:var(--ink-soft);line-height:1.6;">${ex.ko}</div>` : ''}
    </div>`;
}

function renderOpicStudyPoints(item) {
  if (item.studyPoints) {
    const sp = item.studyPoints;
    opicStudySpeakTexts = [];
    const section = (emoji, title, color, lines) => !lines || !lines.length ? '' : `
      <div style="padding:12px;border-radius:12px;background:var(--surface-alt);border:1px solid var(--line-soft);margin-bottom:8px;">
        <div style="font-size:14px;color:${color};font-weight:600;margin-bottom:8px;">${emoji} ${title}</div>
        <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.8;color:var(--ink-soft);">
          ${lines.map(l => `<li style="margin-bottom:8px;">${l}</li>`).join('')}
        </ul>
      </div>`;
    // 예전에 정리한 자료는 만능 답변이 문장(문자열)만 있고 예시가 없어서 둘 다 처리
    const allPurpose = (sp.allPurpose || []).map(a => typeof a === 'string' ? a : `
      <b>${a.sentence}</b>${a.ko ? ` — ${a.ko}` : ''}
      ${opicStudyExampleHtml(a.example, a.useIn ? `💡 이렇게 응용해요: ${a.useIn}` : '💡 이렇게 응용해요')}`);
    const hasExamples = (sp.grammar || []).some(g => g.example) || (sp.allPurpose || []).some(a => typeof a !== 'string');
    return `
      ${section('💬', '핵심 표현·숙어', 'var(--warning)', (sp.expressions || []).map(e => `<b>${e.phrase}</b> — ${e.meaning}`))}
      ${section('📐', '문법 포인트', 'var(--accent)', (sp.grammar || []).map(g => `<b>${g.point}</b> — ${g.desc}${opicStudyExampleHtml(g.example, '✏️ 예문')}`))}
      ${section('🧰', '만능 답변 (다른 문제에도 활용 가능)', 'var(--accent-strong)', allPurpose)}
      <button class="complete-btn" id="opic-study-btn" onclick="loadOpicStudyPoints(${opicMemTopicIdx},${opicMemItemIdx})" style="background:var(--surface-alt);color:var(--ink);">🔄 ${hasExamples ? '다시 정리하기' : '예시 포함해서 다시 정리하기'}</button>
      <div id="opic-study-result"></div>
    `;
  }
  return `<button class="complete-btn" id="opic-study-btn" onclick="loadOpicStudyPoints(${opicMemTopicIdx},${opicMemItemIdx})" style="background:var(--accent);">📌 핵심 표현·문법·만능 답변 정리 보기</button>
    <div id="opic-study-result"></div>`;
}

async function loadOpicStudyPoints(topicIdx, itemIdx) {
  const topic = getOpicMemData()[topicIdx];
  const item = topic.items[itemIdx];
  const resultEl = document.getElementById('opic-study-result');
  const btn = document.getElementById('opic-study-btn');
  if (!geminiApiKey) { resultEl.innerHTML = `<div style="margin-top:10px;color:var(--warning);">⚙️ API 키가 없어요!</div>`; return; }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 정리하는 중...';

  const cleanScript = item.en_script.replace(/&lt;[^&]*&gt;|<[^>]*>/g, '');
  const prompt = `다음은 오픽(OPIc) 영어 말하기 답변 스크립트입니다.

"""${cleanScript}"""

이 스크립트를 학습하는 사람을 위해 아래 형식의 JSON으로만 정리해주세요 (다른 설명 없이 JSON만):
{
  "expressions": [{"phrase": "핵심 표현/숙어", "meaning": "뜻과 간단한 사용법"}],
  "grammar": [{"point": "문법 포인트 이름", "desc": "설명", "example": {"en": "이 문법을 쓴 새 영어 예문 1문장 (스크립트 문장 그대로 말고, 오픽 답변에 쓸 법한 다른 문장)", "ko": "예문 번역"}}],
  "allPurpose": [{"sentence": "다른 오픽 문제에도 그대로 쓸 수 있는 만능 문장 (영어)", "ko": "뜻", "useIn": "이 문장을 써먹을 수 있는 다른 오픽 질문 예 (한국어로 짧게, 예: 좋아하는 카페 묘사)", "example": {"en": "그 질문 답변에 이 만능 문장을 실제로 응용한 영어 문장", "ko": "번역"}}]
}

조건:
- expressions는 2~4개, grammar는 1~3개, allPurpose는 2~3개
- 모두 한국어로 쉽게 설명, ${opicTargetLevel} 학습자 눈높이
- 강조용 별표(**) 같은 마크다운 기호는 쓰지 마세요`;

  try {
    item.studyPoints = await geminiJSON(prompt);
    saveOpicMemPatch(opicMemCategory, topicIdx, itemIdx, { studyPoints: item.studyPoints });
    renderOpicMemorize();
  } catch (err) {
    resultEl.innerHTML = `<div style="margin-top:10px;color:var(--danger);">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function generateOpicScript(topicIdx, itemIdx) {
  const topic = getOpicMemData()[topicIdx];
  const item = topic.items[itemIdx];
  const resultEl = document.getElementById('opic-gen-script-result');
  const btn = document.getElementById('opic-gen-script-btn');
  if (!geminiApiKey) { resultEl.innerHTML = `<div style="margin-top:10px;color:var(--warning);">⚙️ API 키가 없어요! 오른쪽 상단 ⚙️ 버튼을 눌러 Gemini API 키를 입력해 주세요.</div>`; return; }

  btn.disabled = true;
  btn.textContent = '⏳ 생성 중...';
  resultEl.innerHTML = '';

  const prompt = `당신은 OPIc(오픽) 영어 말하기 시험 스크립트 작성 전문가입니다. 아래 질문에 대한 ${opicTargetLevel} 수준의 모범답안 스크립트를 작성해주세요.

질문(영어): ${item.q_en}
질문(한국어): ${item.q_ko}
주제: ${topic.fullTitle}

다음 형식의 JSON으로만 답해주세요 (다른 설명 없이 JSON만):
{"en_script": "영어 모범답안 (4~6문장, 쉽고 자연스러운 구어체)", "ko_script": "모범답안 한국어 번역"}

조건:
- ${opicTargetLevel} 수준에 맞게 너무 어렵지 않은 문법과 어휘 사용
- 같은 주제의 다른 문항들과 비슷한 톤(친근한 구어체)으로 작성`;

  try {
    const result = await geminiJSON(prompt);
    item.en_script = result.en_script || '';
    item.ko_script = result.ko_script || '';
    opicMemRevealed = false;
    saveOpicMemPatch(opicMemCategory, topicIdx, itemIdx, { en_script: item.en_script, ko_script: item.ko_script });
    renderOpicMemorize();
  } catch (err) {
    resultEl.innerHTML = `<div style="margin-top:10px;color:var(--danger);">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '✨ AI로 모범답안 만들기';
  }
}

const OPIC_STAGE_PROMPTS = {
  intro: (label) => `당신은 OPIc(오픽) 영어 말하기 시험 출제 전문가입니다. 시험 맨 처음에 나오는 "자기소개(Self Introduction)" 질문 1개와, ${opicTargetLevel} 수준의 모범답안을 만들어주세요.`,
  survey: (label) => `당신은 OPIc(오픽) 영어 말하기 시험 출제 전문가입니다. 응시자가 배경설문에서 "${label}"을(를) 관심사로 선택했다고 가정하고, 실제 오픽 콤보셋 구조와 동일하게 같은 주제로 이어지는 질문 3개를 만들어주세요:
1번 - 묘사(Description) 질문
2번 - 묘사/루틴/비교 중 1개 유형의 질문 (1번과 다른 각도)
3번 - 관련된 과거 경험(Past Experience) 질문
각 질문에 대한 ${opicTargetLevel} 수준의 모범답안도 함께 작성하세요.`,
  role: () => `당신은 OPIc(오픽) 영어 말하기 시험 출제 전문가입니다. 실제 오픽의 "롤플레이(Role-Play)" 단계와 동일하게, 하나의 상황(예: 예약/구매/모임 등)에 대해 이어지는 질문 3개를 만들어주세요:
1번 - 정보를 얻기 위해 상대방에게 3가지 정도 질문하기
2번 - 문제 상황이 생겼다고 가정하고 대안을 제시하기 (음성메시지 형식)
3번 - 그 상황과 관련된 본인의 과거 경험 이야기하기
각 질문에 대한 ${opicTargetLevel} 수준의 모범답안도 함께 작성하세요.`,
  twist: () => `당신은 OPIc(오픽) 영어 말하기 시험 출제 전문가입니다. 고난도 "돌발(advanced)" 단계 질문 2개를 만들어주세요:
1번 - 일상 주제(교통, 기술, 환경 등)에 대한 비교/묘사/루틴 중 1개 유형의 질문
2번 - 그 주제와 관련된 최근 이슈·뉴스에 대한 의견을 묻는 질문
각 질문에 대한 ${opicTargetLevel} 수준의 모범답안도 함께 작성하세요.`,
};

async function loadOpicQuestions(stage, label, emoji) {
  const resultEl = document.getElementById('opic-result');
  if (!geminiApiKey) { resultEl.innerHTML = `<div style="margin-top:12px;color:var(--warning);">⚙️ API 키가 없어요! 오른쪽 상단 ⚙️ 버튼을 눌러 Gemini API 키를 입력해 주세요.</div>`; return; }

  resultEl.innerHTML = `<div style="margin-top:12px;color:var(--muted);">⏳ "${label}" 질문을 불러오는 중...</div>`;

  const basePrompt = OPIC_STAGE_PROMPTS[stage](label);
  const prompt = `${basePrompt}

다음 형식의 JSON 배열로만 답해주세요 (다른 설명 없이 JSON만, 위에서 지정한 순서와 개수 그대로):
[{"question_en": "영어 질문", "question_ko": "한국어 해석", "answer_en": "영어 모범답안 (4~6문장, 자연스러운 구어체)", "answer_ko": "모범답안 한국어 해석"}]

조건:
- 실제 오픽 시험 기출 스타일과 난이도를 반영
- 같은 세트 안의 질문들은 서로 자연스럽게 연결되는 흐름으로 작성`;

  try {
    const items = await geminiJSON(prompt);

    resultEl.innerHTML = items.map((it, i) => `
      <div class="card" style="margin-top:12px;">
        <div style="font-size:14px;color:var(--muted);margin-bottom:4px;">${emoji} ${label} · 질문 ${i + 1}</div>
        <div style="font-weight:700;font-size:17px;margin-bottom:4px;">${it.question_en} <button class="spk-btn" onclick="speak('${(it.question_en || '').replace(/'/g, "\\'")}')">🔊</button></div>
        <div style="color:var(--muted);font-size:15px;margin-bottom:12px;">${it.question_ko}</div>
        <div style="padding:12px;border-radius:12px;background:var(--surface-alt);border:1px solid var(--line-soft);">
          <div style="font-size:14px;color:var(--accent-strong);font-weight:600;margin-bottom:6px;">📝 모범답안 <button class="spk-btn" onclick="speak('${(it.answer_en || '').replace(/'/g, "\\'")}')">🔊</button></div>
          <div style="font-size:16px;line-height:1.7;margin-bottom:8px;" class="script-text">${formatScriptHtml(it.answer_en)}</div>
          <div style="color:var(--muted);font-size:15px;line-height:1.6;" class="script-text">${formatScriptHtml(it.answer_ko)}</div>
        </div>
      </div>`).join('');
  } catch (err) {
    resultEl.innerHTML = `<div style="margin-top:12px;color:var(--danger);">❌ ${err.message}</div>`;
  }
}

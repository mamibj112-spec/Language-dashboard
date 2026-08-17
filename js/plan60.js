// ── 60일 플랜: 레벨테스트 → 원어민 사고방식 패턴 학습(A/B 교차) → 쉐도잉 → 진행현황 ──
// 참고: Sarah English "60일 영어회화 플랜" 방법론
//  A day: 새 문장패턴 1개 학습 → 예문 → 쉐도잉 → 숙어/단어 학습
//  B day: 전날 패턴 복습 → 새 예문 → 쉐도잉 → 새 숙어/단어 학습

const PLAN60_LEVEL_LABEL = { beginner: '초급', intermediate: '중급', advanced: '고급' };

const PLAN60_TEST = [
  { ko: '"나 이 동네 산 지 1년 됐어" (지금까지 계속 살고 있음을 강조)', options: { A: 'I have lived here for 1 year', B: 'I lived here for 1 year', C: 'I am living here for 1 year', D: 'I will live here for 1 year' }, correct: 'A' },
  { ko: '"내가 어제 저녁 먹고 있을 때 전화가 왔어" (먹는 도중에 벌어진 일)', options: { A: 'I ate dinner when the phone rang', B: 'I was eating dinner when the phone rang', C: 'I have eaten dinner when the phone rang', D: 'I am eating dinner when the phone rang' }, correct: 'B' },
  { ko: '"시간 되면 나 그 영화 볼 것 같아" (부드러운 의향/추측)', options: { A: 'I will watch that movie', B: 'I watch that movie', C: 'I would watch that movie', D: 'I am watching that movie' }, correct: 'C' },
  { ko: '"나 어릴 때 여기 자주 왔었어" (예전 습관, 지금은 아님)', options: { A: 'I come here often as a kid', B: 'I used to come here often as a kid', C: 'I was coming here often as a kid', D: 'I have come here often as a kid' }, correct: 'B' },
  { ko: '"나 요즘 한 달째 계속 운동하고 있어" (지속되고 있는 동작 강조)', options: { A: 'I worked out for a month', B: 'I work out for a month', C: 'I am working out for a month', D: 'I have been working out for a month' }, correct: 'D' },
  { ko: '"내 방은 청소가 되어있어" (누가 했는지보다 상태가 중요)', options: { A: 'I clean my room', B: 'My room is cleaned', C: 'My room cleans', D: 'My room was clean' }, correct: 'B' },
  { ko: '"저 회사 규정 때문에 이거 꼭 해야 돼" (외부 규칙 때문에 하는 의무)', options: { A: 'I must do this', B: 'I should do this', C: 'I have to do this', D: 'I can do this' }, correct: 'C' },
  { ko: '"만약 내가 너였다면 그렇게 안 했을 거야" (현재 사실과 반대되는 가정)', options: { A: 'If I am you, I don’t do that', B: 'If I were you, I wouldn’t do that', C: 'If I was you, I won’t do that', D: 'If I will be you, I wouldn’t do that' }, correct: 'B' },
];

let plan60Level = localStorage.getItem('plan60_level') || null;
let plan60TestDone = localStorage.getItem('plan60_testDone') === '1';
let plan60CurrentDay = parseInt(localStorage.getItem('plan60_currentDay') || '1', 10);
let plan60Streak = parseInt(localStorage.getItem('plan60_streak') || '0', 10);
let plan60LastCompletedDate = localStorage.getItem('plan60_lastCompletedDate') || null;
let plan60Completed = JSON.parse(localStorage.getItem('plan60_completed') || '{}');
let plan60DayCache = JSON.parse(localStorage.getItem('plan60_dayCache') || '{}');
let plan60TestStarted = false;
let plan60TestIdx = 0;
let plan60TestScore = 0;
let plan60ReviewDay = null;

// ── 레벨테스트 ──
function plan60StartTest() {
  if (plan60TestDone && !confirm('레벨테스트를 다시 하면 지금까지의 60일 진행상황이 초기화돼요. 계속할까요?')) return;
  plan60TestStarted = true;
  plan60TestIdx = 0;
  plan60TestScore = 0;
  renderPlan60Test();
}

function plan60AnswerTest(key) {
  const q = PLAN60_TEST[plan60TestIdx];
  if (key === q.correct) plan60TestScore++;
  plan60TestIdx++;
  if (plan60TestIdx >= PLAN60_TEST.length) plan60FinishTest();
  else renderPlan60Test();
}

function plan60FinishTest() {
  const score = plan60TestScore;
  const level = score <= 3 ? 'beginner' : score <= 6 ? 'intermediate' : 'advanced';
  plan60Level = level;
  plan60TestDone = true;
  plan60CurrentDay = 1;
  plan60DayCache = {};
  plan60Completed = {};
  plan60Streak = 0;
  plan60LastCompletedDate = null;
  plan60ReviewDay = null;
  localStorage.setItem('plan60_level', level);
  localStorage.setItem('plan60_testDone', '1');
  localStorage.setItem('plan60_currentDay', '1');
  localStorage.setItem('plan60_dayCache', '{}');
  localStorage.setItem('plan60_completed', '{}');
  localStorage.setItem('plan60_streak', '0');
  localStorage.removeItem('plan60_lastCompletedDate');

  document.getElementById('plan60-test-content').innerHTML = `
    <div class="card" style="text-align:center;">
      <div style="font-size:40px;">🎯</div>
      <div class="card-title" style="margin-top:8px;">${score} / ${PLAN60_TEST.length} 정답!</div>
      <div class="card-sub" style="margin:10px 0;">추천 난이도: <b style="color:#a78bfa;">${PLAN60_LEVEL_LABEL[level]}</b></div>
      <button class="complete-btn" onclick="switchTab('plan60Today')">🗓️ 60일 플랜 시작하기</button>
    </div>`;
  plan60TestStarted = false;
  plan60TestIdx = 0;
}

function renderPlan60Test() {
  const el = document.getElementById('plan60-test-content');
  if (!el) return;

  if (plan60TestDone && !plan60TestStarted) {
    el.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:36px;">📝</div>
        <div class="card-title" style="margin-top:8px;">레벨테스트 완료</div>
        <div class="card-sub" style="margin:10px 0;">현재 난이도: <b style="color:#a78bfa;">${PLAN60_LEVEL_LABEL[plan60Level]}</b></div>
        <button class="complete-btn" style="background:rgba(255,255,255,0.08);" onclick="plan60StartTest()">🔄 다시 테스트하기</button>
      </div>`;
    return;
  }

  if (!plan60TestStarted) {
    el.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:36px;">📝</div>
        <div class="card-title" style="margin-top:8px;">레벨테스트</div>
        <div class="card-sub" style="margin:10px 0;line-height:1.6;">문장 뉘앙스 ${PLAN60_TEST.length}문제로<br>지금 실력에 맞는 60일 플랜을 준비해드려요</div>
        <button class="complete-btn" onclick="plan60StartTest()">▶ 테스트 시작</button>
      </div>`;
    return;
  }

  const q = PLAN60_TEST[plan60TestIdx];
  el.innerHTML = `
    <div class="card">
      <div class="quiz-meta">
        <span class="quiz-tag">📝 레벨테스트</span>
        <span class="quiz-progress">${plan60TestIdx + 1} / ${PLAN60_TEST.length}</span>
      </div>
      <div class="quiz-hint">가장 자연스러운 표현을 골라주세요</div>
      <div class="quiz-question" style="font-size:17px;line-height:1.5;">${q.ko}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
        ${Object.keys(q.options).map(key => `
          <button class="tab-btn" style="flex:none;width:100%;text-align:left;padding:12px 14px;font-size:15px;font-weight:600;" onclick="plan60AnswerTest('${key}')">
            <b style="color:#a78bfa;margin-right:6px;">${key}</b> ${q.options[key]}
          </button>`).join('')}
      </div>
    </div>`;
}

// ── 오늘의 학습 ──
function plan60DayType(day) {
  return day % 2 === 1 ? 'A' : 'B';
}

function PLAN60_PROMPT_A(level, learnedTitles) {
  const avoid = learnedTitles.length ? `이미 학습한 패턴(중복 금지): ${learnedTitles.join(', ')}` : '아직 학습한 패턴 없음 (오늘이 첫 패턴)';
  return `당신은 한국인 학습자를 위한 영어회화 코치입니다. 학습자 레벨: ${PLAN60_LEVEL_LABEL[level]}.
60일 영어회화 플랜 중 "새로운 문장 패턴을 배우는 날"의 학습 자료를 만들어주세요.
${avoid}

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
{
  "patternTitle": "문장구조 이름 (한국어로 간결하게, 예: 현재완료 vs 단순과거)",
  "patternExplain": "이 문장구조를 원어민이 실제로 어떤 뉘앙스로 쓰는지 한국어로 쉽게 설명 (3~5문장, 문법 용어보다 실제 느낌 위주)",
  "examples": [{"en":"영어 예문 (실생활 회화체)","ko":"한국어 번역"}] (4개),
  "idioms": [{"phrase":"영어 숙어/표현","meaning":"한국어 뜻","en":"이 숙어를 쓴 예문","ko":"예문 번역"}] (6개)
}
조건:
- ${PLAN60_LEVEL_LABEL[level]} 학습자 눈높이에 맞는 난이도
- 실제 대화에서 바로 쓸 수 있는 자연스러운 문장 위주`;
}

function PLAN60_PROMPT_B(level, patternTitle, patternExplain) {
  return `당신은 한국인 학습자를 위한 영어회화 코치입니다. 학습자 레벨: ${PLAN60_LEVEL_LABEL[level]}.
60일 영어회화 플랜 중 "어제 배운 패턴을 복습하는 날"의 학습 자료를 만들어주세요.
어제 배운 패턴: "${patternTitle}" — ${patternExplain}

이 패턴을 복습할 수 있도록 어제와 겹치지 않는 새로운 예문과 새로운 숙어를 만들어주세요. 다음 JSON 형식으로만 답하세요:
{
  "examples": [{"en":"영어 예문 (실생활 회화체)","ko":"한국어 번역"}] (4개),
  "idioms": [{"phrase":"영어 숙어/표현","meaning":"한국어 뜻","en":"이 숙어를 쓴 예문","ko":"예문 번역"}] (6개)
}
조건:
- ${PLAN60_LEVEL_LABEL[level]} 학습자 눈높이
- 어제 예문/숙어와 겹치지 않게 새로 작성`;
}

async function plan60GenerateDay() {
  const btn = document.getElementById('plan60-gen-btn');
  const errEl = document.getElementById('plan60-gen-error');
  if (!geminiApiKey) { errEl.innerHTML = `<div style="margin-top:10px;color:#fbbf24;font-size:14px;">${NO_KEY_MSG}</div>`; return; }

  btn.disabled = true;
  btn.textContent = '⏳ AI가 오늘 학습을 만들고 있어요...';
  errEl.innerHTML = '';

  const day = plan60CurrentDay;
  const type = plan60DayType(day);

  try {
    let content;
    if (type === 'A') {
      const learned = [...new Set(Object.values(plan60DayCache).map(c => c.patternTitle).filter(Boolean))];
      content = await geminiJSON(PLAN60_PROMPT_A(plan60Level, learned));
    } else {
      const prev = plan60DayCache[day - 1] || {};
      const partial = await geminiJSON(PLAN60_PROMPT_B(plan60Level, prev.patternTitle, prev.patternExplain));
      content = { patternTitle: prev.patternTitle, patternExplain: prev.patternExplain, examples: partial.examples, idioms: partial.idioms };
    }
    plan60DayCache[day] = content;
    localStorage.setItem('plan60_dayCache', JSON.stringify(plan60DayCache));
    renderPlan60Today();
  } catch (err) {
    errEl.innerHTML = `<div style="margin-top:10px;color:#f87171;font-size:14px;">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '✨ 오늘의 학습 시작하기';
  }
}

function plan60SpeakExample(day, i) {
  const c = plan60DayCache[day];
  if (c && c.examples[i]) speak(c.examples[i].en);
}
function plan60SpeakIdiomPhrase(day, i) {
  const c = plan60DayCache[day];
  if (c && c.idioms[i]) speak(c.idioms[i].phrase);
}
function plan60SpeakIdiomEx(day, i) {
  const c = plan60DayCache[day];
  if (c && c.idioms[i]) speak(c.idioms[i].en);
}

function plan60RenderContentCard(content, day) {
  const type = plan60DayType(day);
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📐</span>
        <div>
          <div class="card-title">${content.patternTitle}</div>
          <div class="card-sub">원어민 사고방식 · ${type === 'A' ? '오늘 새로 배우는 패턴' : '어제 배운 패턴 복습'}</div>
        </div>
      </div>
      <div style="font-size:15px;line-height:1.7;color:#e2e8f0;">${content.patternExplain}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">🗣️</span>
        <div>
          <div class="card-title">예문 쉐도잉</div>
          <div class="card-sub">🔊 듣고 그대로 따라 말해보세요</div>
        </div>
      </div>
      ${content.examples.map((ex, i) => `
        <div class="pattern-ex">
          <div class="pattern-ex-en">${ex.en} <button class="spk-btn" onclick="plan60SpeakExample(${day},${i})">🔊</button></div>
          <div class="pattern-ex-ko">${ex.ko}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📖</span>
        <div>
          <div class="card-title">오늘의 숙어·표현</div>
          <div class="card-sub">${content.idioms.length}개</div>
        </div>
      </div>
      ${content.idioms.map((id, i) => `
        <div class="vocab-ex">
          <div class="vocab-ex-en">${id.phrase} <button class="spk-btn" onclick="plan60SpeakIdiomPhrase(${day},${i})">🔊</button></div>
          <div class="vocab-ex-ko">${id.meaning}</div>
          <div style="margin-top:6px;font-size:14px;color:#e0f2fe;font-weight:600;">${id.en} <button class="spk-btn" onclick="plan60SpeakIdiomEx(${day},${i})">🔊</button></div>
          <div class="vocab-ex-ko" style="margin-top:2px;">${id.ko}</div>
        </div>`).join('')}
    </div>`;
}

function plan60CompleteDay() {
  const day = plan60CurrentDay;
  const content = plan60DayCache[day];
  if (!content) return;

  plan60Completed[day] = { type: plan60DayType(day), patternTitle: content.patternTitle, date: new Date().toDateString() };
  localStorage.setItem('plan60_completed', JSON.stringify(plan60Completed));

  const todayStr = new Date().toDateString();
  if (plan60LastCompletedDate !== todayStr) {
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
    plan60Streak = (plan60LastCompletedDate === yesterdayStr) ? plan60Streak + 1 : 1;
    plan60LastCompletedDate = todayStr;
    localStorage.setItem('plan60_streak', String(plan60Streak));
    localStorage.setItem('plan60_lastCompletedDate', plan60LastCompletedDate);
  }

  if (plan60CurrentDay < 60) {
    plan60CurrentDay++;
    localStorage.setItem('plan60_currentDay', String(plan60CurrentDay));
  } else {
    plan60CurrentDay = 61; // 완주 표시용
    localStorage.setItem('plan60_currentDay', '61');
  }
  renderPlan60Today();
}

function renderPlan60Today() {
  const el = document.getElementById('plan60-today-content');
  if (!el) return;

  if (!plan60TestDone) {
    el.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:36px;">🗓️</div>
        <div class="card-title" style="margin-top:8px;">60일 영어회화 플랜</div>
        <div class="card-sub" style="margin:10px 0 16px;line-height:1.6;">먼저 레벨테스트로 지금 실력을 확인하고<br>나에게 맞는 난이도로 60일 플랜을 시작해요</div>
        <button class="complete-btn" onclick="switchTab('plan60Test')">📝 레벨테스트 시작하기</button>
      </div>`;
    return;
  }

  if (plan60CurrentDay > 60) {
    el.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:40px;">🎉</div>
        <div class="card-title" style="margin-top:8px;">60일 플랜 완주!</div>
        <div class="card-sub" style="margin-top:8px;">정말 대단해요! 진행현황 탭에서 지난 학습을 복습해보세요</div>
      </div>`;
    return;
  }

  const day = plan60CurrentDay;
  const type = plan60DayType(day);
  const content = plan60DayCache[day];

  let html = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:16px;color:#a78bfa;font-weight:800;">Day ${day} / 60</div>
        <div style="font-size:13px;color:#94a3b8;">🔥 연속 ${plan60Streak}일</div>
      </div>
      <span class="pattern-tag">${type === 'A' ? '🆕 새 패턴' : '🔄 복습'}</span>
      <div class="card-sub" style="margin-top:8px;">난이도: ${PLAN60_LEVEL_LABEL[plan60Level]}</div>
    </div>`;

  if (!content) {
    html += `<button class="complete-btn" id="plan60-gen-btn" onclick="plan60GenerateDay()">✨ 오늘의 학습 시작하기</button>
      <div id="plan60-gen-error"></div>`;
    el.innerHTML = html;
    return;
  }

  html += plan60RenderContentCard(content, day);
  html += `<button class="complete-btn" onclick="plan60CompleteDay()">✅ 오늘 학습 완료</button>`;
  el.innerHTML = html;
}

// ── 진행현황 ──
function plan60ShowReviewDay(day) {
  plan60ReviewDay = day;
  plan60RenderReviewDetail();
  const el = document.getElementById('plan60-review-detail');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function plan60RenderReviewDetail() {
  const el = document.getElementById('plan60-review-detail');
  if (!el) return;
  const content = plan60DayCache[plan60ReviewDay];
  if (!content) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div style="margin-top:4px;">
      <div class="card-sub" style="margin-bottom:6px;">📅 Day ${plan60ReviewDay} 학습 내용</div>
      ${plan60RenderContentCard(content, plan60ReviewDay)}
    </div>`;
}

function renderPlan60Progress() {
  const el = document.getElementById('plan60-progress-content');
  if (!el) return;

  if (!plan60TestDone) {
    el.innerHTML = `
      <div class="card" style="text-align:center;">
        <div class="card-sub">레벨테스트를 먼저 완료해주세요</div>
        <button class="complete-btn" style="margin-top:10px;" onclick="switchTab('plan60Test')">📝 레벨테스트 하러가기</button>
      </div>`;
    return;
  }

  const completedCount = Object.keys(plan60Completed).length;
  const boxes = Array.from({ length: 60 }, (_, i) => i + 1).map(d => {
    const isDone = !!plan60Completed[d];
    const isCurrent = d === plan60CurrentDay && !isDone;
    const type = plan60DayType(d);
    const bg = isDone ? 'rgba(74,222,128,0.18)' : isCurrent ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.04)';
    const border = isDone ? '#4ade80' : isCurrent ? '#a78bfa' : 'rgba(255,255,255,0.08)';
    const color = isDone ? '#4ade80' : isCurrent ? '#fff' : '#64748b';
    const clickable = isDone || (d === plan60CurrentDay && plan60DayCache[d]);
    return `<div ${clickable ? `onclick="plan60ShowReviewDay(${d})"` : ''} style="aspect-ratio:1;border-radius:8px;background:${bg};border:1px solid ${border};display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${color};cursor:${clickable ? 'pointer' : 'default'};">
      <div>${d}</div><div style="font-size:10px;opacity:.7;">${type}${isDone ? ' ✓' : ''}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-around;text-align:center;">
        <div><div class="card-sub">난이도</div><div style="font-weight:800;color:#a78bfa;margin-top:2px;">${PLAN60_LEVEL_LABEL[plan60Level]}</div></div>
        <div><div class="card-sub">연속 학습</div><div style="font-weight:800;color:#fbbf24;margin-top:2px;">🔥 ${plan60Streak}일</div></div>
        <div><div class="card-sub">완료</div><div style="font-weight:800;color:#4ade80;margin-top:2px;">${completedCount} / 60</div></div>
      </div>
      <button class="complete-btn" style="margin-top:12px;background:rgba(255,255,255,0.08);" onclick="plan60StartTest()">🔄 레벨테스트 다시하기</button>
    </div>
    <div class="card">
      <div class="card-sub" style="margin-bottom:10px;">완료한 날을 탭하면 그날 학습 내용을 다시 볼 수 있어요</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;">${boxes}</div>
    </div>
    <div id="plan60-review-detail"></div>`;

  if (plan60ReviewDay) plan60RenderReviewDetail();
}

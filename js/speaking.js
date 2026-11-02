// -- 스피킹 탭: 매일 1분 말하기 훈련 --
// 인풋(짧은 표현 20개를 듣기 → 뜻 익히기 → 따라 말하기 → 3초 안에 혼자 말하기)으로 표현을 입에 붙이고,
// 같은 주제의 아웃풋(그 표현들로 이어진 10문장 이야기를 1분 동안 말하기)으로 실제로 써먹는 30일 과정.
// 5일마다 앞 5일 표현을 섞어 말해보는 중간점검(선택)이 열린다.
// 문장은 교재를 옮기지 않고 AI가 주제별로 새로 만든다. (단계 화면·타이머는 speaking-steps.js)

const SPEAKING_TOPICS = [
  { ko: '아침에 눈뜨고 하는 일', focus: 'I just ~ / I\'m -ing (방금 한 일, 지금 하는 일)' },
  { ko: '처음 만난 사람에게 짧은 자기소개', focus: 'I\'m ~ / I work ~ / You can call me ~' },
  { ko: '지금 내 몸 상태와 기분', focus: 'I feel ~ / I\'m so ~ / I feel like ~' },
  { ko: '출근·외출 길에 보이는 장면', focus: 'I\'m on ~ / There is ~ / I\'m waiting for ~' },
  { ko: '집에 돌아온 뒤 저녁 시간', focus: 'I just got home / I\'m gonna ~ / Today was all about ~' },
  { ko: '내 책상·작업 공간 묘사', focus: 'There\'s ~ on my desk / I keep ~ / next to ~' },
  { ko: '가방 속에 늘 들고 다니는 물건', focus: 'I always carry ~ / I never leave home without ~' },
  { ko: '같이 일하는 사람 소개', focus: 'This is ~ / He/She is in charge of ~ / We work together on ~' },
  { ko: '우리 가족 소개', focus: 'There are ~ people in my family / My ~ is ~' },
  { ko: '요즘 제일 아끼는 물건', focus: 'My favorite ~ is ~ / I can\'t live without ~' },
  { ko: '나의 작은 생활 습관', focus: 'I usually ~ / I tend to ~ / Every morning, I ~' },
  { ko: '궁금한 걸 가볍게 물어보기', focus: 'Can I ask ~? / Do you know ~? / How do you ~?' },
  { ko: '어제 있었던 일 이야기', focus: 'Yesterday, I ~ (과거형) / After that, ~' },
  { ko: '얼마나 자주 하는지 말하기', focus: 'once a week / every other day / I hardly ever ~' },
  { ko: '지금 내 주변 풍경 묘사', focus: 'I can see ~ / It looks ~ / Around me, there are ~' },
  { ko: '오랜만에 안부 묻고 답하기', focus: 'How have you been? / I\'ve been ~ / What\'s new?' },
  { ko: '좋은 일에 맞장구치기', focus: 'That\'s amazing! / I love it! / Good for you!' },
  { ko: '부탁하고 양해 구하기', focus: 'Could you ~? / Would you mind -ing? / Sorry to bother you, but ~' },
  { ko: '작은 실수 인정하고 사과하기', focus: 'My bad / I didn\'t mean to ~ / It won\'t happen again' },
  { ko: '고마움 전하고 마무리 인사', focus: 'Thanks for ~ / I really appreciate ~ / See you ~' },
  { ko: '좋아하는 것과 싫어하는 것', focus: 'I\'m into ~ / I\'m not a big fan of ~ / I prefer A to B' },
  { ko: '내 생각 말하기', focus: 'I think ~ / In my opinion, ~ / To be honest, ~' },
  { ko: '고르고 결정하기', focus: 'I\'ll go with ~ / I can\'t decide between ~ / I chose ~ because ~' },
  { ko: '두 가지를 비교하기', focus: 'A is better than B / not as ~ as / compared to ~' },
  { ko: '짧게 이유 덧붙이기', focus: 'because ~ / That\'s why ~ / The reason is ~' },
  { ko: '앞으로의 계획과 목표', focus: 'I\'m planning to ~ / I\'m going to ~ / My goal is to ~' },
  { ko: '요즘 바꾸고 있는 습관', focus: 'I\'m trying to ~ / I used to ~, but now ~ / I quit -ing' },
  { ko: '문제가 생겼을 때 대처하기', focus: 'Something went wrong with ~ / I had to ~ / Luckily, ~' },
  { ko: '지난 일 돌아보기', focus: 'Looking back, ~ / I should have ~ / I learned ~' },
  { ko: '30일 마무리와 다짐', focus: 'I\'ve been -ing for ~ / I\'m proud that ~ / From now on, ~' },
];
const SPEAKING_TOTAL_DAYS = SPEAKING_TOPICS.length;

let speakingCompleted = parseInt(localStorage.getItem('speaking_completed') || '0', 10);
let speakingStreak = parseInt(localStorage.getItem('speaking_streak') || '0', 10);
let speakingLastDate = localStorage.getItem('speaking_lastDate') || '';
let speakingDays = JSON.parse(localStorage.getItem('speaking_days') || '{}');
let speakingCheckData = JSON.parse(localStorage.getItem('speaking_checkData') || '{}');
let speakingReps = JSON.parse(localStorage.getItem('speaking_reps') || '{}');
let speakingOpenDay = null;     // 펼친 DAY (내용이 있으면 전체화면 학습)
let speakingOpenCheck = null;   // 펼친 중간점검 (마지막 DAY 번호: 5, 10, ...)
let speakingStepIdx = 0;
let speakingReveal = {};        // 단계 화면에서 탭해서 공개한 항목들

function speakingStatus(day) {
  if (day <= speakingCompleted) return 'done';
  if (day === speakingCompleted + 1) return 'current';
  return 'locked';
}

// AI가 넣는 **강조** 기호만 지운다 (끊어 읽기 표시 ' * '는 한 개짜리라 남김)
function speakingStripMarkdown(v) {
  if (typeof v === 'string') return v.replace(/\*\*/g, '');
  if (Array.isArray(v)) return v.map(speakingStripMarkdown);
  if (v && typeof v === 'object') {
    const out = {};
    Object.keys(v).forEach(k => { out[k] = speakingStripMarkdown(v[k]); });
    return out;
  }
  return v;
}

// 끊어 읽기 표시는 영어(en)에만 쓰는데, AI가 한국어에도 별표를 넣는 경우가 있어서 en 말고는 다 지움
function speakingCleanContent(v, key) {
  if (typeof v === 'string') return key === 'en' ? v : v.replace(/\s*\*\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (Array.isArray(v)) return v.map(x => speakingCleanContent(x, key));
  if (v && typeof v === 'object') {
    const out = {};
    Object.keys(v).forEach(k => { out[k] = speakingCleanContent(v[k], k); });
    return out;
  }
  return v;
}

// 끊어 읽기 표시(*)를 화면용 / 로
function speakingChunkHtml(en) {
  return (en || '')
    .replace(/^\s*\*\s*|\s*\*\s*(?=[.,!?]*\s*$)|\s*\*\s*(?=[.,!?])/g, '')   // 문장 맨 앞·끝·문장부호 앞 별표는 끊는 곳이 아님
    .replace(/\s*\*\s*/g, ' <span class="sp-chunk">/</span> ');
}

// 읽어주기·빈칸용: 끊어 읽기 표시 제거
function speakingPlain(en) {
  return (en || '').replace(/\s*\*\s*(?=[.,!?])/g, '').replace(/\s*\*\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function speakingDayPrompt(day) {
  const topic = SPEAKING_TOPICS[day - 1];
  return `당신은 한국인 학습자를 위한 영어 스피킹 코치입니다. "짧은 표현을 소리로 먼저 익히고(인풋), 그 표현들을 이어서 1분짜리 이야기로 말해보는(아웃풋)" 방식으로 하루치 학습 자료를 만듭니다.

오늘은 30일 과정 중 DAY ${day}, 주제는 "${topic.ko}"입니다. 오늘 입에 붙일 핵심 문형: ${topic.focus}

조건:
- 모든 문장은 교재나 다른 자료를 옮기지 말고 직접 새로 지어주세요.
- 원어민이 실제로 말할 때 쓰는 짧고 자연스러운 구어체로, 중학생도 읽을 수 있는 쉬운 단어 위주로 써주세요.
- 영어 문장(en)에만 의미 단위로 끊어 말하는 곳마다 " * " (앞뒤 공백 포함 별표 한 개)를 넣어주세요. 예: I usually * grab a coffee * on my way. 한국어(ko, hint, keyKo)에는 별표를 절대 넣지 마세요.
- 강조용 별표 두 개(**) 같은 마크다운 기호는 절대 쓰지 마세요.
- input 20문장은 서로 다른 행동·상황·표현이어야 해요. 같은 뜻을 단어만 바꾼 문장(예: woke up / got up)을 반복하지 마세요.
- output 이야기는 input에서 연습한 표현을 최대한 다시 활용해서, '나'의 경험을 1인칭으로 써주세요. 실제 사람이 친구에게 말하듯 앞뒤가 자연스럽게 이어져야 하고, 같은 말을 되풀이하지 마세요.

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
{
  "title": "오늘 주제를 나타내는 짧은 영어 제목 (2~4단어)",
  "input": [
    {
      "en": "끊어 읽기 * 표시가 들어간 짧은 영어 문장 (5~9단어)",
      "ko": "자연스러운 한국어 뜻",
      "key": "이 문장의 핵심 표현 원형 (예: wake up)",
      "keyKo": "핵심 표현의 뜻 (예: 잠에서 깨다)",
      "verb": "문장에 불규칙 동사가 있으면 '원형 - 과거 - 과거분사' (예: wake - woke - woken), 없으면 빈 문자열"
    }
  ] (정확히 20개, 주제에 맞는 상황·행동을 자연스러운 순서로),
  "output": {
    "titleKo": "이야기의 짧은 한국어 제목",
    "sentences": [
      {
        "ko": "이야기의 한국어 문장",
        "en": "그 문장의 영어 (끊어 읽기 * 표시 포함)",
        "hint": "핵심 표현 힌트 (한국어 뜻 + 영어, 예: 잠에서 깨다 wake up)",
        "blank": "en 안에서 빈칸으로 가릴 핵심 단어나 짧은 구 (* 표시 없이, en에 글자 그대로 있는 부분)"
      }
    ] (정확히 10개, 소리 내어 읽으면 1분 정도 되는 이어지는 이야기)
  }
}`;
}

async function speakingGenerate(day) {
  const btn = document.getElementById('speaking-gen-btn-' + day) || document.getElementById('speaking-regen-btn');
  const errEl = document.getElementById('speaking-err-' + day) || document.getElementById('speaking-study-err');
  if (!geminiApiKey) { errEl.innerHTML = `<div style="margin-top:8px;color:var(--warning);font-size:13px;">${NO_KEY_MSG}</div>`; return; }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 만드는 중... (20~30초)';
  errEl.innerHTML = '';

  try {
    const content = speakingCleanContent(speakingStripMarkdown(await geminiJSON(speakingDayPrompt(day))));
    if (!Array.isArray(content.input) || !content.input.length || !content.output || !Array.isArray(content.output.sentences)) {
      throw new Error('AI 답변 형식이 이상해요. 한 번 더 눌러주세요.');
    }
    speakingDays[day] = content;
    localStorage.setItem('speaking_days', JSON.stringify(speakingDays));
    Object.keys(speakingReps).forEach(k => { if (k.startsWith(day + '-')) delete speakingReps[k]; });
    localStorage.setItem('speaking_reps', JSON.stringify(speakingReps));
    speakingStepIdx = 0;
    speakingReveal = {};
    renderSpeaking();
  } catch (err) {
    errEl.innerHTML = `<div style="margin-top:8px;color:var(--danger);font-size:13px;">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ── 중간점검: 앞 5일 표현을 두 개씩 섞은 문장을 5초 안에 말해보기 ──
function speakingCheckPrompt(throughDay) {
  const lines = [];
  for (let d = throughDay - 4; d <= throughDay; d++) {
    const c = speakingDays[d];
    if (!c) continue;
    c.input.forEach(it => lines.push(`DAY ${d}: ${it.key} (${it.keyKo}) - ${speakingPlain(it.en)}`));
  }
  return `당신은 한국인 학습자를 위한 영어 스피킹 코치입니다. 학습자가 지난 5일 동안 아래 표현들을 연습했습니다.

${lines.join('\n')}

이 중 서로 다른 DAY의 표현 두 개를 섞어서 한 문장으로 말해보는 중간점검 문제 8개를 만들어주세요.
- 짧고 자연스러운 구어체, 직접 새로 지은 문장
- 영어 문장(en)에만 의미 단위로 끊어 말하는 곳마다 " * " (앞뒤 공백 포함 별표 한 개)를 넣어주세요. 한국어에는 별표를 넣지 마세요
- 강조용 별표 두 개(**) 같은 마크다운 기호는 절대 쓰지 마세요

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
{
  "items": [
    {
      "days": [섞은 두 DAY 번호, 예: 1, 3],
      "ko": "한국어 문장",
      "en": "영어 문장 (끊어 읽기 * 표시 포함)",
      "hint": "섞은 핵심 표현 두 개 (예: 잠에서 깨다 wake up · 배고픈 starving)"
    }
  ] (정확히 8개)
}`;
}

async function speakingGenerateCheck(throughDay) {
  const btn = document.getElementById('speaking-check-gen-btn-' + throughDay) || document.getElementById('speaking-regen-btn');
  const errEl = document.getElementById('speaking-check-err-' + throughDay) || document.getElementById('speaking-study-err');
  if (!geminiApiKey) { errEl.innerHTML = `<div style="margin-top:8px;color:var(--warning);font-size:13px;">${NO_KEY_MSG}</div>`; return; }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 만드는 중...';
  errEl.innerHTML = '';

  try {
    const content = speakingCleanContent(speakingStripMarkdown(await geminiJSON(speakingCheckPrompt(throughDay))));
    if (!Array.isArray(content.items) || !content.items.length) throw new Error('AI 답변 형식이 이상해요. 한 번 더 눌러주세요.');
    speakingCheckData[throughDay] = content;
    localStorage.setItem('speaking_checkData', JSON.stringify(speakingCheckData));
    speakingStepIdx = 0;
    speakingReveal = {};
    renderSpeaking();
  } catch (err) {
    errEl.innerHTML = `<div style="margin-top:8px;color:var(--danger);font-size:13px;">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function speakingToggleDay(day) {
  if (speakingStatus(day) === 'locked') return;
  speakingStopAll();
  speakingOpenCheck = null;
  speakingOpenDay = speakingOpenDay === day ? null : day;
  speakingStepIdx = 0;
  speakingReveal = {};
  renderSpeaking();
}

function speakingToggleCheck(throughDay) {
  speakingStopAll();
  speakingOpenDay = null;
  speakingOpenCheck = speakingOpenCheck === throughDay ? null : throughDay;
  speakingStepIdx = 0;
  speakingReveal = {};
  renderSpeaking();
}

function speakingComplete(day) {
  if (day !== speakingCompleted + 1) return;
  speakingCompleted = day;
  localStorage.setItem('speaking_completed', String(speakingCompleted));

  const today = new Date().toISOString().slice(0, 10);
  if (speakingLastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    speakingStreak = (speakingLastDate === yesterday) ? speakingStreak + 1 : 1;
    speakingLastDate = today;
    localStorage.setItem('speaking_streak', String(speakingStreak));
    localStorage.setItem('speaking_lastDate', speakingLastDate);
  }

  speakingStopAll();
  speakingOpenDay = null;
  speakingStepIdx = 0;
  renderSpeaking();
}

// 다른 탭으로 나갈 때 전체화면·타이머·음성이 남지 않게 정리
function speakingCloseOverlays() {
  const wasOpen = speakingOpenDay !== null || speakingOpenCheck !== null;
  if (!wasOpen) return;
  speakingStopAll();
  if (speakingOpenDay !== null && speakingDays[speakingOpenDay]) speakingOpenDay = null;
  if (speakingOpenCheck !== null && speakingCheckData[speakingOpenCheck]) speakingOpenCheck = null;
  renderSpeaking();
}

function speakingDayRow(day) {
  const status = speakingStatus(day);
  const isOpen = speakingOpenDay === day;
  const icon = status === 'done' ? '✅' : status === 'current' ? '▶️' : '🔒';
  const topic = SPEAKING_TOPICS[day - 1];
  const tagStyle = status === 'done'
    ? 'background:var(--success-wash);color:var(--success);border-color:rgba(21,128,61,0.3);'
    : '';
  const genBlock = isOpen && !speakingDays[day] ? `
    <div style="margin-top:10px;" onclick="event.stopPropagation();">
      <button class="complete-btn" id="speaking-gen-btn-${day}" style="background:var(--accent-strong);" onclick="speakingGenerate(${day})">🗣 DAY ${day} 연습 자료 만들기</button>
      <div id="speaking-err-${day}"></div>
    </div>` : '';
  return `
    <div id="speaking-row-${day}" class="pattern-item${isOpen ? ' open' : ''}" onclick="speakingToggleDay(${day})">
      <div class="pattern-top" style="justify-content:flex-start;">
        <span class="pattern-tag" style="${tagStyle}">${icon} DAY ${day}</span>
        <span style="font-size:16px;font-weight:600;color:var(--ink);word-break:keep-all;">${topic.ko}</span>
      </div>
      ${genBlock}
    </div>`;
}

function speakingCheckRow(throughDay) {
  const isOpen = speakingOpenCheck === throughDay;
  const done = !!speakingCheckData[throughDay] && !!speakingCheckData[throughDay].done;
  const genBlock = isOpen && !speakingCheckData[throughDay] ? `
    <div style="margin-top:10px;" onclick="event.stopPropagation();">
      <div style="font-size:14px;color:var(--ink-soft);line-height:1.6;margin-bottom:8px;">DAY ${throughDay - 4}~${throughDay} 표현을 두 개씩 섞은 문장 8개를 5초 안에 영어로 말해봐요. (안 해도 다음 DAY는 열려요)</div>
      <button class="complete-btn" id="speaking-check-gen-btn-${throughDay}" style="background:var(--accent-strong);" onclick="speakingGenerateCheck(${throughDay})">📝 중간점검 문제 만들기</button>
      <div id="speaking-check-err-${throughDay}"></div>
    </div>` : '';
  return `
    <div id="speaking-check-row-${throughDay}" class="pattern-item${isOpen ? ' open' : ''}" style="border-color:var(--accent-soft);" onclick="speakingToggleCheck(${throughDay})">
      <div class="pattern-top" style="justify-content:flex-start;">
        <span class="pattern-tag" style="background:var(--accent-wash-strong);color:var(--accent-strong);">${done ? '✅' : '📝'} 중간점검</span>
        <span style="font-size:16px;font-weight:600;color:var(--ink);">DAY ${throughDay - 4}~${throughDay}</span>
      </div>
      ${genBlock}
    </div>`;
}

function renderSpeaking() {
  const el = document.getElementById('speaking-content');
  if (!el) return;

  const allDone = speakingCompleted >= SPEAKING_TOTAL_DAYS;
  const header = `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">🗣</span>
        <div>
          <div class="card-title">매일 1분 스피킹 훈련</div>
          <div class="card-sub">표현을 소리로 익히고(인풋) → 그 표현으로 1분 이야기를 말해요(아웃풋)</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:14px;color:var(--muted);">
        <span>🔥 연속 ${speakingStreak}일</span>
        <span>${speakingCompleted} / ${SPEAKING_TOTAL_DAYS}일 완료</span>
      </div>
      ${allDone ? '<div style="margin-top:10px;font-size:15px;font-weight:700;color:var(--success);">🎉 30일 과정을 모두 끝냈어요! 언제든 다시 열어서 복습할 수 있어요.</div>' : ''}
    </div>`;

  const maxDay = Math.min(speakingCompleted + 1, SPEAKING_TOTAL_DAYS);
  const rows = [];
  for (let day = 1; day <= maxDay; day++) {
    rows.push(speakingDayRow(day));
    if (day % 5 === 0 && speakingStatus(day) === 'done') rows.push(speakingCheckRow(day));
  }

  el.innerHTML = header + rows.join('');
  renderSpeakingStudy();
}

// 학습 단계는 목록 위에 전체화면으로 띄운다 (어휘 탭과 같은 방식)
function renderSpeakingStudy() {
  const el = document.getElementById('speaking-study');
  if (!el) return;

  const isCheck = speakingOpenCheck !== null;
  const content = isCheck ? speakingCheckData[speakingOpenCheck] : (speakingOpenDay !== null && speakingDays[speakingOpenDay]);
  if (!content) { el.innerHTML = ''; return; }

  const steps = isCheck ? speakingCheckStepDefs() : speakingDayStepDefs();
  speakingStepIdx = Math.max(0, Math.min(speakingStepIdx, steps.length - 1));
  const idx = speakingStepIdx;
  const step = steps[idx];
  const dots = steps.map((s, i) => `<div class="step-dot${i < idx ? ' done' : i === idx ? ' on' : ''}"></div>`).join('');
  const label = isCheck ? `중간점검 DAY ${speakingOpenCheck - 4}~${speakingOpenCheck}` : `DAY ${speakingOpenDay}`;
  const regen = isCheck ? `speakingGenerateCheck(${speakingOpenCheck})` : `speakingGenerate(${speakingOpenDay})`;
  const close = isCheck ? `speakingToggleCheck(${speakingOpenCheck})` : `speakingToggleDay(${speakingOpenDay})`;

  // 체크·공개처럼 같은 단계 안에서 다시 그릴 땐 스크롤 위치 유지
  const oldBody = document.getElementById('speaking-study-body');
  const keepScroll = oldBody && el.dataset.stepKey === label + '-' + idx ? oldBody.scrollTop : 0;
  el.dataset.stepKey = label + '-' + idx;

  el.innerHTML = `
    <div style="position:fixed;inset:0;z-index:9997;display:flex;flex-direction:column;background:var(--paper);">
      <div style="flex:0 0 auto;width:100%;max-width:560px;margin:0 auto;padding:14px 16px 4px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div class="step-label" style="margin:0;text-align:left;font-size:14px;">${label} · ${idx + 1} / ${steps.length}단계</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button id="speaking-regen-btn" onclick="speakingStopAll();${regen}" style="font-size:12px;font-weight:700;color:var(--muted);background:none;border:none;cursor:pointer;padding:6px 0;">🔄 다시 만들기</button>
            <button onclick="${close}" style="width:42px;height:42px;border-radius:50%;background:var(--surface-alt);color:var(--ink);border:none;font-size:20px;cursor:pointer;">✕</button>
          </div>
        </div>
        <div class="step-track" style="margin-top:10px;margin-bottom:6px;">${dots}</div>
        <div id="speaking-study-err"></div>
      </div>
      <div id="speaking-study-body" style="flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;width:100%;max-width:560px;margin:0 auto;padding:0 16px 12px;">
        ${speakingRenderStep(step, content)}
      </div>
      ${step.key !== 'done' ? `
        <div style="flex:0 0 auto;width:100%;max-width:560px;margin:0 auto;padding:10px 16px calc(14px + env(safe-area-inset-bottom));">
          <div class="step-nav" style="margin-top:0;">
            <button class="step-nav-btn" ${idx === 0 ? 'disabled' : ''} onclick="speakingGoStep(-1)">← 이전</button>
            <button class="step-nav-btn primary" onclick="speakingGoStep(1)">다음 →</button>
          </div>
        </div>` : ''}
    </div>`;

  if (keepScroll) document.getElementById('speaking-study-body').scrollTop = keepScroll;
}

function speakingGoStep(delta) {
  speakingStopAll();
  speakingStepIdx += delta;
  speakingReveal = {};
  renderSpeakingStudy();
  const body = document.getElementById('speaking-study-body');
  if (body) body.scrollTop = 0;
}

// -- 어휘 탭: 단어를 뜻만 외우지 않고 예문과 함께 익히고 직접 따라 써보는 학습법 --
// (단어+실제 예문을 세트로 외우고, 예문을 손으로 따라 쓰듯 타이핑하며 체화 + 매일 학습 스트릭)

let vocabdeckCompleted = parseInt(localStorage.getItem('vocabdeck_completed') || '0', 10);
let vocabdeckStreak = parseInt(localStorage.getItem('vocabdeck_streak') || '0', 10);
let vocabdeckLastDate = localStorage.getItem('vocabdeck_lastDate') || '';
let vocabdeckDays = JSON.parse(localStorage.getItem('vocabdeck_days') || '{}');
let vocabdeckUsedWords = JSON.parse(localStorage.getItem('vocabdeck_usedWords') || '[]');
let vocabdeckOpen = null;
let vocabdeckStepIdx = 0;
let vocabdeckWriteState = {};

function vocabdeckStatus(day) {
  if (day <= vocabdeckCompleted) return 'done';
  if (day === vocabdeckCompleted + 1) return 'current';
  return 'locked';
}

function vocabdeckToggle(day) {
  if (vocabdeckStatus(day) === 'locked') return;
  const opening = vocabdeckOpen !== day;
  vocabdeckOpen = opening ? day : null;
  if (opening) {
    vocabdeckStepIdx = 0;
    vocabdeckWriteState = {};
  }
  renderVocabDeck();
  if (vocabdeckOpen === day) {
    setTimeout(() => {
      const row = document.getElementById('vocabdeck-row-' + day);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }
}

const VOCABDECK_JSON_SPEC = `{
  "words": [
    {
      "word": "영단어 원형",
      "pos": "품사 (동사/명사/형용사/부사 등, 한글로 짧게)",
      "ko": "가장 핵심적인 한국어 뜻 (짧게)",
      "example": {"en": "이 단어가 실생활 대화에서 실제로 쓰이는 자연스러운 예문 (원어민이 쓸 법한 문장)", "ko": "예문의 한국어 번역"}
    }
  ] (8개, 서로 다른 단어)
}`;

function vocabdeckPrompt(day, avoidWords) {
  return `당신은 한국인 학습자를 위한 영어 어휘 코치입니다. "단어 뜻만 따로 외우지 말고, 그 단어가 실제로 쓰이는 예문과 함께 외워야 한다"는 원칙으로 하루 8개씩 단어를 가르칩니다.

오늘은 ${day}일차 학습입니다. 실생활 영어 회화나 뉴스, 일상 대화에서 자주 쓰이는 실용적인 중급 수준 단어 8개를 골라주세요.${day > 1 ? ' 날짜가 진행될수록 단어 난이도를 아주 조금씩 높여주세요.' : ''}

아래 단어들은 이미 이전 DAY에서 다뤘으니 절대 중복해서 고르지 마세요:
${avoidWords.length ? avoidWords.join(', ') : '(아직 없음)'}

각 단어마다 뜻만 딱 주지 말고, 그 단어가 실제 문장 속에서 어떻게 쓰이는지 보여주는 자연스러운 예문을 반드시 함께 만들어주세요.

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
${VOCABDECK_JSON_SPEC}`;
}

async function vocabdeckGenerate(day) {
  const btn = document.getElementById('vocabdeck-gen-btn-' + day);
  const errEl = document.getElementById('vocabdeck-err-' + day);
  if (!geminiApiKey) { errEl.innerHTML = `<div style="margin-top:8px;color:var(--warning);font-size:12px;">${NO_KEY_MSG}</div>`; return; }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 만드는 중...';
  errEl.innerHTML = '';

  try {
    const prompt = vocabdeckPrompt(day, vocabdeckUsedWords);
    const content = await geminiJSON(prompt);
    vocabdeckDays[day] = content;
    localStorage.setItem('vocabdeck_days', JSON.stringify(vocabdeckDays));
    const newWords = content.words.map(w => w.word.toLowerCase());
    vocabdeckUsedWords = vocabdeckUsedWords.concat(newWords);
    localStorage.setItem('vocabdeck_usedWords', JSON.stringify(vocabdeckUsedWords));
    vocabdeckStepIdx = 0;
    renderVocabDeck();
  } catch (err) {
    errEl.innerHTML = `<div style="margin-top:8px;color:var(--danger);font-size:12px;">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function vocabdeckSpeak(day, wordIdx) {
  const d = vocabdeckDays[day];
  const w = d && d.words[wordIdx];
  if (w) speak(w.example.en);
}

function vocabdeckNorm(s) {
  return (s || '').toLowerCase().replace(/[.,!?'"…]/g, '').replace(/\s+/g, ' ').trim();
}

function vocabdeckCheck(day, wordIdx) {
  const input = document.getElementById('vocabdeck-write-' + wordIdx);
  const val = input.value;
  const d = vocabdeckDays[day];
  const correct = d.words[wordIdx].example.en;
  const isCorrect = vocabdeckNorm(val) === vocabdeckNorm(correct);
  vocabdeckWriteState[wordIdx] = { value: val, checked: true, correct: isCorrect };
  renderVocabDeck();
}

function vocabdeckGoStep(delta) {
  vocabdeckStepIdx += delta;
  renderVocabDeck();
}

function vocabdeckComplete(day) {
  if (day !== vocabdeckCompleted + 1) return;
  vocabdeckCompleted = day;
  localStorage.setItem('vocabdeck_completed', String(vocabdeckCompleted));

  const today = new Date().toISOString().slice(0, 10);
  if (vocabdeckLastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    vocabdeckStreak = (vocabdeckLastDate === yesterday) ? vocabdeckStreak + 1 : 1;
    vocabdeckLastDate = today;
    localStorage.setItem('vocabdeck_streak', String(vocabdeckStreak));
    localStorage.setItem('vocabdeck_lastDate', vocabdeckLastDate);
  }

  vocabdeckOpen = null;
  vocabdeckStepIdx = 0;
  renderVocabDeck();
}

function vocabdeckIntroCard(day, content) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📋</span>
        <div>
          <div class="card-title">DAY ${day} · 오늘의 단어 8개</div>
          <div class="card-sub">🔥 연속 ${vocabdeckStreak}일째 학습 중</div>
        </div>
      </div>
      <div style="font-size:13px;line-height:1.7;color:var(--ink-soft);margin-bottom:12px;">단어 뜻만 외우지 말고, 예문과 함께 익히고 직접 따라 써보면서 외워보세요.</div>
      ${content.words.map((w, i) => `<div style="display:flex;gap:8px;margin-bottom:8px;"><span style="color:var(--accent);font-weight:700;flex-shrink:0;">${i + 1}.</span><span style="color:var(--ink);font-weight:600;">${w.word}</span><span style="color:var(--muted);">${w.ko}</span></div>`).join('')}
    </div>`;
}

function vocabdeckWordCard(day, content, wordIdx) {
  const w = content.words[wordIdx];
  const state = vocabdeckWriteState[wordIdx];
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">🔤</span>
        <div>
          <div class="card-title">${wordIdx + 1}. ${w.word} <span style="font-size:12px;color:var(--muted);font-weight:500;">(${w.pos})</span></div>
          <div class="card-sub">${w.ko}</div>
        </div>
      </div>
      <div class="pattern-ex">
        <div class="pattern-ex-en">${w.example.en} <button class="spk-btn" onclick="event.stopPropagation();vocabdeckSpeak(${day},${wordIdx})">🔊</button></div>
        <div class="pattern-ex-ko">${w.example.ko}</div>
      </div>
      <div style="margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:var(--accent-strong);margin-bottom:6px;">✍️ 위 예문을 보면서 손으로 따라 쓰듯 똑같이 타이핑해보세요</div>
        <textarea id="vocabdeck-write-${wordIdx}" rows="2" style="width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--surface-alt);color:var(--ink);font-size:14px;font-family:var(--font-body);resize:vertical;" onclick="event.stopPropagation();">${state ? state.value : ''}</textarea>
        <button class="step-nav-btn primary" style="margin-top:8px;width:100%;" onclick="event.stopPropagation();vocabdeckCheck(${day},${wordIdx})">확인</button>
        ${state && state.checked ? `
          <div style="margin-top:8px;padding:10px 12px;border-radius:8px;background:${state.correct ? 'var(--success-wash)' : 'var(--warning-wash)'};">
            <div style="font-size:13px;font-weight:700;color:${state.correct ? 'var(--success)' : 'var(--warning)'};">${state.correct ? '✅ 정확해요!' : '⚠️ 조금 다르네요, 비교해보세요'}</div>
            ${!state.correct ? `<div style="font-size:13px;color:var(--ink-soft);margin-top:4px;">정답: ${w.example.en}</div>` : ''}
          </div>` : ''}
      </div>
    </div>`;
}

function vocabdeckDoneCard(day) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">🎉</span>
        <div><div class="card-title">DAY ${day} 학습 끝!</div><div class="card-sub">오늘 배운 8개 단어를 다음에 한번 더 복습해보세요</div></div>
      </div>
      <button class="complete-btn" onclick="event.stopPropagation();vocabdeckComplete(${day})">✅ 오늘 학습 완료하고 다음 DAY 열기</button>
    </div>`;
}

function vocabdeckStepDefs(content) {
  const steps = [{ key: 'intro', emoji: '📋', label: '오늘 배울 단어' }];
  content.words.forEach((w, i) => steps.push({ key: 'word', wordIdx: i, emoji: '🔤', label: w.word }));
  steps.push({ key: 'done', emoji: '🎉', label: '완료' });
  return steps;
}

function vocabdeckRenderStepCard(day, content, step) {
  if (step.key === 'intro') return vocabdeckIntroCard(day, content);
  if (step.key === 'word') return vocabdeckWordCard(day, content, step.wordIdx);
  return vocabdeckDoneCard(day);
}

function vocabdeckSection(day) {
  const content = vocabdeckDays[day];
  if (!content) {
    return `
      <div style="margin-top:10px;" onclick="event.stopPropagation();">
        <button class="complete-btn" id="vocabdeck-gen-btn-${day}" style="background:var(--accent-strong);" onclick="vocabdeckGenerate(${day})">📖 오늘의 단어 8개 만들기</button>
        <div id="vocabdeck-err-${day}"></div>
      </div>`;
  }

  const steps = vocabdeckStepDefs(content);
  const idx = Math.max(0, Math.min(vocabdeckStepIdx, steps.length - 1));
  const step = steps[idx];
  const dots = steps.map((s, i) => `<div class="step-dot${i < idx ? ' done' : i === idx ? ' on' : ''}"></div>`).join('');

  return `
    <div style="margin-top:12px;" onclick="event.stopPropagation();">
      <div class="step-label">${idx + 1} / ${steps.length}단계 · ${step.emoji} ${step.label}</div>
      <div class="step-track">${dots}</div>
      ${vocabdeckRenderStepCard(day, content, step)}
      ${step.key !== 'done' ? `
        <div class="step-nav">
          <button class="step-nav-btn" ${idx === 0 ? 'disabled' : ''} onclick="vocabdeckGoStep(-1)">← 이전</button>
          <button class="step-nav-btn primary" onclick="vocabdeckGoStep(1)">다음 →</button>
        </div>` : ''}
    </div>`;
}

function renderVocabDeck() {
  const el = document.getElementById('vocabdeck-content');
  if (!el) return;

  const header = `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📚</span>
        <div>
          <div class="card-title">단어+예문 통암기 어휘장</div>
          <div class="card-sub">단어 뜻만 외우지 말고, 예문과 함께 익히고 손으로 따라 써보세요</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);">
        <span>🔥 연속 ${vocabdeckStreak}일</span>
        <span>${vocabdeckCompleted}일 완료</span>
      </div>
    </div>`;

  const maxDay = vocabdeckCompleted + 1;
  const rows = [];
  for (let day = 1; day <= maxDay; day++) {
    const status = vocabdeckStatus(day);
    const isOpen = vocabdeckOpen === day;
    const icon = status === 'done' ? '✅' : status === 'current' ? '▶️' : '🔒';
    const tagStyle = status === 'done'
      ? 'background:rgba(21,128,61,0.15);color:var(--success);border-color:rgba(21,128,61,0.3);'
      : 'background:rgba(11,92,86,0.15);color:var(--accent-strong);border-color:rgba(11,92,86,0.3);';
    rows.push(`
      <div id="vocabdeck-row-${day}" class="pattern-item${isOpen ? ' open' : ''}" onclick="vocabdeckToggle(${day})">
        <div class="pattern-top">
          <span class="pattern-tag" style="${tagStyle}">${icon} DAY ${day}</span>
        </div>
        ${isOpen ? vocabdeckSection(day) : ''}
      </div>`);
  }

  el.innerHTML = header + rows.join('');
}

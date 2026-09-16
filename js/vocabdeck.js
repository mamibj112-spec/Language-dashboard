// -- 어휘 탭: 단어를 뜻만 외우지 않고 예문과 함께 익히는 학습법 --
// (단어+발음기호+실제 예문을 세트로 외우고, 그 예문에서 공부해둘 포인트까지 함께 + 매일 학습 스트릭)

let vocabdeckCompleted = parseInt(localStorage.getItem('vocabdeck_completed') || '0', 10);
let vocabdeckStreak = parseInt(localStorage.getItem('vocabdeck_streak') || '0', 10);
let vocabdeckLastDate = localStorage.getItem('vocabdeck_lastDate') || '';
let vocabdeckDays = JSON.parse(localStorage.getItem('vocabdeck_days') || '{}');
let vocabdeckUsedWords = JSON.parse(localStorage.getItem('vocabdeck_usedWords') || '[]');
let vocabdeckOpen = null;
let vocabdeckStepIdx = 0;
let vocabdeckReviewOpen = null;
let vocabdeckReviewQuiz = null;
let vocabdeckRandomOpen = false;
let vocabdeckRandomWord = null;

function vocabdeckStatus(day) {
  if (day <= vocabdeckCompleted) return 'done';
  if (day === vocabdeckCompleted + 1) return 'current';
  return 'locked';
}

function vocabdeckToggle(day) {
  if (vocabdeckStatus(day) === 'locked') return;
  const opening = vocabdeckOpen !== day;
  vocabdeckOpen = opening ? day : null;
  if (opening) vocabdeckStepIdx = 0;
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
      "ipa": "국제음성기호(IPA) 발음기호, 슬래시 포함 (예: /meɪnˈteɪn/)",
      "kopron": "읽기 편하라고 참고용으로만 다는 한글 표기 발음 (예: 메인테인). 정확한 발음은 IPA와 음성 재생으로 확인하는 거라 안내했으니, 강세 있는 음절 위주로 자연스럽게 한글로만 적어주세요",
      "pos": "품사 (동사/명사/형용사/부사 등, 한글로 짧게)",
      "ko": "가장 핵심적인 한국어 뜻 (짧게)",
      "example": {
        "en": "이 단어가 실생활 대화에서 실제로 쓰이는 자연스러운 예문 (원어민이 쓸 법한 문장)",
        "ko": "예문의 한국어 번역",
        "glossary": [{"phrase": "예문 속에 나온, 메인 단어 말고 학습자가 모를 수 있는 다른 단어/숙어/구동사 원형", "ko": "그 뜻"}] (0~3개, 실제로 어려운 게 있을 때만 - 쉬운 예문이면 빈 배열)
      },
      "note": "이 예문에서 학습자가 따로 공부해두면 좋은 포인트 - 문법 포인트, 헷갈리기 쉬운 부분, 원어민이 쓰는 뉘앙스, 함께 자주 쓰이는 전치사/표현 등 (2~3문장)"
    }
  ] (8개, 서로 다른 단어)
}`;

function vocabdeckPrompt(day, avoidWords) {
  return `당신은 한국인 학습자를 위한 영어 어휘 코치입니다. "단어 뜻만 따로 외우지 말고, 그 단어가 실제로 쓰이는 예문과 함께 외워야 한다"는 원칙으로 하루 8개씩 단어를 가르칩니다.

오늘은 ${day}일차 학습입니다. 실생활 영어 회화나 뉴스, 일상 대화에서 자주 쓰이는 실용적인 중급 수준 단어 8개를 골라주세요.${day > 1 ? ' 날짜가 진행될수록 단어 난이도를 아주 조금씩 높여주세요.' : ''}

아래 단어들은 이미 이전 DAY에서 다뤘으니 절대 중복해서 고르지 마세요:
${avoidWords.length ? avoidWords.join(', ') : '(아직 없음)'}

각 단어마다 뜻만 딱 주지 말고, 그 단어가 실제 문장 속에서 어떻게 쓰이는지 보여주는 자연스러운 예문을 반드시 함께 만들어주세요. 예문 안에 메인 단어 말고도 학습자가 모를 수 있는 단어나 숙어, 구동사가 있으면 절대 그냥 넘어가지 말고 따로 뽑아서 뜻을 설명해주세요. 그리고 그 예문을 통해 학습자가 무엇을 추가로 공부해두면 좋을지(문법, 뉘앙스, 자주 같이 쓰이는 표현 등)도 짚어주세요. 발음기호(IPA)도 정확하게 붙여주고, IPA를 못 읽는 학습자를 위해 빠르게 읽을 수 있는 한글 표기 발음도 참고용으로 함께 달아주세요 (정확한 원어민 발음은 음성 재생 버튼으로 확인하게 될 거라, 한글 표기는 완벽함보다 읽기 편함이 우선이에요).

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
${VOCABDECK_JSON_SPEC}`;
}

async function vocabdeckGenerate(day) {
  const btn = document.getElementById('vocabdeck-gen-btn-' + day) || document.getElementById('vocabdeck-regen-btn-' + day);
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

function vocabdeckPron(w) {
  const ipa = w.ipa || '';
  const kopron = w.kopron ? ` (${w.kopron})` : '';
  return ipa + kopron;
}

function vocabdeckSpeak(day, wordIdx) {
  const d = vocabdeckDays[day];
  const w = d && d.words[wordIdx];
  if (w) speak(w.example.en);
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

// ── 7일마다 복습 테스트 (강제 아님, 쌓인 단어를 뒤섞어 객관식으로 확인) ──
function vocabdeckShuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function vocabdeckReviewPool(throughDay) {
  const pool = [];
  for (let d = throughDay - 6; d <= throughDay; d++) {
    const content = vocabdeckDays[d];
    if (content) content.words.forEach(w => pool.push(w));
  }
  return pool;
}

function vocabdeckBlankOut(sentence, word) {
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) return null;
  return sentence.slice(0, idx) + '_____' + sentence.slice(idx + word.length);
}

function vocabdeckBuildReviewQuiz(throughDay) {
  const pool = vocabdeckReviewPool(throughDay);
  const picked = vocabdeckShuffled(pool).slice(0, Math.min(12, pool.length));
  const questions = picked.map(w => {
    const others = pool.filter(o => o.word !== w.word);
    const distractors = vocabdeckShuffled(others).slice(0, 3);
    const blanked = w.example && vocabdeckBlankOut(w.example.en, w.word);
    if (blanked && Math.random() < 0.5) {
      return { type: 'blank', prompt: blanked, ko: w.example.ko, correct: w.word, options: vocabdeckShuffled([w.word, ...distractors.map(d => d.word)]) };
    }
    return { type: 'meaning', prompt: w.word, ipa: vocabdeckPron(w), correct: w.ko, options: vocabdeckShuffled([w.ko, ...distractors.map(d => d.ko)]) };
  });
  return { throughDay, questions, idx: 0, answers: {} };
}

function vocabdeckToggleReview(throughDay) {
  const opening = vocabdeckReviewOpen !== throughDay;
  vocabdeckReviewOpen = opening ? throughDay : null;
  if (opening) vocabdeckReviewQuiz = vocabdeckBuildReviewQuiz(throughDay);
  renderVocabDeck();
  if (opening) {
    setTimeout(() => {
      const row = document.getElementById('vocabdeck-review-row-' + throughDay);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }
}

function vocabdeckRetryReview(throughDay) {
  vocabdeckReviewQuiz = vocabdeckBuildReviewQuiz(throughDay);
  renderVocabDeck();
}

function vocabdeckCloseReview() {
  vocabdeckReviewOpen = null;
  vocabdeckReviewQuiz = null;
  renderVocabDeck();
}

function vocabdeckAnswerReview(optIdx) {
  const quiz = vocabdeckReviewQuiz;
  if (!quiz || quiz.answers[quiz.idx]) return;
  const q = quiz.questions[quiz.idx];
  const correctIdx = q.options.indexOf(q.correct);
  quiz.answers[quiz.idx] = { selectedIdx: optIdx, correctIdx, correct: optIdx === correctIdx };
  renderVocabDeck();
}

function vocabdeckReviewGoStep(delta) {
  const quiz = vocabdeckReviewQuiz;
  if (!quiz) return;
  quiz.idx = Math.max(0, Math.min(quiz.questions.length, quiz.idx + delta));
  renderVocabDeck();
}

// ── 랜덤 단어 복습 (지금까지 배운 단어를 하나씩 랜덤으로 자동 재생 - 손 안 대고 계속 들을 수 있게) ──
let vocabdeckRandomTimer = null;
let vocabdeckRandomPaused = false;

function vocabdeckAllWords() {
  const all = [];
  Object.keys(vocabdeckDays).forEach(day => {
    vocabdeckDays[day].words.forEach(w => all.push(w));
  });
  return all;
}

// 현재 보여주고 있는 단어를 (영어 → 한국어 뜻 순으로) 읽고, 다 읽으면 잠깐 쉬었다가 다음 단어로 - 일시정지 중이면 아무것도 안 함
function vocabdeckSpeakCurrentAndSchedule() {
  const w = vocabdeckRandomWord;
  if (!w) return;
  const afterSpeaking = () => {
    if (!vocabdeckRandomOpen || vocabdeckRandomPaused) return;
    vocabdeckRandomTimer = setTimeout(vocabdeckRandomNext, 1500);
  };
  speak(w.word, () => {
    if (!vocabdeckRandomOpen || vocabdeckRandomPaused) return;
    speak(w.ko, afterSpeaking, 'ko-KR');
  });
}

function vocabdeckRandomNext() {
  if (vocabdeckRandomTimer) { clearTimeout(vocabdeckRandomTimer); vocabdeckRandomTimer = null; }
  if (!vocabdeckRandomOpen) return;
  vocabdeckRandomPaused = false;
  const all = vocabdeckAllWords();
  if (!all.length) { vocabdeckRandomWord = null; renderVocabDeckFullscreen(); return; }
  vocabdeckRandomWord = all[Math.floor(Math.random() * all.length)];
  renderVocabDeckFullscreen();
  vocabdeckSpeakCurrentAndSchedule();
}

function vocabdeckRandomPause() {
  vocabdeckRandomPaused = true;
  if (vocabdeckRandomTimer) { clearTimeout(vocabdeckRandomTimer); vocabdeckRandomTimer = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (_audio) { _audio.pause(); }
  renderVocabDeckFullscreen();
}

function vocabdeckRandomResume() {
  vocabdeckRandomPaused = false;
  renderVocabDeckFullscreen();
  if (!vocabdeckRandomWord) { vocabdeckRandomNext(); return; }
  vocabdeckSpeakCurrentAndSchedule();
}

function vocabdeckToggleRandom() {
  vocabdeckRandomOpen = !vocabdeckRandomOpen;
  if (vocabdeckRandomTimer) { clearTimeout(vocabdeckRandomTimer); vocabdeckRandomTimer = null; }
  if (vocabdeckRandomOpen) {
    vocabdeckRandomNext();
  } else {
    vocabdeckRandomWord = null;
    vocabdeckRandomPaused = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (_audio) { _audio.pause(); }
    renderVocabDeckFullscreen();
  }
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
      <div style="font-size:13px;line-height:1.7;color:var(--ink-soft);margin-bottom:12px;">단어 뜻만 외우지 말고, 발음과 예문, 그리고 예문 속 포인트까지 함께 익혀보세요.</div>
      ${content.words.map((w, i) => `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <span style="color:var(--accent);font-weight:700;flex-shrink:0;">${i + 1}.</span>
          <div style="min-width:0;">
            <div style="color:var(--ink);font-weight:600;">${w.word} <span style="color:var(--muted);font-weight:500;font-size:12px;">${vocabdeckPron(w)}</span></div>
            <div style="color:var(--muted);font-size:13px;margin-top:1px;">${w.ko}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function vocabdeckWordCard(day, content, wordIdx) {
  const w = content.words[wordIdx];
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">🔤</span>
        <div>
          <div class="card-title">${wordIdx + 1}. ${w.word} <span style="font-size:13px;color:var(--accent-strong);font-weight:500;">${vocabdeckPron(w)}</span> <span style="font-size:12px;color:var(--muted);font-weight:500;">(${w.pos})</span></div>
          <div class="card-sub">${w.ko}</div>
        </div>
      </div>
      <div class="pattern-ex">
        <div class="pattern-ex-en">${w.example.en} <button class="spk-btn" onclick="event.stopPropagation();vocabdeckSpeak(${day},${wordIdx})">🔊</button></div>
        <div class="pattern-ex-ko">${w.example.ko}</div>
      </div>
      ${w.example.glossary && w.example.glossary.length ? `
        <div style="margin-top:10px;background:var(--accent-wash);border-radius:8px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-strong);margin-bottom:6px;">📚 예문 속 다른 단어·표현</div>
          ${w.example.glossary.map(g => `<div style="display:flex;gap:6px;font-size:13px;margin-bottom:3px;"><span style="font-weight:700;color:var(--ink);">${g.phrase}</span><span style="color:var(--ink-soft);">– ${g.ko}</span></div>`).join('')}
        </div>` : ''}
      ${w.note ? `
        <div style="margin-top:10px;background:var(--warning-wash);border-left:3px solid var(--warning);border-radius:0 8px 8px 0;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:var(--warning);margin-bottom:4px;">📝 이 예문에서 꼭 봐두세요</div>
          <div style="font-size:13px;line-height:1.6;color:var(--ink-soft);">${w.note}</div>
        </div>` : ''}
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

function vocabdeckReviewQuestionCard(quiz) {
  const q = quiz.questions[quiz.idx];
  const answer = quiz.answers[quiz.idx];
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">${q.type === 'blank' ? '✏️' : '🔤'}</span>
        <div>
          <div class="card-title">${q.type === 'blank' ? '빈칸에 들어갈 단어는?' : '이 단어의 뜻은?'}</div>
          <div class="card-sub">${q.type === 'blank' ? q.ko : (q.ipa || '')}</div>
        </div>
      </div>
      <div style="font-size:16px;font-weight:700;color:var(--ink);line-height:1.6;margin-bottom:14px;">${q.prompt}</div>
      ${q.options.map((opt, i) => {
        let cls = 'mc-option';
        if (answer) {
          if (i === answer.correctIdx) cls += ' correct';
          else if (i === answer.selectedIdx) cls += ' wrong';
          cls += ' disabled';
        }
        return `<button class="${cls}" onclick="event.stopPropagation();vocabdeckAnswerReview(${i})">${opt}</button>`;
      }).join('')}
    </div>`;
}

function vocabdeckReviewSection(throughDay) {
  const quiz = vocabdeckReviewQuiz;
  if (!quiz || quiz.throughDay !== throughDay) return '';
  const total = quiz.questions.length;
  if (!total) {
    return `<div style="margin-top:10px;font-size:13px;color:var(--muted);" onclick="event.stopPropagation();">복습할 단어가 아직 부족해요.</div>`;
  }
  if (quiz.idx >= total) {
    const score = Object.values(quiz.answers).filter(a => a.correct).length;
    return `
      <div style="margin-top:12px;" onclick="event.stopPropagation();">
        <div class="card">
          <div class="card-header">
            <span class="card-emoji">🎉</span>
            <div><div class="card-title">복습 결과: ${score} / ${total}</div><div class="card-sub">DAY ${throughDay - 6}~${throughDay}에서 배운 단어 복습</div></div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="step-nav-btn" style="flex:1;" onclick="vocabdeckRetryReview(${throughDay})">🔄 다시 풀기</button>
            <button class="step-nav-btn primary" style="flex:1;" onclick="vocabdeckCloseReview()">닫기</button>
          </div>
        </div>
      </div>`;
  }

  const dots = quiz.questions.map((q, i) => `<div class="step-dot${i < quiz.idx ? ' done' : i === quiz.idx ? ' on' : ''}"></div>`).join('');
  return `
    <div style="margin-top:12px;" onclick="event.stopPropagation();">
      <div class="step-label">${quiz.idx + 1} / ${total}문제</div>
      <div class="step-track">${dots}</div>
      ${vocabdeckReviewQuestionCard(quiz)}
      <div class="step-nav">
        <button class="step-nav-btn" ${quiz.idx === 0 ? 'disabled' : ''} onclick="vocabdeckReviewGoStep(-1)">← 이전</button>
        <button class="step-nav-btn primary" onclick="vocabdeckReviewGoStep(1)">다음 →</button>
      </div>
    </div>`;
}

function vocabdeckReviewRow(throughDay) {
  const isOpen = vocabdeckReviewOpen === throughDay;
  return `
    <div id="vocabdeck-review-row-${throughDay}" class="pattern-item${isOpen ? ' open' : ''}" style="border-color:var(--accent-soft);" onclick="vocabdeckToggleReview(${throughDay})">
      <div class="pattern-top">
        <span class="pattern-tag" style="background:var(--accent-wash-strong);color:var(--accent-strong);">🧠 DAY ${throughDay - 6}~${throughDay} 복습 테스트</span>
      </div>
      ${isOpen ? vocabdeckReviewSection(throughDay) : ''}
    </div>`;
}

function renderVocabDeckFullscreen() {
  const el = document.getElementById('vocabdeck-fullscreen');
  if (!el) return;

  if (!vocabdeckRandomOpen) { el.innerHTML = ''; return; }

  const w = vocabdeckRandomWord;
  if (!w) {
    el.innerHTML = `
      <div style="position:fixed;inset:0;background:var(--paper);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;">
        <div style="color:var(--ink-soft);font-size:16px;margin-bottom:20px;">아직 학습한 단어가 없어요.<br>DAY 1부터 시작해보세요!</div>
        <button class="step-nav-btn primary" onclick="vocabdeckToggleRandom()">닫기</button>
      </div>`;
    return;
  }

  const pauseIcon = vocabdeckRandomPaused ? '▶️' : '⏸';
  const pauseAction = vocabdeckRandomPaused ? 'vocabdeckRandomResume()' : 'vocabdeckRandomPause()';
  const statusText = vocabdeckRandomPaused ? '⏸ 일시정지됨' : '🔁 자동 재생 중';

  el.innerHTML = `
    <div style="position:fixed;inset:0;background:var(--paper);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;" onclick="vocabdeckRandomNext()">
      <button onclick="event.stopPropagation();vocabdeckToggleRandom()" style="position:absolute;top:20px;right:20px;width:44px;height:44px;border-radius:50%;background:var(--surface-alt);color:var(--ink);border:none;font-size:20px;cursor:pointer;">✕</button>
      <div style="position:absolute;top:24px;left:20px;font-size:13px;color:var(--muted);font-weight:700;">${statusText} · 화면 탭하면 다음 단어</div>
      <div style="font-family:var(--font-display);font-size:44px;font-weight:700;color:var(--ink);line-height:1.2;word-break:break-word;">${w.word}</div>
      <div style="font-size:18px;color:var(--accent-strong);font-weight:600;margin-top:10px;">${vocabdeckPron(w)}</div>
      <div style="font-size:34px;font-weight:700;color:var(--accent-soft);margin-top:40px;word-break:keep-all;">${w.ko}</div>
      <button onclick="event.stopPropagation();${pauseAction}" style="position:absolute;bottom:40px;width:64px;height:64px;border-radius:50%;background:var(--accent);color:#fff;border:none;font-size:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;">${pauseIcon}</button>
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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
        <div class="step-label" style="margin-bottom:0;">${idx + 1} / ${steps.length}단계 · ${step.emoji} ${step.label}</div>
        <button id="vocabdeck-regen-btn-${day}" onclick="vocabdeckGenerate(${day})" style="font-size:11px;font-weight:700;color:var(--muted);background:none;border:none;cursor:pointer;padding:4px 0;">🔄 다시 만들기</button>
      </div>
      <div class="step-track">${dots}</div>
      ${vocabdeckRenderStepCard(day, content, step)}
      <div id="vocabdeck-err-${day}"></div>
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
          <div class="card-sub">단어 뜻만 외우지 말고, 발음·예문과 함께 익히고 예문 속 포인트까지 챙기세요</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:12px;">
        <span>🔥 연속 ${vocabdeckStreak}일</span>
        <span>${vocabdeckCompleted}일 완료</span>
      </div>
      <button class="complete-btn" style="background:var(--accent-strong);" onclick="vocabdeckToggleRandom()">🔀 배운 단어 랜덤 복습하기</button>
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
    if (day % 7 === 0 && status === 'done') {
      rows.push(vocabdeckReviewRow(day));
    }
  }

  el.innerHTML = header + rows.join('');
}

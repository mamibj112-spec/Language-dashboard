// ── Study: 표현·단어·대화·퀴즈·패턴 탭 ──

let openPhrase = null;
let openVocab = null;
let quizIdx = 0;
let quizAnswered = false;
let chipState = {}; // 0=en, 1=ko
let openDialogue = {};
let openPattern = null;
let practicePattern = null;

// ── Phrases ──
function renderPhrases() {
  const el = document.getElementById('phrases-list');
  el.innerHTML = '';
  currentTopic.phrases.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'phrase-item' + (openPhrase === i ? ' open' : '');
    div.innerHTML = `
      <div class="phrase-row">
        <div class="phrase-en">${p.en}</div>
        <button class="spk-btn" onclick="event.stopPropagation();speak('${p.en.replace(/'/g,"\\'")}')">🔊</button>
      </div>
      ${openPhrase === i
        ? `<div class="phrase-ko">${p.ko}</div>`
        : `<div class="phrase-hint">👆 탭해서 한국어 보기</div>`}
    `;
    div.onclick = () => { openPhrase = openPhrase === i ? null : i; renderPhrases(); };
    el.appendChild(div);
  });
}

// ── Vocab ──
function renderVocab() {
  const el = document.getElementById('vocab-list');
  el.innerHTML = '';
  currentTopic.vocab.forEach((v, i) => {
    const div = document.createElement('div');
    div.className = 'vocab-item' + (openVocab === i ? ' open' : '');
    let exHtml = '';
    if (openVocab === i) {
      exHtml = `<div class="vocab-examples">` +
        v.ex.map(ex => `
          <div class="vocab-ex">
            <div class="vocab-ex-en">
              "${ex.en}"
              <button class="spk-btn blue" onclick="event.stopPropagation();speak('${ex.en.replace(/'/g,"\\'")}')">🔊</button>
            </div>
            <div class="vocab-ex-ko">${ex.ko}</div>
          </div>
        `).join('') + `</div>`;
    }
    div.innerHTML = `
      <div class="phrase-row">
        <div>
          <div class="vocab-word">${v.word}</div>
          <div class="vocab-ko">${v.ko}</div>
        </div>
        <button class="spk-btn" onclick="event.stopPropagation();speak('${v.word}')">🔊</button>
      </div>
      ${exHtml}
      ${openVocab !== i ? `<div class="phrase-hint">👆 탭해서 예문 보기</div>` : ''}
    `;
    div.onclick = () => { openVocab = openVocab === i ? null : i; renderVocab(); };
    el.appendChild(div);
  });
}

// ── Update Topic UI ──
function updateTopicUI() {
  const t = currentTopic;
  document.getElementById('phrases-emoji').textContent = t.emoji;
  document.getElementById('phrases-title').textContent = '오늘의 주제: ' + t.npc;
  document.getElementById('phrases-sub').textContent = t.scene;
  document.getElementById('vocab-emoji').textContent = t.emoji;
  document.getElementById('vocab-title').textContent = '오늘의 단어: ' + t.npc;
  document.getElementById('role-emoji').textContent = t.emoji;
  document.getElementById('role-tag').textContent = '오늘의 상황 — ' + t.npc;
  document.getElementById('role-scene').textContent = t.scene;
  document.getElementById('chat-start-icon').textContent = t.emoji;
  document.getElementById('chat-start-text').textContent = t.npc + '와 실제 상황처럼 대화해봐요!';
  document.getElementById('quiz-tag').textContent = t.emoji + ' ' + t.npc + ' 퀴즈';
  document.getElementById('dialogue-emoji').textContent = t.emoji;
  document.getElementById('dialogue-title').textContent = '오늘의 대화: ' + t.npc;
}

// ── Load New Topic ──
function loadNewTopic() {
  const others = TOPICS.filter(t => t !== currentTopic);
  currentTopic = others[Math.floor(Math.random() * others.length)];
  openPhrase = null;
  openVocab = null;
  quizIdx = 0;
  quizAnswered = false;
  chatStarted = false;
  chatMsgs = [];
  chipState = {};
  openDialogue = {};
  practicePattern = null;
  updateTopicUI();
  renderPhrases();
  renderVocab();
  renderHints();
  renderQuiz();
  renderDialogue();
  // 롤플레잉 초기화
  document.getElementById('chat-start').classList.remove('hidden');
  document.getElementById('chat-msgs').classList.add('hidden');
  document.getElementById('chat-input-row').classList.add('hidden');
  document.getElementById('feedback-btn').classList.add('hidden');
}

// ── Complete ──
function markComplete() {
  if (done) return;
  done = true;
  streak++;
  if (!checkedDays.includes(todayDay)) checkedDays.push(todayDay);
  localStorage.setItem('streak', streak);
  localStorage.setItem('checkedDays', JSON.stringify(checkedDays));
  localStorage.setItem('done_' + today.toDateString(), '1');
  document.getElementById('streak-num').textContent = streak;
  const btn = document.getElementById('complete-btn');
  btn.textContent = '✅ 오늘 공부 완료!';
  btn.classList.add('done');
  // Refresh dots
  document.getElementById('week-dots').innerHTML = '';
  DAYS_KO.forEach((d, i) => {
    const dot = document.createElement('div');
    dot.className = 'day-dot' + (checkedDays.includes(i) ? ' done' : '') + (i === todayDay && !checkedDays.includes(i) ? ' today' : '');
    dot.textContent = checkedDays.includes(i) ? '✓' : d;
    document.getElementById('week-dots').appendChild(dot);
  });
}

// ── Hints ──
function renderHints() {
  const el = document.getElementById('hint-chips');
  el.innerHTML = '';
  currentTopic.phrases.slice(0, 3).forEach((p, i) => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = p.en;
    span.onclick = () => {
      if (chipState[i] === 'ko') {
        document.getElementById('chat-input').value = p.en;
        chipState[i] = 'en';
        span.textContent = p.en;
        span.style.color = '#e0f2fe';
      } else {
        chipState[i] = 'ko';
        span.textContent = p.ko;
        span.style.color = '#fde68a';
        setTimeout(() => { chipState[i] = 'en'; span.textContent = p.en; span.style.color = '#e0f2fe'; }, 2000);
      }
    };
    el.appendChild(span);
  });
}

// ── Quiz ──
function renderQuiz() {
  const p = currentTopic.phrases[quizIdx];
  document.getElementById('quiz-q').textContent = `"${p.ko}"`;
  document.getElementById('quiz-progress').textContent = `${quizIdx + 1} / ${currentTopic.phrases.length}`;
  document.getElementById('quiz-input').value = '';
  document.getElementById('quiz-input').className = 'quiz-input';
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-result').className = 'quiz-result hidden';
  document.getElementById('quiz-next-btn').classList.add('hidden');
  document.getElementById('quiz-check-btn').classList.remove('hidden');
  quizAnswered = false;
}

function checkQuiz() {
  if (quizAnswered) return;
  const val = document.getElementById('quiz-input').value.trim();
  const correct = currentTopic.phrases[quizIdx].en;
  const isCorrect = val.toLowerCase() === correct.toLowerCase();
  quizAnswered = true;

  const inputEl = document.getElementById('quiz-input');
  const resultEl = document.getElementById('quiz-result');

  inputEl.className = 'quiz-input ' + (isCorrect ? 'correct' : 'wrong');
  resultEl.classList.remove('hidden');
  document.getElementById('quiz-check-btn').classList.add('hidden');
  document.getElementById('quiz-next-btn').classList.remove('hidden');

  if (isCorrect) {
    resultEl.className = 'quiz-result correct';
    resultEl.innerHTML = `🎉 정답! 훌륭해요! <button class="spk-btn" style="margin-left:8px" onclick="speak('${correct.replace(/'/g,"\\'")}')">🔊</button>`;
  } else {
    resultEl.className = 'quiz-result wrong';
    resultEl.innerHTML = `<strong style="display:block;margin-bottom:4px">아쉽지만 다시 도전!</strong>
      정답: <span class="quiz-answer">${correct}</span>
      <button class="spk-btn" style="font-size:11px;padding:2px 7px;margin-left:6px" onclick="speak('${correct.replace(/'/g,"\\'")}')">🔊</button>`;
  }
}

function nextQuiz() {
  quizIdx = (quizIdx + 1) % currentTopic.phrases.length;
  renderQuiz();
}

// ── Pattern ──
function renderPatterns() {
  const el = document.getElementById('pattern-list');
  el.innerHTML = '';
  PATTERNS.forEach((p, i) => {
    const isOpen = openPattern === i;
    const div = document.createElement('div');
    div.className = 'pattern-item' + (isOpen ? ' open' : '');
    let exHtml = '';
    if (isOpen) {
      exHtml = `<div class="pattern-examples">` +
        p.examples.map(ex => `
          <div class="pattern-ex">
            <div class="pattern-ex-en">
              "${ex.en}"
              <button class="spk-btn blue" onclick="event.stopPropagation();speak('${ex.en.replace(/'/g,"\\'")}')">🔊</button>
            </div>
            <div class="pattern-ex-ko">${ex.ko}</div>
          </div>
        `).join('') +
        `</div>
        <button class="complete-btn" style="margin-top:10px;font-size:13px;padding:10px;background:linear-gradient(135deg,#38bdf8,#6366f1)" onclick="event.stopPropagation();startPatternPractice(${i})">💬 이 패턴으로 대화 연습하기</button>`;
    }
    div.innerHTML = `
      <div class="pattern-top">
        <div>
          <div class="pattern-text">${p.pattern}</div>
          <div class="pattern-ko">${p.ko}</div>
        </div>
        <span class="pattern-tag">${p.tag}</span>
      </div>
      ${exHtml}
      ${!isOpen ? `<div class="pattern-hint">👆 탭해서 예문 보기</div>` : ''}
    `;
    div.onclick = () => { openPattern = openPattern === i ? null : i; renderPatterns(); };
    el.appendChild(div);
  });
}

// ── Pattern Practice ──
function startPatternPractice(idx) {
  const p = PATTERNS[idx];
  practicePattern = {
    pattern: p.pattern,
    ko: p.ko,
    systemPrompt: `You are a friendly English conversation partner helping a Korean learner practice the pattern "${p.pattern}" (meaning: ${p.ko}).

Your job:
1. Start by creating a natural, specific scenario where using "${p.pattern}" is the most appropriate response
2. Keep guiding the conversation so the learner has 2-3 clear chances to use this pattern
3. When the learner correctly uses "${p.pattern}", respond with "✨ Perfect use of the pattern!" then continue naturally
4. If they miss a clear opportunity, gently hint: "Hint: try starting with '${p.pattern.replace('~','...')}'..."
5. Respond naturally in 2-3 sentences and keep the conversation going with a question or prompt
6. If the learner makes a grammar mistake, add at the end: 💡 Correction: "[wrong]" → "[correct]"
7. Reply in English only.

Now begin: set up a vivid, realistic scenario and invite the learner to respond.`
  };

  chatStarted = false;
  chatMsgs = [];
  chipState = {};

  document.getElementById('role-emoji').textContent = '📐';
  document.getElementById('role-tag').textContent = '패턴 연습 — ' + p.pattern;
  document.getElementById('role-scene').textContent = p.ko + ' — AI가 상황을 만들어 드려요';
  document.getElementById('chat-start-icon').textContent = '📐';
  document.getElementById('chat-start-text').textContent = '"' + p.pattern + '" 패턴을 실제 대화에서 연습해봐요!';
  document.getElementById('chat-start').classList.remove('hidden');
  document.getElementById('chat-msgs').classList.add('hidden');
  document.getElementById('chat-input-row').classList.add('hidden');
  document.getElementById('feedback-btn').classList.add('hidden');

  switchTab('role');
}

// ── Dialogue ──
function renderDialogue() {
  const el = document.getElementById('dialogue-list');
  el.innerHTML = '';
  currentTopic.dialogues.forEach((d, i) => {
    const isUser = d.role === 'user';
    const isOpen = openDialogue[i];
    const div = document.createElement('div');
    div.className = 'dialogue-line';
    div.innerHTML = `
      <div class="dialogue-label ${isUser ? 'me' : ''}">
        ${isUser ? '' : `${currentTopic.emoji} ${currentTopic.npc}`}
        <button class="${isUser ? 'spk-btn blue' : 'spk-btn'}" style="font-size:11px;padding:2px 6px" onclick="event.stopPropagation();speak(\`${d.en.replace(/`/g,'\\`')}\`)">🔊</button>
        ${isUser ? '나 (Me)' : ''}
      </div>
      <div class="dl-wrap ${isUser ? 'me' : ''}">
        <div class="dl-bubble ${isUser ? 'me' : ''}" onclick="toggleDialogue(${i})">
          <div class="dl-en">${d.en}</div>
          ${isOpen ? `<div class="dl-ko">${d.ko}</div>` : `<div class="dl-hint">👆 탭해서 한국어 보기</div>`}
        </div>
      </div>
    `;
    el.appendChild(div);
  });
}

function toggleDialogue(i) {
  openDialogue[i] = !openDialogue[i];
  renderDialogue();
}

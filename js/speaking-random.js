// -- 스피킹: 배운 문장 자동 듣기 --
// 지금까지 만든 DAY의 인풋 문장을 랜덤으로 하나씩: 한국어로 읽어줌 → 3초 동안 영어로 떠올려 말해보기 → 영어 정답을 읽어줌 → 다음 문장.
// 손 안 대고 계속 돌아가서 차 안에서도 들을 수 있게. (어휘 탭 랜덤 복습과 같은 방식)

let speakingRandomOpen = false;
let speakingRandomItem = null;
let speakingRandomPhase = 'ko';   // ko: 한국어 읽는 중 → think: 3초 생각 → en: 영어 정답
let speakingRandomLeft = 3;
let speakingRandomPaused = false;
let speakingRandomTimer = null;
let speakingRandomTick = null;
let speakingRandomToken = 0;      // 멈추거나 넘기면 올려서 늦게 도착한 음성 완료 콜백을 무시

function speakingRandomPool() {
  const pool = [];
  Object.keys(speakingDays).forEach(d => {
    (speakingDays[d].input || []).forEach(it => pool.push({ ...it, day: Number(d) }));
  });
  return pool;
}

function speakingRandomClearTimers() {
  speakingRandomToken++;
  clearTimeout(speakingRandomTimer); speakingRandomTimer = null;
  clearInterval(speakingRandomTick); speakingRandomTick = null;
}

function speakingRandomNext() {
  speakingRandomClearTimers();
  if (!speakingRandomOpen) return;
  speakingRandomPaused = false;
  const pool = speakingRandomPool();
  if (!pool.length) { speakingRandomItem = null; renderSpeakingRandom(); return; }
  let next;
  do { next = pool[Math.floor(Math.random() * pool.length)]; }
  while (pool.length > 1 && speakingRandomItem && next.en === speakingRandomItem.en);
  speakingRandomItem = next;
  speakingRandomRun();
}

// 지금 문장을 처음부터: 한국어 → 3초 → 영어 → 잠깐 쉬고 다음
function speakingRandomRun() {
  speakingRandomClearTimers();
  const tok = speakingRandomToken;
  const it = speakingRandomItem;
  speakingRandomPhase = 'ko';
  speakingRandomLeft = 3;
  renderSpeakingRandom();
  speak(it.ko, () => {
    if (tok !== speakingRandomToken) return;
    speakingRandomPhase = 'think';
    renderSpeakingRandom();
    speakingRandomTick = setInterval(() => {
      if (tok !== speakingRandomToken) { clearInterval(speakingRandomTick); return; }
      speakingRandomLeft--;
      if (speakingRandomLeft > 0) {
        const el = document.getElementById('sp-random-left');
        if (el) el.textContent = speakingRandomLeft;
        return;
      }
      clearInterval(speakingRandomTick);
      speakingRandomPhase = 'en';
      renderSpeakingRandom();
      speak(speakingPlain(it.en), () => {
        if (tok !== speakingRandomToken) return;
        speakingRandomTimer = setTimeout(() => { if (tok === speakingRandomToken) speakingRandomNext(); }, 1500);
      });
    }, 1000);
  }, 'ko-KR');
}

function speakingRandomPause() {
  speakingRandomClearTimers();
  speakingRandomPaused = true;
  speak('');
  renderSpeakingRandom();
}

function speakingRandomResume() {
  speakingRandomPaused = false;
  if (!speakingRandomItem) { speakingRandomNext(); return; }
  speakingRandomRun();
}

function speakingToggleRandom() {
  if (speakingRandomOpen) { overlayClose('speakingRandom'); return; }
  speakingRandomOpen = true;
  overlayOpened('speakingRandom');
  speakingRandomNext();
}

function speakingCloseRandomUI() {
  if (!speakingRandomOpen) return;
  speakingRandomOpen = false;
  speakingRandomClearTimers();
  speakingRandomItem = null;
  speakingRandomPaused = false;
  speak('');
  renderSpeakingRandom();
}

registerOverlay('speakingRandom', speakingCloseRandomUI);

function renderSpeakingRandom() {
  const el = document.getElementById('speaking-random');
  if (!el) return;
  if (!speakingRandomOpen) { el.innerHTML = ''; return; }

  const shell = 'position:fixed;inset:0;background:var(--paper);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;';
  const it = speakingRandomItem;
  if (!it) {
    el.innerHTML = `
      <div style="${shell}">
        <div style="color:var(--ink-soft);font-size:17px;line-height:1.7;margin-bottom:20px;">아직 배운 문장이 없어요.<br>DAY 1 연습 자료를 먼저 만들어보세요!</div>
        <button class="step-nav-btn primary" style="flex:none;padding:13px 30px;" onclick="speakingToggleRandom()">닫기</button>
      </div>`;
    return;
  }

  const p = speakingRandomPhase;
  const status = speakingRandomPaused ? '⏸ 일시정지됨' : '🔁 자동 재생 중';
  let answer;
  if (p === 'en') answer = `<div class="sp-drill-en" style="font-size:27px;">${speakingChunkHtml(it.en)}</div>`;
  else if (p === 'think' && !speakingRandomPaused) answer = `<div class="sp-drill-left" id="sp-random-left">${speakingRandomLeft}</div><div class="sp-sub">영어로 말해보세요</div>`;
  else answer = `<div class="sp-sub" style="font-size:17px;">💭 잘 듣고 영어로 떠올려보세요</div>`;

  el.innerHTML = `
    <div style="${shell}" onclick="speakingRandomNext()">
      <button onclick="event.stopPropagation();speakingToggleRandom()" style="position:absolute;top:20px;right:20px;width:44px;height:44px;border-radius:50%;background:var(--surface-alt);color:var(--ink);border:none;font-size:20px;cursor:pointer;">✕</button>
      <div style="position:absolute;top:24px;left:20px;right:76px;text-align:left;font-size:13px;color:var(--muted);font-weight:700;">${status} · 화면 탭하면 다음 문장</div>
      <div style="font-size:14px;font-weight:700;color:var(--accent-strong);">DAY ${it.day} · ${SPEAKING_TOPICS[it.day - 1] ? SPEAKING_TOPICS[it.day - 1].ko : ''}</div>
      <div class="sp-drill-ko" style="font-size:30px;">${it.ko}</div>
      <div class="sp-drill-hint" style="font-size:17px;">└ ${it.keyKo} ${it.key}</div>
      <div class="sp-drill-answer" style="min-height:150px;">${answer}</div>
      <button onclick="event.stopPropagation();${speakingRandomPaused ? 'speakingRandomResume()' : 'speakingRandomPause()'}" style="position:absolute;bottom:40px;width:64px;height:64px;border-radius:50%;background:var(--accent);color:#fff;border:none;font-size:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;">${speakingRandomPaused ? '▶️' : '⏸'}</button>
    </div>`;
}

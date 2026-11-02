// -- 스피킹 탭 단계 화면 --
// 인풋 4단계(소리 듣기 → 표현 익히기 → 따라 말하기 → 혼자 말하기 3초) + 아웃풋 4단계(우리말 보며 듣기 →
// 끊어 말하기 → 빈칸 따라 말하기 → 1분 말하기), 중간점검(5초 말하기). 목록·진도·생성은 speaking.js

let speakingDrill = { idx: 0, phase: 'think', left: 3, auto: false, finished: false };
let speakingDrillTimer = null;
let speakingMinute = { left: 60, running: false, finished: false };
let speakingMinuteTimer = null;
let speakingToken = 0;   // 단계를 옮기거나 멈추면 올려서, 늦게 도착한 음성 완료 콜백을 무시

function speakingCurrent() {
  if (speakingOpenCheck !== null) return { isCheck: true, content: speakingCheckData[speakingOpenCheck] };
  return { isCheck: false, content: speakingDays[speakingOpenDay], day: speakingOpenDay };
}

// 단계 이동·닫기 때: 타이머, 자동 진행, 읽어주기를 모두 멈추고 처음 상태로
function speakingStopAll() {
  clearInterval(speakingDrillTimer); speakingDrillTimer = null;
  clearInterval(speakingMinuteTimer); speakingMinuteTimer = null;
  speakingToken++;
  speakingDrill = { idx: 0, phase: 'think', left: 3, auto: false, finished: false };
  speakingMinute = { left: 60, running: false, finished: false };
  speak('');
}

function speakingDayStepDefs() {
  return [
    { key: 'intro' },
    { key: 'in1' }, { key: 'in2' }, { key: 'in3' }, { key: 'in4' },
    { key: 'out1' }, { key: 'out2' }, { key: 'out3' }, { key: 'out4' },
    { key: 'done' },
  ];
}

function speakingCheckStepDefs() {
  return [{ key: 'chkDrill' }, { key: 'done' }];
}

function speakingRenderStep(step, content) {
  switch (step.key) {
    case 'intro': return speakingIntroCard(content);
    case 'in1': return speakingIn1(content);
    case 'in2': return speakingIn2(content);
    case 'in3': return speakingIn3(content);
    case 'in4': return speakingStepHead('📥 인풋', 'STEP 4 · 혼자 말하기', '한국어와 힌트만 보고 3초 안에 영어로 말해보세요. ▶ 자동 진행을 누르면 3초 뒤 정답을 읽어주고 다음 문장으로 넘어가요.') + speakingDrillHtml();
    case 'out1': return speakingOut1(content);
    case 'out2': return speakingOut2(content);
    case 'out3': return speakingOut3(content);
    case 'out4': return speakingOut4(content);
    case 'chkDrill': return speakingStepHead('📝 중간점검', '5초 안에 말해보기', '두 DAY의 표현을 섞은 문장이에요. 한국어와 힌트를 보고 5초 안에 영어로 말해보세요.') + speakingDrillHtml();
    default: return speakingCurrent().isCheck ? speakingCheckDoneCard(content) : speakingDoneCard(content);
  }
}

function speakingStepHead(phase, title, guide) {
  return `
    <div class="sp-step-head">${phase}</div>
    <div class="sp-step-title">${title}</div>
    <div class="sp-guide">${guide}</div>`;
}

function speakingSpk(kind, i) {
  return `<button class="spk-btn sp-spk" onclick="event.stopPropagation();speakingSay('${kind}',${i})">🔊</button>`;
}

function speakingItems(kind) {
  const { content } = speakingCurrent();
  if (!content) return [];
  if (kind === 'in') return content.input || [];
  if (kind === 'out') return (content.output && content.output.sentences) || [];
  return content.items || [];
}

function speakingSay(kind, i) {
  const it = speakingItems(kind)[i];
  if (it) speak(speakingPlain(it.en));
}

function speakingSayAll(kind) {
  speak(speakingItems(kind).map(it => speakingPlain(it.en)).join(' '));
}

// ── 시작 안내 ──
function speakingIntroCard(content) {
  const topic = SPEAKING_TOPICS[speakingOpenDay - 1];
  return `
    <div class="sp-step-head">DAY ${speakingOpenDay}</div>
    <div class="sp-step-title">${content.title || topic.ko}</div>
    <div style="font-size:18px;font-weight:600;color:var(--ink-soft);margin-bottom:14px;word-break:keep-all;">${topic.ko}</div>
    <div class="sp-guide">오늘 입에 붙일 문형<br><b style="color:var(--ink);">${topic.focus}</b></div>
    <div class="sp-flow">
      <div class="sp-flow-group">
        <div class="sp-flow-title">📥 인풋 · 표현 ${content.input.length}개</div>
        <div>1. 소리 듣기 → 2. 표현 익히기 → 3. 따라 말하기 → 4. 3초 안에 혼자 말하기</div>
      </div>
      <div class="sp-flow-group">
        <div class="sp-flow-title">📤 아웃풋 · 1분 이야기</div>
        <div>1. 우리말 보면서 듣기 → 2. 한 문장씩 끊어 말하기 → 3. 빈칸 따라 말하기 → 4. 1분 동안 영어로 말하기</div>
      </div>
    </div>
    <div class="sp-guide" style="margin-top:12px;">영어 문장의 <span class="sp-chunk">/</span> 표시는 끊어 말하는 곳이에요. 한 덩어리씩 말하면 훨씬 자연스러워요.</div>`;
}

// ── 인풋 ──
function speakingIn1(content) {
  const rows = content.input.map((it, i) => `
    <div class="sp-row">
      <div class="sp-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="sp-row-main">
        <div class="sp-en">${speakingChunkHtml(it.en)}</div>
        ${it.verb ? `<div class="sp-sub">(${it.verb})</div>` : ''}
      </div>
      ${speakingSpk('in', i)}
    </div>`).join('');
  return speakingStepHead('📥 인풋', 'STEP 1 · 소리 듣기', '뜻은 아직 신경 쓰지 말고, 원어민 소리를 들으면서 / 에서 끊어 읽는 리듬을 익혀요.')
    + `<button class="complete-btn" style="margin-bottom:6px;" onclick="speakingSayAll('in')">▶ 전체 듣기</button>` + rows;
}

function speakingIn2(content) {
  const rows = content.input.map((it, i) => `
    <div class="sp-row">
      <div class="sp-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="sp-row-main">
        <div class="sp-ko">${it.ko}</div>
        <div class="sp-sub" style="font-size:16px;color:var(--ink);">${speakingChunkHtml(it.en)}</div>
        <div class="sp-key">└ ${it.key} ${it.keyKo}</div>
      </div>
      ${speakingSpk('in', i)}
    </div>`).join('');
  return speakingStepHead('📥 인풋', 'STEP 2 · 표현 익히기', '한국어 뜻과 핵심 표현을 연결해서 익혀요. 영어와 우리말이 한 번에 떠오르게요.') + rows;
}

function speakingRepTap(i, n) {
  const key = speakingOpenDay + '-' + i;
  const cur = speakingReps[key] || 0;
  speakingReps[key] = cur >= n ? n - 1 : n;
  localStorage.setItem('speaking_reps', JSON.stringify(speakingReps));
  renderSpeakingStudy();
}

function speakingIn3(content) {
  const rows = content.input.map((it, i) => {
    const count = speakingReps[speakingOpenDay + '-' + i] || 0;
    const boxes = [1, 2, 3].map(n => `<button class="sp-rep-box${count >= n ? ' on' : ''}" onclick="speakingRepTap(${i},${n})">${count >= n ? '✓' : ''}</button>`).join('');
    return `
      <div class="sp-row">
        <div class="sp-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="sp-row-main">
          <div class="sp-en">${speakingChunkHtml(it.en)}</div>
          <div class="sp-sub">${it.ko}</div>
          <div class="sp-rep-boxes">${boxes}</div>
        </div>
        ${speakingSpk('in', i)}
      </div>`;
  }).join('');
  return speakingStepHead('📥 인풋', 'STEP 3 · 따라 말하기', '🔊 듣고 소리 내서 따라 말할 때마다 네모를 하나씩 눌러 체크해요. 문장마다 3번씩!') + rows;
}

// ── 3초/5초 혼자 말하기 (인풋 STEP 4, 중간점검 공용) ──
function speakingDrillList() {
  const { isCheck, content } = speakingCurrent();
  if (isCheck) {
    return content.items.map(it => ({
      ko: it.ko, en: it.en, hint: it.hint,
      tag: Array.isArray(it.days) ? 'DAY ' + it.days.join(' + ') : '',
    }));
  }
  return content.input.map(it => ({ ko: it.ko, en: it.en, hint: `${it.keyKo} ${it.key}`, tag: '' }));
}

function speakingDrillSeconds() {
  return speakingCurrent().isCheck ? 5 : 3;
}

function speakingDrillHtml() {
  const items = speakingDrillList();
  const d = speakingDrill;
  const it = items[d.idx];
  const secs = speakingDrillSeconds();
  const last = d.idx === items.length - 1;

  let answer;
  if (d.phase === 'answer') {
    answer = `<div class="sp-drill-en">${speakingChunkHtml(it.en)}</div>
      <button class="spk-btn" style="font-size:22px;padding:8px 20px;" onclick="speakingDrillSay()">🔊</button>`;
  } else if (d.auto) {
    answer = `<div class="sp-drill-left" id="sp-drill-left">${d.left}</div><div class="sp-sub">초 안에 영어로 말해보세요</div>`;
  } else {
    answer = `<button class="step-nav-btn" style="flex:none;padding:14px 26px;font-size:17px;" onclick="speakingDrillReveal(false)">👀 영어 보기</button>`;
  }

  return `
    <div class="sp-drill">
      <div class="sp-drill-top">${d.idx + 1} / ${items.length}${it.tag ? ` · ${it.tag}` : ''}</div>
      <div class="sp-drill-ko">${it.ko}</div>
      <div class="sp-drill-hint">└ ${it.hint}</div>
      <div class="sp-drill-answer">${answer}</div>
      ${d.finished ? '<div style="font-size:16px;font-weight:700;color:var(--success);margin-top:8px;">🎉 끝까지 다 했어요! 아래 다음 → 으로 넘어가세요</div>' : ''}
    </div>
    <div class="step-nav" style="margin-top:6px;">
      <button class="step-nav-btn" style="flex:0 0 64px;" ${d.idx === 0 ? 'disabled' : ''} onclick="speakingDrillMove(-1)">◀</button>
      <button class="step-nav-btn primary" onclick="speakingDrillToggleAuto()">${d.auto ? '⏸ 멈춤' : `▶ 자동 진행 (${secs}초)`}</button>
      <button class="step-nav-btn" style="flex:0 0 64px;" ${last ? 'disabled' : ''} onclick="speakingDrillMove(1)">▶</button>
    </div>`;
}

function speakingDrillSay() {
  const it = speakingDrillList()[speakingDrill.idx];
  if (it) speak(speakingPlain(it.en));
}

function speakingDrillStartThink() {
  clearInterval(speakingDrillTimer);
  speakingDrill.phase = 'think';
  speakingDrill.left = speakingDrillSeconds();
  renderSpeakingStudy();
  const tok = speakingToken;
  speakingDrillTimer = setInterval(() => {
    if (tok !== speakingToken) { clearInterval(speakingDrillTimer); return; }
    speakingDrill.left--;
    if (speakingDrill.left <= 0) {
      clearInterval(speakingDrillTimer);
      speakingDrillReveal(true);
      return;
    }
    const el = document.getElementById('sp-drill-left');
    if (el) el.textContent = speakingDrill.left;
  }, 1000);
}

// 정답 공개 + 읽어주기. 자동 진행 중이면 다 읽은 뒤 잠깐 쉬고 다음 문장으로
function speakingDrillReveal(fromAuto) {
  const items = speakingDrillList();
  const it = items[speakingDrill.idx];
  speakingDrill.phase = 'answer';
  renderSpeakingStudy();
  const tok = speakingToken;
  speak(speakingPlain(it.en), () => {
    if (!fromAuto || tok !== speakingToken || !speakingDrill.auto) return;
    setTimeout(() => {
      if (tok !== speakingToken || !speakingDrill.auto) return;
      if (speakingDrill.idx >= items.length - 1) {
        speakingDrill.auto = false;
        speakingDrill.finished = true;
        renderSpeakingStudy();
        return;
      }
      speakingDrill.idx++;
      speakingDrillStartThink();
    }, 1200);
  });
}

function speakingDrillToggleAuto() {
  if (speakingDrill.auto) {
    clearInterval(speakingDrillTimer);
    speakingToken++;
    speakingDrill.auto = false;
    if (speakingDrill.phase === 'think') speakingDrill.left = speakingDrillSeconds();
    speak('');
    renderSpeakingStudy();
    return;
  }
  const items = speakingDrillList();
  speakingDrill.auto = true;
  speakingDrill.finished = false;
  if (speakingDrill.phase === 'answer') {
    if (speakingDrill.idx >= items.length - 1) speakingDrill.idx = 0;
    else speakingDrill.idx++;
  }
  speakingDrillStartThink();
}

function speakingDrillMove(delta) {
  const items = speakingDrillList();
  clearInterval(speakingDrillTimer);
  speakingToken++;
  speak('');
  speakingDrill.idx = Math.max(0, Math.min(items.length - 1, speakingDrill.idx + delta));
  speakingDrill.finished = false;
  if (speakingDrill.auto) { speakingDrillStartThink(); return; }
  speakingDrill.phase = 'think';
  speakingDrill.left = speakingDrillSeconds();
  renderSpeakingStudy();
}

// ── 아웃풋 ──
function speakingOut1(content) {
  const rows = content.output.sentences.map((it, i) => `
    <div class="sp-row">
      <div class="sp-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="sp-row-main">
        <div class="sp-ko">${it.ko}</div>
        ${it.hint ? `<div class="sp-key">└ ${it.hint}</div>` : ''}
      </div>
      ${speakingSpk('out', i)}
    </div>`).join('');
  return speakingStepHead('📤 아웃풋', 'STEP 1 · 우리말 보면서 듣기', `"${content.output.titleKo || '오늘의 이야기'}" - 한국어를 눈으로 따라가면서 영어 이야기를 들어보세요.`)
    + `<button class="complete-btn" style="margin-bottom:6px;" onclick="speakingSayAll('out')">▶ 영어로 이야기 전체 듣기</button>` + rows;
}

function speakingOut2(content) {
  const rows = content.output.sentences.map((it, i) => `
    <div class="sp-row">
      <div class="sp-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="sp-row-main">
        <div class="sp-en">${speakingChunkHtml(it.en)}</div>
        <div class="sp-sub">${it.ko}</div>
      </div>
      ${speakingSpk('out', i)}
    </div>`).join('');
  return speakingStepHead('📤 아웃풋', 'STEP 2 · 한 문장씩 끊어 말하기', '/ 에서 한 번씩 끊어서, 한 덩어리씩 소리 내 말해보세요.') + rows;
}

function speakingRevealToggle(key) {
  speakingReveal[key] = !speakingReveal[key];
  renderSpeakingStudy();
}

function speakingRevealAllBlanks() {
  const n = speakingCurrent().content.output.sentences.length;
  const allOpen = Array.from({ length: n }, (_, i) => speakingReveal['b' + i]).every(Boolean);
  for (let i = 0; i < n; i++) speakingReveal['b' + i] = !allOpen;
  renderSpeakingStudy();
}

function speakingOut3(content) {
  const sents = content.output.sentences.map((it, i) => {
    const plain = speakingPlain(it.en);
    const blank = (it.blank || '').trim();
    const at = blank ? plain.toLowerCase().indexOf(blank.toLowerCase()) : -1;
    if (at === -1) return `<span>${plain}</span>`;
    const word = plain.slice(at, at + blank.length);
    const shown = speakingReveal['b' + i];
    const blankHtml = shown
      ? `<span class="hl-en sp-blank-open" onclick="speakingRevealToggle('b${i}')">${word}</span>`
      : `<span class="sp-blank" onclick="speakingRevealToggle('b${i}')">${'＿'.repeat(Math.min(6, Math.max(3, Math.ceil(blank.length / 2))))}</span>`;
    return `<span>${plain.slice(0, at)}${blankHtml}${plain.slice(at + blank.length)}</span>`;
  }).join(' ');
  return speakingStepHead('📤 아웃풋', 'STEP 3 · 들으면서 따라 말하기', '이야기를 들으면서 빈칸까지 채워 소리 내 말해보세요. 빈칸을 누르면 정답이 보여요.')
    + `<div style="display:flex;gap:8px;margin-bottom:12px;">
        <button class="complete-btn" style="flex:1;" onclick="speakingSayAll('out')">▶ 전체 듣기</button>
        <button class="complete-btn" style="flex:0 0 auto;width:auto;padding:13px 16px;background:var(--surface-alt);color:var(--ink);" onclick="speakingRevealAllBlanks()">👀 빈칸 전부</button>
      </div>
      <div class="sp-paragraph">${sents}</div>`;
}

function speakingMinuteFmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function speakingMinuteToggle() {
  clearInterval(speakingMinuteTimer);
  if (speakingMinute.running) {
    speakingMinute = { left: 60, running: false, finished: false };
    renderSpeakingStudy();
    return;
  }
  speak('');
  speakingMinute = { left: 60, running: true, finished: false };
  renderSpeakingStudy();
  speakingMinuteTimer = setInterval(() => {
    speakingMinute.left--;
    if (speakingMinute.left <= 0) {
      clearInterval(speakingMinuteTimer);
      speakingMinute = { left: 0, running: false, finished: true };
      renderSpeakingStudy();
      return;
    }
    const el = document.getElementById('sp-minute-left');
    if (el) el.textContent = speakingMinuteFmt(speakingMinute.left);
  }, 1000);
}

function speakingOut4(content) {
  const m = speakingMinute;
  const koStory = content.output.sentences.map(it => it.ko).join(' ');
  const shown = speakingReveal.story;
  const timer = m.running
    ? `<div class="sp-timer" id="sp-minute-left">${speakingMinuteFmt(m.left)}</div>`
    : m.finished
      ? `<div style="font-size:20px;font-weight:700;color:var(--accent-strong);margin:6px 0;">⏰ 1분 끝! 영어 이야기로 확인해보세요</div>`
      : '';
  return speakingStepHead('📤 아웃풋', 'STEP 4 · 1분 동안 영어로 말하기', '한국어 이야기만 보고 처음부터 끝까지 영어로 말해보세요. ⏱ 1분 시작을 누르고 말하면 돼요.')
    + `<div class="sp-story-ko">${koStory}</div>
      <div style="text-align:center;margin:14px 0 6px;">${timer}</div>
      <div style="display:flex;gap:8px;">
        <button class="complete-btn" style="flex:1;" onclick="speakingMinuteToggle()">${m.running ? '⏹ 그만하기' : '⏱ 1분 시작'}</button>
        <button class="complete-btn" style="flex:1;background:var(--surface-alt);color:var(--ink);" onclick="speakingRevealToggle('story')">${shown ? '🙈 영어 가리기' : '👀 영어 이야기 보기'}</button>
      </div>
      ${shown ? `
        <div class="sp-paragraph" style="margin-top:14px;padding:14px;border-radius:12px;background:var(--success-wash);">${content.output.sentences.map(it => speakingChunkHtml(it.en)).join(' ')}</div>
        <button class="complete-btn" style="margin-top:8px;" onclick="speakingSayAll('out')">🔊 영어 이야기 듣기</button>` : ''}`;
}

// ── 마무리 ──
function speakingDoneCard(content) {
  const day = speakingOpenDay;
  const reps = content.input.reduce((sum, _, i) => sum + (speakingReps[day + '-' + i] || 0), 0);
  const isCurrent = speakingStatus(day) === 'current';
  return `
    <div style="text-align:center;padding:30px 4px 10px;">
      <div style="font-size:54px;">🎉</div>
      <div class="sp-step-title" style="margin-top:8px;">DAY ${day} 끝!</div>
      <div class="sp-sub" style="font-size:16px;">따라 말하기 체크 ${reps} / ${content.input.length * 3}번</div>
    </div>
    ${isCurrent
      ? `<button class="complete-btn" onclick="speakingComplete(${day})">✅ 오늘 학습 완료하고 다음 DAY 열기</button>`
      : `<div class="sp-guide" style="text-align:center;">이미 완료한 DAY예요. 복습 잘했어요!</div>
         <button class="complete-btn" onclick="speakingToggleDay(${day})">닫기</button>`}`;
}

function speakingCheckDone(throughDay) {
  speakingCheckData[throughDay].done = true;
  localStorage.setItem('speaking_checkData', JSON.stringify(speakingCheckData));
  speakingToggleCheck(throughDay);
}

function speakingCheckDoneCard(content) {
  const rows = content.items.map((it, i) => `
    <div class="sp-row">
      <div class="sp-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="sp-row-main">
        <div class="sp-ko">${it.ko}</div>
        <div class="sp-sub" style="font-size:16px;color:var(--ink);">${speakingChunkHtml(it.en)}</div>
      </div>
      ${speakingSpk('chk', i)}
    </div>`).join('');
  return speakingStepHead('📝 중간점검', '정답 모아보기', '막혔던 문장은 🔊 로 한 번 더 듣고 따라 말해보세요.')
    + rows
    + `<button class="complete-btn" style="margin-top:14px;" onclick="speakingCheckDone(${speakingOpenCheck})">✅ 중간점검 끝내기</button>`;
}

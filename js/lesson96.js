// -- 96강 왕초보 영어회화 강의: 순서대로 잠금해제 + 앱 내 유튜브 임베드 재생 --

let lesson96Completed = parseInt(localStorage.getItem('lesson96_completed') || '0', 10);
let lesson96Open = null;
let lesson96Study = JSON.parse(localStorage.getItem('lesson96_study') || '{}');

function lesson96Status(n) {
  if (n <= lesson96Completed) return 'done';
  if (n === lesson96Completed + 1) return 'current';
  return 'locked';
}

function lesson96Toggle(n) {
  if (lesson96Status(n) === 'locked') return;
  lesson96Open = lesson96Open === n ? null : n;
  renderLesson96();
  if (lesson96Open === n) {
    setTimeout(() => {
      const row = document.getElementById('lesson96-row-' + n);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }
}

function lesson96Complete(n) {
  if (n !== lesson96Completed + 1) return;
  lesson96Completed = n;
  localStorage.setItem('lesson96_completed', String(lesson96Completed));
  lesson96Open = lesson96Completed < 96 ? lesson96Completed + 1 : null;
  renderLesson96();
  if (lesson96Open) {
    setTimeout(() => {
      const row = document.getElementById('lesson96-row-' + lesson96Open);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }
}

function lesson96StudyPrompt(title) {
  return `당신은 한국인 학습자를 위한 영어회화 코치입니다. 아래는 한 영어회화 강의 영상의 제목입니다.

"${title}"

이 영상을 직접 보지 않은 상태에서, 이 제목이 다루는 것으로 보이는 핵심 문법/표현 주제를 학습자가 이해하고 연습할 수 있도록 새로운 학습자료를 만들어주세요. (영상 스크립트를 옮기는 게 아니라, 같은 주제에 대해 당신이 직접 설명과 예문을 새로 작성하는 것입니다)

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
{
  "summary": "이 주제의 핵심 개념을 초중급 학습자 눈높이로 쉽게 설명 (3~5문장, 원어민이 실제로 느끼는 뉘앙스 위주)",
  "points": [{"point": "핵심 문법/표현 포인트 이름", "explain": "짧은 설명"}] (2~4개),
  "examples": [{"en": "이 주제를 활용한 실생활 회화체 예문", "ko": "한국어 번역"}] (5개),
  "practice": [{"ko": "영작 연습용 한국어 문장", "en": "영어 정답"}] (3개)
}`;
}

function lesson96StudyPromptFromContext(title, description, transcript) {
  const trimmedTranscript = transcript && transcript.length > 6000 ? transcript.slice(0, 6000) + ' …' : transcript;
  const contextBlock = trimmedTranscript
    ? `영상 설명:\n"""\n${description}\n"""\n\n영상 자막(음성 자동 인식, 오타 있을 수 있음):\n"""\n${trimmedTranscript}\n"""`
    : `영상 설명:\n"""\n${description}\n"""`;

  return `당신은 한국인 학습자를 위한 영어회화 코치입니다. 아래는 영어회화 강의 영상의 제목과 실제 정보입니다.

제목: "${title}"

${contextBlock}

위 정보에서 실제로 다루는 문법 포인트와 표현을 참고해서, 학습자가 이 강의의 핵심 내용을 이해하고 복습할 수 있는 학습자료를 당신의 말로 새로 정리해주세요. (원문을 그대로 옮기지 말고, 강의에서 다루는 개념을 참고해서 직접 설명과 예문을 작성하세요)

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
{
  "summary": "이 강의에서 실제로 다루는 핵심 내용을 초중급 학습자 눈높이로 쉽게 요약 (3~5문장)",
  "points": [{"point": "강의에서 다룬 핵심 문법/표현 포인트 이름", "explain": "짧은 설명"}] (2~5개),
  "examples": [{"en": "강의 내용과 관련된 실생활 회화체 예문", "ko": "한국어 번역"}] (5개),
  "practice": [{"ko": "영작 연습용 한국어 문장", "en": "영어 정답"}] (3개)
}`;
}

async function lesson96FetchContext(videoId) {
  const res = await fetch(`${workerUrl}/transcript?v=${videoId}`);
  const data = await res.json();
  if (!res.ok || data.error || (!data.description && !data.transcript)) throw new Error(data.error || '영상 정보를 가져오지 못했어요');
  return { description: data.description || '', transcript: data.transcript || '' };
}

async function lesson96GenerateStudy(n) {
  const btn = document.getElementById('lesson96-study-btn-' + n);
  const errEl = document.getElementById('lesson96-study-err-' + n);
  if (!geminiApiKey) { errEl.innerHTML = `<div style="margin-top:8px;color:#fbbf24;font-size:12px;">${NO_KEY_MSG}</div>`; return; }

  btn.disabled = true;
  btn.textContent = '⏳ 강의 정보 확인하는 중...';
  errEl.innerHTML = '';

  const lesson = LESSON96[n - 1];
  let context = null;
  try {
    context = await lesson96FetchContext(lesson.id);
  } catch (e) {
    context = null;
  }

  btn.textContent = '⏳ 학습자료 만드는 중...';

  try {
    const prompt = context ? lesson96StudyPromptFromContext(lesson.title, context.description, context.transcript) : lesson96StudyPrompt(lesson.title);
    const content = await geminiJSON(prompt);
    content.fromTranscript = !!(context && context.transcript);
    content.fromDescription = !!(context && context.description);
    lesson96Study[n] = content;
    localStorage.setItem('lesson96_study', JSON.stringify(lesson96Study));
    renderLesson96();
  } catch (err) {
    errEl.innerHTML = `<div style="margin-top:8px;color:#f87171;font-size:12px;">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '📖 이 강의 내용 학습하기';
  }
}

function lesson96SpeakEx(n, i) {
  const c = lesson96Study[n];
  if (c && c.examples[i]) speak(c.examples[i].en);
}

function lesson96TogglePractice(el) {
  const a = el.querySelector('.lesson96-answer');
  if (a) a.style.display = a.style.display === 'none' ? 'block' : 'none';
}

function lesson96StudySection(lesson) {
  const content = lesson96Study[lesson.n];
  if (!content) {
    return `
      <div style="margin-top:10px;">
        <button class="complete-btn" id="lesson96-study-btn-${lesson.n}" style="background:linear-gradient(135deg,#0ea5e9,#6366f1);" onclick="event.stopPropagation();lesson96GenerateStudy(${lesson.n})">📖 이 강의 내용 학습하기</button>
        <div id="lesson96-study-err-${lesson.n}"></div>
      </div>`;
  }

  return `
    <div style="margin-top:12px;" onclick="event.stopPropagation();">
      <div class="card" style="margin-bottom:8px;">
        <div class="card-header">
          <span class="card-emoji">📐</span>
          <div>
            <div class="card-title">핵심 개념</div>
            <div class="card-sub">${content.fromTranscript ? '✅ 실제 강의 자막 기반으로 정리했어요' : content.fromDescription ? '✅ 실제 강의 설명 기반으로 정리했어요' : '⚠️ 강의 정보를 찾지 못해 제목만 보고 추측해서 만들었어요'}</div>
          </div>
        </div>
        <div style="font-size:13px;line-height:1.7;color:#e2e8f0;margin-bottom:10px;">${content.summary}</div>
        ${content.points.map(p => `<div style="margin-bottom:6px;"><b style="color:#a78bfa;">${p.point}</b> — <span style="color:#cbd5e1;">${p.explain}</span></div>`).join('')}
      </div>
      <div class="card" style="margin-bottom:8px;">
        <div class="card-header">
          <span class="card-emoji">🗣️</span>
          <div><div class="card-title">예문</div><div class="card-sub">🔊 듣고 따라 말해보세요</div></div>
        </div>
        ${content.examples.map((ex, i) => `
          <div class="pattern-ex">
            <div class="pattern-ex-en">${ex.en} <button class="spk-btn" onclick="event.stopPropagation();lesson96SpeakEx(${lesson.n},${i})">🔊</button></div>
            <div class="pattern-ex-ko">${ex.ko}</div>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-emoji">✍️</span>
          <div><div class="card-title">영작 연습</div><div class="card-sub">탭하면 정답이 나와요</div></div>
        </div>
        ${content.practice.map(p => `
          <div class="pattern-item" onclick="event.stopPropagation();lesson96TogglePractice(this)">
            <div style="font-weight:600;color:#f1f5f9;">${p.ko}</div>
            <div class="lesson96-answer" style="display:none;margin-top:8px;color:#38bdf8;font-weight:700;">${p.en}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function lesson96Embed(lesson, status) {
  return `
    <div style="margin-top:10px;" onclick="event.stopPropagation();">
      <div style="position:relative;width:100%;padding-top:56.25%;border-radius:10px;overflow:hidden;background:#000;">
        <iframe src="https://www.youtube-nocookie.com/embed/${lesson.id}" title="${lesson.n}강"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <a href="https://www.youtube.com/watch?v=${lesson.id}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:13px;color:#38bdf8;text-decoration:none;">유튜브에서 보기 ↗</a>
      ${status === 'current'
        ? `<button class="complete-btn" style="margin-top:10px;" onclick="event.stopPropagation();lesson96Complete(${lesson.n})">✅ 이 강의 완료하고 다음 강의 열기</button>`
        : `<div style="margin-top:8px;font-size:13px;color:#4ade80;">✅ 완료한 강의예요 · 복습 중</div>`}
    </div>
    ${lesson96StudySection(lesson)}`;
}

function renderLesson96() {
  const el = document.getElementById('lesson96-content');
  if (!el) return;

  const pct = Math.round((lesson96Completed / LESSON96.length) * 100);

  const header = `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📺</span>
        <div>
          <div class="card-title">왕초보 영어회화 강의 96강</div>
          <div class="card-sub">라이브 아카데미 토들러 · 1강부터 순서대로 진행해요</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#94a3b8;margin-bottom:6px;">
        <span>진도</span>
        <span>${lesson96Completed} / ${LESSON96.length}</span>
      </div>
      <div style="height:8px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#a78bfa,#38bdf8);transition:width .3s;"></div>
      </div>
    </div>`;

  const rows = LESSON96.map(lesson => {
    const status = lesson96Status(lesson.n);
    const isOpen = lesson96Open === lesson.n;
    const icon = status === 'done' ? '✅' : status === 'current' ? '▶️' : '🔒';
    const tagStyle = status === 'done'
      ? 'background:rgba(74,222,128,0.15);color:#4ade80;border-color:rgba(74,222,128,0.3);'
      : status === 'current'
        ? 'background:rgba(56,189,248,0.15);color:#38bdf8;border-color:rgba(56,189,248,0.3);'
        : 'background:rgba(255,255,255,0.05);color:#64748b;border-color:rgba(255,255,255,0.08);';

    return `
      <div id="lesson96-row-${lesson.n}" class="pattern-item${isOpen ? ' open' : ''}"
        style="${status === 'locked' ? 'opacity:.5;cursor:default;' : ''}"
        onclick="lesson96Toggle(${lesson.n})">
        <div class="pattern-top">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            <span class="pattern-tag" style="${tagStyle}flex-shrink:0;">${icon} ${lesson.n}강</span>
            <span style="font-size:14px;font-weight:600;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:${isOpen ? 'normal' : 'nowrap'};">${lesson.title}</span>
          </div>
        </div>
        ${isOpen ? lesson96Embed(lesson, status) : ''}
      </div>`;
  }).join('');

  el.innerHTML = header + rows;
}

// -- 96강 왕초보 영어회화 강의: 순서대로 잠금해제 + 앱 내 유튜브 임베드 재생 --

let lesson96Completed = parseInt(localStorage.getItem('lesson96_completed') || '0', 10);
let lesson96Open = null;
let lesson96Study = JSON.parse(localStorage.getItem('lesson96_study') || '{}');
let lesson96StepIdx = 0;

function lesson96Status(n) {
  if (n <= lesson96Completed) return 'done';
  if (n === lesson96Completed + 1) return 'current';
  return 'locked';
}

function lesson96Toggle(n) {
  if (lesson96Status(n) === 'locked') return;
  const opening = lesson96Open !== n;
  lesson96Open = opening ? n : null;
  if (opening) lesson96StepIdx = 0;
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
  lesson96StepIdx = 0;
  renderLesson96();
  if (lesson96Open) {
    setTimeout(() => {
      const row = document.getElementById('lesson96-row-' + lesson96Open);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }
}

const LESSON96_JSON_SPEC = `{
  "summary": "이 주제의 핵심 개념을 초중급 학습자 눈높이로 쉽게 설명 (5~7문장, 원어민이 실제로 느끼는 뉘앙스와 왜 이 표현이 중요한지 위주로 충분히 풀어서)",
  "points": [{"point": "핵심 문법/표현 포인트 이름", "explain": "구체적인 설명 (2~3문장, 예시 포함)"}] (4~6개),
  "examples": [{"en": "실생활 회화체 예문", "ko": "한국어 번역"}] (10개, 쉬운 것부터 응용까지 난이도 순으로),
  "dialogue": {"situation": "이 대화가 벌어지는 상황 한 줄 설명", "lines": [{"speaker": "A 또는 B", "en": "영어 대사", "ko": "한국어 번역"}]} (오늘 배운 패턴/표현이 자연스럽게 여러 번 등장하는 대화문 6~8줄),
  "practice": [{"ko": "영작 연습용 한국어 문장", "en": "영어 정답"}] (8개, 앞서 나온 예문보다 조금씩 응용된 문장으로)
}`;

function lesson96StudyPrompt(title) {
  return `당신은 한국인 학습자를 위한 영어회화 코치입니다. 아래는 한 영어회화 강의 영상의 제목입니다.

"${title}"

이 영상을 직접 보지 않은 상태에서, 이 제목이 다루는 것으로 보이는 핵심 문법/표현 주제를 학습자가 10~15분 정도 붙잡고 충분히 연습할 수 있는 학습자료로 만들어주세요. (영상 스크립트를 옮기는 게 아니라, 같은 주제에 대해 당신이 직접 설명과 예문을 새로 작성하는 것입니다. 내용을 아끼지 말고 풍부하게 작성하세요)

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
${LESSON96_JSON_SPEC}`;
}

function lesson96StudyPromptFromDesc(title, description) {
  return `당신은 한국인 학습자를 위한 영어회화 코치입니다. 아래는 영어회화 강의 영상의 제목과, 그 영상의 실제 설명(창작자가 직접 작성)입니다.

제목: "${title}"

영상 설명:
"""
${description}
"""

위 설명에서 실제로 다루는 문법 포인트와 표현을 참고해서, 학습자가 이 강의의 핵심 내용을 10~15분 정도 붙잡고 충분히 이해·복습·연습할 수 있는 학습자료를 당신의 말로 새로 정리해주세요. (원문을 그대로 옮기지 말고, 강의에서 다루는 개념을 참고해서 직접 설명과 예문을 작성하세요. 내용을 아끼지 말고 풍부하게 작성하세요)

다음 JSON 형식으로만 답하세요 (다른 설명 없이 JSON만):
${LESSON96_JSON_SPEC}`;
}

async function lesson96GenerateStudy(n) {
  const btn = document.getElementById('lesson96-study-btn-' + n) || document.getElementById('lesson96-regen-btn-' + n);
  const errEl = document.getElementById('lesson96-study-err-' + n);
  if (!geminiApiKey) { errEl.innerHTML = `<div style="margin-top:8px;color:var(--warning);font-size:12px;">${NO_KEY_MSG}</div>`; return; }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 만드는 중...';
  errEl.innerHTML = '';

  const lesson = LESSON96[n - 1];

  try {
    const prompt = lesson.desc ? lesson96StudyPromptFromDesc(lesson.title, lesson.desc) : lesson96StudyPrompt(lesson.title);
    const content = await geminiJSON(prompt);
    content.fromDescription = !!lesson.desc;
    lesson96Study[n] = content;
    localStorage.setItem('lesson96_study', JSON.stringify(lesson96Study));
    lesson96StepIdx = 0;
    renderLesson96();
  } catch (err) {
    errEl.innerHTML = `<div style="margin-top:8px;color:var(--danger);font-size:12px;">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = originalText;
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

function lesson96SpeakDialogue(n, i) {
  const c = lesson96Study[n];
  if (c && c.dialogue && c.dialogue.lines[i]) speak(c.dialogue.lines[i].en);
}

function lesson96StepDefs(content) {
  const steps = [
    { key: 'concept', emoji: '📐', label: '핵심 개념' },
    { key: 'examples', emoji: '🗣️', label: '예문' },
  ];
  if (content.dialogue) steps.push({ key: 'dialogue', emoji: '💬', label: '미니 대화문' });
  steps.push({ key: 'practice', emoji: '✍️', label: '영작 연습' });
  return steps;
}

function lesson96GoStep(delta) {
  lesson96StepIdx += delta;
  renderLesson96();
}

function lesson96ConceptCard(content) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📐</span>
        <div>
          <div class="card-title">핵심 개념</div>
          <div class="card-sub">${content.fromDescription ? '✅ 실제 강의 설명 기반으로 정리했어요' : '⚠️ 강의 정보를 찾지 못해 제목만 보고 추측해서 만들었어요'}</div>
        </div>
      </div>
      <div style="font-size:13px;line-height:1.7;color:var(--ink-soft);margin-bottom:10px;">${content.summary}</div>
      ${content.points.map(p => `<div style="margin-bottom:6px;"><b style="color:var(--accent);">${p.point}</b> — <span style="color:var(--ink-soft);">${p.explain}</span></div>`).join('')}
    </div>`;
}

function lesson96ExamplesCard(lesson, content) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">🗣️</span>
        <div><div class="card-title">예문</div><div class="card-sub">🔊 듣고 따라 말해보세요</div></div>
      </div>
      ${content.examples.map((ex, i) => `
        <div class="pattern-ex">
          <div class="pattern-ex-en">${ex.en} <button class="spk-btn" onclick="event.stopPropagation();lesson96SpeakEx(${lesson.n},${i})">🔊</button></div>
          <div class="pattern-ex-ko">${ex.ko}</div>
        </div>`).join('')}
    </div>`;
}

function lesson96DialogueCard(lesson, content) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">💬</span>
        <div><div class="card-title">미니 대화문</div><div class="card-sub">${content.dialogue.situation || '오늘 배운 표현이 들어간 대화'}</div></div>
      </div>
      ${content.dialogue.lines.map((l, i) => `
        <div class="dl-wrap${l.speaker === 'B' ? ' me' : ''}">
          <div class="dl-bubble${l.speaker === 'B' ? ' me' : ''}">
            <div class="dl-en">${l.en} <button class="spk-btn" onclick="event.stopPropagation();lesson96SpeakDialogue(${lesson.n},${i})">🔊</button></div>
            <div class="dl-ko">${l.ko}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function lesson96PracticeCard(content) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">✍️</span>
        <div><div class="card-title">영작 연습</div><div class="card-sub">탭하면 정답이 나와요</div></div>
      </div>
      ${content.practice.map(p => `
        <div class="pattern-item" onclick="event.stopPropagation();lesson96TogglePractice(this)">
          <div style="font-weight:600;color:var(--ink);">${p.ko}</div>
          <div class="lesson96-answer" style="display:none;margin-top:8px;color:var(--accent-strong);font-weight:700;">${p.en}</div>
        </div>`).join('')}
    </div>`;
}

function lesson96RenderStepCard(lesson, content, step) {
  if (step.key === 'concept') return lesson96ConceptCard(content);
  if (step.key === 'examples') return lesson96ExamplesCard(lesson, content);
  if (step.key === 'dialogue') return lesson96DialogueCard(lesson, content);
  return lesson96PracticeCard(content);
}

function lesson96StudySection(lesson) {
  const content = lesson96Study[lesson.n];
  if (!content) {
    return `
      <div style="margin-top:10px;">
        <button class="complete-btn" id="lesson96-study-btn-${lesson.n}" style="background:var(--accent-strong);" onclick="event.stopPropagation();lesson96GenerateStudy(${lesson.n})">📖 이 강의 내용 학습하기</button>
        <div id="lesson96-study-err-${lesson.n}"></div>
      </div>`;
  }

  const steps = lesson96StepDefs(content);
  const idx = Math.max(0, Math.min(lesson96StepIdx, steps.length - 1));
  const step = steps[idx];
  const dots = steps.map((s, i) => `<div class="step-dot${i < idx ? ' done' : i === idx ? ' on' : ''}"></div>`).join('');

  return `
    <div style="margin-top:12px;" onclick="event.stopPropagation();">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
        <div class="step-label" style="margin-bottom:0;">${idx + 1} / ${steps.length}단계 · ${step.emoji} ${step.label}</div>
        <button id="lesson96-regen-btn-${lesson.n}" onclick="lesson96GenerateStudy(${lesson.n})" style="font-size:11px;font-weight:700;color:var(--muted);background:none;border:none;cursor:pointer;padding:4px 0;">🔄 다시 만들기</button>
      </div>
      <div class="step-track">${dots}</div>
      ${lesson96RenderStepCard(lesson, content, step)}
      <div id="lesson96-study-err-${lesson.n}"></div>
      <div class="step-nav">
        <button class="step-nav-btn" ${idx === 0 ? 'disabled' : ''} onclick="lesson96GoStep(-1)">← 이전</button>
        <button class="step-nav-btn primary" ${idx === steps.length - 1 ? 'disabled' : ''} onclick="lesson96GoStep(1)">다음 →</button>
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
      <a href="https://www.youtube.com/watch?v=${lesson.id}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:13px;color:var(--accent-strong);text-decoration:none;">유튜브에서 보기 ↗</a>
      ${status === 'current'
        ? `<button class="complete-btn" style="margin-top:10px;" onclick="event.stopPropagation();lesson96Complete(${lesson.n})">✅ 이 강의 완료하고 다음 강의 열기</button>`
        : `<div style="margin-top:8px;font-size:13px;color:var(--success);">✅ 완료한 강의예요 · 복습 중</div>`}
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
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:6px;">
        <span>진도</span>
        <span>${lesson96Completed} / ${LESSON96.length}</span>
      </div>
      <div style="height:8px;border-radius:999px;background:var(--surface-alt);overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent-strong));transition:width .3s;"></div>
      </div>
    </div>`;

  const rows = LESSON96.map(lesson => {
    const status = lesson96Status(lesson.n);
    const isOpen = lesson96Open === lesson.n;
    const icon = status === 'done' ? '✅' : status === 'current' ? '▶️' : '🔒';
    const tagStyle = status === 'done'
      ? 'background:rgba(21,128,61,0.15);color:var(--success);border-color:rgba(21,128,61,0.3);'
      : status === 'current'
        ? 'background:rgba(11,92,86,0.15);color:var(--accent-strong);border-color:rgba(11,92,86,0.3);'
        : 'background:var(--surface-alt);color:var(--muted);border-color:var(--line-soft);';

    return `
      <div id="lesson96-row-${lesson.n}" class="pattern-item${isOpen ? ' open' : ''}"
        style="${status === 'locked' ? 'opacity:.5;cursor:default;' : ''}"
        onclick="lesson96Toggle(${lesson.n})">
        <div class="pattern-top">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            <span class="pattern-tag" style="${tagStyle}flex-shrink:0;">${icon} ${lesson.n}강</span>
            <span style="font-size:14px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:${isOpen ? 'normal' : 'nowrap'};">${lesson.title}</span>
          </div>
        </div>
        ${isOpen ? lesson96Embed(lesson, status) : ''}
      </div>`;
  }).join('');

  el.innerHTML = header + rows;
}

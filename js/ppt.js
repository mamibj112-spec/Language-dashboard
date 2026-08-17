// ── PPT: 기록 기반 PPT 초안 생성 + .pptx 다운로드 ──

let pptSelectedIds = new Set();
let pptLastSlides = [];
let pptLastTopic = 'PPT';

function renderPptNoteList() {
  const el = document.getElementById('ppt-note-list');
  if (!notesCache.length) {
    el.innerHTML = `<div style="color:#fbbf24;font-size:15px;margin-bottom:8px;">⚠️ 아직 저장된 기록이 없어요. 먼저 기록 탭에서 기록을 추가해주세요.</div>`;
    return;
  }
  pptSelectedIds = new Set(notesCache.map(n => n.id));
  el.innerHTML = `
    <div style="font-size:15px;color:#94a3b8;margin-bottom:8px;">PPT에 포함할 기록을 선택하세요 (기본: 전체 선택)</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${notesCache.map(n => {
        const date = new Date(n.createdAt);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        return `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.06);cursor:pointer;">
          <input type="checkbox" checked onchange="pptToggleNote('${n.id}', this.checked)" style="width:16px;height:16px;accent-color:#0ea5e9;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.title || '(제목 없음)'}</div>
            <div style="font-size:13px;color:#94a3b8;">${dateStr}${(n.tags||[]).length ? ' · ' + n.tags.map(t=>'#'+t).join(' ') : ''}</div>
          </div>
        </label>`;
      }).join('')}
    </div>`;
}

function pptToggleNote(id, checked) {
  if (checked) pptSelectedIds.add(id); else pptSelectedIds.delete(id);
}

async function generatePptFromNotes() {
  const resultEl = document.getElementById('ppt-result');
  const btn = document.getElementById('ppt-generate-btn');
  if (!geminiApiKey) { resultEl.innerHTML = `<div style="margin-top:12px;color:#fbbf24;">⚙️ API 키가 없어요! 오른쪽 상단 ⚙️ 버튼을 눌러 Gemini API 키를 입력해 주세요.</div>`; return; }

  const selected = notesCache.filter(n => pptSelectedIds.has(n.id));
  if (!selected.length) { resultEl.innerHTML = `<div style="margin-top:12px;color:#fbbf24;">⚠️ 기록을 하나 이상 선택해주세요.</div>`; return; }

  const titleInput = document.getElementById('ppt-title-input').value.trim();
  let count = parseInt(document.getElementById('ppt-slide-count').value, 10);
  if (!count || count < 3 || count > 15) count = 6;

  btn.disabled = true; btn.textContent = '⏳ PPT 초안 작성 중...';
  resultEl.innerHTML = '';

  const context = selected.map((n, i) => {
    const docNames = getNoteMediaList(n).filter(m => m.type === 'document' && !m.aiSummary).map(m => m.name).join(', ');
    return `[자료 ${i+1}] 제목: ${n.title || '(제목없음)'}\n내용: ${n.content || '(없음)'}${n.aiSummary ? `\n분석 내용: ${n.aiSummary}` : ''}${docNames ? `\n첨부 파일명: ${docNames}` : ''}`;
  }).join('\n\n');

  const prompt = `아래는 사용자가 직접 저장해둔 회사 학습/업무 기록들입니다. 이 내용을 바탕으로 발표용 PPT 초안을 만들어주세요.

${context}

${titleInput ? `PPT 제목: ${titleInput}` : ''}
총 ${count}장의 슬라이드로 구성해주세요.

다음 형식의 JSON 배열로만 답해주세요 (다른 설명 없이 JSON만):
[{"title": "슬라이드 제목", "bullets": ["불릿1", "불릿2", "불릿3"]}]

조건:
- 첫 슬라이드는 표지, 마지막은 요약/결론
- 불릿포인트는 슬라이드당 2~4개, 기록의 실제 내용·수치를 최대한 반영
- 간결하고 보고서에 바로 쓸 수 있는 비즈니스 문체`;

  try {
    const slides = await geminiJSON(prompt);
    pptLastSlides = slides;
    pptLastTopic = titleInput || selected[0].title || 'PPT';

    resultEl.innerHTML = slides.map((s, i) => `
      <div style="margin-top:10px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
        <div style="font-size:13px;color:#94a3b8;margin-bottom:4px;">슬라이드 ${i + 1}</div>
        <div style="font-weight:700;font-size:17px;margin-bottom:8px;">${s.title}</div>
        <ul style="margin:0;padding-left:18px;color:#e2e8f0;font-size:15px;line-height:1.7;">
          ${(s.bullets || []).map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>`).join('')
      + `<button class="complete-btn" onclick="downloadPptx()" style="margin-top:14px;background:linear-gradient(135deg,#22c55e,#0ea5e9);">⬇️ PPT 파일(.pptx) 다운로드</button>`;
  } catch (err) {
    resultEl.innerHTML = `<div style="margin-top:12px;color:#f87171;">❌ ${err.message}</div>`;
  }
  btn.disabled = false; btn.textContent = '✨ PPT 초안 생성';
}

function downloadPptx() {
  if (!pptLastSlides.length || typeof PptxGenJS === 'undefined') return;
  const pres = new PptxGenJS();
  pres.defineSlideMaster({
    title: 'MASTER',
    background: { color: 'FFFFFF' },
  });

  pptLastSlides.forEach((s, i) => {
    const slide = pres.addSlide({ masterName: 'MASTER' });
    if (i === 0) {
      slide.addText(s.title || '', { x: 0.5, y: 2.2, w: 9, h: 1.2, fontSize: 32, bold: true, color: '1e293b', align: 'center' });
      (s.bullets || []).forEach((b, j) => {
        slide.addText(b, { x: 0.5, y: 3.3 + j * 0.5, w: 9, h: 0.5, fontSize: 16, color: '475569', align: 'center' });
      });
    } else {
      slide.addText(s.title || '', { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 24, bold: true, color: '1e293b' });
      slide.addShape('rect', { x: 0.5, y: 1.15, w: 2.2, h: 0.04, fill: { color: '0ea5e9' } });
      const bulletText = (s.bullets || []).map(b => ({ text: b, options: { bullet: true, breakLine: true } }));
      slide.addText(bulletText, { x: 0.5, y: 1.5, w: 9, h: 5, fontSize: 16, color: '334155', lineSpacingMultiple: 1.4 });
    }
  });

  pres.writeFile({ fileName: `${pptLastTopic.replace(/[\\/:*?"<>|]/g, '')}.pptx` });
}

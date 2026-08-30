// ── 기록 (회사 공부 메모 + 사진/동영상, IndexedDB 저장) + 질문하기 + 회사 대시보드 + 라이트박스 ──

const NOTES_KEY = 'workNotes'; // legacy localStorage key, migrated then removed
let notesDB = null;
let notesCache = [];
let notesFormMediaList = []; // [{ type: 'image'|'video'|'document', blob, mime, name, aiSummary? }]
let notesEditingId = null;
let notesActiveTagFilter = null;
let notesObjectUrls = []; // objectURLs created during last render, revoked before next render

function openNotesDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('workNotesDB', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getNotesDB() {
  if (!notesDB) notesDB = await openNotesDB();
  return notesDB;
}
async function idbGetAllNotes() {
  const db = await getNotesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readonly');
    const req = tx.objectStore('notes').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutNote(note) {
  const db = await getNotesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').put(note);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeleteNote(id) {
  const db = await getNotesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function migrateOldNotesIfNeeded() {
  const raw = localStorage.getItem(NOTES_KEY);
  if (!raw) return;
  try {
    const oldNotes = JSON.parse(raw);
    for (const n of oldNotes) {
      let mediaList = [];
      if (n.image) {
        const blob = await (await fetch(n.image)).blob();
        mediaList = [{ type: 'image', blob, mime: blob.type || 'image/jpeg' }];
      }
      await idbPutNote({ id: n.id, title: n.title, content: n.content, tags: n.tags || [], mediaList, createdAt: n.createdAt });
    }
  } catch (e) { /* ignore malformed legacy data */ }
  localStorage.removeItem(NOTES_KEY);
}

// 구버전(단일 media 필드) 호환용 헬퍼
function getNoteMediaList(note) {
  if (note.mediaList) return note.mediaList;
  if (note.media) return [note.media];
  return [];
}

async function notesLoadAll() {
  await migrateOldNotesIfNeeded();
  notesCache = (await idbGetAllNotes()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function compressImageToBlob(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DOC_EXT_ICON = { pdf: '📕', doc: '📘', docx: '📘', ppt: '📙', pptx: '📙', xls: '📗', xlsx: '📗', txt: '📄' };
function fileExt(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}
function formatBytes(n) {
  if (n < 1024) return n + 'B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + 'KB';
  return (n / (1024 * 1024)).toFixed(1) + 'MB';
}

function renderMediaFormPreview() {
  const preview = document.getElementById('notes-form-media-preview');
  if (!preview) return;
  if (!notesFormMediaList.length) { preview.innerHTML = ''; return; }

  preview.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
    ${notesFormMediaList.map((m, i) => {
      const url = URL.createObjectURL(m.blob);
      let thumb;
      if (m.type === 'image') thumb = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;">`;
      else if (m.type === 'video') thumb = `<video src="${url}" style="width:100%;height:100%;object-fit:cover;"></video>`;
      else if (m.type === 'audio') thumb = `<div style="font-size:28px;">🎙️</div>`;
      else thumb = `<div style="font-size:28px;">${DOC_EXT_ICON[fileExt(m.name)] || '📄'}</div>`;
      return `
        <div style="position:relative;width:88px;">
          <div style="width:88px;height:88px;border-radius:10px;overflow:hidden;background:var(--surface-alt);border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;">${thumb}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name || (m.type === 'image' ? '사진' : m.type === 'video' ? '동영상' : m.type === 'audio' ? '음성' : '문서')}</div>
          <button onclick="removeNoteMediaAt(${i})" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--danger);color:#fff;border:none;font-size:14px;cursor:pointer;">✕</button>
        </div>`;
    }).join('')}
  </div>`;
}

function removeNoteMediaAt(i) {
  notesFormMediaList.splice(i, 1);
  renderMediaFormPreview();
}

async function addNoteMediaFile(file) {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const isAudio = file.type.startsWith('audio/');
  const isDoc = !isVideo && !isImage && !isAudio;

  if (isVideo && file.size > 80 * 1024 * 1024) {
    alert(`"${file.name}" 동영상이 너무 커요 (80MB 이하만 가능).`);
    return;
  }
  if ((isDoc || isAudio) && file.size > 50 * 1024 * 1024) {
    alert(`"${file.name}" 파일이 너무 커요 (50MB 이하만 가능).`);
    return;
  }

  if (isVideo) {
    notesFormMediaList.push({ type: 'video', blob: file, mime: file.type, name: file.name });
  } else if (isImage) {
    let blob;
    try {
      blob = await compressImageToBlob(file, 1000, 0.75);
    } catch {
      blob = file; // 압축 실패 시(예: HEIC 등 디코딩 불가) 원본 그대로 저장
    }
    notesFormMediaList.push({ type: 'image', blob, mime: blob.type || 'image/jpeg', name: file.name });
  } else if (isAudio) {
    notesFormMediaList.push({ type: 'audio', blob: file, mime: file.type, name: file.name });
  } else {
    notesFormMediaList.push({ type: 'document', blob: file, mime: file.type, name: file.name });
  }
  renderMediaFormPreview();
}

async function handleNoteMediaInput(input) {
  const files = input.files ? Array.from(input.files) : [];
  for (const file of files) {
    await addNoteMediaFile(file);
  }
  input.value = '';
}

async function handleNotePaste(event) {
  const items = event.clipboardData && event.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) await addNoteMediaFile(file);
      return;
    }
  }
  // no image in clipboard — let normal text paste proceed
}

function openNoteForm(editId) {
  notesEditingId = editId || null;
  const editing = notesEditingId ? notesCache.find(n => n.id === notesEditingId) : null;
  notesFormMediaList = editing ? getNoteMediaList(editing).slice() : [];

  const box = document.getElementById('notes-form-box');
  box.innerHTML = `
    <div class="card">
      <div style="font-weight:700;margin-bottom:10px;">${editing ? '✏️ 기록 수정' : '➕ 새 기록'}</div>
      <input type="text" id="notes-form-title" placeholder="제목" value="${editing ? editing.title.replace(/"/g, '&quot;') : ''}" style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface-alt);color:var(--ink);font-size:16px;margin-bottom:8px;">
      <textarea id="notes-form-content" placeholder="배운 내용을 적어주세요 (캡처한 화면은 여기에 Ctrl+V로 붙여넣기 가능)" rows="5" style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface-alt);color:var(--ink);font-size:16px;margin-bottom:8px;resize:vertical;" onpaste="handleNotePaste(event)">${editing ? editing.content : ''}</textarea>
      <input type="text" id="notes-form-tags" placeholder="태그 (쉼표로 구분, 예: 엑셀, 회의)" value="${editing && editing.tags ? editing.tags.join(', ') : ''}" style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface-alt);color:var(--ink);font-size:16px;margin-bottom:8px;">
      <div style="display:flex;gap:8px;">
        <label class="complete-btn" style="flex:1;display:block;text-align:center;background:var(--surface-alt);cursor:pointer;">
          📷 촬영하기
          <input type="file" accept="image/*,video/*" capture="environment" onchange="handleNoteMediaInput(this)" style="display:none;">
        </label>
        <label class="complete-btn" style="flex:1;display:block;text-align:center;background:var(--surface-alt);cursor:pointer;">
          🖼 갤러리에서 선택
          <input type="file" accept="image/*,video/*" multiple onchange="handleNoteMediaInput(this)" style="display:none;">
        </label>
      </div>
      <label class="complete-btn" style="display:block;text-align:center;background:var(--surface-alt);cursor:pointer;margin-top:8px;">
        📎 문서 첨부 (워드·PPT·엑셀·PDF)
        <input type="file" accept=".doc,.docx,.ppt,.pptx,.pdf,.xls,.xlsx,.txt" multiple onchange="handleNoteMediaInput(this)" style="display:none;">
      </label>
      <label class="complete-btn" style="display:block;text-align:center;background:var(--surface-alt);cursor:pointer;margin-top:8px;">
        🎙️ 음성 파일 첨부
        <input type="file" accept="audio/*" multiple onchange="handleNoteMediaInput(this)" style="display:none;">
      </label>
      <div id="notes-form-media-preview"></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="complete-btn" id="notes-save-btn" onclick="saveNote()">💾 저장</button>
        <button class="complete-btn" onclick="closeNoteForm()" style="background:var(--surface-alt);">취소</button>
      </div>
    </div>`;
  renderMediaFormPreview();
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });

  if (!isRestoringHistory) {
    history.pushState({ dashboard: currentDashboard, tab: currentTabName, modal: 'noteForm' }, '', location.href);
  }
}

function closeNoteFormUI() {
  document.getElementById('notes-form-box').innerHTML = '';
  notesEditingId = null;
  notesFormMediaList = [];
}

function closeNoteForm() {
  if (history.state && history.state.modal === 'noteForm') {
    history.back();
  } else {
    closeNoteFormUI();
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 첨부파일 AI 분석 — 실패해도 저장은 계속돼야 하므로 오류 시 빈 문자열 반환
async function analyzeMediaWithGemini(blob, mimeType, promptText) {
  if (!geminiApiKey) return '';
  try {
    const base64 = await blobToBase64(blob);
    return await callGemini({
      contents: [{
        role: 'user',
        parts: [
          { text: promptText },
          { inlineData: { mimeType, data: base64 } }
        ]
      }]
    });
  } catch {
    return '';
  }
}

function analyzeImageWithGemini(blob, mime) {
  return analyzeMediaWithGemini(blob, mime || 'image/jpeg',
    '이 이미지는 회사 업무/학습 관련 자료(화면 캡처, 문서, 메모, 칠판 등)일 수 있습니다. 이미지에 보이는 텍스트는 최대한 그대로 옮겨 적고, 내용을 2~3문장으로 요약해주세요. 다른 설명 없이 결과만 작성해주세요.');
}

function analyzePdfWithGemini(blob) {
  return analyzeMediaWithGemini(blob, 'application/pdf',
    '이 PDF는 회사 업무/학습 자료입니다. 주요 내용을 최대한 자세히 정리해주세요. 텍스트는 그대로 옮기고, 표나 핵심 항목은 구조적으로 정리해주세요. 다른 설명 없이 내용만 작성해주세요.');
}

function analyzeAudioWithGemini(blob, mime) {
  return analyzeMediaWithGemini(blob, mime || 'audio/webm',
    '이 음성 파일은 회사 업무/학습 관련 음성 메모일 수 있습니다. 들리는 내용을 최대한 정확하게 받아쓰고(한국어/영어 구분 없이), 마지막에 2~3문장으로 요약해주세요. 다른 설명 없이 결과만 작성해주세요.');
}

async function saveNote() {
  const title = document.getElementById('notes-form-title').value.trim();
  const content = document.getElementById('notes-form-content').value.trim();
  const tags = document.getElementById('notes-form-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  if (!title && !content) { alert('제목이나 내용을 입력해주세요.'); return; }

  const saveBtn = document.getElementById('notes-save-btn');

  const isPdf = m => m.type === 'document' && (m.mime === 'application/pdf' || (m.name || '').toLowerCase().endsWith('.pdf'));
  const itemsToAnalyze = notesFormMediaList.filter(m => (m.type === 'image' || m.type === 'audio' || isPdf(m)) && !m.aiSummary);
  if (itemsToAnalyze.length && saveBtn) {
    let done = 0;
    saveBtn.disabled = true;
    for (const m of itemsToAnalyze) {
      const label = m.type === 'audio' ? '음성 받아쓰는' : isPdf(m) ? 'PDF 분석' : '이미지 분석';
      saveBtn.textContent = `🔎 ${label} 중... (${++done}/${itemsToAnalyze.length})`;
      m.aiSummary = m.type === 'audio' ? await analyzeAudioWithGemini(m.blob, m.mime)
                  : isPdf(m) ? await analyzePdfWithGemini(m.blob)
                  : await analyzeImageWithGemini(m.blob, m.mime);
    }
  }
  const aiSummary = notesFormMediaList
    .filter(m => (m.type === 'image' || m.type === 'audio' || isPdf(m)) && m.aiSummary)
    .map(m => m.aiSummary)
    .join('\n---\n');

  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ 저장 중...'; }
  try {
    if (notesEditingId) {
      const existing = notesCache.find(n => n.id === notesEditingId);
      await idbPutNote(Object.assign({}, existing, { title, content, tags, mediaList: notesFormMediaList, media: undefined, aiSummary }));
    } else {
      await idbPutNote({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title, content, tags, mediaList: notesFormMediaList, aiSummary,
        createdAt: new Date().toISOString(),
      });
    }
    await notesLoadAll();
    closeNoteForm();
    renderNotesList();
  } catch (err) {
    alert('저장에 실패했어요: ' + err.message + (err.name === 'QuotaExceededError' ? ' (저장공간이 부족해요)' : ''));
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 저장'; }
  }
}

// ── 질문하기 (NotebookLM 스타일 채팅) ──
let askChatMessages = []; // [{ role: 'user'|'assistant', text, sources?: string[] }]
let askChatLoading = false;

function buildNotesContext() {
  return notesCache.map((n, i) => {
    const date = new Date(n.createdAt);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    const allDocs = getNoteMediaList(n).filter(m => m.type === 'document');
    const otherDocs = allDocs.filter(m => !m.aiSummary).map(m => m.name).join(', ');
    return `[기록 ${i + 1}] 제목: ${n.title || '(제목없음)'} / 날짜: ${dateStr} / 태그: ${(n.tags || []).join(', ') || '없음'}\n내용: ${n.content || '(없음)'}${n.aiSummary ? `\n사진/음성/PDF 분석: ${n.aiSummary}` : ''}${otherDocs ? `\n첨부 문서(내용 읽기 불가, 파일명만 참고): ${otherDocs}` : ''}`;
  }).join('\n\n');
}

function goToNoteByTitle(title) {
  switchTab('notes');
  setTimeout(() => {
    document.getElementById('notes-search').value = title;
    renderNotesList();
  }, 50);
}

function renderAskChat() {
  const el = document.getElementById('ask-chat-messages');
  if (!askChatMessages.length) {
    el.innerHTML = `<div style="text-align:center;color:var(--muted);padding:24px 0;font-size:15px;">저장된 기록에 대해 무엇이든 물어보세요.<br>예: "VLOOKUP 어떻게 쓰는지 정리한 거 있어?"</div>`;
    return;
  }
  el.innerHTML = askChatMessages.map(m => {
    if (m.role === 'user') {
      return `<div style="align-self:flex-end;max-width:85%;background:var(--accent-strong);color:#fff;padding:10px 14px;border-radius:14px 14px 2px 14px;font-size:16px;line-height:1.6;">${m.text}</div>`;
    }
    const sourcesHtml = (m.sources && m.sources.length)
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">${m.sources.map(s => `<button class="tab-btn" onclick="goToNoteByTitle('${s.replace(/'/g, "\\'")}')" style="font-size:13px;padding:4px 10px;">📒 ${s}</button>`).join('')}</div>`
      : '';
    return `<div style="align-self:flex-start;max-width:90%;background:var(--surface-alt);border:1px solid var(--line-soft);padding:10px 14px;border-radius:14px 14px 14px 2px;font-size:16px;line-height:1.7;white-space:pre-wrap;">${m.text}${sourcesHtml}</div>`;
  }).join('') + (askChatLoading ? `<div style="align-self:flex-start;color:var(--muted);font-size:15px;">⏳ 기록을 살펴보는 중...</div>` : '');
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function resetAskChat() {
  askChatMessages = [];
  renderAskChat();
}

async function sendAskChat() {
  const input = document.getElementById('ask-chat-input');
  const q = input.value.trim();
  if (!q || askChatLoading) return;
  if (!geminiApiKey) { alert('⚙️ API 키가 없어요! 오른쪽 상단 ⚙️ 버튼을 눌러 Gemini API 키를 입력해 주세요.'); return; }

  await notesLoadAll();
  if (!notesCache.length) { alert('아직 저장된 기록이 없어요.'); return; }

  input.value = '';
  askChatMessages.push({ role: 'user', text: q });
  askChatLoading = true;
  renderAskChat();

  const systemPrompt = `당신은 사용자의 회사 공부/업무 기록을 바탕으로 답해주는 비서입니다. 아래는 사용자가 저장해둔 기록 전체입니다.

${buildNotesContext()}

위 기록들을 바탕으로 사용자와 대화하며 질문에 답하세요. 이전 대화 맥락도 참고해서 자연스럽게 이어가세요.
반드시 다음 JSON 형식으로만 응답하세요 (다른 설명 없이 JSON만): {"answer": "답변 내용", "sources": ["참고한 기록 제목1", "참고한 기록 제목2"]}
기록에서 답을 찾을 수 없으면 answer에 솔직히 찾을 수 없다고 쓰고 sources는 빈 배열로 주세요.`;

  const contents = askChatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));

  try {
    const text = await callGemini({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents });
    let parsed;
    try { parsed = JSON.parse(stripJsonFences(text)); } catch { parsed = { answer: text, sources: [] }; }
    askChatMessages.push({ role: 'assistant', text: parsed.answer || '답변을 받지 못했어요.', sources: parsed.sources || [] });
  } catch (err) {
    askChatMessages.push({ role: 'assistant', text: `❌ ${err.message}`, sources: [] });
  }
  askChatLoading = false;
  renderAskChat();
}

async function deleteNote(id) {
  if (!confirm('이 기록을 삭제할까요?')) return;
  await idbDeleteNote(id);
  await notesLoadAll();
  renderNotesList();
}

// ── 회사 대시보드 ──
const companyDashObjectUrls = new Map();

function renderCompanyDashboard() {
  companyDashObjectUrls.forEach(url => URL.revokeObjectURL(url));
  companyDashObjectUrls.clear();

  const el = document.getElementById('company-dash-content');
  const notes = notesCache;

  const now = new Date();
  const thisMonthCount = notes.filter(n => {
    const d = new Date(n.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const withMediaCount = notes.filter(n => getNoteMediaList(n).length > 0).length;

  const tagCounts = {};
  notes.forEach(n => (n.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const statCard = (emoji, num, label) => `
    <div style="flex:1;min-width:80px;text-align:center;padding:14px 8px;border-radius:12px;background:var(--surface-alt);border:1px solid var(--line-soft);">
      <div style="font-size:22px;font-weight:700;">${emoji} ${num}</div>
      <div style="font-size:14px;color:var(--muted);margin-top:4px;">${label}</div>
    </div>`;

  const recent = notes.slice(0, 5);
  const recentHtml = recent.length ? recent.map(n => {
    const date = new Date(n.createdAt);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    let thumb = '';
    const firstMedia = getNoteMediaList(n)[0];
    if (firstMedia && firstMedia.blob) {
      const url = URL.createObjectURL(firstMedia.blob);
      companyDashObjectUrls.set(n.id, url);
      thumb = firstMedia.type === 'image'
        ? `<img src="${url}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0;">`
        : `<div style="width:48px;height:48px;border-radius:8px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${firstMedia.type === 'video' ? '🎬' : firstMedia.type === 'audio' ? '🎙️' : (DOC_EXT_ICON[fileExt(firstMedia.name)] || '📄')}</div>`;
    }
    return `
      <div class="tab-btn" onclick="switchTab('notes')" style="display:flex;align-items:center;gap:10px;text-align:left;width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:8px;">
        ${thumb}
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.title || '(제목 없음)'}</div>
          <div style="font-size:13px;color:var(--muted);">${dateStr}${(n.tags || []).length ? ' · ' + n.tags.map(t => '#' + t).join(' ') : ''}</div>
        </div>
      </div>`;
  }).join('') : `<div style="text-align:center;color:var(--muted);padding:20px 0;font-size:15px;">아직 기록이 없어요.</div>`;

  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-emoji">📊</span>
        <div>
          <div class="card-title">회사 기록 한눈에 보기</div>
          <div class="card-sub">저장해둔 기록들을 요약해서 보여드려요</div>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        ${statCard('📒', notes.length, '전체 기록')}
        ${statCard('🗓️', thisMonthCount, '이번 달')}
        ${statCard('📷', withMediaCount, '사진/영상 첨부')}
        ${statCard('🏷️', topTags.length, '사용 중인 태그')}
      </div>
      ${topTags.length ? `
        <div style="font-size:14px;color:var(--muted);margin-bottom:6px;">자주 쓰는 태그</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
          ${topTags.map(([tag, count]) => `<span style="font-size:14px;background:var(--surface-alt);padding:4px 10px;border-radius:10px;color:var(--ink-soft);">#${tag} ${count}</span>`).join('')}
        </div>
      ` : ''}
    </div>
    <div class="card" style="margin-top:10px;">
      <div style="font-weight:700;margin-bottom:10px;">🕒 최근 기록</div>
      ${recentHtml}
      <button class="complete-btn" onclick="switchTab('notes')" style="margin-top:4px;background:var(--surface-alt);">📒 전체 기록 보러가기</button>
    </div>`;
}

function renderNotesList() {
  notesObjectUrls.forEach(url => URL.revokeObjectURL(url));
  notesObjectUrls = [];

  const query = (document.getElementById('notes-search').value || '').trim().toLowerCase();

  const allTags = [...new Set(notesCache.flatMap(n => n.tags || []))];
  const tagFilterEl = document.getElementById('notes-tag-filter');
  tagFilterEl.innerHTML = allTags.map(tag => `
    <button class="tab-btn${notesActiveTagFilter === tag ? ' active' : ''}" onclick="notesActiveTagFilter = notesActiveTagFilter === '${tag}' ? null : '${tag}'; renderNotesList()" style="flex:none;font-size:14px;padding:6px 10px;">#${tag}</button>
  `).join('');

  let filtered = notesCache;
  if (query) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      (n.tags || []).some(t => t.toLowerCase().includes(query))
    );
  }
  if (notesActiveTagFilter) {
    filtered = filtered.filter(n => (n.tags || []).includes(notesActiveTagFilter));
  }

  const listEl = document.getElementById('notes-list');
  if (!filtered.length) {
    listEl.innerHTML = `<div style="text-align:center;color:var(--muted);padding:24px 0;font-size:15px;">${notesCache.length ? '검색 결과가 없어요.' : '아직 기록이 없어요. 위에서 추가해보세요!'}</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(n => {
    const date = new Date(n.createdAt);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    const mediaList = getNoteMediaList(n);
    const mediaHtml = mediaList.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">${mediaList.map(m => {
      const url = URL.createObjectURL(m.blob);
      notesObjectUrls.push(url);
      const dlName = (type) => m.name || (type === 'image' ? 'photo.jpg' : 'video.mp4');
      if (m.type === 'image') return `
        <div style="position:relative;">
          <img src="${url}" onclick="openMediaLightbox('${url}','image','${(m.name || 'photo.jpg').replace(/'/g, "\\'")}')" style="max-width:180px;max-height:180px;border-radius:10px;cursor:zoom-in;display:block;">
          <button onclick="event.stopPropagation();shareMedia('${url}','${(m.name||'photo.jpg').replace(/'/g,"\\'")}');" style="position:absolute;bottom:4px;right:4px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:15px;cursor:pointer;">⬇️</button>
        </div>`;
      if (m.type === 'video') return `
        <div style="position:relative;">
          <video src="${url}" controls style="max-width:240px;border-radius:10px;display:block;"></video>
          <button onclick="shareMedia('${url}','${(m.name||'video.mp4').replace(/'/g,"\\'")}');" style="position:absolute;bottom:4px;right:4px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:15px;cursor:pointer;">⬇️</button>
        </div>`;
      if (m.type === 'audio') return `
        <div style="display:flex;align-items:center;gap:6px;">
          <audio src="${url}" controls style="height:36px;max-width:220px;"></audio>
          <button onclick="shareMedia('${url}','${(m.name||'voice.webm').replace(/'/g,"\\'")}');" style="width:26px;height:26px;border-radius:50%;background:var(--surface-alt);color:var(--ink);border:none;font-size:15px;cursor:pointer;flex-shrink:0;">⬇️</button>
        </div>`;
      return `<button onclick="shareMedia('${url}','${(m.name||'document').replace(/'/g,"\\'")}');" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;background:var(--surface-alt);border:1px solid var(--line-soft);color:var(--ink-soft);font-size:14px;cursor:pointer;">${DOC_EXT_ICON[fileExt(m.name)] || '📄'} ${m.name || '문서'} <span style="color:var(--muted);">(${formatBytes(m.blob.size)})</span></button>`;
    }).join('')}</div>` : '';
    return `
      <div class="card" style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="font-weight:700;font-size:17px;">${n.title || '(제목 없음)'}</div>
          <div style="font-size:14px;color:var(--muted);white-space:nowrap;">${dateStr}</div>
        </div>
        ${n.content ? `<div style="font-size:15px;color:var(--ink-soft);line-height:1.6;margin-top:6px;white-space:pre-wrap;">${n.content}</div>` : ''}
        ${mediaHtml}
        ${(n.tags || []).length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${n.tags.map(t => `<span style="font-size:13px;background:var(--surface-alt);padding:3px 8px;border-radius:8px;color:var(--muted);">#${t}</span>`).join('')}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="tab-btn" onclick="openNoteForm('${n.id}')" style="font-size:14px;">✏️ 수정</button>
          <button class="tab-btn" onclick="deleteNote('${n.id}')" style="font-size:14px;">🗑 삭제</button>
        </div>
      </div>`;
  }).join('');
}

// ── 미디어 라이트박스 (확대/축소/팬) ──
let lightboxScale = 1;
let lightboxPanX = 0;
let lightboxPanY = 0;
let lightboxPinchStartDist = 0;
let lightboxPinchStartScale = 1;
let lightboxDragStart = null;

function openMediaLightbox(url, type, name) {
  lightboxScale = 1; lightboxPanX = 0; lightboxPanY = 0;
  const box = document.getElementById('media-lightbox');
  const content = document.getElementById('media-lightbox-content');
  if (type === 'video') {
    content.innerHTML = `<video src="${url}" controls autoplay style="max-width:90vw;max-height:90vh;"></video>`;
  } else {
    content.innerHTML = `<img id="lightbox-img" src="${url}" style="max-width:90vw;max-height:90vh;object-fit:contain;touch-action:none;cursor:zoom-in;transform-origin:center center;">`;
    setupLightboxZoom();
  }
  const dlBtn = document.getElementById('media-lightbox-download');
  const dlName = name || (type === 'video' ? 'video.mp4' : 'photo.jpg');
  dlBtn.onclick = (e) => { e.stopPropagation(); shareMedia(url, dlName); };
  box.classList.remove('hidden');

  if (!isRestoringHistory) {
    history.pushState({ dashboard: currentDashboard, tab: currentTabName, modal: 'lightbox' }, '', location.href);
  }
}

function closeMediaLightboxUI() {
  document.getElementById('media-lightbox').classList.add('hidden');
  document.getElementById('media-lightbox-content').innerHTML = '';
}

function closeMediaLightbox() {
  if (history.state && history.state.modal === 'lightbox') {
    history.back();
  } else {
    closeMediaLightboxUI();
  }
}

function applyLightboxTransform() {
  const img = document.getElementById('lightbox-img');
  if (img) img.style.transform = `translate(${lightboxPanX}px, ${lightboxPanY}px) scale(${lightboxScale})`;
}

function setupLightboxZoom() {
  const img = document.getElementById('lightbox-img');
  if (!img) return;

  img.ondblclick = () => {
    lightboxScale = lightboxScale > 1 ? 1 : 2.5;
    lightboxPanX = 0; lightboxPanY = 0;
    applyLightboxTransform();
  };

  img.onwheel = (e) => {
    e.preventDefault();
    lightboxScale = Math.min(5, Math.max(1, lightboxScale - e.deltaY * 0.0015));
    applyLightboxTransform();
  };

  img.ontouchstart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lightboxPinchStartDist = Math.hypot(dx, dy);
      lightboxPinchStartScale = lightboxScale;
    } else if (e.touches.length === 1 && lightboxScale > 1) {
      lightboxDragStart = { x: e.touches[0].clientX - lightboxPanX, y: e.touches[0].clientY - lightboxPanY };
    }
  };
  img.ontouchmove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      lightboxScale = Math.min(5, Math.max(1, lightboxPinchStartScale * (dist / lightboxPinchStartDist)));
      applyLightboxTransform();
    } else if (e.touches.length === 1 && lightboxDragStart) {
      e.preventDefault();
      lightboxPanX = e.touches[0].clientX - lightboxDragStart.x;
      lightboxPanY = e.touches[0].clientY - lightboxDragStart.y;
      applyLightboxTransform();
    }
  };
  img.ontouchend = () => { lightboxDragStart = null; };

  // 데스크톱 드래그로 이동 (확대된 상태일 때)
  img.onmousedown = (e) => {
    if (lightboxScale <= 1) return;
    e.preventDefault();
    const start = { x: e.clientX - lightboxPanX, y: e.clientY - lightboxPanY };
    const onMove = (ev) => {
      lightboxPanX = ev.clientX - start.x;
      lightboxPanY = ev.clientY - start.y;
      applyLightboxTransform();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
}

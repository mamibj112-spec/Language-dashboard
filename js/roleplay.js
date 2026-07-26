// ── Roleplay: AI 롤플레잉 채팅, 번역, 피드백 ──

function openTopicVideo() {
  const q = currentTopic.ytQuery || (currentTopic.npc + ' English conversation');
  window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), '_blank');
}

let chatStarted = false;
let chatMsgs = [];
let loading = false;

// ── 음성 입력(마이크) ──
let recognition = null;
let micActive = false;

function getRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  if (recognition) return recognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    const input = document.getElementById('chat-input');
    if (input) input.value = text;
  };
  recognition.onend = () => {
    micActive = false;
    updateMicBtn();
    const input = document.getElementById('chat-input');
    if (input && input.value.trim()) sendMsg();
  };
  recognition.onerror = (e) => {
    micActive = false;
    updateMicBtn();
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      alert('마이크 권한이 필요해요. 브라우저 설정에서 마이크 접근을 허용해주세요.');
    }
  };
  return recognition;
}

function isNativeApp() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

function toggleMic() {
  if (isNativeApp()) { toggleMicNative(); return; }

  const r = getRecognition();
  if (!r) {
    alert('이 브라우저/앱에서는 음성 인식을 지원하지 않아요. PC나 모바일 Chrome 브라우저에서 이용해주세요.');
    return;
  }
  if (micActive) {
    r.stop();
    micActive = false;
  } else {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (_audio) { _audio.pause(); _audio = null; }
    const input = document.getElementById('chat-input');
    if (input) input.value = '';
    try { r.start(); micActive = true; } catch { micActive = false; }
  }
  updateMicBtn();
}

// ── 네이티브 앱(APK) 전용: Capacitor 음성인식 플러그인 사용 ──
async function toggleMicNative() {
  const SpeechRecognition = window.Capacitor.Plugins.SpeechRecognition;
  const input = document.getElementById('chat-input');

  if (micActive) {
    try { await SpeechRecognition.stop(); } catch {}
    micActive = false;
    updateMicBtn();
    return;
  }

  try {
    let perm = await SpeechRecognition.checkPermissions();
    if (perm.speechRecognition !== 'granted') {
      perm = await SpeechRecognition.requestPermissions();
    }
    if (perm.speechRecognition !== 'granted') {
      alert('마이크 권한이 필요해요. 폰 설정 > 앱 > 공부대시보드 > 권한에서 마이크를 허용해주세요.');
      return;
    }
  } catch (e) {
    alert('음성 인식을 사용할 수 없어요: ' + e.message);
    return;
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (_audio) { _audio.pause(); _audio = null; }
  if (input) input.value = '';
  micActive = true;
  updateMicBtn();

  SpeechRecognition.removeAllListeners();
  SpeechRecognition.addListener('partialResults', (data) => {
    if (input && data.matches && data.matches.length) input.value = data.matches[0];
  });

  try {
    const result = await SpeechRecognition.start({ language: 'en-US', partialResults: true, popup: false });
    if (input && result && result.matches && result.matches.length) input.value = result.matches[0];
  } catch (e) {
    // 사용자가 중간에 멈췄거나 인식 실패 - partialResults로 잡힌 텍스트를 그대로 사용
  }

  micActive = false;
  updateMicBtn();
  if (input && input.value.trim()) sendMsg();
}

function updateMicBtn() {
  const btn = document.getElementById('mic-btn');
  if (!btn) return;
  btn.textContent = micActive ? '🔴' : '🎤';
  btn.classList.toggle('recording', micActive);
}

// ── AI 답변 자동 읽기 ──
let autoSpeak = localStorage.getItem('autoSpeak') !== '0';

function toggleAutoSpeak() {
  autoSpeak = !autoSpeak;
  localStorage.setItem('autoSpeak', autoSpeak ? '1' : '0');
  updateAutoSpeakBtn();
}

function updateAutoSpeakBtn() {
  const btn = document.getElementById('autospeak-btn');
  if (!btn) return;
  btn.textContent = autoSpeak ? '🔊 자동 읽기 ON' : '🔇 자동 읽기 OFF';
  btn.classList.toggle('active', autoSpeak);
}

function autoSpeakLast() {
  if (!autoSpeak) return;
  const last = chatMsgs[chatMsgs.length - 1];
  if (!last || last.role !== 'assistant' || last.isFeedback) return;
  speak(parseReply(last.content).main);
}

async function startRole() {
  chatStarted = true;
  chatMsgs = [];
  document.getElementById('chat-start').classList.add('hidden');
  document.getElementById('chat-msgs').classList.remove('hidden');
  document.getElementById('chat-input-row').classList.remove('hidden');
  document.getElementById('feedback-btn').classList.remove('hidden');

  if (practicePattern && geminiApiKey) {
    loading = true;
    renderChat();
    try {
      const text = await callGemini({
        systemInstruction: { parts: [{ text: practicePattern.systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: 'Start the practice session now.' }] }]
      });
      chatMsgs.push({ role: 'assistant', content: text || "Let's practice! I'll set up a situation for you." });
    } catch(e) {
      chatMsgs.push({ role: 'assistant', content: `Let's practice "${practicePattern.pattern}"! I'll create a situation — ready?` });
    }
    loading = false;
  } else {
    chatMsgs = [{ role: 'assistant', content: currentTopic.starter }];
    practicePattern = null;
  }
  renderChat();
  autoSpeakLast();
}

function parseReply(content) {
  const lines = content.split('\n');
  const corrections = [];
  const mainLines = [];
  lines.forEach(l => {
    if (l.trim().startsWith('💡 Correction:') || l.trim().startsWith('💡Correction:')) {
      corrections.push(l.trim());
    } else {
      mainLines.push(l);
    }
  });
  return { main: mainLines.join('\n').trim(), corrections };
}

// ── 교정 내용을 복습 노트에 누적 저장 ──
function logCorrections(content) {
  const { corrections } = parseReply(content);
  if (!corrections.length) return;
  const log = JSON.parse(localStorage.getItem('correctionLog') || '[]');
  corrections.forEach(c => {
    const m = c.match(/Correction:\s*"([^"]+)"\s*→\s*"([^"]+)"/);
    if (!m) return;
    log.unshift({ wrong: m[1], correct: m[2], topic: currentTopic.npc, emoji: currentTopic.emoji, date: new Date().toISOString() });
  });
  localStorage.setItem('correctionLog', JSON.stringify(log));
}

function renderReviewList() {
  const el = document.getElementById('review-list');
  const log = JSON.parse(localStorage.getItem('correctionLog') || '[]');
  const clearBtn = document.getElementById('review-clear-btn');
  if (clearBtn) clearBtn.classList.toggle('hidden', log.length === 0);
  if (!log.length) {
    el.innerHTML = `<div style="font-size:13px;color:#94a3b8;text-align:center;padding:20px 0;">아직 저장된 교정 내용이 없어요.<br>롤플레잉 하다가 AI가 실수를 짚어주면 여기 자동으로 쌓여요.</div>`;
    return;
  }
  el.innerHTML = log.map(item => `
    <div class="phrase-item" style="cursor:default;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${item.emoji || ''} ${item.topic || ''} · ${new Date(item.date).toLocaleDateString('ko-KR')}</div>
      <div style="color:#f87171;font-size:13px;text-decoration:line-through;margin-bottom:4px;">${item.wrong}</div>
      <div class="phrase-row">
        <div class="phrase-en" style="color:#4ade80;">${item.correct}</div>
        <button class="spk-btn" onclick="speak('${item.correct.replace(/'/g, "\\'")}')">🔊</button>
      </div>
    </div>
  `).join('');
}

function clearReviewLog() {
  if (!confirm('저장된 교정 내용을 전부 삭제할까요?')) return;
  localStorage.removeItem('correctionLog');
  renderReviewList();
}

function renderChat() {
  const el = document.getElementById('chat-msgs');
  el.innerHTML = '';
  chatMsgs.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'msg';
    if (m.role === 'assistant') {
      if (m.isFeedback) {
        div.innerHTML = `
          <div class="msg-label">📊 대화 피드백</div>
          <div class="feedback-card">${m.content}</div>
        `;
      } else {
        const parsed = parseReply(m.content);
        const mainText = parsed.main;
        const corrHtml = parsed.corrections.map(c => `<div class="correction-bubble">${c}</div>`).join('');
        div.innerHTML = `
          <div class="msg-label">
            ${currentTopic.emoji} ${currentTopic.npc}
            <button class="spk-btn" style="font-size:11px;padding:1px 6px" onclick="speak(\`${mainText.replace(/`/g,'\\`')}\`)">🔊</button>
          </div>
          <div class="msg-row">
            <div class="bubble" id="bubble-${i}" onclick="toggleTranslate(${i}, \`${mainText.replace(/`/g,'\\`')}\`)">
              ${mainText}
              ${m.ko ? `<div class="bubble-ko">${m.ko}</div>` : ''}
            </div>
          </div>
          <div class="msg-translate-hint">${m.ko ? '👆 탭하면 영어로' : '👆 탭하면 한국어 번역'}</div>
          ${corrHtml}
        `;
      }
    } else {
      div.innerHTML = `
        <div class="msg-row user">
          <div class="bubble user">${m.content}</div>
        </div>
      `;
    }
    el.appendChild(div);
  });
  if (loading) {
    const dot = document.createElement('div');
    dot.className = 'typing';
    dot.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    el.appendChild(dot);
  }
  el.scrollTop = el.scrollHeight;
}

async function toggleTranslate(idx, text) {
  const msg = chatMsgs[idx];
  if (msg.ko) { delete msg.ko; renderChat(); return; }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    msg.ko = data[0].map(x => x[0]).join('');
  } catch { msg.ko = '번역 실패 😅'; }
  renderChat();
}

async function sendMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || loading) return;
  input.value = '';
  chatMsgs.push({ role: 'user', content: text });
  loading = true;
  renderChat();

  if (!geminiApiKey) {
    chatMsgs.push({ role: 'assistant', content: "⚙️ API 키가 없어요! 오른쪽 상단 ⚙️ 버튼을 눌러 Gemini API 키를 입력해 주세요." });
    loading = false;
    renderChat();
    return;
  }

  try {
    const contents = chatMsgs
      .filter(m => !m.isFeedback)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: parseReply(m.content).main }]
      }));

    const reply = await callGemini({
      systemInstruction: { parts: [{ text: practicePattern ? practicePattern.systemPrompt : currentTopic.systemPrompt }] },
      contents
    });
    chatMsgs.push({ role: 'assistant', content: reply || "Pardon? Could you say that again?" });
    if (reply) logCorrections(reply);
  } catch (err) {
    chatMsgs.push({ role: 'assistant', content: "❌ " + err.message });
  }
  loading = false;
  renderChat();
  autoSpeakLast();
}

// ── Feedback ──
async function requestFeedback() {
  if (!chatStarted || chatMsgs.length < 3 || loading) return;
  loading = true;
  renderChat();

  const history = chatMsgs
    .filter(m => !m.isFeedback)
    .map(m => `${m.role === 'user' ? 'Student' : currentTopic.npc}: ${parseReply(m.content).main}`)
    .join('\n');

  const prompt = `다음 영어 대화를 분석해서 한국어로 피드백을 줘:\n\n${history}\n\n아래 형식으로 작성:\n✅ 잘한 점\n- (2~3가지)\n\n⚠️ 고칠 표현\n- 틀린 표현 → 올바른 표현 (이유 한 줄)\n\n💬 추천 표현\n- 이 상황에서 쓰면 좋은 표현 1~2개\n\n짧고 친절하게 써줘.`;

  try {
    const feedback = await geminiText(prompt, 'You are an English conversation coach. Give feedback in Korean only.');
    chatMsgs.push({ role: 'assistant', content: feedback || '피드백을 가져올 수 없어요.', isFeedback: true });
  } catch (err) {
    chatMsgs.push({ role: 'assistant', content: '피드백 오류: ' + err.message, isFeedback: true });
  }
  loading = false;
  renderChat();
}

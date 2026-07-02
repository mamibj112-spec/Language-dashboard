// ── Roleplay: AI 롤플레잉 채팅, 번역, 피드백 ──

let chatStarted = false;
let chatMsgs = [];
let loading = false;

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
  } catch (err) {
    chatMsgs.push({ role: 'assistant', content: "❌ " + err.message });
  }
  loading = false;
  renderChat();
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

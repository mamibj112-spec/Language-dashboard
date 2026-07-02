// ── Gemini API 공용 모듈 ──
// 모든 AI 호출은 이 파일의 callGemini/geminiText/geminiJSON을 통해서만 이루어진다.
const GEMINI_MODEL = 'gemini-2.5-flash';
const NO_KEY_MSG = '⚙️ API 키가 없어요! 오른쪽 상단 ⚙️ 버튼을 눌러 Gemini API 키를 입력해 주세요.';

let geminiApiKey = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) ? GEMINI_API_KEY : (localStorage.getItem('geminiApiKey') || '');

// body: { contents, systemInstruction? } → 응답 텍스트 반환. 실패 시 친절한 한국어 메시지로 throw.
async function callGemini(body) {
  if (!geminiApiKey) throw new Error(NO_KEY_MSG);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const errText = await res.text();

    if (res.status === 429) {
      const isDailyLimit = errText.includes('PerDay');
      // 분당 한도(순간 몰림)면 15초 뒤 1회 자동 재시도
      if (!isDailyLimit && attempt === 0) {
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }
      throw new Error(isDailyLimit
        ? '오늘 무료 AI 사용량을 모두 썼어요 😅 한국시간 오후 4~5시쯤 다시 채워져요. 조금만 기다려주세요!'
        : 'AI 요청이 몰리고 있어요. 잠시 후 다시 시도해주세요.');
    }

    let msg = 'AI 호출 오류 (HTTP ' + res.status + ')';
    try { msg = JSON.parse(errText).error?.message || msg; } catch {}
    throw new Error(msg);
  }
}

// 단일 프롬프트 → 텍스트 답변
function geminiText(prompt, systemPrompt) {
  const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  return callGemini(body);
}

// ```json 펜스 제거 (AI가 코드블록으로 감싸서 답할 때 대비)
function stripJsonFences(text) {
  return (text || '').replace(/```json|```/g, '').trim();
}

// 단일 프롬프트 → JSON 파싱된 답변
async function geminiJSON(prompt) {
  const text = await geminiText(prompt);
  return JSON.parse(stripJsonFences(text));
}

/**
 * Cloudflare Worker for Gemini API (Proxy) + YouTube 자막(스크립트) 가져오기
 * 프론트엔드에서 받은 요청에 GEMINI_API_KEY를 추가하여 Google 서버로 안전하게 전달하는 역할과,
 * 브라우저에서 CORS로 막혀 직접 못 가져오는 유튜브 자막을 서버에서 대신 가져와 전달하는 역할을 합니다.
 */

// 유튜브 자막 XML(<text start="..">내용</text>) → 순수 텍스트로 변환
function decodeEntities(str) {
  return str
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\n/g, " ");
}

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// 영상 설명(shortDescription)과, 있으면 자막까지 가져온다.
// 유튜브 자막(timedtext) API는 워커 같은 서버(데이터센터 IP)에서는 빈 응답만 주는 경우가 많아
// 자막은 "되면 좋고 안 되면 마는" 보너스로 취급하고, 항상 존재하는 영상 설명을 기본 컨텍스트로 삼는다.
async function fetchLessonContext(videoId) {
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=ko`, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  if (!watchRes.ok) throw new Error(`영상 페이지를 불러오지 못했습니다 (status ${watchRes.status})`);
  const html = await watchRes.text();

  let description = "";
  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (descMatch) {
    try { description = JSON.parse('"' + descMatch[1] + '"'); } catch (e) { description = descMatch[1]; }
  }
  if (!description) {
    throw new Error(`설명 추출 실패 DEBUG len=${html.length} status=${watchRes.status} head=${html.slice(0, 150).replace(/\s+/g, ' ')}`);
  }

  let transcript = "";
  try {
    const capM = html.match(/"captionTracks":(\[.*?\])/);
    if (capM) {
      const tracks = JSON.parse(capM[1]);
      const track = tracks.find(t => t.languageCode === "ko") || tracks[0];
      if (track) {
        const baseUrl = track.baseUrl.replace(/\\u0026/g, "&");
        const capRes = await fetch(baseUrl, { headers: { "User-Agent": BROWSER_UA } });
        if (capRes.ok) {
          const xml = await capRes.text();
          const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(mm => decodeEntities(mm[1]).trim()).filter(Boolean);
          transcript = lines.join(" ");
        }
      }
    }
  } catch (e) {
    // 자막은 선택 사항이라 실패해도 무시하고 설명만으로 진행
  }

  if (!description && !transcript) throw new Error("이 영상의 정보를 찾지 못했습니다");
  return { description, transcript };
}

export default {
  async fetch(request, env) {
    const ALLOWED_ORIGIN = "https://mamibj112-spec.github.io";
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // 허용되지 않은 Origin 차단
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    // 1. CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 유튜브 자막 가져오기 엔드포인트: GET /transcript?v=VIDEO_ID
    if (url.pathname === "/transcript") {
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      }
      const videoId = url.searchParams.get("v");
      if (!videoId) {
        return new Response(JSON.stringify({ error: "v 파라미터(영상 ID)가 필요합니다" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      try {
        const { description, transcript } = await fetchLessonContext(videoId);
        return new Response(JSON.stringify({ videoId, description, transcript }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // 보안 검사: 그 외 경로는 POST 요청(Gemini 프록시)이 아니면 거부
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      // 2. 환경변수(Secret)에서 Gemini API 키 가져오기
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API Key (GEMINI_API_KEY) was not provided in Cloudflare env variables" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // 3. 사용자가 프론트엔드에서 보낸 body 정보를 읽습니다.
      const bodyText = await request.text();
      let reqJSON;
      try {
        reqJSON = JSON.parse(bodyText);
      } catch (e) {
         return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Gemini 모델 선택 (프론트에서 지정하거나, 기본값으로 2.5-flash 사용)
      const model = reqJSON.model || "gemini-2.5-flash";
      delete reqJSON.model; // Gemini API의 body에 맞추기 위해 불필요한 필드 제거

      // 4. 구글 서버(Gemini)로 실제 요청 전송 (API Key를 봇 몰래 여기서 붙여줌!)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqJSON)
      });

      // 5. 구글 서버로부터 받은 응답을 프론트엔드에 그대로 다시 전달
      const responseData = await geminiResponse.text();

      return new Response(responseData, {
        status: geminiResponse.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  },
};

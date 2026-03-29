/**
 * Cloudflare Worker for Gemini API (Proxy)
 * 프론트엔드에서 받은 요청에 GEMINI_API_KEY를 추가하여 Google 서버로 안전하게 전달하는 역할만 수행합니다.
 */
export default {
  async fetch(request, env) {
    // 1. CORS(Cross-Origin Resource Sharing) 미리 허용 (preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*", // 보안을 높이려면 "*" 대신 GitHub Pages URL 지정
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 보안 검사: POST 요청이 아니면 거부
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      // 2. 환경변수(Secret)에서 Gemini API 키 가져오기
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API Key (GEMINI_API_KEY) was not provided in Cloudflare env variables" }),
          { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
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
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }

      // Gemini 모델 선택 (프론트에서 지정하거나, 기본값으로 1.5-flash 사용)
      const model = reqJSON.model || "gemini-1.5-flash";
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
          "Access-Control-Allow-Origin": "*", // 프론트엔드(GitHub Pages)에서 읽을 수 있도록 허용
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }
  },
};

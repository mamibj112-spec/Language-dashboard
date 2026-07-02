// ── Data: 주제(TOPICS) & 패턴(PATTERNS) ──
const TOPICS = [
  {
    emoji: "☕", npc: "Barista",
    scene: "뉴욕 카페에 들어갔어요. 바리스타가 미소로 맞이해요.",
    starter: "Hi there! Welcome! What can I get for you today? 😊",
    systemPrompt: "You are a friendly Barista at a cozy New York café having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the conversation going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "Can I have a coffee, please?", ko: "커피 한 잔 주세요." },
      { en: "One latte, please.", ko: "라떼 하나 주세요." },
      { en: "Can I get that iced?", ko: "아이스로 해주세요." },
      { en: "For here or to go?", ko: "여기서 드실 건가요, 가져가실 건가요?" },
      { en: "How much is it?", ko: "얼마예요?" },
      { en: "Can I have the receipt?", ko: "영수증 주세요." },
      { en: "Can I get a large size?", ko: "큰 사이즈로 주세요." },
      { en: "Do you have oat milk?", ko: "귀리 우유 있나요?" },
      { en: "Can I get a refill?", ko: "리필 해주실 수 있나요?" },
      { en: "Is there Wi-Fi here?", ko: "여기 와이파이 있나요?" },
    ],
    vocab: [
      { word: "order", ko: "주문하다", ex: [{ en: "I'd like to order a latte.", ko: "라떼를 주문하고 싶어요." }, { en: "Can I order something to go?", ko: "테이크아웃으로 주문해도 될까요?" }] },
      { word: "iced", ko: "아이스, 차가운", ex: [{ en: "Can I get that iced?", ko: "아이스로 해주실 수 있나요?" }, { en: "I prefer iced coffee in summer.", ko: "여름엔 아이스 커피가 좋아요." }] },
      { word: "receipt", ko: "영수증", ex: [{ en: "Can I have the receipt?", ko: "영수증 주세요." }, { en: "I need a receipt for my records.", ko: "기록용으로 영수증이 필요해요." }] },
      { word: "size", ko: "사이즈, 크기", ex: [{ en: "What size would you like?", ko: "사이즈는 어떻게 해드릴까요?" }, { en: "I'll take the large size.", ko: "큰 사이즈로 할게요." }] },
      { word: "takeout", ko: "테이크아웃, 포장", ex: [{ en: "Is this for here or takeout?", ko: "여기서 드실 건가요, 포장인가요?" }, { en: "I'll do takeout, please.", ko: "포장으로 할게요." }] },
      { word: "barista", ko: "바리스타", ex: [{ en: "The barista made a beautiful latte art.", ko: "바리스타가 아름다운 라떼 아트를 만들었어요." }, { en: "She is a professional barista.", ko: "그녀는 전문 바리스타예요." }] },
      { word: "decaf", ko: "디카페인", ex: [{ en: "I'll have a decaf latte, please.", ko: "디카페인 라떼로 주세요." }, { en: "Do you have decaf coffee?", ko: "디카페인 커피 있나요?" }] },
      { word: "whipped cream", ko: "휘핑크림", ex: [{ en: "Can I get extra whipped cream?", ko: "휘핑크림 더 넣어주세요." }, { en: "I'd like it with whipped cream on top.", ko: "위에 휘핑크림 올려주세요." }] },
      { word: "syrup", ko: "시럽", ex: [{ en: "Can I add vanilla syrup?", ko: "바닐라 시럽 추가해도 될까요?" }, { en: "One pump of syrup, please.", ko: "시럽 한 번만 넣어주세요." }] },
      { word: "espresso", ko: "에스프레소", ex: [{ en: "I'd like a double espresso.", ko: "더블 에스프레소 주세요." }, { en: "Espresso is very strong.", ko: "에스프레소는 매우 강해요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Hi there! Welcome! What can I get for you today?", ko:"어서오세요! 오늘 뭘 드릴까요?" },
      { role:'user', en:"Can I have a large iced latte, please?", ko:"아이스 라떼 큰 사이즈로 주세요." },
      { role:'npc', en:"Sure! Would you like any syrup with that?", ko:"알겠어요! 시럽 넣어드릴까요?" },
      { role:'user', en:"Yes, can I add vanilla syrup?", ko:"네, 바닐라 시럽 추가해 주세요." },
      { role:'npc', en:"That'll be $6.50. For here or to go?", ko:"6달러 50센트예요. 여기서 드실 건가요, 가져가실 건가요?" },
      { role:'user', en:"To go, please. Can I have the receipt?", ko:"가져갈게요. 영수증도 주세요." },
      { role:'npc', en:"Here's your receipt! Your drink will be ready shortly.", ko:"영수증 여기요! 음료는 곧 나올 거예요." },
      { role:'user', en:"Thank you! Is there Wi-Fi here?", ko:"감사해요! 와이파이 있나요?" },
      { role:'npc', en:"Yes! The password is on the board. Enjoy your drink!", ko:"네! 비밀번호는 저기 칠판에 있어요. 즐거운 시간 보내세요!" },
    ],
  },
  {
    emoji: "✈️", npc: "Airport Staff",
    scene: "뉴욕 공항에 도착했어요. 체크인 카운터 직원이 기다리고 있어요.",
    starter: "Good morning! Welcome to JFK Airport. May I see your passport and ticket, please? 😊",
    systemPrompt: "You are a friendly airport check-in staff at JFK Airport having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the interaction going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "Where is the check-in counter?", ko: "체크인 카운터가 어디에 있나요?" },
      { en: "I'd like a window seat, please.", ko: "창가 자리로 주세요." },
      { en: "How much is the baggage fee?", ko: "수하물 요금이 얼마예요?" },
      { en: "Is my flight on time?", ko: "제 비행기가 정시에 출발하나요?" },
      { en: "Where is the boarding gate?", ko: "탑승 게이트가 어디예요?" },
      { en: "Can I have an aisle seat?", ko: "통로 쪽 자리로 주세요." },
    ],
    vocab: [
      { word: "boarding pass", ko: "탑승권", ex: [{ en: "May I see your boarding pass?", ko: "탑승권을 보여주세요." }, { en: "I printed my boarding pass at home.", ko: "집에서 탑승권을 출력했어요." }] },
      { word: "baggage", ko: "수하물, 짐", ex: [{ en: "How many bags are you checking?", ko: "맡기실 가방이 몇 개예요?" }, { en: "My baggage is overweight.", ko: "제 짐이 무게 초과예요." }] },
      { word: "departure", ko: "출발", ex: [{ en: "What is the departure time?", ko: "출발 시간이 언제예요?" }, { en: "The departure gate has changed.", ko: "출발 게이트가 바뀌었어요." }] },
      { word: "passport", ko: "여권", ex: [{ en: "Can I see your passport?", ko: "여권을 보여주실 수 있나요?" }, { en: "I left my passport at the hotel.", ko: "여권을 호텔에 두고 왔어요." }] },
      { word: "customs", ko: "세관", ex: [{ en: "Do I need to go through customs?", ko: "세관을 통과해야 하나요?" }, { en: "Please fill out the customs form.", ko: "세관 신고서를 작성해 주세요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Good morning! May I see your passport and ticket, please?", ko:"안녕하세요! 여권과 티켓 보여주시겠어요?" },
      { role:'user', en:"Sure, here you go. Is my flight on time?", ko:"네, 여기 있어요. 제 비행기가 정시에 출발하나요?" },
      { role:'npc', en:"Yes, it's departing on schedule. How many bags are you checking?", ko:"네, 정시 출발이에요. 맡기실 가방이 몇 개예요?" },
      { role:'user', en:"Just one. How much is the baggage fee?", ko:"하나요. 수하물 요금이 얼마예요?" },
      { role:'npc', en:"It's included in your ticket. Window or aisle seat?", ko:"티켓에 포함되어 있어요. 창가 자리로 드릴까요, 통로 쪽으로 드릴까요?" },
      { role:'user', en:"A window seat, please. Where is the boarding gate?", ko:"창가 자리로 주세요. 탑승 게이트가 어디예요?" },
      { role:'npc', en:"Gate 24, down the hall to the right. Have a great flight!", ko:"24번 게이트예요, 복도 끝 오른쪽이에요. 좋은 여행 되세요!" },
    ],
  },
  {
    emoji: "🍽️", npc: "Waiter",
    scene: "뉴욕 레스토랑에 들어갔어요. 웨이터가 자리로 안내해요.",
    starter: "Good evening! Welcome! Do you have a reservation, or will this be a walk-in? 🍽️",
    systemPrompt: "You are a friendly waiter at a nice New York restaurant having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the conversation going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "Can I see the menu, please?", ko: "메뉴판 주세요." },
      { en: "I'd like to order now.", ko: "주문할게요." },
      { en: "What do you recommend?", ko: "추천 메뉴가 뭐예요?" },
      { en: "Can I have the bill, please?", ko: "계산서 주세요." },
      { en: "Is this dish spicy?", ko: "이 요리 매워요?" },
      { en: "I'm allergic to nuts.", ko: "저 견과류 알레르기 있어요." },
    ],
    vocab: [
      { word: "reservation", ko: "예약", ex: [{ en: "I have a reservation for two.", ko: "두 명으로 예약했어요." }, { en: "Can I make a reservation?", ko: "예약할 수 있나요?" }] },
      { word: "recommend", ko: "추천하다", ex: [{ en: "What would you recommend?", ko: "뭘 추천해 주시겠어요?" }, { en: "I recommend the salmon.", ko: "연어를 추천해요." }] },
      { word: "appetizer", ko: "전채요리, 애피타이저", ex: [{ en: "I'll start with a salad as an appetizer.", ko: "애피타이저로 샐러드 할게요." }, { en: "What appetizers do you have?", ko: "애피타이저는 뭐가 있어요?" }] },
      { word: "allergic", ko: "알레르기가 있는", ex: [{ en: "I'm allergic to shellfish.", ko: "저 조개류 알레르기 있어요." }, { en: "Are there any allergens in this dish?", ko: "이 요리에 알레르기 유발 성분이 있나요?" }] },
      { word: "tip", ko: "팁, 봉사료", ex: [{ en: "Is the tip included?", ko: "팁이 포함되어 있나요?" }, { en: "I'd like to leave a tip.", ko: "팁을 남기고 싶어요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Good evening! Do you have a reservation?", ko:"안녕하세요! 예약하셨나요?" },
      { role:'user', en:"Yes, a reservation for two.", ko:"네, 두 명으로 예약했어요." },
      { role:'npc', en:"Right this way! Here's your menu.", ko:"이쪽으로 오세요! 메뉴판 여기 있어요." },
      { role:'user', en:"What do you recommend?", ko:"추천 메뉴가 뭐예요?" },
      { role:'npc', en:"Our salmon is very popular tonight! Not spicy at all.", ko:"오늘 연어가 인기 많아요! 전혀 안 매워요." },
      { role:'user', en:"I'll have that. I'm allergic to nuts, just so you know.", ko:"그걸로 할게요. 참고로 견과류 알레르기 있어요." },
      { role:'npc', en:"Got it! I'll let the kitchen know. Enjoy your meal!", ko:"알겠어요! 주방에 알려드릴게요. 맛있게 드세요!" },
      { role:'user', en:"Can I have the bill, please?", ko:"계산서 주세요." },
      { role:'npc', en:"Of course! Here you are. Was everything alright?", ko:"물론이죠! 여기 있어요. 다 맛있게 드셨나요?" },
    ],
  },
  {
    emoji: "🛍️", npc: "Shop Assistant",
    scene: "뉴욕 쇼핑몰에 들어갔어요. 직원이 도움을 제안해요.",
    starter: "Hi there! Welcome to our store. Are you looking for anything in particular today? 🛍️",
    systemPrompt: "You are a helpful shop assistant in a New York clothing store having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the interaction going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "I'm just browsing, thanks.", ko: "그냥 구경하는 거예요, 감사합니다." },
      { en: "Do you have this in a larger size?", ko: "이거 더 큰 사이즈 있나요?" },
      { en: "Can I try this on?", ko: "이거 입어봐도 될까요?" },
      { en: "Where are the fitting rooms?", ko: "탈의실이 어디예요?" },
      { en: "Do you have this in another color?", ko: "다른 색상도 있나요?" },
      { en: "Can I get a refund?", ko: "환불 받을 수 있나요?" },
    ],
    vocab: [
      { word: "discount", ko: "할인", ex: [{ en: "Is there a discount on this item?", ko: "이 상품 할인 되나요?" }, { en: "We have a 20% discount today.", ko: "오늘 20% 할인해요." }] },
      { word: "fitting room", ko: "탈의실", ex: [{ en: "The fitting room is at the back.", ko: "탈의실은 뒤쪽에 있어요." }, { en: "Can I use the fitting room?", ko: "탈의실 써도 될까요?" }] },
      { word: "exchange", ko: "교환", ex: [{ en: "Can I exchange this for a different size?", ko: "다른 사이즈로 교환할 수 있나요?" }, { en: "I'd like to exchange this item.", ko: "이 상품을 교환하고 싶어요." }] },
      { word: "refund", ko: "환불", ex: [{ en: "Can I get a refund?", ko: "환불 받을 수 있나요?" }, { en: "I'd like a full refund.", ko: "전액 환불 원해요." }] },
      { word: "browse", ko: "둘러보다", ex: [{ en: "I'm just browsing.", ko: "그냥 둘러보는 거예요." }, { en: "Feel free to browse around.", ko: "편하게 둘러보세요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Hi! Welcome. Are you looking for anything in particular?", ko:"어서오세요! 찾으시는 거 있으세요?" },
      { role:'user', en:"I'm just browsing, thanks.", ko:"그냥 구경하는 거예요, 감사합니다." },
      { role:'npc', en:"Of course! Let me know if you need any help.", ko:"알겠어요! 도움 필요하시면 말씀해 주세요." },
      { role:'user', en:"Actually, do you have this in a larger size?", ko:"사실 이거 더 큰 사이즈 있나요?" },
      { role:'npc', en:"Let me check — yes, we have it in Large and XL!", ko:"확인해 볼게요 — 네, L이랑 XL 있어요!" },
      { role:'user', en:"Can I try this on? Where are the fitting rooms?", ko:"입어봐도 될까요? 탈의실이 어디예요?" },
      { role:'npc', en:"Sure! The fitting rooms are at the back.", ko:"물론이죠! 탈의실은 뒤쪽에 있어요." },
      { role:'user', en:"Do you have this in another color?", ko:"다른 색상도 있나요?" },
      { role:'npc', en:"Yes, we also have it in blue and black!", ko:"네, 파란색이랑 검정색도 있어요!" },
    ],
  },
  {
    emoji: "🏨", npc: "Receptionist",
    scene: "뉴욕 호텔에 도착했어요. 프런트 직원이 웰컴 인사를 해요.",
    starter: "Good evening! Welcome to The Grand Hotel. Do you have a reservation with us? 🏨",
    systemPrompt: "You are a friendly hotel receptionist at a New York hotel having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the interaction going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "I have a reservation under my name.", ko: "제 이름으로 예약했어요." },
      { en: "What time is check-out?", ko: "체크아웃이 몇 시예요?" },
      { en: "Can I have a wake-up call at 7?", ko: "7시에 모닝콜 부탁드려요." },
      { en: "Is breakfast included?", ko: "조식이 포함되어 있나요?" },
      { en: "The Wi-Fi isn't working in my room.", ko: "방에서 와이파이가 안 돼요." },
      { en: "Can I have an extra pillow?", ko: "베개 하나 더 주실 수 있나요?" },
    ],
    vocab: [
      { word: "check-in", ko: "체크인", ex: [{ en: "I'd like to check in.", ko: "체크인 하고 싶어요." }, { en: "Check-in time is at 3 PM.", ko: "체크인 시간은 오후 3시예요." }] },
      { word: "amenities", ko: "편의시설, 부대시설", ex: [{ en: "What amenities does the hotel have?", ko: "호텔에 어떤 편의시설이 있나요?" }, { en: "The amenities include a gym and pool.", ko: "편의시설로는 헬스장과 수영장이 있어요." }] },
      { word: "concierge", ko: "컨시어지 (안내 데스크)", ex: [{ en: "Please ask the concierge for help.", ko: "컨시어지에게 도움을 요청하세요." }, { en: "The concierge can book a taxi for you.", ko: "컨시어지가 택시를 예약해 줄 수 있어요." }] },
      { word: "housekeeping", ko: "객실 청소 서비스", ex: [{ en: "Can housekeeping clean my room?", ko: "객실 청소 해주실 수 있나요?" }, { en: "Housekeeping comes at 10 AM.", ko: "객실 청소는 오전 10시에 해요." }] },
      { word: "checkout", ko: "체크아웃", ex: [{ en: "What time is checkout?", ko: "체크아웃이 몇 시예요?" }, { en: "Late checkout is available for an extra fee.", ko: "추가 요금으로 레이트 체크아웃이 가능해요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Good evening! Welcome to The Grand Hotel. Do you have a reservation?", ko:"안녕하세요! 그랜드 호텔에 오신 것을 환영해요. 예약하셨나요?" },
      { role:'user', en:"Yes, a reservation under the name Kim.", ko:"네, 김씨 이름으로 예약했어요." },
      { role:'npc', en:"Found it! Here's your room key. You're in room 512.", ko:"찾았어요! 방 키 여기 있어요. 512호예요." },
      { role:'user', en:"Thank you. Is breakfast included?", ko:"감사해요. 조식이 포함되어 있나요?" },
      { role:'npc', en:"Yes! Breakfast is served from 7 to 10 AM in the dining room.", ko:"네! 조식은 오전 7시부터 10시까지 식당에서 제공돼요." },
      { role:'user', en:"Can I have a wake-up call at 7?", ko:"7시에 모닝콜 부탁드려요." },
      { role:'npc', en:"Of course! I'll set that up for you right away.", ko:"물론이죠! 바로 설정해 드릴게요." },
      { role:'user', en:"The Wi-Fi isn't working in my room.", ko:"방에서 와이파이가 안 돼요." },
      { role:'npc', en:"I'm sorry! I'll send someone to fix it immediately.", ko:"죄송해요! 바로 수리 요원을 보내드릴게요." },
    ],
  },
  {
    emoji: "💊", npc: "Pharmacist",
    scene: "뉴욕 약국에 들어갔어요. 약사가 도움을 제공해요.",
    starter: "Hello! How can I help you today? Are you looking for something specific? 💊",
    systemPrompt: "You are a friendly pharmacist at a New York pharmacy having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to help them. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "I have a headache.", ko: "두통이 있어요." },
      { en: "Do you have something for a cold?", ko: "감기약 있나요?" },
      { en: "I need a pain reliever.", ko: "진통제가 필요해요." },
      { en: "Is this available without a prescription?", ko: "처방전 없이 살 수 있나요?" },
      { en: "How many times a day should I take this?", ko: "하루에 몇 번 먹어야 해요?" },
      { en: "I have a fever.", ko: "열이 있어요." },
    ],
    vocab: [
      { word: "prescription", ko: "처방전", ex: [{ en: "Do you have a prescription?", ko: "처방전 가지고 계세요?" }, { en: "This medicine requires a prescription.", ko: "이 약은 처방전이 필요해요." }] },
      { word: "dosage", ko: "복용량", ex: [{ en: "What is the recommended dosage?", ko: "권장 복용량이 어떻게 되나요?" }, { en: "Take the dosage twice a day.", ko: "하루에 두 번 복용하세요." }] },
      { word: "side effects", ko: "부작용", ex: [{ en: "Are there any side effects?", ko: "부작용이 있나요?" }, { en: "Drowsiness is a common side effect.", ko: "졸음이 흔한 부작용이에요." }] },
      { word: "allergy", ko: "알레르기", ex: [{ en: "I have a drug allergy.", ko: "저는 약물 알레르기가 있어요." }, { en: "Are you allergic to anything?", ko: "알레르기 있는 게 있나요?" }] },
      { word: "pharmacist", ko: "약사", ex: [{ en: "Ask the pharmacist for advice.", ko: "약사에게 조언을 구하세요." }, { en: "The pharmacist recommended this.", ko: "약사가 이걸 추천했어요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Hello! How can I help you today?", ko:"안녕하세요! 오늘 무엇을 도와드릴까요?" },
      { role:'user', en:"I have a headache. I need a pain reliever.", ko:"두통이 있어요. 진통제가 필요해요." },
      { role:'npc', en:"Sure! Do you have any drug allergies?", ko:"알겠어요! 약물 알레르기 있으세요?" },
      { role:'user', en:"No allergies. Is this available without a prescription?", ko:"없어요. 처방전 없이 살 수 있나요?" },
      { role:'npc', en:"Yes, this is over-the-counter. Take it twice a day with food.", ko:"네, 처방전 없이 살 수 있어요. 하루 두 번 식후에 드세요." },
      { role:'user', en:"Any side effects I should know about?", ko:"알아야 할 부작용이 있나요?" },
      { role:'npc', en:"Drowsiness is common. Avoid driving after taking it.", ko:"졸음이 흔해요. 복용 후 운전은 피하세요." },
      { role:'user', en:"Got it. Do you have something for a cold as well?", ko:"알겠어요. 감기약도 있나요?" },
      { role:'npc', en:"Of course! Follow me — I'll show you our options.", ko:"물론이죠! 이쪽으로 오세요 — 보여드릴게요." },
    ],
  },
  {
    emoji: "🗺️", npc: "Local",
    scene: "뉴욕 거리에서 길을 잃었어요. 지나가는 사람에게 물어봐요.",
    starter: "Oh, are you lost? Where are you trying to go? I can try to help! 🗺️",
    systemPrompt: "You are a friendly New York local helping a tourist find their way, having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the conversation going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "Excuse me, how do I get to Times Square?", ko: "실례합니다, 타임스퀘어에 어떻게 가나요?" },
      { en: "Is it far from here?", ko: "여기서 멀어요?" },
      { en: "Can I walk there?", ko: "걸어갈 수 있나요?" },
      { en: "Which subway line should I take?", ko: "어느 지하철 노선을 타야 해요?" },
      { en: "Turn left at the corner.", ko: "모퉁이에서 왼쪽으로 도세요." },
      { en: "How long does it take?", ko: "얼마나 걸려요?" },
    ],
    vocab: [
      { word: "directions", ko: "길 안내", ex: [{ en: "Can you give me directions?", ko: "길을 알려주실 수 있나요?" }, { en: "Follow these directions to get there.", ko: "이 길 안내를 따라가면 돼요." }] },
      { word: "block", ko: "블록 (한 구간)", ex: [{ en: "It's two blocks from here.", ko: "여기서 두 블록이에요." }, { en: "Walk straight for three blocks.", ko: "세 블록 직진하세요." }] },
      { word: "intersection", ko: "교차로", ex: [{ en: "Turn right at the intersection.", ko: "교차로에서 오른쪽으로 도세요." }, { en: "The café is at the next intersection.", ko: "카페는 다음 교차로에 있어요." }] },
      { word: "subway", ko: "지하철", ex: [{ en: "Take the subway to get there faster.", ko: "지하철을 타면 더 빨리 가요." }, { en: "Where is the nearest subway station?", ko: "가장 가까운 지하철역이 어디예요?" }] },
      { word: "landmark", ko: "랜드마크 (주요 건물)", ex: [{ en: "Use the Empire State as a landmark.", ko: "엠파이어 스테이트 빌딩을 랜드마크로 사용하세요." }, { en: "It's right next to the landmark.", ko: "랜드마크 바로 옆이에요." }] },
    ],
    dialogues: [
      { role:'npc', en:"Hey, are you lost? I can try to help!", ko:"길 잃으셨어요? 도와드릴게요!" },
      { role:'user', en:"Excuse me, how do I get to Times Square?", ko:"실례합니다, 타임스퀘어에 어떻게 가나요?" },
      { role:'npc', en:"Walk straight for two blocks, then turn left.", ko:"두 블록 직진하고 왼쪽으로 도세요." },
      { role:'user', en:"Is it far from here? Can I walk there?", ko:"여기서 멀어요? 걸어갈 수 있나요?" },
      { role:'npc', en:"Not at all! It's about a 10-minute walk.", ko:"전혀요! 걸어서 약 10분이에요." },
      { role:'user', en:"Which subway line should I take if I'm in a hurry?", ko:"급하면 어느 지하철 노선을 타야 해요?" },
      { role:'npc', en:"Take the A or C line to 42nd Street. Very quick!", ko:"A나 C 노선 타고 42번가에서 내리세요. 매우 빨라요!" },
      { role:'user', en:"How long does it take by subway?", ko:"지하철로 얼마나 걸려요?" },
      { role:'npc', en:"Only about 5 minutes! The station is right at the corner.", ko:"5분밖에 안 걸려요! 역은 저 모퉁이에 있어요." },
    ],
  },
  {
    emoji: "💼", npc: "Colleague",
    scene: "뉴욕 회사 첫 출근이에요. 동료가 반갑게 인사해요.",
    starter: "Hey, welcome to the team! I'm your colleague, Alex. Is this your first day? 💼",
    systemPrompt: "You are a friendly colleague at a New York office on a new employee's first day, having a natural conversation with a Korean English learner. Respond naturally in 2-4 sentences and ask follow-up questions to keep the conversation going. If the learner makes a grammar or vocabulary mistake, add a correction on a new line at the very end formatted exactly like: 💡 Correction: \"[wrong]\" → \"[correct]\". Stay in character. Reply in English only.",
    phrases: [
      { en: "Nice to meet you.", ko: "만나서 반가워요." },
      { en: "I'm new here.", ko: "저 여기 처음이에요." },
      { en: "Could you show me around?", ko: "안내해 주실 수 있나요?" },
      { en: "Where is the meeting room?", ko: "회의실이 어디예요?" },
      { en: "When is the deadline?", ko: "마감이 언제예요?" },
      { en: "I'll send you an email.", ko: "이메일 보낼게요." },
    ],
    vocab: [
      { word: "deadline", ko: "마감일", ex: [{ en: "What is the deadline for this project?", ko: "이 프로젝트 마감이 언제예요?" }, { en: "We need to meet the deadline.", ko: "마감일을 지켜야 해요." }] },
      { word: "colleague", ko: "동료", ex: [{ en: "My colleague helped me with the report.", ko: "동료가 보고서 작성을 도와줬어요." }, { en: "I'll introduce you to my colleagues.", ko: "동료들에게 소개해 드릴게요." }] },
      { word: "meeting", ko: "회의", ex: [{ en: "We have a meeting at 10 AM.", ko: "오전 10시에 회의가 있어요." }, { en: "Can we reschedule the meeting?", ko: "회의 일정을 바꿀 수 있나요?" }] },
      { word: "presentation", ko: "발표", ex: [{ en: "I need to prepare a presentation.", ko: "발표 준비를 해야 해요." }, { en: "How did your presentation go?", ko: "발표 어떻게 됐어요?" }] },
      { word: "overtime", ko: "야근, 초과근무", ex: [{ en: "I had to work overtime last night.", ko: "어젯밤에 야근했어요." }, { en: "Do you get paid for overtime?", ko: "야근 수당 받아요?" }] },
    ],
    dialogues: [
      { role:'npc', en:"Hey, welcome to the team! Is this your first day?", ko:"어서와요, 팀에 합류한 걸 환영해요! 오늘 첫 출근이에요?" },
      { role:'user', en:"Yes! Nice to meet you. I'm new here.", ko:"네! 만나서 반가워요. 여기 처음이에요." },
      { role:'npc', en:"Nice to meet you too! I'm Alex. Let me show you around.", ko:"저도 반가워요! 저는 알렉스예요. 안내해 드릴게요." },
      { role:'user', en:"Thank you! Where is the meeting room?", ko:"감사해요! 회의실이 어디예요?" },
      { role:'npc', en:"Down the hall on the left. We have a team meeting tomorrow at 10 AM.", ko:"복도 끝 왼쪽이에요. 내일 오전 10시에 팀 회의가 있어요." },
      { role:'user', en:"Got it. When is the deadline for the current project?", ko:"알겠어요. 현재 프로젝트 마감이 언제예요?" },
      { role:'npc', en:"This Friday! We might work overtime to finish it.", ko:"이번 금요일이에요! 끝내려면 야근할 수도 있어요." },
      { role:'user', en:"Understood. I'll send you an email with my contact info.", ko:"알겠어요. 연락처 이메일로 보낼게요." },
      { role:'npc', en:"Great! Looking forward to working with you!", ko:"좋아요! 같이 일하게 되어서 기대돼요!" },
    ],
  },
];

const PATTERNS = [
  {
    pattern: "I'd like to ~", ko: "~하고 싶어요 (정중한 요청)", tag: "요청",
    examples: [
      { en: "I'd like to order a coffee, please.", ko: "커피 한 잔 주문하고 싶어요." },
      { en: "I'd like to book a room for two nights.", ko: "2박으로 방을 예약하고 싶어요." },
      { en: "I'd like to exchange this for a different size.", ko: "이걸 다른 사이즈로 교환하고 싶어요." },
    ]
  },
  {
    pattern: "Could you ~?", ko: "~해 주실 수 있나요? (정중한 부탁)", tag: "부탁",
    examples: [
      { en: "Could you show me around?", ko: "안내해 주실 수 있나요?" },
      { en: "Could you speak more slowly?", ko: "좀 더 천천히 말씀해 주실 수 있나요?" },
      { en: "Could you recommend something?", ko: "추천해 주실 수 있나요?" },
    ]
  },
  {
    pattern: "Do you have ~?", ko: "~있나요? (가용 여부 확인)", tag: "확인",
    examples: [
      { en: "Do you have this in a larger size?", ko: "이거 더 큰 사이즈 있나요?" },
      { en: "Do you have any vegetarian options?", ko: "채식 메뉴 있나요?" },
      { en: "Do you have Wi-Fi here?", ko: "여기 와이파이 있나요?" },
    ]
  },
  {
    pattern: "Is it okay if ~?", ko: "~해도 될까요? (허락 구하기)", tag: "허락",
    examples: [
      { en: "Is it okay if I sit here?", ko: "여기 앉아도 될까요?" },
      { en: "Is it okay if I pay by card?", ko: "카드로 결제해도 될까요?" },
      { en: "Is it okay if I come a bit late?", ko: "조금 늦게 가도 될까요?" },
    ]
  },
  {
    pattern: "I'm looking for ~", ko: "~를 찾고 있어요", tag: "요청",
    examples: [
      { en: "I'm looking for the nearest subway station.", ko: "가장 가까운 지하철역을 찾고 있어요." },
      { en: "I'm looking for a medium-sized shirt.", ko: "미디엄 사이즈 셔츠를 찾고 있어요." },
      { en: "I'm looking for something for a headache.", ko: "두통에 좋은 걸 찾고 있어요." },
    ]
  },
  {
    pattern: "How long does it take to ~?", ko: "~하는 데 얼마나 걸려요?", tag: "질문",
    examples: [
      { en: "How long does it take to get there by subway?", ko: "지하철로 거기까지 얼마나 걸려요?" },
      { en: "How long does it take to check in?", ko: "체크인하는 데 얼마나 걸려요?" },
      { en: "How long does it take for the food to arrive?", ko: "음식이 나오는 데 얼마나 걸려요?" },
    ]
  },
  {
    pattern: "I was wondering if ~", ko: "~인지 여쭤보고 싶어서요 (조심스러운 질문)", tag: "질문",
    examples: [
      { en: "I was wondering if you have any rooms available.", ko: "혹시 빈 방이 있는지 여쭤보고 싶어서요." },
      { en: "I was wondering if I could get a refund.", ko: "환불이 가능한지 여쭤보고 싶어서요." },
      { en: "I was wondering if the kitchen is still open.", ko: "주방이 아직 열려 있는지 여쭤보고 싶어서요." },
    ]
  },
  {
    pattern: "Would you mind ~ing?", ko: "~해 주시면 안 될까요? (매우 정중)", tag: "부탁",
    examples: [
      { en: "Would you mind taking a photo of us?", ko: "저희 사진 찍어 주시면 안 될까요?" },
      { en: "Would you mind moving over a little?", ko: "조금 옮겨 주시면 안 될까요?" },
      { en: "Would you mind repeating that?", ko: "다시 한 번 말씀해 주시면 안 될까요?" },
    ]
  },
  {
    pattern: "I'm having trouble ~ing", ko: "~하는 데 어려움이 있어요", tag: "문제",
    examples: [
      { en: "I'm having trouble connecting to the Wi-Fi.", ko: "와이파이 연결하는 데 어려움이 있어요." },
      { en: "I'm having trouble finding the gate.", ko: "게이트를 찾는 데 어려움이 있어요." },
      { en: "I'm having trouble understanding the menu.", ko: "메뉴를 이해하는 데 어려움이 있어요." },
    ]
  },
  {
    pattern: "It turns out ~", ko: "알고 보니 ~이더라고요 (뜻밖의 사실)", tag: "표현",
    examples: [
      { en: "It turns out the restaurant was closed.", ko: "알고 보니 그 식당이 문을 닫았더라고요." },
      { en: "It turns out I had the wrong address.", ko: "알고 보니 주소가 틀렸더라고요." },
      { en: "It turns out they don't accept cash.", ko: "알고 보니 현금을 안 받더라고요." },
    ]
  },
  {
    pattern: "I should have ~", ko: "~했어야 했는데 (후회)", tag: "표현",
    examples: [
      { en: "I should have made a reservation.", ko: "예약을 했어야 했는데." },
      { en: "I should have brought my umbrella.", ko: "우산을 챙겨왔어야 했는데." },
      { en: "I should have asked for directions earlier.", ko: "더 일찍 길을 물어봤어야 했는데." },
    ]
  },
  {
    pattern: "Feel free to ~", ko: "편하게 ~하세요 (권유)", tag: "표현",
    examples: [
      { en: "Feel free to ask me anything.", ko: "편하게 뭐든지 물어보세요." },
      { en: "Feel free to look around.", ko: "편하게 둘러보세요." },
      { en: "Feel free to take your time.", ko: "천천히 편하게 하세요." },
    ]
  },
];

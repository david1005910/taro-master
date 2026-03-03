# Taro Master API Documentation

**Base URL:** `http://localhost:4000/api`
**Authentication:** JWT Bearer Token in `Authorization` header

---

## 🔐 Authentication

### POST /auth/register
회원가입
```json
Request:
{
  "email": "user@example.com",
  "password": "Password123!",  // 영문+숫자+특수문자
  "name": "홍길동"
}

Response: 200
{
  "success": true,
  "data": {
    "user": { "id", "email", "name", "createdAt" },
    "accessToken": "eyJ...",   // 1시간
    "refreshToken": "eyJ..."   // 7일
  }
}
```

### POST /auth/login
로그인
```json
Request:
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response: 200
{ "success": true, "data": { "user", "accessToken", "refreshToken" } }
```

### POST /auth/refresh
액세스 토큰 갱신
```json
Request:
{ "refreshToken": "eyJ..." }

Response: 200
{ "success": true, "data": { "accessToken", "refreshToken" } }
```

---

## 🃏 Tarot Cards

### GET /cards
모든 카드 조회 (78장)
```
Query: ?limit=100

Response: 200
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": 79,
        "nameKo": "바보",
        "nameEn": "The Fool",
        "type": "MAJOR",
        "suit": null,
        "number": 0,
        "imageUrl": "/images/cards/major-00-the-fool.jpg",
        "keywords": ["새로운 시작", "순수", "모험"],
        "uprightMeaning": "...",
        "reversedMeaning": "..."
      }
    ]
  }
}
```

### GET /cards/:id
특정 카드 상세
```
Response: 200
{
  "success": true,
  "data": {
    "card": {
      ...(기본 정보),
      "symbolism": "...",
      "love": "...",
      "career": "...",
      "health": "...",
      "finance": "..."
    }
  }
}
```

---

## 📐 Spreads

### GET /spreads
스프레드 목록
```
Response: 200
{
  "success": true,
  "data": {
    "spreads": [
      {
        "id": 7,
        "name": "원카드",
        "description": "...",
        "cardCount": 1,
        "difficulty": 1,
        "category": "general"
      },
      {
        "id": 8,
        "name": "쓰리카드",
        "cardCount": 3,
        "difficulty": 2,
        "positions": ["과거", "현재", "미래"]
      },
      {
        "id": 9,
        "name": "켈틱 크로스",
        "cardCount": 10,
        "difficulty": 4
      }
    ]
  }
}
```

---

## 🔮 Readings (🔒 Auth Required)

### POST /readings
타로 리딩 생성
```json
Request:
{
  "spreadId": 8,
  "question": "올해 나의 연애운은?",
  "interpretMode": "AI",  // "AI" | "TRADITIONAL"
  "cards": [
    {
      "cardId": 79,
      "position": "과거",
      "isReversed": false
    },
    {
      "cardId": 80,
      "position": "현재",
      "isReversed": true
    },
    {
      "cardId": 81,
      "position": "미래",
      "isReversed": false
    }
  ]
}

Response: 201 (AI 모드는 15-30초 소요)
{
  "success": true,
  "data": {
    "reading": {
      "id": "uuid",
      "question": "...",
      "spreadName": "쓰리카드",
      "createdAt": "2026-03-04T...",
      "cards": [
        {
          "position": "과거",
          "isReversed": false,
          "card": { ...(카드 정보) }
        }
      ],
      "interpretation": {
        "overallMessage": "전체적인 흐름...",
        "cardInterpretations": [
          {
            "cardName": "바보",
            "position": "과거",
            "meaning": "..."
          }
        ],
        "advice": "구체적인 조언...",
        "summary": "한 줄 핵심 요약"
      }
    }
  }
}
```

### GET /readings
내 리딩 히스토리
```
Query: ?page=1&limit=20

Response: 200
{
  "success": true,
  "data": {
    "readings": [...],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### GET /readings/:id
리딩 상세 조회
```
Response: 200
{
  "success": true,
  "data": { "reading": {...} }
}
```

---

## 💬 AI Chat (🔒 Auth Required)

### POST /ai/chat
리딩 후속 질문
```json
Request:
{
  "readingId": "uuid",
  "message": "과거 카드를 더 자세히 설명해주세요",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

Response: 200 (5-10초)
{
  "success": true,
  "data": {
    "reply": "AI 답변...",
    "relatedCards": ["바보", "마법사"]
  }
}
```

---

## 🔬 RAG Search

### GET /rag/status
RAG 시스템 상태
```
Response: 200
{
  "success": true,
  "data": {
    "qdrant": true,
    "cardCount": 78
  }
}
```

### POST /rag/search
카드 시맨틱 검색
```json
Request:
{
  "query": "돈을 많이 벌 수 있을까?",
  "mode": "hybrid",  // "semantic" | "sparse" | "hybrid" | "compare"
  "limit": 5
}

Response: 200
{
  "success": true,
  "data": {
    "results": [
      {
        "card": {...},
        "score": 0.85,
        "reason": "재물운 상승"
      }
    ]
  }
}
```

### POST /rag/index (🔒 Auth Required)
카드 재인덱싱
```
Response: 200
{
  "success": true,
  "data": { "indexed": 78 }
}
```

---

## 🕸️ Neo4j Graph

### GET /graph/status
그래프 DB 상태
```
Response: 200
{
  "success": true,
  "data": {
    "connected": true,
    "nodeCount": 78,
    "relationshipCount": 826
  }
}
```

### GET /graph/card/:id/relationships
카드 관계 조회
```
Example: GET /graph/card/80/relationships

Response: 200
{
  "success": true,
  "data": {
    "cardId": 80,
    "nameKo": "마법사",
    "element": "FIRE",
    "sharedElement": [
      { "cardId": 83, "nameKo": "황제" }
    ],
    "numerological": [
      { "cardId": 101, "nameKo": "완드의 에이스", "number": 1 }
    ],
    "archetypal": [
      { "cardId": 100, "nameKo": "세계", "theme": "시작/완성" }
    ]
  }
}
```

### GET /graph/user/patterns (🔒 Auth Required)
내 리딩 패턴 분석
```
Response: 200
{
  "success": true,
  "data": {
    "topCards": [
      { "cardId": 79, "nameKo": "바보", "count": 5 }
    ],
    "elementDistribution": {
      "FIRE": 10,
      "WATER": 8,
      "AIR": 5,
      "EARTH": 3
    },
    "totalReadings": 12
  }
}
```

---

## 🧮 Saju (사주)

### POST /saju
사주 분석
```json
Request:
{
  "birthYear": 1990,
  "birthMonth": 5,
  "birthDay": 15,
  "birthHour": 14,
  "isLunar": false,
  "gender": "male"
}

Response: 200
{
  "success": true,
  "data": {
    "eightCharacters": {
      "year": { "heavenlyStem": "경", "earthlyBranch": "오" },
      "month": { ... },
      "day": { ... },
      "hour": { ... }
    },
    "fiveElements": {
      "목": 1, "화": 3, "토": 2, "금": 1, "수": 1
    },
    "analysis": "..."
  }
}
```

### POST /saju-tarot/graph-insight
사주-타로 그래프 통합 분석
```json
Request:
{
  "sajuReading": { ...(사주 분석 결과) },
  "question": "올해 재물운은?"
}

Response: 200
{
  "success": true,
  "data": {
    "conflicts": ["천간합: 갑기합토"],
    "harmonies": ["지지삼합: 인오술 화국"],
    "recommendedCards": [
      {
        "card": {...},
        "reason": "화 에너지 강화",
        "relationshipPath": "화→상생→토"
      }
    ]
  }
}
```

### POST /saju-tarot/hybrid-search
사주 + RAG 하이브리드 검색
```json
Request:
{
  "sajuAnalysis": {...},
  "question": "직장운은?"
}

Response: 200
{
  "success": true,
  "data": {
    "semanticCards": [...],  // RAG 검색
    "graphCards": [...],      // Neo4j 그래프
    "combinedScore": {...}
  }
}
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Invalid/Missing Token) |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable (AI API Error) |

---

## 🚨 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - 입력 검증 실패
- `AUTH_INVALID_CREDENTIALS` - 로그인 실패
- `AUTH_TOKEN_INVALID` - 토큰 무효
- `AI_INTERPRETATION_FAILED` - AI 해석 실패
- `RATE_LIMIT_EXCEEDED` - 요청 한도 초과

---

## 🔗 WebSocket (Future)

채팅 실시간 스트리밍 (예정):
```
ws://localhost:4000/ws/chat?token=eyJ...

→ { "type": "chunk", "content": "..." }
→ { "type": "done", "fullResponse": "..." }
```

---

## 📈 Rate Limits

- 인증 없음: 10 req/min
- 인증 있음: 100 req/min
- AI 해석: 5 req/min (계정당)

---

## 🌐 CORS

허용 도메인:
- `http://localhost:5173` (개발)
- `https://taro-master.com` (프로덕션)

---

## 📝 Notes

1. **AI 응답 시간**: 15-30초 (카드 수에 따라)
2. **토큰 자동 갱신**: axios interceptor 구현됨
3. **이미지 경로**: `/images/cards/` (프론트엔드 public)
4. **타임존**: UTC 저장, 클라이언트 변환
5. **페이지네이션**: 기본 20개, 최대 100개

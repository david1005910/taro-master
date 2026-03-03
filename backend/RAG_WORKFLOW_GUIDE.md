# RAG (Retrieval-Augmented Generation) 워크플로우 가이드

## 개요

타로 마스터는 **VectorDB.py 패턴**을 따라 타로 카드 해석 데이터를 벡터화하여 Qdrant에 저장합니다.
벡터화는 **초기 1회** 또는 **데이터 업데이트 시에만** 실행되며, 서버 시작 시 자동으로 인덱싱하지 않습니다.

## 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. 초기 데이터 준비                                                │
│    npx prisma db push           # SQLite 스키마 적용              │
│    npx ts-node scripts/seed.ts  # 78개 타로 카드 시드             │
│    npx ts-node scripts/populate-chunks.ts  # chunks 구조 생성     │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. 벡터화 (최초 1회)                                               │
│    npx ts-node scripts/index-cards.ts                            │
│    → Prisma에서 78개 카드 로드                                     │
│    → Gemini gemini-embedding-001로 3072-dim 벡터 생성             │
│    → BM25 sparse 벡터 생성                                         │
│    → Qdrant 'tarot_cards' 컬렉션에 저장                           │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. 서버 실행                                                       │
│    npm run dev                                                    │
│    → RAG 서비스 initialize() — Qdrant 연결 체크                   │
│    → 카드 수 확인 (78개 있으면 "이미 인덱싱됨" 로그)              │
│    → BM25 모델 로드 (쿼리 시 사용)                                 │
│    ✅ 인덱싱 작업 수행 안 함!                                      │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. RAG 검색 사용                                                   │
│    POST /api/rag/search                                           │
│    { "query": "연애운", "mode": "hybrid", "limit": 5 }            │
│    → Dense 벡터 검색 (의미적 유사도)                               │
│    → Sparse 벡터 검색 (키워드 매칭)                                │
│    → RRF 융합 → 상위 5개 카드 반환                                 │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼ (데이터 업데이트 시)
┌──────────────────────────────────────────────────────────────────┐
│ 5. 재인덱싱 (필요 시)                                              │
│    npx ts-node scripts/index-cards.ts --force                    │
│    OR                                                             │
│    POST /api/rag/index (인증 필요)                                │
└──────────────────────────────────────────────────────────────────┘
```

## 단계별 가이드

### 1️⃣ 최초 설정 (한 번만)

```bash
cd backend

# 1. 데이터베이스 초기화
npx prisma db push
npx ts-node scripts/seed.ts
npx ts-node scripts/populate-chunks.ts

# 2. Qdrant 시작 (Docker)
cd ..
docker-compose up -d qdrant

# 3. 벡터 인덱싱 (최초 1회)
cd backend
npx ts-node scripts/index-cards.ts
```

**출력 예시:**
```
=== 타로 카드 RAG 인덱싱 (Gemini gemini-embedding-001) ===

✓ Qdrant 연결 성공
✓ 컬렉션 생성 (3072dim)

✓ 카드 78개 로드
Gemini 임베딩 시작... (1s 간격, 자동 재시도)

  10/78 완료
  20/78 완료
  ...
  78/78 완료

✓ 전체 임베딩 완료
✓ Qdrant에 78개 카드 저장 완료

=== 완료! ===
```

### 2️⃣ 서버 실행

```bash
npm run dev
```

**출력 예시:**
```
Server is running on http://localhost:4000
Environment: development
[RAG] 78 cards already indexed, skipping
[RAG] Qdrant initialized with tarot cards
```

✅ **서버가 자동으로 인덱싱하지 않음!** — 이미 벡터화된 데이터 사용

### 3️⃣ RAG 검색 테스트

#### a) 상태 확인
```bash
curl http://localhost:4000/api/rag/status
```

**응답:**
```json
{
  "success": true,
  "data": {
    "qdrant": true,
    "cardCount": 78
  }
}
```

#### b) Hybrid 검색 (기본)
```bash
curl -X POST http://localhost:4000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "연애운이 어떻게 될까요?",
    "mode": "hybrid",
    "limit": 5
  }'
```

**응답:**
```json
{
  "success": true,
  "data": {
    "query": "연애운이 어떻게 될까요?",
    "mode": "hybrid",
    "results": [
      {
        "card": { "id": 85, "nameKo": "연인", "nameEn": "The Lovers", ... },
        "score": 0.892,
        "rank": 1
      },
      ...
    ]
  }
}
```

#### c) 모드 비교
```bash
curl -X POST http://localhost:4000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "직장에서 승진할 수 있을까요?",
    "mode": "compare",
    "limit": 3
  }'
```

**응답:** semantic, sparse, hybrid 각 모드별 결과 + 성능 비교

### 4️⃣ 데이터 업데이트 시 재인덱싱

#### 시나리오 1: 카드 의미 수정
```bash
# 1. 데이터베이스 수정 (Prisma Studio 또는 SQL)
npx prisma studio

# 2. 강제 재인덱싱
npx ts-node scripts/index-cards.ts --force
```

#### 시나리오 2: chunks 구조 변경
```bash
# 1. populate-chunks.ts 수정 (새 카테고리 추가 등)
# 2. chunks 재생성
npx ts-node scripts/populate-chunks.ts

# 3. 강제 재인덱싱
npx ts-node scripts/index-cards.ts --force
```

#### 시나리오 3: API로 재인덱싱 (인증 필요)
```bash
# 먼저 로그인하여 토큰 획득
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' | jq -r .data.accessToken)

# 재인덱싱 요청
curl -X POST http://localhost:4000/api/rag/index \
  -H "Authorization: Bearer $TOKEN"
```

## VectorDB.py 패턴 비교

| VectorDB.py (Python) | Taro Master (TypeScript) |
|----------------------|---------------------------|
| `Chroma.from_documents()` | `scripts/index-cards.ts` |
| `persist_directory="./tarot_db"` | Qdrant collection `tarot_cards` |
| OpenAI Embeddings | Gemini gemini-embedding-001 |
| 한 번 실행 → 로컬 저장 | 한 번 실행 → Qdrant 저장 |
| 앱 시작 시 로컬 DB 로드 | 앱 시작 시 Qdrant 연결만 체크 |

**핵심 원칙:** 벡터화는 비용이 큰 작업 → **분리된 스크립트**로 실행

## 검색 모드 설명

### 1. Semantic Search (의미적 검색)
- Gemini 임베딩의 코사인 유사도 기반
- 유사한 **의미**를 가진 카드 검색
- 예: "새로운 시작" → 바보, 에이스 카드들

### 2. Sparse Search (키워드 검색)
- BM25 알고리즘 기반
- 정확한 **키워드 매칭**
- 예: "사랑" → love 필드에 "사랑" 포함된 카드

### 3. Hybrid Search (하이브리드, 기본)
- Semantic + Sparse 결합 (RRF 융합)
- **가장 정확한 결과** — 의미 + 키워드 모두 고려
- 권장: 대부분의 사용 사례

### 4. Compare (비교 모드)
- 3가지 모드 결과 동시 반환
- 성능 분석 및 디버깅용

## 성능 고려사항

### Gemini 임베딩 무료 티어 제한
- **RPM (Requests Per Minute):** ~100
- **1s 간격 적용:** 78장 인덱싱 시 최소 78초 소요
- **429 에러 발생 시:** 65초 대기 후 자동 재시도 (최대 5회)

### 실제 소요 시간
- 정상: ~1분 30초
- Rate limit 발생 시: ~2-3분

### Qdrant 저장소
- 로컬 개발: `http://localhost:6333` (Docker)
- 데이터 경로: `/tmp/qdrant-storage` (macOS ephemeral)
- ⚠️ **재부팅 시 데이터 손실** → 재인덱싱 필요

## 트러블슈팅

### 문제: "78 cards already indexed, skipping"인데 검색 결과가 이상함
**원인:** Qdrant 데이터와 DB 데이터 불일치
**해결:**
```bash
npx ts-node scripts/index-cards.ts --force
```

### 문제: "GEMINI_API_KEY is not configured"
**원인:** `.env` 파일에 Gemini API 키 미설정
**해결:**
```bash
# backend/.env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 문제: "Rate limit ... 65s 대기"
**원인:** Gemini 무료 티어 RPM 한도 초과
**해결:** 자동 재시도 대기 (정상 동작)

### 문제: "NOT_READY" 에러 발생
**원인:** 인덱싱이 완료되지 않음
**해결:**
1. `npx ts-node scripts/index-cards.ts` 실행
2. 서버 재시작

## 다음 단계: Chunks 기반 RAG 개선

현재는 카드 전체를 하나의 문서로 인덱싱합니다.
`CARD_CHUNKS_GUIDE.md` 참조하여 **카테고리별 인덱싱**으로 업그레이드 가능:

```typescript
// 기존: 1장 → 1개 벡터
buildDocument(card) // "카드: 마법사\n정방향: ...\n역방향: ...\n사랑: ..."

// 개선: 1장 → 6개 벡터
chunks.forEach(chunk => {
  embedAndIndex(`${card.nameKo} ${chunk.category}: ${chunk.upright}`)
})
```

**장점:**
- 질문 도메인별 정확도 ↑ ("연애운" → love chunk만 검색)
- 토큰 효율 ↑ (관련 chunk만 AI에 전달)
- 확장성 ↑ (새 카테고리 추가 용이)

## 요약

| 작업 | 명령어 | 실행 시점 |
|------|--------|----------|
| 최초 인덱싱 | `npx ts-node scripts/index-cards.ts` | DB 시드 후 1회 |
| 강제 재인덱싱 | `npx ts-node scripts/index-cards.ts --force` | 데이터 업데이트 시 |
| API 재인덱싱 | `POST /api/rag/index` (인증) | 프로덕션 환경 |
| 상태 확인 | `GET /api/rag/status` | 언제든지 |
| 검색 테스트 | `POST /api/rag/search` | RAG 기능 사용 시 |
| 서버 시작 | `npm run dev` | 개발 중 (자동 인덱싱 안 함!) |

✅ **핵심:** 벡터화는 별도 스크립트 — 서버는 연결만 확인!

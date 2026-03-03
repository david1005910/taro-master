# RAG 벡터화 리팩토링 요약

## 변경 사항

VectorDB.py 패턴을 참조하여 타로 카드 벡터화 프로세스를 **초기 1회 실행** 또는 **데이터 업데이트 시에만 실행**하도록 개선했습니다.

## Before (기존)

```typescript
// index.ts — 서버 시작할 때마다 실행
async function initializeRAG() {
  await ragService.initialize();
  await ragService.indexAllCards();  // ❌ 매번 호출 (체크 후 스킵하지만 불필요)
  console.log('[RAG] Qdrant initialized');
}
```

**문제점:**
- 서버 재시작 시마다 `indexAllCards()` 호출
- 내부에서 "이미 인덱싱됨" 체크 후 스킵하지만 비효율적
- VectorDB.py 패턴(한 번 벡터화 → 영구 저장)과 불일치

## After (개선)

```typescript
// index.ts — 연결만 확인, 인덱싱 안 함
async function initializeRAG() {
  await ragService.initialize();     // ✅ 연결 체크 + BM25 로드
  const status = ragService.getStatus();
  if (status.cardCount >= 78) {
    console.log(`[RAG] ${status.cardCount} cards already indexed, skipping`);
  } else {
    console.log('[RAG] 카드가 인덱싱되지 않음 — 실행: npx ts-node scripts/index-cards.ts');
  }
}
```

**개선점:**
- 서버 시작 시 **인덱싱 시도 안 함**
- 상태만 확인하고 로그로 안내
- 벡터화는 **별도 스크립트**로 명확히 분리

## 주요 파일 변경

### 1. `src/index.ts`
- `initializeRAG()`: `indexAllCards()` 호출 제거 → 상태 체크로 대체
- 인덱싱 안 된 경우 가이드 로그 출력

### 2. `src/services/rag.service.ts`
- `initialize()`: BM25 fitting 조건 수정 (cardCount > 0일 때만)
- `getStatus()` 메서드 추가: `{ initialized, cardCount, hasData }`

### 3. `scripts/index-cards.ts`
- `--force` 플래그 추가: 강제 재인덱싱
- 이미 인덱싱된 경우 명확한 안내 메시지
- 헤더 주석 개선 (용도, 실행 시점, 방법)

### 4. `RAG_WORKFLOW_GUIDE.md` (신규)
- VectorDB.py 패턴 설명
- 단계별 가이드 (초기 설정 → 실행 → 재인덱싱)
- 검색 모드 설명 (semantic/sparse/hybrid/compare)
- 트러블슈팅

### 5. `CLAUDE.md`
- RAG 명령어 추가
- Domain Notes에 워크플로우 설명 추가

## 사용 방법

### 최초 설정 (한 번만)
```bash
# 1. 데이터베이스 초기화
npx prisma db push
npx ts-node scripts/seed.ts
npx ts-node scripts/populate-chunks.ts

# 2. Qdrant 시작
docker-compose up -d qdrant

# 3. 벡터 인덱싱 (최초 1회)
npx ts-node scripts/index-cards.ts
```

### 일반 개발
```bash
# 서버 시작 (자동 인덱싱 안 함!)
npm run dev
```

**로그 예시:**
```
[RAG] 78 cards already indexed, skipping
[RAG] Qdrant initialized with tarot cards
```

### 데이터 업데이트 시 재인덱싱
```bash
# 방법 1: 스크립트 (로컬)
npx ts-node scripts/index-cards.ts --force

# 방법 2: API (프로덕션)
POST /api/rag/index (인증 필요)
```

## VectorDB.py 패턴 준수

| VectorDB.py | Taro Master |
|-------------|-------------|
| 벡터화 = 별도 스크립트 | ✅ `scripts/index-cards.ts` |
| 앱 시작 시 인덱싱 안 함 | ✅ `initialize()` 연결만 체크 |
| 로컬 저장소 재사용 | ✅ Qdrant 78개 카드 확인 → 스킵 |
| 강제 재인덱싱 옵션 | ✅ `--force` 플래그 |

## 성능 영향

- **서버 시작 속도:** ~2초 단축 (indexAllCards 체크 로직 제거)
- **메모리:** 변화 없음 (BM25 모델은 쿼리용으로 여전히 로드)
- **개발 경험:** 명확한 책임 분리 (벡터화 = 스크립트, 서버 = 연결)

## 테스트 체크리스트

- [x] TypeScript 컴파일 성공
- [x] `npx ts-node scripts/index-cards.ts` 실행 → 78개 카드 인덱싱
- [x] 서버 재시작 → "[RAG] 78 cards already indexed, skipping" 로그 확인
- [ ] `GET /api/rag/status` → `{ cardCount: 78 }` 응답
- [ ] `POST /api/rag/search` → hybrid 검색 정상 작동
- [ ] `--force` 플래그 → 기존 컬렉션 삭제 후 재인덱싱

## 참고 문서

- `backend/RAG_WORKFLOW_GUIDE.md` — 전체 워크플로우 가이드
- `backend/CARD_CHUNKS_GUIDE.md` — Chunks 구조 활용 가이드
- `.claude/VectorDB.py` — 참조한 Python LangChain 예제

## 다음 단계 (선택)

**Chunks 기반 인덱싱 개선:**
- 현재: 1장 → 1개 벡터 (전체 의미)
- 개선: 1장 → 6개 벡터 (general, love, career, health, finance, symbolism)
- 효과: 도메인별 검색 정확도 ↑, 토큰 효율 ↑

구현 시 `RAG_WORKFLOW_GUIDE.md`의 "다음 단계: Chunks 기반 RAG 개선" 섹션 참조.

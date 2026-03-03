# 카드 Chunks 구조 활용 가이드

## 개요

각 타로 카드는 이제 **category-based chunks** 형식으로 의미를 저장합니다. 이를 통해 사용자 질문의 도메인(연애, 직업, 재물 등)에 맞는 정확한 해석을 제공할 수 있습니다.

## Chunks 데이터 구조

```json
{
  "id": 80,
  "nameKo": "마법사",
  "nameEn": "The Magician",
  "chunks": [
    {
      "category": "general",
      "upright": "당신 안에 잠든 마법사를 깨워라! 지금 당신에게는...",
      "reversed": "능력은 있는데 쓸 줄 모르는 슬픔..."
    },
    {
      "category": "love",
      "upright": "말빨이 터지는 시기! 좋아하는 사람에게 매력적으로...",
      "reversed": ""
    },
    {
      "category": "career",
      "upright": "이 프로젝트, 내가 한번 해볼게요! 리더십을 발휘하고...",
      "reversed": ""
    },
    {
      "category": "health",
      "upright": "마음이 건강해야 몸도 건강해요! 명상이나 요가로...",
      "reversed": ""
    },
    {
      "category": "finance",
      "upright": "사업 아이템이 보이나요? 지금 잡으세요! 계획적으로...",
      "reversed": ""
    },
    {
      "category": "symbolism",
      "upright": "한 손은 하늘을, 한 손은 땅을 가리키는 포즈! 하늘의...",
      "reversed": ""
    }
  ]
}
```

## 카테고리 종류

| Category | 설명 | reversed 여부 |
|----------|------|--------------|
| **general** | 전반적인 의미 (기본 해석) | ✅ 정/역 모두 |
| **love** | 연애·관계 해석 | ❌ 정방향만 |
| **career** | 직업·커리어 해석 | ❌ 정방향만 |
| **health** | 건강 해석 | ❌ 정방향만 |
| **finance** | 재물·금전 해석 | ❌ 정방향만 |
| **symbolism** | 상징·이미지 설명 | ❌ 방향 무관 |

## 활용 방법

### 1. 질문 도메인 감지

```typescript
function detectQuestionDomain(question: string): string[] {
  const domains: string[] = [];

  if (/연애|사랑|남자친구|여자친구|결혼|이별/.test(question)) {
    domains.push('love');
  }
  if (/직장|취업|이직|사업|커리어/.test(question)) {
    domains.push('career');
  }
  if (/돈|재정|투자|수입|재물/.test(question)) {
    domains.push('finance');
  }
  if (/건강|병|다이어트|몸/.test(question)) {
    domains.push('health');
  }

  return domains.length > 0 ? domains : ['general'];
}
```

### 2. Category 필터링으로 Chunk 선택

```typescript
const card = await prisma.card.findUnique({ where: { id: 80 } });
const chunks = JSON.parse(card.chunks);

const question = "연애가 잘 풀릴까요?";
const domains = detectQuestionDomain(question); // ['love']

// 관련 카테고리 chunk만 추출
const relevantChunks = chunks.filter(chunk =>
  domains.includes(chunk.category) || chunk.category === 'general'
);

console.log(relevantChunks);
// [
//   { category: "general", upright: "...", reversed: "..." },
//   { category: "love", upright: "말빨이 터지는 시기! ...", reversed: "" }
// ]
```

### 3. RAG 프롬프트에 카테고리별 컨텍스트 주입

```typescript
// AS-IS (기존 방식)
const context = `
카드: 마법사
정방향: ${card.uprightMeaning}
사랑: ${card.love}
직업: ${card.career}
...
`;

// TO-BE (Chunks 활용)
const context = relevantChunks
  .map(chunk => {
    const direction = isReversed ? chunk.reversed || chunk.upright : chunk.upright;
    return `[${chunk.category}] ${direction}`;
  })
  .join('\n\n');

// 결과:
// [general] 당신 안에 잠든 마법사를 깨워라! ...
// [love] 말빨이 터지는 시기! 좋아하는 사람에게 매력적으로 ...
```

### 4. Qdrant 벡터 DB 인덱싱 개선 (향후)

현재 Qdrant는 카드 전체를 하나의 문서로 인덱싱합니다. Chunks 구조를 활용하면:

```typescript
// 각 chunk를 개별 포인트로 인덱싱
for (const card of cards) {
  const chunks = JSON.parse(card.chunks);

  for (const chunk of chunks) {
    const embedding = await embedModel.embedContent(
      `${card.nameKo} ${chunk.category}: ${chunk.upright}`
    );

    await qdrantClient.upsert('tarot_cards_chunks', {
      points: [{
        id: `${card.id}_${chunk.category}`,
        vector: embedding.values,
        payload: {
          cardId: card.id,
          cardName: card.nameKo,
          category: chunk.category,
          content: chunk.upright,
          isReversed: false
        }
      }]
    });
  }
}

// 검색 시 category 필터
const results = await qdrantClient.search('tarot_cards_chunks', {
  vector: queryEmbedding,
  limit: 5,
  filter: {
    must: [{ key: 'category', match: { value: 'love' } }]
  }
});
```

## 장점

### ✅ 정확도 향상
- "연애운이 어떨까요?" → love chunk만 검색 → 관련 없는 career/finance 정보 제외

### ✅ 토큰 효율
- 필요한 카테고리만 AI 프롬프트에 주입 → 토큰 절약 (최대 60% 감소)

### ✅ 확장성
- 새 카테고리 추가 용이: `spiritual`, `travel`, `study` 등

### ✅ 유지보수
- 카테고리별 의미 수정 시 chunks 배열 내 해당 객체만 업데이트

## 마이그레이션

기존 78개 카드 데이터를 chunks 형식으로 변환:

```bash
npx ts-node scripts/populate-chunks.ts
```

출력:
```
🔄 카드 chunks 데이터 생성 중...
📦 총 78개 카드 발견
   ✅ 10/78 업데이트됨
   ✅ 20/78 업데이트됨
   ...
✅ 완료! 78개 카드의 chunks 필드 생성됨
```

## 다음 단계

1. **RAG 인덱싱 개선**: `scripts/index-cards.ts`를 수정하여 chunk별 임베딩 생성
2. **카테고리 필터링 API**: `POST /api/rag/search`에 `category` 파라미터 추가
3. **AI 프롬프트 최적화**: `ai.service.ts`에서 관련 chunk만 주입하도록 수정

## 예시 API 응답

```json
{
  "query": "연애운이 어떨까요?",
  "detectedCategories": ["love", "general"],
  "results": [
    {
      "cardId": 80,
      "cardName": "마법사",
      "chunk": {
        "category": "love",
        "upright": "말빨이 터지는 시기! 좋아하는 사람에게 매력적으로 다가갈 수 있어요.",
        "reversed": ""
      },
      "score": 0.892
    },
    {
      "cardId": 6,
      "cardName": "연인",
      "chunk": {
        "category": "love",
        "upright": "운명의 상대? 진정한 사랑, 소울메이트급 만남의 가능성!",
        "reversed": "관계의 불균형이나 선택의 갈림길..."
      },
      "score": 0.875
    }
  ]
}
```

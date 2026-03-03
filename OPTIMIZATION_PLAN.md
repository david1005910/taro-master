# 타로 마스터 성능 최적화 계획

## 현재 성능 지표
- AI 리딩: 35초 (6장 카드)
- RAG 검색: 카드당 ~1초
- Neo4j 쿼리: ~100-200ms
- 전체 병목: Claude API 응답 시간 (30초+)

## 최적화 방안

### 1. 병렬 처리 강화
**현재**: RAG 검색이 순차적으로 실행
```typescript
// Before (순차)
for (const card of cards) {
  await ragService.searchByCard(card)
}

// After (병렬)
await Promise.all(cards.map(card => 
  ragService.searchByCard(card)
))
```
**예상 효과**: 6장 기준 6초 → 1초 (6배 향상)

### 2. RAG 결과 캐싱
- 카드 ID별 RAG 결과 Redis 캐싱 (TTL: 1시간)
- 동일 카드 재검색 시 캐시 사용
- **예상 효과**: 반복 카드 0ms

### 3. Claude API 스트리밍
```typescript
// 현재: 전체 응답 대기 (35초)
const response = await anthropic.messages.create({...})

// 개선: 스트리밍으로 실시간 표시
const stream = await anthropic.messages.stream({...})
for await (const chunk of stream) {
  // 프론트엔드로 실시간 전송 (SSE)
}
```
**예상 효과**: 사용자 체감 대기 시간 5초 이하

### 4. 프롬프트 최적화
- 불필요한 RAG 컨텍스트 제거 (현재 ~2000 토큰)
- 핵심 정보만 전달 (~1000 토큰)
- **예상 효과**: 응답 시간 30% 단축 (35초 → 25초)

### 5. 경량 모드 제공
```typescript
interpretMode: 'AI' | 'AI_FAST' | 'TRADITIONAL'
// AI_FAST: RAG 없이 기본 카드 의미만 + Claude 짧은 응답
```
**예상 효과**: 10초 이내 응답

### 6. 백그라운드 사전 처리
- 스프레드 선택 시 인기 카드 조합 사전 임베딩
- 사용자 히스토리 기반 예상 카드 미리 로드

## 구현 우선순위
1. **High**: 병렬 처리 (즉시 가능, 큰 효과)
2. **High**: 스트리밍 응답 (UX 대폭 개선)
3. **Medium**: RAG 캐싱 (Redis 설정 필요)
4. **Medium**: 프롬프트 최적화 (품질 유지 필요)
5. **Low**: 경량 모드 (선택 옵션)

## 예상 최종 성능
- **병렬 처리 + 스트리밍**: 체감 대기 시간 5초
- **캐싱 + 최적화**: 총 처리 시간 20초
- **경량 모드**: 10초 이내

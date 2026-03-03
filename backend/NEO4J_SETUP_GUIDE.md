# Neo4j 연결 문제 해결 가이드

## 현재 상태

**에러:** `Could not perform discovery. No routing servers available`

**원인:** Neo4j Aura 클라우드 인스턴스가 중지되었거나 삭제되었습니다.

**영향:**
- ✅ 서버는 정상 작동 (Neo4j 없이도 OK)
- ❌ 그래프 기능 비활성화
- ❌ 사주-타로 연동 제한 (`/api/saju-tarot/graph-insight`, `/api/graph/*`)

## 해결 방법

### 옵션 1: Neo4j Aura 재활성화 (권장)

#### 1. Neo4j Aura 콘솔 접속
```
https://console.neo4j.io/
```

#### 2. 인스턴스 상태 확인
- Taro_master 인스턴스 (ID: 34130304) 찾기
- 상태 확인:
  - **Running** → 정상 (연결 가능)
  - **Paused** → "Resume" 클릭
  - **Stopped** → "Start" 클릭
  - **Deleted** → 새 인스턴스 생성 필요

#### 3. 인스턴스가 삭제된 경우

**새 인스턴스 생성:**
1. "New Instance" 클릭
2. Free tier 선택
3. 이름: `Taro_master`
4. 리전: 가까운 곳 선택 (예: Asia Pacific - Seoul)
5. 생성 완료 후 접속 정보 복사

**환경 변수 업데이트:**
```bash
# backend/.env
NEO4J_URI="neo4j+s://xxxxxxxx.databases.neo4j.io"  # 새 URI
NEO4J_USER="neo4j"
NEO4J_PASSWORD="새-비밀번호"  # 생성 시 제공된 비밀번호
```

#### 4. 연결 테스트
```bash
cd backend
npx ts-node scripts/test-neo4j.ts
```

**성공 시 출력:**
```
✅ 모든 테스트 통과! Neo4j 연결 정상입니다.
```

#### 5. 서버 재시작
```bash
npm run dev
```

**성공 시 로그:**
```
[Neo4j] ✓ 연결 성공: neo4j+s://xxxxxxxx.databases.neo4j.io
[Neo4j] ✓ 78개 타로 카드 그래프 초기화 완료
```

---

### 옵션 2: 로컬 Neo4j 설치 (대안)

macOS 13.7 Ventura는 Docker Desktop 비호환이므로 Neo4j Desktop 사용:

#### 1. Neo4j Desktop 다운로드
```
https://neo4j.com/download/
```

#### 2. 설치 및 데이터베이스 생성
1. Neo4j Desktop 실행
2. "New" → "Create a Local DBMS"
3. 이름: `Taro_master`
4. 비밀번호 설정: `taromaster123`
5. Version: 5.x 선택
6. "Create"

#### 3. 데이터베이스 시작
- "Start" 버튼 클릭
- 상태가 "Running"으로 변경 확인

#### 4. 환경 변수 업데이트
```bash
# backend/.env
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="taromaster123"
```

#### 5. 연결 테스트 및 서버 재시작
```bash
npx ts-node scripts/test-neo4j.ts
npm run dev
```

---

### 옵션 3: Neo4j 없이 사용 (현재 상태 유지)

**장점:**
- 추가 설정 불필요
- 서버 정상 작동

**단점:**
- 사주-타로 그래프 연동 기능 사용 불가
- 카드 관계 시각화 불가
- 사용자 패턴 분석 제한

**이 옵션 선택 시:**
- 현재 상태 그대로 사용
- Neo4j 관련 기능은 자동으로 비활성화됨
- 기본 타로 리딩 기능은 완전히 정상 작동

---

## 연결 문제 진단

### 에러 타입별 해결

#### 1. "Could not perform discovery"
**원인:** 인스턴스를 찾을 수 없음 (중지/삭제)
**해결:** Neo4j Aura 콘솔에서 인스턴스 재활성화

#### 2. "ServiceUnavailable"
**원인:** 네트워크 연결 불가 또는 인스턴스 다운
**해결:**
- 인터넷 연결 확인
- 방화벽 설정 확인 (7687 포트)
- Neo4j Aura 인스턴스 상태 확인

#### 3. "Neo.ClientError.Security.Unauthorized"
**원인:** 비밀번호 오류
**해결:**
```bash
# .env 파일 확인
NEO4J_PASSWORD="올바른-비밀번호"
```

#### 4. Timeout
**원인:** 연결 시간 초과 (네트워크 느림)
**해결:** 이미 타임아웃 30초로 증가됨. 그래도 실패 시 로컬 Neo4j 사용 권장

---

## 기능별 Neo4j 의존성

### Neo4j 필요한 기능
- ❌ `/api/saju-tarot/graph-insight` — 사주 충합 분석 + 멀티홉 카드 추천
- ❌ `/api/saju-tarot/hybrid-search` — 그래프 + RAG 하이브리드
- ❌ `/api/graph/status` — 그래프 상태 조회
- ❌ `/api/graph/card/:id/relationships` — 카드 관계 조회
- ❌ `/api/graph/user/patterns` — 사용자 패턴 분석

### Neo4j 불필요한 기능 (정상 작동)
- ✅ `/api/readings` — AI 리딩 (RAG만 사용)
- ✅ `/api/cards` — 카드 조회
- ✅ `/api/saju` — 사주 계산
- ✅ `/api/rag/search` — RAG 검색
- ✅ `/api/ai/chat` — 채팅
- ✅ 모든 인증 및 사용자 기능

---

## 연결 테스트 스크립트

### 실행
```bash
cd backend
npx ts-node scripts/test-neo4j.ts
```

### 출력 예시 (성공)
```
=== Neo4j 연결 테스트 ===

연결 정보:
  URI: neo4j+s://34130304.databases.neo4j.io
  User: neo4j
  Password: 설정됨 (WtxQwB9vSu...)

1. Driver 생성 중...
✓ Driver 생성 성공

2. 연결 확인 중... (최대 30초)
✓ 연결 성공!

3. 서버 정보 조회 중...
서버 정보:
  주소: 34130304.databases.neo4j.io:7687
  버전: Neo4j/5.14.0

4. 간단한 쿼리 실행 중...
✓ 쿼리 실행 성공: 1

5. 데이터베이스 노드 수 확인...
✓ 총 노드 수: 183개

✅ 모든 테스트 통과! Neo4j 연결 정상입니다.
```

### 출력 예시 (실패)
```
❌ Neo4j 연결 실패:

에러 타입: Neo4jError
에러 메시지: Could not perform discovery. No routing servers available.

💡 해결 방법:
   1. Neo4j Aura 인스턴스가 실행 중인지 확인
      → https://console.neo4j.io/ 접속
      → Taro_master 인스턴스 상태 확인
   2. 인스턴스가 중지되었다면 "Resume" 클릭
   3. 인스턴스가 삭제되었다면 새로 생성
```

---

## 서버 로그 확인

### 정상 연결 시
```
[Neo4j] ✓ 연결 성공: neo4j+s://34130304.databases.neo4j.io
[Neo4j] ✓ 78개 타로 카드 그래프 초기화 완료
```

### 연결 실패 시
```
[Neo4j] ❌ 연결 실패: Could not perform discovery...
[Neo4j] 💡 Neo4j Aura 인스턴스를 찾을 수 없습니다.
[Neo4j]    1. https://console.neo4j.io/ 접속
[Neo4j]    2. Taro_master 인스턴스 상태 확인
[Neo4j] ⚠️  그래프 기능 비활성화 (서버는 정상 작동)
```

---

## FAQ

### Q: Neo4j 없이도 서버가 작동하나요?
A: 네! 타로 리딩, AI 해석, RAG 검색 등 핵심 기능은 모두 정상 작동합니다. 사주-타로 그래프 연동 기능만 제한됩니다.

### Q: Neo4j Aura 무료 인스턴스가 자동으로 중지되나요?
A: 네, 일정 시간 사용하지 않으면 자동 중지될 수 있습니다. 콘솔에서 "Resume"으로 재활성화 가능합니다.

### Q: 로컬 Neo4j와 Aura 중 어떤 것이 좋나요?
A:
- **Neo4j Aura (클라우드):** 관리 편함, 어디서나 접속, 무료 티어 제공
- **로컬 Neo4j:** 빠른 응답, 오프라인 작동, 데이터 완전 제어

개발 환경에서는 로컬, 프로덕션에서는 Aura 권장

### Q: 타임아웃을 더 늘릴 수 있나요?
A: `neo4j.service.ts`에서 `connectionTimeout` 값 조정 가능 (현재 30초). 하지만 30초 이상 걸리면 다른 문제일 가능성이 높습니다.

---

## 개선 사항 (이미 적용됨)

1. ✅ 연결 타임아웃 5초 → 30초 증가
2. ✅ 상세한 에러 메시지 및 해결 방법 안내
3. ✅ 연결 테스트 스크립트 제공 (`test-neo4j.ts`)
4. ✅ 서버 로그 개선 (✓, ❌, 💡 아이콘)
5. ✅ Graceful degradation (Neo4j 없이도 작동)

---

## 권장 조치

### 즉시 조치 (권장)
1. https://console.neo4j.io/ 접속
2. Taro_master 인스턴스 상태 확인
3. Paused 상태면 "Resume" 클릭
4. `npx ts-node scripts/test-neo4j.ts` 실행
5. 서버 재시작

### 장기 대책
- 정기적으로 Neo4j Aura 콘솔에서 인스턴스 상태 확인
- 또는 로컬 Neo4j Desktop으로 전환 (안정적)

---

**현재 상태:** Neo4j 없이도 타로 마스터는 완벽하게 작동합니다! 그래프 기능이 필요하면 위 가이드를 따라 재활성화하세요. 🎯

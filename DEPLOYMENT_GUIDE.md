# Taro Master 배포 가이드

## 📋 목차
1. [로컬 개발 환경](#로컬-개발-환경)
2. [Docker 배포](#docker-배포)
3. [프로덕션 배포 (AWS)](#프로덕션-배포-aws)
4. [환경 변수](#환경-변수)
5. [트러블슈팅](#트러블슈팅)

---

## 🏠 로컬 개발 환경

### 필수 요구사항
- **Node.js**: v18.x 이상
- **Neo4j Desktop**: 5.x (또는 Neo4j Aura)
- **Qdrant**: 바이너리 실행 또는 Docker
- **macOS**: 13.7 Ventura 이상 (또는 다른 OS)

### 1. 프로젝트 클론
```bash
git clone https://github.com/david1005910/taro-master.git
cd taro-master
```

### 2. 환경 변수 설정

**backend/.env:**
```bash
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# AI APIs
GEMINI_API_KEY="your-gemini-api-key"

# Neo4j (로컬 Desktop)
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="your-neo4j-password"

# Qdrant (로컬 바이너리)
QDRANT_URL="http://localhost:6333"

# CORS
FRONTEND_URL="http://localhost:5173"
PORT=4000
```

**frontend/.env:**
```bash
VITE_API_URL=http://localhost:4000
```

### 3. 백엔드 설정
```bash
cd backend
npm install

# Prisma 설정
npm run prisma:generate
npm run prisma:push
npm run prisma:seed   # 78개 타로 카드 시딩

# Qdrant 인덱싱 (한 번만)
npx ts-node scripts/index-cards.ts

# 서버 시작
npm run dev   # http://localhost:4000
```

### 4. 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### 5. Neo4j 설정

**방법 A: Neo4j Desktop (추천 - 로컬 개발)**
1. https://neo4j.com/download/ 에서 다운로드
2. 새 데이터베이스 생성: "Taro_master"
3. 비밀번호 설정: backend/.env에 기록
4. 시작 → bolt://localhost:7687

**방법 B: Neo4j Aura (클라우드)**
1. https://console.neo4j.io/ 회원가입
2. Free tier 인스턴스 생성
3. URI + 비밀번호 복사 → backend/.env
4. URI 형식: `neo4j+s://xxxxx.databases.neo4j.io`

**방법 C: Docker (CI/CD)**
```bash
cd taro-master
docker-compose up -d neo4j
# http://localhost:7474 (Browser)
# bolt://localhost:7687 (Driver)
```

### 6. Qdrant 설정

**macOS 13.7 Ventura (Docker Desktop 불가):**
```bash
# 바이너리 다운로드
curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-apple-darwin.tar.gz | tar xz
mkdir -p /tmp/qdrant-bin
mv qdrant /tmp/qdrant-bin/

# 실행
/tmp/qdrant-bin/qdrant --storage-path /tmp/qdrant-storage &

# 확인
curl http://localhost:6333
```

**Docker (다른 OS):**
```bash
docker-compose up -d qdrant
# Dashboard: http://localhost:6333/dashboard
```

---

## 🐳 Docker 배포

### Dockerfile 생성

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Prisma 생성
RUN npx prisma generate

# 소스 코드
COPY . .

# 빌드
RUN npm run build

EXPOSE 4000

# 프로덕션 실행
CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx로 서빙
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**frontend/nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### docker-compose.yml 업데이트

**taro-master/docker-compose.yml:**
```yaml
version: '3.8'

services:
  # Neo4j 그래프 DB
  neo4j:
    image: neo4j:5.16-community
    environment:
      NEO4J_AUTH: neo4j/taromaster123
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - "7474:7474"  # Browser
      - "7687:7687"  # Bolt
    volumes:
      - neo4j_data:/data
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "taromaster123", "RETURN 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Qdrant 벡터 DB
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"  # HTTP
      - "6334:6334"  # gRPC
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 백엔드 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: file:/data/prod.db
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: taromaster123
      QDRANT_URL: http://qdrant:6333
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      FRONTEND_URL: http://localhost:3000
      PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      neo4j:
        condition: service_healthy
      qdrant:
        condition: service_healthy
    volumes:
      - backend_data:/data
    restart: unless-stopped

  # 프론트엔드
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  neo4j_data:
  qdrant_data:
  backend_data:
```

### 실행
```bash
# .env 파일 생성 (루트)
cat > .env << EOF
JWT_SECRET=your-production-secret-key
GEMINI_API_KEY=your-gemini-api-key
EOF

# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# Prisma 마이그레이션 (최초 1회)
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed

# Qdrant 인덱싱 (최초 1회)
docker-compose exec backend npx ts-node scripts/index-cards.ts

# 접속
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# Neo4j Browser: http://localhost:7474
# Qdrant Dashboard: http://localhost:6333/dashboard
```

---

## ☁️ 프로덕션 배포 (AWS)

### 아키텍처
```
┌─────────────────┐
│  CloudFront CDN │ (정적 파일 캐싱)
└────────┬────────┘
         │
┌────────▼────────┐
│  S3 + CloudFlare│ (프론트엔드)
└─────────────────┘

┌─────────────────┐
│   Route 53 DNS  │
└────────┬────────┘
         │
┌────────▼────────┐
│   ALB / API GW  │ (로드 밸런서)
└────────┬────────┘
         │
┌────────▼────────┐
│   ECS Fargate   │ (백엔드 컨테이너)
│  or EC2 + Docker│
└─────────────────┘

┌─────────────────┐
│  RDS (SQLite→   │ (프로덕션은 PostgreSQL 권장)
│     PostgreSQL) │
└─────────────────┘

┌─────────────────┐
│  Neo4j Aura     │ (관리형 그래프 DB)
└─────────────────┘

┌─────────────────┐
│  Qdrant Cloud   │ (관리형 벡터 DB)
└─────────────────┘
```

### 1. 프론트엔드 (S3 + CloudFront)

```bash
# 빌드
cd frontend
npm run build

# S3 버킷 생성
aws s3 mb s3://taro-master-frontend

# 업로드
aws s3 sync dist/ s3://taro-master-frontend --delete

# CloudFront 배포 생성 (AWS Console)
# Origin: S3 bucket
# Viewer Protocol: Redirect HTTP to HTTPS
# Custom Error: 403 → /index.html (SPA 라우팅)
```

### 2. 백엔드 (ECS Fargate)

```bash
# ECR 리포지토리 생성
aws ecr create-repository --repository-name taro-master-backend

# 이미지 빌드 및 푸시
cd backend
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

docker build -t taro-master-backend .
docker tag taro-master-backend:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/taro-master-backend:latest
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/taro-master-backend:latest

# ECS 클러스터 생성 (AWS Console)
# - Fargate 선택
# - Task Definition: 환경 변수 설정
# - Service 생성: ALB 연결
```

### 3. RDS PostgreSQL (SQLite 대체)

**backend/prisma/schema.prisma 수정:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**환경 변수:**
```bash
DATABASE_URL="postgresql://user:password@taro-db.xxxxx.rds.amazonaws.com:5432/taro"
```

**마이그레이션:**
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4. 서비스 URL 업데이트

**backend .env:**
```bash
FRONTEND_URL="https://taro-master.com"
```

**frontend .env:**
```bash
VITE_API_URL="https://api.taro-master.com"
```

---

## 🔐 환경 변수

### 필수 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `DATABASE_URL` | DB 연결 문자열 | `file:./dev.db` or `postgresql://...` |
| `JWT_SECRET` | JWT 서명 키 (32+ chars) | `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Gemini API 키 | `AIzaSy...` |
| `NEO4J_URI` | Neo4j 연결 URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j 사용자명 | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j 비밀번호 | `taromaster123` |
| `QDRANT_URL` | Qdrant API URL | `http://localhost:6333` |
| `FRONTEND_URL` | CORS 허용 도메인 | `http://localhost:5173` |
| `PORT` | 백엔드 포트 | `4000` |

### 선택 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NODE_ENV` | `development` | `production` for prod |
| `LOG_LEVEL` | `info` | `debug` | `error` |

---

## 🚨 트러블슈팅

### 1. "EADDRINUSE: address already in use :::4000"
```bash
# 포트 사용 중인 프로세스 종료
lsof -ti:4000 | xargs kill -9

# 또는 다른 포트 사용
PORT=4001 npm run dev
```

### 2. Neo4j 연결 실패
```bash
# Neo4j 상태 확인
curl http://localhost:7474

# Desktop에서 데이터베이스 시작 확인
# Aura: 인스턴스 Running 상태 확인
```

### 3. Qdrant "Connection refused"
```bash
# Qdrant 실행 중인지 확인
curl http://localhost:6333

# macOS: 바이너리 재시작
killall qdrant
/tmp/qdrant-bin/qdrant --storage-path /tmp/qdrant-storage &

# Docker:
docker-compose restart qdrant
```

### 4. Prisma "P1001: Can't reach database server"
```bash
# SQLite 파일 권한 확인
ls -la backend/prisma/dev.db

# PostgreSQL: 연결 문자열 확인
echo $DATABASE_URL
```

### 5. "Gemini API key is not configured"
```bash
# 환경 변수 로드 확인
echo $GEMINI_API_KEY

# .env 파일 존재 확인
cat backend/.env | grep GEMINI
```

### 6. 카드 이미지 표시 안됨
```bash
# 이미지 파일 확인
ls frontend/public/cards/ | wc -l   # 79 (78 + card-back.jpg)

# Vite dev server 재시작
cd frontend
npm run dev
```

### 7. Docker 빌드 실패
```bash
# 캐시 삭제 후 재빌드
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 모니터링

### HealthCheck 엔드포인트
```bash
# 백엔드
curl http://localhost:4000/health
→ { "status": "ok", "neo4j": true, "qdrant": true }

# Neo4j
curl http://localhost:7474
→ Neo4j Browser

# Qdrant
curl http://localhost:6333/health
→ { "status": "ok" }
```

### 로그 확인
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f neo4j
docker-compose logs -f qdrant

# PM2 (프로덕션)
pm2 logs taro-backend
pm2 monit
```

---

## 🔄 업데이트 배포

### 제로 다운타임 배포

```bash
# 1. 새 버전 빌드
git pull origin main
docker-compose build backend

# 2. 롤링 업데이트
docker-compose up -d --no-deps --build backend

# 3. 헬스체크 확인
curl http://localhost:4000/health
```

### 데이터베이스 마이그레이션

```bash
# Prisma 마이그레이션
docker-compose exec backend npx prisma migrate deploy

# 백업 먼저!
docker-compose exec backend npx prisma db pull
```

---

## 📈 성능 최적화

### 프로덕션 체크리스트

- [ ] `NODE_ENV=production` 설정
- [ ] JWT_SECRET 강력한 키 사용
- [ ] CORS 도메인 제한
- [ ] Rate Limiting 활성화
- [ ] Helmet security headers
- [ ] Database connection pooling
- [ ] Redis 캐싱 (선택)
- [ ] CDN 사용 (정적 파일)
- [ ] Gzip compression
- [ ] HTTP/2 활성화
- [ ] SSL/TLS 인증서 (Let's Encrypt)

---

## 🆘 Support

- **GitHub Issues**: https://github.com/david1005910/taro-master/issues
- **Email**: support@taro-master.com
- **Discord**: https://discord.gg/taromaster

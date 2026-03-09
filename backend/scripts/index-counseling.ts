/**
 * 타로심리상담사 교안 PDF → Qdrant 인덱싱 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/index-counseling.ts          # 미인덱싱 시만 실행
 *   npx ts-node scripts/index-counseling.ts --force  # 강제 재인덱싱
 */

import * as fs from 'fs';
import * as path from 'path';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

dotenv.config();

const COLLECTION_NAME = 'tarot_counseling';
const VECTOR_SIZE = 3072; // gemini-embedding-001
const PDF_DIR = path.join(__dirname, '../data/counseling');
const FORCE = process.argv.includes('--force');

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in .env');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// ─── BM25 (기존 rag.service.ts 와 동일 구현) ─────────────────────────────────
class BM25Vectorizer {
  private vocab: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private k1 = 1.5;
  private b = 0.75;
  private avgDocLen = 0;

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\n,，。、()（）【】\[\]]+/)
      .filter(t => t.length > 0);
  }

  fit(documents: string[]): void {
    const N = documents.length;
    let totalLen = 0;
    const df: Map<string, number> = new Map();
    documents.forEach(doc => {
      const tokens = this.tokenize(doc);
      totalLen += tokens.length;
      const seen = new Set<string>();
      tokens.forEach(token => {
        if (!this.vocab.has(token)) this.vocab.set(token, this.vocab.size);
        if (!seen.has(token)) {
          df.set(token, (df.get(token) || 0) + 1);
          seen.add(token);
        }
      });
    });
    this.avgDocLen = totalLen / N;
    df.forEach((count, term) => {
      this.idf.set(term, Math.log(1 + (N - count + 0.5) / (count + 0.5)));
    });
  }

  transform(text: string, docLen?: number): { indices: number[]; values: number[] } {
    const tokens = this.tokenize(text);
    const tf: Map<string, number> = new Map();
    tokens.forEach(token => tf.set(token, (tf.get(token) || 0) + 1));
    const len = docLen ?? tokens.length;
    const indices: number[] = [];
    const values: number[] = [];
    tf.forEach((count, term) => {
      const idx = this.vocab.get(term);
      const idfVal = this.idf.get(term);
      if (idx !== undefined && idfVal !== undefined) {
        const tfScore = (count * (this.k1 + 1)) / (count + this.k1 * (1 - this.b + this.b * len / this.avgDocLen));
        const score = idfVal * tfScore;
        if (score > 0) { indices.push(idx); values.push(score); }
      }
    });
    return { indices, values };
  }
}

// ─── PDF 청크 타입 ────────────────────────────────────────────────────────────
interface CounselingChunk {
  id: number;
  lecture: string;   // "1강-타로카드란 무엇인가"
  page: number;      // 0-based
  text: string;
  source: string;    // 파일명
}

// ─── 텍스트 정제 ─────────────────────────────────────────────────────────────
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── PDF → 청크 추출 ──────────────────────────────────────────────────────────
async function extractChunks(): Promise<CounselingChunk[]> {
  const files = fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort();

  const chunks: CounselingChunk[] = [];
  let idCounter = 1;

  for (const fname of files) {
    const fpath = path.join(PDF_DIR, fname);
    const dataBuffer = fs.readFileSync(fpath);
    const lectureName = fname.replace('.pdf', '');

    let parsed: { text: string; numpages: number };
    try {
      parsed = await pdfParse(dataBuffer);
    } catch (e) {
      console.warn(`[WARN] Failed to parse ${fname}:`, e);
      continue;
    }

    // 페이지별 분리 (pdf-parse는 페이지 구분자 없이 전체 text 제공)
    // → 페이지별 렌더링이 어려우므로 전체 텍스트를 하나의 청크로 + 강의별 청크로 활용
    // 단, 150자 이상인 페이지만 포함 (빈 슬라이드 제외)
    const fullText = cleanText(parsed.text);

    if (fullText.length < 50) {
      console.log(`  [SKIP] ${fname}: 텍스트 없음`);
      continue;
    }

    // 전체 강의를 하나의 청크로 (의미 단위 보존)
    chunks.push({
      id: idCounter++,
      lecture: lectureName,
      page: 0,
      text: fullText,
      source: fname
    });

    // 추가: 300자 단위로 슬라이딩 윈도우 청킹 (세밀한 검색용)
    const CHUNK_SIZE = 300;
    const OVERLAP = 50;
    let start = 0;
    let subPage = 1;
    while (start < fullText.length) {
      const end = start + CHUNK_SIZE;
      const chunk = fullText.slice(start, end).trim();
      if (chunk.length >= 80) { // 너무 짧은 청크 제외
        chunks.push({
          id: idCounter++,
          lecture: lectureName,
          page: subPage,
          text: chunk,
          source: fname
        });
        subPage++;
      }
      start += CHUNK_SIZE - OVERLAP;
    }

    console.log(`  ✓ ${fname}: ${subPage}개 청크 생성 (총 ${fullText.length}자)`);
  }

  return chunks;
}

// ─── Gemini 임베딩 (rate limit 대응) ─────────────────────────────────────────
async function embedWithRetry(text: string, label: string): Promise<number[]> {
  let retries = 0;
  while (true) {
    try {
      const result = await embedModel.embedContent(text);
      return result.embedding.values;
    } catch (e: any) {
      if ((e.message?.includes('429') || e.message?.includes('quota')) && retries < 5) {
        console.log(`  [Rate Limit] ${label} — 65초 대기 후 재시도...`);
        await new Promise(r => setTimeout(r, 65000));
        retries++;
      } else throw e;
    }
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔮 타로심리상담사 교안 인덱싱 시작\n');

  // Qdrant 연결 확인
  await qdrant.versionInfo();
  console.log('✓ Qdrant 연결 OK');

  // 컬렉션 처리
  const exists = await qdrant.collectionExists(COLLECTION_NAME);
  if (exists.exists) {
    if (FORCE) {
      await qdrant.deleteCollection(COLLECTION_NAME);
      console.log(`✓ 기존 컬렉션 '${COLLECTION_NAME}' 삭제`);
    } else {
      const info = await qdrant.getCollection(COLLECTION_NAME);
      const count = info.points_count ?? 0;
      if (count > 0) {
        console.log(`✓ 이미 인덱싱됨 (${count}개 청크). --force 옵션으로 재인덱싱 가능.`);
        process.exit(0);
      }
    }
  }

  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: {
      dense: { size: VECTOR_SIZE, distance: 'Cosine' }
    },
    sparse_vectors: { bm25: {} }
  });
  console.log(`✓ 컬렉션 '${COLLECTION_NAME}' 생성\n`);

  // PDF 텍스트 추출
  console.log('📄 PDF 텍스트 추출 중...');
  const chunks = await extractChunks();
  console.log(`\n총 ${chunks.length}개 청크 추출 완료\n`);

  if (chunks.length === 0) {
    console.error('청크가 없습니다. PDF 파일을 확인하세요.');
    process.exit(1);
  }

  // BM25 fit
  const bm25 = new BM25Vectorizer();
  bm25.fit(chunks.map(c => c.text));
  console.log('✓ BM25 학습 완료');

  // 임베딩 + Upsert
  console.log('\n🔢 Gemini 임베딩 생성 중... (1초 간격)\n');
  const points = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (i > 0) await new Promise(r => setTimeout(r, 1000));

    const label = `${chunk.lecture} (청크 ${chunk.page})`;
    const embedding = await embedWithRetry(chunk.text, label);
    const { indices, values } = bm25.transform(chunk.text);

    points.push({
      id: chunk.id,
      vector: {
        dense: embedding,
        bm25: { indices, values }
      },
      payload: {
        lecture: chunk.lecture,
        page: chunk.page,
        text: chunk.text,
        source: chunk.source
      }
    });

    if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
      console.log(`  [${i + 1}/${chunks.length}] ${chunk.lecture}`);
    }
  }

  // Qdrant Upsert (배치 100개씩)
  const BATCH = 100;
  for (let i = 0; i < points.length; i += BATCH) {
    const batch = points.slice(i, i + BATCH);
    await qdrant.upsert(COLLECTION_NAME, { points: batch });
  }

  console.log(`\n✅ 인덱싱 완료! ${points.length}개 청크 → '${COLLECTION_NAME}' 컬렉션`);
  console.log('\n서버 재시작 없이 바로 검색 가능합니다.');
}

main().catch(e => {
  console.error('\n❌ 오류:', e.message || e);
  process.exit(1);
});

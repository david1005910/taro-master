/**
 * 일회성 타로 카드 RAG 인덱싱 스크립트
 * 실행: npx ts-node scripts/index-cards.ts
 *
 * Gemini text-embedding-004 (768 dim) — rate limit 여유로움
 */
import dotenv from 'dotenv';
dotenv.config();

import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const COLLECTION_NAME = 'tarot_cards';
const VECTOR_SIZE = 3072; // gemini-embedding-001

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embedModel = genai.getGenerativeModel({ model: 'gemini-embedding-001' });
const prisma = new PrismaClient();

function buildDocument(card: any): string {
  const keywords = (() => {
    try { return JSON.parse(card.keywords) as string[]; }
    catch { return card.keywords.split(',').map((k: string) => k.trim()); }
  })();
  return [
    `카드: ${card.nameKo} (${card.nameEn})`,
    `유형: ${card.type}${card.suit ? ' ' + card.suit : ''}`,
    `키워드: ${keywords.join(', ')}`,
    `정방향: ${card.uprightMeaning}`,
    `역방향: ${card.reversedMeaning}`,
    `상징: ${card.symbolism}`,
    `사랑: ${card.love}`,
    `직업: ${card.career}`,
    `건강: ${card.health}`,
    `재정: ${card.finance}`
  ].join('\n');
}

class BM25Vectorizer {
  private vocab = new Map<string, number>();
  private idf = new Map<string, number>();
  private k1 = 1.5; private b = 0.75; private avgDocLen = 0;

  private tokenize(text: string) {
    return text.toLowerCase().split(/[\s\n,，。、()（）【】\[\]]+/).filter(t => t.length > 0);
  }
  fit(docs: string[]) {
    const N = docs.length; let total = 0;
    const df = new Map<string, number>();
    docs.forEach(doc => {
      const tokens = this.tokenize(doc); total += tokens.length;
      const seen = new Set<string>();
      tokens.forEach(t => {
        if (!this.vocab.has(t)) this.vocab.set(t, this.vocab.size);
        if (!seen.has(t)) { df.set(t, (df.get(t) || 0) + 1); seen.add(t); }
      });
    });
    this.avgDocLen = total / N;
    df.forEach((c, t) => this.idf.set(t, Math.log(1 + (N - c + 0.5) / (c + 0.5))));
  }
  transform(text: string) {
    const tokens = this.tokenize(text);
    const tf = new Map<string, number>();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const len = tokens.length;
    const indices: number[] = [], values: number[] = [];
    tf.forEach((c, t) => {
      const idx = this.vocab.get(t), idfVal = this.idf.get(t);
      if (idx !== undefined && idfVal !== undefined) {
        const tfScore = (c * (this.k1 + 1)) / (c + this.k1 * (1 - this.b + this.b * len / this.avgDocLen));
        const score = idfVal * tfScore;
        if (score > 0) { indices.push(idx); values.push(score); }
      }
    });
    return { indices, values };
  }
}

async function main() {
  console.log('=== 타로 카드 RAG 인덱싱 (Gemini text-embedding-004) ===\n');

  await qdrant.versionInfo();
  console.log('✓ Qdrant 연결 성공');

  // 컬렉션 초기화 (차원 변경으로 재생성)
  const exists = await qdrant.collectionExists(COLLECTION_NAME);
  if (exists.exists) {
    const info = await qdrant.getCollection(COLLECTION_NAME);
    const count = info.points_count ?? 0;
    if (count >= 78) {
      console.log(`✓ 이미 인덱싱 완료 (${count}개 카드)`);
      await prisma.$disconnect(); return;
    }
    await qdrant.deleteCollection(COLLECTION_NAME);
    console.log('- 기존 컬렉션 삭제 (재생성)');
  }
  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: { dense: { size: VECTOR_SIZE, distance: 'Cosine' } },
    sparse_vectors: { bm25: {} }
  });
  console.log(`✓ 컬렉션 생성 (${VECTOR_SIZE}dim)\n`);

  const cards = await prisma.card.findMany({ orderBy: [{ type: 'asc' }, { number: 'asc' }] });
  const docs = cards.map(buildDocument);
  console.log(`✓ 카드 ${cards.length}개 로드`);

  const bm25 = new BM25Vectorizer();
  bm25.fit(docs);

  // Gemini 임베딩 — 1s 간격 + 429 자동 재시도
  console.log('Gemini 임베딩 시작... (1s 간격, 자동 재시도)\n');
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < docs.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1000));
    let retries = 0;
    while (true) {
      try {
        const result = await embedModel.embedContent(docs[i]);
        allEmbeddings.push(result.embedding.values);
        break;
      } catch (e: any) {
        if (e.message?.includes('429') && retries < 5) {
          const wait = 65000; // 65초 대기 후 재시도
          process.stdout.write(`  ⚠ Rate limit (${i + 1}번 카드), ${wait / 1000}초 대기...\n`);
          await new Promise(r => setTimeout(r, wait));
          retries++;
        } else throw e;
      }
    }
    if ((i + 1) % 10 === 0 || i === docs.length - 1) {
      process.stdout.write(`  ${i + 1}/${docs.length} 완료\n`);
    }
  }
  console.log('\n✓ 전체 임베딩 완료');

  const points = cards.map((card, idx) => {
    const { indices, values } = bm25.transform(docs[idx]);
    const keywords = (() => {
      try { return JSON.parse(card.keywords) as string[]; }
      catch { return card.keywords.split(',').map((k: string) => k.trim()); }
    })();
    return {
      id: card.id,
      vector: { dense: allEmbeddings[idx], bm25: { indices, values } },
      payload: { ...card, keywords }
    };
  });

  await qdrant.upsert(COLLECTION_NAME, { points });
  console.log(`✓ Qdrant에 ${points.length}개 카드 저장 완료`);
  console.log('\n=== 완료! ===');

  await prisma.$disconnect();
}

main().catch(e => { console.error('오류:', e.message); process.exit(1); });

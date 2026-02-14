import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import prisma from '../utils/prisma';

const COLLECTION_NAME = 'tarot_cards';
const VECTOR_SIZE = 3072; // gemini-embedding-001 output dimension

interface CardDocument {
  id: number;
  nameKo: string;
  nameEn: string;
  type: string;
  suit: string | null;
  number: number;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  symbolism: string;
  love: string;
  career: string;
  health: string;
  finance: string;
}

export interface SearchResult {
  card: CardDocument;
  score: number;
  rank: number;
}

export interface CompareSearchResult {
  query: string;
  semantic: SearchResult[];
  sparse: SearchResult[];
  hybrid: SearchResult[];
  timing: {
    semantic_ms: number;
    sparse_ms: number;
    hybrid_ms: number;
  };
}

// BM25 sparse vector implementation
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
        if (!this.vocab.has(token)) {
          this.vocab.set(token, this.vocab.size);
        }
        if (!seen.has(token)) {
          df.set(token, (df.get(token) || 0) + 1);
          seen.add(token);
        }
      });
    });

    this.avgDocLen = totalLen / N;

    // Compute IDF: log(1 + (N - df + 0.5) / (df + 0.5))
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
        // BM25 TF score
        const tfScore = (count * (this.k1 + 1)) / (count + this.k1 * (1 - this.b + this.b * len / this.avgDocLen));
        const score = idfVal * tfScore;
        if (score > 0) {
          indices.push(idx);
          values.push(score);
        }
      }
    });

    return { indices, values };
  }
}

function buildDocument(card: CardDocument): string {
  return [
    `카드: ${card.nameKo} (${card.nameEn})`,
    `유형: ${card.type}${card.suit ? ' ' + card.suit : ''}`,
    `키워드: ${card.keywords.join(', ')}`,
    `정방향: ${card.uprightMeaning}`,
    `역방향: ${card.reversedMeaning}`,
    `상징: ${card.symbolism}`,
    `사랑: ${card.love}`,
    `직업: ${card.career}`,
    `건강: ${card.health}`,
    `재정: ${card.finance}`
  ].join('\n');
}

class TarotRAGService {
  private qdrant: QdrantClient;
  private embedModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
  private bm25 = new BM25Vectorizer();
  private initialized = false;
  private cardCount = 0;

  constructor() {
    this.qdrant = new QdrantClient({ url: config.QDRANT_URL });
    if (config.GEMINI_API_KEY) {
      const genai = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      this.embedModel = genai.getGenerativeModel({ model: 'gemini-embedding-001' });
    }
  }

  async initialize(): Promise<void> {
    if (!this.embedModel) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Test Qdrant connection
    await this.qdrant.versionInfo();

    // Create collection if it doesn't exist
    const exists = await this.qdrant.collectionExists(COLLECTION_NAME);
    if (!exists.exists) {
      await this.qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          dense: { size: VECTOR_SIZE, distance: 'Cosine' }
        },
        sparse_vectors: {
          bm25: {}
        }
      });
      console.log(`[RAG] Created collection: ${COLLECTION_NAME}`);
    }

    // Load existing card count
    const info = await this.qdrant.getCollection(COLLECTION_NAME);
    this.cardCount = info.points_count ?? 0;

    // Fit BM25 on all card documents (even if already indexed)
    if (this.cardCount === 0) {
      await this.fitBM25();
    }

    this.initialized = true;
  }

  private async fitBM25(): Promise<void> {
    const cards = await this.loadCards();
    const docs = cards.map(buildDocument);
    this.bm25.fit(docs);
  }

  private async loadCards(): Promise<CardDocument[]> {
    const raw = await prisma.card.findMany({ orderBy: [{ type: 'asc' }, { number: 'asc' }] });
    return raw.map((c) => ({
      ...c,
      keywords: (() => {
        try { return JSON.parse(c.keywords) as string[]; }
        catch { return c.keywords.split(',').map((k: string) => k.trim()); }
      })()
    }));
  }

  async indexAllCards(): Promise<void> {
    if (!this.initialized) throw new Error('Not initialized');
    if (!this.embedModel) throw new Error('Gemini embed model not initialized');

    const info = await this.qdrant.getCollection(COLLECTION_NAME);
    if ((info.points_count ?? 0) >= 78) {
      console.log(`[RAG] ${info.points_count} cards already indexed, skipping`);
      this.cardCount = info.points_count ?? 0;
      // Still fit BM25 for query-time use
      await this.fitBM25();
      return;
    }

    const cards = await this.loadCards();
    const docs = cards.map(buildDocument);

    // Fit BM25 corpus
    this.bm25.fit(docs);

    // Gemini gemini-embedding-001: 1s 간격 + 429 자동 재시도
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < docs.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 1000));
      let retries = 0;
      while (true) {
        try {
          const result = await this.embedModel.embedContent(docs[i]);
          allEmbeddings.push(result.embedding.values);
          break;
        } catch (e: any) {
          if (e.message?.includes('429') && retries < 5) {
            console.log(`[RAG] Rate limit, 65s 대기 후 재시도 (${i + 1}번 카드)...`);
            await new Promise(r => setTimeout(r, 65000));
            retries++;
          } else throw e;
        }
      }
      if ((i + 1) % 10 === 0 || i === docs.length - 1) {
        console.log(`[RAG] Embedded ${i + 1}/${docs.length} cards`);
      }
    }

    // Upsert to Qdrant
    const points = cards.map((card, idx) => {
      const { indices, values } = this.bm25.transform(docs[idx]);
      return {
        id: card.id,
        vector: {
          dense: allEmbeddings[idx],
          bm25: { indices, values }
        },
        payload: {
          id: card.id,
          nameKo: card.nameKo,
          nameEn: card.nameEn,
          type: card.type,
          suit: card.suit,
          number: card.number,
          keywords: card.keywords,
          uprightMeaning: card.uprightMeaning,
          reversedMeaning: card.reversedMeaning,
          symbolism: card.symbolism,
          love: card.love,
          career: card.career,
          health: card.health,
          finance: card.finance
        }
      };
    });

    await this.qdrant.upsert(COLLECTION_NAME, { points });
    this.cardCount = cards.length;
    console.log(`[RAG] Indexed ${cards.length} tarot cards`);
  }

  private async embedQuery(query: string): Promise<number[]> {
    if (!this.embedModel) throw new Error('Gemini embed model not initialized');
    let retries = 0;
    while (true) {
      try {
        const result = await this.embedModel.embedContent(query);
        return result.embedding.values;
      } catch (e: any) {
        if (e.message?.includes('429') && retries < 3) {
          console.log(`[RAG] Rate limit on query, 65s 대기...`);
          await new Promise(r => setTimeout(r, 65000));
          retries++;
        } else throw e;
      }
    }
  }

  async semanticSearch(query: string, limit = 5): Promise<SearchResult[]> {
    const vector = await this.embedQuery(query);
    const results = await this.qdrant.search(COLLECTION_NAME, {
      vector: { name: 'dense', vector },
      limit,
      with_payload: true
    });

    return results.map((r, i) => ({
      card: r.payload as unknown as CardDocument,
      score: r.score,
      rank: i + 1
    }));
  }

  async sparseSearch(query: string, limit = 5): Promise<SearchResult[]> {
    const { indices, values } = this.bm25.transform(query);
    if (indices.length === 0) return [];

    const results = await this.qdrant.search(COLLECTION_NAME, {
      vector: { name: 'bm25', vector: { indices, values } },
      limit,
      with_payload: true
    });

    return results.map((r, i) => ({
      card: r.payload as unknown as CardDocument,
      score: r.score,
      rank: i + 1
    }));
  }

  async hybridSearch(query: string, limit = 5): Promise<SearchResult[]> {
    const denseVector = await this.embedQuery(query);
    const { indices, values } = this.bm25.transform(query);

    const prefetch: any[] = [
      { query: denseVector, using: 'dense', limit: 20 }
    ];

    if (indices.length > 0) {
      prefetch.push({ query: { indices, values }, using: 'bm25', limit: 20 });
    }

    const results = await this.qdrant.query(COLLECTION_NAME, {
      prefetch,
      query: { fusion: 'rrf' },
      limit,
      with_payload: true
    });

    return results.points.map((r, i) => ({
      card: r.payload as unknown as CardDocument,
      score: r.score,
      rank: i + 1
    }));
  }

  async compareSearch(query: string, limit = 5): Promise<CompareSearchResult> {
    const t0 = Date.now();
    const semantic = await this.semanticSearch(query, limit);
    const t1 = Date.now();
    const sparse = await this.sparseSearch(query, limit);
    const t2 = Date.now();
    const hybrid = await this.hybridSearch(query, limit);
    const t3 = Date.now();

    return {
      query,
      semantic,
      sparse,
      hybrid,
      timing: {
        semantic_ms: t1 - t0,
        sparse_ms: t2 - t1,
        hybrid_ms: t3 - t2
      }
    };
  }

  isInitialized(): boolean { return this.initialized; }
  getCardCount(): number { return this.cardCount; }
}

export const ragService = new TarotRAGService();

import app from './app';
import { config } from './config/env';
import { ragService } from './services/rag.service';
import { neo4jGraphService } from './services/neo4j.service';
import prisma from './utils/prisma';

const PORT = config.PORT;

// RAG 초기화 (비동기)
async function initializeRAG() {
  try {
    await ragService.initialize();
    await ragService.indexAllCards();
    console.log('[RAG] Qdrant initialized with tarot cards');
  } catch (error: any) {
    console.log('[RAG] Initialization skipped:', error.message);
  }
}

// Neo4j 그래프 초기화 (비동기)
async function initializeNeo4j() {
  try {
    const ok = await neo4jGraphService.connect();
    if (!ok) {
      console.log('[Neo4j] 비활성화 (NEO4J_PASSWORD 미설정 또는 연결 실패)');
      return;
    }
    await neo4jGraphService.initializeSchema();
    const cards = await prisma.card.findMany({
      orderBy: [{ type: 'asc' }, { number: 'asc' }]
    });
    await neo4jGraphService.seedTarotGraph(cards);
    console.log('[Neo4j] 78개 타로 카드 그래프 초기화 완료');
  } catch (e: any) {
    console.log('[Neo4j] 초기화 건너뜀:', e.message);
  }
}

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);

  // RAG + Neo4j 초기화 (백그라운드, 병렬)
  initializeRAG();
  initializeNeo4j();
});

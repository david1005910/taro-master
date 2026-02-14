import app from './app';
import { config } from './config/env';
import { neo4jService } from './services/neo4j.service';
import { ragService } from './services/rag.service';

const PORT = config.PORT;

// Neo4j 초기화 (비동기)
async function initializeNeo4j() {
  try {
    const connected = await neo4jService.connect();
    if (connected) {
      await neo4jService.initializeSchema();
      await neo4jService.seedRelationships();
      await neo4jService.seedAdvancedRelationships();
      await neo4jService.seedCardRelationships();
      console.log('[Neo4j] Graph database initialized (천간합/지지충/삼합/육합 + 카드관계)');
    } else {
      console.log('[Neo4j] Running without graph database - using local data');
    }
  } catch (error: any) {
    console.log('[Neo4j] Initialization skipped:', error.message);
  }
}

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

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);

  // Neo4j 초기화 (백그라운드)
  initializeNeo4j();

  // RAG 초기화 (백그라운드)
  initializeRAG();
});

// 종료 시 Neo4j 연결 해제
process.on('SIGINT', async () => {
  await neo4jService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await neo4jService.close();
  process.exit(0);
});

import app from './app';
import { config } from './config/env';
import { neo4jService } from './services/neo4j.service';

const PORT = config.PORT;

// Neo4j 초기화 (비동기)
async function initializeNeo4j() {
  try {
    const connected = await neo4jService.connect();
    if (connected) {
      await neo4jService.initializeSchema();
      await neo4jService.seedRelationships();
      console.log('[Neo4j] Graph database initialized with Saju-Tarot relationships');
    } else {
      console.log('[Neo4j] Running without graph database - using local data');
    }
  } catch (error: any) {
    console.log('[Neo4j] Initialization skipped:', error.message);
  }
}

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);

  // Neo4j 초기화 (백그라운드)
  initializeNeo4j();
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

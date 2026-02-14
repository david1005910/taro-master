import app from './app';
import { config } from './config/env';
import { ragService } from './services/rag.service';

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

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);

  // RAG 초기화 (백그라운드)
  initializeRAG();
});

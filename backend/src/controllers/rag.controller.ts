import { Request, Response } from 'express';
import { ragService } from '../services/rag.service';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  mode: z.enum(['semantic', 'sparse', 'hybrid', 'compare']).default('hybrid'),
  limit: z.number().int().min(1).max(20).default(5)
});

class RAGController {
  async status(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        qdrant: ragService.isInitialized(),
        cardCount: ragService.getCardCount()
      }
    });
  }

  async indexCards(_req: Request, res: Response) {
    try {
      await ragService.indexAllCards();
      res.json({
        success: true,
        data: { message: '카드 인덱싱 완료', cardCount: ragService.getCardCount() }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INDEX_ERROR', message: error.message }
      });
    }
  }

  async search(req: Request, res: Response) {
    const parsed = searchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message }
      });
    }

    const { query, mode, limit } = parsed.data;

    if (!ragService.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: { code: 'NOT_READY', message: 'RAG 서비스가 초기화되지 않았습니다' }
      });
    }

    try {
      if (mode === 'compare') {
        const result = await ragService.compareSearch(query, limit);
        return res.json({ success: true, data: result });
      }

      let results;
      if (mode === 'semantic') {
        results = await ragService.semanticSearch(query, limit);
      } else if (mode === 'sparse') {
        results = await ragService.sparseSearch(query, limit);
      } else {
        results = await ragService.hybridSearch(query, limit);
      }

      return res.json({ success: true, data: { query, mode, results } });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SEARCH_ERROR', message: error.message }
      });
    }
  }
}

export const ragController = new RAGController();

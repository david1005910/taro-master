import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  neo4jService,
  SajuInfo,
  HeavenlyStem,
  EarthlyBranch
} from '../services/neo4j.service';
import { ragService } from '../services/rag.service';
import { z } from 'zod';

// 사주 기둥 스키마
const sajuPillarSchema = z.object({
  stem: z.enum(['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']),
  branch: z.enum(['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'])
});

// 사주 정보 스키마
const sajuInfoSchema = z.object({
  yearPillar: sajuPillarSchema,
  monthPillar: sajuPillarSchema,
  dayPillar: sajuPillarSchema,
  hourPillar: sajuPillarSchema
});

// 타로 카드 스키마
const tarotCardSchema = z.object({
  number: z.number().min(0).max(21),
  suit: z.enum(['MAJOR', 'WANDS', 'CUPS', 'SWORDS', 'PENTACLES']),
  isReversed: z.boolean().optional().default(false)
});

// 종합 리딩 요청 스키마
const combinedReadingSchema = z.object({
  saju: sajuInfoSchema,
  tarotCards: z.array(tarotCardSchema)
});

// 하이브리드 검색 요청 스키마
const hybridSearchSchema = z.object({
  saju: sajuInfoSchema,
  customQuery: z.string().optional(),
  limit: z.number().min(1).max(20).optional().default(5)
});

// 오행 한국어 변환
const ELEMENT_KOREAN: Record<string, string> = {
  'WOOD': '목(木)', 'FIRE': '화(火)', 'EARTH': '토(土)',
  'METAL': '금(金)', 'WATER': '수(水)'
};

export class SajuTarotController {
  // 사주 기반 추천 타로 카드
  async getRecommendedCards(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const saju = sajuInfoSchema.parse(req.body);
      const result = await neo4jService.getRecommendedCards(saju);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  }

  // 타로 카드와 사주 관계 조회
  async getCardRelations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { number, suit } = req.params;
      const cardNumber = parseInt(number);

      if (isNaN(cardNumber)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CARD_NUMBER', message: '유효하지 않은 카드 번호입니다.' }
        });
      }

      const result = await neo4jService.getCardSajuRelations(cardNumber, suit.toUpperCase());

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { code: 'CARD_NOT_FOUND', message: '해당 카드를 찾을 수 없습니다.' }
        });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // 사주-타로 종합 리딩
  async getCombinedReading(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { saju, tarotCards } = combinedReadingSchema.parse(req.body);
      const result = await neo4jService.getCombinedReading(saju, tarotCards);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  }

  // 오행 분석
  async analyzeElements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const saju = sajuInfoSchema.parse(req.body);
      const elements = neo4jService.analyzeSajuElements(saju);
      const total = Object.values(elements).reduce((a, b) => a + b, 0);

      const analysis = Object.entries(elements).map(([element, count]) => ({
        element,
        count,
        percentage: Math.round((count / total) * 100)
      })).sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        data: {
          elements: analysis,
          dominant: analysis[0].element,
          weak: analysis[analysis.length - 1].element
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  }

  // 사주 그래프 종합 인사이트 (천간합/지지충/삼합/육합 포함)
  async getGraphInsight(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const saju = sajuInfoSchema.parse(req.body);
      const result = await neo4jService.getSajuGraphInsight(saju);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  }

  // Graph + RAG 하이브리드 검색
  // Neo4j 그래프 분석 결과를 시맨틱 쿼리로 변환 → Qdrant RAG 검색 병행
  async hybridSearch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { saju, customQuery, limit } = hybridSearchSchema.parse(req.body);

      // 1. 그래프 분석
      const graphInsight = await neo4jService.getSajuGraphInsight(saju);
      const { dominantElement, weakElement, conflictsAndHarmonies, insights } = graphInsight;

      // 2. 사주 분석을 시맨틱 쿼리 문자열로 변환
      let semanticQuery = customQuery || '';
      if (!semanticQuery) {
        const parts: string[] = [];
        parts.push(`${ELEMENT_KOREAN[dominantElement]} 에너지`);
        if (conflictsAndHarmonies.stemCombinations.length > 0) {
          parts.push(conflictsAndHarmonies.stemCombinations.map(c => c.name).join(', '));
        }
        if (conflictsAndHarmonies.branchConflicts.length > 0) {
          parts.push(conflictsAndHarmonies.branchConflicts.map(c => c.name + ' 갈등').join(', '));
        }
        if (conflictsAndHarmonies.tripleHarmonies.length > 0) {
          parts.push(conflictsAndHarmonies.tripleHarmonies.map(h => h.name).join(', '));
        }
        if (conflictsAndHarmonies.sixHarmonies.length > 0) {
          parts.push(conflictsAndHarmonies.sixHarmonies.map(h => h.name).join(', '));
        }
        parts.push(`약한 ${ELEMENT_KOREAN[weakElement]} 보완`);
        semanticQuery = parts.join(' ');
      }

      // 3. RAG 하이브리드 검색 (Qdrant)
      let ragResults: any[] = [];
      const ragAvailable = ragService.isInitialized();
      if (ragAvailable) {
        try {
          ragResults = await ragService.hybridSearch(semanticQuery, limit);
        } catch (e) {
          // RAG 에러 시 빈 배열 유지
        }
      }

      // 4. 결과 통합
      res.json({
        success: true,
        data: {
          saju: {
            analysis: graphInsight.analysis,
            elementBalance: graphInsight.elementBalance,
            dominantElement,
            weakElement,
            conflictsAndHarmonies,
            insights
          },
          semanticQuery,
          graphCards: graphInsight.graphCards,
          ragCards: ragResults,
          ragAvailable,
          neo4jAvailable: neo4jService.isReady()
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  }

  // 타로 리딩 그래프 분석
  async readingAnalysis(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        cards: z.array(z.object({
          number: z.number().min(0).max(21),
          suit: z.enum(['MAJOR', 'WANDS', 'CUPS', 'SWORDS', 'PENTACLES'])
        })).min(1).max(10)
      });
      const { cards } = schema.parse(req.body);
      const result = await neo4jService.analyzeReadingByGraph(cards);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  }

  // Neo4j 연결 상태 확인
  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: {
          neo4jConnected: neo4jService.isReady(),
          ragInitialized: ragService.isInitialized(),
          ragCardCount: ragService.getCardCount(),
          message: neo4jService.isReady()
            ? 'Neo4j 그래프 데이터베이스가 연결되어 있습니다.'
            : 'Neo4j가 연결되지 않았습니다. 로컬 데이터를 사용합니다.'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sajuTarotController = new SajuTarotController();

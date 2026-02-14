import { api } from './api';

// 오행 타입
export type FiveElement = 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER';

// 천간 타입
export type HeavenlyStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';

// 지지 타입
export type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';

// 타로 슈트
export type TarotSuit = 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES' | 'MAJOR';

// 사주 기둥
export interface SajuPillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

// 사주 정보
export interface SajuInfo {
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar;
}

// 추천 카드 결과
export interface RecommendedCardsResult {
  cards: Array<{
    number: number;
    suit: string;
    reason: string;
    strength: number;
  }>;
  dominantElement: FiveElement;
  weakElement: FiveElement;
  analysis: string;
}

// 카드 관계 결과
export interface CardRelationsResult {
  element: FiveElement;
  relatedStems: HeavenlyStem[];
  relatedBranches: EarthlyBranch[];
  generatingElement: FiveElement;
  destroyingElement: FiveElement;
}

// 오행 분석 결과
export interface ElementAnalysisResult {
  elements: Array<{
    element: string;
    count: number;
    percentage: number;
  }>;
  dominant: string;
  weak: string;
}

// 종합 리딩 결과
export interface CombinedReadingResult {
  harmony: number;
  insights: string[];
  recommendations: string[];
}

// 충합 분석 결과
export interface ConflictsAndHarmonies {
  stemCombinations: Array<{ name: string; element: FiveElement; stems: string[] }>;
  branchConflicts: Array<{ name: string; branches: string[] }>;
  tripleHarmonies: Array<{ name: string; element: FiveElement; branches: string[] }>;
  sixHarmonies: Array<{ name: string; element: FiveElement; branches: string[] }>;
}

// 그래프 인사이트 결과
export interface GraphInsightResult {
  elementBalance: Record<FiveElement, number>;
  dominantElement: FiveElement;
  weakElement: FiveElement;
  conflictsAndHarmonies: ConflictsAndHarmonies;
  graphCards: Array<{ number: number; suit: string; reason: string; strength: number; path?: string }>;
  analysis: string;
  insights: string[];
}

// 하이브리드 검색 결과
export interface HybridSearchResult {
  saju: {
    analysis: string;
    elementBalance: Record<FiveElement, number>;
    dominantElement: FiveElement;
    weakElement: FiveElement;
    conflictsAndHarmonies: ConflictsAndHarmonies;
    insights: string[];
  };
  semanticQuery: string;
  graphCards: Array<{ number: number; suit: string; reason: string; strength: number; path?: string }>;
  ragCards: Array<{ card: { nameKo: string; nameEn: string; type: string; suit: string | null; number: number; keywords: string[]; uprightMeaning: string }; score: number; rank: number }>;
  ragAvailable: boolean;
  neo4jAvailable: boolean;
}

export const sajuTarotService = {
  // Neo4j 연결 상태 확인
  async getStatus(): Promise<{ neo4jConnected: boolean; ragInitialized: boolean; ragCardCount: number; message: string }> {
    const response = await api.get('/saju-tarot/status');
    return response.data.data;
  },

  // 사주 기반 추천 타로 카드
  async getRecommendedCards(saju: SajuInfo): Promise<RecommendedCardsResult> {
    const response = await api.post('/saju-tarot/recommend', saju);
    return response.data.data;
  },

  // 오행 분석
  async analyzeElements(saju: SajuInfo): Promise<ElementAnalysisResult> {
    const response = await api.post('/saju-tarot/analyze-elements', saju);
    return response.data.data;
  },

  // 특정 타로 카드와 사주 관계 조회
  async getCardRelations(suit: string, number: number): Promise<CardRelationsResult> {
    const response = await api.get(`/saju-tarot/card/${suit}/${number}`);
    return response.data.data;
  },

  // 사주-타로 종합 리딩
  async getCombinedReading(
    saju: SajuInfo,
    tarotCards: Array<{ number: number; suit: string; isReversed: boolean }>
  ): Promise<CombinedReadingResult> {
    const response = await api.post('/saju-tarot/combined-reading', { saju, tarotCards });
    return response.data.data;
  },

  // 사주 그래프 종합 인사이트 (천간합/지지충/삼합/육합)
  async getGraphInsight(saju: SajuInfo): Promise<GraphInsightResult> {
    const response = await api.post('/saju-tarot/graph-insight', saju);
    return response.data.data;
  },

  // Graph + RAG 하이브리드 검색
  async hybridSearch(saju: SajuInfo, customQuery?: string, limit = 5): Promise<HybridSearchResult> {
    const response = await api.post('/saju-tarot/hybrid-search', { saju, customQuery, limit });
    return response.data.data;
  },

  // 타로 리딩 그래프 분석 (카드 간 관계: 상생/상극/동일오행/연속)
  async readingAnalysis(cards: Array<{ number: number; suit: string }>): Promise<{
    elementDistribution: Record<FiveElement, number>;
    missingElements: FiveElement[];
    cardRelationships: Array<{
      from: { number: number; suit: string };
      to: { number: number; suit: string };
      type: string;
      detail: string;
    }>;
    majorArcanaPath: Array<{ number: number }>;
    energyDynamics: { generating: number; depleting: number; balanced: boolean };
    insights: string[];
  }> {
    const response = await api.post('/saju-tarot/reading-analysis', { cards });
    return response.data.data;
  }
};

// 오행 한글명
export const ELEMENT_KOREAN: Record<FiveElement, string> = {
  'WOOD': '목(木)',
  'FIRE': '화(火)',
  'EARTH': '토(土)',
  'METAL': '금(金)',
  'WATER': '수(水)'
};

// 오행 색상
export const ELEMENT_COLORS: Record<FiveElement, string> = {
  'WOOD': '#22c55e',  // green
  'FIRE': '#ef4444',  // red
  'EARTH': '#eab308', // yellow
  'METAL': '#94a3b8', // gray
  'WATER': '#3b82f6'  // blue
};

// 타로 슈트 한글명
export const SUIT_KOREAN: Record<string, string> = {
  'WANDS': '완드',
  'CUPS': '컵',
  'SWORDS': '소드',
  'PENTACLES': '펜타클',
  'MAJOR': '메이저 아르카나'
};

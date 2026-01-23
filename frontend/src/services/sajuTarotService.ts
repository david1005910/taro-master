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

export const sajuTarotService = {
  // Neo4j 연결 상태 확인
  async getStatus(): Promise<{ neo4jConnected: boolean; message: string }> {
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

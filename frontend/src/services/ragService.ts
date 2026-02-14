import api from './api';

export type SearchMode = 'semantic' | 'sparse' | 'hybrid' | 'compare';

export interface CardResult {
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
  card: CardResult;
  score: number;
  rank: number;
}

export interface CompareResult {
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

export interface SingleSearchResult {
  query: string;
  mode: string;
  results: SearchResult[];
}

export const ragSearch = (query: string, mode: SearchMode, limit = 5) =>
  api.post<{ success: boolean; data: CompareResult | SingleSearchResult }>('/rag/search', { query, mode, limit });

export const ragStatus = () =>
  api.get<{ success: boolean; data: { qdrant: boolean; cardCount: number } }>('/rag/status');

export const ragIndex = () =>
  api.post<{ success: boolean; data: { message: string; cardCount: number } }>('/rag/index');

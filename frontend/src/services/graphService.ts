import api from './api';

export interface GraphStatus {
  connected: boolean;
  nodeCount: number;
  relationshipCount: number;
}

export interface CardRelationships {
  cardId: number;
  nameKo: string;
  nameEn: string;
  element: string;
  sharedElement: Array<{ cardId: number; nameKo: string; nameEn: string }>;
  numerological: Array<{ cardId: number; nameKo: string; nameEn: string; number: number }>;
  archetypal: Array<{ cardId: number; nameKo: string; nameEn: string; theme: string }>;
}

export interface UserPatterns {
  topCards: Array<{ cardId: number; nameKo: string; nameEn: string; count: number }>;
  elementDistribution: Record<string, number>;
  totalReadings: number;
}

export const graphService = {
  getStatus: async (): Promise<GraphStatus> => {
    const res = await api.get('/graph/status');
    return res.data.data;
  },

  getCardRelationships: async (cardId: number): Promise<CardRelationships | null> => {
    const res = await api.get(`/graph/card/${cardId}/relationships`);
    return res.data.data;
  },

  getUserPatterns: async (): Promise<UserPatterns | null> => {
    const res = await api.get('/graph/user/patterns');
    return res.data.data;
  }
};

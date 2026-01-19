import api from './api';
import { Reading, ReadingPreview, DailyCardResponse } from '../types';

interface CreateReadingInput {
  spreadId: number;
  question?: string;
  interpretMode: 'TRADITIONAL' | 'AI';
  cards: Array<{
    cardId: number;
    position: number;
    isReversed: boolean;
  }>;
}

interface ReadingsResponse {
  readings: ReadingPreview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const readingService = {
  async createReading(input: CreateReadingInput): Promise<Reading> {
    const { data } = await api.post('/readings', input);
    return data.data;
  },

  async getReadings(params?: { page?: number; limit?: number }): Promise<ReadingsResponse> {
    const { data } = await api.get('/readings', { params });
    return data.data;
  },

  async getReadingById(id: string): Promise<Reading> {
    const { data } = await api.get(`/readings/${id}`);
    return data.data;
  },

  async updateReading(id: string, note?: string, tags?: string[]): Promise<{ id: string; note: string; tags: string[] }> {
    const { data } = await api.put(`/readings/${id}`, { note, tags });
    return data.data;
  },

  async deleteReading(id: string): Promise<void> {
    await api.delete(`/readings/${id}`);
  },

  async getDailyCard(): Promise<DailyCardResponse> {
    const { data } = await api.get('/readings/daily');
    return data.data;
  }
};

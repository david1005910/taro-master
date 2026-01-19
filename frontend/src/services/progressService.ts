import api from './api';
import { UserProgress } from '../types';

export const progressService = {
  async getProgress(): Promise<UserProgress> {
    const { data } = await api.get('/progress');
    return data.data;
  },

  async updateProgress(cardId: number, isLearned?: boolean, note?: string): Promise<{ cardId: number; isLearned: boolean; note?: string }> {
    const { data } = await api.put(`/progress/${cardId}`, { isLearned, note });
    return data.data;
  },

  async toggleFavorite(cardId: number): Promise<{ cardId: number; isFavorite: boolean }> {
    const { data } = await api.post(`/progress/${cardId}/favorite`);
    return data.data;
  },

  async getFavorites(): Promise<{ cardId: number; card: any; note?: string }[]> {
    const { data } = await api.get('/progress/favorites');
    return data.data.favorites;
  }
};

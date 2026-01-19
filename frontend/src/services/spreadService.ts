import api from './api';
import { Spread } from '../types';

export const spreadService = {
  async getSpreads(): Promise<Spread[]> {
    const { data } = await api.get('/spreads');
    return data.data.spreads;
  },

  async getSpreadById(id: number): Promise<Spread> {
    const { data } = await api.get(`/spreads/${id}`);
    return data.data;
  }
};

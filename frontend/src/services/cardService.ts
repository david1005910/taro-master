import api from './api';
import { Card } from '../types';

interface GetCardsParams {
  type?: string;
  suit?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CardsResponse {
  cards: Card[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const cardService = {
  async getCards(params?: GetCardsParams): Promise<CardsResponse> {
    const { data } = await api.get('/cards', { params });
    return data.data;
  },

  async getCardById(id: number): Promise<Card> {
    const { data } = await api.get(`/cards/${id}`);
    return data.data;
  },

  async getMajorArcana(): Promise<Card[]> {
    const { data } = await api.get('/cards/major');
    return data.data.cards;
  },

  async getMinorArcana(): Promise<Card[]> {
    const { data } = await api.get('/cards/minor');
    return data.data.cards;
  },

  async getCardsBySuit(suit: string): Promise<Card[]> {
    const { data } = await api.get(`/cards/suit/${suit}`);
    return data.data.cards;
  }
};

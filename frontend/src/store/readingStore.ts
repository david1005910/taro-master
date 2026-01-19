import { create } from 'zustand';
import { Spread, Card } from '../types';

interface SelectedCard {
  cardId: number;
  position: number;
  isReversed: boolean;
}

interface ReadingState {
  // Reading session state
  selectedSpread: Spread | null;
  question: string;
  interpretMode: 'TRADITIONAL' | 'AI';
  selectedCards: SelectedCard[];
  availableCards: Card[];
  isShuffled: boolean;

  // Actions
  setSpread: (spread: Spread) => void;
  setQuestion: (question: string) => void;
  setInterpretMode: (mode: 'TRADITIONAL' | 'AI') => void;
  setAvailableCards: (cards: Card[]) => void;
  shuffleCards: () => void;
  selectCard: (cardId: number, position: number) => void;
  unselectCard: (position: number) => void;
  resetSession: () => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  selectedSpread: null,
  question: '',
  interpretMode: 'TRADITIONAL',
  selectedCards: [],
  availableCards: [],
  isShuffled: false,

  setSpread: (spread) => set({ selectedSpread: spread }),

  setQuestion: (question) => set({ question }),

  setInterpretMode: (mode) => set({ interpretMode: mode }),

  setAvailableCards: (cards) => set({ availableCards: cards }),

  shuffleCards: () => {
    const { availableCards } = get();
    const shuffled = [...availableCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    set({ availableCards: shuffled, isShuffled: true });
  },

  selectCard: (cardId, position) => {
    const isReversed = Math.random() < 0.5;
    set((state) => ({
      selectedCards: [
        ...state.selectedCards.filter((c) => c.position !== position),
        { cardId, position, isReversed }
      ]
    }));
  },

  unselectCard: (position) => {
    set((state) => ({
      selectedCards: state.selectedCards.filter((c) => c.position !== position)
    }));
  },

  resetSession: () => {
    set({
      selectedSpread: null,
      question: '',
      interpretMode: 'TRADITIONAL',
      selectedCards: [],
      availableCards: [],
      isShuffled: false
    });
  }
}));

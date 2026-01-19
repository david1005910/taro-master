// User types
export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  createdAt?: string;
}

// Card types
export interface Card {
  id: number;
  nameKo: string;
  nameEn: string;
  type: 'MAJOR' | 'MINOR';
  suit?: 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES';
  number: number;
  imageUrl: string;
  keywords: string[];
  uprightMeaning?: string;
  reversedMeaning?: string;
  symbolism?: string;
  love?: string;
  career?: string;
  health?: string;
  finance?: string;
}

// Spread types
export interface SpreadPosition {
  index: number;
  name: string;
  description: string;
}

export interface Spread {
  id: number;
  name: string;
  description: string;
  cardCount: number;
  difficulty: number;
  category: string;
  imageUrl?: string;
  positions?: SpreadPosition[];
}

// Reading types
export interface ReadingCard {
  card: Card;
  position: number;
  positionName: string;
  positionDescription: string;
  isReversed: boolean;
  interpretation?: string;
}

export interface Reading {
  id: string;
  spreadId: number;
  spreadName: string;
  question?: string;
  interpretMode: 'TRADITIONAL' | 'AI';
  interpretation?: string;
  cards: ReadingCard[];
  note?: string;
  tags?: string[];
  createdAt: string;
}

export interface ReadingPreview {
  id: string;
  spreadName: string;
  question?: string;
  interpretMode: string;
  previewCards: {
    nameKo: string;
    imageUrl: string;
    isReversed: boolean;
  }[];
  createdAt: string;
}

// Daily Card type
export interface DailyCardResponse {
  date: string;
  card: Card & { isReversed: boolean; meaning: string };
  message: string;
  isNew: boolean;
}

// Progress types
export interface UserProgress {
  totalCards: number;
  learnedCards: number;
  favoriteCards: number;
  progressPercent: number;
  cards: {
    cardId: number;
    cardName: string;
    cardImage: string;
    isLearned: boolean;
    isFavorite: boolean;
    note?: string;
    updatedAt: string;
  }[];
}

// User Stats
export interface UserStats {
  totalReadings: number;
  thisMonthReadings: number;
  learningProgress: number;
  favoriteCards: number;
  mostDrawnCard?: {
    card: { id: number; nameKo: string; imageUrl: string };
    count: number;
  };
  readingsByMonth: { month: string; count: number }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

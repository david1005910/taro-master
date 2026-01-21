import api from './api';

export interface SajuInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
  isLunar?: boolean;
  gender?: 'male' | 'female' | 'unknown';
}

export interface FourPillarsDisplay {
  year: {
    stem: string;
    branch: string;
    stemElement: string;
    branchElement: string;
    yinYang: string;
    animal: string;
  };
  month: {
    stem: string;
    branch: string;
    stemElement: string;
    branchElement: string;
    yinYang: string;
  };
  day: {
    stem: string;
    branch: string;
    stemElement: string;
    branchElement: string;
    yinYang: string;
  };
  hour: {
    stem: string;
    branch: string;
    stemElement: string;
    branchElement: string;
    yinYang: string;
  } | null;
}

export interface ElementInfo {
  name: string;
  count: number;
  emoji: string;
  color: string;
  percentage: number;
}

export interface ElementAnalysis {
  elements: ElementInfo[];
  strongest: ElementInfo;
  weakest: ElementInfo[];
  isBalanced: boolean;
}

export interface SajuReading {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  isLunar: boolean;
  gender: string;
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string | null;
  hourBranch: string | null;
  woodCount: number;
  fireCount: number;
  earthCount: number;
  metalCount: number;
  waterCount: number;
  interpretation: string | null;
  createdAt: string;
  fourPillarsDisplay: FourPillarsDisplay;
  elementAnalysis?: ElementAnalysis;
  zodiacAnimal: string;
}

export interface SajuReadingsResponse {
  readings: SajuReading[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sajuService = {
  // 사주 계산 및 저장
  async createReading(input: SajuInput): Promise<SajuReading> {
    const response = await api.post('/saju', input);
    return response.data.data;
  },

  // 사주 리딩 목록 조회
  async getReadings(page = 1, limit = 10): Promise<SajuReadingsResponse> {
    const response = await api.get('/saju', { params: { page, limit } });
    return response.data.data;
  },

  // 사주 리딩 상세 조회
  async getReadingById(id: string): Promise<SajuReading> {
    const response = await api.get(`/saju/${id}`);
    return response.data.data;
  },

  // 사주 리딩 삭제
  async deleteReading(id: string): Promise<void> {
    await api.delete(`/saju/${id}`);
  }
};

export default sajuService;

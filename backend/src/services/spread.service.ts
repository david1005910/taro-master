import prisma from '../utils/prisma';

export class SpreadService {
  async getSpreads() {
    const spreads = await prisma.spread.findMany({
      orderBy: { difficulty: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        cardCount: true,
        difficulty: true,
        category: true,
        imageUrl: true
      }
    });

    return spreads;
  }

  async getSpreadById(id: number) {
    const spread = await prisma.spread.findUnique({
      where: { id }
    });

    if (!spread) {
      throw { status: 404, code: 'SPREAD_NOT_FOUND', message: '스프레드를 찾을 수 없습니다.' };
    }

    return {
      ...spread,
      positions: JSON.parse(spread.positions)
    };
  }
}

export const spreadService = new SpreadService();

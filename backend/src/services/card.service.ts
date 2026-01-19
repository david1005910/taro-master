import prisma from '../utils/prisma';

interface GetCardsParams {
  type?: string;
  suit?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CardService {
  async getCards(params: GetCardsParams) {
    const { type, suit, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (suit) {
      where.suit = suit;
    }

    if (search) {
      where.OR = [
        { nameKo: { contains: search } },
        { nameEn: { contains: search } },
        { keywords: { contains: search } }
      ];
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { type: 'asc' },
          { number: 'asc' }
        ],
        select: {
          id: true,
          nameKo: true,
          nameEn: true,
          type: true,
          suit: true,
          number: true,
          imageUrl: true,
          keywords: true
        }
      }),
      prisma.card.count({ where })
    ]);

    // Parse keywords JSON string
    const cardsWithParsedKeywords = cards.map(card => ({
      ...card,
      keywords: JSON.parse(card.keywords)
    }));

    return {
      cards: cardsWithParsedKeywords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCardById(id: number) {
    const card = await prisma.card.findUnique({
      where: { id }
    });

    if (!card) {
      throw { status: 404, code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' };
    }

    return {
      ...card,
      keywords: JSON.parse(card.keywords)
    };
  }

  async getMajorArcana() {
    const cards = await prisma.card.findMany({
      where: { type: 'MAJOR' },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        nameKo: true,
        nameEn: true,
        type: true,
        number: true,
        imageUrl: true,
        keywords: true
      }
    });

    return cards.map(card => ({
      ...card,
      keywords: JSON.parse(card.keywords)
    }));
  }

  async getMinorArcana() {
    const cards = await prisma.card.findMany({
      where: { type: 'MINOR' },
      orderBy: [
        { suit: 'asc' },
        { number: 'asc' }
      ],
      select: {
        id: true,
        nameKo: true,
        nameEn: true,
        type: true,
        suit: true,
        number: true,
        imageUrl: true,
        keywords: true
      }
    });

    return cards.map(card => ({
      ...card,
      keywords: JSON.parse(card.keywords)
    }));
  }

  async getCardsBySuit(suit: string) {
    const cards = await prisma.card.findMany({
      where: { suit: suit.toUpperCase() },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        nameKo: true,
        nameEn: true,
        type: true,
        suit: true,
        number: true,
        imageUrl: true,
        keywords: true
      }
    });

    return cards.map(card => ({
      ...card,
      keywords: JSON.parse(card.keywords)
    }));
  }
}

export const cardService = new CardService();

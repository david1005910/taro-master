import prisma from '../utils/prisma';

interface CreateReadingInput {
  userId: string;
  spreadId: number;
  question?: string;
  interpretMode: string;
  cards: Array<{
    cardId: number;
    position: number;
    isReversed: boolean;
  }>;
  interpretation?: string;
  cardInterpretations?: Array<{
    position: number;
    interpretation: string;
  }>;
}

interface GetReadingsParams {
  userId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export class ReadingService {
  async createReading(input: CreateReadingInput) {
    const { userId, spreadId, question, interpretMode, cards, interpretation, cardInterpretations } = input;

    // 스프레드 정보 조회
    const spread = await prisma.spread.findUnique({
      where: { id: spreadId }
    });

    if (!spread) {
      throw { status: 404, code: 'SPREAD_NOT_FOUND', message: '스프레드를 찾을 수 없습니다.' };
    }

    // 리딩 생성
    const reading = await prisma.reading.create({
      data: {
        userId,
        spreadId,
        question,
        interpretMode,
        interpretation,
        cards: {
          create: cards.map((card, index) => ({
            cardId: card.cardId,
            position: card.position,
            isReversed: card.isReversed,
            interpretation: cardInterpretations?.[index]?.interpretation
          }))
        }
      },
      include: {
        spread: {
          select: {
            name: true,
            positions: true
          }
        },
        cards: {
          include: {
            card: {
              select: {
                id: true,
                nameKo: true,
                nameEn: true,
                imageUrl: true,
                keywords: true
              }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    const positions = JSON.parse(reading.spread.positions);

    return {
      id: reading.id,
      spreadId: reading.spreadId,
      spreadName: reading.spread.name,
      question: reading.question,
      interpretMode: reading.interpretMode,
      interpretation: reading.interpretation,
      cards: reading.cards.map(rc => ({
        card: {
          ...rc.card,
          keywords: JSON.parse(rc.card.keywords)
        },
        position: rc.position,
        positionName: positions[rc.position]?.name,
        positionDescription: positions[rc.position]?.description,
        isReversed: rc.isReversed,
        interpretation: rc.interpretation
      })),
      createdAt: reading.createdAt
    };
  }

  async getReadings(params: GetReadingsParams) {
    const { userId, page = 1, limit = 10, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          spread: {
            select: { name: true }
          },
          cards: {
            include: {
              card: {
                select: {
                  id: true,
                  nameKo: true,
                  imageUrl: true
                }
              }
            },
            take: 3
          }
        }
      }),
      prisma.reading.count({ where })
    ]);

    return {
      readings: readings.map(r => ({
        id: r.id,
        spreadName: r.spread.name,
        question: r.question,
        interpretMode: r.interpretMode,
        previewCards: r.cards.map(rc => ({
          nameKo: rc.card.nameKo,
          imageUrl: rc.card.imageUrl,
          isReversed: rc.isReversed
        })),
        createdAt: r.createdAt
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getReadingById(id: string, userId: string) {
    const reading = await prisma.reading.findFirst({
      where: { id, userId },
      include: {
        spread: true,
        cards: {
          include: {
            card: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!reading) {
      throw { status: 404, code: 'READING_NOT_FOUND', message: '리딩을 찾을 수 없습니다.' };
    }

    const positions = JSON.parse(reading.spread.positions);

    return {
      id: reading.id,
      spreadName: reading.spread.name,
      question: reading.question,
      interpretMode: reading.interpretMode,
      interpretation: reading.interpretation,
      cards: reading.cards.map(rc => ({
        card: {
          ...rc.card,
          keywords: JSON.parse(rc.card.keywords)
        },
        position: rc.position,
        positionName: positions[rc.position]?.name,
        positionDescription: positions[rc.position]?.description,
        isReversed: rc.isReversed,
        interpretation: rc.interpretation
      })),
      note: reading.note,
      tags: JSON.parse(reading.tags),
      createdAt: reading.createdAt
    };
  }

  async updateReading(id: string, userId: string, note?: string, tags?: string[]) {
    const reading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      throw { status: 404, code: 'READING_NOT_FOUND', message: '리딩을 찾을 수 없습니다.' };
    }

    const updated = await prisma.reading.update({
      where: { id },
      data: {
        note: note !== undefined ? note : reading.note,
        tags: tags !== undefined ? JSON.stringify(tags) : reading.tags
      }
    });

    return {
      id: updated.id,
      note: updated.note,
      tags: JSON.parse(updated.tags)
    };
  }

  async deleteReading(id: string, userId: string) {
    const reading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      throw { status: 404, code: 'READING_NOT_FOUND', message: '리딩을 찾을 수 없습니다.' };
    }

    await prisma.reading.delete({ where: { id } });

    return { message: '리딩이 삭제되었습니다.' };
  }

  async getDailyCard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 이미 카드가 있는지 확인
    let dailyCard = await prisma.dailyCard.findFirst({
      where: {
        userId,
        date: today
      },
      include: {
        card: true
      }
    });

    let isNew = false;

    if (!dailyCard) {
      // 새로운 카드 생성
      const totalCards = await prisma.card.count();
      const randomCardId = Math.floor(Math.random() * totalCards) + 1;
      const isReversed = Math.random() < 0.5;

      const card = await prisma.card.findUnique({
        where: { id: randomCardId }
      });

      if (!card) {
        throw { status: 500, code: 'INTERNAL_ERROR', message: '카드를 불러올 수 없습니다.' };
      }

      // 오늘의 메시지 생성
      const messages = [
        '오늘 하루 이 카드의 에너지가 당신과 함께합니다.',
        '이 카드가 전하는 메시지에 귀 기울여 보세요.',
        '오늘 하루 새로운 관점으로 세상을 바라보세요.',
        '이 카드가 당신에게 필요한 통찰을 줄 것입니다.',
        '오늘의 카드가 당신의 하루를 밝혀줄 것입니다.'
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];

      dailyCard = await prisma.dailyCard.create({
        data: {
          userId,
          cardId: randomCardId,
          date: today,
          isReversed,
          message
        },
        include: {
          card: true
        }
      });

      isNew = true;
    }

    return {
      date: dailyCard.date.toISOString().split('T')[0],
      card: {
        id: dailyCard.card.id,
        nameKo: dailyCard.card.nameKo,
        nameEn: dailyCard.card.nameEn,
        imageUrl: dailyCard.card.imageUrl,
        isReversed: dailyCard.isReversed,
        keywords: JSON.parse(dailyCard.card.keywords),
        meaning: dailyCard.isReversed ? dailyCard.card.reversedMeaning : dailyCard.card.uprightMeaning
      },
      message: dailyCard.message,
      isNew
    };
  }
}

export const readingService = new ReadingService();

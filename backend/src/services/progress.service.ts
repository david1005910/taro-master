import prisma from '../utils/prisma';

export class ProgressService {
  async getProgress(userId: string) {
    const totalCards = await prisma.card.count();

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        card: {
          select: {
            id: true,
            nameKo: true,
            imageUrl: true
          }
        }
      }
    });

    const learnedCards = progress.filter(p => p.isLearned).length;
    const favoriteCards = progress.filter(p => p.isFavorite).length;

    return {
      totalCards,
      learnedCards,
      favoriteCards,
      progressPercent: Math.round((learnedCards / totalCards) * 100),
      cards: progress.map(p => ({
        cardId: p.cardId,
        cardName: p.card.nameKo,
        cardImage: p.card.imageUrl,
        isLearned: p.isLearned,
        isFavorite: p.isFavorite,
        note: p.note,
        updatedAt: p.updatedAt
      }))
    };
  }

  async updateProgress(userId: string, cardId: number, isLearned?: boolean, note?: string) {
    // 카드 존재 확인
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      throw { status: 404, code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' };
    }

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_cardId: { userId, cardId }
      },
      update: {
        ...(isLearned !== undefined && { isLearned }),
        ...(note !== undefined && { note })
      },
      create: {
        userId,
        cardId,
        isLearned: isLearned || false,
        note
      }
    });

    return {
      cardId: progress.cardId,
      isLearned: progress.isLearned,
      note: progress.note
    };
  }

  async toggleFavorite(userId: string, cardId: number) {
    // 카드 존재 확인
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      throw { status: 404, code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' };
    }

    // 현재 상태 확인
    const existing = await prisma.userProgress.findUnique({
      where: {
        userId_cardId: { userId, cardId }
      }
    });

    const newFavoriteStatus = existing ? !existing.isFavorite : true;

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_cardId: { userId, cardId }
      },
      update: {
        isFavorite: newFavoriteStatus
      },
      create: {
        userId,
        cardId,
        isFavorite: true
      }
    });

    return {
      cardId: progress.cardId,
      isFavorite: progress.isFavorite
    };
  }

  async getFavorites(userId: string) {
    const favorites = await prisma.userProgress.findMany({
      where: {
        userId,
        isFavorite: true
      },
      include: {
        card: {
          select: {
            id: true,
            nameKo: true,
            nameEn: true,
            imageUrl: true,
            type: true
          }
        }
      }
    });

    return favorites.map(f => ({
      cardId: f.cardId,
      card: f.card,
      note: f.note
    }));
  }
}

export const progressService = new ProgressService();

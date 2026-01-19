import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        createdAt: true
      }
    });

    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' };
    }

    return user;
  }

  async updateProfile(userId: string, nickname?: string, profileImage?: string) {
    // 닉네임 중복 확인
    if (nickname) {
      const existing = await prisma.user.findFirst({
        where: {
          nickname,
          NOT: { id: userId }
        }
      });

      if (existing) {
        throw { status: 409, code: 'AUTH_NICKNAME_EXISTS', message: '이미 사용 중인 닉네임입니다.' };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname && { nickname }),
        ...(profileImage && { profileImage })
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true
      }
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' };
    }

    // 현재 비밀번호 확인
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw { status: 401, code: 'AUTH_INVALID_CREDENTIALS', message: '현재 비밀번호가 올바르지 않습니다.' };
    }

    // 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async getStats(userId: string) {
    const [totalReadings, thisMonthReadings, progress, mostDrawnCard] = await Promise.all([
      prisma.reading.count({ where: { userId } }),
      prisma.reading.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.userProgress.count({
        where: { userId, isLearned: true }
      }),
      prisma.readingCard.groupBy({
        by: ['cardId'],
        where: {
          reading: { userId }
        },
        _count: { cardId: true },
        orderBy: { _count: { cardId: 'desc' } },
        take: 1
      })
    ]);

    let mostDrawn = null;
    if (mostDrawnCard.length > 0) {
      const card = await prisma.card.findUnique({
        where: { id: mostDrawnCard[0].cardId },
        select: { id: true, nameKo: true, imageUrl: true }
      });
      mostDrawn = {
        card,
        count: mostDrawnCard[0]._count.cardId
      };
    }

    // 월별 리딩 통계
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const readingsByMonth = await prisma.reading.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: sixMonthsAgo }
      },
      _count: true
    });

    // 월별로 그룹화
    const monthlyStats: { [key: string]: number } = {};
    readingsByMonth.forEach(r => {
      const month = r.createdAt.toISOString().slice(0, 7);
      monthlyStats[month] = (monthlyStats[month] || 0) + r._count;
    });

    const favoriteCards = await prisma.userProgress.count({
      where: { userId, isFavorite: true }
    });

    return {
      totalReadings,
      thisMonthReadings,
      learningProgress: progress,
      favoriteCards,
      mostDrawnCard: mostDrawn,
      readingsByMonth: Object.entries(monthlyStats).map(([month, count]) => ({
        month,
        count
      }))
    };
  }

  async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId }
    });

    return { message: '계정이 삭제되었습니다.' };
  }
}

export const userService = new UserService();

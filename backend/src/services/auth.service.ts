import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';

export class AuthService {
  async register(email: string, password: string, nickname: string) {
    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { status: 409, code: 'AUTH_EMAIL_EXISTS', message: '이미 사용 중인 이메일입니다.' };
    }

    // 닉네임 중복 확인
    const existingNickname = await prisma.user.findUnique({ where: { nickname } });
    if (existingNickname) {
      throw { status: 409, code: 'AUTH_NICKNAME_EXISTS', message: '이미 사용 중인 닉네임입니다.' };
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true
      }
    });

    // 토큰 생성
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    // 사용자 조회
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw { status: 401, code: 'AUTH_INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw { status: 401, code: 'AUTH_INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 토큰 생성
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyToken(refreshToken);
      const accessToken = generateAccessToken({ userId: decoded.userId, email: decoded.email });
      const newRefreshToken = generateRefreshToken({ userId: decoded.userId, email: decoded.email });

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw { status: 401, code: 'AUTH_TOKEN_EXPIRED', message: '토큰이 만료되었습니다. 다시 로그인해주세요.' };
    }
  }
}

export const authService = new AuthService();

import api from './api';
import { User, UserStats } from '../types';

export const userService = {
  async getProfile(): Promise<User> {
    const { data } = await api.get('/users/me');
    return data.data;
  },

  async updateProfile(nickname?: string, profileImage?: string): Promise<User> {
    const { data } = await api.put('/users/me', { nickname, profileImage });
    return data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.put('/users/me/password', { currentPassword, newPassword });
    return data.data;
  },

  async getStats(): Promise<UserStats> {
    const { data } = await api.get('/users/me/stats');
    return data.data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  }
};

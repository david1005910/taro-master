import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';
import { progressService } from '../services/progressService';
import { UserStats, UserProgress } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';

const Profile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');

  // Change password state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, progressData] = await Promise.all([
        userService.getStats(),
        progressService.getProgress()
      ]);
      setStats(statsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await userService.updateProfile(nickname);
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '프로필 수정에 실패했습니다.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      await userService.changePassword(currentPassword, newPassword);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('비밀번호가 변경되었습니다.');
    } catch (error: any) {
      setPasswordError(error.response?.data?.error?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await userService.deleteAccount();
      logout();
      navigate('/');
    } catch (error) {
      alert('계정 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="프로필을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-accent mb-8 text-center">프로필</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-accent">기본 정보</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '취소' : '수정'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">이메일</label>
              <p className="text-white">{user?.email}</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">닉네임</label>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="새 닉네임"
                  />
                  <Button onClick={handleUpdateProfile} size="sm">
                    저장
                  </Button>
                </div>
              ) : (
                <p className="text-white">{user?.nickname}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-accent mb-4">통계</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-mystic-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-accent">{stats?.totalReadings || 0}</p>
              <p className="text-gray-400 text-sm">총 리딩</p>
            </div>
            <div className="bg-mystic-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-accent">{stats?.thisMonthReadings || 0}</p>
              <p className="text-gray-400 text-sm">이번 달 리딩</p>
            </div>
            <div className="bg-mystic-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-accent">{progress?.learnedCards || 0}/78</p>
              <p className="text-gray-400 text-sm">학습한 카드</p>
            </div>
            <div className="bg-mystic-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-accent">{progress?.favoriteCards || 0}</p>
              <p className="text-gray-400 text-sm">즐겨찾기</p>
            </div>
          </div>

          {/* Learning Progress Bar */}
          {progress && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">학습 진도</span>
                <span className="text-accent">{progress.progressPercent}%</span>
              </div>
              <div className="h-3 bg-mystic-800 rounded-full">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Most Drawn Card */}
          {stats?.mostDrawnCard && (
            <div className="mt-6 bg-mystic-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">가장 많이 뽑은 카드</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎴</span>
                <div>
                  <p className="text-accent font-semibold">
                    {stats.mostDrawnCard.card.nameKo}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {stats.mostDrawnCard.count}회
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-accent mb-4">계정 설정</h2>

          <div className="space-y-4">
            <Button
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full justify-center"
            >
              비밀번호 변경
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-center"
            >
              로그아웃
            </Button>
            <Button
              variant="ghost"
              onClick={handleDeleteAccount}
              className="w-full justify-center text-red-400 hover:text-red-300"
            >
              계정 삭제
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="비밀번호 변경"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            label="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
          />
          <Input
            type="password"
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordError && (
            <p className="text-red-500 text-sm">{passwordError}</p>
          )}
          <Button onClick={handleChangePassword} className="w-full">
            비밀번호 변경
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
      newErrors.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (nickname.length < 2 || nickname.length > 20) {
      newErrors.nickname = '닉네임은 2~20자 사이여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    try {
      await register(email, password, confirmPassword, nickname);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🔮</span>
          <h1 className="text-2xl font-bold text-accent">회원가입</h1>
          <p className="text-gray-400 mt-2">타로 마스터와 함께 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="email"
            label="이메일"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <Input
            type="text"
            label="닉네임"
            placeholder="타로러버"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            error={errors.nickname}
            required
          />

          <Input
            type="password"
            label="비밀번호"
            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />

          <Input
            type="password"
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력해주세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            회원가입
          </Button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-accent hover:underline">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '로그인에 실패했습니다.');
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
          <h1 className="text-2xl font-bold text-accent">로그인</h1>
          <p className="text-gray-400 mt-2">타로 마스터에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="이메일"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="비밀번호"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-accent hover:underline">
            회원가입
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

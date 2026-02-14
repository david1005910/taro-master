import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className="glass sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔮</span>
            <span className="text-xl font-bold text-accent">타로 마스터</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/cards" className="text-gray-300 hover:text-accent transition-colors">
              카드 백과
            </Link>
            <Link to="/tarot/learn" className="text-gray-300 hover:text-accent transition-colors">
              타로학습
            </Link>
            <Link to="/rag-search" className="text-gray-500 hover:text-neon-cyan transition-colors text-xs border border-mystic-600 px-2 py-0.5 rounded">
              RAG
            </Link>
            <Link to="/saju-graph" className="text-gray-500 hover:text-neon-purple transition-colors text-xs border border-mystic-600 px-2 py-0.5 rounded">
              그래프
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/reading" className="text-gray-300 hover:text-accent transition-colors">
                  리딩 시작
                </Link>
                <Link to="/saju" className="text-gray-300 hover:text-accent transition-colors">
                  사주
                </Link>
                <Link to="/saju/learn" className="text-gray-300 hover:text-accent transition-colors">
                  사주학습
                </Link>
                <Link to="/saju-tarot" className="text-neon-pink hover:text-neon-cyan transition-colors">
                  사주×타로
                </Link>
                <Link to="/daily" className="text-gray-300 hover:text-accent transition-colors">
                  오늘의 카드
                </Link>
                <Link to="/history" className="text-gray-300 hover:text-accent transition-colors">
                  리딩 기록
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-300 hover:text-accent transition-colors">
                  {user?.nickname}
                </Link>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1 px-4">
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-accent transition-colors">
                  로그인
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1 px-4">
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-accent"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-mystic-700">
            <nav className="flex flex-col space-y-3">
              <Link
                to="/cards"
                className="text-gray-300 hover:text-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                카드 백과
              </Link>
              <Link
                to="/tarot/learn"
                className="text-gray-300 hover:text-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                타로학습
              </Link>
              <Link
                to="/rag-search"
                className="text-gray-500 hover:text-neon-cyan transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                RAG 검색 (개발)
              </Link>
              <Link
                to="/saju-graph"
                className="text-gray-500 hover:text-neon-purple transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                사주 그래프 인사이트
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/reading"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    리딩 시작
                  </Link>
                  <Link
                    to="/saju"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    사주
                  </Link>
                  <Link
                    to="/saju/learn"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    사주학습
                  </Link>
                  <Link
                    to="/saju-tarot"
                    className="text-neon-pink hover:text-neon-cyan transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    사주×타로 융합
                  </Link>
                  <Link
                    to="/daily"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    오늘의 카드
                  </Link>
                  <Link
                    to="/history"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    리딩 기록
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    프로필
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-gray-300 hover:text-accent transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-300 hover:text-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

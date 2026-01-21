import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sajuService, SajuReading } from '../services/sajuService';

// SVG Gooey Filter
const GooeyFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter id="gooey-history">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
          result="gooey"
        />
        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
      </filter>
    </defs>
  </svg>
);

// 애니메이션 블롭 컴포넌트
const AnimatedBlobs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute w-96 h-96 rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)',
        filter: 'blur(40px)',
        top: '10%',
        left: '5%',
      }}
      animate={{
        x: [0, 40, 0],
        y: [0, 30, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-80 h-80 rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
        filter: 'blur(50px)',
        top: '40%',
        right: '10%',
      }}
      animate={{
        x: [0, -30, 0],
        y: [0, 40, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-72 h-72 rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
        filter: 'blur(45px)',
        bottom: '15%',
        left: '30%',
      }}
      animate={{
        x: [0, 50, 0],
        y: [0, -30, 0],
        scale: [1, 0.9, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  </div>
);

// 글래시 카드 컴포넌트
const GlassCard = ({
  children,
  className = "",
  delay = 0,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.98 }}
    transition={{
      delay,
      duration: 0.4,
      type: "spring",
      stiffness: 120
    }}
    onClick={onClick}
    className={`
      relative overflow-hidden
      bg-gradient-to-br from-white/10 to-white/5
      backdrop-blur-xl
      border border-white/20
      rounded-2xl
      shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]
      ${onClick ? 'cursor-pointer hover:border-accent/40 hover:shadow-[0_8px_32px_rgba(212,175,55,0.15)]' : ''}
      transition-all duration-300
      ${className}
    `}
  >
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// 리퀴드 버튼 컴포넌트
const LiquidButton = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = ""
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-accent via-yellow-400 to-accent bg-[length:200%_100%] text-primary shadow-[0_4px_20px_rgba(212,175,55,0.3)]",
    secondary: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
    danger: "bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500/30",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/10"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-xl",
    md: "px-6 py-3 rounded-2xl",
    lg: "px-8 py-4 text-lg rounded-2xl"
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        relative overflow-hidden font-medium
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      style={variant === "primary" && !disabled ? { animation: "shimmer 3s ease-in-out infinite" } : {}}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

// 페이지네이션 버튼
const PaginationButton = ({
  children,
  onClick,
  disabled = false
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    whileHover={!disabled ? { scale: 1.05 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    className={`
      px-5 py-2.5 rounded-xl font-medium
      transition-all duration-300
      ${disabled
        ? 'bg-white/5 text-white/30 cursor-not-allowed'
        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
      }
    `}
  >
    {children}
  </motion.button>
);

const SajuHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState<SajuReading[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReadings();
  }, [page]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const data = await sajuService.getReadings(page, 10);
      setReadings(data.readings);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch saju readings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeletingId(id);
    try {
      await sajuService.deleteReading(id);
      fetchReadings();
    } catch (err) {
      console.error('Failed to delete reading:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && readings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center relative overflow-hidden">
        <GooeyFilter />
        <AnimatedBlobs />
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-accent to-yellow-300"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div className="absolute inset-4 rounded-full bg-[#1a1a2e]" />
          </div>
          <motion.p
            className="text-white/60 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            기록을 불러오는 중...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] py-12 px-4 relative overflow-hidden">
      <GooeyFilter />
      <AnimatedBlobs />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <span className="text-6xl">📚</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent mb-3">
            사주 기록
          </h1>
          <p className="text-white/60 text-lg">
            이전에 본 사주 기록을 확인하세요
          </p>
        </motion.div>

        {readings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <GlassCard className="p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-7xl mb-6"
              >
                🔮
              </motion.div>
              <p className="text-white/60 text-lg mb-8">아직 사주 기록이 없습니다.</p>
              <LiquidButton onClick={() => navigate('/saju')} variant="primary" size="lg">
                <span>✨</span>
                <span>사주 보러 가기</span>
              </LiquidButton>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            {/* 기록 목록 */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {readings.map((reading, index) => (
                  <GlassCard
                    key={reading.id}
                    delay={index * 0.05}
                    onClick={() => navigate(`/saju/result/${reading.id}`)}
                    className="p-5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          {/* 띠 이모지 */}
                          <motion.div
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <span className="text-3xl">{getZodiacEmoji(reading.zodiacAnimal)}</span>
                          </motion.div>

                          {/* 정보 */}
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg group-hover:text-accent transition-colors">
                              {reading.name}
                            </h3>
                            <p className="text-white/50 text-sm mt-0.5">
                              {new Date(reading.birthDate).toLocaleDateString('ko-KR')}
                              {reading.birthTime && ` ${reading.birthTime}`}
                              {reading.isLunar && ' (음력)'}
                            </p>

                            {/* 태그들 */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className="inline-flex items-center gap-1 text-xs bg-accent/20 text-accent px-3 py-1.5 rounded-full border border-accent/30"
                              >
                                <span>{getZodiacEmoji(reading.zodiacAnimal)}</span>
                                <span>{reading.zodiacAnimal}띠</span>
                              </motion.span>
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className="inline-flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/30"
                              >
                                <span>☯️</span>
                                <span>일간: {reading.dayStem}</span>
                              </motion.span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="flex items-center gap-2 ml-4">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/saju/result/${reading.id}`);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                          title="보기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </motion.button>
                        <motion.button
                          onClick={(e) => handleDelete(reading.id, e)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={deletingId === reading.id}
                          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          {deletingId === reading.id ? (
                            <motion.div
                              className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* 생성 날짜 */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <p className="text-white/30 text-xs flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(reading.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </AnimatePresence>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center items-center gap-3 mt-10"
              >
                <PaginationButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← 이전
                </PaginationButton>

                <div className="flex items-center gap-2 px-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <motion.button
                      key={num}
                      onClick={() => setPage(num)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`
                        w-10 h-10 rounded-xl font-medium transition-all duration-300
                        ${page === num
                          ? 'bg-accent text-primary shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }
                      `}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>

                <PaginationButton
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  다음 →
                </PaginationButton>
              </motion.div>
            )}
          </>
        )}

        {/* 새 사주 보기 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mt-10"
        >
          <LiquidButton onClick={() => navigate('/saju')} variant="primary" size="lg">
            <span>✨</span>
            <span>새 사주 보기</span>
          </LiquidButton>
          <LiquidButton onClick={() => navigate('/')} variant="secondary" size="lg">
            <span>🏠</span>
            <span>홈으로</span>
          </LiquidButton>
        </motion.div>
      </div>

      {/* 글로벌 스타일 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

// 띠에 따른 이모지
const getZodiacEmoji = (zodiac: string): string => {
  const zodiacEmojis: Record<string, string> = {
    '쥐': '🐀',
    '소': '🐂',
    '호랑이': '🐅',
    '토끼': '🐇',
    '용': '🐉',
    '뱀': '🐍',
    '말': '🐴',
    '양': '🐏',
    '원숭이': '🐵',
    '닭': '🐓',
    '개': '🐕',
    '돼지': '🐖'
  };
  return zodiacEmojis[zodiac] || '✨';
};

export default SajuHistory;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sajuService, SajuReading } from '../services/sajuService';

// 오행 색상 (더 생생한 색상으로 업데이트)
const ELEMENT_COLORS: Record<string, string> = {
  '목(木)': '#22c55e',
  '화(火)': '#ef4444',
  '토(土)': '#eab308',
  '금(金)': '#94a3b8',
  '수(水)': '#3b82f6'
};

// 오행 그라데이션 색상
const ELEMENT_GRADIENTS: Record<string, string> = {
  '목(木)': 'from-green-400 to-emerald-600',
  '화(火)': 'from-red-400 to-orange-600',
  '토(土)': 'from-yellow-400 to-amber-600',
  '금(金)': 'from-slate-300 to-slate-500',
  '수(水)': 'from-blue-400 to-indigo-600'
};

// SVG Gooey Filter
const GooeyFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter id="gooey">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
          result="gooey"
        />
        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
      </filter>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

// 애니메이션 블롭 컴포넌트
const AnimatedBlobs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* 메인 블롭들 */}
    <motion.div
      className="absolute w-96 h-96 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)',
        filter: 'blur(40px)',
        top: '10%',
        left: '10%',
      }}
      animate={{
        x: [0, 50, 0],
        y: [0, 30, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-80 h-80 rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
        filter: 'blur(50px)',
        top: '50%',
        right: '5%',
      }}
      animate={{
        x: [0, -40, 0],
        y: [0, 50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-72 h-72 rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)',
        filter: 'blur(45px)',
        bottom: '20%',
        left: '20%',
      }}
      animate={{
        x: [0, 60, 0],
        y: [0, -40, 0],
        scale: [1, 0.9, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-64 h-64 rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)',
        filter: 'blur(35px)',
        top: '30%',
        left: '50%',
      }}
      animate={{
        x: [0, -30, 0],
        y: [0, 60, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 9,
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
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      delay,
      duration: 0.6,
      type: "spring",
      stiffness: 100
    }}
    className={`
      relative overflow-hidden
      bg-gradient-to-br from-white/10 to-white/5
      backdrop-blur-xl
      border border-white/20
      rounded-3xl
      shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
      ${className}
    `}
  >
    {/* 상단 하이라이트 */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    {/* 내부 글로우 */}
    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-50" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// 리퀴드 버튼 컴포넌트
const LiquidButton = ({
  children,
  onClick,
  variant = "primary",
  className = ""
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    className={`
      relative overflow-hidden
      font-bold px-8 py-4 rounded-2xl
      transition-all duration-300
      ${variant === "primary"
        ? "bg-gradient-to-r from-accent via-yellow-400 to-accent bg-[length:200%_100%] text-primary shadow-[0_4px_20px_rgba(212,175,55,0.4)]"
        : "bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      }
      ${className}
    `}
    style={variant === "primary" ? {
      animation: "shimmer 3s ease-in-out infinite"
    } : {}}
  >
    {/* 버튼 내부 글로우 */}
    <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
  </motion.button>
);

const SajuResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<SajuReading | null>(null);

  useEffect(() => {
    const fetchReading = async () => {
      if (!id) return;

      try {
        const data = await sajuService.getReadingById(id);
        setReading(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || '사주 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReading();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center relative overflow-hidden">
        <GooeyFilter />
        <AnimatedBlobs />
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* 로딩 스피너 - 리퀴드 스타일 */}
          <div className="relative w-24 h-24 mx-auto mb-6" style={{ filter: 'url(#gooey)' }}>
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-accent to-yellow-300"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 rounded-full bg-[#1a1a2e]"
            />
          </div>
          <motion.p
            className="text-white/70 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            사주를 분석하고 있습니다...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center relative overflow-hidden">
        <GooeyFilter />
        <AnimatedBlobs />
        <GlassCard className="p-8 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-red-400 mb-6 text-lg">{error || '사주 정보를 찾을 수 없습니다.'}</p>
          <LiquidButton onClick={() => navigate('/saju')}>
            다시 시도
          </LiquidButton>
        </GlassCard>
      </div>
    );
  }

  const { fourPillarsDisplay, elementAnalysis, zodiacAnimal, interpretation } = reading;

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
            <span className="text-6xl">🔮</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent mb-3">
            {reading.name}님의 사주
          </h1>
          <p className="text-white/60 text-lg">
            {new Date(reading.birthDate).toLocaleDateString('ko-KR')}
            {reading.birthTime && ` ${reading.birthTime}`}
            {reading.isLunar && ' (음력)'}
          </p>
          <motion.p
            className="text-2xl mt-3 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              {zodiacAnimal}띠
            </span>
          </motion.p>
        </motion.div>

        {/* 사주 팔자 표시 */}
        <GlassCard className="p-6 md:p-8 mb-8" delay={0.1}>
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            사주팔자 (四柱八字)
          </h2>

          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {/* 시주 */}
            <div className="text-center">
              <p className="text-white/50 text-sm mb-3">시주(時柱)</p>
              {fourPillarsDisplay.hour ? (
                <div className="space-y-2">
                  <PillarCell
                    char={fourPillarsDisplay.hour.stem}
                    element={fourPillarsDisplay.hour.stemElement}
                  />
                  <PillarCell
                    char={fourPillarsDisplay.hour.branch}
                    element={fourPillarsDisplay.hour.branchElement}
                  />
                  <p className="text-white/40 text-xs">{fourPillarsDisplay.hour.stemElement}/{fourPillarsDisplay.hour.branchElement}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl md:text-4xl font-bold py-3 rounded-2xl bg-white/5 text-white/30 backdrop-blur-sm">-</div>
                  <div className="text-3xl md:text-4xl font-bold py-3 rounded-2xl bg-white/5 text-white/30 backdrop-blur-sm">-</div>
                  <p className="text-white/40 text-xs">시간 미입력</p>
                </div>
              )}
            </div>

            {/* 일주 - 강조 */}
            <div className="text-center">
              <p className="text-accent text-sm mb-3 font-bold">일주(日柱)</p>
              <motion.div
                className="space-y-2 p-1 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.1))',
                  boxShadow: '0 0 20px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(212,175,55,0.3)',
                    '0 0 30px rgba(212,175,55,0.5)',
                    '0 0 20px rgba(212,175,55,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PillarCell
                  char={fourPillarsDisplay.day.stem}
                  element={fourPillarsDisplay.day.stemElement}
                  isHighlighted
                />
                <PillarCell
                  char={fourPillarsDisplay.day.branch}
                  element={fourPillarsDisplay.day.branchElement}
                  isHighlighted
                />
                <p className="text-accent/70 text-xs">{fourPillarsDisplay.day.stemElement}/{fourPillarsDisplay.day.branchElement}</p>
              </motion.div>
            </div>

            {/* 월주 */}
            <div className="text-center">
              <p className="text-white/50 text-sm mb-3">월주(月柱)</p>
              <div className="space-y-2">
                <PillarCell
                  char={fourPillarsDisplay.month.stem}
                  element={fourPillarsDisplay.month.stemElement}
                />
                <PillarCell
                  char={fourPillarsDisplay.month.branch}
                  element={fourPillarsDisplay.month.branchElement}
                />
                <p className="text-white/40 text-xs">{fourPillarsDisplay.month.stemElement}/{fourPillarsDisplay.month.branchElement}</p>
              </div>
            </div>

            {/* 년주 */}
            <div className="text-center">
              <p className="text-white/50 text-sm mb-3">년주(年柱)</p>
              <div className="space-y-2">
                <PillarCell
                  char={fourPillarsDisplay.year.stem}
                  element={fourPillarsDisplay.year.stemElement}
                />
                <PillarCell
                  char={fourPillarsDisplay.year.branch}
                  element={fourPillarsDisplay.year.branchElement}
                />
                <p className="text-white/40 text-xs">{fourPillarsDisplay.year.stemElement}/{fourPillarsDisplay.year.branchElement}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 오행 분포 */}
        {elementAnalysis && (
          <GlassCard className="p-6 md:p-8 mb-8" delay={0.2}>
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              오행 분포
            </h2>

            <div className="space-y-5">
              {elementAnalysis.elements.map((element, idx) => (
                <motion.div
                  key={element.name}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <div className="w-16 text-center">
                    <motion.span
                      className="text-3xl block"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      {element.emoji}
                    </motion.span>
                    <p className="text-sm text-white/60 mt-1">{element.name}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm relative">
                      {/* 배경 광택 */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${element.percentage}%` }}
                        transition={{ duration: 1, delay: 0.4 + idx * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                          backgroundColor: element.color,
                          boxShadow: `0 0 20px ${element.color}50`
                        }}
                      >
                        {/* 바 내부 광택 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                        {/* 애니메이션 글로우 */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                      </motion.div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-white font-bold text-lg">{element.count}개</span>
                    <p className="text-xs text-white/50">{element.percentage}%</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-8 pt-6 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
                <span className="text-white/60">
                  가장 강한 오행:
                  <span className="ml-2 text-white font-bold text-lg">
                    {elementAnalysis.strongest.emoji} {elementAnalysis.strongest.name}
                  </span>
                </span>
                <motion.span
                  className={`px-4 py-2 rounded-full font-medium ${
                    elementAnalysis.isBalanced
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {elementAnalysis.isBalanced ? '✨ 균형잡힌 오행' : '⚡ 오행 불균형'}
                </motion.span>
              </div>
            </motion.div>
          </GlassCard>
        )}

        {/* 해석 */}
        {interpretation && (
          <GlassCard className="p-6 md:p-8 mb-8" delay={0.3}>
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              사주 분석
            </h2>
            <div className="text-white/80 whitespace-pre-line leading-relaxed text-sm md:text-base">
              {interpretation.split('【').map((section, idx) => {
                if (idx === 0) {
                  return (
                    <motion.div
                      key={idx}
                      className="text-center mb-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span className="text-accent text-lg font-medium">{section}</span>
                    </motion.div>
                  );
                }
                const [title, ...content] = section.split('】');
                return (
                  <motion.div
                    key={idx}
                    className="mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                  >
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      <span className="bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                        【{title}】
                      </span>
                    </h3>
                    <div className="pl-4 border-l-2 border-white/10 text-white/70 leading-loose">
                      {content.join('】')}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <LiquidButton onClick={() => navigate('/saju')} variant="primary">
            <span>🔄</span>
            <span>다시 보기</span>
          </LiquidButton>
          <LiquidButton onClick={() => navigate('/saju/history')} variant="secondary">
            <span>📜</span>
            <span>기록 보기</span>
          </LiquidButton>
        </motion.div>
      </div>

      {/* 글로벌 스타일 - shimmer 애니메이션 */}
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

// 기둥 셀 컴포넌트 - Liquid Morphism 스타일
const PillarCell = ({
  char,
  element,
  isHighlighted = false
}: {
  char: string;
  element: string;
  isHighlighted?: boolean;
}) => {
  const elementKey = `${element}(${element === '목' ? '木' : element === '화' ? '火' : element === '토' ? '土' : element === '금' ? '金' : '水'})`;
  const color = ELEMENT_COLORS[elementKey] || '#fff';

  return (
    <motion.div
      className="text-3xl md:text-4xl font-bold py-3 rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        color: color,
        boxShadow: isHighlighted
          ? `0 4px 20px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`
          : `0 2px 10px ${color}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
        backdropFilter: 'blur(10px)',
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 8px 30px ${color}50, inset 0 1px 0 rgba(255,255,255,0.3)`
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* 상단 하이라이트 */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)'
        }}
      />
      <span className="relative z-10" style={{ filter: isHighlighted ? 'url(#glow)' : 'none' }}>
        {char}
      </span>
    </motion.div>
  );
};

export default SajuResult;

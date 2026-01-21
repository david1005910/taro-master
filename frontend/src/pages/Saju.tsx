import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sajuService, SajuInput } from '../services/sajuService';

// SVG Gooey Filter
const GooeyFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter id="gooey-input">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
          result="gooey"
        />
        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
      </filter>
      <filter id="glow-input">
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
    <motion.div
      className="absolute w-96 h-96 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)',
        filter: 'blur(40px)',
        top: '5%',
        right: '10%',
      }}
      animate={{
        x: [0, -50, 0],
        y: [0, 40, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-80 h-80 rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, transparent 70%)',
        filter: 'blur(50px)',
        bottom: '10%',
        left: '5%',
      }}
      animate={{
        x: [0, 30, 0],
        y: [0, -50, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute w-64 h-64 rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
        filter: 'blur(45px)',
        top: '40%',
        left: '20%',
      }}
      animate={{
        x: [0, 40, 0],
        y: [0, 30, 0],
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
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-50" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// 리퀴드 인풋 컴포넌트
const LiquidInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  hint,
  children
}: {
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  children?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
  >
    <label className="block text-white/80 mb-2 font-medium">
      {label}
      {!required && hint && <span className="text-white/40 ml-2 text-sm">({hint})</span>}
    </label>
    {children || (
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
            w-full px-5 py-4 rounded-2xl
            bg-white/5 backdrop-blur-sm
            border border-white/10
            text-white placeholder-white/30
            focus:outline-none focus:border-accent/50 focus:bg-white/10
            transition-all duration-300
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
          "
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    )}
    {hint && !children && (
      <p className="text-white/40 text-sm mt-2">{hint}</p>
    )}
  </motion.div>
);

// 시진(時辰) 옵션 정의
const SIJU_OPTIONS = [
  { value: '', label: '모름 / 선택 안함', description: '태어난 시간을 모르는 경우' },
  { value: '00:00', label: '자시(子時)', description: '23:00 ~ 01:00', emoji: '🐭' },
  { value: '02:00', label: '축시(丑時)', description: '01:00 ~ 03:00', emoji: '🐂' },
  { value: '04:00', label: '인시(寅時)', description: '03:00 ~ 05:00', emoji: '🐯' },
  { value: '06:00', label: '묘시(卯時)', description: '05:00 ~ 07:00', emoji: '🐰' },
  { value: '08:00', label: '진시(辰時)', description: '07:00 ~ 09:00', emoji: '🐲' },
  { value: '10:00', label: '사시(巳時)', description: '09:00 ~ 11:00', emoji: '🐍' },
  { value: '12:00', label: '오시(午時)', description: '11:00 ~ 13:00', emoji: '🐴' },
  { value: '14:00', label: '미시(未時)', description: '13:00 ~ 15:00', emoji: '🐑' },
  { value: '16:00', label: '신시(申時)', description: '15:00 ~ 17:00', emoji: '🐵' },
  { value: '18:00', label: '유시(酉時)', description: '17:00 ~ 19:00', emoji: '🐔' },
  { value: '20:00', label: '술시(戌時)', description: '19:00 ~ 21:00', emoji: '🐕' },
  { value: '22:00', label: '해시(亥時)', description: '21:00 ~ 23:00', emoji: '🐷' },
];

// 리퀴드 셀렉트 컴포넌트 (시진용)
const LiquidSelect = ({
  label,
  value,
  onChange,
  options,
  hint
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: typeof SIJU_OPTIONS;
  hint?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
  >
    <label className="block text-white/80 mb-2 font-medium">
      {label}
      {hint && <span className="text-white/40 ml-2 text-sm">({hint})</span>}
    </label>
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full px-5 py-4 rounded-2xl
          bg-white/5 backdrop-blur-sm
          border border-white/10
          text-white
          focus:outline-none focus:border-accent/50 focus:bg-white/10
          transition-all duration-300
          shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
          appearance-none cursor-pointer
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#3d3d5c] text-white"
          >
            {option.emoji ? `${option.emoji} ` : ''}{option.label} {option.description ? `(${option.description})` : ''}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
        ▼
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
    {/* 선택된 시진 상세 정보 표시 */}
    {value && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-3 p-3 rounded-xl bg-accent/10 border border-accent/20"
      >
        {(() => {
          const selected = options.find(o => o.value === value);
          if (!selected || !selected.emoji) return null;
          return (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selected.emoji}</span>
              <div>
                <p className="text-accent font-medium">{selected.label}</p>
                <p className="text-white/60 text-sm">{selected.description}</p>
              </div>
            </div>
          );
        })()}
      </motion.div>
    )}
  </motion.div>
);

// 리퀴드 라디오 그룹
const LiquidRadioGroup = ({
  label,
  name,
  options,
  value,
  onChange
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string | boolean;
  onChange: (value: any) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
  >
    <label className="block text-white/80 mb-3 font-medium">{label}</label>
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isSelected = value === option.value || (typeof value === 'boolean' && value.toString() === option.value);
        return (
          <motion.label
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer
              transition-all duration-300
              ${isSelected
                ? 'bg-accent/20 border-accent/50 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
              }
              border backdrop-blur-sm
            `}
          >
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              transition-all duration-300
              ${isSelected ? 'border-accent bg-accent' : 'border-white/30'}
            `}>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              )}
            </div>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value === 'true' ? true : option.value === 'false' ? false : option.value)}
              className="sr-only"
            />
            <span className={`${isSelected ? 'text-accent' : 'text-white/80'} font-medium`}>
              {option.label}
            </span>
          </motion.label>
        );
      })}
    </div>
  </motion.div>
);

// 리퀴드 버튼 컴포넌트
const LiquidButton = ({
  children,
  type = "button",
  disabled = false,
  className = ""
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) => (
  <motion.button
    type={type}
    disabled={disabled}
    whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
    className={`
      relative overflow-hidden w-full
      font-bold py-4 rounded-2xl
      transition-all duration-300
      bg-gradient-to-r from-accent via-yellow-400 to-accent
      bg-[length:200%_100%]
      text-primary
      shadow-[0_4px_20px_rgba(212,175,55,0.4)]
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
    style={!disabled ? { animation: "shimmer 3s ease-in-out infinite" } : {}}
  >
    <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
  </motion.button>
);

const Saju = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SajuInput>({
    name: '',
    birthDate: '',
    birthTime: '',
    isLunar: false,
    gender: 'unknown'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const input: SajuInput = {
        name: formData.name,
        birthDate: formData.birthDate,
        isLunar: formData.isLunar,
        gender: formData.gender
      };

      if (formData.birthTime) {
        input.birthTime = formData.birthTime;
      }

      const result = await sajuService.createReading(input);
      navigate(`/saju/result/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '사주 계산 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a2a45] via-[#3d3d5c] to-[#4a5a7a] py-12 px-4 relative overflow-hidden">
      <GooeyFilter />
      <AnimatedBlobs />

      <div className="max-w-lg mx-auto relative z-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <span className="text-7xl">🔮</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent mb-3">
            사주팔자
          </h1>
          <p className="text-white/60 text-lg">
            생년월일을 입력하여 사주를 확인하세요
          </p>
        </motion.div>

        {/* 폼 카드 */}
        <GlassCard className="p-6 md:p-8" delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이름 */}
            <LiquidInput
              label="이름"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="이름을 입력하세요"
              required
            />

            {/* 생년월일 */}
            <LiquidInput
              label="생년월일"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              required
            />

            {/* 음력/양력 선택 */}
            <LiquidRadioGroup
              label="달력 종류"
              name="calendarType"
              options={[
                { value: 'false', label: '양력' },
                { value: 'true', label: '음력' }
              ]}
              value={formData.isLunar.toString()}
              onChange={(val) => setFormData({ ...formData, isLunar: val })}
            />

            {/* 생시 (시진 선택) */}
            <LiquidSelect
              label="생시 (태어난 시간)"
              value={formData.birthTime}
              onChange={(val) => setFormData({ ...formData, birthTime: val })}
              options={SIJU_OPTIONS}
              hint="시진을 선택하세요"
            />

            {/* 성별 */}
            <LiquidRadioGroup
              label="성별"
              name="gender"
              options={[
                { value: 'male', label: '남성' },
                { value: 'female', label: '여성' },
                { value: 'unknown', label: '선택 안함' }
              ]}
              value={formData.gender}
              onChange={(val) => setFormData({ ...formData, gender: val })}
            />

            {/* 에러 메시지 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 backdrop-blur-sm"
              >
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </motion.div>
            )}

            {/* 제출 버튼 */}
            <LiquidButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>계산 중...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>사주 보기</span>
                </>
              )}
            </LiquidButton>
          </form>
        </GlassCard>

        {/* 설명 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <GlassCard className="p-6 bg-white/5">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📜</span>
              <div className="text-left">
                <p className="text-white/60 text-sm leading-relaxed">
                  <span className="text-accent font-medium">사주팔자(四柱八字)</span>는
                  태어난 해, 월, 일, 시의 네 기둥(柱)과 천간(天干)과 지지(地支)의
                  여덟 글자(字)로 운명을 풀이하는 동양의 전통 명리학입니다.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* 기록 보기 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <motion.button
            onClick={() => navigate('/saju/history')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center gap-2 px-6 py-3 rounded-2xl
              bg-white/5 backdrop-blur-sm border border-white/10
              text-white/70 hover:text-white hover:bg-white/10
              transition-all duration-300
            "
          >
            <span>📚</span>
            <span>이전 기록 보기</span>
          </motion.button>
        </motion.div>
      </div>

      {/* 글로벌 스타일 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Saju;

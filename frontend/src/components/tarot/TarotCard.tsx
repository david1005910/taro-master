import { motion } from 'framer-motion';
import { Card } from '../../types';

interface TarotCardProps {
  card: Card;
  isReversed?: boolean;
  isFlipped?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  showName?: boolean;
}

const sizeClasses = {
  sm: 'w-32 h-52',
  md: 'w-52 h-80',
  lg: 'w-72 h-[28rem]',
  xl: 'w-80 h-[32rem]'
};

const textSizeClasses = {
  sm: { name: 'text-xs' },
  md: { name: 'text-sm' },
  lg: { name: 'text-lg' },
  xl: { name: 'text-xl' }
};

// 카드 이미지 경로 매핑
const getCardImagePath = (card: Card): string => {
  const isMajor = card.type === 'MAJOR';

  if (isMajor) {
    // Major Arcana: 0-21
    const majorNames: Record<number, string> = {
      0: 'fool',
      1: 'magician',
      2: 'high-priestess',
      3: 'empress',
      4: 'emperor',
      5: 'hierophant',
      6: 'lovers',
      7: 'chariot',
      8: 'strength',
      9: 'hermit',
      10: 'wheel-of-fortune',
      11: 'justice',
      12: 'hanged-man',
      13: 'death',
      14: 'temperance',
      15: 'devil',
      16: 'tower',
      17: 'star',
      18: 'moon',
      19: 'sun',
      20: 'judgement',
      21: 'world'
    };
    const name = majorNames[card.number] || 'fool';
    const num = card.number.toString().padStart(2, '0');
    return `/cards/major-${num}-${name}.jpg`;
  } else {
    // Minor Arcana
    const suit = card.suit?.toLowerCase() || 'cups';
    const suitMap: Record<string, string> = {
      'wands': 'wands',
      'cups': 'cups',
      'swords': 'swords',
      'pentacles': 'pentacles'
    };
    const suitName = suitMap[suit] || 'cups';

    if (card.number === 1) {
      return `/cards/${suitName}-ace.jpg`;
    } else if (card.number <= 10) {
      const num = card.number.toString().padStart(2, '0');
      return `/cards/${suitName}-${num}.jpg`;
    } else {
      // Court cards: 11=Page, 12=Knight, 13=Queen, 14=King
      const courtNames: Record<number, string> = {
        11: 'page',
        12: 'knight',
        13: 'queen',
        14: 'king'
      };
      const courtName = courtNames[card.number] || 'page';
      return `/cards/${suitName}-${courtName}.jpg`;
    }
  }
};

const TarotCard = ({
  card,
  isReversed = false,
  isFlipped = false,
  onClick,
  size = 'md',
  disabled = false,
  showName = true
}: TarotCardProps) => {
  const textSize = textSizeClasses[size];
  const imagePath = getCardImagePath(card);

  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        relative cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{ perspective: '1000px' }}
      whileHover={!disabled ? { scale: 1.03, y: -10 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={!disabled ? onClick : undefined}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {/* Card Back - Vaporwave Style */}
        <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden shadow-neon-purple">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0C0E23] via-[#1a1a3a] to-[#2a1a4a]" />
          <div className="absolute inset-2 rounded-xl border border-neon-pink/40" />
          <div className="absolute inset-4 rounded-lg border border-neon-cyan/20" />

          {/* Ornate center design - Neon glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                className="w-28 h-28 rounded-full border-2 border-neon-pink/60 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ boxShadow: '0 0 15px rgba(255, 79, 190, 0.3)' }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 flex items-center justify-center border border-neon-cyan/40">
                  <span className="text-4xl text-neon-cyan" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.7)' }}>✦</span>
                </div>
              </motion.div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-neon-pink/60">★</div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-neon-pink/60">★</div>
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 text-neon-cyan/60">★</div>
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-neon-cyan/60">★</div>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 text-center">
            <span className="text-neon-pink/80 text-sm tracking-[0.4em] font-serif" style={{ textShadow: '0 0 8px rgba(255, 79, 190, 0.5)' }}>TAROT</span>
          </div>

          <div className="absolute top-4 left-4 text-neon-purple/40 text-xl">✧</div>
          <div className="absolute top-4 right-4 text-neon-cyan/40 text-xl">✧</div>
          <div className="absolute bottom-4 left-4 text-neon-cyan/40 text-xl rotate-180">✧</div>
          <div className="absolute bottom-4 right-4 text-neon-purple/40 text-xl rotate-180">✧</div>
        </div>

        {/* Card Front - 실제 이미지 사용 */}
        <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden rotate-y-180 shadow-2xl">
          {/* 카드 이미지 */}
          <div className={`relative w-full h-full ${isReversed ? 'rotate-180' : ''}`}>
            <img
              src={imagePath}
              alt={card.nameKo}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 폴백
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />

            {/* 이미지 위에 그라데이션 오버레이 (하단 이름 표시용) */}
            {showName && (
              <div className={`
                absolute left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent
                ${isReversed ? 'top-0 bg-gradient-to-b pt-8 pb-2' : 'bottom-0 pb-4 pt-8'}
              `}>
                <p className={`text-white text-center ${textSize.name} font-bold drop-shadow-lg ${isReversed ? 'rotate-180' : ''}`}>
                  {card.nameKo}
                  {isReversed && <span className="text-red-400 ml-2">(역방향)</span>}
                </p>
                {(size === 'lg' || size === 'xl') && (
                  <p className={`text-white/70 text-center text-xs mt-1 ${isReversed ? 'rotate-180' : ''}`}>
                    {card.nameEn}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Decorative border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-accent/30 pointer-events-none" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TarotCard;

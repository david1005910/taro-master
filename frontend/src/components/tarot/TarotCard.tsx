import { useState } from 'react';
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
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
        {/* Card Back - Universal Waite */}
        <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden shadow-neon-purple">
          <img
            src="/cards/card-back.jpg"
            alt="카드 뒷면"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        {/* Card Front - 실제 이미지 사용 */}
        <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden rotate-y-180 shadow-2xl">
          {/* 카드 이미지 */}
          <div className={`relative w-full h-full ${isReversed ? 'rotate-180' : ''}`}>
            {/* 스켈레톤 UI - 이미지 로딩 중 표시 */}
            {!imageLoaded && !imageFailed && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-cyan-900/40 animate-pulse">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
                  <p className="text-white/60 text-xs">Loading...</p>
                </div>
              </div>
            )}

            {/* 이미지 로드 실패 시 폴백 UI */}
            {imageFailed && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                <span className="text-4xl mb-2">🃏</span>
                <p className="text-white/80 text-sm font-semibold">{card.nameKo}</p>
                <p className="text-white/40 text-xs mt-1">{card.nameEn}</p>
              </div>
            )}

            <img
              src={imagePath}
              alt={card.nameKo}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                // 이미지 로드 실패 시 폴백
                setImageFailed(true);
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

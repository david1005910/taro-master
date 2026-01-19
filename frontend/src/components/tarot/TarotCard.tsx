import { motion } from 'framer-motion';
import { Card } from '../../types';

interface TarotCardProps {
  card: Card;
  isReversed?: boolean;
  isFlipped?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showName?: boolean;
}

const sizeClasses = {
  sm: 'w-28 h-44',
  md: 'w-48 h-72',
  lg: 'w-64 h-96'
};

const textSizeClasses = {
  sm: { number: 'text-2xl', name: 'text-xs', symbol: 'text-3xl', keyword: 'text-[10px]' },
  md: { number: 'text-4xl', name: 'text-base', symbol: 'text-5xl', keyword: 'text-sm' },
  lg: { number: 'text-6xl', name: 'text-lg', symbol: 'text-7xl', keyword: 'text-base' }
};

// Suit symbols and colors
const suitConfig: Record<string, { symbol: string; color: string; gradient: string }> = {
  WANDS: { symbol: '🔥', color: 'text-orange-400', gradient: 'from-orange-900/50 to-red-900/50' },
  CUPS: { symbol: '💧', color: 'text-blue-400', gradient: 'from-blue-900/50 to-cyan-900/50' },
  SWORDS: { symbol: '⚔️', color: 'text-gray-300', gradient: 'from-slate-800/50 to-gray-900/50' },
  PENTACLES: { symbol: '🌟', color: 'text-yellow-400', gradient: 'from-yellow-900/50 to-amber-900/50' }
};

// Major Arcana symbols
const majorSymbols: Record<number, string> = {
  0: '🃏', 1: '🎩', 2: '🌙', 3: '👑', 4: '🏛️', 5: '⛪', 6: '💕', 7: '🏎️',
  8: '⚖️', 9: '🏮', 10: '🎡', 11: '💪', 12: '🙃', 13: '💀', 14: '⚗️', 15: '😈',
  16: '🗼', 17: '⭐', 18: '🌙', 19: '☀️', 20: '📯', 21: '🌍'
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
  const isMajor = card.type === 'MAJOR';
  const suit = card.suit as string | null;
  const suitInfo = suit ? suitConfig[suit] : null;
  const textSize = textSizeClasses[size];

  // Get card symbol
  const getSymbol = () => {
    if (isMajor) {
      return majorSymbols[card.number] || '✦';
    }
    return suitInfo?.symbol || '✦';
  };

  // Get gradient based on card type
  const getGradient = () => {
    if (isMajor) {
      return 'from-purple-900/80 via-mystic-900 to-indigo-900/80';
    }
    return suitInfo?.gradient || 'from-mystic-800 to-primary';
  };

  // Get card number display
  const getNumberDisplay = () => {
    if (isMajor) {
      return card.number.toString().padStart(2, '0');
    }
    if (card.number <= 10) {
      return card.number.toString();
    }
    // Court cards
    const courtNames: Record<number, string> = { 11: 'P', 12: 'Kn', 13: 'Q', 14: 'K' };
    return courtNames[card.number] || card.number.toString();
  };

  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        relative cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{ perspective: '1000px' }}
      whileHover={!disabled ? { scale: 1.05, y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Card Back */}
        <div
          className="absolute w-full h-full rounded-lg bg-gradient-to-br from-mystic-900 to-secondary border-2 border-accent backface-hidden"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <span className="text-accent text-4xl">✦</span>
                <div className="absolute inset-0 animate-pulse">
                  <span className="text-accent/50 text-4xl">✦</span>
                </div>
              </div>
              <div className="mt-2 text-accent text-xs tracking-widest">TAROT</div>
            </div>
          </div>
          {/* Decorative corners */}
          <div className="absolute top-2 left-2 text-accent/30 text-xs">✧</div>
          <div className="absolute top-2 right-2 text-accent/30 text-xs">✧</div>
          <div className="absolute bottom-2 left-2 text-accent/30 text-xs">✧</div>
          <div className="absolute bottom-2 right-2 text-accent/30 text-xs">✧</div>
        </div>

        {/* Card Front */}
        <div
          className="absolute w-full h-full rounded-lg overflow-hidden border-2 border-accent backface-hidden rotate-y-180"
        >
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradient()} flex flex-col items-center justify-between p-2 ${isReversed ? 'rotate-180' : ''}`}
          >
            {/* Top - Number */}
            <div className="w-full flex justify-between items-start">
              <span className={`${textSize.number} font-bold ${isMajor ? 'text-purple-300' : suitInfo?.color || 'text-accent'}`}>
                {getNumberDisplay()}
              </span>
              <span className={textSize.symbol}>{getSymbol()}</span>
            </div>

            {/* Center - Main Symbol */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`${size === 'lg' ? 'text-8xl' : size === 'md' ? 'text-6xl' : 'text-4xl'} mb-1`}>
                  {getSymbol()}
                </div>
                {size !== 'sm' && (
                  <div className={`${textSize.name} text-gray-300 font-medium px-1`}>
                    {card.nameEn}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom - Keywords */}
            {size === 'lg' && card.keywords && card.keywords.length > 0 && (
              <div className="w-full">
                <div className="flex flex-wrap justify-center gap-1">
                  {card.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className={`${textSize.keyword} bg-black/40 text-gray-300 px-1.5 py-0.5 rounded`}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom number (mirrored) */}
            <div className="w-full flex justify-between items-end">
              <span className={textSize.symbol}>{getSymbol()}</span>
              <span className={`${textSize.number} font-bold ${isMajor ? 'text-purple-300' : suitInfo?.color || 'text-accent'} rotate-180`}>
                {getNumberDisplay()}
              </span>
            </div>
          </div>

          {/* Card name overlay */}
          {showName && (
            <div className={`absolute bottom-0 left-0 right-0 bg-black/80 p-1.5 ${isReversed ? 'top-0 bottom-auto rotate-180' : ''}`}>
              <p className={`text-white text-center ${textSize.name} font-medium truncate`}>
                {card.nameKo}
                {isReversed && ' (역방향)'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TarotCard;

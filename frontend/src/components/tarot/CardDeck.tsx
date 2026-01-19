import { motion } from 'framer-motion';

interface CardDeckProps {
  onShuffle: () => void;
  isShuffled: boolean;
}

const CardDeck = ({ onShuffle, isShuffled }: CardDeckProps) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Deck Stack */}
      <div className="relative w-40 h-56">
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-32 h-48 rounded-lg bg-gradient-to-br from-mystic-900 to-secondary border-2 border-accent"
            style={{
              top: index * 2,
              left: index * 2,
              zIndex: 5 - index
            }}
            animate={isShuffled ? {
              x: [0, (index % 2 === 0 ? 1 : -1) * 20, 0],
              y: [0, -10, 0],
              rotate: [0, (index % 2 === 0 ? 1 : -1) * 5, 0]
            } : {}}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: 'easeInOut'
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-accent text-3xl">✦</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shuffle Button */}
      <motion.button
        onClick={onShuffle}
        className="btn-primary flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{isShuffled ? '다시 섞기' : '카드 섞기'}</span>
      </motion.button>
    </div>
  );
};

export default CardDeck;

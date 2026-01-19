import { motion } from 'framer-motion';
import { Spread } from '../../types';

interface SpreadSelectorProps {
  spreads: Spread[];
  selectedSpread: Spread | null;
  onSelect: (spread: Spread) => void;
}

const difficultyStars = (difficulty: number) => {
  return '★'.repeat(difficulty) + '☆'.repeat(4 - difficulty);
};

const SpreadSelector = ({ spreads, selectedSpread, onSelect }: SpreadSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {spreads.map((spread) => (
        <motion.div
          key={spread.id}
          className={`
            glass p-4 rounded-xl cursor-pointer transition-all duration-300
            ${selectedSpread?.id === spread.id
              ? 'border-2 border-accent shadow-lg shadow-accent/20'
              : 'border border-mystic-700 hover:border-accent/50'
            }
          `}
          onClick={() => onSelect(spread)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-accent">{spread.name}</h3>
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
              {spread.cardCount}장
            </span>
          </div>

          <p className="text-gray-400 text-sm mb-3">{spread.description}</p>

          <div className="flex items-center justify-between text-xs">
            <span className="text-yellow-400">{difficultyStars(spread.difficulty)}</span>
            <span className="text-gray-500 capitalize">{spread.category}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SpreadSelector;

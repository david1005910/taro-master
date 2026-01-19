import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cardService } from '../services/cardService';
import { Card } from '../types';
import TarotCard from '../components/tarot/TarotCard';
import Loading from '../components/common/Loading';

const CardLibrary = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'MAJOR' | 'MINOR'>('all');
  const [suit, setSuit] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCards();
  }, [filter, suit]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'all') params.type = filter;
      if (suit) params.suit = suit;

      const response = await cardService.getCards(params);
      setCards(response.cards);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter(card => {
    if (!search) return true;
    return (
      card.nameKo.includes(search) ||
      card.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      card.keywords.some(k => k.includes(search))
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">타로 카드 백과</h1>
        <p className="text-gray-400">78장의 타로 카드를 학습하세요</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="카드 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-mystic"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: 'MAJOR', label: '메이저' },
              { value: 'MINOR', label: '마이너' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFilter(option.value as any);
                  if (option.value !== 'MINOR') setSuit('');
                }}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  filter === option.value
                    ? 'bg-accent text-primary'
                    : 'bg-mystic-800 text-gray-300 hover:bg-mystic-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Suit Filter (only for Minor Arcana) */}
          {filter === 'MINOR' && (
            <select
              value={suit}
              onChange={(e) => setSuit(e.target.value)}
              className="input-mystic max-w-[150px]"
            >
              <option value="">모든 수트</option>
              <option value="WANDS">완드</option>
              <option value="CUPS">컵</option>
              <option value="SWORDS">소드</option>
              <option value="PENTACLES">펜타클</option>
            </select>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading size="lg" text="카드를 불러오는 중..." />
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-4">
            총 {filteredCards.length}장의 카드
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <Link to={`/cards/${card.id}`}>
                  <TarotCard
                    card={card}
                    isFlipped={true}
                    size="md"
                    showName={true}
                  />
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400">검색 결과가 없습니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CardLibrary;

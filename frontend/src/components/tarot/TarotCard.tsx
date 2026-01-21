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

// 더 큰 사이즈 추가
const sizeClasses = {
  sm: 'w-32 h-52',
  md: 'w-52 h-80',
  lg: 'w-72 h-[28rem]',
  xl: 'w-80 h-[32rem]'
};

const textSizeClasses = {
  sm: { number: 'text-lg', name: 'text-xs', keyword: 'text-[8px]' },
  md: { number: 'text-2xl', name: 'text-sm', keyword: 'text-xs' },
  lg: { number: 'text-3xl', name: 'text-lg', keyword: 'text-sm' },
  xl: { number: 'text-4xl', name: 'text-xl', keyword: 'text-base' }
};

// SVG 일러스트레이션 사이즈
const illustrationSize = {
  sm: { width: 80, height: 100 },
  md: { width: 140, height: 180 },
  lg: { width: 200, height: 260 },
  xl: { width: 240, height: 300 }
};

// Suit configuration
const suitConfig: Record<string, {
  name: string;
  element: string;
  color: string;
  gradient: string;
  bgGradient: string;
}> = {
  WANDS: {
    name: '완드',
    element: '불',
    color: '#f97316',
    gradient: 'from-orange-800 via-red-900 to-amber-900',
    bgGradient: 'from-orange-950 via-red-950 to-amber-950'
  },
  CUPS: {
    name: '컵',
    element: '물',
    color: '#3b82f6',
    gradient: 'from-blue-800 via-cyan-900 to-indigo-900',
    bgGradient: 'from-blue-950 via-cyan-950 to-indigo-950'
  },
  SWORDS: {
    name: '소드',
    element: '공기',
    color: '#94a3b8',
    gradient: 'from-slate-700 via-gray-800 to-zinc-900',
    bgGradient: 'from-slate-950 via-gray-950 to-zinc-950'
  },
  PENTACLES: {
    name: '펜타클',
    element: '땅',
    color: '#eab308',
    gradient: 'from-yellow-800 via-amber-900 to-green-900',
    bgGradient: 'from-yellow-950 via-amber-950 to-green-950'
  }
};

// Major Arcana SVG Illustrations - 더 상세하고 사실적인 일러스트
const MajorArcanaIllustration = ({ number, size }: { number: number; size: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const { width, height } = illustrationSize[size];

  const illustrations: Record<number, JSX.Element> = {
    // 0 - The Fool (바보)
    0: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="skyGrad0" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#E0F4FF" />
          </linearGradient>
          <linearGradient id="cliffGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B7355" />
            <stop offset="100%" stopColor="#5D4E37" />
          </linearGradient>
        </defs>
        {/* Sky */}
        <rect fill="url(#skyGrad0)" width="200" height="260"/>
        {/* Sun */}
        <circle cx="160" cy="40" r="25" fill="#FFD700" opacity="0.9"/>
        <circle cx="160" cy="40" r="20" fill="#FFF8DC"/>
        {/* Mountains */}
        <polygon points="0,260 60,140 120,260" fill="#6B8E6B"/>
        <polygon points="80,260 150,100 220,260" fill="#5A7D5A"/>
        {/* Cliff */}
        <path d="M140,180 L200,200 L200,260 L120,260 Z" fill="url(#cliffGrad)"/>
        {/* Fool figure */}
        <ellipse cx="100" cy="90" rx="18" ry="22" fill="#FFE4C4"/> {/* Head */}
        <path d="M85,85 Q100,70 115,85" fill="none" stroke="#8B4513" strokeWidth="2"/> {/* Hair */}
        <circle cx="93" cy="88" r="3" fill="#4A4A4A"/> {/* Eye */}
        <circle cx="107" cy="88" r="3" fill="#4A4A4A"/>
        <path d="M95,98 Q100,102 105,98" fill="none" stroke="#CD5C5C" strokeWidth="2"/> {/* Smile */}
        {/* Body/Clothes */}
        <path d="M80,110 L70,180 L100,200 L130,180 L120,110 Z" fill="#FF6B6B"/>
        <path d="M70,180 L60,220 L80,220 L100,200" fill="#4ECDC4"/>
        <path d="M130,180 L140,220 L120,220 L100,200" fill="#FFE66D"/>
        {/* Walking stick */}
        <line x1="125" y1="130" x2="145" y2="220" stroke="#8B4513" strokeWidth="4"/>
        {/* Bundle */}
        <circle cx="140" cy="120" r="15" fill="#DEB887"/>
        <line x1="125" y1="130" x2="140" y2="120" stroke="#8B4513" strokeWidth="3"/>
        {/* Dog */}
        <ellipse cx="60" cy="210" rx="20" ry="12" fill="#F5DEB3"/>
        <circle cx="50" cy="200" r="10" fill="#F5DEB3"/>
        <polygon points="42,192 38,182 48,190" fill="#DEB887"/>
        <polygon points="58,192 62,182 52,190" fill="#DEB887"/>
        <circle cx="46" cy="198" r="2" fill="#4A4A4A"/>
        <ellipse cx="50" cy="205" rx="4" ry="2" fill="#4A4A4A"/>
        {/* White rose */}
        <circle cx="75" cy="140" r="8" fill="white"/>
        <circle cx="75" cy="140" r="4" fill="#FFFACD"/>
        {/* Flower wreath on head */}
        <circle cx="88" cy="72" r="4" fill="#FF69B4"/>
        <circle cx="100" cy="68" r="4" fill="#FFD700"/>
        <circle cx="112" cy="72" r="4" fill="#FF69B4"/>
      </svg>
    ),

    // 1 - The Magician (마법사)
    1: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="magicBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a0a2e" />
            <stop offset="100%" stopColor="#2d1b4e" />
          </linearGradient>
        </defs>
        <rect fill="url(#magicBg)" width="200" height="260"/>
        {/* Infinity symbol above head */}
        <path d="M80,35 C80,25 95,25 100,35 C105,25 120,25 120,35 C120,45 105,45 100,35 C95,45 80,45 80,35"
              fill="none" stroke="#FFD700" strokeWidth="3"/>
        {/* Red roses above */}
        <g transform="translate(30, 15)">
          <circle cx="15" cy="15" r="10" fill="#DC143C"/>
          <circle cx="15" cy="15" r="5" fill="#FF6B6B"/>
        </g>
        <g transform="translate(145, 15)">
          <circle cx="15" cy="15" r="10" fill="#DC143C"/>
          <circle cx="15" cy="15" r="5" fill="#FF6B6B"/>
        </g>
        {/* Magician figure */}
        <ellipse cx="100" cy="75" rx="20" ry="25" fill="#FFE4C4"/>
        <path d="M80,65 Q100,50 120,65" fill="#2C2C2C"/> {/* Hair */}
        <circle cx="92" cy="72" r="3" fill="#4A4A4A"/>
        <circle cx="108" cy="72" r="3" fill="#4A4A4A"/>
        {/* Red robe */}
        <path d="M75,95 L60,200 L100,220 L140,200 L125,95 Z" fill="#8B0000"/>
        <path d="M75,95 L90,200 L100,220" fill="#A52A2A"/>
        {/* White inner robe */}
        <path d="M85,100 L85,180 L100,200 L115,180 L115,100 Z" fill="white"/>
        {/* Belt */}
        <ellipse cx="100" cy="135" rx="25" ry="5" fill="#FFD700"/>
        {/* Right arm raised with wand */}
        <path d="M125,100 L150,60" stroke="#FFE4C4" strokeWidth="12" strokeLinecap="round"/>
        <line x1="148" y1="62" x2="155" y2="30" stroke="#8B4513" strokeWidth="4"/>
        <circle cx="155" cy="25" r="5" fill="#FFD700"/>
        {/* Left arm pointing down */}
        <path d="M75,100 L50,150" stroke="#FFE4C4" strokeWidth="12" strokeLinecap="round"/>
        {/* Table */}
        <rect x="30" y="200" width="140" height="10" fill="#8B4513"/>
        <rect x="40" y="210" width="5" height="50" fill="#5D4037"/>
        <rect x="155" y="210" width="5" height="50" fill="#5D4037"/>
        {/* Four elements on table */}
        <circle cx="55" cy="195" r="12" fill="#FFD700"/> {/* Pentacle */}
        <polygon points="55,185 52,200 58,200" fill="#FFD700"/>
        <rect x="80" y="185" width="15" height="20" fill="#C0C0C0"/> {/* Sword */}
        <polygon points="87,165 84,185 90,185" fill="#C0C0C0"/>
        <ellipse cx="115" cy="192" rx="10" ry="12" fill="#4169E1"/> {/* Cup */}
        <ellipse cx="115" cy="185" rx="8" ry="4" fill="#6495ED"/>
        <rect x="140" y="180" width="6" height="25" fill="#8B4513"/> {/* Wand */}
        <circle cx="143" cy="178" r="4" fill="#228B22"/>
        {/* Lilies below */}
        <g transform="translate(20, 230)">
          <ellipse cx="20" cy="15" rx="8" ry="12" fill="white"/>
          <line x1="20" y1="27" x2="20" y2="40" stroke="#228B22" strokeWidth="2"/>
        </g>
        <g transform="translate(150, 230)">
          <ellipse cx="20" cy="15" rx="8" ry="12" fill="white"/>
          <line x1="20" y1="27" x2="20" y2="40" stroke="#228B22" strokeWidth="2"/>
        </g>
      </svg>
    ),

    // 2 - The High Priestess (여사제)
    2: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="priestessBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0a2e" />
            <stop offset="100%" stopColor="#1a1a4e" />
          </linearGradient>
        </defs>
        <rect fill="url(#priestessBg)" width="200" height="260"/>
        {/* Pillars */}
        <rect x="15" y="50" width="30" height="200" fill="#2C2C2C"/>
        <text x="30" y="140" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">B</text>
        <rect x="155" y="50" width="30" height="200" fill="#E8E8E8"/>
        <text x="170" y="140" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">J</text>
        {/* Veil between pillars */}
        <rect x="45" y="50" width="110" height="200" fill="#4169E1" opacity="0.3"/>
        <path d="M45,50 Q100,80 155,50" fill="#4169E1" opacity="0.5"/>
        {/* Pomegranates on veil */}
        <circle cx="60" cy="80" r="6" fill="#DC143C"/>
        <circle cx="90" cy="70" r="6" fill="#DC143C"/>
        <circle cx="120" cy="75" r="6" fill="#DC143C"/>
        <circle cx="140" cy="85" r="6" fill="#DC143C"/>
        {/* Moon crown */}
        <circle cx="100" cy="40" r="15" fill="#C0C0C0"/>
        <circle cx="85" cy="35" r="8" fill="#E8E8E8" stroke="#C0C0C0" strokeWidth="2"/>
        <circle cx="115" cy="35" r="8" fill="#1a1a4e" stroke="#C0C0C0" strokeWidth="2"/>
        {/* High Priestess figure */}
        <ellipse cx="100" cy="70" rx="18" ry="22" fill="#FFE4C4"/>
        <circle cx="93" cy="68" r="2" fill="#4A4A4A"/>
        <circle cx="107" cy="68" r="2" fill="#4A4A4A"/>
        <path d="M95,78 L105,78" stroke="#CD5C5C" strokeWidth="2"/>
        {/* Blue robe */}
        <path d="M70,90 L55,250 L100,260 L145,250 L130,90 Z" fill="#4169E1"/>
        {/* White cross on chest */}
        <rect x="95" y="100" width="10" height="30" fill="white"/>
        <rect x="85" y="110" width="30" height="10" fill="white"/>
        {/* Scroll/Torah */}
        <rect x="75" y="170" width="50" height="40" fill="#F5DEB3"/>
        <text x="100" y="195" textAnchor="middle" fill="#333" fontSize="12">TORA</text>
        {/* Crescent moon at feet */}
        <path d="M80,240 Q100,260 120,240 Q100,250 80,240" fill="#C0C0C0"/>
        {/* Stars */}
        <text x="50" y="120" fill="#FFD700" fontSize="10">★</text>
        <text x="150" y="130" fill="#FFD700" fontSize="10">★</text>
        <text x="70" y="200" fill="#FFD700" fontSize="8">★</text>
        <text x="130" y="180" fill="#FFD700" fontSize="8">★</text>
      </svg>
    ),

    // 3 - The Empress (여황제)
    3: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="empressBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#228B22" />
            <stop offset="100%" stopColor="#006400" />
          </linearGradient>
        </defs>
        <rect fill="url(#empressBg)" width="200" height="260"/>
        {/* Forest background */}
        <ellipse cx="30" cy="200" rx="40" ry="80" fill="#2E8B2E"/>
        <ellipse cx="170" cy="180" rx="50" ry="100" fill="#2E8B2E"/>
        {/* Wheat field */}
        <rect x="0" y="220" width="200" height="40" fill="#DAA520"/>
        <line x1="20" y1="220" x2="20" y2="260" stroke="#B8860B" strokeWidth="2"/>
        <line x1="40" y1="225" x2="40" y2="260" stroke="#B8860B" strokeWidth="2"/>
        <line x1="60" y1="220" x2="60" y2="260" stroke="#B8860B" strokeWidth="2"/>
        <line x1="140" y1="225" x2="140" y2="260" stroke="#B8860B" strokeWidth="2"/>
        <line x1="160" y1="220" x2="160" y2="260" stroke="#B8860B" strokeWidth="2"/>
        <line x1="180" y1="225" x2="180" y2="260" stroke="#B8860B" strokeWidth="2"/>
        {/* Throne/cushion */}
        <ellipse cx="100" cy="200" rx="60" ry="30" fill="#DC143C"/>
        {/* Crown with 12 stars */}
        <path d="M70,35 L75,25 L80,35 L85,20 L90,35 L95,25 L100,30 L105,25 L110,35 L115,20 L120,35 L125,25 L130,35"
              fill="none" stroke="#FFD700" strokeWidth="3"/>
        {/* Empress figure */}
        <ellipse cx="100" cy="60" rx="20" ry="25" fill="#FFE4C4"/>
        <path d="M80,50 Q100,35 120,50" fill="#DAA520"/> {/* Hair */}
        <circle cx="92" cy="58" r="3" fill="#4169E1"/>
        <circle cx="108" cy="58" r="3" fill="#4169E1"/>
        <path d="M95,68 Q100,73 105,68" fill="none" stroke="#CD5C5C" strokeWidth="2"/>
        {/* Flowing dress */}
        <path d="M70,85 L40,220 L100,240 L160,220 L130,85 Z" fill="#FFB6C1"/>
        <path d="M70,85 L60,220 L100,240" fill="#FFC0CB"/>
        {/* Pomegranate pattern on dress */}
        <circle cx="80" cy="150" r="8" fill="#DC143C"/>
        <circle cx="120" cy="160" r="8" fill="#DC143C"/>
        <circle cx="95" cy="190" r="8" fill="#DC143C"/>
        {/* Venus symbol */}
        <circle cx="140" cy="180" r="12" fill="none" stroke="#FFD700" strokeWidth="3"/>
        <line x1="140" y1="192" x2="140" y2="210" stroke="#FFD700" strokeWidth="3"/>
        <line x1="132" y1="200" x2="148" y2="200" stroke="#FFD700" strokeWidth="3"/>
        {/* Scepter */}
        <line x1="60" y1="100" x2="50" y2="180" stroke="#FFD700" strokeWidth="4"/>
        <circle cx="48" cy="95" r="10" fill="#FFD700"/>
        {/* Stream/waterfall */}
        <path d="M160,100 Q170,150 165,200 Q160,220 170,240" fill="none" stroke="#87CEEB" strokeWidth="8" opacity="0.7"/>
      </svg>
    ),

    // 4 - The Emperor (황제)
    4: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="emperorBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B0000" />
            <stop offset="100%" stopColor="#4a0000" />
          </linearGradient>
        </defs>
        <rect fill="url(#emperorBg)" width="200" height="260"/>
        {/* Mountains */}
        <polygon points="0,260 50,180 100,260" fill="#696969"/>
        <polygon points="100,260 150,160 200,260" fill="#808080"/>
        {/* Stone throne */}
        <rect x="50" y="120" width="100" height="140" fill="#808080"/>
        <rect x="40" y="100" width="120" height="30" fill="#696969"/>
        {/* Ram heads on throne */}
        <g transform="translate(35, 110)">
          <ellipse cx="15" cy="15" rx="12" ry="10" fill="#A9A9A9"/>
          <path d="M5,10 Q0,5 5,0" fill="none" stroke="#A9A9A9" strokeWidth="4"/>
          <path d="M25,10 Q30,5 25,0" fill="none" stroke="#A9A9A9" strokeWidth="4"/>
        </g>
        <g transform="translate(135, 110)">
          <ellipse cx="15" cy="15" rx="12" ry="10" fill="#A9A9A9"/>
          <path d="M5,10 Q0,5 5,0" fill="none" stroke="#A9A9A9" strokeWidth="4"/>
          <path d="M25,10 Q30,5 25,0" fill="none" stroke="#A9A9A9" strokeWidth="4"/>
        </g>
        {/* Crown */}
        <path d="M80,45 L85,30 L90,40 L95,25 L100,40 L105,25 L110,40 L115,30 L120,45" fill="#FFD700"/>
        {/* Emperor figure */}
        <ellipse cx="100" cy="70" rx="20" ry="25" fill="#FFE4C4"/>
        <rect x="80" y="85" width="40" height="20" fill="#D3D3D3"/> {/* Beard */}
        <circle cx="92" cy="68" r="3" fill="#4A4A4A"/>
        <circle cx="108" cy="68" r="3" fill="#4A4A4A"/>
        {/* Red robe */}
        <path d="M65,95 L50,250 L100,260 L150,250 L135,95 Z" fill="#DC143C"/>
        {/* Armor underneath */}
        <rect x="80" y="100" width="40" height="60" fill="#C0C0C0"/>
        {/* Ankh scepter in right hand */}
        <g transform="translate(140, 100)">
          <circle cx="10" cy="10" r="8" fill="none" stroke="#FFD700" strokeWidth="4"/>
          <line x1="10" y1="18" x2="10" y2="50" stroke="#FFD700" strokeWidth="4"/>
          <line x1="2" y1="30" x2="18" y2="30" stroke="#FFD700" strokeWidth="4"/>
        </g>
        {/* Orb in left hand */}
        <circle cx="55" cy="150" r="15" fill="#FFD700"/>
        <line x1="55" y1="135" x2="55" y2="165" stroke="#DC143C" strokeWidth="2"/>
        <line x1="40" y1="150" x2="70" y2="150" stroke="#DC143C" strokeWidth="2"/>
        {/* Legs/feet */}
        <rect x="80" y="200" width="15" height="50" fill="#8B0000"/>
        <rect x="105" y="200" width="15" height="50" fill="#8B0000"/>
        {/* Mars symbol */}
        <circle cx="170" cy="50" r="10" fill="none" stroke="#FFD700" strokeWidth="2"/>
        <line x1="177" y1="43" x2="188" y2="32" stroke="#FFD700" strokeWidth="2"/>
        <path d="M183,32 L188,32 L188,37" fill="none" stroke="#FFD700" strokeWidth="2"/>
      </svg>
    ),

    // 5 - The Hierophant (교황)
    5: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="hierophantBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a3c2a" />
            <stop offset="100%" stopColor="#2d2416" />
          </linearGradient>
        </defs>
        <rect fill="url(#hierophantBg)" width="200" height="260"/>
        {/* Stone pillars */}
        <rect x="20" y="60" width="25" height="200" fill="#808080"/>
        <rect x="155" y="60" width="25" height="200" fill="#808080"/>
        {/* Triple crown (tiara) */}
        <ellipse cx="100" cy="50" rx="20" ry="15" fill="#FFD700"/>
        <ellipse cx="100" cy="40" rx="17" ry="12" fill="#FFD700"/>
        <ellipse cx="100" cy="32" rx="14" ry="10" fill="#FFD700"/>
        <circle cx="100" cy="22" r="5" fill="#DC143C"/>
        {/* Face */}
        <ellipse cx="100" cy="75" rx="18" ry="22" fill="#FFE4C4"/>
        <circle cx="93" cy="72" r="2" fill="#4A4A4A"/>
        <circle cx="107" cy="72" r="2" fill="#4A4A4A"/>
        <path d="M95,82 L105,82" stroke="#CD5C5C" strokeWidth="2"/>
        {/* Red outer robe */}
        <path d="M65,95 L50,250 L100,260 L150,250 L135,95 Z" fill="#8B0000"/>
        {/* White inner vestment */}
        <path d="M80,95 L75,240 L100,250 L125,240 L120,95 Z" fill="white"/>
        {/* Cross on vestment */}
        <rect x="95" y="110" width="10" height="50" fill="#DC143C"/>
        <rect x="80" y="125" width="40" height="10" fill="#DC143C"/>
        {/* Triple cross staff */}
        <line x1="50" y1="100" x2="50" y2="220" stroke="#FFD700" strokeWidth="5"/>
        <line x1="40" y1="110" x2="60" y2="110" stroke="#FFD700" strokeWidth="3"/>
        <line x1="42" y1="125" x2="58" y2="125" stroke="#FFD700" strokeWidth="3"/>
        <line x1="44" y1="140" x2="56" y2="140" stroke="#FFD700" strokeWidth="3"/>
        {/* Blessing hand */}
        <path d="M140,130 L150,110 L155,115 L160,105" stroke="#FFE4C4" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Two keys crossed at bottom */}
        <g transform="translate(80, 200)">
          <line x1="0" y1="40" x2="40" y2="0" stroke="#FFD700" strokeWidth="4"/>
          <circle cx="5" cy="35" r="8" fill="none" stroke="#FFD700" strokeWidth="3"/>
          <line x1="40" y1="40" x2="0" y2="0" stroke="#C0C0C0" strokeWidth="4"/>
          <circle cx="35" cy="35" r="8" fill="none" stroke="#C0C0C0" strokeWidth="3"/>
        </g>
        {/* Two acolytes at bottom */}
        <ellipse cx="45" cy="230" rx="12" ry="15" fill="#FFE4C4"/>
        <rect x="35" y="240" width="20" height="30" fill="#8B0000"/>
        <ellipse cx="155" cy="230" rx="12" ry="15" fill="#FFE4C4"/>
        <rect x="145" y="240" width="20" height="30" fill="#8B0000"/>
      </svg>
    ),

    // 6 - The Lovers (연인)
    6: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="loversBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="50%" stopColor="#E0F4FF" />
            <stop offset="100%" stopColor="#90EE90" />
          </linearGradient>
        </defs>
        <rect fill="url(#loversBg)" width="200" height="260"/>
        {/* Sun/Angel above */}
        <circle cx="100" cy="40" r="30" fill="#FFD700" opacity="0.8"/>
        {/* Angel figure */}
        <ellipse cx="100" cy="50" rx="15" ry="18" fill="#FFE4C4"/>
        <path d="M70,60 Q100,30 130,60" fill="#E6E6FA"/> {/* Wings left */}
        <path d="M60,70 Q100,35 140,70" fill="#E6E6FA"/> {/* Wings expanded */}
        <circle cx="95" cy="48" r="2" fill="#4A4A4A"/>
        <circle cx="105" cy="48" r="2" fill="#4A4A4A"/>
        {/* Angel's red robe */}
        <path d="M90,65 L85,100 L100,110 L115,100 L110,65 Z" fill="#DC143C"/>
        {/* Flames/rays from angel */}
        <path d="M70,90 L60,85 M130,90 L140,85" stroke="#FFD700" strokeWidth="2"/>
        {/* Tree of Knowledge (right - with serpent) */}
        <rect x="140" y="130" width="15" height="100" fill="#8B4513"/>
        <ellipse cx="150" cy="120" rx="30" ry="35" fill="#228B22"/>
        {/* Apples */}
        <circle cx="140" cy="110" r="6" fill="#DC143C"/>
        <circle cx="155" cy="100" r="6" fill="#DC143C"/>
        <circle cx="165" cy="115" r="6" fill="#DC143C"/>
        {/* Serpent */}
        <path d="M175,180 Q165,150 155,130 Q145,115 150,105" fill="none" stroke="#228B22" strokeWidth="4"/>
        <circle cx="150" cy="102" r="4" fill="#228B22"/>
        {/* Tree of Life (left - with flames) */}
        <rect x="45" y="130" width="15" height="100" fill="#8B4513"/>
        <ellipse cx="50" cy="120" rx="25" ry="35" fill="#228B22"/>
        {/* Flames on tree */}
        <path d="M35,100 Q40,85 45,100 Q50,85 55,100 Q60,85 65,100" fill="#FF6347"/>
        {/* Eve (right) */}
        <ellipse cx="130" cy="170" rx="15" ry="18" fill="#FFE4C4"/>
        <path d="M120,160 Q130,150 140,160" fill="#DAA520"/> {/* Hair */}
        <circle cx="126" cy="168" r="2" fill="#4A4A4A"/>
        <circle cx="134" cy="168" r="2" fill="#4A4A4A"/>
        <ellipse cx="130" cy="220" rx="18" ry="40" fill="#FFE4C4"/>
        {/* Adam (left) */}
        <ellipse cx="70" cy="170" rx="15" ry="18" fill="#FFE4C4"/>
        <path d="M60,162 Q70,155 80,162" fill="#8B4513"/> {/* Hair */}
        <circle cx="66" cy="168" r="2" fill="#4A4A4A"/>
        <circle cx="74" cy="168" r="2" fill="#4A4A4A"/>
        <ellipse cx="70" cy="220" rx="18" ry="40" fill="#FFE4C4"/>
        {/* Mountain */}
        <polygon points="85,260 100,200 115,260" fill="#808080"/>
      </svg>
    ),

    // 7 - The Chariot (전차)
    7: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="chariotBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a4a" />
            <stop offset="100%" stopColor="#2a2a6a" />
          </linearGradient>
        </defs>
        <rect fill="url(#chariotBg)" width="200" height="260"/>
        {/* Stars */}
        <text x="30" y="30" fill="#FFD700" fontSize="12">★</text>
        <text x="170" y="40" fill="#FFD700" fontSize="10">★</text>
        <text x="50" y="60" fill="#FFD700" fontSize="8">★</text>
        <text x="150" y="55" fill="#FFD700" fontSize="8">★</text>
        {/* Canopy with stars */}
        <rect x="40" y="70" width="120" height="60" fill="#4169E1"/>
        <text x="60" y="100" fill="#FFD700" fontSize="14">★ ★ ★</text>
        {/* Charioteer */}
        <ellipse cx="100" cy="60" rx="18" ry="22" fill="#FFE4C4"/>
        <rect x="85" y="50" width="30" height="15" fill="#FFD700"/> {/* Crown */}
        <circle cx="93" cy="58" r="2" fill="#4A4A4A"/>
        <circle cx="107" cy="58" r="2" fill="#4A4A4A"/>
        {/* Armor */}
        <rect x="75" y="80" width="50" height="50" fill="#C0C0C0"/>
        <rect x="80" y="85" width="40" height="10" fill="#FFD700"/> {/* Shoulder pieces */}
        {/* Crescent moons on shoulders */}
        <path d="M70,90 Q65,100 70,110" fill="#C0C0C0" stroke="#4169E1" strokeWidth="2"/>
        <path d="M130,90 Q135,100 130,110" fill="#C0C0C0" stroke="#4169E1" strokeWidth="2"/>
        {/* Square on chest (Urim & Thummim) */}
        <rect x="88" y="100" width="24" height="24" fill="#FFD700"/>
        {/* Chariot body */}
        <path d="M30,130 L30,200 L170,200 L170,130 Z" fill="#4169E1"/>
        <rect x="35" y="135" width="130" height="60" fill="#1a1a4a"/>
        {/* Wings on chariot */}
        <path d="M35,150 L10,145 L20,155 L5,160 L20,165 L10,175 L35,170" fill="#FFD700"/>
        <path d="M165,150 L190,145 L180,155 L195,160 L180,165 L190,175 L165,170" fill="#FFD700"/>
        {/* Lingam-Yoni symbol on front */}
        <ellipse cx="100" cy="175" rx="20" ry="15" fill="#FFD700"/>
        <ellipse cx="100" cy="170" rx="8" ry="12" fill="#C0C0C0"/>
        {/* Wheels */}
        <circle cx="50" cy="220" r="25" fill="#8B4513" stroke="#FFD700" strokeWidth="3"/>
        <circle cx="50" cy="220" r="5" fill="#FFD700"/>
        <circle cx="150" cy="220" r="25" fill="#8B4513" stroke="#FFD700" strokeWidth="3"/>
        <circle cx="150" cy="220" r="5" fill="#FFD700"/>
        {/* Two sphinxes */}
        <g transform="translate(20, 195)">
          <ellipse cx="30" cy="30" rx="25" ry="15" fill="#2C2C2C"/>
          <circle cx="40" cy="20" r="12" fill="#2C2C2C"/>
          <circle cx="43" cy="18" r="2" fill="#FFD700"/>
        </g>
        <g transform="translate(120, 195)">
          <ellipse cx="30" cy="30" rx="25" ry="15" fill="#E8E8E8"/>
          <circle cx="20" cy="20" r="12" fill="#E8E8E8"/>
          <circle cx="17" cy="18" r="2" fill="#4169E1"/>
        </g>
        {/* Staff/wand */}
        <line x1="140" y1="80" x2="155" y2="50" stroke="#8B4513" strokeWidth="4"/>
      </svg>
    ),

    // 8 - Strength (힘)
    8: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="strengthBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        <rect fill="url(#strengthBg)" width="200" height="260"/>
        {/* Mountains in background */}
        <polygon points="0,260 40,200 80,260" fill="#8B7355"/>
        <polygon points="120,260 160,190 200,260" fill="#6B5344"/>
        {/* Infinity symbol */}
        <path d="M80,35 C80,25 95,25 100,35 C105,25 120,25 120,35 C120,45 105,45 100,35 C95,45 80,45 80,35"
              fill="none" stroke="#FFD700" strokeWidth="3"/>
        {/* Woman figure */}
        <ellipse cx="100" cy="70" rx="20" ry="25" fill="#FFE4C4"/>
        <path d="M75,55 Q100,40 125,55" fill="#DAA520"/> {/* Flowing hair */}
        <path d="M70,70 Q60,90 65,110" fill="#DAA520"/>
        <path d="M130,70 Q140,90 135,110" fill="#DAA520"/>
        <circle cx="93" cy="68" r="3" fill="#4A4A4A"/>
        <circle cx="107" cy="68" r="3" fill="#4A4A4A"/>
        <path d="M95,78 Q100,82 105,78" fill="none" stroke="#CD5C5C" strokeWidth="2"/>
        {/* White flowing dress */}
        <path d="M70,95 L50,260 L100,260 L150,260 L130,95 Z" fill="white"/>
        <path d="M70,95 L75,200 L100,260" fill="#F5F5F5"/>
        {/* Flower wreath */}
        <circle cx="85" cy="50" r="5" fill="#FF69B4"/>
        <circle cx="100" cy="45" r="5" fill="#FF69B4"/>
        <circle cx="115" cy="50" r="5" fill="#FF69B4"/>
        {/* Rose belt */}
        <circle cx="90" cy="115" r="6" fill="#DC143C"/>
        <circle cx="110" cy="115" r="6" fill="#DC143C"/>
        {/* Woman's arms reaching to lion */}
        <path d="M70,100 Q50,120 55,150" stroke="#FFE4C4" strokeWidth="10" fill="none" strokeLinecap="round"/>
        <path d="M130,100 Q150,120 145,150" stroke="#FFE4C4" strokeWidth="10" fill="none" strokeLinecap="round"/>
        {/* Lion */}
        <ellipse cx="100" cy="200" rx="55" ry="40" fill="#DAA520"/>
        {/* Lion's mane */}
        <path d="M50,170 Q30,180 35,200 Q25,210 35,220 Q30,235 50,240" fill="#CD853F"/>
        <path d="M150,170 Q170,180 165,200 Q175,210 165,220 Q170,235 150,240" fill="#CD853F"/>
        {/* Lion's face */}
        <ellipse cx="100" cy="175" rx="25" ry="20" fill="#DAA520"/>
        <circle cx="90" cy="172" r="4" fill="#4A4A4A"/>
        <circle cx="110" cy="172" r="4" fill="#4A4A4A"/>
        <ellipse cx="100" cy="182" rx="8" ry="5" fill="#8B4513"/>
        {/* Lion's mouth being held open */}
        <path d="M85,188 Q100,200 115,188" fill="#8B0000"/>
        <path d="M55,155 Q75,175 85,188" stroke="#FFE4C4" strokeWidth="6" fill="none"/>
        <path d="M145,155 Q125,175 115,188" stroke="#FFE4C4" strokeWidth="6" fill="none"/>
        {/* Lion's tail */}
        <path d="M155,200 Q175,190 180,210 Q185,220 175,230" fill="none" stroke="#DAA520" strokeWidth="8"/>
        <circle cx="175" cy="235" r="8" fill="#CD853F"/>
      </svg>
    ),

    // 9 - The Hermit (은둔자)
    9: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="hermitBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2C3E50" />
            <stop offset="100%" stopColor="#1a252f" />
          </linearGradient>
        </defs>
        <rect fill="url(#hermitBg)" width="200" height="260"/>
        {/* Snow-capped mountains */}
        <polygon points="0,260 50,180 100,260" fill="#4a5568"/>
        <polygon points="30,180 50,150 70,180" fill="white"/>
        <polygon points="100,260 150,160 200,260" fill="#2d3748"/>
        <polygon points="130,160 150,130 170,160" fill="white"/>
        {/* Stars in sky */}
        <text x="30" y="50" fill="#FFD700" fontSize="10">★</text>
        <text x="170" y="40" fill="#FFD700" fontSize="8">★</text>
        <text x="50" y="80" fill="#FFD700" fontSize="6">★</text>
        {/* Hermit figure */}
        {/* Hood */}
        <path d="M70,50 Q100,30 130,50 L130,90 L70,90 Z" fill="#808080"/>
        {/* Face */}
        <ellipse cx="100" cy="80" rx="18" ry="20" fill="#FFE4C4"/>
        <circle cx="93" cy="78" r="2" fill="#4A4A4A"/>
        <circle cx="107" cy="78" r="2" fill="#4A4A4A"/>
        {/* Long beard */}
        <path d="M85,90 Q100,150 115,90" fill="#D3D3D3"/>
        <path d="M80,95 Q100,160 120,95" fill="#E8E8E8"/>
        {/* Grey cloak */}
        <path d="M60,90 L40,260 L100,260 L160,260 L140,90 Z" fill="#696969"/>
        <path d="M60,90 L55,200 L100,260" fill="#808080"/>
        {/* Right hand holding staff */}
        <ellipse cx="135" cy="130" rx="10" ry="8" fill="#FFE4C4"/>
        {/* Staff */}
        <line x1="140" y1="50" x2="150" y2="250" stroke="#8B4513" strokeWidth="6"/>
        {/* Lantern */}
        <g transform="translate(115, 40)">
          <rect x="5" y="10" width="20" height="30" fill="#2C2C2C"/>
          <rect x="8" y="13" width="14" height="24" fill="#FFD700"/>
          {/* Six-pointed star in lantern */}
          <polygon points="15,20 12,26 18,26" fill="#FF6347"/>
          <polygon points="15,28 12,22 18,22" fill="#FF6347"/>
          {/* Light rays */}
          <line x1="30" y1="25" x2="50" y2="25" stroke="#FFD700" strokeWidth="2" opacity="0.7"/>
          <line x1="28" y1="15" x2="45" y2="5" stroke="#FFD700" strokeWidth="2" opacity="0.7"/>
          <line x1="28" y1="35" x2="45" y2="45" stroke="#FFD700" strokeWidth="2" opacity="0.7"/>
        </g>
        {/* Left hand holding cloak */}
        <ellipse cx="65" cy="140" rx="10" ry="8" fill="#FFE4C4"/>
      </svg>
    ),

    // 10 - Wheel of Fortune (운명의 수레바퀴)
    10: (
      <svg viewBox="0 0 200 260" width={width} height={height}>
        <defs>
          <linearGradient id="wheelBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4169E1" />
            <stop offset="100%" stopColor="#1a1a6a" />
          </linearGradient>
        </defs>
        <rect fill="url(#wheelBg)" width="200" height="260"/>
        {/* Clouds */}
        <ellipse cx="30" cy="40" rx="30" ry="20" fill="#E8E8E8" opacity="0.7"/>
        <ellipse cx="170" cy="50" rx="35" ry="25" fill="#E8E8E8" opacity="0.7"/>
        <ellipse cx="40" cy="220" rx="30" ry="20" fill="#E8E8E8" opacity="0.7"/>
        <ellipse cx="160" cy="230" rx="35" ry="25" fill="#E8E8E8" opacity="0.7"/>
        {/* Four creatures in corners */}
        {/* Angel (top left) */}
        <g transform="translate(10, 20)">
          <ellipse cx="25" cy="25" rx="15" ry="18" fill="#FFE4C4"/>
          <path d="M10,30 Q25,15 40,30" fill="#E6E6FA"/>
          <rect x="15" y="40" width="20" height="15" fill="#E6E6FA"/>
        </g>
        {/* Eagle (top right) */}
        <g transform="translate(150, 20)">
          <ellipse cx="25" cy="25" rx="12" ry="15" fill="#8B4513"/>
          <polygon points="25,35 20,45 30,45" fill="#FFD700"/>
          <path d="M5,30 Q25,20 45,30" fill="#8B4513"/>
        </g>
        {/* Lion (bottom left) */}
        <g transform="translate(10, 200)">
          <ellipse cx="25" cy="25" rx="20" ry="15" fill="#DAA520"/>
          <path d="M10,15 Q25,5 40,15" fill="#CD853F"/>
          <circle cx="20" cy="22" r="2" fill="#4A4A4A"/>
          <circle cx="30" cy="22" r="2" fill="#4A4A4A"/>
        </g>
        {/* Bull (bottom right) */}
        <g transform="translate(150, 200)">
          <ellipse cx="25" cy="25" rx="18" ry="15" fill="#8B4513"/>
          <path d="M8,18 Q5,10 10,15" fill="#8B4513" stroke="#8B4513" strokeWidth="3"/>
          <path d="M42,18 Q45,10 40,15" fill="#8B4513" stroke="#8B4513" strokeWidth="3"/>
        </g>
        {/* Main wheel */}
        <circle cx="100" cy="130" r="70" fill="#FFD700" stroke="#DAA520" strokeWidth="5"/>
        <circle cx="100" cy="130" r="55" fill="#4169E1"/>
        <circle cx="100" cy="130" r="40" fill="#FFD700"/>
        <circle cx="100" cy="130" r="25" fill="#4169E1"/>
        {/* TARO letters */}
        <text x="100" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">T</text>
        <text x="145" y="135" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">A</text>
        <text x="100" y="185" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">R</text>
        <text x="55" y="135" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">O</text>
        {/* Alchemical symbols */}
        <text x="100" y="105" textAnchor="middle" fill="#FFD700" fontSize="12">☿</text>
        <text x="125" y="135" textAnchor="middle" fill="#FFD700" fontSize="12">🜄</text>
        <text x="100" y="165" textAnchor="middle" fill="#FFD700" fontSize="12">🜂</text>
        <text x="75" y="135" textAnchor="middle" fill="#FFD700" fontSize="12">🜃</text>
        {/* Spokes */}
        <line x1="100" y1="60" x2="100" y2="200" stroke="#DAA520" strokeWidth="3"/>
        <line x1="30" y1="130" x2="170" y2="130" stroke="#DAA520" strokeWidth="3"/>
        <line x1="50" y1="80" x2="150" y2="180" stroke="#DAA520" strokeWidth="3"/>
        <line x1="50" y1="180" x2="150" y2="80" stroke="#DAA520" strokeWidth="3"/>
        {/* Sphinx on top */}
        <g transform="translate(75, 45)">
          <ellipse cx="25" cy="20" rx="20" ry="12" fill="#4169E1"/>
          <circle cx="25" cy="10" r="10" fill="#FFE4C4"/>
          <rect x="15" y="5" width="20" height="8" fill="#FFD700"/>
          <line x1="45" y1="25" x2="55" y2="35" stroke="#4169E1" strokeWidth="4"/>
        </g>
        {/* Anubis on right (going up) */}
        <g transform="translate(155, 100)">
          <ellipse cx="15" cy="20" rx="12" ry="18" fill="#2C2C2C"/>
          <polygon points="15,5 10,15 20,15" fill="#2C2C2C"/>
          <circle cx="12" cy="12" r="2" fill="#FFD700"/>
        </g>
        {/* Typhon/serpent on left (going down) */}
        <g transform="translate(20, 110)">
          <path d="M20,0 Q10,20 20,40 Q30,50 20,60" fill="none" stroke="#DC143C" strokeWidth="6"/>
          <circle cx="20" cy="5" r="6" fill="#DC143C"/>
        </g>
      </svg>
    ),

    // Continue with more cards...
    11: createSimpleMajorCard(11, "⚖️", "#8B0000", "Justice"),
    12: createSimpleMajorCard(12, "🙃", "#4169E1", "Hanged Man"),
    13: createSimpleMajorCard(13, "💀", "#1a1a1a", "Death"),
    14: createSimpleMajorCard(14, "👼", "#9370DB", "Temperance"),
    15: createSimpleMajorCard(15, "😈", "#2C2C2C", "Devil"),
    16: createSimpleMajorCard(16, "🗼", "#4a4a4a", "Tower"),
    17: createSimpleMajorCard(17, "⭐", "#1a1a6a", "Star"),
    18: createSimpleMajorCard(18, "🌙", "#2a2a5a", "Moon"),
    19: createSimpleMajorCard(19, "☀️", "#FFD700", "Sun"),
    20: createSimpleMajorCard(20, "📯", "#4169E1", "Judgement"),
    21: createSimpleMajorCard(21, "🌍", "#6B8E23", "World"),
  };

  return illustrations[number] || createSimpleMajorCard(number, "✦", "#4a4a4a", "Unknown");
};

// Helper function for simpler major arcana cards
function createSimpleMajorCard(number: number, symbol: string, bgColor: string, name: string): JSX.Element {
  return (
    <svg viewBox="0 0 200 260" width="100%" height="100%">
      <defs>
        <linearGradient id={`grad${number}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="100%" stopColor="#3d3d5c" />
        </linearGradient>
        <filter id={`glow${number}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect fill={`url(#grad${number})`} width="200" height="260"/>
      {/* Decorative border */}
      <rect x="10" y="10" width="180" height="240" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5"/>
      <rect x="20" y="20" width="160" height="220" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.3"/>
      {/* Main symbol */}
      <text x="100" y="150" textAnchor="middle" fontSize="80" filter={`url(#glow${number})`}>
        {symbol}
      </text>
      {/* Decorative elements */}
      <text x="100" y="40" textAnchor="middle" fill="#FFD700" fontSize="12" opacity="0.7">✦ ✦ ✦</text>
      <text x="100" y="245" textAnchor="middle" fill="#FFD700" fontSize="12" opacity="0.7">✦ ✦ ✦</text>
    </svg>
  );
}

// Minor Arcana Illustration
const MinorArcanaIllustration = ({
  suit,
  number,
  size
}: {
  suit: string;
  number: number;
  size: 'sm' | 'md' | 'lg' | 'xl'
}) => {
  const { width, height } = illustrationSize[size];
  const config = suitConfig[suit];

  const suitSymbols: Record<string, string> = {
    WANDS: '🪄',
    CUPS: '🏆',
    SWORDS: '⚔️',
    PENTACLES: '⭐'
  };

  const symbol = suitSymbols[suit] || '✦';
  const displayCount = Math.min(number, 10);

  return (
    <svg viewBox="0 0 200 260" width={width} height={height}>
      <defs>
        <linearGradient id={`minorGrad${suit}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={config?.color || '#666'} stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3d3d5c" />
        </linearGradient>
      </defs>
      <rect fill={`url(#minorGrad${suit})`} width="200" height="260"/>

      {/* Decorative frame */}
      <rect x="10" y="10" width="180" height="240" fill="none" stroke={config?.color || '#666'} strokeWidth="2" opacity="0.5" rx="10"/>

      {/* Suit symbols arrangement */}
      <g transform="translate(100, 130)">
        {Array.from({ length: displayCount }, (_, i) => {
          const cols = displayCount <= 3 ? 1 : displayCount <= 6 ? 2 : 3;
          const rows = Math.ceil(displayCount / cols);
          const col = i % cols;
          const row = Math.floor(i / cols);
          const xOffset = (col - (cols - 1) / 2) * 45;
          const yOffset = (row - (rows - 1) / 2) * 45;

          return (
            <text
              key={i}
              x={xOffset}
              y={yOffset}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={displayCount <= 4 ? "40" : displayCount <= 6 ? "32" : "26"}
            >
              {symbol}
            </text>
          );
        })}
      </g>

      {/* Court card special treatment */}
      {number > 10 && (
        <g>
          <text x="100" y="80" textAnchor="middle" fontSize="50">
            {number === 11 ? '🧒' : number === 12 ? '🏇' : number === 13 ? '👸' : '🤴'}
          </text>
          <text x="100" y="200" textAnchor="middle" fontSize="40">{symbol}</text>
        </g>
      )}
    </svg>
  );
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

  const getNumberDisplay = () => {
    if (isMajor) {
      return card.number.toString().padStart(2, '0');
    }
    if (card.number <= 10) {
      return card.number === 1 ? 'A' : card.number.toString();
    }
    const courtNames: Record<number, string> = { 11: 'P', 12: 'Kn', 13: 'Q', 14: 'K' };
    return courtNames[card.number] || card.number.toString();
  };

  const getGradient = () => {
    if (isMajor) {
      return 'from-purple-950 via-indigo-950 to-slate-950';
    }
    return suitInfo?.bgGradient || 'from-slate-900 to-slate-950';
  };

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
        {/* Card Back */}
        <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
          <div className="absolute inset-2 rounded-xl border border-accent/40" />
          <div className="absolute inset-4 rounded-lg border border-accent/20" />

          {/* Ornate center design */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                className="w-28 h-28 rounded-full border-2 border-accent/60 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/30 to-purple-900/50 flex items-center justify-center border border-accent/40">
                  <span className="text-4xl text-accent">✦</span>
                </div>
              </motion.div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-accent/60">★</div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-accent/60">★</div>
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 text-accent/60">★</div>
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-accent/60">★</div>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 text-center">
            <span className="text-accent/80 text-sm tracking-[0.4em] font-serif">TAROT</span>
          </div>

          <div className="absolute top-4 left-4 text-accent/40 text-xl">✧</div>
          <div className="absolute top-4 right-4 text-accent/40 text-xl">✧</div>
          <div className="absolute bottom-4 left-4 text-accent/40 text-xl rotate-180">✧</div>
          <div className="absolute bottom-4 right-4 text-accent/40 text-xl rotate-180">✧</div>
        </div>

        {/* Card Front */}
        <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden rotate-y-180 shadow-2xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`} />

          <div className={`relative w-full h-full flex flex-col ${isReversed ? 'rotate-180' : ''}`}>
            {/* Top section */}
            <div className="flex justify-between items-start p-3">
              <span className={`${textSize.number} font-bold text-accent drop-shadow-lg`}>
                {getNumberDisplay()}
              </span>
              {!isMajor && suitInfo && (
                <span className="text-lg" style={{ color: suitInfo.color }}>{suitInfo.name}</span>
              )}
            </div>

            {/* Main illustration area */}
            <div className="flex-1 flex items-center justify-center px-2 py-1">
              {isMajor ? (
                <MajorArcanaIllustration number={card.number} size={size} />
              ) : (
                <MinorArcanaIllustration suit={suit || 'WANDS'} number={card.number} size={size} />
              )}
            </div>

            {/* Keywords */}
            {(size === 'lg' || size === 'xl') && card.keywords && card.keywords.length > 0 && (
              <div className="px-3 pb-1">
                <div className="flex flex-wrap justify-center gap-1">
                  {card.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className={`${textSize.keyword} bg-black/60 backdrop-blur-sm text-white/90 px-2 py-1 rounded-full`}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom section */}
            <div className="flex justify-between items-end p-3">
              {!isMajor && suitInfo && (
                <span className="text-lg" style={{ color: suitInfo.color }}>{suitInfo.name}</span>
              )}
              <span className={`${textSize.number} font-bold text-accent drop-shadow-lg rotate-180 ml-auto`}>
                {getNumberDisplay()}
              </span>
            </div>
          </div>

          {/* Card name overlay */}
          {showName && (
            <div className={`
              absolute left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent
              ${isReversed ? 'top-0 bg-gradient-to-b' : 'bottom-0'}
              py-3 px-2
            `}>
              <p className={`text-white text-center ${textSize.name} font-bold ${isReversed ? 'rotate-180' : ''}`}>
                {card.nameKo}
                {isReversed && <span className="text-red-400 ml-2">(역방향)</span>}
              </p>
              {(size === 'lg' || size === 'xl') && (
                <p className={`text-white/60 text-center text-xs mt-1 ${isReversed ? 'rotate-180' : ''}`}>
                  {card.nameEn}
                </p>
              )}
            </div>
          )}

          {/* Decorative border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-accent/40 pointer-events-none" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TarotCard;

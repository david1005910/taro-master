import { PrismaClient } from '@prisma/client';
import { Solar, Lunar } from 'lunar-javascript';

const prisma = new PrismaClient();

// 천간 (Heavenly Stems) - 10개
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const HEAVENLY_STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 지지 (Earthly Branches) - 12개
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const EARTHLY_BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const EARTHLY_BRANCHES_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

// 오행 (Five Elements)
const FIVE_ELEMENTS = {
  WOOD: '목',
  FIRE: '화',
  EARTH: '토',
  METAL: '금',
  WATER: '수'
};

// 천간의 오행
const STEM_ELEMENTS: Record<string, string> = {
  '갑': 'WOOD', '을': 'WOOD',
  '병': 'FIRE', '정': 'FIRE',
  '무': 'EARTH', '기': 'EARTH',
  '경': 'METAL', '신': 'METAL',
  '임': 'WATER', '계': 'WATER'
};

// 지지의 오행
const BRANCH_ELEMENTS: Record<string, string> = {
  '자': 'WATER', '축': 'EARTH', '인': 'WOOD', '묘': 'WOOD',
  '진': 'EARTH', '사': 'FIRE', '오': 'FIRE', '미': 'EARTH',
  '신': 'METAL', '유': 'METAL', '술': 'EARTH', '해': 'WATER'
};

// 천간의 음양
const STEM_YIN_YANG: Record<string, string> = {
  '갑': '양', '을': '음',
  '병': '양', '정': '음',
  '무': '양', '기': '음',
  '경': '양', '신': '음',
  '임': '양', '계': '음'
};

// 지지의 음양
const BRANCH_YIN_YANG: Record<string, string> = {
  '자': '양', '축': '음', '인': '양', '묘': '음',
  '진': '양', '사': '음', '오': '양', '미': '음',
  '신': '양', '유': '음', '술': '양', '해': '음'
};

// 시간대에 따른 시지 매핑
const HOUR_TO_BRANCH: Record<number, number> = {
  23: 0, 0: 0,   // 자시 (23:00-01:00)
  1: 1, 2: 1,    // 축시 (01:00-03:00)
  3: 2, 4: 2,    // 인시 (03:00-05:00)
  5: 3, 6: 3,    // 묘시 (05:00-07:00)
  7: 4, 8: 4,    // 진시 (07:00-09:00)
  9: 5, 10: 5,   // 사시 (09:00-11:00)
  11: 6, 12: 6,  // 오시 (11:00-13:00)
  13: 7, 14: 7,  // 미시 (13:00-15:00)
  15: 8, 16: 8,  // 신시 (15:00-17:00)
  17: 9, 18: 9,  // 유시 (17:00-19:00)
  19: 10, 20: 10, // 술시 (19:00-21:00)
  21: 11, 22: 11  // 해시 (21:00-23:00)
};

interface SajuInput {
  userId: string;
  name: string;
  birthDate: Date;
  birthTime?: string; // HH:mm 형식
  isLunar?: boolean;
  gender?: 'male' | 'female' | 'unknown';
}

interface FourPillars {
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem?: string;
  hourBranch?: string;
}

interface ElementCount {
  woodCount: number;
  fireCount: number;
  earthCount: number;
  metalCount: number;
  waterCount: number;
}

export class SajuService {
  // 사주 계산 및 저장
  async calculateAndSave(input: SajuInput) {
    const { userId, name, birthDate, birthTime, isLunar = false, gender = 'unknown' } = input;

    // 양력 또는 음력으로 Solar/Lunar 객체 생성
    let lunar: any;
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    if (isLunar) {
      // 음력 입력인 경우
      lunar = Lunar.fromYmd(year, month, day);
    } else {
      // 양력 입력인 경우 음력으로 변환
      const solar = Solar.fromYmd(year, month, day);
      lunar = solar.getLunar();
    }

    // 사주 팔자 계산
    const fourPillars = this.calculateFourPillars(lunar, birthTime);

    // 오행 분포 계산
    const elementCount = this.calculateElementCount(fourPillars);

    // 기본 해석 생성
    const interpretation = this.generateBasicInterpretation(fourPillars, elementCount, gender);

    // DB에 저장
    const sajuReading = await prisma.sajuReading.create({
      data: {
        userId,
        name,
        birthDate,
        birthTime: birthTime || null,
        isLunar,
        gender,
        ...fourPillars,
        ...elementCount,
        interpretation
      }
    });

    return {
      ...sajuReading,
      fourPillarsDisplay: this.getFourPillarsDisplay(fourPillars),
      elementAnalysis: this.getElementAnalysis(elementCount),
      zodiacAnimal: EARTHLY_BRANCHES_ANIMALS[EARTHLY_BRANCHES.indexOf(fourPillars.yearBranch)]
    };
  }

  // 사주 팔자 계산
  private calculateFourPillars(lunar: any, birthTime?: string): FourPillars {
    // lunar-javascript의 팔자 객체 사용
    const eightChar = lunar.getEightChar();

    const yearStem = eightChar.getYearGan();
    const yearBranch = eightChar.getYearZhi();
    const monthStem = eightChar.getMonthGan();
    const monthBranch = eightChar.getMonthZhi();
    const dayStem = eightChar.getDayGan();
    const dayBranch = eightChar.getDayZhi();

    // 한글로 변환
    const result: FourPillars = {
      yearStem: this.hanjaToKorean(yearStem, 'stem'),
      yearBranch: this.hanjaToKorean(yearBranch, 'branch'),
      monthStem: this.hanjaToKorean(monthStem, 'stem'),
      monthBranch: this.hanjaToKorean(monthBranch, 'branch'),
      dayStem: this.hanjaToKorean(dayStem, 'stem'),
      dayBranch: this.hanjaToKorean(dayBranch, 'branch')
    };

    // 시간이 있으면 시주 계산
    if (birthTime) {
      const [hours] = birthTime.split(':').map(Number);
      const branchIndex = HOUR_TO_BRANCH[hours];

      if (branchIndex !== undefined) {
        // 시간(時干) 계산 - 일간에 따라 결정
        const dayStemIndex = HEAVENLY_STEMS.indexOf(result.dayStem);
        const hourStemIndex = (dayStemIndex * 2 + branchIndex) % 10;

        result.hourStem = HEAVENLY_STEMS[hourStemIndex];
        result.hourBranch = EARTHLY_BRANCHES[branchIndex];
      }
    }

    return result;
  }

  // 한자를 한글로 변환
  private hanjaToKorean(hanja: string, type: 'stem' | 'branch'): string {
    if (type === 'stem') {
      const index = HEAVENLY_STEMS_HANJA.indexOf(hanja);
      return index !== -1 ? HEAVENLY_STEMS[index] : hanja;
    } else {
      const index = EARTHLY_BRANCHES_HANJA.indexOf(hanja);
      return index !== -1 ? EARTHLY_BRANCHES[index] : hanja;
    }
  }

  // 오행 분포 계산
  private calculateElementCount(fourPillars: FourPillars): ElementCount {
    const count: ElementCount = {
      woodCount: 0,
      fireCount: 0,
      earthCount: 0,
      metalCount: 0,
      waterCount: 0
    };

    const addElement = (char: string, type: 'stem' | 'branch') => {
      const element = type === 'stem' ? STEM_ELEMENTS[char] : BRANCH_ELEMENTS[char];
      if (element === 'WOOD') count.woodCount++;
      else if (element === 'FIRE') count.fireCount++;
      else if (element === 'EARTH') count.earthCount++;
      else if (element === 'METAL') count.metalCount++;
      else if (element === 'WATER') count.waterCount++;
    };

    // 년주
    addElement(fourPillars.yearStem, 'stem');
    addElement(fourPillars.yearBranch, 'branch');
    // 월주
    addElement(fourPillars.monthStem, 'stem');
    addElement(fourPillars.monthBranch, 'branch');
    // 일주
    addElement(fourPillars.dayStem, 'stem');
    addElement(fourPillars.dayBranch, 'branch');
    // 시주 (있는 경우)
    if (fourPillars.hourStem) addElement(fourPillars.hourStem, 'stem');
    if (fourPillars.hourBranch) addElement(fourPillars.hourBranch, 'branch');

    return count;
  }

  // 사주 팔자 표시용 데이터
  private getFourPillarsDisplay(fourPillars: FourPillars) {
    const getYinYang = (stem: string) => STEM_YIN_YANG[stem] || '';
    const getStemElement = (stem: string) => FIVE_ELEMENTS[STEM_ELEMENTS[stem] as keyof typeof FIVE_ELEMENTS] || '';
    const getBranchElement = (branch: string) => FIVE_ELEMENTS[BRANCH_ELEMENTS[branch] as keyof typeof FIVE_ELEMENTS] || '';

    return {
      year: {
        stem: fourPillars.yearStem,
        branch: fourPillars.yearBranch,
        stemElement: getStemElement(fourPillars.yearStem),
        branchElement: getBranchElement(fourPillars.yearBranch),
        yinYang: getYinYang(fourPillars.yearStem),
        animal: EARTHLY_BRANCHES_ANIMALS[EARTHLY_BRANCHES.indexOf(fourPillars.yearBranch)]
      },
      month: {
        stem: fourPillars.monthStem,
        branch: fourPillars.monthBranch,
        stemElement: getStemElement(fourPillars.monthStem),
        branchElement: getBranchElement(fourPillars.monthBranch),
        yinYang: getYinYang(fourPillars.monthStem)
      },
      day: {
        stem: fourPillars.dayStem,
        branch: fourPillars.dayBranch,
        stemElement: getStemElement(fourPillars.dayStem),
        branchElement: getBranchElement(fourPillars.dayBranch),
        yinYang: getYinYang(fourPillars.dayStem)
      },
      hour: fourPillars.hourStem ? {
        stem: fourPillars.hourStem,
        branch: fourPillars.hourBranch!,
        stemElement: getStemElement(fourPillars.hourStem),
        branchElement: getBranchElement(fourPillars.hourBranch!),
        yinYang: getYinYang(fourPillars.hourStem)
      } : null
    };
  }

  // 오행 분석
  private getElementAnalysis(elementCount: ElementCount) {
    const total = elementCount.woodCount + elementCount.fireCount +
                  elementCount.earthCount + elementCount.metalCount + elementCount.waterCount;

    const elements = [
      { name: '목(木)', count: elementCount.woodCount, emoji: '🌳', color: '#22c55e' },
      { name: '화(火)', count: elementCount.fireCount, emoji: '🔥', color: '#ef4444' },
      { name: '토(土)', count: elementCount.earthCount, emoji: '🏔️', color: '#eab308' },
      { name: '금(金)', count: elementCount.metalCount, emoji: '⚪', color: '#94a3b8' },
      { name: '수(水)', count: elementCount.waterCount, emoji: '💧', color: '#3b82f6' }
    ];

    // 가장 강한 오행과 가장 약한 오행
    const sorted = [...elements].sort((a, b) => b.count - a.count);
    const strongest = sorted[0];
    const weakest = sorted.filter(e => e.count === sorted[sorted.length - 1].count);

    return {
      elements: elements.map(e => ({
        ...e,
        percentage: total > 0 ? Math.round((e.count / total) * 100) : 0
      })),
      strongest,
      weakest,
      isBalanced: sorted[0].count - sorted[sorted.length - 1].count <= 2
    };
  }

  // 상세 해석 생성
  private generateBasicInterpretation(fourPillars: FourPillars, elementCount: ElementCount, gender: string): string {
    const dayStem = fourPillars.dayStem;
    const dayBranch = fourPillars.dayBranch;
    const dayStemElement = STEM_ELEMENTS[dayStem];
    const zodiac = EARTHLY_BRANCHES_ANIMALS[EARTHLY_BRANCHES.indexOf(fourPillars.yearBranch)];
    const yinYang = STEM_YIN_YANG[dayStem];

    // ========== 일간(日干) 상세 특성 ==========
    const dayStemDetails: Record<string, {
      nature: string;
      symbol: string;
      personality: string;
      strengths: string[];
      weaknesses: string[];
      career: string;
      relationship: string;
    }> = {
      '갑': {
        nature: '양목(陽木)',
        symbol: '큰 나무, 대들보',
        personality: '갑목(甲木)은 하늘을 향해 곧게 뻗어 자라는 큰 나무와 같습니다. 정의감이 강하고 불의를 보면 참지 못하는 성격으로, 리더십이 뛰어나고 추진력이 있습니다. 자존심이 강하고 독립적이며, 한번 결정한 일은 끝까지 밀고 나가는 끈기가 있습니다. 다만 고집이 세고 융통성이 부족할 수 있습니다.',
        strengths: ['리더십', '추진력', '정의감', '독립심', '끈기'],
        weaknesses: ['고집', '융통성 부족', '타협 어려움'],
        career: '경영자, 정치인, 변호사, 교육자, 건축가 등 리더십을 발휘할 수 있는 분야에서 능력을 발휘합니다. 새로운 분야를 개척하거나 조직을 이끄는 역할이 적합합니다.',
        relationship: '연애에서도 주도적인 편이며, 상대방을 보호하고 이끌어주려 합니다. 다만 지나친 고집으로 갈등이 생길 수 있으니 상대의 의견도 존중하는 것이 중요합니다.'
      },
      '을': {
        nature: '음목(陰木)',
        symbol: '덩굴, 풀, 꽃',
        personality: '을목(乙木)은 바람에 흔들리면서도 꺾이지 않는 유연한 풀과 같습니다. 적응력이 뛰어나고 어떤 환경에서도 잘 적응하며, 인내심이 강합니다. 겉으로는 부드럽지만 내면에는 강한 의지가 있으며, 주변 사람들과 잘 어울립니다. 감수성이 풍부하고 예술적 재능이 있습니다.',
        strengths: ['적응력', '유연성', '인내심', '친화력', '예술적 감각'],
        weaknesses: ['우유부단', '의존적 성향', '결단력 부족'],
        career: '예술가, 디자이너, 상담사, 서비스업, 외교관 등 사람을 대하는 분야에서 빛납니다. 협력이 필요한 일이나 섬세함이 요구되는 분야가 적합합니다.',
        relationship: '상대방에게 맞춰주며 조화로운 관계를 만들어 갑니다. 다만 자신의 의견을 너무 숨기면 스트레스가 쌓일 수 있으니 적절한 표현이 필요합니다.'
      },
      '병': {
        nature: '양화(陽火)',
        symbol: '태양, 큰 불',
        personality: '병화(丙火)는 모든 것을 환하게 비추는 태양과 같습니다. 밝고 활기차며 어디서든 주목받는 화려한 존재감을 가지고 있습니다. 열정적이고 적극적이며, 낙천적인 성격으로 주변을 밝게 만듭니다. 다만 성급하고 지속력이 부족할 수 있으며, 화를 잘 내기도 합니다.',
        strengths: ['열정', '활력', '낙천성', '표현력', '카리스마'],
        weaknesses: ['성급함', '지속력 부족', '다혈질'],
        career: '연예인, 방송인, 영업직, 마케팅, 교육자 등 자신을 표현하고 사람들 앞에 서는 일이 적합합니다. 창의적이고 에너지가 필요한 분야에서 빛납니다.',
        relationship: '연애에 적극적이고 로맨틱합니다. 상대방에게 아낌없이 사랑을 표현하지만, 식는 것도 빠를 수 있습니다. 꾸준함을 기르는 것이 좋습니다.'
      },
      '정': {
        nature: '음화(陰火)',
        symbol: '촛불, 달빛, 별',
        personality: '정화(丁火)는 어둠을 밝히는 촛불과 같습니다. 은은하면서도 따뜻한 빛으로 주변을 감싸며, 섬세하고 배려심이 깊습니다. 내면이 풍부하고 직관력이 뛰어나며, 한 가지에 깊이 몰입하는 집중력이 있습니다. 다만 예민하고 감정 기복이 있을 수 있습니다.',
        strengths: ['섬세함', '배려심', '직관력', '집중력', '따뜻함'],
        weaknesses: ['예민함', '감정 기복', '소심함'],
        career: '연구원, 작가, 예술가, 심리상담사, 요리사 등 섬세함과 집중력이 필요한 분야에서 능력을 발휘합니다. 사람의 마음을 다루는 일이 적합합니다.',
        relationship: '진심어린 사랑을 하며, 상대방의 작은 것도 세심하게 챙깁니다. 다만 너무 예민해지지 않도록 주의하고, 감정을 건강하게 표현하는 연습이 필요합니다.'
      },
      '무': {
        nature: '양토(陽土)',
        symbol: '산, 언덕, 제방',
        personality: '무토(戊土)는 우뚝 솟은 산과 같습니다. 듬직하고 안정감 있으며, 신뢰할 수 있는 존재입니다. 포용력이 크고 중심을 잘 잡으며, 어떤 상황에서도 흔들리지 않는 차분함이 있습니다. 다만 변화를 싫어하고 보수적이며, 때로는 고집스러울 수 있습니다.',
        strengths: ['안정감', '신뢰성', '포용력', '중심 잡기', '차분함'],
        weaknesses: ['보수적', '변화 거부', '느린 적응'],
        career: '공무원, 금융업, 부동산, 건설업, 경영관리 등 안정성이 중요한 분야가 적합합니다. 조직을 안정적으로 이끌거나 관리하는 역할이 어울립니다.',
        relationship: '연애에서 든든한 버팀목 역할을 하며, 변함없는 사랑을 줍니다. 다만 표현이 부족할 수 있으니 감정을 더 적극적으로 전달하는 것이 좋습니다.'
      },
      '기': {
        nature: '음토(陰土)',
        symbol: '전답, 정원, 화분의 흙',
        personality: '기토(己土)는 만물을 키워내는 비옥한 대지와 같습니다. 실용적이고 현실적이며, 무엇이든 받아들이는 포용력이 있습니다. 꼼꼼하고 성실하며, 맡은 일을 묵묵히 해내는 책임감이 있습니다. 다만 걱정이 많고 소극적일 때가 있습니다.',
        strengths: ['실용성', '성실함', '포용력', '꼼꼼함', '책임감'],
        weaknesses: ['걱정 많음', '소극적', '자기표현 부족'],
        career: '농업, 요식업, 교육, 행정, 회계 등 꼼꼼함과 성실함이 요구되는 분야에서 빛납니다. 무엇인가를 키우거나 가꾸는 일이 적합합니다.',
        relationship: '상대방을 세심하게 챙기며, 안정적인 관계를 만들어 갑니다. 다만 자신의 감정도 중요하게 여기고, 필요할 때는 표현하는 것이 좋습니다.'
      },
      '경': {
        nature: '양금(陽金)',
        symbol: '바위, 철, 도끼',
        personality: '경금(庚金)은 강철처럼 단단하고 결단력 있는 성격입니다. 정의감이 강하고 원칙을 중시하며, 한번 결심하면 반드시 실행합니다. 솔직하고 직설적이며, 자기 주장이 뚜렷합니다. 다만 너무 날카로워서 다른 사람에게 상처를 줄 수 있습니다.',
        strengths: ['결단력', '실행력', '정의감', '솔직함', '원칙'],
        weaknesses: ['날카로움', '무뚝뚝함', '융통성 부족'],
        career: '군인, 경찰, 외과의사, 엔지니어, 스포츠 선수 등 결단력과 실행력이 필요한 분야가 적합합니다. 도전적이고 경쟁이 있는 환경에서 능력을 발휘합니다.',
        relationship: '연애에서도 직설적이고 솔직합니다. 상대방을 진심으로 보호하려 하지만, 표현이 거칠 수 있으니 부드러움을 기르는 것이 좋습니다.'
      },
      '신': {
        nature: '음금(陰金)',
        symbol: '보석, 장신구, 동전',
        personality: '신금(辛金)은 빛나는 보석과 같습니다. 섬세하고 예리한 감각을 가졌으며, 완벽을 추구합니다. 자존심이 강하고 품위를 중시하며, 예술적 안목이 뛰어납니다. 다만 예민하고 까다로우며, 쉽게 상처받을 수 있습니다.',
        strengths: ['섬세함', '예리함', '완벽추구', '품위', '예술적 감각'],
        weaknesses: ['예민함', '까다로움', '상처 잘 받음'],
        career: '보석 감정사, 디자이너, 예술가, 금융 분석가, 비평가 등 섬세한 안목과 판단력이 필요한 분야가 적합합니다.',
        relationship: '연애에서 로맨틱하고 섬세합니다. 상대방의 작은 것도 기억하고 챙기지만, 자신도 세심한 배려를 원합니다. 서로의 마음을 이해하는 것이 중요합니다.'
      },
      '임': {
        nature: '양수(陽水)',
        symbol: '바다, 큰 강, 호수',
        personality: '임수(壬水)는 끝없이 넓은 바다와 같습니다. 지혜롭고 통찰력이 깊으며, 포용력이 큽니다. 어떤 상황에도 유연하게 대처하며, 변화를 두려워하지 않습니다. 호기심이 많고 배움을 좋아하며, 철학적 사고를 합니다. 다만 감정이 깊어 우울해지기 쉽습니다.',
        strengths: ['지혜', '통찰력', '포용력', '유연성', '철학적'],
        weaknesses: ['감정적 깊이', '우울감', '불안정'],
        career: '학자, 철학자, 작가, 외교관, 무역업 등 넓은 시야와 지혜가 필요한 분야가 적합합니다. 여행이나 해외와 관련된 일도 어울립니다.',
        relationship: '연애에서 깊은 감정적 교류를 원합니다. 상대방을 진심으로 이해하려 하며, 포용력 있는 사랑을 합니다. 감정의 기복을 잘 다스리는 것이 중요합니다.'
      },
      '계': {
        nature: '음수(陰水)',
        symbol: '비, 이슬, 시냇물',
        personality: '계수(癸水)는 맑은 시냇물과 같습니다. 순수하고 깨끗한 마음을 가졌으며, 직관력과 영감이 뛰어납니다. 민감하고 감수성이 풍부하며, 예술적 재능이 있습니다. 다만 변덕스럽고 불안정하며, 현실적인 면이 부족할 수 있습니다.',
        strengths: ['순수함', '직관력', '영감', '감수성', '예술성'],
        weaknesses: ['변덕', '불안정', '현실감 부족'],
        career: '예술가, 음악가, 시인, 점술가, 심리학자 등 직관과 영감이 필요한 분야가 적합합니다. 창의적이고 영적인 분야에서 빛납니다.',
        relationship: '연애에서 낭만적이고 이상적입니다. 깊은 정서적 연결을 원하며, 상대방의 감정에 민감합니다. 현실적인 부분도 함께 챙기는 것이 좋습니다.'
      }
    };

    // ========== 띠별 특성 ==========
    const zodiacDetails: Record<string, { traits: string; compatible: string; incompatible: string }> = {
      '쥐': { traits: '영리하고 재치있으며 적응력이 뛰어납니다. 기회를 잘 포착하고 사교성이 좋습니다.', compatible: '용, 원숭이, 소', incompatible: '말, 양' },
      '소': { traits: '성실하고 근면하며 인내심이 강합니다. 책임감 있고 신뢰할 수 있습니다.', compatible: '쥐, 뱀, 닭', incompatible: '양, 말' },
      '호랑이': { traits: '용감하고 자신감 있으며 리더십이 있습니다. 정의감이 강하고 모험을 좋아합니다.', compatible: '말, 개, 돼지', incompatible: '원숭이, 뱀' },
      '토끼': { traits: '온화하고 친절하며 예술적 감각이 있습니다. 평화를 사랑하고 배려심이 깊습니다.', compatible: '양, 돼지, 개', incompatible: '닭, 용' },
      '용': { traits: '카리스마 있고 야망이 크며 창의적입니다. 자신감 넘치고 열정적입니다.', compatible: '쥐, 원숭이, 닭', incompatible: '개, 토끼' },
      '뱀': { traits: '지혜롭고 직관력이 뛰어나며 신중합니다. 우아하고 매력적입니다.', compatible: '소, 닭', incompatible: '호랑이, 돼지' },
      '말': { traits: '활동적이고 자유로우며 열정적입니다. 독립심이 강하고 사교적입니다.', compatible: '호랑이, 양, 개', incompatible: '쥐, 소' },
      '양': { traits: '온순하고 예술적이며 동정심이 많습니다. 평화롭고 창의적입니다.', compatible: '토끼, 말, 돼지', incompatible: '소, 쥐' },
      '원숭이': { traits: '영리하고 재치있으며 호기심이 많습니다. 문제해결력이 뛰어나고 유머러스합니다.', compatible: '쥐, 용', incompatible: '호랑이' },
      '닭': { traits: '성실하고 정확하며 관찰력이 뛰어납니다. 자신감 있고 솔직합니다.', compatible: '소, 뱀, 용', incompatible: '토끼' },
      '개': { traits: '충실하고 정직하며 책임감이 강합니다. 의리있고 보호본능이 있습니다.', compatible: '호랑이, 토끼, 말', incompatible: '용' },
      '돼지': { traits: '순수하고 너그러우며 낙천적입니다. 성실하고 인정이 많습니다.', compatible: '토끼, 양, 호랑이', incompatible: '뱀' }
    };

    // ========== 오행 상세 분석 ==========
    const elementDetails: Record<string, {
      nature: string;
      bodyParts: string;
      emotions: string;
      colors: string;
      directions: string;
      seasons: string;
      foods: string;
      strengthTips: string;
    }> = {
      '목': {
        nature: '성장, 발전, 창조의 에너지입니다. 봄의 기운으로 새로운 시작과 확장을 상징합니다.',
        bodyParts: '간, 담낭, 눈, 근육, 손톱',
        emotions: '분노 - 목이 과하면 화를 잘 내고, 부족하면 우유부단해집니다.',
        colors: '초록색, 청색',
        directions: '동쪽',
        seasons: '봄',
        foods: '신맛 음식 (레몬, 식초, 매실 등), 녹색 채소',
        strengthTips: '나무, 식물과 가까이 지내고, 녹색 계열을 활용하세요. 새벽 시간에 활동하면 좋습니다.'
      },
      '화': {
        nature: '열정, 표현, 확산의 에너지입니다. 여름의 기운으로 밝음과 활력을 상징합니다.',
        bodyParts: '심장, 소장, 혀, 혈관',
        emotions: '기쁨 - 화가 과하면 들뜨고, 부족하면 무기력해집니다.',
        colors: '빨간색, 보라색, 분홍색',
        directions: '남쪽',
        seasons: '여름',
        foods: '쓴맛 음식 (커피, 녹차, 쑥 등), 붉은색 식품',
        strengthTips: '햇빛을 충분히 받고, 붉은색 계열을 활용하세요. 낮 시간에 활동하면 좋습니다.'
      },
      '토': {
        nature: '안정, 중재, 포용의 에너지입니다. 환절기의 기운으로 중심과 균형을 상징합니다.',
        bodyParts: '비장, 위장, 입, 근육',
        emotions: '생각 - 토가 과하면 집착하고, 부족하면 불안정해집니다.',
        colors: '황색, 갈색, 베이지',
        directions: '중앙',
        seasons: '환절기 (각 계절의 끝)',
        foods: '단맛 음식 (꿀, 고구마, 대추 등), 노란색 식품',
        strengthTips: '흙과 가까이 지내고, 자연에서 시간을 보내세요. 규칙적인 생활이 좋습니다.'
      },
      '금': {
        nature: '결단, 정의, 수렴의 에너지입니다. 가을의 기운으로 결실과 완성을 상징합니다.',
        bodyParts: '폐, 대장, 코, 피부',
        emotions: '슬픔 - 금이 과하면 냉정하고, 부족하면 우유부단해집니다.',
        colors: '흰색, 금색, 은색',
        directions: '서쪽',
        seasons: '가을',
        foods: '매운맛 음식 (마늘, 양파, 생강 등), 흰색 식품',
        strengthTips: '금속 소품을 활용하고, 흰색 계열을 활용하세요. 저녁 시간에 명상하면 좋습니다.'
      },
      '수': {
        nature: '지혜, 유연, 저장의 에너지입니다. 겨울의 기운으로 휴식과 재충전을 상징합니다.',
        bodyParts: '신장, 방광, 귀, 뼈, 머리카락',
        emotions: '두려움 - 수가 과하면 우울하고, 부족하면 조급해집니다.',
        colors: '검은색, 남색, 파란색',
        directions: '북쪽',
        seasons: '겨울',
        foods: '짠맛 음식 (해조류, 된장 등), 검은색 식품 (검은콩, 흑미)',
        strengthTips: '물과 가까이 지내고, 수영이나 목욕을 즐기세요. 밤 시간에 명상하면 좋습니다.'
      }
    };

    // 오행 분석
    const elements = [
      { name: '목', count: elementCount.woodCount },
      { name: '화', count: elementCount.fireCount },
      { name: '토', count: elementCount.earthCount },
      { name: '금', count: elementCount.metalCount },
      { name: '수', count: elementCount.waterCount }
    ];
    const sorted = [...elements].sort((a, b) => b.count - a.count);
    const strongest = sorted[0];
    const weakest = sorted.filter(e => e.count === 0);
    const total = elements.reduce((sum, e) => sum + e.count, 0);

    // 용신(用神) 계산 - 일간을 생(生)하거나 도와주는 오행
    const generatingElement: Record<string, string> = {
      '목': '수', '화': '목', '토': '화', '금': '토', '수': '금'
    };
    const dayStemEl = FIVE_ELEMENTS[dayStemElement as keyof typeof FIVE_ELEMENTS];
    const helpingElement = generatingElement[dayStemEl];

    // ========== 해석 생성 ==========
    let interpretation = '';

    // 1. 기본 정보 - 친근한 인사와 함께!
    interpretation += `🎊✨━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✨🎊\n`;
    interpretation += `\n`;
    interpretation += `      🔮 당신만을 위한 사주팔자 이야기 🔮\n`;
    interpretation += `\n`;
    interpretation += `🎊✨━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✨🎊\n\n`;
    interpretation += `안녕하세요! 🙋‍♀️\n`;
    interpretation += `당신의 사주를 흥미진진하게 풀어드릴게요!\n\n`;
    interpretation += `"사주가 뭐야?" 하시는 분들을 위해 잠깐! ☝️\n`;
    interpretation += `사주(四柱)는 태어난 연, 월, 일, 시의 네 기둥이에요.\n`;
    interpretation += `마치 당신만의 '우주 주민등록증' 같은 거죠! 🪐\n\n`;
    interpretation += `자, 이제 당신이 어떤 사람인지 알아볼까요?\n`;
    interpretation += `(두근두근... 🥁)\n\n`;

    // 2. 일간 분석 - 더 재미있게!
    const stemDetail = dayStemDetails[dayStem];
    interpretation += `【 🌟 일간(日干) 분석 - "진짜 나"를 찾아서! 】\n\n`;
    interpretation += `💡 일간이 뭐냐고요?\n`;
    interpretation += `   태어난 날의 천간으로, 당신의 "본캐"를 보여줘요!\n`;
    interpretation += `   게임으로 치면 캐릭터 직업 같은 거예요 🎮\n\n`;
    interpretation += `🎭 당신의 일간: ${dayStem}(${stemDetail.nature})\n`;
    interpretation += `   상징: ${stemDetail.symbol}\n\n`;
    interpretation += `   ${dayStem === '갑' ? '우와! 당신은 큰 나무처럼 든든한 사람이네요! 🌲' : ''}`;
    interpretation += `${dayStem === '을' ? '오호~ 유연하고 적응력 좋은 풀 같은 분이시네요! 🌿' : ''}`;
    interpretation += `${dayStem === '병' ? '반짝반짝! 태양처럼 빛나는 분이시군요! ☀️' : ''}`;
    interpretation += `${dayStem === '정' ? '은은하게 빛나는 촛불 같은 따뜻한 분! 🕯️' : ''}`;
    interpretation += `${dayStem === '무' ? '듬직한 산처럼 믿음직한 분이시네요! ⛰️' : ''}`;
    interpretation += `${dayStem === '기' ? '비옥한 땅처럼 포근한 분이군요! 🏕️' : ''}`;
    interpretation += `${dayStem === '경' ? '강철 같은 의지의 소유자시네요! 🗡️' : ''}`;
    interpretation += `${dayStem === '신' ? '보석처럼 빛나는 세련된 분! 💎' : ''}`;
    interpretation += `${dayStem === '임' ? '바다처럼 넓은 마음의 소유자! 🌊' : ''}`;
    interpretation += `${dayStem === '계' ? '맑은 시냇물처럼 순수한 분이시네요! 💧' : ''}\n\n`;
    interpretation += `📖 기본 성격 (TMI 주의 😆)\n`;
    interpretation += `${stemDetail.personality}\n\n`;
    interpretation += `✨ 당신의 슈퍼파워: ${stemDetail.strengths.join(', ')}\n`;
    interpretation += `   (이거 진짜 부러워하는 사람 많아요!)\n\n`;
    interpretation += `⚠️ 살짝 주의할 점: ${stemDetail.weaknesses.join(', ')}\n`;
    interpretation += `   (완벽한 사람은 없잖아요~ 괜찮아요! 💪)\n\n`;

    // 3. 띠 분석
    const zodiacDetail = zodiacDetails[zodiac];
    interpretation += `【 ${zodiac}띠 분석 】\n\n`;
    interpretation += `${zodiacDetail.traits}\n\n`;
    interpretation += `💑 궁합이 좋은 띠: ${zodiacDetail.compatible}\n`;
    interpretation += `⚡ 주의가 필요한 띠: ${zodiacDetail.incompatible}\n\n`;

    // 4. 오행 분석
    interpretation += `【 오행(五行) 분석 】\n\n`;
    interpretation += `📊 오행 분포\n`;
    elements.forEach(el => {
      const bar = '█'.repeat(el.count) + '░'.repeat(Math.max(0, 5 - el.count));
      const percent = total > 0 ? Math.round((el.count / total) * 100) : 0;
      interpretation += `   ${el.name}: ${bar} ${el.count}개 (${percent}%)\n`;
    });
    interpretation += `\n`;

    // 가장 강한 오행
    interpretation += `🔥 가장 강한 오행: ${strongest.name}(木火土金水 중)\n`;
    const strongDetail = elementDetails[strongest.name];
    interpretation += `${strongDetail.nature}\n\n`;

    // 부족한 오행
    if (weakest.length > 0) {
      interpretation += `💧 부족한 오행: ${weakest.map(e => e.name).join(', ')}\n`;
      weakest.forEach(el => {
        const weakDetail = elementDetails[el.name];
        interpretation += `\n[${el.name} 보완 방법]\n`;
        interpretation += `• 색상 활용: ${weakDetail.colors}\n`;
        interpretation += `• 방향 활용: ${weakDetail.directions}쪽 방향\n`;
        interpretation += `• 음식 섭취: ${weakDetail.foods}\n`;
        interpretation += `• ${weakDetail.strengthTips}\n`;
      });
      interpretation += `\n`;
    }

    // ========== 운세별 상세 분석 데이터 ==========
    const fortuneByElement: Record<string, {
      love: { good: string; caution: string; tip: string };
      career: { good: string; caution: string; tip: string };
      money: { good: string; caution: string; tip: string };
      health: { good: string; caution: string; tip: string };
    }> = {
      '목': {
        love: {
          good: '새로운 만남의 기회가 많고, 성장하는 관계를 만들어 갑니다. 함께 발전해 나가는 파트너를 만날 가능성이 높습니다.',
          caution: '급하게 관계를 진전시키려 하거나 상대를 자신의 뜻대로 이끌려 하면 갈등이 생길 수 있습니다.',
          tip: '상대방의 성장도 존중하고, 서로의 목표를 응원하는 관계를 만드세요.'
        },
        career: {
          good: '새로운 프로젝트나 사업 시작에 유리합니다. 창의적인 아이디어가 인정받고, 승진이나 발전의 기회가 찾아옵니다.',
          caution: '너무 많은 일을 동시에 벌이면 마무리가 어려울 수 있습니다. 경쟁자와의 충돌에 주의하세요.',
          tip: '한 가지에 집중하고, 꾸준히 성장하는 모습을 보여주세요.'
        },
        money: {
          good: '투자나 새로운 수입원 개발에 좋은 시기입니다. 교육, 출판, 환경 관련 분야에서 수익을 기대할 수 있습니다.',
          caution: '충동적인 지출이나 무리한 투자는 금물입니다. 특히 봄철 지출에 주의하세요.',
          tip: '장기적인 성장에 투자하고, 자기계발에 돈을 쓰면 좋은 결과가 있습니다.'
        },
        health: {
          good: '활력이 넘치고 회복력이 좋습니다. 운동을 시작하기 좋은 컨디션입니다.',
          caution: '간, 담낭, 눈 건강에 주의하세요. 화를 참으면 건강이 상할 수 있습니다.',
          tip: '규칙적인 운동과 충분한 수면, 녹색 채소 섭취를 권장합니다.'
        }
      },
      '화': {
        love: {
          good: '열정적이고 로맨틱한 연애운입니다. 매력이 빛나고 이성의 관심을 받기 쉽습니다.',
          caution: '감정 기복이 심해 다툼이 생길 수 있습니다. 질투나 집착에 주의하세요.',
          tip: '감정을 적절히 조절하고, 상대방에게 충분한 공간을 주세요.'
        },
        career: {
          good: '주목받는 위치에서 능력을 발휘합니다. 프레젠테이션, 영업, 마케팅에서 성과를 냅니다.',
          caution: '성급한 결정이나 충동적인 행동으로 실수할 수 있습니다. 직장 내 갈등에 주의하세요.',
          tip: '열정을 지속 가능한 에너지로 전환하고, 팀워크를 중시하세요.'
        },
        money: {
          good: '적극적인 재테크로 수익을 올릴 수 있습니다. IT, 에너지, 엔터테인먼트 분야에서 기회가 있습니다.',
          caution: '투기성 투자나 도박에 빠지기 쉽습니다. 여름철 과소비에 주의하세요.',
          tip: '단기 수익보다 안정적인 포트폴리오를 구성하세요.'
        },
        health: {
          good: '에너지가 넘치고 활동적입니다. 열정적으로 목표를 향해 나아갈 수 있습니다.',
          caution: '심장, 혈압, 눈 건강에 주의하세요. 과로와 스트레스 관리가 필요합니다.',
          tip: '명상과 심호흡으로 마음을 안정시키고, 물을 충분히 마시세요.'
        }
      },
      '토': {
        love: {
          good: '안정적이고 신뢰할 수 있는 관계를 형성합니다. 결혼이나 약속에 좋은 시기입니다.',
          caution: '지루함을 느끼거나 변화를 두려워해 관계가 정체될 수 있습니다.',
          tip: '가끔은 새로운 데이트 장소나 활동으로 신선함을 유지하세요.'
        },
        career: {
          good: '맡은 일을 꾸준히 해내며 신뢰를 쌓습니다. 관리직이나 중재 역할에서 능력을 인정받습니다.',
          caution: '변화하는 환경에 적응이 느릴 수 있습니다. 새로운 기술 습득에 소극적이면 뒤처질 수 있습니다.',
          tip: '안정을 추구하되, 필요한 변화는 받아들이는 유연함을 기르세요.'
        },
        money: {
          good: '부동산, 저축, 안정적인 투자에서 성과를 봅니다. 땅이나 건물 관련 투자에 유리합니다.',
          caution: '재물 욕심이 과하면 손실을 볼 수 있습니다. 보증이나 빚 관계에 주의하세요.',
          tip: '급하게 벌려 하지 말고, 천천히 모으는 전략이 좋습니다.'
        },
        health: {
          good: '전반적으로 안정된 건강 상태입니다. 체력이 꾸준히 유지됩니다.',
          caution: '소화기, 위장, 비장 건강에 주의하세요. 과식과 불규칙한 식사가 문제가 됩니다.',
          tip: '제때 식사하고, 폭식을 피하며, 규칙적인 생활을 유지하세요.'
        }
      },
      '금': {
        love: {
          good: '진지하고 깊은 관계를 형성합니다. 결단력 있게 관계를 정리하거나 발전시킵니다.',
          caution: '너무 냉정하거나 비판적이면 상대방이 상처받을 수 있습니다.',
          tip: '따뜻한 말 한마디가 관계를 부드럽게 만듭니다. 표현을 연습하세요.'
        },
        career: {
          good: '전문성을 인정받고, 결단력 있는 리더십을 발휘합니다. 법률, 금융, 기술 분야에서 성과를 냅니다.',
          caution: '너무 원칙만 고집하면 팀워크가 깨질 수 있습니다. 유연성이 필요합니다.',
          tip: '실력을 갈고닦되, 인간관계도 함께 챙기세요.'
        },
        money: {
          good: '투자 판단이 정확하고, 재물을 모으는 능력이 뛰어납니다. 금융, 보석, 기계 관련 투자에 유리합니다.',
          caution: '너무 인색하면 기회를 놓칠 수 있습니다. 적절한 소비도 필요합니다.',
          tip: '돈을 모으는 것과 쓰는 것의 균형을 맞추세요.'
        },
        health: {
          good: '체력이 단단하고 회복력이 좋습니다. 규칙적인 생활을 잘 지킵니다.',
          caution: '폐, 대장, 피부 건강에 주의하세요. 건조한 환경에서 문제가 생길 수 있습니다.',
          tip: '호흡기 관리를 위해 공기 좋은 곳에서 산책하고, 피부 보습에 신경 쓰세요.'
        }
      },
      '수': {
        love: {
          good: '깊은 감정적 유대를 형성합니다. 상대방을 진심으로 이해하고 포용하는 사랑을 합니다.',
          caution: '감정에 빠져 현실을 놓칠 수 있습니다. 상대방에게 너무 의존하지 마세요.',
          tip: '감정과 이성의 균형을 맞추고, 독립적인 자신을 유지하세요.'
        },
        career: {
          good: '지혜와 통찰력으로 문제를 해결합니다. 연구, 기획, 해외 관련 업무에서 성과를 냅니다.',
          caution: '우유부단하거나 너무 생각만 하다 행동이 늦어질 수 있습니다.',
          tip: '생각을 정리했으면 과감하게 실행에 옮기세요.'
        },
        money: {
          good: '재물이 흘러들어오는 운입니다. 해외, 물류, 유통 관련 투자에 유리합니다.',
          caution: '돈이 쉽게 들어오지만 쉽게 나갈 수도 있습니다. 관리를 철저히 하세요.',
          tip: '들어오는 돈의 일정 비율은 반드시 저축하는 습관을 들이세요.'
        },
        health: {
          good: '적응력이 좋고 회복이 빠릅니다. 스트레스 해소를 잘 합니다.',
          caution: '신장, 방광, 뼈 건강에 주의하세요. 추운 환경에서 건강이 상할 수 있습니다.',
          tip: '몸을 따뜻하게 유지하고, 충분한 수분 섭취와 휴식을 취하세요.'
        }
      }
    };

    // ========== 10년 대운 계산 ==========
    const decadeFortunes: Record<string, { title: string; description: string }[]> = {
      '갑': [
        { title: '0-10세 (유년기)', description: '호기심이 많고 활발한 시기입니다. 기초 교육과 인성 형성에 중요한 때입니다.' },
        { title: '10-20세 (성장기)', description: '목의 기운이 강해 학업에 집중하기 좋습니다. 리더십이 드러나기 시작합니다.' },
        { title: '20-30세 (청년기)', description: '사회 진출의 시기로 도전정신이 빛납니다. 새로운 분야 개척에 유리합니다.' },
        { title: '30-40세 (장년초기)', description: '커리어가 안정되는 시기입니다. 결혼과 가정을 이루기 좋은 때입니다.' },
        { title: '40-50세 (장년중기)', description: '경험이 축적되어 지혜가 빛나는 시기입니다. 후배 양성에 보람을 느낍니다.' },
        { title: '50-60세 (장년후기)', description: '인생의 결실을 거두는 시기입니다. 건강 관리에 신경 써야 합니다.' },
        { title: '60-70세 (노년초기)', description: '여유를 찾고 취미 생활을 즐기기 좋은 때입니다. 가족과의 시간이 소중해집니다.' },
        { title: '70세 이후 (노년기)', description: '지혜로운 어른으로서 존경받는 시기입니다. 마음의 평화가 중요합니다.' }
      ],
      '을': [
        { title: '0-10세 (유년기)', description: '감수성이 예민하고 적응력이 좋습니다. 예술적 재능이 일찍 드러날 수 있습니다.' },
        { title: '10-20세 (성장기)', description: '친화력으로 인간관계가 넓어집니다. 다양한 경험을 쌓기 좋은 시기입니다.' },
        { title: '20-30세 (청년기)', description: '유연하게 환경에 적응하며 기회를 잡습니다. 협력을 통한 성공이 기대됩니다.' },
        { title: '30-40세 (장년초기)', description: '꾸준한 노력이 결실을 맺습니다. 안정적인 가정을 이루기 좋습니다.' },
        { title: '40-50세 (장년중기)', description: '인내심이 빛을 발하는 시기입니다. 전문성이 인정받습니다.' },
        { title: '50-60세 (장년후기)', description: '쌓아온 경험으로 주변에 도움을 줍니다. 건강에 더욱 신경 쓰세요.' },
        { title: '60-70세 (노년초기)', description: '평온한 일상에서 행복을 찾습니다. 소소한 취미가 삶을 풍요롭게 합니다.' },
        { title: '70세 이후 (노년기)', description: '자연과 함께하며 마음의 여유를 즐깁니다. 가족의 사랑이 위안이 됩니다.' }
      ],
      '병': [
        { title: '0-10세 (유년기)', description: '밝고 활발하여 주목받습니다. 에너지가 넘쳐 활동량이 많습니다.' },
        { title: '10-20세 (성장기)', description: '열정적으로 꿈을 좇습니다. 리더 역할을 맡기 쉽습니다.' },
        { title: '20-30세 (청년기)', description: '사회에서 주목받는 시기입니다. 자신감으로 도전하면 성공합니다.' },
        { title: '30-40세 (장년초기)', description: '화려한 성공을 거둘 수 있습니다. 하지만 건강 관리가 필요합니다.' },
        { title: '40-50세 (장년중기)', description: '열정을 지속 가능한 방향으로 전환해야 합니다. 팀을 이끄는 리더십이 빛납니다.' },
        { title: '50-60세 (장년후기)', description: '후배들에게 영감을 주는 시기입니다. 과욕은 금물입니다.' },
        { title: '60-70세 (노년초기)', description: '열정을 취미나 봉사로 승화시키기 좋습니다. 심장 건강에 주의하세요.' },
        { title: '70세 이후 (노년기)', description: '따뜻한 마음으로 가족과 주변을 밝힙니다. 편안한 노년을 보냅니다.' }
      ],
      '정': [
        { title: '0-10세 (유년기)', description: '섬세하고 예민한 감성을 가집니다. 예술적 재능이 일찍 나타납니다.' },
        { title: '10-20세 (성장기)', description: '집중력으로 학업에서 성과를 냅니다. 내면의 성장이 두드러집니다.' },
        { title: '20-30세 (청년기)', description: '전문 분야에서 깊이를 더합니다. 은은한 매력으로 인기를 얻습니다.' },
        { title: '30-40세 (장년초기)', description: '섬세한 능력이 인정받습니다. 깊은 사랑을 나누기 좋은 시기입니다.' },
        { title: '40-50세 (장년중기)', description: '전문가로서 위치가 확고해집니다. 마음 건강에 신경 쓰세요.' },
        { title: '50-60세 (장년후기)', description: '내면의 지혜가 깊어집니다. 조언자 역할을 잘 수행합니다.' },
        { title: '60-70세 (노년초기)', description: '예술이나 명상으로 마음의 평화를 찾습니다. 가족과의 유대가 깊어집니다.' },
        { title: '70세 이후 (노년기)', description: '영성이 깊어지고 지혜로운 어른이 됩니다. 평온한 말년을 보냅니다.' }
      ],
      '무': [
        { title: '0-10세 (유년기)', description: '듬직하고 안정감 있게 자랍니다. 신뢰받는 아이입니다.' },
        { title: '10-20세 (성장기)', description: '꾸준한 노력으로 기초를 다집니다. 책임감이 강해집니다.' },
        { title: '20-30세 (청년기)', description: '안정적인 직장이나 사업 기반을 마련합니다. 신중한 판단이 빛납니다.' },
        { title: '30-40세 (장년초기)', description: '든든한 가장으로서 역할을 합니다. 부동산 관련 행운이 있습니다.' },
        { title: '40-50세 (장년중기)', description: '중심을 잡고 조직을 이끕니다. 재산이 늘어나는 시기입니다.' },
        { title: '50-60세 (장년후기)', description: '경험과 신뢰로 존경받습니다. 건강 관리에 신경 쓰세요.' },
        { title: '60-70세 (노년초기)', description: '안정된 노후를 즐깁니다. 가족과의 시간이 소중해집니다.' },
        { title: '70세 이후 (노년기)', description: '평온하고 존경받는 노년을 보냅니다. 마음의 여유가 행복을 줍니다.' }
      ],
      '기': [
        { title: '0-10세 (유년기)', description: '성실하고 착실하게 자랍니다. 부모님 말씀을 잘 듣습니다.' },
        { title: '10-20세 (성장기)', description: '꼼꼼함으로 학업에서 성과를 냅니다. 실용적인 기술을 익히기 좋습니다.' },
        { title: '20-30세 (청년기)', description: '맡은 일을 묵묵히 해내며 인정받습니다. 안정적인 직업을 갖습니다.' },
        { title: '30-40세 (장년초기)', description: '성실함이 결실을 맺습니다. 알찬 가정을 이룹니다.' },
        { title: '40-50세 (장년중기)', description: '전문성과 경험이 인정받습니다. 재산이 꾸준히 늘어납니다.' },
        { title: '50-60세 (장년후기)', description: '후배를 양성하고 노하우를 전수합니다. 소화기 건강에 주의하세요.' },
        { title: '60-70세 (노년초기)', description: '소소한 일상에서 행복을 찾습니다. 텃밭 가꾸기 등이 좋습니다.' },
        { title: '70세 이후 (노년기)', description: '평온하고 알찬 노년을 보냅니다. 자녀들의 효도를 받습니다.' }
      ],
      '경': [
        { title: '0-10세 (유년기)', description: '강인하고 독립적입니다. 경쟁심이 일찍 나타납니다.' },
        { title: '10-20세 (성장기)', description: '도전적인 활동에서 빛납니다. 운동이나 경쟁에서 성과를 냅니다.' },
        { title: '20-30세 (청년기)', description: '결단력으로 기회를 잡습니다. 군인, 경찰, 기술직에서 성공합니다.' },
        { title: '30-40세 (장년초기)', description: '리더십을 발휘하여 조직을 이끕니다. 재물운이 좋아집니다.' },
        { title: '40-50세 (장년중기)', description: '권위와 실력을 인정받습니다. 인간관계에 신경 쓰세요.' },
        { title: '50-60세 (장년후기)', description: '경험을 바탕으로 조언자가 됩니다. 건강 관리가 중요합니다.' },
        { title: '60-70세 (노년초기)', description: '강인함을 유지하며 활동적인 노년을 보냅니다. 취미 운동이 좋습니다.' },
        { title: '70세 이후 (노년기)', description: '존경받는 어른으로 가족의 중심이 됩니다. 마음의 여유를 가지세요.' }
      ],
      '신': [
        { title: '0-10세 (유년기)', description: '섬세하고 예민합니다. 예술적 감각이 일찍 드러납니다.' },
        { title: '10-20세 (성장기)', description: '완벽을 추구하며 학업에서 두각을 나타냅니다. 품위를 중시합니다.' },
        { title: '20-30세 (청년기)', description: '세련된 분야에서 능력을 발휘합니다. 금융, 예술, 패션에서 성공합니다.' },
        { title: '30-40세 (장년초기)', description: '전문가로 인정받습니다. 품격 있는 가정을 이룹니다.' },
        { title: '40-50세 (장년중기)', description: '안목이 빛나고 재산이 늘어납니다. 투자에 성공합니다.' },
        { title: '50-60세 (장년후기)', description: '심미안으로 후배를 지도합니다. 피부 건강에 주의하세요.' },
        { title: '60-70세 (노년초기)', description: '품격 있는 취미 생활을 즐깁니다. 예술 활동이 좋습니다.' },
        { title: '70세 이후 (노년기)', description: '세련되고 품위 있는 노년을 보냅니다. 아름다움을 추구합니다.' }
      ],
      '임': [
        { title: '0-10세 (유년기)', description: '호기심이 많고 배움을 좋아합니다. 여행과 모험을 즐깁니다.' },
        { title: '10-20세 (성장기)', description: '지혜롭게 공부하며 넓은 시야를 가집니다. 해외 경험이 좋습니다.' },
        { title: '20-30세 (청년기)', description: '통찰력으로 기회를 잡습니다. 해외, 무역, 학문에서 성공합니다.' },
        { title: '30-40세 (장년초기)', description: '포용력으로 사람을 모읍니다. 넓은 인맥이 도움이 됩니다.' },
        { title: '40-50세 (장년중기)', description: '지혜가 깊어지고 영향력이 커집니다. 재물이 흘러들어옵니다.' },
        { title: '50-60세 (장년후기)', description: '지혜로운 조언자가 됩니다. 신장 건강에 주의하세요.' },
        { title: '60-70세 (노년초기)', description: '여행과 학문으로 노년을 풍요롭게 합니다. 철학적 사색을 즐깁니다.' },
        { title: '70세 이후 (노년기)', description: '깊은 지혜로 존경받습니다. 평온한 마음으로 인생을 관조합니다.' }
      ],
      '계': [
        { title: '0-10세 (유년기)', description: '감수성이 풍부하고 직관력이 있습니다. 예술적 재능이 보입니다.' },
        { title: '10-20세 (성장기)', description: '영감으로 창의적인 분야에서 빛납니다. 음악, 미술에 재능이 있습니다.' },
        { title: '20-30세 (청년기)', description: '직관력으로 기회를 감지합니다. 예술, 심리, 영적 분야에서 성공합니다.' },
        { title: '30-40세 (장년초기)', description: '감성적인 매력으로 사람을 끕니다. 낭만적인 가정을 이룹니다.' },
        { title: '40-50세 (장년중기)', description: '영감이 깊어지고 창작에서 성과를 냅니다. 현실 관리도 병행하세요.' },
        { title: '50-60세 (장년후기)', description: '내면의 성숙이 빛납니다. 영적 성장의 시기입니다.' },
        { title: '60-70세 (노년초기)', description: '예술과 명상으로 평화로운 시간을 보냅니다. 창작 활동이 좋습니다.' },
        { title: '70세 이후 (노년기)', description: '순수한 마음으로 평온한 노년을 보냅니다. 영적 깊이가 더해집니다.' }
      ]
    };

    // ========== 천운(天運) 분석 ==========
    const heavenlyFortune = this.analyzeHeavenlyFortune(fourPillars, elementCount);

    // ========== 해석 계속 ==========

    // 5. 연애운 (Love Fortune)
    const loveElement = strongest.name;
    const loveFortune = fortuneByElement[loveElement].love;
    interpretation += `【 💕 연애운 분석 】\n\n`;
    interpretation += `[현재 연애 기운: ${loveElement}의 영향]\n\n`;
    interpretation += `✨ 좋은 점\n${loveFortune.good}\n\n`;
    interpretation += `⚠️ 주의할 점\n${loveFortune.caution}\n\n`;
    interpretation += `💡 조언\n${loveFortune.tip}\n\n`;
    interpretation += `${stemDetail.relationship}\n\n`;

    // 6. 출세운 (Career Fortune)
    const careerFortune = fortuneByElement[strongest.name].career;
    interpretation += `【 🏆 출세운 분석 】\n\n`;
    interpretation += `[현재 사업/직장 기운: ${strongest.name}의 영향]\n\n`;
    interpretation += `✨ 좋은 점\n${careerFortune.good}\n\n`;
    interpretation += `⚠️ 주의할 점\n${careerFortune.caution}\n\n`;
    interpretation += `💡 조언\n${careerFortune.tip}\n\n`;
    interpretation += `${stemDetail.career}\n\n`;
    interpretation += `[오행별 적합 분야]\n`;
    if (elementCount.woodCount >= 2) interpretation += `• 목(木): 교육, 출판, 의류, 목재, 농업, 환경, 스타트업\n`;
    if (elementCount.fireCount >= 2) interpretation += `• 화(火): IT, 에너지, 엔터테인먼트, 마케팅, 요식업\n`;
    if (elementCount.earthCount >= 2) interpretation += `• 토(土): 부동산, 건설, 농업, 창고, 중개업\n`;
    if (elementCount.metalCount >= 2) interpretation += `• 금(金): 금융, 법률, 제조업, 자동차, 보석, 의료기기\n`;
    if (elementCount.waterCount >= 2) interpretation += `• 수(水): 물류, 무역, 관광, 미디어, 연구, 해운\n`;
    interpretation += `\n`;

    // 7. 금전운 (Financial Fortune)
    const moneyFortune = fortuneByElement[strongest.name].money;
    interpretation += `【 💰 금전운 분석 】\n\n`;
    interpretation += `[현재 재물 기운: ${strongest.name}의 영향]\n\n`;
    interpretation += `✨ 좋은 점\n${moneyFortune.good}\n\n`;
    interpretation += `⚠️ 주의할 점\n${moneyFortune.caution}\n\n`;
    interpretation += `💡 재테크 조언\n${moneyFortune.tip}\n\n`;

    // 8. 건강운 (Health Fortune)
    const healthFortune = fortuneByElement[strongest.name].health;
    interpretation += `【 🏥 건강운 분석 】\n\n`;
    interpretation += `[현재 건강 기운: ${strongest.name}의 영향]\n\n`;
    interpretation += `✨ 좋은 점\n${healthFortune.good}\n\n`;
    interpretation += `⚠️ 주의할 점\n${healthFortune.caution}\n\n`;
    interpretation += `💡 건강 관리 조언\n${healthFortune.tip}\n\n`;
    const strongElHealth = elementDetails[strongest.name];
    interpretation += `[강한 ${strongest.name} 오행으로 인한 주의 부위]\n`;
    interpretation += `${strongElHealth.bodyParts}\n`;
    interpretation += `${strongElHealth.emotions}\n\n`;
    if (weakest.length > 0) {
      interpretation += `[부족한 오행으로 인한 보강 필요 부위]\n`;
      weakest.forEach(el => {
        const weakElHealth = elementDetails[el.name];
        interpretation += `• ${el.name} 부족: ${weakElHealth.bodyParts} 관리 필요\n`;
      });
      interpretation += `\n`;
    }

    // 9. 천운 (Heavenly Fortune)
    interpretation += `【 ✨ 천운(天運) 분석 】\n\n`;
    interpretation += heavenlyFortune;
    interpretation += `\n`;

    // 10. 2026년 운세
    interpretation += `【 🐍 2026년 병오(丙午)년 운세 】\n\n`;
    const yearlyFortune = this.analyze2026Fortune(fourPillars, elementCount, dayStem);
    interpretation += yearlyFortune;
    interpretation += `\n`;

    // 11. 10년 대운
    const decadeList = decadeFortunes[dayStem] || decadeFortunes['갑'];
    interpretation += `【 📅 10년 대운 (나이별 운세) 】\n\n`;
    decadeList.forEach((decade, idx) => {
      const emoji = ['👶', '🧒', '👨', '👨‍💼', '👨‍🦳', '👴', '🧓', '👼'][idx] || '✨';
      interpretation += `${emoji} ${decade.title}\n`;
      interpretation += `   ${decade.description}\n\n`;
    });

    // 11. 용신 및 개운법
    interpretation += `【 🍀 개운(開運) 조언 】\n\n`;
    interpretation += `🎯 도움이 되는 오행(용신): ${helpingElement}\n`;
    const helpDetail = elementDetails[helpingElement];
    interpretation += `\n[${helpingElement} 기운 보강 방법]\n`;
    interpretation += `• 행운의 색상: ${helpDetail.colors}\n`;
    interpretation += `• 좋은 방향: ${helpDetail.directions}\n`;
    interpretation += `• 좋은 계절: ${helpDetail.seasons}\n`;
    interpretation += `• 권장 음식: ${helpDetail.foods}\n`;
    interpretation += `• ${helpDetail.strengthTips}\n\n`;

    if (weakest.length > 0) {
      interpretation += `[부족한 오행 보완법]\n`;
      weakest.forEach(el => {
        const weakDetail = elementDetails[el.name];
        interpretation += `\n▸ ${el.name} 보완\n`;
        interpretation += `  색상: ${weakDetail.colors}\n`;
        interpretation += `  방향: ${weakDetail.directions}\n`;
        interpretation += `  음식: ${weakDetail.foods}\n`;
      });
      interpretation += `\n`;
    }

    // 12. 마무리
    interpretation += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    interpretation += `💫 사주팔자는 타고난 기질과 잠재력을 보여주는 것이지,\n`;
    interpretation += `   운명을 결정짓는 것이 아닙니다.\n\n`;
    interpretation += `   자신의 강점을 살리고 약점을 보완하며,\n`;
    interpretation += `   운의 흐름을 지혜롭게 활용하여\n`;
    interpretation += `   더 나은 삶을 만들어 가시기 바랍니다.\n\n`;
    interpretation += `   "운명은 성격 속에 있다" - 노자 💫\n`;

    return interpretation;
  }

  // 2026년(병오년) 운세 분석
  private analyze2026Fortune(fourPillars: FourPillars, elementCount: ElementCount, dayStem: string): string {
    // 2026년은 병오(丙午)년 - 양화(陽火), 말띠
    // 병(丙) = 양화, 오(午) = 화
    const year2026Stem = '병'; // 天干
    const year2026Branch = '오'; // 地支 (말)
    const year2026Element = 'FIRE'; // 火

    const dayStemElement = STEM_ELEMENTS[dayStem];
    const dayStemEl = FIVE_ELEMENTS[dayStemElement as keyof typeof FIVE_ELEMENTS];

    let fortune = '';

    // 오행 상생상극 관계
    // 상생: 목생화, 화생토, 토생금, 금생수, 수생목
    // 상극: 목극토, 토극수, 수극화, 화극금, 금극목

    const generating: Record<string, string> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' };
    const controlling: Record<string, string> = { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' };
    const generatedBy: Record<string, string> = { '목': '수', '화': '목', '토': '화', '금': '토', '수': '금' };

    // 일간과 2026년(화)의 관계 분석
    let overallLuck = '';
    let luckLevel = 0;

    if (dayStemEl === '화') {
      overallLuck = '2026년은 비견(比肩)의 해로, 동료나 경쟁자가 많아집니다. 협력하면 시너지가 나지만, 경쟁도 치열해집니다.';
      luckLevel = 3;
    } else if (dayStemEl === '목') {
      overallLuck = '2026년은 식신(食神)의 해로, 재능을 발휘하고 표현하기 좋은 시기입니다. 창작, 사업 확장에 유리합니다.';
      luckLevel = 4;
    } else if (dayStemEl === '토') {
      overallLuck = '2026년은 정인(正印)의 해로, 학업, 자격증, 문서운이 좋습니다. 어른의 도움을 받기 쉽습니다.';
      luckLevel = 4;
    } else if (dayStemEl === '금') {
      overallLuck = '2026년은 정관(正官)의 해로, 승진, 취업, 명예운이 상승합니다. 단, 압박감도 커질 수 있습니다.';
      luckLevel = 3;
    } else if (dayStemEl === '수') {
      overallLuck = '2026년은 정재(正財)의 해로, 재물운이 상승합니다. 안정적인 수입과 저축에 좋은 시기입니다.';
      luckLevel = 5;
    }

    const stars = '★'.repeat(luckLevel) + '☆'.repeat(5 - luckLevel);
    fortune += `📊 2026년 종합운: ${stars}\n\n`;
    fortune += `${overallLuck}\n\n`;

    // 띠별 2026년 운세
    const yearBranch = fourPillars.yearBranch;
    const zodiac = EARTHLY_BRANCHES_ANIMALS[EARTHLY_BRANCHES.indexOf(yearBranch)];

    const zodiac2026: Record<string, { luck: string; level: number; advice: string }> = {
      '쥐': { luck: '충(沖)의 해로 변화가 많습니다. 이사, 이직 등 큰 변화가 예상되나 신중하게 결정하세요.', level: 2, advice: '급한 결정은 피하고, 안전을 우선시하세요.' },
      '소': { luck: '해(害)의 관계로 인간관계에서 갈등이 생길 수 있습니다. 오해를 풀기 위한 소통이 필요합니다.', level: 2, advice: '말조심하고, 타인을 배려하세요.' },
      '호랑이': { luck: '삼합(三合)의 해로 매우 좋은 운입니다. 새로운 시작, 결혼, 사업에 길합니다.', level: 5, advice: '적극적으로 기회를 잡으세요!' },
      '토끼': { luck: '형(刑)의 영향으로 건강이나 법적 문제에 주의가 필요합니다.', level: 2, advice: '건강검진을 받고, 서류를 꼼꼼히 확인하세요.' },
      '용': { luck: '상생(相生)의 관계로 좋은 기운이 흐릅니다. 귀인의 도움을 받기 쉽습니다.', level: 4, advice: '인맥을 넓히고 협력 관계를 강화하세요.' },
      '뱀': { luck: '반합(半合)의 해로 부분적인 행운이 따릅니다. 특히 재물운이 상승합니다.', level: 4, advice: '기회를 놓치지 말고 투자를 고려해보세요.' },
      '말': { luck: '본명년(本命年)으로 태세(太歲)의 해입니다. 변화와 기회가 공존하지만 신중해야 합니다.', level: 3, advice: '빨간색 속옷이나 액세서리로 액운을 막으세요.' },
      '양': { luck: '육합(六合)의 해로 인연운이 매우 좋습니다. 결혼, 계약, 협력에 최고입니다.', level: 5, advice: '좋은 인연을 적극적으로 만나세요!' },
      '원숭이': { luck: '상생의 관계로 안정적인 운입니다. 꾸준한 노력이 결실을 맺습니다.', level: 4, advice: '급하게 욕심내지 말고 차근차근 진행하세요.' },
      '닭': { luck: '상극(相剋)의 영향으로 어려움이 예상됩니다. 특히 금전 관리에 주의하세요.', level: 2, advice: '보수적으로 접근하고 지출을 줄이세요.' },
      '개': { luck: '삼합(三合)의 해로 매우 좋은 운입니다. 승진, 합격, 성공의 기운이 강합니다.', level: 5, advice: '자신감을 가지고 적극적으로 도전하세요!' },
      '돼지': { luck: '상생의 관계로 평온하고 안정적인 해입니다. 건강과 가정에 집중하기 좋습니다.', level: 4, advice: '무리하지 말고 일상의 행복을 즐기세요.' }
    };

    const zodiacFortune = zodiac2026[zodiac];
    const zodiacStars = '★'.repeat(zodiacFortune.level) + '☆'.repeat(5 - zodiacFortune.level);

    fortune += `🐎 ${zodiac}띠의 2026년 운세: ${zodiacStars}\n`;
    fortune += `${zodiacFortune.luck}\n`;
    fortune += `💡 조언: ${zodiacFortune.advice}\n\n`;

    // 2026년 월별 운세 하이라이트
    fortune += `📆 2026년 월별 운세 하이라이트\n\n`;

    const monthlyHighlights = [
      { month: '1월 (병인월)', fortune: '새해 시작과 함께 활력이 넘칩니다. 계획을 세우기 좋은 달입니다.' },
      { month: '2월 (정묘월)', fortune: '인간관계가 활발해집니다. 새로운 만남에 기대하세요.' },
      { month: '3월 (무진월)', fortune: '재물운이 상승합니다. 투자나 사업 확장에 좋습니다.' },
      { month: '4월 (기사월)', fortune: '창의력이 빛나는 달입니다. 아이디어를 실행에 옮기세요.' },
      { month: '5월 (경오월)', fortune: '변화의 달입니다. 새로운 기회에 열린 마음을 가지세요.' },
      { month: '6월 (신미월)', fortune: '인내가 필요한 달입니다. 급하게 서두르지 마세요.' },
      { month: '7월 (임신월)', fortune: '귀인의 도움이 있습니다. 협력 관계를 강화하세요.' },
      { month: '8월 (계유월)', fortune: '건강에 주의가 필요합니다. 무리하지 마세요.' },
      { month: '9월 (갑술월)', fortune: '결실을 거두는 달입니다. 노력의 보상이 옵니다.' },
      { month: '10월 (을해월)', fortune: '안정적인 달입니다. 저축과 계획에 집중하세요.' },
      { month: '11월 (병자월)', fortune: '사교운이 좋습니다. 네트워킹에 유리합니다.' },
      { month: '12월 (정축월)', fortune: '한 해를 마무리하며 성찰하기 좋은 달입니다.' }
    ];

    // 일간에 따라 특별히 좋은 달 표시
    const goodMonths: Record<string, number[]> = {
      '갑': [3, 4, 11, 12], '을': [3, 4, 11, 12], '병': [1, 5, 7, 11], '정': [2, 6, 7, 12],
      '무': [3, 4, 5, 9], '기': [3, 6, 9, 10], '경': [7, 8, 9, 10], '신': [7, 8, 9, 10],
      '임': [1, 7, 10, 11], '계': [1, 2, 10, 12]
    };

    const myGoodMonths = goodMonths[dayStem] || [3, 6, 9, 12];

    monthlyHighlights.forEach((m, idx) => {
      const monthNum = idx + 1;
      const isGoodMonth = myGoodMonths.includes(monthNum);
      const marker = isGoodMonth ? '⭐' : '  ';
      fortune += `${marker} ${m.month}: ${m.fortune}${isGoodMonth ? ' ✨행운의 달!' : ''}\n`;
    });

    fortune += `\n[행운의 달 (⭐표시)에 중요한 일을 계획하면 좋습니다]\n`;

    return fortune;
  }

  // 천운 분석
  private analyzeHeavenlyFortune(fourPillars: FourPillars, elementCount: ElementCount): string {
    const total = elementCount.woodCount + elementCount.fireCount +
                  elementCount.earthCount + elementCount.metalCount + elementCount.waterCount;
    const balance = Math.max(elementCount.woodCount, elementCount.fireCount,
                            elementCount.earthCount, elementCount.metalCount, elementCount.waterCount) -
                   Math.min(elementCount.woodCount, elementCount.fireCount,
                            elementCount.earthCount, elementCount.metalCount, elementCount.waterCount);

    let fortune = '';

    // 균형도에 따른 천운
    if (balance <= 1) {
      fortune += `🌟 천운 등급: ★★★★★ (상길)\n\n`;
      fortune += `오행이 매우 균형 잡혀 있어 타고난 운이 좋습니다.\n`;
      fortune += `어떤 상황에서도 중심을 잡고 헤쳐나갈 수 있는 힘이 있습니다.\n`;
      fortune += `큰 위기 없이 안정적인 인생을 살 가능성이 높습니다.\n`;
    } else if (balance <= 2) {
      fortune += `🌟 천운 등급: ★★★★☆ (중길)\n\n`;
      fortune += `오행이 비교적 균형 잡혀 있어 운이 좋은 편입니다.\n`;
      fortune += `노력에 따른 보상이 잘 따라오며, 기회를 잘 잡을 수 있습니다.\n`;
      fortune += `작은 어려움은 있으나 극복 가능한 수준입니다.\n`;
    } else if (balance <= 3) {
      fortune += `🌟 천운 등급: ★★★☆☆ (평운)\n\n`;
      fortune += `오행에 약간의 편차가 있어 노력이 필요합니다.\n`;
      fortune += `자신의 강점을 살리고 약점을 보완하면 좋은 결과를 얻습니다.\n`;
      fortune += `인내와 지혜로 운을 개척해 나갈 수 있습니다.\n`;
    } else {
      fortune += `🌟 천운 등급: ★★☆☆☆ (편운)\n\n`;
      fortune += `오행의 편차가 커서 파란만장한 인생이 예상됩니다.\n`;
      fortune += `하지만 이는 큰 성공의 가능성도 함께 의미합니다.\n`;
      fortune += `부족한 오행을 적극적으로 보완하면 운이 크게 상승합니다.\n`;
    }

    // 일주 조합에 따른 추가 분석
    const dayStem = fourPillars.dayStem;
    const dayBranch = fourPillars.dayBranch;
    const goodCombos: Record<string, string[]> = {
      '갑': ['자', '해'], '을': ['묘', '해'], '병': ['사', '인'],
      '정': ['오', '미'], '무': ['사', '오'], '기': ['축', '미'],
      '경': ['신', '유'], '신': ['유', '술'], '임': ['자', '해'],
      '계': ['축', '자']
    };

    if (goodCombos[dayStem]?.includes(dayBranch)) {
      fortune += `\n✨ 일주(${dayStem}${dayBranch})가 좋은 조합으로, 기본 운이 상승합니다.\n`;
    }

    return fortune;
  }

  // 사주 리딩 목록 조회
  async getReadings(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      prisma.sajuReading.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.sajuReading.count({ where: { userId } })
    ]);

    return {
      readings: readings.map(r => ({
        ...r,
        fourPillarsDisplay: this.getFourPillarsDisplay({
          yearStem: r.yearStem,
          yearBranch: r.yearBranch,
          monthStem: r.monthStem,
          monthBranch: r.monthBranch,
          dayStem: r.dayStem,
          dayBranch: r.dayBranch,
          hourStem: r.hourStem || undefined,
          hourBranch: r.hourBranch || undefined
        }),
        zodiacAnimal: EARTHLY_BRANCHES_ANIMALS[EARTHLY_BRANCHES.indexOf(r.yearBranch)]
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 사주 리딩 상세 조회
  async getReadingById(id: string, userId: string) {
    const reading = await prisma.sajuReading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      throw new Error('사주 리딩을 찾을 수 없습니다.');
    }

    const fourPillars: FourPillars = {
      yearStem: reading.yearStem,
      yearBranch: reading.yearBranch,
      monthStem: reading.monthStem,
      monthBranch: reading.monthBranch,
      dayStem: reading.dayStem,
      dayBranch: reading.dayBranch,
      hourStem: reading.hourStem || undefined,
      hourBranch: reading.hourBranch || undefined
    };

    const elementCount: ElementCount = {
      woodCount: reading.woodCount,
      fireCount: reading.fireCount,
      earthCount: reading.earthCount,
      metalCount: reading.metalCount,
      waterCount: reading.waterCount
    };

    return {
      ...reading,
      fourPillarsDisplay: this.getFourPillarsDisplay(fourPillars),
      elementAnalysis: this.getElementAnalysis(elementCount),
      zodiacAnimal: EARTHLY_BRANCHES_ANIMALS[EARTHLY_BRANCHES.indexOf(reading.yearBranch)]
    };
  }

  // 사주 리딩 삭제
  async deleteReading(id: string, userId: string) {
    const reading = await prisma.sajuReading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      throw new Error('사주 리딩을 찾을 수 없습니다.');
    }

    await prisma.sajuReading.delete({ where: { id } });

    return { message: '사주 리딩이 삭제되었습니다.' };
  }
}

export const sajuService = new SajuService();

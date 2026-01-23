import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { config } from '../config/env';

// 오행 (Five Elements)
export type FiveElement = 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER';

// 십간 (Ten Heavenly Stems)
export type HeavenlyStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';

// 십이지 (Twelve Earthly Branches)
export type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';

// 타로 슈트
export type TarotSuit = 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES' | 'MAJOR';

// 사주 기둥
export interface SajuPillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

// 사주 정보
export interface SajuInfo {
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar;
}

// 천간-오행 매핑
const STEM_TO_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '갑': 'WOOD', '을': 'WOOD',
  '병': 'FIRE', '정': 'FIRE',
  '무': 'EARTH', '기': 'EARTH',
  '경': 'METAL', '신': 'METAL',
  '임': 'WATER', '계': 'WATER'
};

// 지지-오행 매핑
const BRANCH_TO_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '인': 'WOOD', '묘': 'WOOD',
  '사': 'FIRE', '오': 'FIRE',
  '진': 'EARTH', '술': 'EARTH', '축': 'EARTH', '미': 'EARTH',
  '신': 'METAL', '유': 'METAL',
  '해': 'WATER', '자': 'WATER'
};

// 오행-타로 슈트 매핑
const ELEMENT_TO_SUIT: Record<FiveElement, TarotSuit> = {
  'FIRE': 'WANDS',      // 화(火) - 완드(열정, 에너지)
  'WATER': 'CUPS',      // 수(水) - 컵(감정, 직관)
  'METAL': 'SWORDS',    // 금(金) - 소드(지성, 판단)
  'EARTH': 'PENTACLES', // 토(土) - 펜타클(물질, 현실)
  'WOOD': 'WANDS'       // 목(木) - 완드(성장, 창조)
};

// 오행 상생 관계 (생성하는 관계)
const ELEMENT_GENERATION: Record<FiveElement, FiveElement> = {
  'WOOD': 'FIRE',   // 목생화
  'FIRE': 'EARTH',  // 화생토
  'EARTH': 'METAL', // 토생금
  'METAL': 'WATER', // 금생수
  'WATER': 'WOOD'   // 수생목
};

// 오행 상극 관계 (억제하는 관계)
const ELEMENT_DESTRUCTION: Record<FiveElement, FiveElement> = {
  'WOOD': 'EARTH',  // 목극토
  'EARTH': 'WATER', // 토극수
  'WATER': 'FIRE',  // 수극화
  'FIRE': 'METAL',  // 화극금
  'METAL': 'WOOD'   // 금극목
};

// 메이저 아르카나와 오행/천간지지 매핑
const MAJOR_ARCANA_ELEMENTS: Record<number, { element: FiveElement; meaning: string }> = {
  0: { element: 'WOOD', meaning: '새로운 시작, 자유로운 영혼' },      // The Fool
  1: { element: 'FIRE', meaning: '창조력, 의지력' },                 // The Magician
  2: { element: 'WATER', meaning: '직관, 신비' },                   // High Priestess
  3: { element: 'EARTH', meaning: '풍요, 양육' },                   // The Empress
  4: { element: 'METAL', meaning: '권위, 질서' },                   // The Emperor
  5: { element: 'EARTH', meaning: '전통, 가르침' },                 // Hierophant
  6: { element: 'WATER', meaning: '사랑, 선택' },                   // The Lovers
  7: { element: 'FIRE', meaning: '승리, 추진력' },                  // The Chariot
  8: { element: 'FIRE', meaning: '용기, 내면의 힘' },               // Strength
  9: { element: 'EARTH', meaning: '내면 탐구, 지혜' },              // The Hermit
  10: { element: 'WOOD', meaning: '운명의 전환, 순환' },            // Wheel of Fortune
  11: { element: 'METAL', meaning: '균형, 진실' },                  // Justice
  12: { element: 'WATER', meaning: '희생, 다른 관점' },             // Hanged Man
  13: { element: 'WATER', meaning: '변화, 종결과 시작' },           // Death
  14: { element: 'EARTH', meaning: '조화, 절제' },                  // Temperance
  15: { element: 'FIRE', meaning: '욕망, 속박' },                   // The Devil
  16: { element: 'FIRE', meaning: '갑작스런 변화, 해방' },          // The Tower
  17: { element: 'WATER', meaning: '희망, 영감' },                  // The Star
  18: { element: 'WATER', meaning: '환상, 무의식' },                // The Moon
  19: { element: 'FIRE', meaning: '성공, 활력' },                   // The Sun
  20: { element: 'METAL', meaning: '부활, 판단' },                  // Judgement
  21: { element: 'EARTH', meaning: '완성, 통합' }                   // The World
};

export class Neo4jService {
  private driver: Driver | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<boolean> {
    try {
      this.driver = neo4j.driver(
        config.NEO4J_URI,
        neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD)
      );

      // 연결 테스트
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();

      this.isConnected = true;
      console.log('[Neo4j] Connected successfully');
      return true;
    } catch (error: any) {
      console.error('[Neo4j] Connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
    }
  }

  private getSession(): Session | null {
    if (!this.driver || !this.isConnected) {
      return null;
    }
    return this.driver.session();
  }

  // 그래프 데이터베이스 초기화 (스키마 생성)
  async initializeSchema(): Promise<void> {
    const session = this.getSession();
    if (!session) {
      console.log('[Neo4j] Skipping schema initialization - not connected');
      return;
    }

    try {
      // 노드 인덱스 생성
      await session.run(`
        CREATE INDEX element_name IF NOT EXISTS FOR (e:Element) ON (e.name)
      `);
      await session.run(`
        CREATE INDEX tarot_card IF NOT EXISTS FOR (t:TarotCard) ON (t.number, t.suit)
      `);
      await session.run(`
        CREATE INDEX heavenly_stem IF NOT EXISTS FOR (h:HeavenlyStem) ON (h.name)
      `);
      await session.run(`
        CREATE INDEX earthly_branch IF NOT EXISTS FOR (e:EarthlyBranch) ON (e.name)
      `);

      console.log('[Neo4j] Schema initialized');
    } catch (error: any) {
      console.error('[Neo4j] Schema initialization error:', error.message);
    } finally {
      await session.close();
    }
  }

  // 기본 관계 데이터 시드
  async seedRelationships(): Promise<void> {
    const session = this.getSession();
    if (!session) {
      console.log('[Neo4j] Skipping seed - not connected');
      return;
    }

    try {
      // 오행 노드 생성
      const elements: FiveElement[] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
      const elementKorean: Record<FiveElement, string> = {
        'WOOD': '목(木)', 'FIRE': '화(火)', 'EARTH': '토(土)',
        'METAL': '금(金)', 'WATER': '수(水)'
      };

      for (const element of elements) {
        await session.run(`
          MERGE (e:Element {name: $name})
          SET e.korean = $korean, e.tarotSuit = $suit
        `, {
          name: element,
          korean: elementKorean[element],
          suit: ELEMENT_TO_SUIT[element]
        });
      }

      // 천간 노드 생성
      const stems: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
      for (const stem of stems) {
        await session.run(`
          MERGE (h:HeavenlyStem {name: $name})
          SET h.element = $element
        `, {
          name: stem,
          element: STEM_TO_ELEMENT[stem]
        });

        // 천간-오행 관계
        await session.run(`
          MATCH (h:HeavenlyStem {name: $stem})
          MATCH (e:Element {name: $element})
          MERGE (h)-[:BELONGS_TO]->(e)
        `, {
          stem,
          element: STEM_TO_ELEMENT[stem]
        });
      }

      // 지지 노드 생성
      const branches: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
      for (const branch of branches) {
        await session.run(`
          MERGE (b:EarthlyBranch {name: $name})
          SET b.element = $element
        `, {
          name: branch,
          element: BRANCH_TO_ELEMENT[branch]
        });

        // 지지-오행 관계
        await session.run(`
          MATCH (b:EarthlyBranch {name: $branch})
          MATCH (e:Element {name: $element})
          MERGE (b)-[:BELONGS_TO]->(e)
        `, {
          branch,
          element: BRANCH_TO_ELEMENT[branch]
        });
      }

      // 오행 상생 관계
      for (const [from, to] of Object.entries(ELEMENT_GENERATION)) {
        await session.run(`
          MATCH (e1:Element {name: $from})
          MATCH (e2:Element {name: $to})
          MERGE (e1)-[:GENERATES]->(e2)
        `, { from, to });
      }

      // 오행 상극 관계
      for (const [from, to] of Object.entries(ELEMENT_DESTRUCTION)) {
        await session.run(`
          MATCH (e1:Element {name: $from})
          MATCH (e2:Element {name: $to})
          MERGE (e1)-[:DESTROYS]->(e2)
        `, { from, to });
      }

      // 타로 카드 노드 및 관계 생성 (메이저 아르카나)
      for (const [numStr, info] of Object.entries(MAJOR_ARCANA_ELEMENTS)) {
        const num = parseInt(numStr);
        await session.run(`
          MERGE (t:TarotCard {number: $number, suit: 'MAJOR'})
          SET t.element = $element, t.meaning = $meaning
        `, {
          number: num,
          element: info.element,
          meaning: info.meaning
        });

        // 타로카드-오행 관계
        await session.run(`
          MATCH (t:TarotCard {number: $number, suit: 'MAJOR'})
          MATCH (e:Element {name: $element})
          MERGE (t)-[:RESONATES_WITH {strength: 1.0}]->(e)
        `, {
          number: num,
          element: info.element
        });
      }

      // 마이너 아르카나 - 슈트별 오행 관계
      const suits: Array<{ suit: TarotSuit; element: FiveElement }> = [
        { suit: 'WANDS', element: 'FIRE' },
        { suit: 'CUPS', element: 'WATER' },
        { suit: 'SWORDS', element: 'METAL' },
        { suit: 'PENTACLES', element: 'EARTH' }
      ];

      for (const { suit, element } of suits) {
        for (let num = 1; num <= 14; num++) {
          await session.run(`
            MERGE (t:TarotCard {number: $number, suit: $suit})
            SET t.element = $element
          `, { number: num, suit, element });

          await session.run(`
            MATCH (t:TarotCard {number: $number, suit: $suit})
            MATCH (e:Element {name: $element})
            MERGE (t)-[:RESONATES_WITH {strength: 0.8}]->(e)
          `, { number: num, suit, element });
        }
      }

      console.log('[Neo4j] Relationships seeded successfully');
    } catch (error: any) {
      console.error('[Neo4j] Seed error:', error.message);
    } finally {
      await session.close();
    }
  }

  // 사주에서 오행 분석
  analyzeSajuElements(saju: SajuInfo): Record<FiveElement, number> {
    const elements: Record<FiveElement, number> = {
      'WOOD': 0, 'FIRE': 0, 'EARTH': 0, 'METAL': 0, 'WATER': 0
    };

    const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar, saju.hourPillar];

    for (const pillar of pillars) {
      elements[STEM_TO_ELEMENT[pillar.stem]]++;
      elements[BRANCH_TO_ELEMENT[pillar.branch]]++;
    }

    return elements;
  }

  // 사주 기반 추천 타로 카드 조회
  async getRecommendedCards(saju: SajuInfo): Promise<{
    cards: Array<{ number: number; suit: string; reason: string; strength: number }>;
    dominantElement: FiveElement;
    weakElement: FiveElement;
    analysis: string;
  }> {
    const elements = this.analyzeSajuElements(saju);

    // 가장 강한/약한 오행 찾기
    const sortedElements = Object.entries(elements).sort((a, b) => b[1] - a[1]);
    const dominantElement = sortedElements[0][0] as FiveElement;
    const weakElement = sortedElements[sortedElements.length - 1][0] as FiveElement;

    // 보완이 필요한 오행 (상생 관계로 약한 오행을 생성하는 오행)
    let complementElement: FiveElement = 'EARTH';
    for (const [gen, target] of Object.entries(ELEMENT_GENERATION)) {
      if (target === weakElement) {
        complementElement = gen as FiveElement;
        break;
      }
    }

    const session = this.getSession();
    const cards: Array<{ number: number; suit: string; reason: string; strength: number }> = [];

    if (session) {
      try {
        // 강한 오행과 공명하는 카드 (현재 에너지 활용)
        const dominantCards = await session.run(`
          MATCH (t:TarotCard)-[r:RESONATES_WITH]->(e:Element {name: $element})
          RETURN t.number as number, t.suit as suit, t.meaning as meaning, r.strength as strength
          ORDER BY r.strength DESC
          LIMIT 3
        `, { element: dominantElement });

        for (const record of dominantCards.records) {
          cards.push({
            number: record.get('number'),
            suit: record.get('suit'),
            reason: `강한 ${this.getElementKorean(dominantElement)} 에너지 활용: ${record.get('meaning') || ''}`,
            strength: record.get('strength')
          });
        }

        // 약한 오행을 보완하는 카드
        const complementCards = await session.run(`
          MATCH (t:TarotCard)-[r:RESONATES_WITH]->(e:Element {name: $element})
          RETURN t.number as number, t.suit as suit, t.meaning as meaning, r.strength as strength
          ORDER BY r.strength DESC
          LIMIT 2
        `, { element: complementElement });

        for (const record of complementCards.records) {
          cards.push({
            number: record.get('number'),
            suit: record.get('suit'),
            reason: `약한 ${this.getElementKorean(weakElement)} 보완: ${record.get('meaning') || ''}`,
            strength: record.get('strength') * 0.8
          });
        }

      } catch (error: any) {
        console.error('[Neo4j] Query error:', error.message);
      } finally {
        await session.close();
      }
    }

    // Neo4j가 연결되지 않은 경우 로컬 데이터로 대체
    if (cards.length === 0) {
      cards.push(...this.getLocalRecommendedCards(dominantElement, weakElement, complementElement));
    }

    const analysis = this.generateSajuAnalysis(elements, dominantElement, weakElement);

    return {
      cards,
      dominantElement,
      weakElement,
      analysis
    };
  }

  // 로컬 추천 카드 (Neo4j 미연결시)
  private getLocalRecommendedCards(
    dominant: FiveElement,
    weak: FiveElement,
    complement: FiveElement
  ): Array<{ number: number; suit: string; reason: string; strength: number }> {
    const cards = [];
    const dominantSuit = ELEMENT_TO_SUIT[dominant];
    const complementSuit = ELEMENT_TO_SUIT[complement];

    // 강한 오행 관련 메이저 아르카나
    for (const [num, info] of Object.entries(MAJOR_ARCANA_ELEMENTS)) {
      if (info.element === dominant && cards.length < 3) {
        cards.push({
          number: parseInt(num),
          suit: 'MAJOR',
          reason: `강한 ${this.getElementKorean(dominant)} 에너지: ${info.meaning}`,
          strength: 1.0
        });
      }
    }

    // 보완 오행 관련 카드
    for (const [num, info] of Object.entries(MAJOR_ARCANA_ELEMENTS)) {
      if (info.element === complement && cards.length < 5) {
        cards.push({
          number: parseInt(num),
          suit: 'MAJOR',
          reason: `${this.getElementKorean(weak)} 보완: ${info.meaning}`,
          strength: 0.8
        });
      }
    }

    return cards;
  }

  private getElementKorean(element: FiveElement): string {
    const korean: Record<FiveElement, string> = {
      'WOOD': '목(木)', 'FIRE': '화(火)', 'EARTH': '토(土)',
      'METAL': '금(金)', 'WATER': '수(水)'
    };
    return korean[element];
  }

  private generateSajuAnalysis(
    elements: Record<FiveElement, number>,
    dominant: FiveElement,
    weak: FiveElement
  ): string {
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    const dominantPercent = Math.round((elements[dominant] / total) * 100);
    const weakPercent = Math.round((elements[weak] / total) * 100);

    const elementTraits: Record<FiveElement, string> = {
      'WOOD': '성장과 창조의 에너지가 강하며, 새로운 시작과 발전을 추구합니다',
      'FIRE': '열정과 활력이 넘치며, 리더십과 추진력이 있습니다',
      'EARTH': '안정과 신뢰를 중시하며, 현실적이고 실용적입니다',
      'METAL': '정의와 결단력이 있으며, 분석적이고 명확합니다',
      'WATER': '지혜와 직관력이 뛰어나며, 유연하고 적응력이 있습니다'
    };

    return `당신의 사주에서 ${this.getElementKorean(dominant)}이(가) ${dominantPercent}%로 가장 강합니다. ` +
      `${elementTraits[dominant]} ` +
      `반면 ${this.getElementKorean(weak)}은(는) ${weakPercent}%로 상대적으로 약합니다. ` +
      `균형을 위해 ${this.getElementKorean(weak)} 에너지를 보완하는 것이 좋습니다.`;
  }

  // 특정 타로 카드와 관련된 사주 요소 조회
  async getCardSajuRelations(cardNumber: number, suit: string): Promise<{
    element: FiveElement;
    relatedStems: HeavenlyStem[];
    relatedBranches: EarthlyBranch[];
    generatingElement: FiveElement;
    destroyingElement: FiveElement;
  } | null> {
    // 로컬 데이터로 처리
    let cardElement: FiveElement;

    if (suit === 'MAJOR') {
      const info = MAJOR_ARCANA_ELEMENTS[cardNumber];
      if (!info) return null;
      cardElement = info.element;
    } else {
      const suitElement: Record<string, FiveElement> = {
        'WANDS': 'FIRE',
        'CUPS': 'WATER',
        'SWORDS': 'METAL',
        'PENTACLES': 'EARTH'
      };
      cardElement = suitElement[suit] || 'EARTH';
    }

    // 해당 오행에 속하는 천간/지지 찾기
    const relatedStems = (Object.entries(STEM_TO_ELEMENT) as [HeavenlyStem, FiveElement][])
      .filter(([_, el]) => el === cardElement)
      .map(([stem, _]) => stem);

    const relatedBranches = (Object.entries(BRANCH_TO_ELEMENT) as [EarthlyBranch, FiveElement][])
      .filter(([_, el]) => el === cardElement)
      .map(([branch, _]) => branch);

    return {
      element: cardElement,
      relatedStems,
      relatedBranches,
      generatingElement: ELEMENT_GENERATION[cardElement],
      destroyingElement: ELEMENT_DESTRUCTION[cardElement]
    };
  }

  // 사주-타로 종합 리딩
  async getCombinedReading(saju: SajuInfo, tarotCards: Array<{ number: number; suit: string; isReversed: boolean }>): Promise<{
    harmony: number;
    insights: string[];
    recommendations: string[];
  }> {
    const sajuElements = this.analyzeSajuElements(saju);
    const insights: string[] = [];
    const recommendations: string[] = [];
    let harmonyScore = 50; // 기본 점수

    for (const card of tarotCards) {
      const relations = await this.getCardSajuRelations(card.number, card.suit);
      if (!relations) continue;

      const cardElement = relations.element;
      const sajuStrength = sajuElements[cardElement];

      if (sajuStrength >= 2) {
        harmonyScore += 10;
        insights.push(
          `${card.suit === 'MAJOR' ? '메이저 아르카나' : card.suit} ${card.number}번 카드는 ` +
          `당신의 강한 ${this.getElementKorean(cardElement)} 에너지와 공명합니다.`
        );
      } else if (sajuStrength === 0) {
        harmonyScore -= 5;
        insights.push(
          `${card.suit === 'MAJOR' ? '메이저 아르카나' : card.suit} ${card.number}번 카드의 ` +
          `${this.getElementKorean(cardElement)} 에너지는 당신에게 새로운 관점을 제시합니다.`
        );
        recommendations.push(
          `${this.getElementKorean(cardElement)} 에너지를 의식적으로 받아들이세요.`
        );
      }

      // 역방향 카드 처리
      if (card.isReversed) {
        harmonyScore -= 5;
        insights.push(
          `역방향 카드는 ${this.getElementKorean(cardElement)} 에너지의 내면적 작용을 나타냅니다.`
        );
      }
    }

    // 점수 범위 조정
    harmonyScore = Math.max(0, Math.min(100, harmonyScore));

    return {
      harmony: harmonyScore,
      insights,
      recommendations
    };
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const neo4jService = new Neo4jService();

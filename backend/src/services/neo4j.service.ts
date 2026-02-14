import neo4j, { Driver, Session } from 'neo4j-driver';
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

// 충합 분석 결과
export interface ConflictsAndHarmonies {
  stemCombinations: Array<{ name: string; element: FiveElement; stems: HeavenlyStem[] }>;
  branchConflicts: Array<{ name: string; branches: EarthlyBranch[] }>;
  tripleHarmonies: Array<{ name: string; element: FiveElement; branches: EarthlyBranch[] }>;
  sixHarmonies: Array<{ name: string; element: FiveElement; branches: EarthlyBranch[] }>;
}

// 그래프 인사이트 결과
export interface GraphInsight {
  elementBalance: Record<FiveElement, number>;
  dominantElement: FiveElement;
  weakElement: FiveElement;
  conflictsAndHarmonies: ConflictsAndHarmonies;
  graphCards: Array<{ number: number; suit: string; reason: string; strength: number; path?: string }>;
  analysis: string;
  insights: string[];
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
  'FIRE': 'WANDS',
  'WATER': 'CUPS',
  'METAL': 'SWORDS',
  'EARTH': 'PENTACLES',
  'WOOD': 'WANDS'
};

// 오행 상생 관계
const ELEMENT_GENERATION: Record<FiveElement, FiveElement> = {
  'WOOD': 'FIRE',
  'FIRE': 'EARTH',
  'EARTH': 'METAL',
  'METAL': 'WATER',
  'WATER': 'WOOD'
};

// 오행 상극 관계
const ELEMENT_DESTRUCTION: Record<FiveElement, FiveElement> = {
  'WOOD': 'EARTH',
  'EARTH': 'WATER',
  'WATER': 'FIRE',
  'FIRE': 'METAL',
  'METAL': 'WOOD'
};

// 천간합 (Five Stem Combinations - 합화오행)
const STEM_COMBINATIONS: Array<{ stems: [HeavenlyStem, HeavenlyStem]; element: FiveElement; name: string }> = [
  { stems: ['갑', '기'], element: 'EARTH',  name: '갑기합토(甲己合土)' },
  { stems: ['을', '경'], element: 'METAL',  name: '을경합금(乙庚合金)' },
  { stems: ['병', '신'], element: 'WATER',  name: '병신합수(丙辛合水)' },
  { stems: ['정', '임'], element: 'WOOD',   name: '정임합목(丁壬合木)' },
  { stems: ['무', '계'], element: 'FIRE',   name: '무계합화(戊癸合火)' }
];

// 지지충 (Six Branch Conflicts)
const BRANCH_CONFLICTS: Array<{ branches: [EarthlyBranch, EarthlyBranch]; name: string }> = [
  { branches: ['자', '오'], name: '자오충(子午冲)' },
  { branches: ['축', '미'], name: '축미충(丑未冲)' },
  { branches: ['인', '신'], name: '인신충(寅申冲)' },
  { branches: ['묘', '유'], name: '묘유충(卯酉冲)' },
  { branches: ['진', '술'], name: '진술충(辰戌冲)' },
  { branches: ['사', '해'], name: '사해충(巳亥冲)' }
];

// 지지삼합 (Branch Triple Harmonies - form element group)
const BRANCH_TRIPLE_HARMONIES: Array<{
  branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch];
  element: FiveElement;
  name: string;
}> = [
  { branches: ['인', '오', '술'], element: 'FIRE',  name: '인오술 화국(寅午戌 火局)' },
  { branches: ['신', '자', '진'], element: 'WATER', name: '신자진 수국(申子辰 水局)' },
  { branches: ['해', '묘', '미'], element: 'WOOD',  name: '해묘미 목국(亥卯未 木局)' },
  { branches: ['사', '유', '축'], element: 'METAL', name: '사유축 금국(巳酉丑 金局)' }
];

// 지지육합 (Branch Six Harmonies - pairs)
const BRANCH_SIX_HARMONIES: Array<{
  branches: [EarthlyBranch, EarthlyBranch];
  element: FiveElement;
  name: string;
}> = [
  { branches: ['자', '축'], element: 'EARTH', name: '자축합토(子丑合土)' },
  { branches: ['인', '해'], element: 'WOOD',  name: '인해합목(寅亥合木)' },
  { branches: ['묘', '술'], element: 'FIRE',  name: '묘술합화(卯戌合火)' },
  { branches: ['진', '유'], element: 'METAL', name: '진유합금(辰酉合金)' },
  { branches: ['사', '신'], element: 'WATER', name: '사신합수(巳申合水)' },
  { branches: ['오', '미'], element: 'FIRE',  name: '오미합화(午未合火)' }
];

// 메이저 아르카나 오행 매핑
const MAJOR_ARCANA_ELEMENTS: Record<number, { element: FiveElement; meaning: string }> = {
  0:  { element: 'WOOD',  meaning: '새로운 시작, 자유로운 영혼' },
  1:  { element: 'FIRE',  meaning: '창조력, 의지력' },
  2:  { element: 'WATER', meaning: '직관, 신비' },
  3:  { element: 'EARTH', meaning: '풍요, 양육' },
  4:  { element: 'METAL', meaning: '권위, 질서' },
  5:  { element: 'EARTH', meaning: '전통, 가르침' },
  6:  { element: 'WATER', meaning: '사랑, 선택' },
  7:  { element: 'FIRE',  meaning: '승리, 추진력' },
  8:  { element: 'FIRE',  meaning: '용기, 내면의 힘' },
  9:  { element: 'EARTH', meaning: '내면 탐구, 지혜' },
  10: { element: 'WOOD',  meaning: '운명의 전환, 순환' },
  11: { element: 'METAL', meaning: '균형, 진실' },
  12: { element: 'WATER', meaning: '희생, 다른 관점' },
  13: { element: 'WATER', meaning: '변화, 종결과 시작' },
  14: { element: 'EARTH', meaning: '조화, 절제' },
  15: { element: 'FIRE',  meaning: '욕망, 속박' },
  16: { element: 'FIRE',  meaning: '갑작스런 변화, 해방' },
  17: { element: 'WATER', meaning: '희망, 영감' },
  18: { element: 'WATER', meaning: '환상, 무의식' },
  19: { element: 'FIRE',  meaning: '성공, 활력' },
  20: { element: 'METAL', meaning: '부활, 판단' },
  21: { element: 'EARTH', meaning: '완성, 통합' }
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
    if (!this.driver || !this.isConnected) return null;
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
      await session.run(`CREATE INDEX element_name IF NOT EXISTS FOR (e:Element) ON (e.name)`);
      await session.run(`CREATE INDEX tarot_card IF NOT EXISTS FOR (t:TarotCard) ON (t.number, t.suit)`);
      await session.run(`CREATE INDEX heavenly_stem IF NOT EXISTS FOR (h:HeavenlyStem) ON (h.name)`);
      await session.run(`CREATE INDEX earthly_branch IF NOT EXISTS FOR (e:EarthlyBranch) ON (e.name)`);
      await session.run(`CREATE INDEX stem_combo IF NOT EXISTS FOR (s:StemCombo) ON (s.name)`);
      await session.run(`CREATE INDEX branch_harmony IF NOT EXISTS FOR (b:BranchHarmony) ON (b.name)`);
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
      // 오행 노드
      const elements: FiveElement[] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
      const elementKorean: Record<FiveElement, string> = {
        'WOOD': '목(木)', 'FIRE': '화(火)', 'EARTH': '토(土)',
        'METAL': '금(金)', 'WATER': '수(水)'
      };

      for (const element of elements) {
        await session.run(
          `MERGE (e:Element {name: $name}) SET e.korean = $korean, e.tarotSuit = $suit`,
          { name: element, korean: elementKorean[element], suit: ELEMENT_TO_SUIT[element] }
        );
      }

      // 천간 노드
      const stems: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
      for (const stem of stems) {
        await session.run(
          `MERGE (h:HeavenlyStem {name: $name}) SET h.element = $element`,
          { name: stem, element: STEM_TO_ELEMENT[stem] }
        );
        await session.run(
          `MATCH (h:HeavenlyStem {name: $stem}) MATCH (e:Element {name: $element})
           MERGE (h)-[:BELONGS_TO]->(e)`,
          { stem, element: STEM_TO_ELEMENT[stem] }
        );
      }

      // 지지 노드
      const branches: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
      for (const branch of branches) {
        await session.run(
          `MERGE (b:EarthlyBranch {name: $name}) SET b.element = $element`,
          { name: branch, element: BRANCH_TO_ELEMENT[branch] }
        );
        await session.run(
          `MATCH (b:EarthlyBranch {name: $branch}) MATCH (e:Element {name: $element})
           MERGE (b)-[:BELONGS_TO]->(e)`,
          { branch, element: BRANCH_TO_ELEMENT[branch] }
        );
      }

      // 오행 상생/상극
      for (const [from, to] of Object.entries(ELEMENT_GENERATION)) {
        await session.run(
          `MATCH (e1:Element {name: $from}) MATCH (e2:Element {name: $to}) MERGE (e1)-[:GENERATES]->(e2)`,
          { from, to }
        );
      }
      for (const [from, to] of Object.entries(ELEMENT_DESTRUCTION)) {
        await session.run(
          `MATCH (e1:Element {name: $from}) MATCH (e2:Element {name: $to}) MERGE (e1)-[:DESTROYS]->(e2)`,
          { from, to }
        );
      }

      // 메이저 아르카나 카드 노드 및 관계
      for (const [numStr, info] of Object.entries(MAJOR_ARCANA_ELEMENTS)) {
        const num = parseInt(numStr);
        await session.run(
          `MERGE (t:TarotCard {number: $number, suit: 'MAJOR'}) SET t.element = $element, t.meaning = $meaning`,
          { number: num, element: info.element, meaning: info.meaning }
        );
        await session.run(
          `MATCH (t:TarotCard {number: $number, suit: 'MAJOR'}) MATCH (e:Element {name: $element})
           MERGE (t)-[:RESONATES_WITH {strength: 1.0}]->(e)`,
          { number: num, element: info.element }
        );
      }

      // 마이너 아르카나
      const suits: Array<{ suit: TarotSuit; element: FiveElement }> = [
        { suit: 'WANDS', element: 'FIRE' },
        { suit: 'CUPS', element: 'WATER' },
        { suit: 'SWORDS', element: 'METAL' },
        { suit: 'PENTACLES', element: 'EARTH' }
      ];
      for (const { suit, element } of suits) {
        for (let num = 1; num <= 14; num++) {
          await session.run(
            `MERGE (t:TarotCard {number: $number, suit: $suit}) SET t.element = $element`,
            { number: num, suit, element }
          );
          await session.run(
            `MATCH (t:TarotCard {number: $number, suit: $suit}) MATCH (e:Element {name: $element})
             MERGE (t)-[:RESONATES_WITH {strength: 0.8}]->(e)`,
            { number: num, suit, element }
          );
        }
      }

      console.log('[Neo4j] Basic relationships seeded');
    } catch (error: any) {
      console.error('[Neo4j] Seed error:', error.message);
    } finally {
      await session.close();
    }
  }

  // 고급 관계 시드: 천간합, 지지충, 지지삼합, 지지육합
  async seedAdvancedRelationships(): Promise<void> {
    const session = this.getSession();
    if (!session) {
      console.log('[Neo4j] Skipping advanced seed - not connected');
      return;
    }

    try {
      // 천간합 (StemCombo 노드 + COMBINES_WITH 관계)
      for (const combo of STEM_COMBINATIONS) {
        await session.run(
          `MERGE (sc:StemCombo {name: $name}) SET sc.element = $element, sc.stems = $stems`,
          { name: combo.name, element: combo.element, stems: combo.stems }
        );
        for (const stem of combo.stems) {
          await session.run(
            `MATCH (h:HeavenlyStem {name: $stem}) MATCH (sc:StemCombo {name: $name})
             MERGE (h)-[:COMBINES_INTO]->(sc)`,
            { stem, name: combo.name }
          );
        }
        // 합화오행 관계
        await session.run(
          `MATCH (sc:StemCombo {name: $name}) MATCH (e:Element {name: $element})
           MERGE (sc)-[:TRANSFORMS_TO]->(e)`,
          { name: combo.name, element: combo.element }
        );
      }

      // 지지충 (CLASHES_WITH 관계 - 양방향)
      for (const conflict of BRANCH_CONFLICTS) {
        const [b1, b2] = conflict.branches;
        await session.run(
          `MATCH (b1:EarthlyBranch {name: $b1}) MATCH (b2:EarthlyBranch {name: $b2})
           MERGE (b1)-[:CLASHES_WITH {name: $name}]->(b2)
           MERGE (b2)-[:CLASHES_WITH {name: $name}]->(b1)`,
          { b1, b2, name: conflict.name }
        );
      }

      // 지지삼합 (BranchHarmony 노드 - 삼합)
      for (const harmony of BRANCH_TRIPLE_HARMONIES) {
        await session.run(
          `MERGE (bh:BranchHarmony {name: $name}) SET bh.type = 'triple', bh.element = $element`,
          { name: harmony.name, element: harmony.element }
        );
        for (const branch of harmony.branches) {
          await session.run(
            `MATCH (b:EarthlyBranch {name: $branch}) MATCH (bh:BranchHarmony {name: $name})
             MERGE (b)-[:FORMS_HARMONY]->(bh)`,
            { branch, name: harmony.name }
          );
        }
        await session.run(
          `MATCH (bh:BranchHarmony {name: $name}) MATCH (e:Element {name: $element})
           MERGE (bh)-[:TRANSFORMS_TO]->(e)`,
          { name: harmony.name, element: harmony.element }
        );
      }

      // 지지육합 (BranchHarmony 노드 - 육합)
      for (const harmony of BRANCH_SIX_HARMONIES) {
        await session.run(
          `MERGE (bh:BranchHarmony {name: $name}) SET bh.type = 'six', bh.element = $element`,
          { name: harmony.name, element: harmony.element }
        );
        for (const branch of harmony.branches) {
          await session.run(
            `MATCH (b:EarthlyBranch {name: $branch}) MATCH (bh:BranchHarmony {name: $name})
             MERGE (b)-[:FORMS_HARMONY]->(bh)`,
            { branch, name: harmony.name }
          );
        }
        await session.run(
          `MATCH (bh:BranchHarmony {name: $name}) MATCH (e:Element {name: $element})
           MERGE (bh)-[:TRANSFORMS_TO]->(e)`,
          { name: harmony.name, element: harmony.element }
        );
      }

      console.log('[Neo4j] Advanced relationships seeded (천간합/지지충/삼합/육합)');
    } catch (error: any) {
      console.error('[Neo4j] Advanced seed error:', error.message);
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

  // 충합 분석 (순수 로컬 계산 - Neo4j 불필요)
  findConflictsAndHarmonies(saju: SajuInfo): ConflictsAndHarmonies {
    const stems = [
      saju.yearPillar.stem, saju.monthPillar.stem,
      saju.dayPillar.stem, saju.hourPillar.stem
    ];
    const branches = [
      saju.yearPillar.branch, saju.monthPillar.branch,
      saju.dayPillar.branch, saju.hourPillar.branch
    ];
    const branchSet = new Set(branches);

    // 천간합 검출
    const foundStemCombos = STEM_COMBINATIONS.filter(combo =>
      stems.includes(combo.stems[0]) && stems.includes(combo.stems[1])
    ).map(combo => ({ name: combo.name, element: combo.element, stems: [...combo.stems] }));

    // 지지충 검출
    const foundConflicts = BRANCH_CONFLICTS.filter(c =>
      branchSet.has(c.branches[0]) && branchSet.has(c.branches[1])
    ).map(c => ({ name: c.name, branches: [...c.branches] }));

    // 지지삼합 검출 (최소 2개 이상 포함)
    const foundTriple = BRANCH_TRIPLE_HARMONIES.filter(h =>
      h.branches.filter(b => branchSet.has(b)).length >= 2
    ).map(h => ({ name: h.name, element: h.element, branches: [...h.branches] }));

    // 지지육합 검출
    const foundSix = BRANCH_SIX_HARMONIES.filter(h =>
      branchSet.has(h.branches[0]) && branchSet.has(h.branches[1])
    ).map(h => ({ name: h.name, element: h.element, branches: [...h.branches] }));

    return {
      stemCombinations: foundStemCombos,
      branchConflicts: foundConflicts,
      tripleHarmonies: foundTriple,
      sixHarmonies: foundSix
    };
  }

  // 그래프 기반 카드 추천 (Multi-hop Cypher)
  async getGraphRecommendedCards(saju: SajuInfo): Promise<
    Array<{ number: number; suit: string; reason: string; strength: number; path: string }>
  > {
    const session = this.getSession();
    if (!session) return [];

    const stems = [
      saju.yearPillar.stem, saju.monthPillar.stem,
      saju.dayPillar.stem, saju.hourPillar.stem
    ];
    const branches = [
      saju.yearPillar.branch, saju.monthPillar.branch,
      saju.dayPillar.branch, saju.hourPillar.branch
    ];

    const cards: Array<{ number: number; suit: string; reason: string; strength: number; path: string }> = [];

    try {
      // 쿼리 1: 천간 → 오행 → 타로 카드 (직접 공명)
      const directQuery = await session.run(`
        MATCH (h:HeavenlyStem)-[:BELONGS_TO]->(e:Element)<-[r:RESONATES_WITH]-(t:TarotCard)
        WHERE h.name IN $stems
        RETURN t.number AS number, t.suit AS suit, t.meaning AS meaning,
               avg(r.strength) AS strength, e.korean AS elementKorean,
               collect(distinct h.name) AS matchedStems
        ORDER BY strength DESC
        LIMIT 3
      `, { stems });

      for (const rec of directQuery.records) {
        cards.push({
          number: rec.get('number'),
          suit: rec.get('suit'),
          reason: `천간 ${(rec.get('matchedStems') as string[]).join('・')} → ${rec.get('elementKorean') as string} 직접 공명`,
          strength: rec.get('strength'),
          path: `천간(${(rec.get('matchedStems') as string[]).join(',')}) → ${rec.get('elementKorean') as string} → 카드`
        });
      }

      // 쿼리 2: 지지 → 오행 → 상생 → 타로 카드 (2-hop: 약한 오행 보완)
      const generationQuery = await session.run(`
        MATCH (b:EarthlyBranch)-[:BELONGS_TO]->(e1:Element)-[:GENERATES]->(e2:Element)<-[r:RESONATES_WITH]-(t:TarotCard)
        WHERE b.name IN $branches
        RETURN t.number AS number, t.suit AS suit, t.meaning AS meaning,
               avg(r.strength) * 0.85 AS strength,
               e1.korean AS fromElement, e2.korean AS toElement,
               collect(distinct b.name) AS matchedBranches
        ORDER BY strength DESC
        LIMIT 3
      `, { branches });

      for (const rec of generationQuery.records) {
        cards.push({
          number: rec.get('number'),
          suit: rec.get('suit'),
          reason: `지지 ${(rec.get('matchedBranches') as string[]).join('・')} → ${rec.get('fromElement') as string}이 ${rec.get('toElement') as string}을 생성 (상생 보완)`,
          strength: rec.get('strength'),
          path: `지지(${(rec.get('matchedBranches') as string[]).join(',')}) → ${rec.get('fromElement') as string} → 상생 → ${rec.get('toElement') as string} → 카드`
        });
      }

      // 쿼리 3: 천간합 경로 - 합화오행으로 변화하는 카드
      const { stemCombinations } = this.findConflictsAndHarmonies(saju);
      if (stemCombinations.length > 0) {
        const comboNames = stemCombinations.map(c => c.name);
        const comboQuery = await session.run(`
          MATCH (sc:StemCombo)-[:TRANSFORMS_TO]->(e:Element)<-[r:RESONATES_WITH]-(t:TarotCard)
          WHERE sc.name IN $comboNames
          RETURN t.number AS number, t.suit AS suit, t.meaning AS meaning,
                 avg(r.strength) * 0.9 AS strength,
                 sc.name AS comboName, e.korean AS elementKorean
          ORDER BY strength DESC
          LIMIT 2
        `, { comboNames });

        for (const rec of comboQuery.records) {
          cards.push({
            number: rec.get('number'),
            suit: rec.get('suit'),
            reason: `천간합 ${rec.get('comboName') as string} → ${rec.get('elementKorean') as string} 변화 에너지`,
            strength: rec.get('strength'),
            path: `천간합(${rec.get('comboName') as string}) → ${rec.get('elementKorean') as string} → 카드`
          });
        }
      }

      // 쿼리 4: 지지삼합/육합으로 강화된 오행의 카드
      const { tripleHarmonies, sixHarmonies } = this.findConflictsAndHarmonies(saju);
      const allHarmonies = [...tripleHarmonies, ...sixHarmonies];
      if (allHarmonies.length > 0) {
        const harmonyNames = allHarmonies.map(h => h.name);
        const harmonyQuery = await session.run(`
          MATCH (bh:BranchHarmony)-[:TRANSFORMS_TO]->(e:Element)<-[r:RESONATES_WITH]-(t:TarotCard)
          WHERE bh.name IN $harmonyNames
          RETURN t.number AS number, t.suit AS suit, t.meaning AS meaning,
                 avg(r.strength) * 0.95 AS strength,
                 bh.name AS harmonyName, e.korean AS elementKorean
          ORDER BY strength DESC
          LIMIT 2
        `, { harmonyNames });

        for (const rec of harmonyQuery.records) {
          cards.push({
            number: rec.get('number'),
            suit: rec.get('suit'),
            reason: `지지합 ${rec.get('harmonyName') as string} → ${rec.get('elementKorean') as string} 강화 에너지`,
            strength: rec.get('strength'),
            path: `지지합(${rec.get('harmonyName') as string}) → ${rec.get('elementKorean') as string} → 카드`
          });
        }
      }

    } catch (error: any) {
      console.error('[Neo4j] Graph card query error:', error.message);
    } finally {
      await session.close();
    }

    // 중복 제거 (같은 number+suit는 가장 높은 strength 우선)
    const seen = new Map<string, typeof cards[0]>();
    for (const card of cards) {
      const key = `${card.number}-${card.suit}`;
      const existing = seen.get(key);
      if (!existing || card.strength > existing.strength) {
        seen.set(key, card);
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.strength - a.strength);
  }

  // 사주 기반 추천 타로 카드 (기존 호환 유지)
  async getRecommendedCards(saju: SajuInfo): Promise<{
    cards: Array<{ number: number; suit: string; reason: string; strength: number }>;
    dominantElement: FiveElement;
    weakElement: FiveElement;
    analysis: string;
  }> {
    const elements = this.analyzeSajuElements(saju);
    const sortedElements = Object.entries(elements).sort((a, b) => b[1] - a[1]);
    const dominantElement = sortedElements[0][0] as FiveElement;
    const weakElement = sortedElements[sortedElements.length - 1][0] as FiveElement;

    let complementElement: FiveElement = 'EARTH';
    for (const [gen, target] of Object.entries(ELEMENT_GENERATION)) {
      if (target === weakElement) {
        complementElement = gen as FiveElement;
        break;
      }
    }

    // 먼저 그래프 쿼리 시도
    const graphCards = await this.getGraphRecommendedCards(saju);
    if (graphCards.length > 0) {
      return {
        cards: graphCards.slice(0, 5),
        dominantElement,
        weakElement,
        analysis: this.generateSajuAnalysis(elements, dominantElement, weakElement)
      };
    }

    // 폴백: Neo4j 단순 쿼리
    const session = this.getSession();
    const cards: Array<{ number: number; suit: string; reason: string; strength: number }> = [];

    if (session) {
      try {
        const dominantCards = await session.run(`
          MATCH (t:TarotCard)-[r:RESONATES_WITH]->(e:Element {name: $element})
          RETURN t.number as number, t.suit as suit, t.meaning as meaning, r.strength as strength
          ORDER BY r.strength DESC LIMIT 3
        `, { element: dominantElement });

        for (const record of dominantCards.records) {
          cards.push({
            number: record.get('number'),
            suit: record.get('suit'),
            reason: `강한 ${this.getElementKorean(dominantElement)} 에너지 활용: ${record.get('meaning') || ''}`,
            strength: record.get('strength')
          });
        }

        const complementCards = await session.run(`
          MATCH (t:TarotCard)-[r:RESONATES_WITH]->(e:Element {name: $element})
          RETURN t.number as number, t.suit as suit, t.meaning as meaning, r.strength as strength
          ORDER BY r.strength DESC LIMIT 2
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

    if (cards.length === 0) {
      cards.push(...this.getLocalRecommendedCards(dominantElement, weakElement, complementElement));
    }

    return {
      cards,
      dominantElement,
      weakElement,
      analysis: this.generateSajuAnalysis(elements, dominantElement, weakElement)
    };
  }

  // 사주 그래프 종합 인사이트 (새로운 메서드)
  async getSajuGraphInsight(saju: SajuInfo): Promise<GraphInsight> {
    const elementBalance = this.analyzeSajuElements(saju);
    const sortedElements = Object.entries(elementBalance).sort((a, b) => b[1] - a[1]);
    const dominantElement = sortedElements[0][0] as FiveElement;
    const weakElement = sortedElements[sortedElements.length - 1][0] as FiveElement;

    const conflictsAndHarmonies = this.findConflictsAndHarmonies(saju);
    const graphCards = await this.getGraphRecommendedCards(saju);

    // 로컬 폴백
    const finalCards = graphCards.length > 0
      ? graphCards
      : this.getLocalRecommendedCards(dominantElement, weakElement,
          (() => {
            let comp: FiveElement = 'EARTH';
            for (const [gen, target] of Object.entries(ELEMENT_GENERATION)) {
              if (target === weakElement) { comp = gen as FiveElement; break; }
            }
            return comp;
          })()
        ).map(c => ({ ...c, path: '로컬 데이터' }));

    const insights = this.generateGraphInsights(saju, elementBalance, conflictsAndHarmonies);
    const analysis = this.generateSajuAnalysis(elementBalance, dominantElement, weakElement);

    return {
      elementBalance,
      dominantElement,
      weakElement,
      conflictsAndHarmonies,
      graphCards: finalCards.slice(0, 7),
      analysis,
      insights
    };
  }

  private generateGraphInsights(
    saju: SajuInfo,
    elements: Record<FiveElement, number>,
    cha: ConflictsAndHarmonies
  ): string[] {
    const insights: string[] = [];

    // 오행 균형 인사이트
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
    const domPct = Math.round((dominant[1] / total) * 100);
    if (domPct >= 37) {
      insights.push(`${this.getElementKorean(dominant[0] as FiveElement)} 기운이 ${domPct}%로 매우 강합니다. 지나친 집중을 주의하세요.`);
    }

    // 천간합 인사이트
    for (const combo of cha.stemCombinations) {
      insights.push(`천간합 발생: ${combo.name} — 두 기운이 합쳐져 ${this.getElementKorean(combo.element)} 오행으로 변화합니다. 강력한 변환 에너지가 있습니다.`);
    }

    // 지지충 인사이트
    for (const conflict of cha.branchConflicts) {
      insights.push(`지지충 발생: ${conflict.name} — 두 에너지가 충돌하며 긴장과 변화를 유발합니다. 심리적 갈등에 주의하세요.`);
    }

    // 지지삼합 인사이트
    for (const harmony of cha.tripleHarmonies) {
      insights.push(`지지삼합: ${harmony.name} — 세 지지가 조화를 이루어 ${this.getElementKorean(harmony.element)} 기운을 강화합니다.`);
    }

    // 지지육합 인사이트
    for (const harmony of cha.sixHarmonies) {
      insights.push(`지지육합: ${harmony.name} — 두 지지가 합쳐져 ${this.getElementKorean(harmony.element)} 기운이 생성됩니다.`);
    }

    // 일간(일주 천간) 특성
    const dayStem = saju.dayPillar.stem;
    const dayElement = STEM_TO_ELEMENT[dayStem];
    insights.push(`일간 '${dayStem}'(${this.getElementKorean(dayElement)}) — 본인의 핵심 기질이며 타로 리딩의 중심 에너지입니다.`);

    return insights;
  }

  // 특정 타로 카드와 관련된 사주 요소 조회
  async getCardSajuRelations(cardNumber: number, suit: string): Promise<{
    element: FiveElement;
    relatedStems: HeavenlyStem[];
    relatedBranches: EarthlyBranch[];
    generatingElement: FiveElement;
    destroyingElement: FiveElement;
  } | null> {
    let cardElement: FiveElement;

    if (suit === 'MAJOR') {
      const info = MAJOR_ARCANA_ELEMENTS[cardNumber];
      if (!info) return null;
      cardElement = info.element;
    } else {
      const suitElement: Record<string, FiveElement> = {
        'WANDS': 'FIRE', 'CUPS': 'WATER', 'SWORDS': 'METAL', 'PENTACLES': 'EARTH'
      };
      cardElement = suitElement[suit] || 'EARTH';
    }

    const relatedStems = (Object.entries(STEM_TO_ELEMENT) as [HeavenlyStem, FiveElement][])
      .filter(([_, el]) => el === cardElement).map(([stem]) => stem);
    const relatedBranches = (Object.entries(BRANCH_TO_ELEMENT) as [EarthlyBranch, FiveElement][])
      .filter(([_, el]) => el === cardElement).map(([branch]) => branch);

    return {
      element: cardElement,
      relatedStems,
      relatedBranches,
      generatingElement: ELEMENT_GENERATION[cardElement],
      destroyingElement: ELEMENT_DESTRUCTION[cardElement]
    };
  }

  // 사주-타로 종합 리딩
  async getCombinedReading(
    saju: SajuInfo,
    tarotCards: Array<{ number: number; suit: string; isReversed: boolean }>
  ): Promise<{
    harmony: number;
    insights: string[];
    recommendations: string[];
  }> {
    const sajuElements = this.analyzeSajuElements(saju);
    const insights: string[] = [];
    const recommendations: string[] = [];
    let harmonyScore = 50;

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
        recommendations.push(`${this.getElementKorean(cardElement)} 에너지를 의식적으로 받아들이세요.`);
      }

      if (card.isReversed) {
        harmonyScore -= 5;
        insights.push(`역방향 카드는 ${this.getElementKorean(cardElement)} 에너지의 내면적 작용을 나타냅니다.`);
      }
    }

    harmonyScore = Math.max(0, Math.min(100, harmonyScore));
    return { harmony: harmonyScore, insights, recommendations };
  }

  private getLocalRecommendedCards(
    dominant: FiveElement,
    weak: FiveElement,
    complement: FiveElement
  ): Array<{ number: number; suit: string; reason: string; strength: number }> {
    const cards: Array<{ number: number; suit: string; reason: string; strength: number }> = [];

    for (const [num, info] of Object.entries(MAJOR_ARCANA_ELEMENTS)) {
      if (info.element === dominant && cards.length < 3) {
        cards.push({
          number: parseInt(num), suit: 'MAJOR',
          reason: `강한 ${this.getElementKorean(dominant)} 에너지: ${info.meaning}`,
          strength: 1.0
        });
      }
    }
    for (const [num, info] of Object.entries(MAJOR_ARCANA_ELEMENTS)) {
      if (info.element === complement && cards.length < 5) {
        cards.push({
          number: parseInt(num), suit: 'MAJOR',
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

  // 타로 카드 간 관계 시드 (SAME_ELEMENT / GENERATES_ENERGY / DEPLETES_ENERGY / FOLLOWS)
  async seedCardRelationships(): Promise<void> {
    const session = this.getSession();
    if (!session) {
      console.log('[Neo4j] Skipping card relationship seed - not connected');
      return;
    }

    try {
      // 1. SAME_ELEMENT: 동일 오행 카드 간 연결
      await session.run(`
        MATCH (t1:TarotCard)-[:RESONATES_WITH]->(e:Element)<-[:RESONATES_WITH]-(t2:TarotCard)
        WHERE id(t1) < id(t2)
        MERGE (t1)-[:SAME_ELEMENT {element: e.name}]->(t2)
        MERGE (t2)-[:SAME_ELEMENT {element: e.name}]->(t1)
      `);

      // 2. GENERATES_ENERGY: 상생 관계 카드 (A 오행 → B 오행 생성)
      await session.run(`
        MATCH (t1:TarotCard)-[:RESONATES_WITH]->(e1:Element)-[:GENERATES]->(e2:Element)<-[:RESONATES_WITH]-(t2:TarotCard)
        WHERE t1.suit <> t2.suit OR t1.number <> t2.number
        MERGE (t1)-[:GENERATES_ENERGY {from: e1.name, to: e2.name}]->(t2)
      `);

      // 3. DEPLETES_ENERGY: 상극 관계 카드 (A 오행 → B 오행 극)
      await session.run(`
        MATCH (t1:TarotCard)-[:RESONATES_WITH]->(e1:Element)-[:DESTROYS]->(e2:Element)<-[:RESONATES_WITH]-(t2:TarotCard)
        WHERE t1.suit <> t2.suit OR t1.number <> t2.number
        MERGE (t1)-[:DEPLETES_ENERGY {from: e1.name, to: e2.name}]->(t2)
      `);

      // 4. FOLLOWS: 메이저 아르카나 순서 관계 (0→1→…→21)
      for (let n = 0; n < 21; n++) {
        await session.run(`
          MATCH (t1:TarotCard {number: $n1, suit: 'MAJOR'})
          MATCH (t2:TarotCard {number: $n2, suit: 'MAJOR'})
          MERGE (t1)-[:FOLLOWS]->(t2)
        `, { n1: n, n2: n + 1 });
      }

      console.log('[Neo4j] Card-to-card relationships seeded (SAME_ELEMENT/GENERATES_ENERGY/DEPLETES_ENERGY/FOLLOWS)');
    } catch (error: any) {
      console.error('[Neo4j] Card relationship seed error:', error.message);
    } finally {
      await session.close();
    }
  }

  // 뽑힌 타로 카드 집합에 대한 그래프 분석
  async analyzeReadingByGraph(
    cards: Array<{ number: number; suit: string }>
  ): Promise<{
    elementDistribution: Record<FiveElement, number>;
    missingElements: FiveElement[];
    cardRelationships: Array<{
      from: { number: number; suit: string };
      to: { number: number; suit: string };
      type: string;
      detail: string;
    }>;
    majorArcanaPath: Array<{ number: number }>;
    energyDynamics: { generating: number; depleting: number; balanced: boolean };
    insights: string[];
  }> {
    const elementDist: Record<FiveElement, number> = { WOOD: 0, FIRE: 0, EARTH: 0, METAL: 0, WATER: 0 };

    // 로컬 오행 계산
    for (const card of cards) {
      let el: FiveElement | null = null;
      if (card.suit === 'MAJOR') {
        el = MAJOR_ARCANA_ELEMENTS[card.number]?.element ?? null;
      } else {
        const map: Record<string, FiveElement> = {
          'WANDS': 'FIRE', 'CUPS': 'WATER', 'SWORDS': 'METAL', 'PENTACLES': 'EARTH'
        };
        el = map[card.suit] ?? null;
      }
      if (el) elementDist[el]++;
    }

    const allElements: FiveElement[] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
    const missingElements = allElements.filter(el => elementDist[el] === 0);

    const cardRelationships: Array<{
      from: { number: number; suit: string };
      to: { number: number; suit: string };
      type: string;
      detail: string;
    }> = [];
    let generatingCount = 0;
    let depletingCount = 0;

    const session = this.getSession();
    if (session && cards.length >= 2) {
      try {
        // 카드 쌍 관계 쿼리
        const cardParams = cards.map((c, i) => ({ num: c.number, suit: c.suit, idx: i }));

        for (let i = 0; i < cards.length; i++) {
          for (let j = i + 1; j < cards.length; j++) {
            const c1 = cards[i];
            const c2 = cards[j];

            const relQuery = await session.run(`
              MATCH (t1:TarotCard {number: $n1, suit: $s1})
              MATCH (t2:TarotCard {number: $n2, suit: $s2})
              MATCH (t1)-[r]->(t2)
              WHERE type(r) IN ['SAME_ELEMENT','GENERATES_ENERGY','DEPLETES_ENERGY','FOLLOWS']
              RETURN type(r) AS relType, r.from AS fromEl, r.to AS toEl, r.element AS sameEl
            `, { n1: c1.number, s1: c1.suit, n2: c2.number, s2: c2.suit });

            for (const rec of relQuery.records) {
              const relType = rec.get('relType') as string;
              let detail = '';

              if (relType === 'SAME_ELEMENT') {
                const el = rec.get('sameEl') as string;
                detail = `동일 ${this.getElementKorean(el as FiveElement)} 오행 — 에너지 강화`;
              } else if (relType === 'GENERATES_ENERGY') {
                const fromEl = rec.get('fromEl') as string;
                const toEl = rec.get('toEl') as string;
                detail = `${this.getElementKorean(fromEl as FiveElement)}이 ${this.getElementKorean(toEl as FiveElement)}을 생성 (상생)`;
                generatingCount++;
              } else if (relType === 'DEPLETES_ENERGY') {
                const fromEl = rec.get('fromEl') as string;
                const toEl = rec.get('toEl') as string;
                detail = `${this.getElementKorean(fromEl as FiveElement)}이 ${this.getElementKorean(toEl as FiveElement)}을 제어 (상극)`;
                depletingCount++;
              } else if (relType === 'FOLLOWS') {
                detail = `메이저 아르카나 여정에서 연속된 카드 (${c1.number}→${c2.number})`;
              }

              if (detail) {
                cardRelationships.push({ from: c1, to: c2, type: relType, detail });
              }
            }
          }
        }

        // 메이저 아르카나 연속 경로 탐색
        const majorCards = cards
          .filter(c => c.suit === 'MAJOR')
          .sort((a, b) => a.number - b.number);
        const majorArcanaPath = majorCards;

      } catch (error: any) {
        console.error('[Neo4j] Reading graph analysis error:', error.message);
      } finally {
        await session.close();
      }
    }

    const insights: string[] = [];
    const total = Object.values(elementDist).reduce((a, b) => a + b, 0);

    if (missingElements.length > 0) {
      insights.push(`이번 리딩에서 ${missingElements.map(e => this.getElementKorean(e)).join(', ')} 오행이 없습니다. 해당 영역에 주의가 필요합니다.`);
    }

    const dominant = Object.entries(elementDist).sort((a, b) => b[1] - a[1])[0];
    if (dominant[1] >= 2) {
      insights.push(`${this.getElementKorean(dominant[0] as FiveElement)} 에너지가 ${dominant[1]}개 카드에 나타납니다. 이 주제가 리딩의 핵심입니다.`);
    }

    if (generatingCount > depletingCount) {
      insights.push(`상생 관계(${generatingCount}개)가 상극(${depletingCount}개)보다 많아 긍정적 흐름이 우세합니다.`);
    } else if (depletingCount > generatingCount) {
      insights.push(`상극 관계(${depletingCount}개)가 많아 내면의 긴장과 변화 압력이 있습니다.`);
    }

    const majorCards = cards.filter(c => c.suit === 'MAJOR');
    if (majorCards.length >= 2) {
      insights.push(`메이저 아르카나 ${majorCards.length}장 — 중요한 운명적 흐름이 진행 중입니다.`);
    }

    return {
      elementDistribution: elementDist,
      missingElements,
      cardRelationships,
      majorArcanaPath: cards.filter(c => c.suit === 'MAJOR').sort((a, b) => a.number - b.number),
      energyDynamics: {
        generating: generatingCount,
        depleting: depletingCount,
        balanced: Math.abs(generatingCount - depletingCount) <= 1
      },
      insights
    };
  }

  isReady(): boolean { return this.isConnected; }
}

export const neo4jService = new Neo4jService();

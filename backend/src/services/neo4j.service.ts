import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../config/env';

// ─── 원소 매핑 ────────────────────────────────────────────────────────────────
const SUIT_TO_ELEMENT: Record<string, string> = {
  WANDS: 'FIRE',
  CUPS: 'WATER',
  SWORDS: 'AIR',
  PENTACLES: 'EARTH',
  MAJOR: 'SPIRIT'
};

const MAJOR_ELEMENTS: Record<number, string> = {
  0: 'SPIRIT',  1: 'FIRE',   2: 'WATER',  3: 'EARTH',  4: 'FIRE',
  5: 'EARTH',   6: 'AIR',    7: 'FIRE',   8: 'FIRE',   9: 'EARTH',
  10: 'SPIRIT', 11: 'AIR',   12: 'WATER', 13: 'WATER', 14: 'EARTH',
  15: 'FIRE',   16: 'FIRE',  17: 'WATER', 18: 'WATER', 19: 'FIRE',
  20: 'AIR',    21: 'EARTH'
};

const ELEMENT_LABEL_KO: Record<string, string> = {
  FIRE: '불(의지/열정)',
  WATER: '물(직관/감정)',
  AIR: '공기(지성/소통)',
  EARTH: '흙(물질/안정)',
  SPIRIT: '정신(초월/영혼)'
};

// ─── 원형 쌍 (10쌍, 양방향) ───────────────────────────────────────────────────
const ARCHETYPAL_PAIRS: [string, string, string][] = [
  ['The High Priestess', 'The Moon',           '무의식/신비'],
  ['The Magician',       'The World',           '시작/완성'],
  ['The Empress',        'The Emperor',         '음양균형'],
  ['The Lovers',         'The Devil',           '선택/집착'],
  ['The Tower',          'The Star',            '파괴/희망'],
  ['The Sun',            'The Moon',            '의식/무의식'],
  ['Judgement',          'The High Priestess',  '내면의 부름'],
  ['Death',              'Wheel of Fortune',    '변화/순환'],
  ['The Hermit',         'The Fool',            '탐구여정'],
  ['Strength',           'The Chariot',         '내면/외면의 힘'],
];

// ─── 인터페이스 ───────────────────────────────────────────────────────────────
export interface GraphContext {
  sharedElements: string[];
  numerologicalLinks: string[];
  archetypeLinks: string[];
  dominantElement: string | null;
  narrativeHint: string;
}

export interface CardRelationships {
  cardId: number;
  nameKo: string;
  nameEn: string;
  element: string;
  sharedElement: Array<{ cardId: number; nameKo: string; nameEn: string }>;
  numerological: Array<{ cardId: number; nameKo: string; nameEn: string; number: number }>;
  archetypal: Array<{ cardId: number; nameKo: string; nameEn: string; theme: string }>;
}

export interface UserPatterns {
  topCards: Array<{ cardId: number; nameKo: string; nameEn: string; count: number }>;
  elementDistribution: Record<string, number>;
  totalReadings: number;
}

export interface GraphStatus {
  connected: boolean;
  nodeCount: number;
  relationshipCount: number;
}

interface SyncParams {
  userId: string;
  readingId: string;
  spreadName: string;
  question?: string;
  cards: Array<{ cardId: number; position: number; isReversed: boolean }>;
}

// ─── 서비스 클래스 ─────────────────────────────────────────────────────────────
class Neo4jGraphService {
  private driver: Driver | null = null;
  private initialized = false;
  private nameEnToCardId = new Map<string, number>();

  async connect(): Promise<boolean> {
    if (!config.NEO4J_PASSWORD) {
      console.log('[Neo4j] 비밀번호 미설정 — 그래프 기능 비활성화');
      return false;
    }
    try {
      this.driver = neo4j.driver(
        config.NEO4J_URI,
        neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD),
        { connectionTimeout: 5000 }
      );
      await this.driver.verifyConnectivity();
      console.log('[Neo4j] 연결 성공:', config.NEO4J_URI);
      return true;
    } catch (e: any) {
      console.log('[Neo4j] 연결 실패 (무시):', e.message);
      this.driver = null;
      return false;
    }
  }

  async initializeSchema(): Promise<void> {
    const session = this.getSession();
    if (!session) return;
    try {
      await session.run('CREATE CONSTRAINT tarot_card_id IF NOT EXISTS FOR (c:TarotCard) REQUIRE c.cardId IS UNIQUE');
      await session.run('CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE');
      await session.run('CREATE CONSTRAINT reading_id IF NOT EXISTS FOR (r:Reading) REQUIRE r.readingId IS UNIQUE');
    } catch (e: any) {
      console.warn('[Neo4j] 스키마 초기화 경고:', e.message);
    } finally {
      await session.close();
    }
  }

  async seedTarotGraph(cards: Array<{
    id: number; nameKo: string; nameEn: string;
    type: string; suit: string | null; number: number;
  }>): Promise<void> {
    const session = this.getSession();
    if (!session) return;
    try {
      // 1. 78개 카드 노드 MERGE (멱등)
      for (const card of cards) {
        const element = card.type === 'MAJOR'
          ? (MAJOR_ELEMENTS[card.number] ?? 'SPIRIT')
          : (SUIT_TO_ELEMENT[card.suit ?? ''] ?? 'SPIRIT');

        await session.run(
          `MERGE (c:TarotCard { cardId: $id })
           SET c.nameKo = $nameKo, c.nameEn = $nameEn,
               c.type = $type, c.suit = $suit,
               c.number = $number, c.element = $element`,
          { id: card.id, nameKo: card.nameKo, nameEn: card.nameEn,
            type: card.type, suit: card.suit ?? '', number: card.number, element }
        );
        this.nameEnToCardId.set(card.nameEn, card.id);
      }
      console.log('[Neo4j] 78개 카드 노드 MERGE 완료');

      // 2. SHARES_ELEMENT 관계
      await session.run(`
        MATCH (a:TarotCard), (b:TarotCard)
        WHERE a.cardId < b.cardId AND a.element = b.element
        MERGE (a)-[:SHARES_ELEMENT]-(b)
      `);

      // 3. NUMEROLOGICAL_LINK 관계 (숫자 1-10)
      await session.run(`
        MATCH (a:TarotCard), (b:TarotCard)
        WHERE a.cardId < b.cardId
          AND a.number = b.number AND a.number >= 1 AND a.number <= 10
          AND a.type <> b.type
        MERGE (a)-[r:NUMEROLOGICAL_LINK]-(b)
        SET r.number = a.number
      `);

      // 4. FOOLS_JOURNEY (메이저 0→21 체인)
      await session.run(`
        MATCH (a:TarotCard { type: 'MAJOR' }), (b:TarotCard { type: 'MAJOR' })
        WHERE b.number = a.number + 1
        MERGE (a)-[:FOOLS_JOURNEY]->(b)
      `);

      // 5. SUIT_SEQUENCE (슈트 내 에이스→킹)
      await session.run(`
        MATCH (a:TarotCard), (b:TarotCard)
        WHERE a.suit = b.suit AND a.suit <> '' AND a.suit <> 'MAJOR'
          AND b.number = a.number + 1
        MERGE (a)-[:SUIT_SEQUENCE]->(b)
      `);

      // 6. ARCHETYPAL_PAIR
      for (const [nameA, nameB, theme] of ARCHETYPAL_PAIRS) {
        await session.run(
          `MATCH (a:TarotCard { nameEn: $nameA }), (b:TarotCard { nameEn: $nameB })
           MERGE (a)-[r:ARCHETYPAL_PAIR]-(b)
           SET r.theme = $theme`,
          { nameA, nameB, theme }
        );
      }

      console.log('[Neo4j] 5종 관계 시딩 완료');
      this.initialized = true;
    } catch (e: any) {
      console.error('[Neo4j] 시딩 오류:', e.message);
    } finally {
      await session.close();
    }
  }

  isReady(): boolean {
    return this.driver !== null && this.initialized;
  }

  /** nameEn → cardId 변환 (빠른 Map 조회) */
  resolveCardIds(cards: Array<{ nameEn: string }>): number[] {
    return cards
      .map(c => this.nameEnToCardId.get(c.nameEn))
      .filter((id): id is number => id !== undefined);
  }

  /** AI 프롬프트용 그래프 컨텍스트 수집 */
  async buildGraphContext(cardIds: number[]): Promise<GraphContext | null> {
    const session = this.getSession();
    if (!session || cardIds.length < 2) return null;

    try {
      // 원소 분포 조회
      const elemRes = await session.run(
        `MATCH (c:TarotCard) WHERE c.cardId IN $ids
         RETURN c.element AS element, count(c) AS cnt`,
        { ids: cardIds }
      );
      const elemCount: Record<string, number> = {};
      for (const rec of elemRes.records) {
        elemCount[rec.get('element')] = rec.get('cnt').toNumber();
      }
      const dominantElement = Object.entries(elemCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      // 카드 간 관계 조회
      const relRes = await session.run(
        `MATCH (a:TarotCard) WHERE a.cardId IN $ids
         MATCH (b:TarotCard) WHERE b.cardId IN $ids AND a.cardId < b.cardId
         OPTIONAL MATCH (a)-[rel:SHARES_ELEMENT|NUMEROLOGICAL_LINK|ARCHETYPAL_PAIR]-(b)
         WHERE rel IS NOT NULL
         RETURN a.nameKo AS nameA, b.nameKo AS nameB,
                type(rel) AS relType, rel.theme AS theme, rel.number AS num`,
        { ids: cardIds }
      );

      const sharedElements: string[] = [];
      const numerologicalLinks: string[] = [];
      const archetypeLinks: string[] = [];

      for (const rec of relRes.records) {
        const nameA = rec.get('nameA') as string;
        const nameB = rec.get('nameB') as string;
        const relType = rec.get('relType') as string | null;
        if (!relType) continue;

        if (relType === 'SHARES_ELEMENT') {
          sharedElements.push(`${nameA}과(와) ${nameB}은(는) 같은 원소 에너지를 공유합니다`);
        } else if (relType === 'NUMEROLOGICAL_LINK') {
          const num = rec.get('num');
          numerologicalLinks.push(`${nameA}과(와) ${nameB}은(는) 숫자 ${num}으로 수비학적으로 연결됩니다`);
        } else if (relType === 'ARCHETYPAL_PAIR') {
          const theme = rec.get('theme') as string;
          archetypeLinks.push(`${nameA}과(와) ${nameB}은(는) 원형 쌍입니다 (테마: ${theme})`);
        }
      }

      let narrativeHint = '';
      if (dominantElement) {
        const elemLabel = ELEMENT_LABEL_KO[dominantElement] ?? dominantElement;
        narrativeHint = `이 스프레드는 ${elemLabel} 에너지가 지배적입니다`;
      }

      return { sharedElements, numerologicalLinks, archetypeLinks, dominantElement, narrativeHint };
    } catch (e: any) {
      console.error('[Neo4j] buildGraphContext 오류:', e.message);
      return null;
    } finally {
      await session.close();
    }
  }

  /** 특정 카드의 관계 조회 (API용) */
  async getCardRelationships(cardId: number): Promise<CardRelationships | null> {
    const session = this.getSession();
    if (!session) return null;
    try {
      const cardRes = await session.run(
        'MATCH (c:TarotCard { cardId: $id }) RETURN c',
        { id: cardId }
      );
      if (cardRes.records.length === 0) return null;
      const c = cardRes.records[0].get('c').properties;

      const sharedRes = await session.run(
        `MATCH (a:TarotCard { cardId: $id })-[:SHARES_ELEMENT]-(b:TarotCard)
         RETURN b.cardId AS cardId, b.nameKo AS nameKo, b.nameEn AS nameEn`,
        { id: cardId }
      );
      const numRes = await session.run(
        `MATCH (a:TarotCard { cardId: $id })-[r:NUMEROLOGICAL_LINK]-(b:TarotCard)
         RETURN b.cardId AS cardId, b.nameKo AS nameKo, b.nameEn AS nameEn, r.number AS number`,
        { id: cardId }
      );
      const archRes = await session.run(
        `MATCH (a:TarotCard { cardId: $id })-[r:ARCHETYPAL_PAIR]-(b:TarotCard)
         RETURN b.cardId AS cardId, b.nameKo AS nameKo, b.nameEn AS nameEn, r.theme AS theme`,
        { id: cardId }
      );

      return {
        cardId,
        nameKo: c.nameKo,
        nameEn: c.nameEn,
        element: c.element,
        sharedElement: sharedRes.records.map(r => ({
          cardId: r.get('cardId').toNumber(),
          nameKo: r.get('nameKo'),
          nameEn: r.get('nameEn')
        })),
        numerological: numRes.records.map(r => ({
          cardId: r.get('cardId').toNumber(),
          nameKo: r.get('nameKo'),
          nameEn: r.get('nameEn'),
          number: r.get('number').toNumber()
        })),
        archetypal: archRes.records.map(r => ({
          cardId: r.get('cardId').toNumber(),
          nameKo: r.get('nameKo'),
          nameEn: r.get('nameEn'),
          theme: r.get('theme')
        }))
      };
    } catch (e: any) {
      console.error('[Neo4j] getCardRelationships 오류:', e.message);
      return null;
    } finally {
      await session.close();
    }
  }

  /** 사용자 리딩 이력 저장 (fire-and-forget) */
  async syncReadingToGraph(params: SyncParams): Promise<void> {
    const session = this.getSession();
    if (!session) return;
    try {
      // User 노드 MERGE
      await session.run(
        'MERGE (u:User { userId: $userId })',
        { userId: params.userId }
      );
      // Reading 노드 MERGE
      await session.run(
        `MERGE (r:Reading { readingId: $readingId })
         SET r.spreadName = $spreadName, r.question = $question, r.createdAt = datetime()`,
        { readingId: params.readingId, spreadName: params.spreadName, question: params.question ?? '' }
      );
      // User → Reading 관계
      await session.run(
        `MATCH (u:User { userId: $userId }), (r:Reading { readingId: $readingId })
         MERGE (u)-[:PERFORMED]->(r)`,
        { userId: params.userId, readingId: params.readingId }
      );
      // Reading → TarotCard 관계
      for (const card of params.cards) {
        await session.run(
          `MATCH (r:Reading { readingId: $readingId }), (c:TarotCard { cardId: $cardId })
           MERGE (r)-[rel:DREW { position: $position }]->(c)
           SET rel.isReversed = $isReversed`,
          { readingId: params.readingId, cardId: card.cardId, position: card.position, isReversed: card.isReversed }
        );
      }
    } catch (e: any) {
      console.error('[Neo4j] syncReadingToGraph 오류:', e.message);
    } finally {
      await session.close();
    }
  }

  /** 사용자 패턴 분석 */
  async getUserPatterns(userId: string): Promise<UserPatterns | null> {
    const session = this.getSession();
    if (!session) return null;
    try {
      const cardRes = await session.run(
        `MATCH (u:User { userId: $userId })-[:PERFORMED]->(r:Reading)-[:DREW]->(c:TarotCard)
         RETURN c.cardId AS cardId, c.nameKo AS nameKo, c.nameEn AS nameEn, count(*) AS cnt
         ORDER BY cnt DESC LIMIT 5`,
        { userId }
      );
      const elemRes = await session.run(
        `MATCH (u:User { userId: $userId })-[:PERFORMED]->(r:Reading)-[:DREW]->(c:TarotCard)
         RETURN c.element AS element, count(*) AS cnt`,
        { userId }
      );
      const readingRes = await session.run(
        `MATCH (u:User { userId: $userId })-[:PERFORMED]->(r:Reading)
         RETURN count(r) AS total`,
        { userId }
      );

      const elementDistribution: Record<string, number> = {};
      for (const rec of elemRes.records) {
        elementDistribution[rec.get('element')] = rec.get('cnt').toNumber();
      }

      return {
        topCards: cardRes.records.map(r => ({
          cardId: r.get('cardId').toNumber(),
          nameKo: r.get('nameKo'),
          nameEn: r.get('nameEn'),
          count: r.get('cnt').toNumber()
        })),
        elementDistribution,
        totalReadings: readingRes.records[0]?.get('total').toNumber() ?? 0
      };
    } catch (e: any) {
      console.error('[Neo4j] getUserPatterns 오류:', e.message);
      return null;
    } finally {
      await session.close();
    }
  }

  /** 상태 조회 */
  async getStatus(): Promise<GraphStatus> {
    if (!this.driver) return { connected: false, nodeCount: 0, relationshipCount: 0 };
    const session = this.getSession();
    if (!session) return { connected: false, nodeCount: 0, relationshipCount: 0 };
    try {
      const nodeRes = await session.run('MATCH (n:TarotCard) RETURN count(n) AS cnt');
      const relRes = await session.run('MATCH ()-[r]->() RETURN count(r) AS cnt');
      return {
        connected: true,
        nodeCount: nodeRes.records[0]?.get('cnt').toNumber() ?? 0,
        relationshipCount: relRes.records[0]?.get('cnt').toNumber() ?? 0
      };
    } catch {
      return { connected: false, nodeCount: 0, relationshipCount: 0 };
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.initialized = false;
    }
  }

  private getSession(): Session | null {
    if (!this.driver) return null;
    try {
      return this.driver.session();
    } catch {
      return null;
    }
  }
}

export const neo4jGraphService = new Neo4jGraphService();

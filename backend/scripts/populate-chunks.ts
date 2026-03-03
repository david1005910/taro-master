import prisma from '../src/utils/prisma';

/**
 * 기존 카드 데이터를 category-based chunks 구조로 변환
 *
 * chunks 형식:
 * [
 *   { category: "general", upright: "...", reversed: "..." },
 *   { category: "love", upright: "...", reversed: "..." },
 *   { category: "career", upright: "...", reversed: "..." },
 *   { category: "health", upright: "...", reversed: "..." },
 *   { category: "finance", upright: "...", reversed: "..." }
 * ]
 */

interface CardChunk {
  category: string;
  upright: string;
  reversed: string;
}

async function populateChunks() {
  console.log('🔄 카드 chunks 데이터 생성 중...\n');

  const cards = await prisma.card.findMany();
  console.log(`📦 총 ${cards.length}개 카드 발견`);

  let updated = 0;

  for (const card of cards) {
    const chunks: CardChunk[] = [
      {
        category: 'general',
        upright: card.uprightMeaning,
        reversed: card.reversedMeaning
      },
      {
        category: 'symbolism',
        upright: card.symbolism,
        reversed: '' // 상징은 방향 구분 없음
      },
      {
        category: 'love',
        upright: card.love,
        reversed: '' // 영역별 의미는 기본적으로 정방향 기준
      },
      {
        category: 'career',
        upright: card.career,
        reversed: ''
      },
      {
        category: 'health',
        upright: card.health,
        reversed: ''
      },
      {
        category: 'finance',
        upright: card.finance,
        reversed: ''
      }
    ];

    await prisma.card.update({
      where: { id: card.id },
      data: { chunks: JSON.stringify(chunks) }
    });

    updated++;
    if (updated % 10 === 0) {
      console.log(`   ✅ ${updated}/${cards.length} 업데이트됨`);
    }
  }

  console.log(`\n✅ 완료! ${updated}개 카드의 chunks 필드 생성됨\n`);

  // 샘플 출력
  const sampleCard = await prisma.card.findFirst({
    where: { nameEn: 'The Magician' }
  });

  if (sampleCard?.chunks) {
    console.log('📄 샘플 - 마법사 카드 chunks 구조:');
    const parsedChunks = JSON.parse(sampleCard.chunks);
    console.log(JSON.stringify(parsedChunks, null, 2).split('\n').slice(0, 20).join('\n'));
    console.log('   ...\n');
  }

  await prisma.$disconnect();
}

populateChunks()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  });

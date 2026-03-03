#!/usr/bin/env python3
"""타로 리딩 전체 플로우 테스트"""
import requests
import json
import random

BASE_URL = "http://localhost:4000"

def test_tarot_reading():
    print("=" * 60)
    print("타로 리딩 테스트 시작")
    print("=" * 60)

    # 1. 회원가입
    print("\n[1] 회원가입...")
    email = f"test{random.randint(1000,9999)}@example.com"
    register_data = {
        "email": email,
        "password": "Test1234#",
        "name": "타로테스터"
    }

    resp = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    print(f"Status: {resp.status_code}")
    result = resp.json()

    if not result.get("success"):
        print(f"❌ 회원가입 실패: {result.get('error')}")
        # 이미 있는 계정으로 로그인 시도
        print("\n[1-1] 기존 계정으로 로그인 시도...")
        login_data = {"email": "test@test.com", "password": "Test1234#"}
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        result = resp.json()
        if not result.get("success"):
            print(f"❌ 로그인도 실패: {result.get('error')}")
            return

    token = result["data"]["accessToken"]
    user = result["data"]["user"]
    print(f"✅ 사용자: {user['name']} ({user['email']})")
    print(f"토큰: {token[:30]}...")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. 스프레드 조회
    print("\n[2] 스프레드 조회...")
    resp = requests.get(f"{BASE_URL}/api/spreads")
    spreads = resp.json()["data"]["spreads"]
    three_card = next((s for s in spreads if s["cardCount"] == 3), spreads[0])
    print(f"✅ 선택된 스프레드: {three_card['name']} (카드 {three_card['cardCount']}장)")

    # 3. 카드 전체 조회
    print("\n[3] 카드 전체 조회...")
    resp = requests.get(f"{BASE_URL}/api/cards")
    all_cards = resp.json()["data"]["cards"]
    print(f"✅ 총 {len(all_cards)}장의 카드")

    # 4. 랜덤으로 3장 선택
    print("\n[4] 카드 3장 랜덤 선택...")
    selected_cards = random.sample(all_cards, 3)
    positions = ["과거", "현재", "미래"]

    for i, card in enumerate(selected_cards):
        is_reversed = random.choice([True, False])
        direction = "역방향" if is_reversed else "정방향"
        print(f"  {positions[i]}: {card['nameKo']} ({card['nameEn']}) - {direction}")

    # 5. 타로 리딩 생성 (AI 해석 포함)
    print("\n[5] AI 타로 리딩 생성...")
    question = "올해 나의 연애운은 어떻게 될까요?"

    reading_data = {
        "spreadId": three_card["id"],
        "question": question,
        "interpretMode": "AI",  # AI 해석 모드
        "cards": [
            {
                "cardId": selected_cards[0]["id"],
                "position": positions[0],
                "isReversed": random.choice([True, False])
            },
            {
                "cardId": selected_cards[1]["id"],
                "position": positions[1],
                "isReversed": random.choice([True, False])
            },
            {
                "cardId": selected_cards[2]["id"],
                "position": positions[2],
                "isReversed": random.choice([True, False])
            }
        ]
    }

    print(f"질문: {question}")
    print("AI 해석 요청 중... (Qdrant RAG + Neo4j Graph + Claude)")

    resp = requests.post(
        f"{BASE_URL}/api/readings",
        json=reading_data,
        headers=headers
    )

    result = resp.json()

    if not result.get("success"):
        print(f"❌ 리딩 생성 실패: {result.get('error')}")
        return

    reading = result["data"]["reading"]

    print("\n" + "=" * 60)
    print("✅ 타로 리딩 결과")
    print("=" * 60)
    print(f"리딩 ID: {reading['id']}")
    print(f"스프레드: {reading['spreadName']}")
    print(f"질문: {reading['question']}")
    print(f"\n{'─' * 60}")
    print("뽑힌 카드:")
    print(f"{'─' * 60}")

    for card_data in reading["cards"]:
        direction = "역방향" if card_data["isReversed"] else "정방향"
        print(f"\n[{card_data['position']}] {card_data['card']['nameKo']} ({direction})")
        print(f"  키워드: {', '.join(card_data['card']['keywords'][:3])}")

    print(f"\n{'─' * 60}")
    print("AI 해석:")
    print(f"{'─' * 60}")

    if reading.get("interpretation"):
        interp = reading["interpretation"]

        # 전체 해석
        if interp.get("overallMessage"):
            print(f"\n📖 전체 메시지:\n{interp['overallMessage']}\n")

        # 카드별 해석
        if interp.get("cardInterpretations"):
            print(f"{'─' * 60}")
            print("카드별 상세 해석:")
            print(f"{'─' * 60}")
            for card_interp in interp["cardInterpretations"]:
                print(f"\n🔮 {card_interp['cardName']} ({card_interp['position']})")
                print(f"{card_interp['meaning']}\n")

        # 조언
        if interp.get("advice"):
            print(f"{'─' * 60}")
            print(f"💡 조언:\n{interp['advice']}")

        # 요약
        if interp.get("summary"):
            print(f"\n{'─' * 60}")
            print(f"✨ 한 줄 요약:\n{interp['summary']}")

    print("\n" + "=" * 60)
    print("✅ 테스트 완료!")
    print("=" * 60)

    # 6. 브라우저 확인 안내
    print(f"\n🌐 브라우저에서 확인:")
    print(f"   http://localhost:5174/reading/{reading['id']}")
    print(f"\n📊 Neo4j 그래프 상태:")
    resp = requests.get(f"{BASE_URL}/api/graph/status")
    if resp.json().get("success"):
        status = resp.json()["data"]
        print(f"   노드: {status['nodeCount']}개, 관계: {status['relationshipCount']}개")

if __name__ == "__main__":
    try:
        test_tarot_reading()
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

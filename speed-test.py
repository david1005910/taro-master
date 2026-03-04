#!/usr/bin/env python3
"""AI 타로 리딩 속도 테스트"""
import requests
import time
import json

BASE_URL = "http://localhost:4000"

def speed_test():
    print("=" * 70)
    print("⚡ AI 타로 리딩 속도 테스트")
    print("=" * 70)

    # 1. 로그인 (기존 계정 사용)
    print("\n[1] 로그인...")
    login_resp = requests.post(f"{BASE_URL}/api/auth/refresh", json={
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDJiOWM4OS02YjBjLTRjNzQtOGE5Mi1iNDAxZGYyNDg2ZjUiLCJpYXQiOjE3MzMzNDc3NjcsImV4cCI6MTczMzk1MjU2N30.mYe4yV3pMYtZaUTKQsJlOCvFl-y5SfhzE7EyYZjjNBA"
    })

    if not login_resp.json().get("success"):
        print("❌ 로그인 실패 - 브라우저에서 로그인 후 토큰 복사 필요")
        print("   프론트엔드(http://localhost:5174)에서 직접 테스트하세요")
        return

    token = login_resp.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ 로그인 성공")

    # 2. 카드 조회
    print("\n[2] 카드 조회...")
    cards_resp = requests.get(f"{BASE_URL}/api/cards?limit=78")
    all_cards = cards_resp.json()["data"]["cards"]
    print(f"✅ {len(all_cards)}개 카드 로드")

    # 3. 테스트 케이스 준비
    test_cases = [
        {
            "name": "3장 리딩 (쓰리카드)",
            "spreadId": 8,
            "cards": [
                {"cardId": all_cards[0]["id"], "position": "과거", "isReversed": False},
                {"cardId": all_cards[1]["id"], "position": "현재", "isReversed": True},
                {"cardId": all_cards[2]["id"], "position": "미래", "isReversed": False}
            ]
        },
        {
            "name": "6장 리딩 (진로 스프레드)",
            "spreadId": 11,
            "cards": [
                {"cardId": all_cards[i]["id"], "position": f"포지션{i+1}", "isReversed": i % 2 == 0}
                for i in range(6)
            ]
        }
    ]

    results = []

    for test in test_cases:
        print(f"\n{'─' * 70}")
        print(f"[테스트] {test['name']}")
        print(f"{'─' * 70}")

        request_data = {
            "spreadId": test["spreadId"],
            "question": "속도 테스트: 올해 나의 운은 어떻게 될까요?",
            "interpretMode": "AI",
            "cards": test["cards"]
        }

        print(f"질문: {request_data['question']}")
        print(f"카드 수: {len(test['cards'])}장")
        print("\n⏱️  AI 해석 요청 중...")

        start_time = time.time()

        try:
            reading_resp = requests.post(
                f"{BASE_URL}/api/readings",
                json=request_data,
                headers=headers,
                timeout=120  # 2분 타임아웃
            )

            end_time = time.time()
            elapsed = end_time - start_time

            if reading_resp.status_code == 201:
                result = reading_resp.json()["data"]["reading"]

                print(f"\n✅ 완료!")
                print(f"⏱️  소요 시간: {elapsed:.1f}초")

                # 해석 결과 요약
                if result.get("interpretation"):
                    interp = result["interpretation"]
                    print(f"\n📝 해석 요약:")
                    if interp.get("summary"):
                        print(f"   {interp['summary'][:100]}...")
                    if interp.get("overallMessage"):
                        print(f"\n   전체 메시지: {interp['overallMessage'][:150]}...")

                results.append({
                    "test": test["name"],
                    "cards": len(test["cards"]),
                    "time": elapsed,
                    "status": "성공"
                })
            else:
                print(f"❌ 실패: {reading_resp.status_code}")
                print(f"   {reading_resp.text[:200]}")
                results.append({
                    "test": test["name"],
                    "cards": len(test["cards"]),
                    "time": elapsed,
                    "status": "실패"
                })

        except requests.Timeout:
            print("❌ 타임아웃 (120초 초과)")
            results.append({
                "test": test["name"],
                "cards": len(test["cards"]),
                "time": 120,
                "status": "타임아웃"
            })
        except Exception as e:
            print(f"❌ 오류: {e}")
            results.append({
                "test": test["name"],
                "cards": len(test["cards"]),
                "time": 0,
                "status": f"오류: {e}"
            })

    # 4. 결과 요약
    print("\n" + "=" * 70)
    print("📊 속도 테스트 결과 요약")
    print("=" * 70)

    for r in results:
        status_icon = "✅" if r["status"] == "성공" else "❌"
        print(f"{status_icon} {r['test']}")
        print(f"   카드: {r['cards']}장")
        print(f"   시간: {r['time']:.1f}초")
        print(f"   상태: {r['status']}")
        print()

    # 5. 최적화 비교
    print("=" * 70)
    print("⚡ 최적화 효과 분석")
    print("=" * 70)

    success_results = [r for r in results if r["status"] == "성공"]
    if success_results:
        three_card = next((r for r in success_results if r["cards"] == 3), None)
        six_card = next((r for r in success_results if r["cards"] == 6), None)

        print("\n예상 vs 실제:")
        print("─" * 70)

        if three_card:
            expected_3 = 35 * (3/6)  # 6장 기준 비례 계산
            actual_3 = three_card["time"]
            improvement_3 = ((expected_3 - actual_3) / expected_3) * 100
            print(f"3장 리딩:")
            print(f"  이전 예상: ~{expected_3:.1f}초")
            print(f"  현재 실제: {actual_3:.1f}초")
            print(f"  개선율: {improvement_3:.0f}% 빠름 🚀")

        if six_card:
            expected_6 = 35
            actual_6 = six_card["time"]
            improvement_6 = ((expected_6 - actual_6) / expected_6) * 100
            print(f"\n6장 리딩:")
            print(f"  이전: {expected_6}초")
            print(f"  현재: {actual_6:.1f}초")
            print(f"  개선율: {improvement_6:.0f}% 빠름 🚀")

            if actual_6 < 15:
                print(f"\n🎉 목표 달성! (목표: 15초 이하)")
            elif actual_6 < 20:
                print(f"\n✅ 우수! (목표에 근접)")
            elif actual_6 < 30:
                print(f"\n👍 양호 (추가 최적화 가능)")
            else:
                print(f"\n⚠️  추가 최적화 필요")

    print("\n" + "=" * 70)
    print("✨ 테스트 완료!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        speed_test()
    except Exception as e:
        print(f"\n❌ 테스트 오류: {e}")
        import traceback
        traceback.print_exc()

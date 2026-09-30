# 디자인 작업 진행 기록

> 작업 하나를 끝낼 때마다 맨 아래에 한 단락씩 추가합니다 ([TASKS.md](TASKS.md) "진행 기록" 참고).
> 형식: 날짜 · 작업 번호 · 만든 파일 수 · `check_sprites` 결과 · 다시 만든 프레임과 이유 · 남은 문제 · (🛑 작업이면) **검토 요청**

## 2026-09-30 · 시범 (크럼프 대기·강P)

- 설정 그림 1장, 스프라이트 14장 (`idle` 8, `sHP` 6), manifest
- `check_sprites`: ❌ 없음. 이후 검사 기준이 강화되어 `sHP` 5장에 앞쪽 끝 ⚠️
- 검토 결과: [REVIEW_krump_pilot.md](REVIEW_krump_pilot.md). 스타일 채택, `sHP` 다시 만들기, 머리띠 위치 수정 → T1

## 2026-09-30 · T1 시범 수정

- 설정 그림 1장과 스프라이트 14장 수정 (`idle` 8, `sHP` 6), manifest 변경 없음
- `check_sprites`: ❌·⚠️ 없음. `npm run check`: 통과 (55 tests)
- 다시 만든 프레임: 14장 모두. 설정 그림과 `idle`은 머리띠를 눈썹 위 이마로 올렸고, `sHP`는 머리띠 수정과 함께 보폭·팔 뻗기를 참고 실루엣 안으로 좁힘
- 실제 게임 확인: 트레이닝에서 크럼프 대기와 강P(G)를 확인했고, F1 빨간 공격 판정 박스가 `sHP_11` 주먹과 겹침
- 남은 문제: 없음. `src/` 변경 없음. **검토 요청**

## 2026-09-30 · T2 기본 이동

- 스프라이트 30장 추가 (`walkF` 11, `walkB` 9, `crouch` 10), manifest에 30프레임 추가
- `check_sprites`: ❌·⚠️ 없음. `npm run check`: 통과
- 다시 만든 프레임: `walkF_40` 1장. 첫 결과의 들린 앞발이 참고 실루엣보다 21px 더 뻗어, 양발을 몸 아래에 모은 회복 포즈로 재생성
- 실제 게임 확인: 트레이닝에서 D 앞걷기, A 뒤걷기, S 앉기를 여러 반복 동안 확인했고 교체 그림이 끊기거나 코드 그림으로 돌아가지 않음
- 남은 문제: 없음. `src/` 변경 없음

## 2026-09-30 · T3 공통 동작

- 스프라이트 37장 추가 (`prejump` 2, `jump` 5, `land` 2, `hitStand` 4, `hitCrouch` 4, `blockStand` 1, `blockCrouch` 1, `airHit` 3, `knockdown` 3, `getup` 7, `win` 5), manifest에 37프레임 추가
- `check_sprites`: ❌·⚠️ 없음. `npm run check`: 통과
- 다시 만든 프레임: `hitStand_3`, `hitCrouch_3`, `blockStand_0`, `airHit_24`, `knockdown_8`, `getup_8`, `getup_12`, `getup_21`, `win_12`는 앞쪽 끝 경고로 재생성. `airHit_24`는 다리를 더 접어 한 번 추가 재생성
- 실제 게임 확인: 트레이닝에서 점프·착지, 서서/앉아 피격, 가드, 공중 피격, 다운·기상을 확인하고 2P 대전에서 `P1 WINS` 승리 포즈까지 확인
- 남은 문제: 없음. `src/` 변경 없음. **검토 요청**

## 2026-09-30 · T4 기본기

- 스프라이트 49장 추가 (`sLP` 4, `sLK` 5, `sHK` 6, `cLP` 4, `cHP` 5, `cLK` 5, `cHK` 6, `jL` 6, `jH` 8), manifest에 49프레임 추가
- `check_sprites`: ❌·⚠️ 없음. `npm run check`: 통과
- 다시 만든 프레임: `sLP_7`, `sHK_12`, `sHK_16`, `cLP_0`, `cHP_9`, `cLK_10`, `cHK_7`, `cHK_12`, `cHK_27`은 참고 실루엣보다 앞쪽 끝이 20px 이상 뻗어, 팔·다리를 더 접고 원근을 줄여 재생성
- 실제 게임 확인: 트레이닝에서 약P·약K·강K, 앉아 약P·강P·약K·강K, 점프 약공격·강공격을 F1 판정 박스와 함께 확인
- 남은 문제: 없음. `src/` 변경 없음

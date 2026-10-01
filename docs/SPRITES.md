# 스프라이트(그림) 만들기 가이드

> 디자인 담당이라면 먼저 [디자인 작업 지시서](design/DESIGN_BRIEF.md)를 읽어 주세요 (캐릭터 설정, 시범 작업, 검수 기준).

격투 게임은 동작마다 **키 포즈 그림 몇 장**을 그려 두고, 그림이 통째로 바뀌면서 움직입니다.
DANCE BATTLE도 같은 방식으로 그림을 넣을 수 있습니다. 그림이 없는 프레임은 코드로 그린 캐릭터(`render/dancer.ts`)가 대신 나오기 때문에, **한 장씩 조금씩 바꿔 나갈 수 있습니다.**

## 어떻게 동작하나

1. 게임은 동작을 **키 포즈 단위로 끊어서** 보여 줍니다 (`anim/pose.ts`의 `displayFrame`). 반복 동작은 4프레임마다 한 장, 기술은 키프레임마다 한 장 (간격이 넓으면 중간 그림 한 장 추가).
2. 그래서 한 동작에 필요한 그림은 몇 장뿐입니다. 캐릭터 하나당 기본 동작 약 70장 + 기술 약 90~170장입니다.
3. `public/sprites/<캐릭터id>/manifest.json`에 적힌 프레임은 그 그림으로, 나머지는 코드로 그린 캐릭터로 나옵니다.

## 작업 순서

### 1. 참고 그림 내보내기

개발 서버(`npm run dev`)를 켠 상태에서:

```bash
node scripts/export-sprites.mjs krump sHP        # 크럼프 강P의 키 포즈만
node scripts/export-sprites.mjs krump            # 크럼프의 모든 동작
node scripts/export-sprites.mjs krump sHP --p2   # P2 색도 함께
```

`sprites-ref/krump/`에 `sHP_0.png`, `sHP_4.png`, … 와 `manifest.json`이 생깁니다. (이 폴더는 커밋하지 않습니다)

### 2. 그리기

참고 그림을 **밑그림 삼아 그 위에 덧그리세요.** 포즈, 손발 위치, 발밑 위치를 크게 바꾸지 않는 게 중요합니다. 공격 판정(히트박스)이 참고 그림의 팔다리 위치에 맞춰져 있기 때문입니다.

| 규격      | 값                                                                           |
| --------- | ---------------------------------------------------------------------------- |
| 크기      | **640 × 640 px**, 배경 투명 PNG                                              |
| 방향      | 캐릭터가 **오른쪽을 보는** 모습 (왼쪽을 볼 때는 게임이 좌우를 뒤집음)        |
| 기준점    | 캐릭터 발밑 중심이 **(320, 580) px**. 참고 그림과 같은 위치에 서 있으면 된다 |
| 캐릭터 키 | 서 있을 때 약 380px                                                          |

### 2-1. 이미지 생성 도구로 만들었다면

생성된 그림은 배경·크기·위치가 규격과 다르기 마련입니다. 도구로 맞추세요 (Python 3 + Pillow 필요).

```bash
# 배경 지우기 + 참고 그림과 같은 키·발밑·위치로 640×640에 배치
python3 scripts/fit_sprite.py 생성그림.png public/sprites/krump/idle_0.png --ref sprites-ref/krump/idle_0.png
# 넣은 그림 전체 검사 (크기, 투명 배경, 위치, 빠진 프레임)
python3 scripts/check_sprites.py krump
```

### 2-2. sprite-gen(Codex 스킬)으로 한 동작을 한 줄로 만들기

한 동작의 프레임을 **한 번에 한 줄로** 생성해서, 프레임마다 모델이 달라지는 문제를 줄이는 방법입니다. 전용 CLI만 씁니다 (`/Users/cloud/.codex/skills/sprite-gen/.venv/bin/sprite-gen`, 아래에서는 `$SG`).

1. 표시 프레임 번호를 확인합니다: `node scripts/export-sprites.mjs hiphopper sLP` → `sLP_0, 4, 7, 11` (4장)
2. 요청 파일을 씁니다. **프레임 수 = 표시 프레임 수 + 1**: 첫 칸에는 채택된 대기 그림을 그대로 그리게 해서 크기 기준으로 씁니다. 동작 설명에 "오른쪽을 본다, 발 위치 고정, 의상 그대로"를 적습니다. 예시: `sprites-work/sg-pilot/request-sLP.json`
3. 순서대로 실행합니다 (결과는 `sprites-work/`에만):

```bash
$SG workflow --kind sprite --base-image <절대경로>/idle_0.png --motion-method gpt-rows --confirmed-access codex
$SG prepare --out-dir <실행 폴더> --character-id hiphopper --base-image <절대경로>/idle_0.png --request <요청 파일>
$SG gen-set --run-dir <실행 폴더> --provider codex --model gpt-5.6-sol
$SG extract --run-dir <실행 폴더>
$SG compose-atlas --run-dir <실행 폴더>
$SG compose-gif --run-dir <실행 폴더> --out-dir <실행 폴더>/previews
$SG inspect --run-dir <실행 폴더>
```

4. 게임 규격으로 옮기고 검사합니다:

```bash
python3 scripts/import_sprite_gen.py <실행 폴더> sLP hiphopper --frames 0,4,7,11   # → sprites-work/sg/hiphopper/
python3 scripts/check_sprites.py hiphopper --dir sprites-work/sg/hiphopper
```

5. 검사를 통과하면 `public/sprites/<id>/`로 복사하고 `manifest.json`에 적습니다.

- 한 줄은 **4~6장**이 안정적입니다 (대기 칸 포함 최대 6~7장). 긴 동작은 여러 줄로 나눕니다.
- 위치는 `import_sprite_gen.py`가 같은 이름의 참고 그림(`sprites-ref/`)에 맞춥니다. 참고 그림이 자기 대기 자세에서 움직인 만큼만 옮기므로 점프·공중 동작도 따로 처리할 필요가 없습니다.
- 모델은 `--model gpt-5.6-sol`을 씁니다 (`~/.codex/config.toml`의 기본 모델은 ChatGPT 계정에서 거절될 수 있음).

### 2-3. 캐릭터 전체를 한 번에 만들기

`scripts/spritegen/`의 도구로 `public/sprites/<id>/`에 **아직 없는 동작**을 모두 만듭니다. 동작 설명은 기술 데이터(타격 프레임, 판정 위치, 설명)와 참고 그림의 모양(땅/공중, 키·폭 비율)으로 자동으로 씁니다.

```bash
node scripts/spritegen/list.mjs                      # 표시 프레임 목록 → sprites-work/batch/anims.json (개발 서버 필요)
node scripts/spritegen/moves.mjs                     # 기술 데이터 → sprites-work/batch/moves.json
node scripts/export-sprites.mjs <id>                 # 참고 그림
python3 scripts/spritegen/build.py <id>              # 요청 파일 (특정 동작만 다시: build.py <id> <동작...> --redo --run <id>-redo)
zsh scripts/spritegen/run.sh <id> [실행 이름]         # sprite-gen 6단계
python3 scripts/spritegen/import_all.py <id> [실행 이름]   # → sprites-work/sg/<id>/
python3 scripts/check_sprites.py <id> --dir sprites-work/sg/<id>
python3 scripts/contact_sheet.py <id> --all --dir sprites-work/sg/<id>   # 꼭 눈으로 확인
python3 scripts/spritegen/publish.py <id>            # public/sprites/<id>/ 로 옮기고 manifest 에 추가
```

- 게임에는 **WebP**(품질 90)로 넣습니다. `publish.py`가 자동으로 바꾸고, 예전 PNG는 `python3 scripts/spritegen/to_webp.py`로 바꿉니다.
- `import_all.py`는 실행 이름 폴더(`sprites-work/sg/<실행 이름>/`)에 씁니다. `publish.py <id> <실행 이름>`으로 그 폴더만 옮기세요.
- 기술의 발생을 바꾸면(`tune` 등) 키 포즈 번호가 바뀝니다. 바꾸기 전 `anims.json`을 복사해 두고, 바꾼 뒤 `list.mjs` → `rename_shifted.py <복사본>`으로 있던 그림 이름을 옮깁니다.
- 참고 그림 시트를 볼 때: 동작 방향(대공기는 위로, 점프 공격은 아래로)이 맞는지, 모델·옷이 대기 그림과 같은지 확인합니다.
- 누운 자세·거꾸로 선 자세(헤드스핀)는 바지 색 검사가 머리카락을 재서 ❌가 날 수 있습니다. 시트로 확인하세요.

### 3. 게임에 넣기

1. 그린 그림을 `public/sprites/krump/sHP_11.png`처럼 **참고 그림과 같은 이름**으로 저장합니다.
2. `public/sprites/krump/manifest.json`에 넣은 그림만 적습니다.

```json
{
  "frames": {
    "sHP_11": { "p1": "sHP_11.png" },
    "sHP_15": { "p1": "sHP_15.png", "p2": "sHP_15_p2.png" }
  }
}
```

- `p2`(P2 색 그림)가 없으면 P1 그림에 P2 색 테두리 빛을 둘러서 구분합니다 (같은 캐릭터끼리 대전할 때만 보임). 제대로 된 P2 색은 `_p2` 그림을 따로 그려 주세요.
- 게임을 새로고침하고, 연습 모드에서 그 기술을 써 보면 그림이 나옵니다. **F1**로 판정 박스를 켜서 팔다리와 판정이 맞는지 확인하세요.

## 무엇부터 그리면 좋을까

그림이 반쯤만 바뀌면 코드 그림과 섞여 보이므로, **한 동작 단위로 전부** 바꾸는 걸 추천합니다.

1. `idle`(대기): 가장 오래 보이는 그림
2. `walkF` / `walkB`(걷기), `crouch`(앉기)
3. 각 기술의 **판정이 나오는 프레임** (기술의 첫 공격 자세)과 그 앞뒤
4. 필살기, 초필살기
5. 피격, 가드, 다운 같은 공통 동작

## AI 이미지 도구로 만들 때

- 먼저 캐릭터 설정 그림(정면·옆면, 의상, 색)을 한 장 정하고, 모든 프레임에 같은 설정을 쓰세요. 프레임마다 옷이나 얼굴이 바뀌는 게 가장 흔한 문제입니다.
- 내보낸 참고 그림을 **포즈 참고용**(img2img, 포즈 컨트롤 등)으로 넣으면 포즈와 위치를 맞추기 쉽습니다.
- 결과물은 배경을 지우고 640×640, 기준점 (320, 580)에 맞춰 저장하세요.
- 도구의 **상업적 이용·재배포 조건**을 확인하세요. 공개 저장소에 올라갑니다.

## 주의할 점

- 기술의 키프레임을 고치면 프레임 번호가 바뀌어 파일 이름이 맞지 않게 될 수 있습니다. 기술을 고친 뒤에는 `export-sprites.mjs`로 참고 그림을 다시 뽑아 이름을 확인하세요.
- 저장소 용량을 위해 **실제로 그린 그림만** 커밋합니다.

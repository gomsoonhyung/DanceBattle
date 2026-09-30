# CLAUDE.md

AI 코딩 도구(Claude Code 등)로 이 저장소를 작업할 때의 안내입니다. 사람용 규칙은 CONTRIBUTING.md와 같습니다.

- 문서: `CONTRIBUTING.md`(작업 흐름), `docs/ARCHITECTURE.md`(구조), `docs/CHARACTER_GUIDE.md`(캐릭터·기술 데이터)
- 작업을 마치면 `npm run check`(타입 + 포맷 + 결정론 + 테스트)를 통과시킨다. 포맷은 `npm run format`.
- 게임 로직(`src/game`, `src/fighter`, `src/characters`, `src/anim`, `src/core`, `src/input/inputBuffer.ts`, `src/training/guide.ts`)에서는 `Math.random()`, `Date.now()`, `performance.now()`를 쓰지 않는다. 시간은 프레임 수로 센다.
- 로직은 렌더러를 몰라야 한다. 연출이 필요하면 `GameEvent`를 보낸다.
- 새 기술 동작은 `fighter.ts`에 기술 id로 분기하지 말고 `MoveDef` 필드로 표현한다. 기술은 가능하면 `src/characters/builders.ts`의 도우미로 만들고, 필살기에는 `desc`를 단다.
- 새 규칙이나 시스템에는 `src/game/match.test.ts`에 테스트를 추가한다.
- 동작(포즈)을 바꿨다면 개발 서버를 켠 상태에서 `npm run shots -- <캐릭터id>/<기술id>`로 `shots/`에 프레임 이미지를 찍어 확인한다. 외형은 `node scripts/look.mjs "gallery=lineup"` 또는 `"gallery=closeup&char=<id>&anim=<기술id>&f=<프레임>"`.
- 주석과 문서는 한국어로, 코드 이름은 영어로 쓴다.
- 브랜치는 `feat/`, `fix/`, `balance/`, `docs/`, `refactor/`로 시작하고, 커밋 메시지는 `종류: 내용` 형식을 따른다.

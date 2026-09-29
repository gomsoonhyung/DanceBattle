# GitHub 저장소 설정 (관리자용)

저장소 관리자가 **한 번만** 해 두면 되는 설정입니다. 전부 GitHub 웹사이트의 저장소 페이지에서 합니다.
(`gh` CLI에 로그인되어 있다면 명령어로도 할 수 있어요. 각 항목 아래에 적어 두었습니다.)

## 1. 팀원 초대

**Settings → Collaborators → Add people** 에서 팀원의 GitHub 아이디를 입력합니다.
초대받은 사람이 메일에서 수락하면 브랜치를 푸시하고 PR을 만들 수 있어요.

## 2. main 브랜치 보호 (추천)

실수로 `main`에 바로 푸시하거나, 검사가 실패한 코드가 합쳐지는 것을 막습니다.

**Settings → Branches → Add branch ruleset** (또는 "Add classic branch protection rule")

- 대상 브랜치: `main`
- ✅ **Require a pull request before merging**
  - Required approvals: `1` (팀원 한 명 이상이 승인해야 머지). 혼자 테스트하는 동안은 0으로 둬도 됩니다
- ✅ **Require status checks to pass** → 검색해서 **`check`** 추가 (CI가 한 번 돌고 나야 목록에 나옵니다)
  - ✅ Require branches to be up to date before merging
- ✅ **Block force pushes**

## 3. 머지 방식

**Settings → General → Pull Requests**

- ✅ **Allow squash merging** 만 켜고 나머지(merge commit, rebase)는 끄기를 추천합니다. PR 하나가 `main`에 커밋 하나로 깔끔하게 남아요.
- ✅ **Automatically delete head branches** (머지한 브랜치 자동 삭제)

## 4. 이슈 라벨

이슈 템플릿이 `bug`, `enhancement`, `balance` 라벨을 자동으로 붙입니다. `bug`와 `enhancement`는 GitHub 기본 라벨이라 이미 있고, **`balance`만 새로 만들면** 됩니다.

**Issues → Labels → New label**

| 라벨               | 색        | 용도                                    |
| ------------------ | --------- | --------------------------------------- |
| `balance`          | `#FBCA04` | 데미지·프레임·판정 조정                 |
| `character`        | `#7057FF` | 새 캐릭터 작업 (선택)                   |
| `good first issue` | (기본)    | 처음 참여하는 사람에게 추천할 쉬운 작업 |

```bash
gh label create balance --color FBCA04 --description "데미지·프레임·판정 조정"
gh label create character --color 7057FF --description "새 캐릭터 작업"
```

## 5. 저장소 소개

저장소 첫 화면 오른쪽 **About** 옆 톱니바퀴에서:

- Description: `춤 동작으로 싸우는 2D 대전 격투 게임`
- Topics: `game`, `fighting-game`, `typescript`, `vite`, `canvas`, `dance`

```bash
gh repo edit gomsoonhyung/DanceBattle --description "춤 동작으로 싸우는 2D 대전 격투 게임" \
  --add-topic game,fighting-game,typescript,vite,canvas,dance
```

## 이미 들어 있는 것

저장소에 이미 포함되어 있어서 따로 설정할 필요가 없는 것들:

| 파일                               | 하는 일                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`         | PR·푸시마다 타입 검사, 포맷 검사, 결정론 검사, 테스트, 빌드 (Actions 탭에서 결과 확인) |
| `.github/pull_request_template.md` | PR을 만들면 확인 목록이 자동으로 채워짐                                                |
| `.github/ISSUE_TEMPLATE/`          | 버그 / 기능 제안 / 밸런스 피드백 양식                                                  |
| `.github/CODEOWNERS`               | 모든 PR에 관리자가 리뷰어로 자동 지정                                                  |

// 게임 로직 폴더에 결정론을 깨는 코드(무작위, 현재 시각)가 들어가지 않았는지 검사한다.
// 규칙 설명: docs/ARCHITECTURE.md#결정론-규칙
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOGIC_PATHS = [
  'src/training/guide.ts',
  'src/game',
  'src/fighter',
  'src/characters',
  'src/anim',
  'src/core',
  'src/input/inputBuffer.ts',
  'src/input/types.ts',
];
const FORBIDDEN = [/Math\.random\s*\(/, /Date\.now\s*\(/, /new Date\s*\(/, /performance\.now\s*\(/];

function files(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((f) => files(join(path, f)));
}

const problems = [];
for (const file of LOGIC_PATHS.flatMap(files)) {
  if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (FORBIDDEN.some((re) => re.test(line))) problems.push(`${file}:${i + 1}  ${line.trim()}`);
    });
}

if (problems.length) {
  console.error('❌ 게임 로직에서 결정론을 깨는 코드를 찾았습니다 (docs/ARCHITECTURE.md#결정론-규칙):\n');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('✅ 결정론 검사 통과');

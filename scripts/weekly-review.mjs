/**
 * 만나(MANNA) 주간 코드 점검 스크립트
 *
 * 실행 방법: ANTHROPIC_API_KEY=sk-... REPORT_DATE=2026-06-09 node scripts/weekly-review.mjs
 *
 * 외부 의존성 없이 Node.js 내장 fetch만 사용합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// KST 기준 오늘 날짜 (환경 변수로 override 가능)
const DATE = process.env.REPORT_DATE
  || new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// ─── 소스 파일 수집 ──────────────────────────────────────────────────────────

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mjs', '.js', '.sql', '.toml', '.json'];
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.cache', 'coverage']);
const SKIP_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']);

function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || SKIP_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (SOURCE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// 점검 대상 파일 우선순위 목록 (먼저 읽힘)
const PRIORITY_FILES = [
  'README.md',
  'package.json',
  'next.config.mjs',
  'netlify.toml',
  'tsconfig.json',
  'tailwind.config.ts',
  'src/middleware.ts',
];

function buildSourceBundle() {
  const seen = new Set();
  let bundle = '';

  const addFile = (filePath) => {
    const rel = path.relative(ROOT, filePath);
    if (seen.has(rel)) return;
    seen.add(rel);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      bundle += `\n\n${'─'.repeat(60)}\n📄 FILE: ${rel}\n${'─'.repeat(60)}\n${content}`;
    } catch {
      // 읽기 실패 시 건너뜀
    }
  };

  // 우선순위 파일 먼저
  for (const rel of PRIORITY_FILES) {
    const fullPath = path.join(ROOT, rel);
    if (fs.existsSync(fullPath)) addFile(fullPath);
  }

  // 나머지 소스 파일
  const allFiles = collectFiles(ROOT);
  for (const f of allFiles) addFile(f);

  return bundle;
}

// ─── Claude API 호출 ─────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userContent) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API 오류 ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.content[0].text;
}

// ─── 프롬프트 ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 경험 많은 시니어 풀스택 개발자이자 보안 전문가입니다.
주어진 코드베이스를 꼼꼼히 점검하고 한국어로 리포트를 작성합니다.

리포트 작성 원칙:
- 독자는 개발 지식이 없는 비개발자(기획자, 운영 담당자, 대표자)입니다.
- 기술 용어 뒤에는 반드시 괄호로 쉬운 설명을 추가합니다. 예: "API(앱과 서버가 통신하는 통로)"
- 추상적 표현 대신 구체적 문제와 위치를 명시합니다. 예: "src/app/api/chat/route.ts 23번째 줄"
- 단순히 좋다/나쁘다가 아니라 "왜 문제인지", "어떤 피해가 생길 수 있는지"를 설명합니다.
- 실제로 발견된 것만 작성합니다. 없으면 "해당 없음"이라고 명시합니다.`;

function buildUserPrompt(sourceBundle) {
  return `아래는 MANNA(SELAH 2.0) 앱의 전체 소스코드입니다.
이 앱은 AI 기반 기독교 감성 지원 + 성경 묵상 앱으로 Next.js 15 + Supabase + Claude API로 구동되며 Netlify에 배포되어 있습니다.

다음 항목을 빠짐없이 점검하고, 아래에 지정된 마크다운 형식으로 리포트를 작성해 주세요.

=== 점검 항목 ===
1. 버그 및 잠재적 오류: 현재 또는 특정 조건에서 발생할 수 있는 오류
2. 미완성 기능: TODO/FIXME 주석, 하드코딩된 임시값, 빈 구현
3. 보안 취약점: 인증 누락, 비밀 키 노출 위험, 입력값 미검증, SQL 인젝션 가능성 등
4. 성능·안정성 문제: 불필요한 재렌더링, 느린 쿼리, 에러 처리 부재
5. 출시·운영 관점 우선순위: 당장 또는 다음 작업에서 해결해야 할 사항

=== 출력 형식 (이 형식을 정확히 따를 것) ===

# 만나(MANNA) 주간 점검 리포트 — ${DATE}

## 📌 요약 (한 눈에 보기)
전체 코드베이스 상태를 3-5줄로 요약. 이번 주 가장 중요한 발견을 포함.

## 🔴 즉시 해결이 필요한 문제

*(발견된 항목이 없으면 "이번 주에는 해당 없음"이라고 쓸 것)*

각 항목 형식:
### [문제 제목]
- **파일 위치**: \`파일경로\` (줄 번호)
- **무슨 문제인가**: 비개발자도 이해하는 설명
- **어떤 피해가 생기나**: 실제 발생할 수 있는 결과
- **권장 조치**: 구체적으로 무엇을 해야 하는지

## 🟡 가까운 시일 내에 개선이 필요한 부분

*(발견된 항목이 없으면 "이번 주에는 해당 없음"이라고 쓸 것)*

(같은 항목 형식)

## 🟢 장기적으로 개선하면 좋은 점

*(발견된 항목이 없으면 "이번 주에는 해당 없음"이라고 쓸 것)*

(같은 항목 형식)

## 🔒 보안 점검 결과
인증(로그인 검증), API 키 관리, 입력값 검증, 데이터베이스 접근 제어 등 보안 측면 종합 평가.
점검한 항목을 나열하고 각각 ✅ 양호 / ⚠️ 주의 / ❌ 위험으로 표시.

## 📋 다음 작업 추천 목록 (우선순위 순)

1. **[작업명]** — 이유: ...  |  예상 소요: (간단함 / 반나절 / 하루 / 수일)
2. ...

(출시·운영 관점에서 가장 중요한 순서로 5-10개)

## 📊 이번 주 건강도 평가

| 항목 | 점수 | 코멘트 |
|------|------|--------|
| 코드 품질 | X / 10 | 한 줄 코멘트 |
| 보안 | X / 10 | 한 줄 코멘트 |
| 기능 완성도 | X / 10 | 한 줄 코멘트 |
| 사용자 경험 | X / 10 | 한 줄 코멘트 |
| 운영 안정성 | X / 10 | 한 줄 코멘트 |

---
*이 리포트는 Claude AI가 자동으로 생성했습니다. 내용은 참고용이며, 중요한 결정은 반드시 개발팀과 함께 검토하세요.*
*생성 일시: ${new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19)} KST*

=== 소스코드 ===
${sourceBundle}`;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`📅 점검 날짜: ${DATE}`);
  console.log('📂 소스 파일 수집 중...');

  const sourceBundle = buildSourceBundle();
  const fileCount = (sourceBundle.match(/📄 FILE:/g) || []).length;
  console.log(`   → ${fileCount}개 파일 수집됨`);

  console.log('🤖 Claude API로 코드 점검 중... (약 1-2분 소요)');
  const report = await callClaude(SYSTEM_PROMPT, buildUserPrompt(sourceBundle));

  const reportsDir = path.join(ROOT, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const reportPath = path.join(reportsDir, `weekly-${DATE}.md`);
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`✅ 리포트 저장 완료: reports/weekly-${DATE}.md`);
}

main().catch(err => {
  console.error('❌ 오류 발생:', err.message);
  process.exit(1);
});

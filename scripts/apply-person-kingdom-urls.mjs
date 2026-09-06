// migration-mapping-person-kingdom.json에서 status:"success"인 항목만 골라,
// itda-backend의 PersonImageData.java / HistoricalKingdomData.java 안의 정확한
// old_url 문자열을 new_url(Blob public URL)로 치환한다.
//
// 오직 URL 문자열 치환만 한다 — 다른 구조/로직은 건드리지 않는다.
// 안전장치: old_url이 파일 안에 정확히 1번만 나오는 경우에만 치환하고,
// 0번/2번 이상이면 건드리지 않고 경고만 남긴다.
//
// 실행: node scripts/apply-person-kingdom-urls.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(OUT_DIR, "..");
const MAPPING_PATH = path.join(OUT_DIR, "migration-mapping-person-kingdom.json");

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

async function main() {
  const mapping = JSON.parse(await readFile(MAPPING_PATH, "utf-8"));
  const toApply = mapping.filter((m) => m.status === "success");

  console.log(`${mapping.length}건 중 success ${toApply.length}건 적용 대상.`);

  const byFile = new Map();
  for (const m of toApply) {
    if (!byFile.has(m.file)) byFile.set(m.file, []);
    byFile.get(m.file).push(m);
  }

  for (const [relFile, entries] of byFile) {
    const absPath = path.join(REPO_ROOT, relFile);
    let content = await readFile(absPath, "utf-8");
    let changed = 0;

    for (const entry of entries) {
      const count = countOccurrences(content, entry.old_url);
      if (count !== 1) {
        console.warn(
          `  [SKIP] ${relFile}: ${entry.identifier} — old_url이 ${count}번 발견됨(1번이어야 안전하게 치환). 수동 확인 필요.`,
        );
        continue;
      }
      content = content.split(entry.old_url).join(entry.new_url);
      changed++;
      console.log(`  [OK]   ${relFile}: ${entry.identifier}`);
    }

    if (changed > 0) {
      await writeFile(absPath, content, "utf-8");
    }
  }

  console.log("적용 완료. itda-backend에서 git diff로 확인하세요.");
}

main().catch((err) => {
  console.error("URL 치환 실패:", err);
  process.exitCode = 1;
});

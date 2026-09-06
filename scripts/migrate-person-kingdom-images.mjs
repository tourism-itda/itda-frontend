// migration-source-refs.json(find-namuwiki-source-refs.mjs 결과)에 있는 person/kingdom
// 나무위키 이미지 51건을 다운로드해서 Vercel Blob(public)으로 재업로드한다.
// itda-backend 파일은 건드리지 않는다 — apply-person-kingdom-urls.mjs가 별도로 담당.
//
// 실행: node --env-file=.env.local scripts/migrate-person-kingdom-images.mjs

import { put } from "@vercel/blob";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FETCH_TIMEOUT_MS = 15_000;
const OUT_DIR = path.resolve(import.meta.dirname, "..");
const REFS_PATH = path.join(OUT_DIR, "migration-source-refs.json");

// find-namuwiki-source-refs.mjs가 kingdom 항목의 한글 이름까진 뽑지 않아서, 파일명 표기용으로만 둔다.
const KINGDOM_KO = {
  GOGURYEO: "고구려",
  BAEKJE: "백제",
  SILLA: "신라",
  GAYA: "가야",
  UNIFIED_SILLA: "통일신라",
  BALHAE: "발해",
  LATER_GOGURYEO: "후고구려",
  LATER_BAEKJE: "후백제",
  GORYEO: "고려",
  JOSEON: "조선",
  KOREAN_EMPIRE: "대한제국",
  JAPANESE_COLONY: "일제강점기",
  FIRST_REPUBLIC_OF_KOREA: "대한민국제1공화국",
};

function guessExtension(contentType, url) {
  const byContentType = {
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
  };
  if (contentType && byContentType[contentType]) return byContentType[contentType];
  const urlExt = path.extname(new URL(url).pathname);
  return urlExt || ".bin";
}

function sanitizeForPathname(value) {
  return value.replace(/[\\/?#%]/g, "-");
}

/**
 * 파일명 베이스. "고종"처럼 이름이 겹치는 인물이 있어서(JOSEON/KOREAN_EMPIRE),
 * person은 이름만으론 유니크하지 않아 kingdom을 같이 붙인다.
 */
function buildFilenameBase(ref) {
  if (ref.kind === "person") {
    return sanitizeForPathname(`person-${ref.name}-${ref.kingdom}`);
  }
  const ko = KINGDOM_KO[ref.kingdom] ?? ref.kingdom;
  return sanitizeForPathname(`kingdom-${ko}`);
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function migrateOne(ref) {
  let response;
  try {
    response = await fetchWithTimeout(ref.old_url);
  } catch (err) {
    const reason = err.name === "AbortError" ? "timeout" : `fetch failed: ${err.message}`;
    return { ...ref, ok: false, reason };
  }

  if (!response.ok) {
    return { ...ref, ok: false, reason: `upstream ${response.status}` };
  }

  const contentType = response.headers.get("content-type") ?? undefined;
  if (contentType && !contentType.startsWith("image/")) {
    return { ...ref, ok: false, reason: `not an image (content-type: ${contentType})` };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = guessExtension(contentType, ref.old_url);
  const pathname = `namuwiki-migration/${buildFilenameBase(ref)}${ext}`;

  try {
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { ...ref, ok: true, newUrl: blob.url };
  } catch (err) {
    return { ...ref, ok: false, reason: `blob upload failed: ${err.message}` };
  }
}

function identifierFor(ref) {
  return ref.kind === "person" ? `${ref.name}(${ref.kingdom})` : `kingdom:${ref.kingdom}`;
}

async function main() {
  const refs = JSON.parse(await readFile(REFS_PATH, "utf-8"));
  console.log(`migration-source-refs.json에서 ${refs.length}건 로드.`);

  const results = [];
  for (const ref of refs) {
    // 나무위키에 순차 요청 — 동시 다발 요청으로 추가 차단을 유발하지 않도록 한다.
    const result = await migrateOne(ref);
    results.push(result);
    console.log(
      result.ok
        ? `  [OK]   ${identifierFor(ref)}`
        : `  [FAIL] ${identifierFor(ref)} — ${result.reason}`,
    );
  }

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  const mapping = results.map((r) => ({
    file: r.file,
    line: r.line,
    kind: r.kind,
    identifier: identifierFor(r),
    old_url: r.old_url,
    new_url: r.ok ? r.newUrl : null,
    status: r.ok ? "success" : "failed",
  }));

  const failedOut = failed.map((r) => ({
    file: r.file,
    line: r.line,
    kind: r.kind,
    identifier: identifierFor(r),
    old_url: r.old_url,
    reason: r.reason,
  }));

  await writeFile(
    path.join(OUT_DIR, "migration-mapping-person-kingdom.json"),
    JSON.stringify(mapping, null, 2),
  );
  await writeFile(path.join(OUT_DIR, "migration-failed.json"), JSON.stringify(failedOut, null, 2));

  console.log("");
  console.log(`총 ${refs.length}건 / 성공 ${succeeded.length}건 / 실패 ${failed.length}건`);
  console.log("생성됨: migration-mapping-person-kingdom.json, migration-failed.json");
  console.log("itda-backend 파일은 아직 건드리지 않았습니다 — apply-person-kingdom-urls.mjs가 이어서 처리합니다.");
}

main().catch((err) => {
  console.error("person/kingdom 이미지 마이그레이션 실패:", err);
  process.exitCode = 1;
});

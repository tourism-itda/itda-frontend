// 나무위키(i.namu.wiki) 핫링크 이미지를 Vercel Blob으로 이관하기 위한 준비 스크립트.
//
// 하는 일: DB 조회(SELECT) → 이미지 다운로드 → Vercel Blob 업로드 → SQL 생성 까지만.
// UPDATE는 절대 실행하지 않는다. 생성된 migration-update.sql은 담당자가 검토 후 직접 실행한다.
//
// 실행:
//   node --env-file=.env.local scripts/migrate-namuwiki-images.mjs
//
// DB 접속 정보는 DATABASE_URL 하나로 주거나, DB_HOST/DB_PORT/DB_NAME/DB_USERNAME/DB_PASSWORD
// 조합으로 준다(itda-backend의 application.yml과 동일한 이름). 비밀번호 기본값은 두지 않는다 —
// 반드시 환경변수로 넘겨야 한다. host/port/db 이름만 로컬 docker-compose 기준으로 기본값을 둔다.
//
// 운영 DB로 돌리려면:
//   DATABASE_URL=postgresql://user:pass@host:5432/dbname node --env-file=.env.local scripts/migrate-namuwiki-images.mjs

import { Client } from "pg";
import { put } from "@vercel/blob";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const NAMUWIKI_PATTERN = "%i.namu.wiki%";
const FETCH_TIMEOUT_MS = 15_000;
const OUT_DIR = path.resolve(import.meta.dirname, "..");

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const database = process.env.DB_NAME ?? "itda";
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "DB 접속 정보가 없습니다. DATABASE_URL 또는 DB_USERNAME/DB_PASSWORD 환경변수를 설정하세요.",
    );
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

/** @param {Client} client */
async function findPrimaryKeyColumns(client) {
  const { rows } = await client.query(`
    SELECT tc.table_name, kcu.column_name, kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `);

  /** @type {Map<string, string>} 테이블당 PK 컬럼 1개(복합 PK는 첫 컬럼만 사용) */
  const pkByTable = new Map();
  for (const row of rows) {
    if (!pkByTable.has(row.table_name)) {
      pkByTable.set(row.table_name, row.column_name);
    }
  }
  return pkByTable;
}

/** @param {Client} client */
async function findTextColumns(client) {
  const { rows } = await client.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('character varying', 'text', 'character')
    ORDER BY table_name, column_name;
  `);
  return rows;
}

/**
 * 스키마 전체(테이블 이름 하드코딩 없이)를 훑어서 i.namu.wiki를 포함하는 값을 찾는다.
 * SELECT만 수행하는 읽기 전용 단계.
 */
async function findNamuwikiRows(client) {
  const pkByTable = await findPrimaryKeyColumns(client);
  const textColumns = await findTextColumns(client);

  const found = [];

  for (const { table_name: table, column_name: column } of textColumns) {
    const pkColumn = pkByTable.get(table);
    if (!pkColumn || pkColumn === column) continue;

    const { rows } = await client.query(
      `SELECT "${pkColumn}" AS id, "${column}" AS url FROM "${table}" WHERE "${column}" ILIKE $1`,
      [NAMUWIKI_PATTERN],
    );

    for (const row of rows) {
      if (!row.url) continue;
      found.push({ table, column, pkColumn, id: row.id, oldUrl: row.url });
    }
  }

  return found;
}

function guessExtension(contentType, url) {
  const byContentType = {
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  if (contentType && byContentType[contentType]) return byContentType[contentType];

  const urlExt = path.extname(new URL(url).pathname);
  if (urlExt) return urlExt;

  return ".bin";
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

/**
 * 나무위키 URL 하나를 다운로드해서 Vercel Blob(public)으로 재업로드한다.
 * 성공/실패 여부만 반환하고, DB에는 아무것도 쓰지 않는다.
 */
async function migrateOne(row) {
  const { table, column, pkColumn, id, oldUrl } = row;

  let response;
  try {
    response = await fetchWithTimeout(oldUrl);
  } catch (err) {
    const reason = err.name === "AbortError" ? "timeout" : `fetch failed: ${err.message}`;
    return { ...row, ok: false, reason };
  }

  if (!response.ok) {
    return { ...row, ok: false, reason: `upstream ${response.status}` };
  }

  const contentType = response.headers.get("content-type") ?? undefined;
  if (contentType && !contentType.startsWith("image/")) {
    return { ...row, ok: false, reason: `not an image (content-type: ${contentType})` };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = guessExtension(contentType, oldUrl);
  const pathname = `namuwiki-migration/${table}-${column}-${id}${ext}`;

  try {
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      // vercel env pull로 받은 .env.local에는 VERCEL_OIDC_TOKEN도 같이 들어있는데,
      // @vercel/blob이 이를 우선 시도하면서 "development 환경엔 OIDC 미설정" 에러가 난다.
      // 명시적으로 BLOB_READ_WRITE_TOKEN을 지정해 OIDC 자동 감지를 우회한다.
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { ...row, ok: true, newUrl: blob.url };
  } catch (err) {
    return { ...row, ok: false, reason: `blob upload failed: ${err.message}` };
  }
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

function buildUpdateSql(successRows) {
  const byTable = new Map();
  for (const row of successRows) {
    if (!byTable.has(row.table)) byTable.set(row.table, []);
    byTable.get(row.table).push(row);
  }

  const lines = [
    "-- 나무위키(i.namu.wiki) 이미지 → Vercel Blob 이관 UPDATE 문",
    "-- 자동 생성됨. 검토 후 담당자가 직접 실행할 것. 이 스크립트는 아무것도 실행하지 않는다.",
    "",
  ];

  for (const [table, rows] of byTable) {
    lines.push(`-- ${table} 테이블`);
    for (const row of rows) {
      const idLiteral = typeof row.id === "number" ? row.id : `'${escapeSqlString(row.id)}'`;
      lines.push(
        `UPDATE ${table} SET ${row.column} = '${escapeSqlString(row.newUrl)}' WHERE ${row.pkColumn} = ${idLiteral};`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const client = new Client({ connectionString: buildConnectionString() });
  await client.connect();

  let rows;
  try {
    rows = await findNamuwikiRows(client);
  } finally {
    await client.end();
  }

  console.log(`i.namu.wiki 참조 ${rows.length}건 조회됨 (테이블/컬럼 전수 스캔).`);
  if (rows.length === 0) {
    console.log("이관할 행이 없습니다. migration-mapping.json/migration-update.sql을 빈 상태로 기록합니다.");
  }

  const results = [];
  for (const row of rows) {
    // 나무위키에 순차적으로 요청 — 동시 요청으로 몰아서 추가 차단을 유발하지 않도록 한다.
    const result = await migrateOne(row);
    results.push(result);
    console.log(
      result.ok
        ? `  [OK]   ${row.table}.${row.column}#${row.id}`
        : `  [FAIL] ${row.table}.${row.column}#${row.id} — ${result.reason}`,
    );
  }

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  const mapping = succeeded.map((r) => ({
    table: r.table,
    column: r.column,
    id: r.id,
    old_url: r.oldUrl,
    new_url: r.newUrl,
  }));

  const failedOut = failed.map((r) => ({
    table: r.table,
    column: r.column,
    id: r.id,
    old_url: r.oldUrl,
    reason: r.reason,
  }));

  await writeFile(path.join(OUT_DIR, "migration-mapping.json"), JSON.stringify(mapping, null, 2));
  await writeFile(path.join(OUT_DIR, "migration-failed.json"), JSON.stringify(failedOut, null, 2));
  await writeFile(path.join(OUT_DIR, "migration-update.sql"), buildUpdateSql(succeeded));

  console.log("");
  console.log(`총 조회: ${rows.length}건 / 성공: ${succeeded.length}건 / 실패: ${failed.length}건`);
  console.log("생성됨: migration-mapping.json, migration-failed.json, migration-update.sql");
  console.log("SQL은 생성만 됐습니다 — 실행하지 않았습니다. 검토 후 직접 실행하세요.");
}

main().catch((err) => {
  console.error("마이그레이션 스크립트 실패:", err);
  process.exitCode = 1;
});

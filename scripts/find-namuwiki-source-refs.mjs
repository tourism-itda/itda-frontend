// person.image_url / kingdom.image_url은 DB 행이 아니라 itda-backend에 하드코딩된
// Java 상수(PersonImageData.java, HistoricalKingdomData.java)에서 나온다.
// itda-backend는 읽기 전용(참고용) 이라 SQL로 이관할 수 없고, 고치려면 그 파일 자체를
// 사람이 직접 수정해야 한다. 이 스크립트는 그 위치를 사람이 찾기 쉽게 정리만 해준다
// (파일을 읽기만 하고 아무것도 쓰지 않음).
//
// 실행: node scripts/find-namuwiki-source-refs.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BACKEND_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "itda-backend",
  "src/main/java/com/tourism/itda/explore/data",
);

function extractPersonImageRefs(source, filePath) {
  const refs = [];
  const entryPattern =
    /Map\.entry\(new PersonImageKey\("([^"]+)",\s*Kingdom\.(\w+)\),\s*"([^"]+)"\)/g;

  let match;
  while ((match = entryPattern.exec(source))) {
    const [full, name, kingdom, url] = match;
    if (!url.includes("i.namu.wiki")) continue;
    const line = source.slice(0, match.index).split("\n").length;
    refs.push({ file: filePath, line, kind: "person", name, kingdom, old_url: url });
  }
  return refs;
}

function extractKingdomImageRefs(source, filePath) {
  const refs = [];
  // 각 Map.entry(Kingdom.XXX, ...) 블록의 시작 위치를 모두 찾은 뒤,
  // 다음 Map.entry( 시작 전까지를 그 블록으로 보고 안의 문자열 리터럴 중
  // 마지막 것을 imageUrl로 취급한다(생성자 마지막 인자가 imageUrl이므로).
  const blockStarts = [...source.matchAll(/Map\.entry\(\s*Kingdom\.(\w+),/g)];

  for (let i = 0; i < blockStarts.length; i++) {
    const start = blockStarts[i];
    const end = blockStarts[i + 1]?.index ?? source.length;
    const block = source.slice(start.index, end);
    const strings = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    const url = strings.at(-1);
    if (!url || !url.includes("i.namu.wiki")) continue;

    const line = source.slice(0, start.index).split("\n").length;
    refs.push({ file: filePath, line, kind: "kingdom", kingdom: start[1], old_url: url });
  }
  return refs;
}

async function main() {
  const personFile = path.join(BACKEND_DIR, "PersonImageData.java");
  const kingdomFile = path.join(BACKEND_DIR, "HistoricalKingdomData.java");

  const [personSource, kingdomSource] = await Promise.all([
    readFile(personFile, "utf-8"),
    readFile(kingdomFile, "utf-8"),
  ]);

  const toPosix = (p) => p.split(path.sep).join("/");
  const relPerson = toPosix(path.relative(path.resolve(import.meta.dirname, "..", ".."), personFile));
  const relKingdom = toPosix(path.relative(path.resolve(import.meta.dirname, "..", ".."), kingdomFile));

  const refs = [
    ...extractPersonImageRefs(personSource, relPerson),
    ...extractKingdomImageRefs(kingdomSource, relKingdom),
  ];

  const outPath = path.resolve(import.meta.dirname, "..", "migration-source-refs.json");
  await writeFile(outPath, JSON.stringify(refs, null, 2));

  console.log(`i.namu.wiki 하드코딩 참조 ${refs.length}건 발견 (person: ${refs.filter((r) => r.kind === "person").length}, kingdom: ${refs.filter((r) => r.kind === "kingdom").length})`);
  console.log("이 항목들은 DB 행이 아니라서 SQL로 이관할 수 없습니다.");
  console.log("itda-backend는 읽기 전용이라 이 스크립트가 직접 수정하지 않았습니다 — migration-source-refs.json을 참고해 담당자가 해당 파일을 직접 고쳐야 합니다.");
  console.log(`생성됨: ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error("소스 참조 스캔 실패:", err);
  process.exitCode = 1;
});

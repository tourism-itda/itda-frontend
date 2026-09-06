// 나무위키(i.namu.wiki)가 외부 리퍼러 기반으로 이미지 요청을 403 차단하는 문제를 우회하기 위한
// 서버사이드 이미지 프록시. 오픈 프록시로 악용되지 않도록 허용 도메인을 화이트리스트로 제한한다.
const ALLOWED_HOSTS = new Set(["i.namu.wiki"]);

interface VercelLikeRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelLikeResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: Buffer | string): void;
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const host = typeof req.headers.host === "string" ? req.headers.host : "localhost";
  const { searchParams } = new URL(req.url ?? "", `https://${host}`);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    res.statusCode = 400;
    res.end("Missing url parameter");
    return;
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    res.statusCode = 400;
    res.end("Invalid url parameter");
    return;
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    res.statusCode = 400;
    res.end("Host not allowed");
    return;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch {
    res.statusCode = 502;
    res.end("Upstream fetch failed");
    return;
  }

  if (!upstream.ok) {
    res.statusCode = upstream.status;
    res.end("Upstream error");
    return;
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    res.statusCode = 400;
    res.end("Upstream did not return an image");
    return;
  }

  const body = Buffer.from(await upstream.arrayBuffer());

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, immutable");
  res.end(body);
}

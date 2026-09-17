// 나무위키(i.namu.wiki)는 리퍼러 정책상 외부 사이트발 이미지 요청을 항상 403으로 차단한다.
// referrerPolicy="no-referrer"로도 우회가 안 되므로, 서버(api/img-proxy.ts)를 거쳐 재서빙한다.
const PROXIED_HOSTS = new Set(["i.namu.wiki"]);

export function getProxiedImageUrl(url: string): string {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!PROXIED_HOSTS.has(parsed.hostname)) return url;

  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
}

// 마이페이지와 동일한 기본 프로필 이미지 규칙: 등록된 프로필이 없으면 닉네임 기반 아바타를 사용한다.
export function getAvatarUrl(profileUrl: string | null | undefined, nickname: string | null | undefined): string {
  return profileUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname ?? "guest")}`;
}

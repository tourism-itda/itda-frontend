// 다크 모드는 서버(/api/users/me)에 저장되지만, dark 클래스를 붙이는 곳이 마이페이지뿐이라
// 새로고침하면 마이페이지에 들어가기 전까지 항상 밝은 화면이었다. 마지막 설정을 브라우저에도
// 캐시해 두고 앱이 뜨기 전에(main.tsx) 먼저 적용해 깜빡임을 막는다. 로그인 상태에서는 Layout이
// 서버 값으로 다시 맞춘다(다른 기기에서 바꾼 설정 반영).
const STORAGE_KEY = "itda-dark-mode";

export function applyDarkMode(enabled: boolean) {
  document.documentElement.classList.toggle("dark", enabled);
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 저장소 접근이 막힌 환경(시크릿 모드 등)에서는 캐시만 포기한다
  }
}

export function restoreDarkMode() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // 위와 동일
  }
}

// 로그아웃/탈퇴 후에는 이전 사용자의 설정이 남지 않게 기본(밝은) 화면으로 되돌린다.
export function resetDarkMode() {
  document.documentElement.classList.remove("dark");
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 위와 동일
  }
}

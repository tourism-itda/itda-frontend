// 카카오맵 JS SDK(dapi.kakao.com/v2/maps/sdk.js) 로더. VITE_KAKAO_MAP_KEY(카카오 디벨로퍼스의
// "JavaScript 키" — 로그인에 쓰는 VITE_KAKAO_CLIENT_ID/REST API 키와는 다른 값)로 스크립트를
// 한 번만 로드하고, 이후 호출은 같은 Promise를 재사용한다. autoload=false로 받아 kakao.maps.load
// 콜백이 끝난 뒤에야 resolve하므로, 이 Promise가 끝난 뒤엔 window.kakao.maps를 바로 쓸 수 있다.

declare global {
  interface Window {
    kakao: any;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (window.kakao?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const appkey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!appkey) {
    return Promise.reject(new Error("카카오맵 API 키(VITE_KAKAO_MAP_KEY)가 설정되지 않았어요."));
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("카카오맵 SDK 로드에 실패했어요."));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("카카오맵 SDK 스크립트를 불러오지 못했어요."));
    document.head.appendChild(script);
  }).catch((err) => {
    loadPromise = null; // 실패하면 다음 호출에서 다시 시도할 수 있게 캐시를 비운다.
    throw err;
  });

  return loadPromise;
}

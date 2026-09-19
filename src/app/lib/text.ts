/**
 * TourAPI overview 같은 외부 설명 텍스트에는 `<br />`, `<p>`, `&nbsp;`, `&amp;` 등 HTML이 그대로
 * 섞여 내려온다(이중 인코딩된 `&lt;br&gt;`인 경우도 있다). React는 문자열을 이스케이프해서 그리기
 * 때문에 그대로 두면 태그가 글자로 보이므로, 화면에 표시하기 전에 순수 텍스트로 바꾼다.
 *
 * 줄바꿈 태그는 "\n"으로 남긴다 — 전체 설명을 보여주는 곳에서는 whitespace-pre-line으로 살리고,
 * line-clamp 카드에서는 공백처럼 접힌다.
 */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return "";

  let text = input;
  // 한 번 디코딩하면 태그가 드러나는 이중 인코딩까지 처리하려고 최대 2회 돌린다.
  for (let pass = 0; pass < 2; pass++) {
    if (!/[<&]/.test(text)) break;
    const withBreaks = text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n");
    // DOMParser는 스크립트를 실행하지 않으므로 외부 문자열을 파싱해도 안전하다.
    const doc = new DOMParser().parseFromString(withBreaks, "text/html");
    text = doc.body.textContent ?? "";
  }

  return text
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

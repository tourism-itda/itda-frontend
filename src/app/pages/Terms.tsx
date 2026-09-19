import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "제1조 (목적)",
    body: "본 약관은 잇다 관광(이하 '회사')이 제공하는 역사 여행 콘텐츠 및 관련 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
  },
  {
    title: "제2조 (정의)",
    body: "'서비스'란 회사가 제공하는 역사 콘텐츠 탐색, 여행 코스 추천, 플래너, 커뮤니티 등 일체의 기능을 말합니다. '이용자'란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원을 말합니다.",
  },
  {
    title: "제3조 (약관의 효력 및 변경)",
    body: "본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다. 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 사전 공지합니다.",
  },
  {
    title: "제4조 (회원가입)",
    body: "이용자는 회사가 정한 가입 양식에 따라 정보를 입력한 후 본 약관에 동의함으로써 회원가입을 신청합니다. 회사는 실명이 아니거나 타인의 정보를 도용한 경우 이용을 제한할 수 있습니다.",
  },
  {
    title: "제5조 (서비스 이용)",
    body: "서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만 시스템 점검 등 회사가 필요하다고 인정하는 경우 서비스 제공을 일시 중단할 수 있습니다.",
  },
  {
    title: "제6조 (콘텐츠의 정확성)",
    body: "서비스에서 제공되는 장소의 운영시간, 입장료 등 정보는 참고용이며 실제와 다를 수 있습니다. 방문 전 반드시 해당 장소의 공식 정보를 확인하시기 바랍니다.",
  },
  {
    title: "제7조 (개인정보보호)",
    body: "회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력하며, 개인정보의 수집·이용·제공에 관한 사항은 아래 개인정보 처리방침에 따릅니다.",
  },
  {
    title: "제8조 (회원 탈퇴 및 자격 상실)",
    body: "이용자는 언제든지 마이페이지를 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다. 탈퇴 후에는 같은 계정으로 다시 로그인할 수 없으며, 커뮤니티에 공유한 루트와 작성한 리뷰 등 이용자가 게시한 내용은 별도로 삭제되지 않고 남아 있을 수 있습니다.",
  },
  {
    title: "제9조 (면책조항)",
    body: "회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다. 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해서는 개입할 의무가 없습니다.",
  },
  {
    title: "부칙",
    body: "본 약관은 2026년 1월 1일부터 시행합니다.",
  },
];

// 실제 코드(회원가입 요청, 카카오 로그인 응답, 탈퇴 처리, 프로필 화면)로 확인되는 내용만 적었다.
// 보유 기간, 개인정보 보호책임자 등은 아직 정해진 게 없어 넣지 않았다 — 정해지면 추가할 것.
const policySections = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: "회원가입 시 아이디, 비밀번호, 이름, 닉네임, 이메일, 생년월일을 수집합니다. 카카오 계정으로 로그인하는 경우 카카오로부터 회원번호, 이메일, 닉네임, 프로필 이미지를 전달받습니다. 서비스를 이용하는 동안 프로필 사진, 다크 모드 설정, 플래너·북마크·리뷰·공유한 루트 등 이용자가 직접 만든 정보가 함께 저장됩니다.",
  },
  {
    title: "2. 개인정보의 이용 목적",
    body: "회원 식별 및 로그인, 플래너·커뮤니티·리뷰 등 서비스 제공, 비밀번호 재설정 시 본인 확인에 이용합니다.",
  },
  {
    title: "3. 비밀번호의 보호",
    body: "비밀번호는 암호화하여 저장합니다.",
  },
  {
    title: "4. 외부 서비스에 전달되는 정보",
    body: "프로필 사진을 등록하지 않은 경우 기본 프로필 이미지를 만들기 위해 닉네임이 외부 이미지 생성 서비스(DiceBear)에 전달됩니다. 카카오 계정으로 로그인하는 경우 카카오의 개인정보 처리방침이 함께 적용됩니다.",
  },
  {
    title: "5. 이용자의 권리",
    body: "이용자는 마이페이지에서 닉네임과 프로필 사진을 수정할 수 있고, 언제든지 회원 탈퇴를 요청할 수 있습니다. 이름과 이메일은 현재 화면에서 수정할 수 없습니다.",
  },
  {
    title: "6. 회원 탈퇴 시 처리",
    body: "탈퇴하면 계정이 삭제 처리되어 같은 계정으로 다시 로그인할 수 없습니다. 다만 커뮤니티에 공유한 루트와 작성한 리뷰 등 이용자가 게시한 내용은 별도로 삭제되지 않고 남아 있을 수 있으므로, 공유한 루트는 탈퇴 전에 플래너에서 공유를 해제해 주세요.",
  },
];

export default function Terms() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  // 회원가입 화면의 "개인정보 처리방침" 링크(#privacy)로 들어오면 해당 위치로 이동한다.
  // Layout의 scrollTo(0, 0)이 이 effect보다 뒤에 실행되므로 한 틱 뒤에 스크롤한다.
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            // 회원가입 화면에서 새 탭으로 열면 돌아갈 기록이 없으므로 앱 홈으로 보낸다.
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/app"))}
            className="w-11 h-11 -ml-2.5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-heading text-xl">이용약관 및 정책</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <p className="text-sm text-muted-foreground pb-4 border-b border-border">시행일자: 2026. 1. 1.</p>
        <div className="divide-y divide-border">
          {sections.map((section) => (
            <div key={section.title} className="py-4 space-y-1.5">
              <p className="text-sm font-medium">{section.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <h2 id="privacy" className="font-heading text-lg mt-10 pb-4 border-b border-border scroll-mt-32">
          개인정보 처리방침
        </h2>
        <div className="divide-y divide-border">
          {policySections.map((section) => (
            <div key={section.title} className="py-4 space-y-1.5">
              <p className="text-sm font-medium">{section.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "제1조 (목적)",
    body: "본 약관은 역사여행(이하 '회사')이 제공하는 역사 여행 콘텐츠 및 관련 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
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
    body: "회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력하며, 개인정보의 수집·이용·제공에 관한 사항은 별도의 개인정보처리방침에 따릅니다.",
  },
  {
    title: "제8조 (회원 탈퇴 및 자격 상실)",
    body: "이용자는 언제든지 마이페이지를 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다. 탈퇴 시 저장된 플래너, 리뷰 등 이용자 생성 데이터는 복구할 수 없습니다.",
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

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="text-xl">이용약관 및 정책</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <p className="text-xs text-muted-foreground pb-4 border-b border-border">시행일자: 2026. 1. 1.</p>
        <div className="divide-y divide-border">
          {sections.map((section) => (
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

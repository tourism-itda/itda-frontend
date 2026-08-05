import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

const faqs = [
  {
    question: "역사여행은 어떤 서비스인가요?",
    answer:
      "역사여행은 드라마·영화 속 배경이 된 실제 역사 유적지와 촬영지를 소개하고, 이를 바탕으로 여행 코스를 추천해주는 서비스입니다.",
  },
  {
    question: "추천 코스는 어떻게 저장하나요?",
    answer:
      "콘텐츠 상세 페이지 또는 커뮤니티의 루트 상세 페이지에서 '가져오기' 버튼을 누르면 내 플래너에 자동으로 저장됩니다.",
  },
  {
    question: "회원가입 없이도 이용할 수 있나요?",
    answer:
      "콘텐츠 탐색과 코스 열람은 로그인 없이 가능하지만, 플래너 저장·리뷰 작성·커뮤니티 활동을 위해서는 회원가입이 필요합니다.",
  },
  {
    question: "장소 정보가 실제와 다를 수 있나요?",
    answer:
      "운영시간, 입장료 등은 현지 사정에 따라 변경될 수 있습니다. 방문 전 공식 홈페이지나 관할 기관을 통해 최신 정보를 확인해 주세요.",
  },
  {
    question: "비밀번호를 잊어버렸어요.",
    answer: "로그인 화면의 '비밀번호 찾기'를 통해 가입한 이메일로 재설정 링크를 받을 수 있습니다.",
  },
  {
    question: "회원 탈퇴는 어떻게 하나요?",
    answer:
      "마이페이지 > 계정 관리에서 '회원 탈퇴'를 선택하면 탈퇴할 수 있습니다. 탈퇴 시 저장된 플래너와 작성한 리뷰는 모두 삭제됩니다.",
  },
];

export default function QnA() {
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
          <h1 className="text-xl">Q&A</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="border-t border-border">
          <Accordion type="single" collapsible>
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

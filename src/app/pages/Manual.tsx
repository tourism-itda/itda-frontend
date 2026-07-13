import { useNavigate } from "react-router";
import { ArrowLeft, Compass, MapPinned, CalendarCheck, Users } from "lucide-react";

const steps = [
  {
    icon: Compass,
    title: "1. 콘텐츠 탐색하기",
    body: "홈 화면에서 좋아하는 드라마·영화를 검색하거나 왕조·테마별로 둘러보세요. 각 콘텐츠 상세 페이지에서 실제 촬영지와 배경이 된 역사 유적지를 확인할 수 있습니다.",
  },
  {
    icon: MapPinned,
    title: "2. 여행 코스 확인하기",
    body: "콘텐츠와 연결된 추천 코스를 열람하면 방문 순서, 소요 시간, 주소, 운영시간 등 상세 정보를 볼 수 있습니다. 지도 앱 연동을 통해 바로 길찾기도 가능합니다.",
  },
  {
    icon: CalendarCheck,
    title: "3. 플래너에 저장하기",
    body: "마음에 드는 코스는 '가져오기' 버튼으로 내 플래너에 저장하세요. 마이페이지 하단 내비게이션의 플래너 탭에서 저장한 일정을 언제든 다시 확인할 수 있습니다.",
  },
  {
    icon: Users,
    title: "4. 커뮤니티 이용하기",
    body: "다른 여행자가 직접 등록한 루트를 둘러보고, 다녀온 여행에 별점과 후기를 남겨 보세요. 나만의 코스를 등록해 다른 이용자와 공유할 수도 있습니다.",
  },
];

export default function Manual() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="text-xl">사용설명서</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        <p className="text-sm text-muted-foreground px-1">
          역사여행을 처음 이용하시나요? 아래 순서를 따라가면 쉽게 나만의 역사 여행을 계획할 수 있습니다.
        </p>
        {steps.map((step) => (
          <div key={step.title} className="bg-card border border-border rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <step.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

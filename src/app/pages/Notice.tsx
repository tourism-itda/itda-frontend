import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Separator } from "../components/ui/separator";

const notices = [
  {
    id: "n1",
    tag: "업데이트",
    title: "커뮤니티 루트 리뷰 기능이 추가되었습니다",
    date: "2026. 6. 28.",
    body: "이제 다른 여행자가 등록한 루트에 별점과 후기를 남길 수 있습니다. 커뮤니티 탭의 루트 상세 페이지에서 확인해 보세요.",
  },
  {
    id: "n2",
    tag: "점검",
    title: "서버 정기 점검 안내 (7월 10일)",
    date: "2026. 6. 20.",
    body: "보다 안정적인 서비스 제공을 위해 2026년 7월 10일 새벽 2시부터 4시까지 서버 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 일시적으로 제한될 수 있습니다.",
  },
  {
    id: "n3",
    tag: "이벤트",
    title: "여름맞이 역사여행 코스 공모전 안내",
    date: "2026. 6. 5.",
    body: "나만의 역사 여행 코스를 등록하고 공유해 보세요. 우수 코스로 선정되면 소정의 상품을 드립니다. 자세한 내용은 커뮤니티 공지를 참고해 주세요.",
  },
  {
    id: "n4",
    tag: "안내",
    title: "개인정보처리방침 개정 안내",
    date: "2026. 5. 12.",
    body: "이용자 개인정보 보호를 강화하기 위해 개인정보처리방침 일부 내용이 개정되었습니다. 자세한 내용은 이용약관 및 정책 페이지에서 확인하실 수 있습니다.",
  },
  {
    id: "n5",
    tag: "업데이트",
    title: "다크 모드가 지원됩니다",
    date: "2026. 4. 2.",
    body: "마이페이지 > 설정에서 다크 모드를 켜고 끌 수 있습니다. 야간에도 편안하게 서비스를 이용해 보세요.",
  },
];

export default function Notice() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

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
          <h1 className="text-xl">공지사항</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {notices.map((notice, idx) => {
            const isOpen = openId === notice.id;
            return (
              <div key={notice.id}>
                <button
                  onClick={() => setOpenId(isOpen ? null : notice.id)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-primary font-medium">{notice.tag}</span>
                      <span className="text-xs text-muted-foreground">{notice.date}</span>
                    </div>
                    <p className="text-sm font-normal truncate">{notice.title}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{notice.body}</p>
                  </div>
                )}
                {idx < notices.length - 1 && <Separator />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

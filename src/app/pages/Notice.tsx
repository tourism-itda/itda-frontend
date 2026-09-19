import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";

interface NoticeItem {
  id: string;
  tag: string;
  title: string;
  date: string;
  body: string;
}

// 예전에는 실제 공지가 아닌 샘플 5건이 들어 있었다(지난 점검 일정, 진행 여부가 확인되지 않은
// 공모전 등). 사실과 다른 안내가 되므로 비웠다 — 백엔드 공지 API가 생기기 전까지는 여기에
// 실제 공지만 추가한다.
const notices: NoticeItem[] = [];

export default function Notice() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 -ml-2.5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-heading text-xl">공지사항</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {notices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">등록된 공지사항이 없어요</p>
          </div>
        )}
        {notices.length > 0 && (
          <div className="border-t border-border">
            {notices.map((notice) => {
              const isOpen = openId === notice.id;
              return (
                <div key={notice.id} className="border-b border-border">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

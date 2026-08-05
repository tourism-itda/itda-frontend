import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Share2, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { PageTitle } from "../components/PageTitle";

export default function Planner() {
  const navigate = useNavigate();

  const [savedItineraries, setSavedItineraries] = useState([
    {
      id: "i1",
      title: "뿌리깊은 나무 테마 여행",
      contentTitle: "뿌리깊은 나무",
      date: "2026. 7. 15",
      placeCount: 4,
      thumbnail: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      region: "서울 종로구",
    },
    {
      id: "i2",
      title: "왕의 남자 촬영지 투어",
      contentTitle: "왕의 남자",
      date: "2026. 8. 3",
      placeCount: 5,
      thumbnail: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      region: "경기도 수원",
    },
    {
      id: "i3",
      title: "육룡이 나르샤 역사탐방",
      contentTitle: "육룡이 나르샤",
      date: "2026. 9. 12",
      placeCount: 6,
      thumbnail: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      region: "전라북도 전주",
    },
  ]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeleteTargetId(id);
  }

  function handleConfirmDelete() {
    if (!deleteTargetId) return;
    setSavedItineraries((prev) => prev.filter((item) => item.id !== deleteTargetId));
    setDeleteTargetId(null);
  }

  return (
    <div className="min-h-screen">
      {/* 헤더: 내 플래너 + 일정 수 한 줄 */}
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <PageTitle
            eyebrow="Planner"
            title="내 플래너"
            suffix={<span className="text-sm text-muted-foreground">일정 {savedItineraries.length}개</span>}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-7">
        {savedItineraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-6">저장된 일정이 없습니다</p>
            <Button variant="outline" onClick={() => navigate("/app")}>탐색하기</Button>
          </div>
        ) : (
          <div className="border-t border-border">
            {savedItineraries.map((item) => (
              <div
                key={item.id}
                className="group flex gap-4 py-5 border-b border-border cursor-pointer"
                onClick={() => navigate(`/app/itinerary/${item.id}`)}
              >
                {/* 썸네일 */}
                <div className="w-24 h-24 rounded-sm border border-border overflow-hidden shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0 py-1">
                  <p className="text-xs text-muted-foreground mb-1.5">{item.contentTitle}</p>
                  <p className="font-heading leading-snug mb-2.5 line-clamp-2">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.date} · {item.region} · {item.placeCount}곳
                  </p>
                </div>

                {/* 공유 + 삭제 */}
                <div className="flex flex-col items-center gap-1 self-center shrink-0">
                  <div
                    role="button"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast("커뮤니티에 공유되었습니다!");
                    }}
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div
                    role="button"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    onClick={(e) => handleDeleteClick(e, item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteTargetId !== null}
        title="이 일정을 삭제하시겠습니까?"
        description="삭제한 일정은 복구할 수 없습니다."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

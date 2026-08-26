import { useParams, useNavigate } from "react-router";
import { ArrowLeft, LogIn, MapPinOff, ShieldAlert, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useDynastyDetail } from "../lib/useDynastyDetail";
import { ExploreCard, ExploreItem, personTypeLabel } from "./Home";

// 홈 화면 인물별 탭의 나라별 그룹에서 "전체보기"를 누르면 오는 페이지.
// GET /explore/kingdoms/{kingdom}(No.22) + GET /explore/kingdoms/{kingdom}/persons(No.23)를
// 함께 쓰는 useDynastyDetail을 그대로 재사용하고, 카드 UI는 Home의 ExploreCard를 재사용한다.
export default function DynastyPersons() {
  const { id: kingdomCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { status, kingdom, persons } = useDynastyDetail(kingdomCode);

  const items: ExploreItem[] = persons.map((p) => ({
    id: String(p.person_id),
    title: p.name,
    tag: "인물",
    subtitle: personTypeLabel[p.type] ?? p.type,
    description: p.description,
    image: p.image_url,
    kingdomCode: p.kingdom,
    href: `/app/person/${p.person_id}`,
  }));

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 -ml-1.5 rounded-full hover:bg-muted flex items-center justify-center transition-colors mb-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {status === "loading" && (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-7 w-40 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-2xl mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          </>
        )}

        {status === "unauthenticated" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">로그인이 필요한 기능이에요</p>
            <p className="text-sm text-muted-foreground/70 mb-5">로그인하고 인물 목록을 확인해보세요</p>
            <Button onClick={() => navigate("/login")}>로그인하기</Button>
          </div>
        )}

        {status === "not-found" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">존재하지 않는 시대예요</p>
            <Button variant="outline" onClick={() => navigate("/app")} className="mt-4">
              홈으로
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MapPinOff className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">인물 정보를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && kingdom && (
          <>
            <div className="mb-6">
              <p className="text-xs tracking-[0.2em] text-primary font-bold uppercase mb-2">Figures</p>
              <div className="flex items-baseline gap-2">
                <h1 className="font-heading text-2xl font-black">{kingdom.name} 인물</h1>
                <span className="text-sm text-muted-foreground">총 {items.length}개</span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">아직 등록된 인물이 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <ExploreCard key={item.id} item={item} onClick={() => navigate(item.href)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

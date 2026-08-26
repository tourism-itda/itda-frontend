import { useParams, useNavigate } from "react-router";
import { ArrowLeft, LogIn, MapPinOff, ShieldAlert, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useDynastyDetail } from "../lib/useDynastyDetail";

// PersonResponse.type(enum 코드)의 한글 라벨. Home.tsx의 personTypeLabel과 동일한 값을 쓴다
// (explore/enums/PersonType.java 기준 — 백엔드가 라벨을 안 내려주므로 프론트에서 관리).
const personTypeLabel: Record<string, string> = {
  KING: "왕",
  GENERAL: "장군",
  SCHOLAR: "학자",
  MONK: "승려",
  POLITICIAN: "정치가",
  INVENTOR: "과학자·발명가",
  INDEPENDENCE_ACTIVIST: "독립운동가",
};

export default function DynastyDetail() {
  // route param 이름은 :id지만 실제 값은 Kingdom enum 코드(예: "GORYEO")여야 한다.
  const { id: kingdomCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { status, kingdom, persons } = useDynastyDetail(kingdomCode);

  return (
    <div className="min-h-screen pb-8">
      {/* 히어로 */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-muted">
        {status === "done" && kingdom?.image_url && (
          <img src={kingdom.image_url} alt="" className="w-full h-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-navy/50 backdrop-blur-sm hanji-noise flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-ivory/70 text-sm mb-1">
            {status === "done" && kingdom?.time_period ? kingdom.time_period : "시대"}
          </p>
          <h1 className="text-ivory text-3xl leading-tight">
            {status === "done" && kingdom ? kingdom.name : " "}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8 mt-6">
        {status === "loading" && (
          <div className="space-y-3 py-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">로그인이 필요한 기능이에요</p>
            <p className="text-sm text-muted-foreground/70 mb-5">로그인하고 시대별 이야기를 확인해보세요</p>
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
            <p className="text-muted-foreground mb-1">시대 정보를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && kingdom && (
          <>
            {/* 설명: KingdomDetailResponse.description은 현재 데이터상 항상 채워져 있지만
                (HistoricalKingdomData가 전체 Kingdom enum을 다 커버), null/미제공 케이스도 방어적으로 다룬다. */}
            <section>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {kingdom.description || "이 시대에 대한 자세한 소개는 준비 중이에요."}
              </p>
            </section>

            {/* 관련 인물 (No.23 GET /explore/kingdoms/{kingdom}/persons) */}
            <section>
              <h2 className="mb-5">관련 인물</h2>
              {persons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">아직 등록된 인물이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-border border-t border-b border-border">
                  {persons.map((person) => (
                    <button
                      key={person.person_id}
                      onClick={() => navigate(`/app/person/${person.person_id}`)}
                      className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left group transition-colors hover:bg-muted/40 rounded-xl"
                    >
                      <div className="min-w-0">
                        <p className="font-heading mb-1 group-hover:text-primary transition-colors">
                          {person.name}
                        </p>
                        {person.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {person.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {personTypeLabel[person.type] ?? person.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* CTA */}
            <div className="pt-2 pb-4">
              <Button onClick={() => navigate("/app/planner")} className="w-full" variant="outline">
                여행 일정 만들기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useParams, useNavigate } from "react-router";
import { ArrowLeft, LogIn, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { usePersonDetail } from "../lib/usePersonDetail";

// PersonResponse.type(enum 코드)의 한글 라벨(explore/enums/PersonType.java 기준).
const personTypeLabel: Record<string, string> = {
  KING: "왕",
  GENERAL: "장군",
  SCHOLAR: "학자",
  MONK: "승려",
  POLITICIAN: "정치가",
  INVENTOR: "과학자·발명가",
  INDEPENDENCE_ACTIVIST: "독립운동가",
};

export default function PersonDetail() {
  const { id: personId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { status, person, kingdomName } = usePersonDetail(personId);

  const role =
    person && [personTypeLabel[person.type] ?? person.type, kingdomName].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen pb-8">
      {/* 히어로 */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-navy/50 backdrop-blur-sm hanji-noise flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="absolute bottom-5 left-5 right-5">
          {role && <p className="text-ivory/70 text-sm mb-1">{role}</p>}
          <h1 className="text-ivory text-3xl leading-tight">{status === "done" && person ? person.name : " "}</h1>
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
            <p className="text-sm text-muted-foreground/70 mb-5">로그인하고 인물 이야기를 확인해보세요</p>
            <Button onClick={() => navigate("/login")}>로그인하기</Button>
          </div>
        )}

        {status === "not-found" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">존재하지 않는 인물이에요</p>
            <Button variant="outline" onClick={() => navigate("/app")} className="mt-4">
              홈으로
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">인물 정보를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && person && (
          <>
            {/* 설명 */}
            <section>
              <p className="text-foreground leading-relaxed">
                {person.description ?? "이 인물에 대한 자세한 소개는 준비 중이에요."}
              </p>
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

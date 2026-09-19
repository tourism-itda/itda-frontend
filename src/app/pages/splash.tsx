import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { getSession } from "../lib/auth";
import { BrandMark } from "../components/BrandMark";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // 홈은 비로그인도 볼 수 있는 공개 화면이라 로그인 여부와 무관하게 항상 /app으로 보낸다.
    // 세션 확인은 만료된 토큰/user 캐시를 정리하려고 백그라운드로만 돌리고, 결과는 기다리지 않는다.
    getSession().catch(() => {});

    const timer = setTimeout(() => {
      if (!cancelled) navigate("/app", { replace: true });
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center hanji-noise relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, var(--primary-700), var(--primary-500))" }}
    >
      {/* 은은한 배경 장식 (자개 톤 원형 광원) */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative"
      >
        <BrandMark className="w-16 h-16 mx-auto mb-5 shadow-lg" />
        <h1 className="font-heading text-4xl md:text-5xl text-white mb-3">
          잇다 관광
        </h1>
        <p className="text-white/70">사극 속 이야기를 여행으로 이어보세요</p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

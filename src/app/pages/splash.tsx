import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { getSession } from "../lib/auth";
import { BrandMark } from "../components/BrandMark";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const session = await getSession();
        if (cancelled) return;
        navigate(session.user ? "/app" : "/login");
      } catch {
        if (!cancelled) navigate("/login");
      }
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

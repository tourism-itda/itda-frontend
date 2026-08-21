import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { getSession } from "../lib/auth";

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
    <div className="min-h-screen flex items-center justify-center bg-terracotta">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="font-heading text-4xl md:text-5xl text-gold mb-4">
          사극 여행 플래너
        </h1>
        <p className="text-ivory/60">역사를 여행하다</p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gold"
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

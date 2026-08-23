import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { loginWithKakao } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function KakaoCallback() {
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      toast("카카오 로그인에 실패했어요.");
      navigate("/login", { replace: true });
      return;
    }

    loginWithKakao(code)
      .then(() => {
        navigate("/app", { replace: true });
      })
      .catch((err) => {
        toast(err instanceof ApiError ? err.message : "카카오 로그인에 실패했어요.");
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">카카오 로그인 처리 중...</p>
    </div>
  );
}

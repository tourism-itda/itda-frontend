import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { AuthLayout } from "../components/AuthLayout";
import { login } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login(username, password, rememberMe);
      // 401/403으로 /login에 리다이렉트된 경우 원래 보려던 화면(state.from)으로 돌아간다.
      const from = (location.state as { from?: string } | null)?.from ?? "/app";
      navigate(from, { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    }
  };

  const handleKakaoLogin = () => {
    const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      toast("카카오 로그인 설정이 올바르지 않아요.");
      return;
    }
    const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    window.location.href = authorizeUrl.toString();
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <h2 className="font-heading text-2xl font-black mb-1.5">다시 만나 반가워요</h2>
        <p className="text-muted-foreground text-sm">계정 정보를 입력하고 로그인해주세요</p>
      </div>

      {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">아이디</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="h-11"
              />
            </div>

            {/* 자동로그인 — 중앙 */}
            <div className="flex items-center justify-center gap-2 py-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                자동 로그인
              </Label>
            </div>

            <Button type="submit" className="w-full h-11">로그인</Button>
          </form>

          {/* 구분선 */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* 카카오 로그인: 카카오 인가 페이지로 이동 후 /oauth/kakao/callback에서 code를 받아
              POST /api/auth/kakao로 로그인을 완료한다(lib/auth.ts loginWithKakao 참고). */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full h-11 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#000">
              <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.69 1.743 5.053 4.384 6.478l-.867 3.168a.5.5 0 00.733.566l3.73-2.232C10.582 18.905 11.279 19 12 19c5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
            </svg>
            <span className="text-sm font-medium text-[#000]">카카오 로그인</span>
          </button>

          {/* 하단 링크 — 폰트 통일 */}
          <div className="flex justify-center gap-4 mt-6">
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              비밀번호 찾기
            </Link>
            <span className="text-sm text-border">|</span>
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              회원가입
            </Link>
          </div>
    </AuthLayout>
  );
}

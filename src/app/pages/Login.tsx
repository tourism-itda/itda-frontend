import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { BrandMark } from "../components/BrandMark";
import { login } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login(username, password);
      navigate("/app");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-[var(--shadow-lg)]">

          {/* 로고: 아이콘 + 앱명 한 줄 / 부제목 별도 줄 */}
          <div className="flex flex-col items-center mb-9">
            <div className="flex items-center gap-2.5 mb-2">
              <BrandMark className="w-10 h-10 text-lg" />
              <span className="font-heading text-2xl font-black text-primary">잇다 관광</span>
            </div>
            <p className="text-muted-foreground text-sm">사극 속 이야기를 따라 떠나는 여행</p>
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

          {/* 카카오 로그인 */}
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="w-full h-11 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#000">
              <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.69 1.743 5.053 4.384 6.478l-.867 3.168a.5.5 0 00.733.566l3.73-2.232C10.582 18.905 11.279 19 12 19c5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
            </svg>
            <span className="text-sm font-medium text-[#000]">카카오 로그인</span>
          </button>

          {/* 하단 링크 — 폰트 통일 */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => toast("비밀번호 찾기 기능은 준비 중입니다.")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              비밀번호 찾기
            </button>
            <span className="text-sm text-border">|</span>
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

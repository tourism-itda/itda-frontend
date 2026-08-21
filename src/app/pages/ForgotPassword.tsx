import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft } from "lucide-react";
import { requestPasswordReset, verifyPasswordResetCode, resetPassword } from "../lib/auth";
import { ApiError } from "../lib/api";

type Step = "request" | "verify" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !email) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(loginId, email);
      toast("인증코드를 이메일로 보냈어요.");
      setStep("verify");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "인증코드 발송에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setSubmitting(true);
    try {
      const res = await verifyPasswordResetCode(loginId, code);
      setResetToken(res.resetToken);
      toast("인증되었습니다. 새 비밀번호를 입력해주세요.");
      setStep("reset");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "인증코드 확인에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(resetToken, newPassword);
      toast("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      navigate("/login");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "비밀번호 변경에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-[var(--shadow-lg)]">
          <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">로그인으로 돌아가기</span>
          </Link>
          <h1 className="text-xl mb-6">비밀번호 찾기</h1>

          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="loginId">아이디</Label>
                <Input
                  id="loginId"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">가입한 이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? "발송 중..." : "인증코드 받기"}
              </Button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-muted-foreground">{email}로 받은 인증코드를 입력해주세요.</p>
              <div className="space-y-1.5">
                <Label htmlFor="code">인증코드</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6자리 숫자"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? "확인 중..." : "인증코드 확인"}
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8자 이상 입력"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

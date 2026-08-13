import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { signup } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    username: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 입력 시 에러 제거
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const checkUsername = () => {
    // Mock 중복 확인
    if (formData.username === "existing") {
      setErrors((prev) => ({ ...prev, username: "이미 사용 중인 아이디입니다." }));
    } else if (formData.username) {
      toast("사용 가능한 아이디입니다.");
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // 유효성 검사
    if (!formData.name) newErrors.name = "이름을 입력해주세요.";
    if (!formData.birthdate) newErrors.birthdate = "생년월일을 입력해주세요.";
    if (!formData.username) newErrors.username = "아이디를 입력해주세요.";
    if (!formData.password) newErrors.password = "비밀번호를 입력해주세요.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    if (!formData.nickname) newErrors.nickname = "닉네임을 입력해주세요.";
    if (!formData.email) newErrors.email = "이메일을 입력해주세요.";
    if (!agreedToTerms) newErrors.terms = "약관에 동의해주세요.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signup({
        loginId: formData.username,
        password: formData.password,
        name: formData.name,
        nickname: formData.nickname,
        email: formData.email,
        birthDate: formData.birthdate,
        agreedToTerms,
      });
      navigate("/login");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* 데스크탑: 중앙 카드형 폼 */}
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
          {/* 헤더 */}
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">돌아가기</span>
            </Link>
            <h1 className="text-2xl mb-2">회원가입</h1>
            <p className="text-muted-foreground text-sm">
              잇다 관광과 함께 사극 속 장소를 탐험해보세요
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">생년월일</Label>
              <Input
                id="birthdate"
                name="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={handleChange}
                className={errors.birthdate ? "border-destructive" : ""}
              />
              {errors.birthdate && (
                <p className="text-xs text-destructive">{errors.birthdate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="영문, 숫자 조합"
                  className={errors.username ? "border-destructive flex-1" : "flex-1"}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkUsername}
                  className="shrink-0"
                >
                  중복확인
                </Button>
              </div>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8자 이상 입력"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호 재입력"
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="다른 사용자에게 보여질 이름"
                className={errors.nickname ? "border-destructive" : ""}
              />
              {errors.nickname && (
                <p className="text-xs text-destructive">{errors.nickname}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  <span className="text-foreground">서비스 이용약관</span> 및{" "}
                  <span className="text-foreground">개인정보 처리방침</span>에 동의합니다
                </Label>
              </div>
              {errors.terms && (
                <p className="text-xs text-destructive">{errors.terms}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11">
              가입하기
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

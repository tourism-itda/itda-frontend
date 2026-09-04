import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import {
  ChevronRight,
  Moon,
  HelpCircle,
  FileText,
  Bell,
  BookOpen,
  Bookmark,
  LogOut,
  UserX,
  Camera,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import {
  getMyProfile,
  updateMyProfile,
  logout,
  deleteMyAccount,
  getAvatarPresignedUrl,
  uploadAvatarFile,
  UserProfileResponse,
} from "../lib/auth";
import { ApiError } from "../lib/api";

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    getMyProfile()
      .then((me) => {
        if (cancelled) return;
        setProfile(me);
        setNicknameInput(me.nickname);
        document.documentElement.classList.toggle("dark", me.darkMode);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
        } else {
          toast(err instanceof ApiError ? err.message : "내 정보를 불러오지 못했어요.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSave = async () => {
    if (!profile) return;
    if (!nicknameInput.trim()) {
      toast("닉네임을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfile({ nickname: nicknameInput.trim() });
      setProfile(updated);
      setNicknameInput(updated.nickname);
      setIsEditing(false);
      toast("프로필이 저장되었습니다.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "프로필 저장에 실패했어요.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (uploadingAvatar) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const { presignedUrl, publicUrl } = await getAvatarPresignedUrl(file.type);
      await uploadAvatarFile(presignedUrl, file);
      const updated = await updateMyProfile({ profileUrl: publicUrl });
      setProfile(updated);
      toast("프로필 사진이 변경되었습니다.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "프로필 사진 업로드에 실패했어요.");
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleDarkMode = async (checked: boolean) => {
    if (!profile) return;
    document.documentElement.classList.toggle("dark", checked);
    setProfile((prev) => (prev ? { ...prev, darkMode: checked } : prev));
    try {
      const updated = await updateMyProfile({ darkMode: checked });
      setProfile(updated);
    } catch (err) {
      document.documentElement.classList.toggle("dark", !checked);
      setProfile((prev) => (prev ? { ...prev, darkMode: !checked } : prev));
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "다크 모드 설정을 저장하지 못했어요.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await deleteMyAccount();
      setShowWithdrawConfirm(false);
      navigate("/login", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setShowWithdrawConfirm(false);
        navigate("/login", { replace: true });
      } else {
        toast(err instanceof ApiError ? err.message : "회원 탈퇴에 실패했어요.");
      }
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  const avatarUrl = profile.profileUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.nickname}`;

  const menuItems = [
    { icon: Bookmark, label: "내 북마크", path: "/app/bookmarks" },
    { icon: HelpCircle, label: "Q&A", path: "/app/qna" },
    { icon: FileText, label: "이용약관 및 정책", path: "/app/terms" },
    { icon: Bell, label: "공지사항", path: "/app/notice" },
    { icon: BookOpen, label: "사용설명서", path: "/app/manual" },
  ];

  const ProfileForm = ({ suffix = "" }: { suffix?: string }) => (
    <div className="space-y-4 px-1">
      <div className="space-y-1.5">
        <Label htmlFor={`nickname${suffix}`} className="text-sm font-normal text-muted-foreground">닉네임</Label>
        <Input
          id={`nickname${suffix}`}
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
          disabled={!isEditing || saving}
          className="h-11"
        />
      </div>
      {/* 이름/이메일은 백엔드 PATCH /users/me가 지원하지 않는 필드라 읽기 전용으로만 표시한다 */}
      <div className="space-y-1.5">
        <Label htmlFor={`name${suffix}`} className="text-sm font-normal text-muted-foreground">이름</Label>
        <Input id={`name${suffix}`} value={profile.name} disabled className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`email${suffix}`} className="text-sm font-normal text-muted-foreground">이메일</Label>
        <Input id={`email${suffix}`} type="email" value={profile.email} disabled className="h-11" />
      </div>
      {/* 프로필 수정 버튼: 이메일과 간격 */}
      <div className="pt-3">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setNicknameInput(profile.nickname);
              }}
              disabled={saving}
              className="flex-1"
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">프로필 수정</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <p className="text-xs tracking-[0.2em] text-gold font-medium uppercase mb-1">My Page</p>
          <h1 className="font-heading text-xl">마이페이지</h1>
        </div>
      </div>

      {/* 모바일 */}
      <div className="lg:hidden">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

          {/* 프로필 카드 */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col items-center mb-7">
              <div className="relative">
                <img src={avatarUrl} alt={profile.nickname} className="w-20 h-20 rounded-full border-2 border-border" />
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-60"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <ProfileForm />
          </div>

          {/* 설정 */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs tracking-wide uppercase text-muted-foreground font-normal mb-3">설정</p>
              {/* 다크모드 */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm">다크 모드</span>
                </div>
                <Switch checked={profile.darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {menuItems.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => navigate(item.path)}
                  className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-normal">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                {idx < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          {/* 계정 관리 */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-normal">로그아웃</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Separator />
            {/* 회원탈퇴: 다크모드에서 채도 낮은 핑크빛 레드 */}
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors text-rose-500 dark:text-rose-400"
            >
              <div className="flex items-center gap-3">
                <UserX className="w-4 h-4 shrink-0" />
                <span className="text-sm font-normal">회원 탈퇴</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground py-2">잇다 관광 v1.0.0</p>
        </div>
      </div>

      {/* 데스크탑 */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[320px_1fr] gap-6">
            {/* 좌측 프로필 */}
            <div className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-24">
              <div className="flex flex-col items-center mb-7">
                <div className="relative">
                  <img src={avatarUrl} alt={profile.nickname} className="w-20 h-20 rounded-full border-2 border-gold" />
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <ProfileForm suffix="-d" />
            </div>

            {/* 우측 */}
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground font-normal mb-3">설정</p>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm">다크 모드</p>
                        <p className="text-sm text-muted-foreground font-normal">화면 테마를 어둡게 변경합니다</p>
                      </div>
                    </div>
                    <Switch checked={profile.darkMode} onCheckedChange={toggleDarkMode} />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {menuItems.map((item, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => navigate(item.path)}
                      className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-normal">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {idx < menuItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-normal">로그아웃</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <Separator />
                <button
                  onClick={() => setShowWithdrawConfirm(true)}
                  className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors text-rose-500 dark:text-rose-400"
                >
                  <div className="flex items-center gap-3">
                    <UserX className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-normal">회원 탈퇴</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground py-2">잇다 관광 v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={showWithdrawConfirm}
        title="정말 탈퇴하시겠습니까?"
        description="탈퇴하면 저장된 정보와 플래너, 북마크가 모두 삭제되며 복구할 수 없습니다."
        confirmLabel={withdrawing ? "탈퇴 처리 중..." : "탈퇴"}
        onConfirm={handleWithdraw}
        onCancel={() => setShowWithdrawConfirm(false)}
      />
    </div>
  );
}

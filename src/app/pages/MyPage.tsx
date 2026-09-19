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
import { ApiError, isLoginRequiredError } from "../lib/api";
import { getAvatarUrl, getProxiedImageUrl } from "../lib/imageProxy";
import { applyDarkMode, resetDarkMode } from "../lib/theme";

// 카메라 버튼은 아바타에 얹는 28px 배지라 그대로는 터치 영역이 작다. ::before로 44px까지 넓힌다.
const CAMERA_BUTTON_CLASS =
  "absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-60 before:absolute before:-inset-2";

interface ProfileFormProps {
  suffix?: string;
  nicknameInput: string;
  onNicknameChange: (value: string) => void;
  isEditing: boolean;
  saving: boolean;
  profileName: string;
  profileEmail: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}

// MyPage 렌더 함수 안에서 정의돼 있었다 — 렌더될 때마다 새 컴포넌트 타입이 생겨서 React가
// 매번 이 서브트리를 통째로 언마운트/리마운트했다. 그래서 Input에 한 글자만 쳐도(리렌더)
// focus가 날아가 매번 다시 클릭해야 했다. 컴포넌트 정체성을 유지하려면 바깥으로 빼야 한다.
function ProfileForm({
  suffix = "",
  nicknameInput,
  onNicknameChange,
  isEditing,
  saving,
  profileName,
  profileEmail,
  onStartEdit,
  onCancelEdit,
  onSave,
}: ProfileFormProps) {
  return (
    <div className="space-y-4 px-1">
      <div className="space-y-1.5">
        <Label htmlFor={`nickname${suffix}`} className="text-sm font-normal text-muted-foreground">닉네임</Label>
        <Input
          id={`nickname${suffix}`}
          value={nicknameInput}
          onChange={(e) => onNicknameChange(e.target.value)}
          disabled={!isEditing || saving}
          className="h-11"
        />
      </div>
      {/* 이름/이메일은 백엔드 PATCH /users/me가 지원하지 않는 필드라 읽기 전용으로만 표시한다 */}
      <div className="space-y-1.5">
        <Label htmlFor={`name${suffix}`} className="text-sm font-normal text-muted-foreground">이름</Label>
        <Input id={`name${suffix}`} value={profileName} disabled className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`email${suffix}`} className="text-sm font-normal text-muted-foreground">이메일</Label>
        <Input id={`email${suffix}`} type="email" value={profileEmail} disabled className="h-11" />
      </div>
      {/* 프로필 수정 버튼: 이메일과 간격 */}
      <div className="pt-3">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancelEdit} disabled={saving} className="flex-1">
              취소
            </Button>
            <Button onClick={onSave} disabled={saving} className="flex-1">
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={onStartEdit} className="w-full">프로필 수정</Button>
        )}
      </div>
    </div>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);

    getMyProfile()
      .then((me) => {
        if (cancelled) return;
        setProfile(me);
        setNicknameInput(me.nickname);
        applyDarkMode(me.darkMode);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isLoginRequiredError(err)) {
          navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
        } else {
          setLoadFailed(true);
          toast(err instanceof ApiError ? err.message : "내 정보를 불러오지 못했어요.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, reloadKey]);

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
      if (isLoginRequiredError(err)) {
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
      if (isLoginRequiredError(err)) {
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
    applyDarkMode(checked);
    setProfile((prev) => (prev ? { ...prev, darkMode: checked } : prev));
    try {
      const updated = await updateMyProfile({ darkMode: checked });
      setProfile(updated);
    } catch (err) {
      applyDarkMode(!checked);
      setProfile((prev) => (prev ? { ...prev, darkMode: !checked } : prev));
      if (isLoginRequiredError(err)) {
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
      resetDarkMode();
      navigate("/login", { replace: true });
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await deleteMyAccount();
      resetDarkMode();
      setShowWithdrawConfirm(false);
      navigate("/login", { replace: true });
    } catch (err) {
      if (isLoginRequiredError(err)) {
        setShowWithdrawConfirm(false);
        navigate("/login", { replace: true });
      } else {
        toast(err instanceof ApiError ? err.message : "회원 탈퇴에 실패했어요.");
      }
    } finally {
      setWithdrawing(false);
    }
  };

  // profile이 없는데 실패도 아니면 로그인 화면으로 이동 중인 것이므로 로딩 화면을 유지한다.
  if (loading || (!profile && !loadFailed)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  // 로그인 오류가 아닌 조회 실패(서버 오류 등) — 로딩 문구에 갇히지 않게 재시도 버튼을 준다.
  if (loadFailed || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-muted-foreground mb-1">내 정보를 불러오지 못했어요</p>
        <p className="text-sm text-muted-foreground/70 mb-5">잠시 후 다시 시도해주세요</p>
        <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>다시 시도</Button>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(profile.profileUrl, profile.nickname);

  const menuItems = [
    { icon: Bookmark, label: "내 북마크", path: "/app/bookmarks" },
    { icon: HelpCircle, label: "Q&A", path: "/app/qna" },
    { icon: FileText, label: "이용약관 및 정책", path: "/app/terms" },
    { icon: Bell, label: "공지사항", path: "/app/notice" },
    { icon: BookOpen, label: "사용설명서", path: "/app/manual" },
  ];

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNicknameInput(profile.nickname);
  };

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
                <img src={getProxiedImageUrl(avatarUrl)} alt={profile.nickname} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full border-2 border-border" />
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  aria-label="프로필 사진 변경"
                  className={CAMERA_BUTTON_CLASS}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <ProfileForm
              nicknameInput={nicknameInput}
              onNicknameChange={setNicknameInput}
              isEditing={isEditing}
              saving={saving}
              profileName={profile.name}
              profileEmail={profile.email}
              onStartEdit={() => setIsEditing(true)}
              onCancelEdit={handleCancelEdit}
              onSave={handleSave}
            />
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
                  <img src={getProxiedImageUrl(avatarUrl)} alt={profile.nickname} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full border-2 border-gold" />
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    aria-label="프로필 사진 변경"
                    className={CAMERA_BUTTON_CLASS}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <ProfileForm
                suffix="-d"
                nicknameInput={nicknameInput}
                onNicknameChange={setNicknameInput}
                isEditing={isEditing}
                saving={saving}
                profileName={profile.name}
                profileEmail={profile.email}
                onStartEdit={() => setIsEditing(true)}
                onCancelEdit={handleCancelEdit}
                onSave={handleSave}
              />
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
        description="탈퇴하면 같은 계정으로 다시 로그인할 수 없습니다. 커뮤니티에 공유한 루트와 작성한 리뷰는 남아 있을 수 있으니, 공유한 루트는 탈퇴 전에 플래너에서 공유를 해제해 주세요."
        confirmLabel={withdrawing ? "탈퇴 처리 중..." : "탈퇴"}
        onConfirm={handleWithdraw}
        onCancel={() => setShowWithdrawConfirm(false)}
      />
    </div>
  );
}

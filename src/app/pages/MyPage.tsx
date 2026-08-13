import { useState } from "react";
import { useNavigate } from "react-router";
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

export default function MyPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [profile, setProfile] = useState({
    name: "홍길동",
    nickname: "역사덕후",
    email: "hong@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  });

  const handleSave = () => setIsEditing(false);

  const handleChangeAvatar = () => {
    setProfile((prev) => ({
      ...prev,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    }));
  };

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
  };

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
          value={profile.nickname}
          onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
          disabled={!isEditing}
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`name${suffix}`} className="text-sm font-normal text-muted-foreground">이름</Label>
        <Input
          id={`name${suffix}`}
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          disabled={!isEditing}
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`email${suffix}`} className="text-sm font-normal text-muted-foreground">이메일</Label>
        <Input
          id={`email${suffix}`}
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          disabled={!isEditing}
          className="h-11"
        />
      </div>
      {/* 프로필 수정 버튼: 이메일과 간격 */}
      <div className="pt-3">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">취소</Button>
            <Button onClick={handleSave} className="flex-1">저장</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">프로필 수정</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <p className="text-[11px] tracking-[0.2em] text-gold font-medium uppercase mb-1">My Page</p>
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
                <img src={profile.avatar} alt={profile.nickname} className="w-20 h-20 rounded-full border-2 border-border" />
                <button
                  onClick={handleChangeAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
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
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
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
              onClick={() => navigate("/login")}
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
                  <img src={profile.avatar} alt={profile.nickname} className="w-20 h-20 rounded-full border-2 border-gold" />
                  <button
                    onClick={handleChangeAvatar}
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
                        <p className="text-xs text-muted-foreground font-normal">화면 테마를 어둡게 변경합니다</p>
                      </div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
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
                  onClick={() => navigate("/login")}
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
        confirmLabel="탈퇴"
        onConfirm={() => navigate("/login")}
        onCancel={() => setShowWithdrawConfirm(false)}
      />
    </div>
  );
}

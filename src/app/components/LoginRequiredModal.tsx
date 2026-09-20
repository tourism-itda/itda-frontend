import { LogIn, X } from "lucide-react";
import { Button } from "./ui/button";

interface LoginRequiredModalProps {
  open: boolean;
  title: string;
  description?: string;
  onLogin: () => void;
  onClose: () => void;
}

export function LoginRequiredModal({ open, title, description, onLogin, onClose }: LoginRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise" onClick={onClose} />
      <div className="relative bg-card w-full max-w-xs rounded-2xl shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="w-5 h-5 text-primary" />
        </div>

        <p className="text-base font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            닫기
          </Button>
          <Button className="flex-1" onClick={onLogin}>
            로그인 하러가기
          </Button>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import {
  FileUp,
  Search,
  FileText,
  Video,
  History,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { AppStep } from "../types";

interface HeaderProps {
  currentStep: AppStep;
  onSelectStep: (step: AppStep) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  savedCount,
}) => {
  const navItems: { id: AppStep; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "upload", label: "Tải SGK / Tài liệu", icon: <FileUp className="w-4 h-4" /> },
    { id: "analysis", label: "Phân tích AI", icon: <Search className="w-4 h-4" /> },
    { id: "script", label: "Bảng kịch bản", icon: <FileText className="w-4 h-4" /> },
    { id: "player", label: "Tạo & Xem video", icon: <Video className="w-4 h-4" /> },
    { id: "history", label: "Lịch sử video", icon: <History className="w-4 h-4" />, badge: savedCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div
              onClick={() => onSelectStep("upload")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-900 tracking-tight text-lg sm:text-xl">
                    AI TẠO VIDEO KHỞI ĐỘNG BÀI HỌC
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    THCS Việt Nam
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Biến tài liệu SGK thành tình huống mở bài hấp dẫn chỉ trong 60 giây
                </p>
              </div>
            </div>

            {/* Mobile History button */}
            <button
              id="mobile-history-btn"
              onClick={() => onSelectStep("history")}
              className="md:hidden relative p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Lịch sử video"
            >
              <History className="w-5 h-5" />
              {savedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full md:w-auto">
            {navItems.map((item) => {
              const isActive = currentStep === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onSelectStep(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span className={isActive ? "text-blue-600" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-300 text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

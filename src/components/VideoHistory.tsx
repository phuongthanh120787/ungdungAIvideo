import React from "react";
import {
  History,
  Play,
  Edit,
  Trash2,
  Download,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { SavedVideo } from "../types";
import { exportScriptAsDoc } from "../utils/exportUtils";

interface VideoHistoryProps {
  savedVideos: SavedVideo[];
  onSelectVideo: (video: SavedVideo) => void;
  onEditVideo: (video: SavedVideo) => void;
  onDeleteVideo: (id: string) => void;
  onStartNew: () => void;
}

export const VideoHistory: React.FC<VideoHistoryProps> = ({
  savedVideos,
  onSelectVideo,
  onEditVideo,
  onDeleteVideo,
  onStartNew,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Thư viện Lịch sử Video & Kịch bản Khởi động
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Các bài học thầy cô đã tạo được lưu trữ an toàn, sẵn sàng trình chiếu hoặc sửa đổi.
              </p>
            </div>
          </div>

          <button
            id="create-new-lesson-btn"
            onClick={onStartNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <span>+ Tạo bài học mới</span>
          </button>
        </div>

        {savedVideos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Chưa có video khởi động nào được lưu
            </h3>
            <p className="text-xs text-slate-700 max-w-sm mx-auto mb-4">
              Thầy cô hãy tải lên sách giáo khoa hoặc chọn một bài học mẫu để AI tạo kịch bản video khởi động đầu tiên!
            </p>
            <button
              onClick={onStartNew}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
            >
              Tải tài liệu ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {savedVideos.map((video) => {
              const totalDuration = video.script.scenes.reduce(
                (sum, s) => sum + (Number(s.duration) || 0),
                0
              );
              return (
                <div
                  key={video.id}
                  className="rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {video.grade} - {video.subject}
                      </span>
                      <span className="text-[11px] text-slate-700 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(video.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {video.lessonTitle}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                      {video.analysis.curiousProblem || video.analysis.theme}
                    </p>
                  </div>

                  {/* Card Body Specs */}
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Thời lượng:
                      </span>
                      <span className="font-bold text-slate-900">
                        {Math.round(totalDuration)}s ({video.script.scenes.length} cảnh)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span>Phong cách:</span>
                      <span className="font-semibold text-slate-800">
                        {video.config.style}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span>Giọng đọc:</span>
                      <span className="font-semibold text-slate-800">
                        {video.config.voiceGender} ({video.config.voiceRegion})
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectVideo(video)}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        title="Xem lại video"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                      <button
                        onClick={() => onEditVideo(video)}
                        className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Chỉnh sửa kịch bản"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          exportScriptAsDoc(video.script, video.analysis, video.config)
                        }
                        className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Tải kịch bản Word"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onDeleteVideo(video.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa khỏi lịch sử"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

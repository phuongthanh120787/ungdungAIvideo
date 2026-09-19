import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Edit3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { DocumentAnalysis, VideoConfig } from "../types";

interface AnalysisResultsProps {
  analysis: DocumentAnalysis;
  onChangeAnalysis: (updated: DocumentAnalysis) => void;
  config: VideoConfig;
  onChangeConfig: (newConfig: Partial<VideoConfig>) => void;
  onProceedToScript: () => void;
  onBackToUpload: () => void;
  isGeneratingScript: boolean;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onChangeAnalysis,
  config,
  onChangeConfig,
  onProceedToScript,
  onBackToUpload,
  isGeneratingScript,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newConcept, setNewConcept] = useState("");
  const [newKnowledge, setNewKnowledge] = useState("");

  const handleAddConcept = () => {
    if (!newConcept.trim()) return;
    onChangeAnalysis({
      ...analysis,
      coreConcepts: [...analysis.coreConcepts, newConcept.trim()],
    });
    setNewConcept("");
  };

  const handleRemoveConcept = (index: number) => {
    onChangeAnalysis({
      ...analysis,
      coreConcepts: analysis.coreConcepts.filter((_, i) => i !== index),
    });
  };

  const handleAddKnowledge = () => {
    if (!newKnowledge.trim()) return;
    onChangeAnalysis({
      ...analysis,
      keyKnowledge: [...analysis.keyKnowledge, newKnowledge.trim()],
    });
    setNewKnowledge("");
  };

  const handleRemoveKnowledge = (index: number) => {
    onChangeAnalysis({
      ...analysis,
      keyKnowledge: analysis.keyKnowledge.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Summary & Edit toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Kết quả phân tích tài liệu
                </span>
                {config.strictMode && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Chỉ dùng dữ liệu SGK
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {analysis.lessonTitle || "Bài học chưa đặt tên"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="toggle-edit-analysis-btn"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isEditing
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? "Đang mở chỉnh sửa" : "Chỉnh sửa thông tin"}
            </button>
          </div>
        </div>

        {/* Warning banner if insufficient info in strict mode */}
        {analysis.hasInsufficientInfo && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Lưu ý từ AI (Chế độ nghiêm ngặt tài liệu SGK):
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {analysis.warningMessage ||
                  "Tài liệu bạn tải lên khá ngắn hoặc thiếu một số định nghĩa. AI đã giữ đúng nguyên văn và không tự ý bịa thêm kiến thức ngoài SGK."}
              </p>
            </div>
          </div>
        )}

        {/* Lesson Metadata Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase">Môn học</span>
            {isEditing ? (
              <input
                type="text"
                value={analysis.subject}
                onChange={(e) =>
                  onChangeAnalysis({ ...analysis, subject: e.target.value })
                }
                className="w-full text-sm font-bold text-slate-900 mt-1 p-1 bg-white border border-slate-300 rounded"
              />
            ) : (
              <p className="text-sm font-bold text-slate-900 mt-0.5">{analysis.subject}</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase">Khối lớp</span>
            {isEditing ? (
              <input
                type="text"
                value={analysis.grade}
                onChange={(e) =>
                  onChangeAnalysis({ ...analysis, grade: e.target.value })
                }
                className="w-full text-sm font-bold text-slate-900 mt-1 p-1 bg-white border border-slate-300 rounded"
              />
            ) : (
              <p className="text-sm font-bold text-slate-900 mt-0.5">{analysis.grade}</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase">Chủ đề / Chương</span>
            {isEditing ? (
              <input
                type="text"
                value={analysis.theme}
                onChange={(e) =>
                  onChangeAnalysis({ ...analysis, theme: e.target.value })
                }
                className="w-full text-sm font-bold text-slate-900 mt-1 p-1 bg-white border border-slate-300 rounded"
              />
            ) : (
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{analysis.theme || "Không có chủ đề"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Key Knowledge & Core Concepts */}
        <div className="space-y-6">
          {/* Key Knowledge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Kiến thức trọng tâm bài học
              </h3>
              <span className="text-xs text-slate-700">
                {analysis.keyKnowledge.length} điểm chính
              </span>
            </div>
            <ul className="space-y-2.5">
              {analysis.keyKnowledge.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{item}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveKnowledge(idx)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditing && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Thêm kiến thức trọng tâm..."
                  value={newKnowledge}
                  onChange={(e) => setNewKnowledge(e.target.value)}
                  className="flex-1 text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  onClick={handleAddKnowledge}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>

          {/* Core Concepts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-indigo-600" />
              Các khái niệm chính (Thuật ngữ SGK)
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.coreConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  <span>{concept}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveConcept(idx)}
                      className="hover:text-red-600"
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Nhập khái niệm mới..."
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  className="flex-1 text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  onClick={handleAddConcept}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Video Hooks, Real-life Examples, and Curiosity Problem */}
        <div className="space-y-6">
          {/* Curious Problem (The Hook) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-amber-900">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold">
                Vấn đề gây tò mò cho học sinh (Hook mở đầu video)
              </h3>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Nghịch lý hoặc tình huống gây kích thích tư duy học sinh THCS để mở đầu bài học:
            </p>
            {isEditing ? (
              <textarea
                rows={3}
                value={analysis.curiousProblem}
                onChange={(e) =>
                  onChangeAnalysis({ ...analysis, curiousProblem: e.target.value })
                }
                className="w-full text-xs sm:text-sm font-medium p-2.5 bg-white border border-amber-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed italic">
                "{analysis.curiousProblem}"
              </div>
            )}
          </div>

          {/* Suitable Examples & Situations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Ví dụ, tình huống thực tế phù hợp để dựng kịch bản
            </h3>
            <ul className="space-y-2">
              {analysis.suitableExamples.map((ex, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                >
                  <span className="text-emerald-700 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation and Next Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          id="back-to-upload-btn"
          onClick={onBackToUpload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại tải tài liệu</span>
        </button>

        <button
          id="proceed-to-script-btn"
          onClick={onProceedToScript}
          disabled={isGeneratingScript}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
            isGeneratingScript
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-blue-500/25 active:scale-[0.99]"
          }`}
        >
          {isGeneratingScript ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Đang xây dựng kịch bản video...</span>
            </>
          ) : (
            <>
              <span>TIẾP TỤC: TẠO KỊCH BẢN VIDEO</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import {
  FileText,
  RotateCcw,
  Play,
  Video,
  Plus,
  Trash2,
  Sparkles,
  Edit2,
  Clock,
  HelpCircle,
  Download,
  CheckCircle,
  Sliders,
  Eye,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { VideoScript, ScriptScene, VideoConfig, DocumentAnalysis, UploadedFile } from "../types";
import { VideoConfigModal } from "./VideoConfigModal";
import { SceneImageModal } from "./SceneImageModal";

interface ScriptEditorProps {
  script: VideoScript;
  onChangeScript: (updated: VideoScript) => void;
  config: VideoConfig;
  onChangeConfig: (newConfig: Partial<VideoConfig>) => void;
  analysis: DocumentAnalysis;
  onRegenerateAll: () => void;
  onPreviewVideo: () => void;
  onGenerateVideo: () => void;
  onExportDoc: () => void;
  isRegenerating: boolean;
  uploadedFiles?: UploadedFile[];
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChangeScript,
  config,
  onChangeConfig,
  analysis,
  onRegenerateAll,
  onPreviewVideo,
  onGenerateVideo,
  onExportDoc,
  isRegenerating,
  uploadedFiles = [],
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);
  const [sceneInstruction, setSceneInstruction] = useState("");
  const [targetSceneModal, setTargetSceneModal] = useState<ScriptScene | null>(null);
  const [selectedSceneForImageModal, setSelectedSceneForImageModal] = useState<ScriptScene | null>(null);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);

  // Total duration
  const totalDuration = script.scenes.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  // Handle edit scene fields
  const handleUpdateScene = (id: string, field: keyof ScriptScene, value: any) => {
    const updatedScenes = script.scenes.map((s) => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    });
    onChangeScript({ ...script, scenes: updatedScenes });
  };

  // Update scene image
  const handleUpdateSceneImage = (sceneId: string, newImageUrl: string, newImagePrompt?: string) => {
    const updatedScenes = script.scenes.map((s) => {
      if (s.id === sceneId) {
        return {
          ...s,
          imageUrl: newImageUrl,
          ...(newImagePrompt ? { imagePrompt: newImagePrompt } : {}),
        };
      }
      return s;
    });
    onChangeScript({ ...script, scenes: updatedScenes });
  };

  // Generate AI images for all scenes
  const handleGenerateAllImages = async () => {
    setIsGeneratingAllImages(true);
    try {
      const updatedScenes = [...script.scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        const sc = updatedScenes[i];
        try {
          const response = await fetch("/api/generate-scene-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customDescription: sc.visualDescription || sc.content,
              style: config.style,
              aspectRatio: config.aspectRatio,
              subject: script.subject,
              lessonTitle: script.lessonTitle,
              sceneIndex: sc.sceneNumber,
            }),
          });
          const resData = await response.json();
          if (resData.success && resData.data?.imageUrl) {
            updatedScenes[i] = {
              ...sc,
              imageUrl: resData.data.imageUrl,
              imagePrompt: resData.data.imagePrompt,
            };
          }
        } catch (e) {
          console.warn(`Error generating image for scene ${sc.sceneNumber}:`, e);
        }
      }
      onChangeScript({ ...script, scenes: updatedScenes });
    } finally {
      setIsGeneratingAllImages(false);
    }
  };

  // Add a new scene
  const handleAddScene = () => {
    const newNumber = script.scenes.length + 1;
    const newScene: ScriptScene = {
      id: `sc-custom-${Date.now()}`,
      sceneNumber: newNumber,
      sceneName: `Cảnh ${newNumber}: Tình huống thảo luận`,
      content: "Học sinh cùng trao đổi và thắc mắc về một ví dụ thực tế.",
      visualDescription: "Hình ảnh các bạn học sinh THCS giơ tay phát biểu sôi nổi.",
      voiceover: "Liệu điều này có liên quan gì đến bài học của chúng ta?",
      duration: 8,
      keyVisualType: "discussion",
    };
    onChangeScript({
      ...script,
      scenes: [...script.scenes, newScene],
    });
  };

  // Delete a scene
  const handleDeleteScene = (id: string) => {
    if (script.scenes.length <= 2) {
      alert("Kịch bản video khởi động cần tối thiểu 2 cảnh!");
      return;
    }
    const filtered = script.scenes.filter((s) => s.id !== id);
    // renumber
    const renumbered = filtered.map((s, idx) => ({
      ...s,
      sceneNumber: idx + 1,
    }));
    onChangeScript({ ...script, scenes: renumbered });
  };

  // Move scene up/down
  const handleMoveScene = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= script.scenes.length) return;

    const list = [...script.scenes];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const renumbered = list.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onChangeScript({ ...script, scenes: renumbered });
  };

  // Trigger AI scene regeneration
  const handleRegenerateSingleScene = async () => {
    if (!targetSceneModal) return;
    setRegeneratingSceneId(targetSceneModal.id);

    try {
      const res = await fetch("/api/regenerate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: targetSceneModal,
          lessonInfo: {
            lessonTitle: script.lessonTitle,
            subject: script.subject,
            grade: script.grade,
          },
          instruction: sceneInstruction,
          style: config.style,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const updatedScenes = script.scenes.map((s) =>
          s.id === targetSceneModal.id ? { ...s, ...data.data } : s
        );
        onChangeScript({ ...script, scenes: updatedScenes });
      }
    } catch (err) {
      console.error("Lỗi tạo lại cảnh:", err);
    } finally {
      setRegeneratingSceneId(null);
      setTargetSceneModal(null);
      setSceneInstruction("");
    }
  };

  // Warm-up questions handling
  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...script.warmupQuestions];
    updated[index] = value;
    onChangeScript({ ...script, warmupQuestions: updated });
  };

  const handleAddQuestion = () => {
    if (script.warmupQuestions.length >= 3) return;
    onChangeScript({
      ...script,
      warmupQuestions: [
        ...script.warmupQuestions,
        "Theo em, điều này mang lại lợi ích gì trong cuộc sống hàng ngày?",
      ],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (script.warmupQuestions.length <= 1) return;
    onChangeScript({
      ...script,
      warmupQuestions: script.warmupQuestions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Bảng chỉnh sửa kịch bản
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Tổng thời lượng: ~{totalDuration} giây ({script.scenes.length} cảnh)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Kịch bản: {script.lessonTitle} ({script.subject} - {script.grade})
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              Thầy cô có thể trực tiếp sửa lời thoại, hình ảnh, thời lượng của từng cảnh trước khi xuất video.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="toggle-config-btn"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>{showConfig ? "Ẩn cấu hình" : "Đổi phong cách/Tỷ lệ"}</span>
            </button>

            <button
              id="export-doc-btn"
              onClick={onExportDoc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              title="Tải kịch bản dạng tài liệu Word (.doc)"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Tải kịch bản (.doc)</span>
            </button>

            <button
              id="generate-all-images-btn"
              onClick={handleGenerateAllImages}
              disabled={isGeneratingAllImages}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              title="Tự động tạo hình ảnh AI cho toàn bộ các cảnh trong bài"
            >
              <Sparkles className={`w-4 h-4 text-emerald-600 ${isGeneratingAllImages ? "animate-spin" : ""}`} />
              <span>{isGeneratingAllImages ? "ĐANG TẠO ẢNH AI..." : "TẠO ẢNH AI TẤT CẢ CẢNH"}</span>
            </button>

            <button
              id="regenerate-all-btn"
              onClick={onRegenerateAll}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>TẠO LẠI KỊCH BẢN</span>
            </button>

            <button
              id="preview-video-btn"
              onClick={onPreviewVideo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span>XEM TRƯỚC</span>
            </button>

            <button
              id="generate-video-btn"
              onClick={onGenerateVideo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all"
            >
              <Video className="w-4 h-4 text-amber-300" />
              <span>TẠO VIDEO</span>
            </button>
          </div>
        </div>

        {/* Collapsible Config Modal / Panel */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <VideoConfigModal
              config={config}
              onChangeConfig={onChangeConfig}
            />
          </div>
        )}
      </div>

      {/* Script Table (STT | Cảnh | Nội dung | Hình ảnh | Lời thoại | Thời lượng) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Chi tiết các cảnh kịch bản ({script.scenes.length} cảnh)
            </h3>
          </div>
          <button
            id="add-scene-btn"
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm cảnh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 w-14 text-center">STT</th>
                <th className="py-3 px-3 w-40">Tên Cảnh</th>
                <th className="py-3 px-4 w-1/4">Nội dung (Bối cảnh / Diễn biến)</th>
                <th className="py-3 px-4 w-1/4">Hình ảnh minh họa (Visual)</th>
                <th className="py-3 px-4 w-1/4">Lời thoại / Thuyết minh</th>
                <th className="py-3 px-3 w-20 text-center">Thời lượng</th>
                <th className="py-3 px-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {script.scenes.map((scene, idx) => (
                <tr
                  key={scene.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* STT & Reorder */}
                  <td className="py-3 px-2 text-center align-top">
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex items-center opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveScene(idx, "up")}
                          className="p-0.5 text-slate-500 hover:text-blue-600 disabled:opacity-20"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === script.scenes.length - 1}
                          onClick={() => handleMoveScene(idx, "down")}
                          className="p-0.5 text-slate-500 hover:text-blue-600 disabled:opacity-20"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Cảnh Name */}
                  <td className="py-3 px-3 align-top font-bold text-slate-900">
                    <input
                      type="text"
                      value={scene.sceneName}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, "sceneName", e.target.value)
                      }
                      className="w-full text-xs font-bold text-slate-900 p-1.5 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent hover:border-slate-300 rounded"
                    />
                    <div className="text-[10px] font-medium text-slate-700 mt-1 pl-1">
                      {idx === 0 && "Tình huống gần gũi"}
                      {idx === 1 && "Vấn đề bất ngờ"}
                      {idx === 2 && "Suy nghĩ / Trao đổi"}
                      {idx === 3 && "Kết nối bài học"}
                      {idx === script.scenes.length - 1 && "Câu hỏi khởi động"}
                    </div>
                  </td>

                  {/* Nội dung */}
                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={3}
                      value={scene.content}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, "content", e.target.value)
                      }
                      className="w-full text-xs text-slate-800 p-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-hidden leading-relaxed resize-y"
                    />
                  </td>

                  {/* Hình ảnh visual */}
                  <td className="py-3 px-3 align-top min-w-[180px]">
                    <div className="space-y-2">
                      {scene.imageUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-900 shadow-2xs">
                          <img
                            src={scene.imageUrl}
                            alt={scene.sceneName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedSceneForImageModal(scene)}
                            className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Đổi ảnh AI / Mẫu</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedSceneForImageModal(scene)}
                          className="w-full py-2 px-3 border border-dashed border-blue-300 hover:border-blue-500 rounded-lg bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>+ Chọn / Tạo ảnh</span>
                        </button>
                      )}

                      <textarea
                        rows={2}
                        value={scene.visualDescription}
                        onChange={(e) =>
                          handleUpdateScene(
                            scene.id,
                            "visualDescription",
                            e.target.value
                          )
                        }
                        placeholder="Mô tả hình ảnh trực quan..."
                        className="w-full text-xs text-slate-800 p-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-hidden leading-relaxed resize-y"
                      />

                      <div className="flex items-center justify-between pt-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSceneForImageModal(scene)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Tùy biến hình ảnh</span>
                        </button>
                        {scene.imageUrl && (
                          <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                            Đã có ảnh
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Lời thoại voiceover */}
                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={3}
                      value={scene.voiceover}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, "voiceover", e.target.value)
                      }
                      className="w-full text-xs font-medium text-blue-950 p-2 bg-blue-50/50 hover:bg-white focus:bg-white border border-blue-200 focus:border-blue-500 rounded-lg focus:outline-hidden leading-relaxed resize-y"
                    />
                  </td>

                  {/* Thời lượng */}
                  <td className="py-3 px-2 align-top text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={scene.duration}
                        onChange={(e) =>
                          handleUpdateScene(
                            scene.id,
                            "duration",
                            parseInt(e.target.value) || 5
                          )
                        }
                        className="w-12 text-center text-xs font-bold p-1 border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[11px] text-slate-700">s</span>
                    </div>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3 px-2 align-top text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setTargetSceneModal(scene)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Tạo lại riêng cảnh này bằng AI"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa cảnh này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: CÂU HỎI KHỞI ĐỘNG (End of video) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-blue-700" />
            <div>
              <h3 className="text-base font-extrabold text-blue-950">
                CÂU HỎI KHỞI ĐỘNG (Gợi mở chuyển vào bài học)
              </h3>
              <p className="text-xs text-blue-700">
                1–3 câu hỏi ngắn gọn, dễ hiểu, gây tò mò, không đòi hỏi học sinh phải nắm hết kiến thức trước.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-900">Số câu hỏi:</span>
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                onClick={() => {
                  onChangeConfig({ questionCount: count });
                  if (count > script.warmupQuestions.length) {
                    handleAddQuestion();
                  } else if (count < script.warmupQuestions.length) {
                    onChangeScript({
                      ...script,
                      warmupQuestions: script.warmupQuestions.slice(0, count),
                    });
                  }
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
                  script.warmupQuestions.length === count
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-blue-900 border-blue-200 hover:bg-blue-100"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {script.warmupQuestions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-white p-3 rounded-xl border border-blue-200 shadow-2xs"
            >
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-1">
                {idx + 1}
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-900 p-1 border-b border-transparent focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              {script.warmupQuestions.length > 1 && (
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Transition phrase */}
        <div className="p-3.5 rounded-xl bg-blue-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
              Câu chuyển tiếp kết thúc video:
            </span>
            <span className="text-sm font-bold italic">
              "{script.transitionPhrase}"
            </span>
          </div>
          <CheckCircle className="w-5 h-5 text-amber-300 flex-shrink-0" />
        </div>
      </div>

      {/* Modal for Regenerating a single scene */}
      {targetSceneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Tạo lại Cảnh {targetSceneModal.sceneNumber}: {targetSceneModal.sceneName}</span>
            </div>
            <p className="text-xs text-slate-600">
              Nhập yêu cầu để AI viết lại riêng cảnh này (ví dụ: làm cho tình huống hài hước hơn, đưa thêm ví dụ về điện thoại thông minh, v.v.)
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gợi ý điều chỉnh cho AI:
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Đổi bối cảnh sang học sinh THCS ở căn tin trường, tạo tình huống gây cười..."
                value={sceneInstruction}
                onChange={(e) => setSceneInstruction(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTargetSceneModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRegenerateSingleScene}
                disabled={regeneratingSceneId !== null}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                {regeneratingSceneId ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Đang tạo lại...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tạo lại cảnh này</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal for Customizing / Generating Scene Image */}
      {selectedSceneForImageModal && (
        <SceneImageModal
          isOpen={!!selectedSceneForImageModal}
          onClose={() => setSelectedSceneForImageModal(null)}
          scene={selectedSceneForImageModal}
          onUpdateSceneImage={handleUpdateSceneImage}
          uploadedFiles={uploadedFiles}
          subject={script.subject}
          lessonTitle={script.lessonTitle}
          currentStyle={config.style}
          aspectRatio={config.aspectRatio}
        />
      )}
    </div>
  );
};

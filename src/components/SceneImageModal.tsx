import React, { useState } from "react";
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Library,
  Check,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";
import { ScriptScene, UploadedFile } from "../types";
import { EDUCATIONAL_IMAGE_PRESETS, ImagePreset } from "../data/educationalImagePresets";

interface SceneImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: ScriptScene;
  onUpdateSceneImage: (sceneId: string, newImageUrl: string, newImagePrompt?: string) => void;
  uploadedFiles?: UploadedFile[];
  subject?: string;
  lessonTitle?: string;
  currentStyle?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export const SceneImageModal: React.FC<SceneImageModalProps> = ({
  isOpen,
  onClose,
  scene,
  onUpdateSceneImage,
  uploadedFiles = [],
  subject = "Tin học",
  lessonTitle = "",
  currentStyle = "Hoạt hình giáo dục",
  aspectRatio = "16:9",
}) => {
  const [activeTab, setActiveTab] = useState<"ai" | "presets" | "upload" | "documents">("ai");
  
  // AI Tab states
  const [promptText, setPromptText] = useState(
    scene.imagePrompt || scene.visualDescription || scene.content || ""
  );
  const [selectedStyle, setSelectedStyle] = useState(currentStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewAiUrl, setPreviewAiUrl] = useState<string | null>(scene.imageUrl || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Presets tab filter
  const [presetCategory, setPresetCategory] = useState<string>("all");

  if (!isOpen) return null;

  const handleGenerateAiImage = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/generate-scene-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDescription: promptText,
          style: selectedStyle,
          aspectRatio,
          subject,
          lessonTitle,
          sceneIndex: scene.sceneNumber,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data?.imageUrl) {
        setPreviewAiUrl(resData.data.imageUrl);
      } else {
        throw new Error(resData.error || "Không thể tạo ảnh minh họa.");
      }
    } catch (err: any) {
      console.error("AI image generation error:", err);
      // Fallback direct URL
      const seed = Math.floor(Math.random() * 900000) + 1000;
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `${selectedStyle}, ${promptText || subject}, educational illustration`
      )}?width=1280&height=720&nologo=true&seed=${seed}`;
      setPreviewAiUrl(fallbackUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAiImage = () => {
    if (previewAiUrl) {
      onUpdateSceneImage(scene.id, previewAiUrl, promptText);
      onClose();
    }
  };

  const handleSelectPreset = (preset: ImagePreset) => {
    onUpdateSceneImage(scene.id, preset.imageUrl, preset.title);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateSceneImage(scene.id, result, file.name);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter presets
  const filteredPresets =
    presetCategory === "all"
      ? EDUCATIONAL_IMAGE_PRESETS
      : EDUCATIONAL_IMAGE_PRESETS.filter((p) => p.category === presetCategory);

  // Uploaded image files from document uploads
  const imageDocs = uploadedFiles.filter(
    (f) =>
      f.type.startsWith("image/") ||
      f.name.endsWith(".jpg") ||
      f.name.endsWith(".png") ||
      f.name.endsWith(".webp")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div
        id="scene-image-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Cảnh {scene.sceneNumber}: {scene.sceneName}
              </span>
              <span className="text-xs text-slate-500">• Thời lượng: {scene.duration}s</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Chọn & Tùy biến hình ảnh cho cảnh video
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "ai"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tạo ảnh AI theo yêu cầu</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "presets"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Library className="w-4 h-4 text-emerald-600" />
            <span>Kho tranh mẫu THCS ({EDUCATIONAL_IMAGE_PRESETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Tài liệu đã tải ({imageDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Tải ảnh từ máy</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: AI GENERATION */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mô tả hình ảnh mong muốn cho cảnh này
                    </label>
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={4}
                      placeholder="Nhập mô tả hình ảnh (ví dụ: Hai bạn học sinh THCS đang quan sát màn hình điện thoại trong lớp học hiện đại...)"
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-slate-50/50"
                    />
                    <p className="text-[11px] text-slate-600 mt-1">
                      💡 Mẹo: Giáo viên có thể nhập bằng tiếng Việt, AI sẽ tối ưu hóa để tạo hình ảnh sắc nét, phù hợp lứa tuổi học sinh THCS.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phong cách mỹ thuật
                    </label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    >
                      <option value="Hoạt hình giáo dục">Hoạt hình giáo dục 2D (Sáng rõ, nét vẽ phẳng chuẩn SGK)</option>
                      <option value="Hoạt hình 3D">Hoạt hình 3D (Đáng yêu phong cách Pixar / Disney)</option>
                      <option value="Lớp học hiện đại">Lớp học hiện đại & Thiết bị công nghệ</option>
                      <option value="Học sinh THCS">Học sinh THCS đồng phục năng động</option>
                      <option value="Vui nhộn">Vui nhộn & Hài hước (Biểu cảm sinh động)</option>
                      <option value="Tình huống đời sống">Tình huống thực tế đời sống học đường</option>
                      <option value="Giáo viên và học sinh">Thầy cô và học sinh tương tác truyền cảm hứng</option>
                    </select>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateAiImage}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tạo ảnh minh họa AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Tạo ảnh minh họa AI ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Preview */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Xem trước hình ảnh</span>
                    {previewAiUrl && (
                      <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                        Sẵn sàng áp dụng
                      </span>
                    )}
                  </span>

                  <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-200 overflow-hidden flex items-center justify-center group shadow-inner">
                    {previewAiUrl ? (
                      <>
                        <img
                          src={previewAiUrl}
                          alt="AI Scene Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={previewAiUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-xs font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Mở ảnh lớn</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">
                          Chưa có ảnh được tạo. Bấm nút &quot;Tạo ảnh minh họa AI ngay&quot; để tạo.
                        </p>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                        <p className="text-xs font-semibold">Đang vẽ tranh minh họa AI theo ngữ cảnh bài học...</p>
                      </div>
                    )}
                  </div>

                  {previewAiUrl && (
                    <button
                      onClick={handleApplyAiImage}
                      className="mt-3 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Áp dụng hình ảnh này cho Cảnh {scene.sceneNumber}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATIONAL PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "Tin học & Công nghệ", label: "💻 Tin học & Số" },
                  { id: "Lớp học & Thầy cô", label: "🏫 Lớp học & Thầy cô" },
                  { id: "Khởi động & Đố vui", label: "❓ Khởi động & Đố vui" },
                  { id: "Khoa học & Đời sống", label: "🔬 Khoa học & Đời sống" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPresetCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      presetCategory === cat.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="group rounded-xl border border-slate-200 overflow-hidden bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="aspect-video relative bg-slate-900 overflow-hidden">
                      <img
                        src={preset.imageUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                        {preset.category}
                      </div>
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600">
                          {preset.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
                        <span>Chọn ảnh này</span>
                        <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOADED DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {imageDocs.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">Chưa có tệp hình ảnh SGK nào được tải lên</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Nếu thầy cô đã tải lên tài liệu dưới dạng ảnh (chụp trang SGK), các ảnh đó sẽ xuất hiện ở đây để chọn vào cảnh video.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageDocs.map((doc, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (doc.content) {
                          onUpdateSceneImage(scene.id, doc.content, doc.name);
                          onClose();
                        }
                      }}
                      className="group rounded-xl border border-slate-200 overflow-hidden bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="aspect-video bg-slate-100 overflow-hidden relative">
                        {doc.content ? (
                          <img
                            src={doc.content}
                            alt={doc.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[11px] text-blue-600 mt-0.5">Nhấp để áp dụng</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UPLOAD FROM DEVICE */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                <Upload className="w-10 h-10 text-blue-500 mb-3" />
                <span className="text-sm font-bold text-slate-800">
                  Nhấp để tải lên ảnh minh họa từ máy tính
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Hỗ trợ định dạng JPG, PNG, WebP (tỷ lệ 16:9 khuyên dùng)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hình ảnh được lưu trực tiếp vào kịch bản và tự động hiển thị trong luồng phát video.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

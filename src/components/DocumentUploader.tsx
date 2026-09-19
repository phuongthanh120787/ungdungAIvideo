import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileImage,
  FileText,
  Trash2,
  Plus,
  ShieldCheck,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileCheck,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import mammoth from "mammoth";
import { UploadedFile, VideoConfig } from "../types";
import { SAMPLE_LESSONS, SampleLesson } from "../data/sampleLessons";

interface DocumentUploaderProps {
  files: UploadedFile[];
  onAddFiles: (newFiles: UploadedFile[]) => void;
  onRemoveFile: (fileId: string) => void;
  onClearFiles: () => void;
  onSelectSample: (sample: SampleLesson) => void;
  config: VideoConfig;
  onChangeConfig: (newConfig: Partial<VideoConfig>) => void;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  subjectHint: string;
  onChangeSubjectHint: (v: string) => void;
  gradeHint: string;
  onChangeGradeHint: (v: string) => void;
  analysisError?: string | null;
  onClearAnalysisError?: () => void;
}

// Client-side image compression to prevent large payload errors
const compressImageFile = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSelectSample,
  config,
  onChangeConfig,
  onStartAnalysis,
  isAnalyzing,
  subjectHint,
  onChangeSubjectHint,
  gradeHint,
  onChangeGradeHint,
  analysisError,
  onClearAnalysisError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "paste">("file");
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleStartAnalysisClick = () => {
    if (uploadTab === "paste" && pastedText.trim()) {
      const title = pastedTitle.trim() || `Nội dung bài học (${new Date().toLocaleTimeString("vi-VN")})`;
      const id = `f-paste-${Date.now()}`;
      onAddFiles([
        {
          id,
          name: `${title}.txt`,
          size: new Blob([pastedText]).size,
          type: "text/plain",
          extractedText: pastedText.trim(),
        },
      ]);
      setPastedText("");
      setPastedTitle("");
      setUploadTab("file");
      setTimeout(() => {
        onStartAnalysis();
      }, 60);
      return;
    }
    onStartAnalysis();
  };

  const processFileList = async (fileList: FileList | File[]) => {
    setReadingFile(true);
    setFileWarning(null);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const id = `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileNameLower = file.name.toLowerCase();

      try {
        // 1. IMAGE FILES
        if (
          file.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|gif|bmp|jfif)$/i.test(fileNameLower)
        ) {
          const base64 = await compressImageFile(file);
          newFiles.push({
            id,
            name: file.name,
            size: file.size,
            type: file.type || "image/jpeg",
            base64,
            previewUrl: base64,
          });
        }
        // 2. PDF FILES
        else if (
          file.type === "application/pdf" ||
          fileNameLower.endsWith(".pdf")
        ) {
          if (file.size > 25 * 1024 * 1024) {
            setFileWarning(
              `Tệp PDF "${file.name}" khá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Hệ thống sẽ trích xuất văn bản sách. Nếu gặp sự cố, thầy cô có thể chụp 1-3 trang của bài học hoặc dùng chức năng "Dán nhanh văn bản bài học".`
            );
          }
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newFiles.push({
            id,
            name: file.name,
            size: file.size,
            type: "application/pdf",
            base64,
          });
        }
        // 3. WORD DOCX
        else if (
          fileNameLower.endsWith(".docx") ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            newFiles.push({
              id,
              name: file.name,
              size: file.size,
              type: "application/docx",
              extractedText: result.value,
            });
          } catch (err) {
            console.warn("Lỗi trích xuất DOCX, lưu tệp thông tin:", err);
            newFiles.push({
              id,
              name: file.name,
              size: file.size,
              type: "application/docx",
              extractedText: `Tài liệu Word bài học: ${file.name}`,
            });
          }
        }
        // 4. OLD WORD DOC (.doc)
        else if (
          fileNameLower.endsWith(".doc") ||
          file.type === "application/msword"
        ) {
          // Read as text attempt
          try {
            const text = await file.text();
            // Clean up binary noise and extract readable Vietnamese/English strings
            const readableText = text
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
              .replace(/\s{2,}/g, " ")
              .trim();

            newFiles.push({
              id,
              name: file.name,
              size: file.size,
              type: "application/msword",
              extractedText:
                readableText.length > 50
                  ? readableText.slice(0, 15000)
                  : `Tài liệu giáo án Word .doc: ${file.name}. Thầy cô có thể dán nội dung chữ trực tiếp ở ô bên dưới nếu cần độ chính xác tối đa.`,
            });
          } catch (e) {
            newFiles.push({
              id,
              name: file.name,
              size: file.size,
              type: "application/msword",
              extractedText: `Tài liệu giáo án Word .doc: ${file.name}`,
            });
          }
        }
        // 5. TEXT / RTF / OTHER TEXT FILES
        else {
          try {
            const text = await file.text();
            newFiles.push({
              id,
              name: file.name,
              size: file.size,
              type: "text/plain",
              extractedText: text.slice(0, 25000),
            });
          } catch (e) {
            console.error("Không thể đọc tệp văn bản:", e);
          }
        }
      } catch (err) {
        console.error("Lỗi khi xử lý file:", file.name, err);
      }
    }

    onAddFiles(newFiles);
    setReadingFile(false);
  };

  // Add pasted text as a file
  const handleAddPastedText = () => {
    if (!pastedText.trim()) return;
    const title = pastedTitle.trim() || `Nội dung bài học (${new Date().toLocaleTimeString("vi-VN")})`;
    const id = `f-paste-${Date.now()}`;
    onAddFiles([
      {
        id,
        name: `${title}.txt`,
        size: new Blob([pastedText]).size,
        type: "text/plain",
        extractedText: pastedText.trim(),
      },
    ]);
    setPastedText("");
    setPastedTitle("");
    setUploadTab("file");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide backdrop-blur mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trợ lý Giáo dục Thông minh dành riêng cho THCS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Tạo Video Khởi Động Bài Học Đầy Hứng Khởi
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Tải lên trang sách giáo khoa, giáo án hoặc bài giảng. AI sẽ tự động phân tích kiến thức trọng tâm,
            xây dựng tình huống thực tế dẫn nhập và chốt bằng các câu hỏi gợi mở để thầy cô chuyển tiếp mượt mà vào bài mới!
          </p>
        </div>
      </div>

      {/* Quick sample pickers */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">
              Hoặc thử nhanh với bài học mẫu chuẩn SGK THCS:
            </span>
          </div>
          <span className="text-xs text-slate-700 font-medium">Bấm để tải mẫu ngay</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_LESSONS.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              onClick={() => onSelectSample(sample)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {sample.grade} - {sample.subject}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700">
                  {sample.analysis.lessonTitle}
                </h4>
                <p className="text-xs text-slate-700 line-clamp-2 mt-1">
                  {sample.description}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-700 font-semibold">
                <span>Dùng tài liệu này</span>
                <span>&rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Drag & Drop upload + File list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Selector: Upload Files vs Paste Text */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              id="tab-upload-files"
              onClick={() => setUploadTab("file")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                uploadTab === "file"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải file SGK / Word / PDF / Ảnh</span>
            </button>
            <button
              type="button"
              id="tab-paste-text"
              onClick={() => setUploadTab("paste")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                uploadTab === "paste"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dán nhanh nội dung bài học</span>
            </button>
          </div>

          {fileWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{fileWarning}</div>
            </div>
          )}

          {uploadTab === "file" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all relative overflow-hidden ${
                isDragging
                  ? "border-blue-600 bg-blue-50 scale-[0.99]"
                  : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/80 bg-white"
              } shadow-xs`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleInputChange}
                className="hidden"
              />
              {readingFile ? (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-bold text-blue-800">
                    Đang đọc và tối ưu hóa tài liệu sách giáo khoa...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hệ thống tự động nén ảnh & trích xuất văn bản giúp tải nhanh
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Kéo thả tài liệu bài học vào đây hoặc bấm để chọn file
                  </h3>
                  <p className="text-xs text-slate-700 max-w-md mx-auto mb-3">
                    Hỗ trợ tất cả định dạng: Sách giáo khoa PDF, ảnh chụp trang sách (JPG/PNG), tài liệu Word (.docx / .doc), giáo án text.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">Ảnh chụp SGK (nhiều ảnh)</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">Word (.docx / .doc)</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">Sách PDF</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên bài học hoặc chủ đề:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 1: Thông tin và dữ liệu"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dán nội dung bài học từ SGK hoặc giáo án:
                </label>
                <textarea
                  rows={6}
                  placeholder="Thầy cô dán trực tiếp các đoạn trích trong SGK, các mục kiến thức, hoặc ví dụ trong bài học vào đây..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  id="submit-pasted-text-btn"
                  onClick={handleAddPastedText}
                  disabled={!pastedText.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40"
                >
                  Thêm vào danh sách tài liệu
                </button>
              </div>
            </div>
          )}

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Danh sách tài liệu đã tải ({files.length} file)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="add-more-files-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm file
                  </button>
                  <button
                    id="clear-all-files-btn"
                    onClick={onClearFiles}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-md"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.type.startsWith("image/") ? (
                        <div className="w-9 h-9 rounded bg-blue-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-blue-200">
                          {file.previewUrl ? (
                            <img
                              src={file.previewUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileImage className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      ) : file.type.includes("pdf") ? (
                        <div className="w-9 h-9 rounded bg-red-100 flex-shrink-0 flex items-center justify-center text-red-600 border border-red-200 font-bold text-[10px]">
                          PDF
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 border border-indigo-200 font-bold text-[10px]">
                          DOCX
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-700 flex items-center gap-1.5 flex-wrap">
                          <span>{formatFileSize(file.size)}</span>
                          {file.type.includes("pdf") && (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ✓ Sẵn sàng trích xuất bài học
                            </span>
                          )}
                          {file.type.startsWith("image/") && (
                            <span className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              ✓ Ảnh trang SGK
                            </span>
                          )}
                          {file.extractedText && (
                            <span className="text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              ✓ Đã đọc văn bản bài học
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      id={`delete-file-btn-${file.id}`}
                      onClick={() => onRemoveFile(file.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Xóa file này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Controls & Settings & Strict Mode */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              Thiết lập thông tin bài học
            </h3>

            {/* Subject selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Môn học (Ưu tiên Tin học):
              </label>
              <select
                id="select-subject-hint"
                value={subjectHint}
                onChange={(e) => onChangeSubjectHint(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tin học">Tin học (Ưu tiên THCS)</option>
                <option value="Toán học">Toán học</option>
                <option value="Khoa học tự nhiên">Khoa học tự nhiên (Lý, Hóa, Sinh)</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                <option value="Giáo dục công dân">Giáo dục công dân</option>
                <option value="Công nghệ">Công nghệ</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
              </select>
            </div>

            {/* Grade selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khối lớp:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    id={`grade-btn-${grade}`}
                    onClick={() => onChangeGradeHint(grade)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                      gradeHint === grade
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Strict Mode Checkbox [✓] Chỉ sử dụng thông tin trong tài liệu đã tải lên */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="strict-mode-checkbox"
                  type="checkbox"
                  checked={config.strictMode}
                  onChange={(e) =>
                    onChangeConfig({ strictMode: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      Chỉ sử dụng thông tin trong tài liệu đã tải lên
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-slate-700 mt-0.5 leading-snug">
                    Không tự ý đưa kiến thức ngoài tài liệu, không thay đổi thuật ngữ trong SGK, không bịa nội dung.
                  </p>
                </div>
              </label>
            </div>

            {/* Error banner if any */}
            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-900">Không thể hoàn tất phân tích</p>
                    <p className="text-[11px] text-red-800 mt-0.5">{analysisError}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-red-100">
                  <button
                    type="button"
                    onClick={handleStartAnalysisClick}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors shadow-xs"
                  >
                    Thử lại phân tích
                  </button>
                  {onClearAnalysisError && (
                    <button
                      type="button"
                      onClick={onClearAnalysisError}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium"
                    >
                      Bỏ qua
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Analyze Button */}
            <div className="pt-2">
              <button
                id="btn-analyze-document"
                onClick={handleStartAnalysisClick}
                disabled={isAnalyzing || (files.length === 0 && !pastedText.trim())}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                  isAnalyzing || (files.length === 0 && !pastedText.trim())
                    ? "bg-slate-300 cursor-not-allowed shadow-none text-slate-500"
                    : "bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-blue-500/25 active:scale-[0.99]"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Đang phân tích tài liệu bằng AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>PHÂN TÍCH TÀI LIỆU</span>
                  </>
                )}
              </button>
              {files.length === 0 && !pastedText.trim() && (
                <p className="text-center text-[11px] text-slate-700 mt-2 font-medium">
                  * Vui lòng tải tài liệu hoặc chọn 1 bài mẫu ở trên để bắt đầu
                </p>
              )}
              {files.length === 0 && pastedText.trim() && (
                <p className="text-center text-[11px] text-emerald-700 mt-2 font-semibold">
                  ✓ Sẽ tự động phân tích đoạn văn bản thầy cô đã dán
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

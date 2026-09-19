import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DocumentUploader } from "./components/DocumentUploader";
import { AnalysisResults } from "./components/AnalysisResults";
import { ScriptEditor } from "./components/ScriptEditor";
import { VideoPlayer } from "./components/VideoPlayer";
import { VideoHistory } from "./components/VideoHistory";
import {
  AppStep,
  UploadedFile,
  DocumentAnalysis,
  VideoScript,
  VideoConfig,
  SavedVideo,
} from "./types";
import { SAMPLE_LESSONS, SampleLesson } from "./data/sampleLessons";
import { exportScriptAsDoc } from "./utils/exportUtils";
import confetti from "canvas-confetti";

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("upload");

  // Files
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [subjectHint, setSubjectHint] = useState("Tin học");
  const [gradeHint, setGradeHint] = useState("Lớp 6");

  // Video Config
  const [config, setConfig] = useState<VideoConfig>({
    style: "Hoạt hình giáo dục",
    aspectRatio: "16:9",
    targetDuration: 45,
    voiceGender: "Nữ",
    voiceRegion: "Giọng miền Bắc",
    hasSubtitles: true,
    questionCount: 2,
    strictMode: true, // [✓] Chỉ sử dụng thông tin trong tài liệu đã tải lên
  });

  // Default lesson: Tin học 6 - Bài 1: Thông tin và dữ liệu (from prompt)
  const defaultSample = SAMPLE_LESSONS[0];

  const [analysis, setAnalysis] = useState<DocumentAnalysis>(defaultSample.analysis);
  const [script, setScript] = useState<VideoScript>(defaultSample.defaultScript);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [isSavedCurrent, setIsSavedCurrent] = useState(false);

  // Load saved videos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_lesson_saved_videos");
      if (stored) {
        setSavedVideos(JSON.parse(stored));
      } else {
        // Pre-seed with the Tin học 6 lesson so the history tab has sample content
        const initialVideo: SavedVideo = {
          id: "saved-tin-hoc-6",
          lessonTitle: defaultSample.analysis.lessonTitle,
          grade: defaultSample.analysis.grade,
          subject: defaultSample.analysis.subject,
          createdAt: new Date().toISOString(),
          config: {
            style: "Hoạt hình giáo dục",
            aspectRatio: "16:9",
            targetDuration: 45,
            voiceGender: "Nữ",
            voiceRegion: "Giọng miền Bắc",
            hasSubtitles: true,
            questionCount: 2,
            strictMode: true,
          },
          analysis: defaultSample.analysis,
          script: defaultSample.defaultScript,
        };
        setSavedVideos([initialVideo]);
        localStorage.setItem(
          "ai_lesson_saved_videos",
          JSON.stringify([initialVideo])
        );
      }
    } catch (e) {
      console.error("Lỗi đọc localStorage:", e);
    }
  }, []);

  // Save videos to localStorage
  const saveVideosToStorage = (list: SavedVideo[]) => {
    setSavedVideos(list);
    try {
      localStorage.setItem("ai_lesson_saved_videos", JSON.stringify(list));
    } catch (e) {
      console.error("Lỗi lưu localStorage:", e);
    }
  };

  // Upload actions
  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  // Select sample lesson
  const handleSelectSample = (sample: SampleLesson) => {
    setSubjectHint(sample.subject);
    setGradeHint(sample.grade);
    setAnalysis(sample.analysis);
    setScript(sample.defaultScript);
    setFiles([
      {
        id: `sample-${sample.id}`,
        name: `SGK_${sample.subject}_${sample.grade}_${sample.analysis.lessonTitle.replace(/\s+/g, "_")}.docx`,
        size: 1024 * 35,
        type: "application/docx",
        extractedText: sample.extractedText,
      },
    ]);
    setIsSavedCurrent(false);
  };

  // Start Document Analysis
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      // Gather text and images
      const documentTexts = files
        .map((f) => f.extractedText)
        .filter(Boolean)
        .join("\n\n");

      const imageOrPdfFiles = files
        .filter((f) => f.base64)
        .map((f) => ({
          name: f.name,
          mimeType: f.type,
          base64: f.base64,
        }));

      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTexts,
          files: imageOrPdfFiles,
          strictMode: config.strictMode,
          subjectHint,
          gradeHint,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
        setCurrentStep("analysis");
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } else {
        setAnalysisError(json.error || "Có lỗi xảy ra khi phân tích tài liệu. Thầy cô vui lòng thử lại hoặc chọn bài mẫu.");
      }
    } catch (err: any) {
      console.error("Lỗi phân tích:", err);
      setAnalysisError("Không thể kết nối đến máy chủ phân tích AI. Thầy cô vui lòng kiểm tra kết nối và nhấn Thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Video Script
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          style: config.style,
          aspectRatio: config.aspectRatio,
          targetDuration: config.targetDuration,
          voiceGender: config.voiceGender,
          voiceRegion: config.voiceRegion,
          hasSubtitles: config.hasSubtitles,
          questionCount: config.questionCount,
          strictMode: config.strictMode,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setScript(json.data);
        setCurrentStep("script");
        confetti({ particleCount: 50, spread: 70 });
      } else {
        alert(json.error || "Không thể tạo kịch bản video.");
      }
    } catch (err: any) {
      console.error("Lỗi tạo kịch bản:", err);
      alert("Không thể tạo kịch bản video.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Save current video to history
  const handleSaveToHistory = () => {
    const newSaved: SavedVideo = {
      id: `vid-${Date.now()}`,
      lessonTitle: script.lessonTitle,
      grade: script.grade,
      subject: script.subject,
      createdAt: new Date().toISOString(),
      config,
      analysis,
      script,
    };

    const updated = [newSaved, ...savedVideos];
    saveVideosToStorage(updated);
    setIsSavedCurrent(true);
    confetti({ particleCount: 60, spread: 60 });
  };

  // History item actions
  const handleSelectHistoryVideo = (v: SavedVideo) => {
    setScript(v.script);
    setAnalysis(v.analysis);
    setConfig(v.config);
    setIsSavedCurrent(true);
    setCurrentStep("player");
  };

  const handleEditHistoryVideo = (v: SavedVideo) => {
    setScript(v.script);
    setAnalysis(v.analysis);
    setConfig(v.config);
    setIsSavedCurrent(true);
    setCurrentStep("script");
  };

  const handleDeleteHistoryVideo = (id: string) => {
    const updated = savedVideos.filter((v) => v.id !== id);
    saveVideosToStorage(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        savedCount={savedVideos.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentStep === "upload" && (
          <DocumentUploader
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onClearFiles={handleClearFiles}
            onSelectSample={handleSelectSample}
            config={config}
            onChangeConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            subjectHint={subjectHint}
            onChangeSubjectHint={setSubjectHint}
            gradeHint={gradeHint}
            onChangeGradeHint={setGradeHint}
            analysisError={analysisError}
            onClearAnalysisError={() => setAnalysisError(null)}
          />
        )}

        {currentStep === "analysis" && (
          <AnalysisResults
            analysis={analysis}
            onChangeAnalysis={setAnalysis}
            config={config}
            onChangeConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
            onProceedToScript={handleGenerateScript}
            onBackToUpload={() => setCurrentStep("upload")}
            isGeneratingScript={isGeneratingScript}
          />
        )}

        {currentStep === "script" && (
          <ScriptEditor
            script={script}
            onChangeScript={setScript}
            config={config}
            onChangeConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
            analysis={analysis}
            onRegenerateAll={handleGenerateScript}
            onPreviewVideo={() => setCurrentStep("player")}
            onGenerateVideo={() => setCurrentStep("player")}
            onExportDoc={() => exportScriptAsDoc(script, analysis, config)}
            isRegenerating={isGeneratingScript}
            uploadedFiles={files}
          />
        )}

        {currentStep === "player" && (
          <VideoPlayer
            script={script}
            onChangeScript={setScript}
            config={config}
            analysis={analysis}
            onEditScript={() => setCurrentStep("script")}
            onSaveToHistory={handleSaveToHistory}
            isSaved={isSavedCurrent}
            onExportDoc={() => exportScriptAsDoc(script, analysis, config)}
            uploadedFiles={files}
          />
        )}

        {currentStep === "history" && (
          <VideoHistory
            savedVideos={savedVideos}
            onSelectVideo={handleSelectHistoryVideo}
            onEditVideo={handleEditHistoryVideo}
            onDeleteVideo={handleDeleteHistoryVideo}
            onStartNew={() => setCurrentStep("upload")}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-700">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Ứng dụng <strong>AI Tạo Video Khởi Động Bài Học</strong> dành cho Giáo viên THCS Việt Nam • Tối ưu theo Chương trình GDPT 2018
          </p>
          <p className="text-slate-700">
            Hỗ trợ môn Tin học lớp 6, 7, 8, 9 và tất cả các môn học THCS
          </p>
        </div>
      </footer>
    </div>
  );
}

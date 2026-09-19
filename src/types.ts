export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string; // "image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", etc.
  base64?: string;
  extractedText?: string;
  previewUrl?: string;
  pageCount?: number;
}

export interface DocumentAnalysis {
  lessonTitle: string;
  grade: string;
  subject: string;
  theme: string;
  keyKnowledge: string[];
  coreConcepts: string[];
  suitableExamples: string[];
  curiousProblem: string;
  hasInsufficientInfo?: boolean;
  warningMessage?: string;
}

export interface ScriptScene {
  id: string;
  sceneNumber: number;
  sceneName: string;
  content: string;
  visualDescription: string;
  voiceover: string;
  duration: number; // in seconds
  keyVisualType?: string; // e.g. "message_phone", "clock_confusion", "data_types", "data_vs_info", "quiz_hook", "classroom"
  imageUrl?: string;
  imagePrompt?: string;
}

export interface VideoScript {
  lessonTitle: string;
  grade: string;
  subject: string;
  style: string;
  targetDuration: number;
  scenes: ScriptScene[];
  warmupQuestions: string[];
  transitionPhrase: string;
}

export type VideoStyle =
  | "Hoạt hình giáo dục"
  | "Lớp học hiện đại"
  | "Học sinh THCS"
  | "Giáo viên và học sinh"
  | "Hoạt hình 3D"
  | "Vui nhộn"
  | "Tình huống đời sống";

export type AspectRatio = "16:9" | "9:16" | "1:1";

export type VoiceGender = "Nam" | "Nữ";

export type VoiceRegion = "Giọng miền Bắc" | "Giọng miền Trung" | "Giọng miền Nam";

export interface VideoConfig {
  style: VideoStyle;
  aspectRatio: AspectRatio;
  targetDuration: number; // 30, 45, 60, 90
  voiceGender: VoiceGender;
  voiceRegion: VoiceRegion;
  hasSubtitles: boolean;
  questionCount: number; // 1, 2, 3
  strictMode: boolean; // Chỉ sử dụng thông tin trong tài liệu đã tải lên
}

export interface SavedVideo {
  id: string;
  lessonTitle: string;
  grade: string;
  subject: string;
  createdAt: string;
  config: VideoConfig;
  analysis: DocumentAnalysis;
  script: VideoScript;
}

export type AppStep = "upload" | "analysis" | "script" | "player" | "history";

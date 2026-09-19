import React from "react";
import {
  Sliders,
  Tv,
  Smartphone,
  Square,
  Clock,
  Volume2,
  Subtitles,
  HelpCircle,
  Palette,
  Check,
} from "lucide-react";
import {
  VideoConfig,
  VideoStyle,
  AspectRatio,
  VoiceGender,
  VoiceRegion,
} from "../types";

interface VideoConfigModalProps {
  config: VideoConfig;
  onChangeConfig: (newConfig: Partial<VideoConfig>) => void;
  onApplyAndRegenerate?: () => void;
}

export const VideoConfigModal: React.FC<VideoConfigModalProps> = ({
  config,
  onChangeConfig,
  onApplyAndRegenerate,
}) => {
  const styles: VideoStyle[] = [
    "Hoạt hình giáo dục",
    "Lớp học hiện đại",
    "Học sinh THCS",
    "Giáo viên và học sinh",
    "Hoạt hình 3D",
    "Vui nhộn",
    "Tình huống đời sống",
  ];

  const durations = [30, 45, 60, 90];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">
            Cấu hình phong cách & Định dạng video
          </h3>
        </div>
        <span className="text-xs text-slate-700 font-medium">Tùy biến cho lớp học THCS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Style selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            Phong cách hiển thị:
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {styles.map((st) => (
              <button
                key={st}
                type="button"
                id={`style-btn-${st.replace(/\s+/g, "-")}`}
                onClick={() => onChangeConfig({ style: st })}
                className={`text-left p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                  config.style === st
                    ? "bg-blue-50 border-blue-600 text-blue-800 font-bold shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                }`}
              >
                <span className="truncate">{st}</span>
                {config.style === st && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio & Duration */}
        <div className="space-y-4">
          {/* Aspect ratio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-blue-600" />
              Tỷ lệ khung hình:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="aspect-16-9"
                onClick={() => onChangeConfig({ aspectRatio: "16:9" })}
                className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                  config.aspectRatio === "16:9"
                    ? "bg-blue-50 border-blue-600 text-blue-800 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>16:9 (Slide/TV)</span>
              </button>
              <button
                type="button"
                id="aspect-9-16"
                onClick={() => onChangeConfig({ aspectRatio: "9:16" })}
                className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                  config.aspectRatio === "9:16"
                    ? "bg-blue-50 border-blue-600 text-blue-800 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>9:16 (Dọc)</span>
              </button>
              <button
                type="button"
                id="aspect-1-1"
                onClick={() => onChangeConfig({ aspectRatio: "1:1" })}
                className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                  config.aspectRatio === "1:1"
                    ? "bg-blue-50 border-blue-600 text-blue-800 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                }`}
              >
                <Square className="w-4 h-4" />
                <span>1:1 (Vuông)</span>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Thời lượng mục tiêu:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durations.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  id={`duration-btn-${dur}`}
                  onClick={() => onChangeConfig({ targetDuration: dur })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    config.targetDuration === dur
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voiceover, Subtitles & Question count */}
        <div className="space-y-4">
          {/* Voice selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              Giọng đọc thuyết minh:
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(["Nữ", "Nam"] as VoiceGender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  id={`voice-gender-${g}`}
                  onClick={() => onChangeConfig({ voiceGender: g })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    config.voiceGender === g
                      ? "bg-blue-50 border-blue-600 text-blue-800"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  Giọng {g}
                </button>
              ))}
            </div>
            <select
              id="voice-region-select"
              value={config.voiceRegion}
              onChange={(e) =>
                onChangeConfig({ voiceRegion: e.target.value as VoiceRegion })
              }
              className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
            >
              <option value="Giọng miền Bắc">Giọng miền Bắc (Hà Nội chuẩn)</option>
              <option value="Giọng miền Trung">Giọng miền Trung (Ấm áp, truyền cảm)</option>
              <option value="Giọng miền Nam">Giọng miền Nam (Sài Gòn vui tươi)</option>
            </select>
          </div>

          {/* Subtitle toggle & Questions count */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Subtitles className="w-3.5 h-3.5 text-blue-600" />
                Phụ đề video:
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-2 rounded-lg select-none hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={config.hasSubtitles}
                  onChange={(e) =>
                    onChangeConfig({ hasSubtitles: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-900">
                  {config.hasSubtitles ? "Có phụ đề" : "Tắt phụ đề"}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Số câu hỏi cuối:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    id={`question-count-${num}`}
                    onClick={() => onChangeConfig({ questionCount: num })}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      config.questionCount === num
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {num} câu
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

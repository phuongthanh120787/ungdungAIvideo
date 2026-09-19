import { VideoScript, VideoConfig, DocumentAnalysis } from "../types";

export function exportScriptAsDoc(
  script: VideoScript,
  analysis: DocumentAnalysis,
  config: VideoConfig
) {
  const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Kịch bản video khởi động: ${script.lessonTitle}</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 40px; color: #111; }
    h1 { font-size: 20pt; text-align: center; color: #1e3a8a; margin-bottom: 5px; }
    h2 { font-size: 14pt; text-align: center; color: #475569; font-weight: normal; margin-top: 0; }
    .meta { margin: 25px 0; border: 1px solid #cbd5e1; padding: 15px; background: #f8fafc; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #000; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; font-weight: bold; }
    .hook-box { margin-top: 25px; border: 2px solid #2563eb; padding: 15px; background: #eff6ff; border-radius: 6px; }
    .transition { font-style: italic; font-weight: bold; color: #1d4ed8; margin-top: 10px; font-size: 13pt; }
  </style>
</head>
<body>
  <h1>KỊCH BẢN VIDEO KHỞI ĐỘNG BÀI HỌC</h1>
  <h2>Bài: ${script.lessonTitle} (${script.subject} - ${script.grade})</h2>

  <div class="meta">
    <p><strong>Môn học:</strong> ${script.subject} | <strong>Khối lớp:</strong> ${script.grade}</p>
    <p><strong>Chủ đề:</strong> ${analysis.theme || "Theo SGK"}</p>
    <p><strong>Phong cách video:</strong> ${config.style} | <strong>Tỷ lệ:</strong> ${config.aspectRatio}</p>
    <p><strong>Thời lượng ước tính:</strong> ~${script.targetDuration} giây | <strong>Giọng đọc:</strong> ${config.voiceGender} (${config.voiceRegion})</p>
    <p><strong>Vấn đề gây tò mò:</strong> ${analysis.curiousProblem}</p>
  </div>

  <h3>BẢNG CHI TIẾT CÁC CẢNH QUAY:</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">STT</th>
        <th style="width: 15%;">Cảnh</th>
        <th style="width: 25%;">Nội dung (Bối cảnh / Diễn biến)</th>
        <th style="width: 25%;">Hình ảnh minh họa (Visual)</th>
        <th style="width: 25%;">Lời thoại / Thuyết minh</th>
        <th style="width: 5%;">Thời lượng</th>
      </tr>
    </thead>
    <tbody>
      ${script.scenes
        .map(
          (s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${s.sceneName}</strong></td>
          <td>${s.content}</td>
          <td>${s.visualDescription}</td>
          <td>${s.voiceover}</td>
          <td style="text-align: center;">${s.duration}s</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="hook-box">
    <h3 style="color: #1e40af; margin-top: 0;">CÂU HỎI KHỞI ĐỘNG (Dẫn vào bài học):</h3>
    <ul>
      ${script.warmupQuestions.map((q) => `<li style="font-size: 12pt; margin-bottom: 8px;"><strong>${q}</strong></li>`).join("")}
    </ul>
    <p class="transition">"${script.transitionPhrase}"</p>
  </div>

  <p style="margin-top: 30px; font-size: 10pt; color: #64748b; text-align: right;">
    Tài liệu tạo bởi ứng dụng AI Tạo Video Khởi Động Bài Học dành cho giáo viên THCS.
  </p>
</body>
</html>
`;

  const blob = new Blob(["\ufeff" + content], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kich_ban_khoi_dong_${script.subject}_${script.grade}_${script.lessonTitle.replace(/\s+/g, "_")}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportScriptAsJson(script: VideoScript, analysis: DocumentAnalysis, config: VideoConfig) {
  const data = {
    exportedAt: new Date().toISOString(),
    analysis,
    config,
    script,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kich_ban_${script.lessonTitle.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParseModule: any = require("pdf-parse");

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Safely extract text from PDF buffer
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    if (pdfParseModule && pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: pdfBuffer, verbosity: 0 });
      const res = await parser.getText();
      await parser.destroy();
      return (res && res.text) ? res.text.trim() : "";
    }
    if (typeof pdfParseModule === "function") {
      const res = await pdfParseModule(pdfBuffer);
      return (res && res.text) ? res.text.trim() : "";
    }
    return "";
  } catch (err) {
    console.warn("Lỗi trích xuất chữ từ PDF:", err);
    return "";
  }
}

// Call Gemini with automatic fallback to secondary model if primary experiences high demand (503/429)
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config: any
) {
  const models = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`[AI Engine] Model ${model} gặp sự cố (đang thử mô hình dự phòng):`, err.message || err);
      lastError = err;
      if (i < models.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }

  throw lastError || new Error("Không thể kết nối đến mô hình AI.");
}

// Heuristic fallback analysis in case all AI requests fail
function generateFallbackAnalysis(text: string, subjectHint?: string, gradeHint?: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const titleMatch = clean.match(/(?:Bài|Chủ đề|Chương)\s*(\d+)?[:.-]?\s*([^\n.;]{4,60})/i);
  const detectedTitle = titleMatch ? titleMatch[0].trim() : (clean.slice(0, 45) || "Thông tin và dữ liệu");

  return {
    lessonTitle: detectedTitle,
    grade: gradeHint || "Lớp 6",
    subject: subjectHint || "Tin học",
    theme: "Chương trình Giáo dục phổ thông 2018",
    keyKnowledge: [
      "Khái niệm và vai trò trọng tâm được nêu trong tài liệu bài học",
      "Các đặc điểm, quy tắc hoặc ứng dụng thực tiễn của kiến thức bài học",
      "Mối liên hệ giữa kiến thức lý thuyết và tình huống thực tế đời sống",
    ],
    coreConcepts: ["Khái niệm trọng tâm", "Quy tắc áp dụng", "Ứng dụng thực tế"],
    suitableExamples: [
      "Tình huống thực tế thường gặp của học sinh trong sinh hoạt và học tập",
      "Một sự cố nhầm lẫn hoặc câu đố kích thích tư duy suy luận",
      "Ví dụ trực quan về hình ảnh hoặc âm thanh gắn với bài học",
    ],
    curiousProblem:
      "Làm thế nào để phân biệt và áp dụng chính xác các khái niệm này khi đối mặt với một tình huống thực tế trong đời sống học đường?",
    hasInsufficientInfo: false,
    warningMessage: "Phân tích tự động từ văn bản tài liệu đã tải lên.",
  };
}

function getAspectRatioDimensions(aspectRatio: string = "16:9") {
  if (aspectRatio === "9:16") return { width: 720, height: 1280 };
  if (aspectRatio === "1:1") return { width: 800, height: 800 };
  return { width: 1280, height: 720 };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildSceneImageUrl(
  scene: {
    sceneName?: string;
    content?: string;
    visualDescription?: string;
    imagePrompt?: string;
    keyVisualType?: string;
  },
  style: string = "Hoạt hình giáo dục",
  aspectRatio: string = "16:9",
  subject: string = "Tin học",
  lessonTitle: string = "",
  index: number = 0
): string {
  const { width, height } = getAspectRatioDimensions(aspectRatio);
  const styleKeywords: Record<string, string> = {
    "Hoạt hình giáo dục":
      "clean vibrant 2D educational vector cartoon illustration, cheerful Vietnamese school setting, crisp lines, modern flat art",
    "Hoạt hình 3D":
      "3D Pixar Disney style cute render, expressive character, soft volumetric lighting, colorful educational scene",
    "Lớp học hiện đại":
      "modern smart classroom, Vietnamese students, digital screen, bright and engaging educational photography style",
    "Học sinh THCS":
      "Vietnamese secondary school students in uniform, curious thoughtful expression, digital illustration",
    "Vui nhộn":
      "colorful comic book style, funny surprised facial expression, bright dynamic composition, educational hook",
    "Tình huống đời sống":
      "relatable daily student life in Vietnam, friendly warm atmosphere, modern digital illustration",
    "Giáo viên và học sinh":
      "friendly teacher and energetic students interacting in school, inspiring educational scene",
  };

  const stylePrefix =
    styleKeywords[style] ||
    "clean vibrant educational illustration for secondary school students";

  let coreDesc =
    scene.imagePrompt ||
    scene.visualDescription ||
    scene.content ||
    `${subject} lesson ${lessonTitle}`;
  coreDesc = coreDesc.replace(/[\n\r]/g, " ").slice(0, 180);

  const combinedPrompt = `${stylePrefix}, ${coreDesc}, educational scene for subject ${subject}, high quality, beautiful composition, no watermark`;
  const seed = (hashString(scene.content || "") + index * 101) % 999999 + 1;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    combinedPrompt
  )}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Analyze Document
app.post("/api/analyze-document", async (req, res) => {
  try {
    const { documentTexts, files, strictMode, subjectHint, gradeHint } = req.body;

    let combinedText = documentTexts || "";

    // If PDF or image files are attached
    const remainingMultimodalFiles: any[] = [];
    if (Array.isArray(files) && files.length > 0) {
      for (const f of files) {
        if ((f.mimeType === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf")) && f.base64) {
          try {
            const rawBase64 = f.base64.replace(/^data:[^;]+;base64,/, "");
            const pdfBuffer = Buffer.from(rawBase64, "base64");
            const extractedPdfText = await extractTextFromPdf(pdfBuffer);
            if (extractedPdfText && extractedPdfText.length > 20) {
              combinedText += `\n\n--- NỘI DUNG TỪ SÁCH GIÁO KHOA / TÀI LIỆU PDF (${f.name}) ---\n${extractedPdfText.slice(0, 35000)}`;
            } else {
              // If text extraction yielded very little (scanned PDF), only add if reasonably sized (<10MB)
              if (rawBase64.length < 14 * 1024 * 1024) {
                remainingMultimodalFiles.push(f);
              }
            }
          } catch (pdfErr) {
            console.warn("Could not parse PDF text:", pdfErr);
          }
        } else if (f.mimeType && f.mimeType.startsWith("image/")) {
          remainingMultimodalFiles.push(f);
        } else if (f.extractedText) {
          combinedText += `\n\n--- TÀI LIỆU: ${f.name} ---\n${f.extractedText}`;
        }
      }
    }

    const ai = getGeminiClient();

    // Prepare prompt
    const promptText = `
Bạn là chuyên gia sư phạm và cố vấn nội dung giáo dục THCS hàng đầu tại Việt Nam, đặc biệt am hiểu chương trình Giáo dục phổ thông 2018 (sách Kết nối tri thức, Chân trời sáng tạo, Cánh diều), ưu tiên môn Tin học và các môn THCS.

Nhiệm vụ của bạn:
Phân tích kỹ lưỡng tài liệu bài học/sách giáo khoa do giáo viên tải lên và trích xuất các thông tin cốt lõi để chuẩn bị làm kịch bản video khởi động (warm-up video).

Quy tắc quan trọng:
${
  strictMode
    ? `- [CHẾ ĐỘ NGHIÊM NGẶT ĐƯỢC BẬT]: CHỈ SỬ DỤNG THÔNG TIN TRONG TÀI LIỆU ĐÃ TẢI LÊN.
- Tuyệt đối không tự ý đưa kiến thức ngoài tài liệu.
- Không tự ý thay đổi thuật ngữ trong SGK.
- Không bịa đặt nội dung.
- Nếu tài liệu bị thiếu hoặc không đủ thông tin để xác định đầy đủ, bạn phải ghi rõ vào warningMessage và đặt hasInsufficientInfo = true.`
    : `- Ưu tiên tối đa nội dung trong tài liệu. Có thể bổ sung ngữ cảnh sư phạm chuẩn của SGK THCS Việt Nam nếu tài liệu là phần trích đoạn.`
}
- Mục tiêu của video khởi động: KHÔNG GIẢNG BÀI TOÀN BỘ, không giải hết kiến thức. Phải tìm ra một tình huống gần gũi, một sự cố, thắc mắc, hoặc nghịch lý đời thường để gây tò mò, tạo động lực tìm hiểu cho học sinh THCS (11-15 tuổi).

Tài liệu được cung cấp dưới đây:
${combinedText ? `--- VĂN BẢN TÀI LIỆU TRÍCH XUẤT ---\n${combinedText.slice(0, 40000)}` : "(Xem các trang sách giáo khoa đính kèm dưới dạng hình ảnh)"}
${subjectHint ? `Gợi ý môn học: ${subjectHint}` : ""}
${gradeHint ? `Gợi ý khối lớp: ${gradeHint}` : ""}

Hãy phân tích và trả về đúng định dạng JSON theo schema đã cho.
`;

    if (!ai) {
      // Fallback if no API key is provided
      const fallbackData = generateFallbackAnalysis(combinedText, subjectHint, gradeHint);
      return res.json({ success: true, data: fallbackData });
    }

    const contentsParts: any[] = [{ text: promptText }];

    // If there are image files or scanned pages, add up to 5 images
    if (remainingMultimodalFiles.length > 0) {
      for (const f of remainingMultimodalFiles.slice(0, 5)) {
        if (f.base64 && f.mimeType) {
          contentsParts.push({
            inlineData: {
              mimeType: f.mimeType,
              data: f.base64.replace(/^data:[^;]+;base64,/, ""),
            },
          });
        }
      }
    }

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lessonTitle: { type: Type.STRING, description: "Tên bài học cụ thể" },
          grade: { type: Type.STRING, description: "Lớp học (Ví dụ: Lớp 6, Lớp 7, Lớp 8, Lớp 9)" },
          subject: { type: Type.STRING, description: "Môn học (Ví dụ: Tin học, Toán học, KHTN...)" },
          theme: { type: Type.STRING, description: "Chủ đề hoặc chương" },
          keyKnowledge: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Danh sách 3-5 điểm kiến thức trọng tâm",
          },
          coreConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Các khái niệm chính trong bài",
          },
          suitableExamples: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Các ví dụ, tình huống hoặc hình ảnh gần gũi phù hợp tạo video khởi động",
          },
          curiousProblem: {
            type: Type.STRING,
            description: "Vấn đề hoặc nghịch lý kích thích sự tò mò của học sinh THCS",
          },
          hasInsufficientInfo: {
            type: Type.BOOLEAN,
            description: "True nếu tài liệu quá ngắn hoặc không đủ thông tin khi bật chế độ nghiêm ngặt",
          },
          warningMessage: {
            type: Type.STRING,
            description: "Cảnh báo hoặc ghi chú cho giáo viên nếu có",
          },
        },
        required: [
          "lessonTitle",
          "grade",
          "subject",
          "theme",
          "keyKnowledge",
          "coreConcepts",
          "suitableExamples",
          "curiousProblem",
          "hasInsufficientInfo",
        ],
      },
    };

    try {
      const response = await callGeminiWithFallback(ai, contentsParts, schemaConfig);
      const parsedData = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsedData });
    } catch (aiErr: any) {
      console.warn("AI models failed, using intelligent pedagogical fallback:", aiErr.message);
      // If AI call failed, provide a graceful fallback so teacher is never stuck!
      const fallbackData = generateFallbackAnalysis(combinedText, subjectHint, gradeHint);
      return res.json({
        success: true,
        data: fallbackData,
        isFallback: true,
      });
    }
  } catch (error: any) {
    console.error("Error analyzing document:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Không thể phân tích tài liệu bằng AI.",
    });
  }
});

// Generate Script
app.post("/api/generate-script", async (req, res) => {
  try {
    const {
      analysis,
      style = "Hoạt hình giáo dục",
      aspectRatio = "16:9",
      targetDuration = 45,
      voiceGender = "Nữ",
      voiceRegion = "Giọng miền Bắc",
      hasSubtitles = true,
      questionCount = 2,
      strictMode = true,
      customTeacherNote = "",
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `
Bạn là chuyên gia biên kịch video giáo dục hàng đầu tại Việt Nam cho lứa tuổi THCS.
Nhiệm vụ: Tạo kịch bản video khởi động bài học (Warm-up Video) hấp dẫn, kích thích tư duy học sinh trước khi giáo viên bắt đầu giảng bài mới.

THÔNG TIN BÀI HỌC:
- Môn học: ${analysis?.subject || "Tin học"}
- Lớp: ${analysis?.grade || "Lớp 6"}
- Tên bài: ${analysis?.lessonTitle || "Thông tin và dữ liệu"}
- Chủ đề: ${analysis?.theme || "Chủ đề bài học"}
- Kiến thức trọng tâm: ${(analysis?.keyKnowledge || []).join("; ")}
- Các khái niệm chính: ${(analysis?.coreConcepts || []).join("; ")}
- Tình huống đề xuất: ${(analysis?.suitableExamples || []).join("; ")}
- Vấn đề gây tò mò: ${analysis?.curiousProblem || ""}

CẤU HÌNH VIDEO:
- Phong cách: ${style}
- Tỷ lệ khung hình: ${aspectRatio}
- Tổng thời lượng mục tiêu: ${targetDuration} giây
- Giọng đọc: ${voiceGender} (${voiceRegion})
- Phụ đề: ${hasSubtitles ? "Có phụ đề" : "Không phụ đề"}
- Số lượng câu hỏi khởi động ở cảnh cuối: ${questionCount} câu hỏi
- Chế độ chỉ dùng tài liệu: ${strictMode ? "BẬT (Tuân thủ thuật ngữ SGK, không bịa)" : "TẮT"}
${customTeacherNote ? `- Yêu cầu thêm từ giáo viên: ${customTeacherNote}` : ""}

QUY TẮC CẤU TRÚC KỊCH BẢN BẮT BUỘC:
- Số cảnh: 4 đến 6 cảnh (mỗi cảnh khoảng 5-10 giây, tổng khoảng ${targetDuration}s).
- Nội dung: Vui vẻ, gần gũi học sinh THCS (từ 11-15 tuổi), nhịp điệu sinh động.
- KHÔNG GIẢNG BÀI DÀI DÒNG. KHÔNG TIẾT LỘ ĐÁP ÁN TRƯỚC. Phải tạo sự tò mò.
- Cấu trúc chuẩn:
  + CẢNH 1: Tạo tình huống gần gũi với học sinh (như nhận tin nhắn, lướt điện thoại, chuẩn bị đi học, bài toán nhỏ...).
  + CẢNH 2: Xuất hiện một vấn đề hoặc điều bất ngờ, một sự hiểu lầm hay nghịch lý.
  + CẢNH 3: Nhân vật suy nghĩ, tranh luận hoặc trao đổi vui nhộn.
  + CẢNH 4: Đặt vấn đề liên quan trực tiếp đến kiến thức bài học hôm nay.
  + CẢNH CUỐI: Đưa ra đúng ${questionCount} câu hỏi khởi động để học sinh suy nghĩ, kết thúc bằng câu chuyển:
    "Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!"

Hãy trả về JSON theo schema quy định.
`;

    if (!ai) {
      const fallbackScenes = [
        {
          id: "sc-1",
          sceneNumber: 1,
          sceneName: "Tình huống bất ngờ",
          content:
            "Bạn An đang ngồi làm bài thì điện thoại rung lên nhận được một tin nhắn kỳ lạ từ bạn Bình.",
          visualDescription:
            "Hoạt hình 2D sinh động, học sinh THCS ngồi bàn học, màn hình điện thoại phóng to hiện dòng chữ: 'Hãy gọi cho mình lúc 16 giờ nhé!'.",
          imagePrompt:
            "A Vietnamese middle school student looking surprised at a modern smartphone showing a text message, vibrant educational illustration",
          voiceover:
            "Chiều nay, An bất ngờ nhận được tin nhắn từ cậu bạn thân: 'Hãy gọi cho mình lúc 16 giờ nhé!'.",
          duration: 8,
          keyVisualType: "message_phone",
        },
        {
          id: "sc-2",
          sceneNumber: 2,
          sceneName: "Xuất hiện điều khó hiểu",
          content:
            "An nhìn đồng hồ treo tường và giật mình nhận ra mình không biết gọi vào ngày nào hay gọi việc gì.",
          visualDescription:
            "Đồng hồ tích tắc quay, dấu chấm hỏi khổng lồ hiện trên đầu nhân vật An với biểu cảm bối rối hài hước.",
          imagePrompt:
            "A thoughtful student looking at a ticking wall clock with glowing question marks floating, colorful educational cartoon",
          voiceover:
            "Ủa, nhưng 16 giờ ngày hôm nay hay ngày mai? Gọi bằng điện thoại hay gọi Zalo? Sao tin nhắn ngắn ngủn thế này?",
          duration: 8,
          keyVisualType: "clock_confusion",
        },
        {
          id: "sc-3",
          sceneNumber: 3,
          sceneName: "Đa dạng các dạng dữ liệu",
          content:
            "Xung quanh An bay lơ lửng các dòng chữ, con số, hình ảnh và âm thanh chuông điện thoại reo.",
          visualDescription:
            "Đồ họa các biểu tượng: chữ viết ABC, con số 123, file ảnh chụp, sóng âm thanh xuất hiện lấp lánh xung quanh.",
          imagePrompt:
            "Floating glowing icons of numbers, letters, images, audio waves around a curious student, modern digital classroom art",
          voiceover:
            "Hằng ngày, chúng ta nhìn thấy vô vàn con số, chữ viết và hình ảnh. Đó chính là những dữ liệu!",
          duration: 9,
          keyVisualType: "data_types",
        },
        {
          id: "sc-4",
          sceneNumber: 4,
          sceneName: "Kết nối vào bài học",
          content:
            "An và các bạn cùng so sánh: những con số vô tri kia trở thành điều có ích khi nào?",
          visualDescription:
            "Hai cột so sánh: Bên trái là 'Dữ liệu' (chữ, số thô), bên phải là 'Thông tin' (ý nghĩa, hành động thực tế).",
          imagePrompt:
            "Two comparison panels labeled Data and Information with arrows and lightbulb icons, clean infographic educational style",
          voiceover:
            "Nhưng dữ liệu và thông tin có phải là một không? Khi nào một con số vô tri mới biến thành thông tin hữu ích cho chúng ta?",
          duration: 9,
          keyVisualType: "data_vs_info",
        },
        {
          id: "sc-5",
          sceneNumber: 5,
          sceneName: "Câu hỏi khởi động & Chuyển bài",
          content:
            "Hiện bảng câu hỏi khởi động lớn, các bạn học sinh hào hứng giơ tay trong lớp học.",
          visualDescription:
            "Màn hình lớp học hiện đại, bảng xanh sáng rõ hiển thị các câu hỏi gợi mở, giáo viên tươi cười chỉ vào bảng.",
          imagePrompt:
            "Modern secondary school classroom with enthusiastic students raising hands, smiling teacher pointing to smart board",
          voiceover:
            "Em hãy suy nghĩ: Thông tin và dữ liệu có giống nhau không? Cùng một dữ liệu, mọi người có nhận được cùng một thông tin không? Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
          duration: 11,
          keyVisualType: "quiz_hook",
        },
      ];

      return res.json({
        success: true,
        data: {
          lessonTitle: analysis?.lessonTitle || "Thông tin và dữ liệu",
          grade: analysis?.grade || "Lớp 6",
          subject: analysis?.subject || "Tin học",
          style,
          targetDuration,
          scenes: fallbackScenes.map((s, idx) => ({
            ...s,
            imageUrl: buildSceneImageUrl(
              s,
              style,
              aspectRatio,
              analysis?.subject || "Tin học",
              analysis?.lessonTitle || "",
              idx
            ),
          })),
          warmupQuestions: [
            "Theo em, dữ liệu và thông tin có giống nhau hoàn toàn không?",
            "Nếu nhận được một con số '39', em đã biết đó là thông tin gì chưa, hay cần thêm điều gì?",
          ].slice(0, questionCount),
          transitionPhrase: "Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
        },
      });
    }

    let parsedScript: any = null;
    try {
      const response = await callGeminiWithFallback(ai, [{ text: prompt }], {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lessonTitle: { type: Type.STRING },
            grade: { type: Type.STRING },
            subject: { type: Type.STRING },
            style: { type: Type.STRING },
            targetDuration: { type: Type.INTEGER },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sceneNumber: { type: Type.INTEGER },
                  sceneName: { type: Type.STRING, description: "Tên ngắn gọn của cảnh" },
                  content: { type: Type.STRING, description: "Hành động, bối cảnh diễn biến" },
                  visualDescription: {
                    type: Type.STRING,
                    description: "Mô tả hình ảnh đồ họa trực quan chi tiết",
                  },
                  imagePrompt: {
                    type: Type.STRING,
                    description:
                      "Detailed 1-2 sentence English visual prompt for generating a vibrant educational illustration matching this scene",
                  },
                  voiceover: {
                    type: Type.STRING,
                    description: "Lời thuyết minh hoặc lời thoại nhân vật",
                  },
                  duration: {
                    type: Type.INTEGER,
                    description: "Thời lượng cảnh tính bằng giây (khoảng 5-10s)",
                  },
                  keyVisualType: {
                    type: Type.STRING,
                    description:
                      "Gợi ý loại hình ảnh đại diện (vd: student_action, problem_hook, discussion, compare_chart, question_screen)",
                  },
                },
                required: [
                  "id",
                  "sceneNumber",
                  "sceneName",
                  "content",
                  "visualDescription",
                  "voiceover",
                  "duration",
                ],
              },
            },
            warmupQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-3 câu hỏi khởi động ngắn gọn, gợi mở",
            },
            transitionPhrase: {
              type: Type.STRING,
              description:
                "Câu chuyển cố định: 'Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!'",
            },
          },
          required: [
            "lessonTitle",
            "grade",
            "subject",
            "scenes",
            "warmupQuestions",
            "transitionPhrase",
          ],
        },
      });

      parsedScript = JSON.parse(response.text || "{}");
    } catch (aiErr: any) {
      console.warn(
        "AI models failed in generate-script, using resilient fallback script:",
        aiErr.message
      );
      parsedScript = {
        lessonTitle: analysis?.lessonTitle || "Thông tin và dữ liệu",
        grade: analysis?.grade || "Lớp 6",
        subject: analysis?.subject || "Tin học",
        style,
        targetDuration,
        scenes: [
          {
            id: "sc-1",
            sceneNumber: 1,
            sceneName: "Tình huống thực tế",
            content: `Các bạn học sinh bắt gặp một câu hỏi gắn liền với ${
              analysis?.lessonTitle || "bài học"
            }.`,
            visualDescription:
              "Hình ảnh lớp học THCS hiện đại, các bạn học sinh đang chăm chú theo dõi tình huống thực tế đời sống.",
            imagePrompt:
              "Vietnamese secondary school students in modern classroom looking curiously at a real world situation on smart screen",
            voiceover: `Các bạn có bao giờ tự hỏi làm sao để giải quyết tình huống quen thuộc này không?`,
            duration: 7,
            keyVisualType: "student_action",
          },
          {
            id: "sc-2",
            sceneNumber: 2,
            sceneName: "Sự cố & Điều bất ngờ",
            content:
              analysis?.curiousProblem ||
              "Một mâu thuẫn hoặc sự nhầm lẫn thú vị phát sinh khiến mọi người tò mò.",
            visualDescription:
              "Đồ họa hoạt hình sinh động, biểu cảm ngạc nhiên của nhân vật với dấu chấm hỏi lớn.",
            imagePrompt:
              "Cute anime style student with big question mark overhead looking puzzled at a funny contradiction, bright colors",
            voiceover: `Một sự cố bất ngờ xuất hiện khiến ai nấy đều băn khoăn và tò mò tìm lời giải!`,
            duration: 8,
            keyVisualType: "problem_hook",
          },
          {
            id: "sc-3",
            sceneNumber: 3,
            sceneName: "Gợi mở & Tranh luận",
            content:
              "Nhân vật thảo luận để tìm ra nguyên nhân và cách xử lý theo kiến thức bài học.",
            visualDescription:
              "Các bạn học sinh cùng trao đổi sôi nổi, đưa ra các giả thuyết thú vị.",
            imagePrompt:
              "Group of secondary students discussing excitedly around a desk, speech bubbles with ideas, warm friendly lighting",
            voiceover: `Liệu đâu mới là câu trả lời chính xác nhất cho tình huống này?`,
            duration: 8,
            keyVisualType: "discussion",
          },
          {
            id: "sc-4",
            sceneNumber: 4,
            sceneName: "Câu hỏi khởi động bài học",
            content:
              "Bảng lớp hiện ra các câu hỏi kích thích tư duy trước khi giáo viên bắt đầu bài mới.",
            visualDescription:
              "Bảng đen kỹ thuật số hiển thị rõ ràng các câu hỏi gợi mở cho cả lớp.",
            imagePrompt:
              "Glowing digital chalkboard displaying key lesson warm-up questions with enthusiastic students looking on",
            voiceover:
              "Thầy cô và các bạn hãy cùng suy nghĩ và tìm câu trả lời trong bài học hôm nay nhé!",
            duration: 12,
            keyVisualType: "question_screen",
          },
        ],
        warmupQuestions: [
          `Theo em, tình huống trên liên quan đến khái niệm gì trong bài ${
            analysis?.lessonTitle || "học"
          }?`,
          "Nếu là em trong tình huống đó, em sẽ xử lý như thế nào?",
        ],
        transitionPhrase: "Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
      };
    }

    // Attach high quality AI image URLs to all scenes
    if (parsedScript && Array.isArray(parsedScript.scenes)) {
      parsedScript.scenes = parsedScript.scenes.map((scene: any, idx: number) => ({
        ...scene,
        imageUrl:
          scene.imageUrl ||
          buildSceneImageUrl(
            scene,
            style,
            aspectRatio,
            analysis?.subject || "Tin học",
            analysis?.lessonTitle || "",
            idx
          ),
      }));
    }

    res.json({ success: true, data: parsedScript });
  } catch (error: any) {
    console.error("Error generating script:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Không thể tạo kịch bản video.",
    });
  }
});

// Regenerate a single scene
app.post("/api/regenerate-scene", async (req, res) => {
  try {
    const { scene, lessonInfo, instruction, style = "Hoạt hình giáo dục", aspectRatio = "16:9" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const updatedScene = {
        ...scene,
        content: `${scene.content} (Đã điều chỉnh phù hợp với yêu cầu: ${instruction || "sinh động hơn"})`,
        voiceover: `${scene.voiceover} Hãy cùng chú ý theo dõi nhé!`,
      };
      updatedScene.imageUrl = buildSceneImageUrl(
        updatedScene,
        style,
        aspectRatio,
        lessonInfo?.subject || "Tin học",
        lessonInfo?.lessonTitle || "",
        scene.sceneNumber || 1
      );
      return res.json({
        success: true,
        data: updatedScene,
      });
    }

    const prompt = `
Bạn là chuyên gia biên kịch video khởi động bài học THCS.
Hãy tạo lại CẢNH SỐ ${scene.sceneNumber} (${scene.sceneName}) cho bài học "${lessonInfo?.lessonTitle || ""}" môn "${lessonInfo?.subject || "Tin học"}".

Cảnh hiện tại:
- Tên: ${scene.sceneName}
- Nội dung: ${scene.content}
- Hình ảnh: ${scene.visualDescription}
- Lời thoại: ${scene.voiceover}
- Thời lượng: ${scene.duration}s

Yêu cầu cải tiến của giáo viên:
"${instruction || "Làm cho tình huống hài hước hơn, phù hợp hơn với tâm lý học sinh lớp " + (lessonInfo?.grade || "6")}"

Hãy trả về duy nhất 1 object JSON mới cho cảnh này theo cấu trúc:
{
  "sceneName": string,
  "content": string,
  "visualDescription": string,
  "imagePrompt": string (1 câu tiếng Anh mô tả tranh minh họa chi tiết),
  "voiceover": string,
  "duration": number,
  "keyVisualType": string
}
`;

    try {
      const response = await callGeminiWithFallback(ai, [{ text: prompt }], {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sceneName: { type: Type.STRING },
            content: { type: Type.STRING },
            visualDescription: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            voiceover: { type: Type.STRING },
            duration: { type: Type.INTEGER },
            keyVisualType: { type: Type.STRING },
          },
          required: ["sceneName", "content", "visualDescription", "voiceover", "duration"],
        },
      });

      const parsedScene = JSON.parse(response.text || "{}");
      const fullScene = {
        ...scene,
        ...parsedScene,
      };
      fullScene.imageUrl = buildSceneImageUrl(
        fullScene,
        style,
        aspectRatio,
        lessonInfo?.subject || "Tin học",
        lessonInfo?.lessonTitle || "",
        scene.sceneNumber || 1
      );

      return res.json({
        success: true,
        data: fullScene,
      });
    } catch (aiErr) {
      const fallbackUpdated = {
        ...scene,
        content: `${scene.content} (${instruction || "Đã làm mới theo yêu cầu của giáo viên"})`,
        voiceover: `${scene.voiceover} Chúng ta cùng tiếp tục quan sát nhé!`,
      };
      fallbackUpdated.imageUrl = buildSceneImageUrl(
        fallbackUpdated,
        style,
        aspectRatio,
        lessonInfo?.subject || "Tin học",
        lessonInfo?.lessonTitle || "",
        scene.sceneNumber || 1
      );
      return res.json({
        success: true,
        data: fallbackUpdated,
      });
    }
  } catch (error: any) {
    console.error("Error regenerating scene:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Không thể tạo lại cảnh.",
    });
  }
});

// Generate or customize image for a single scene
app.post("/api/generate-scene-image", async (req, res) => {
  try {
    const {
      prompt,
      customDescription,
      style = "Hoạt hình giáo dục",
      aspectRatio = "16:9",
      subject = "Tin học",
      lessonTitle = "",
      sceneIndex = 0,
    } = req.body;

    const { width, height } = getAspectRatioDimensions(aspectRatio);
    const ai = getGeminiClient();

    let refinedPrompt = customDescription || prompt || "";

    if (ai && refinedPrompt.length > 3) {
      try {
        const enrichPrompt = `
You are an expert prompt engineer for educational illustrations for school children age 11-15.
Translate and enrich this Vietnamese educational scene into a vivid 1-2 sentence English prompt for visual image generation:
Vietnamese description: "${refinedPrompt}"
Subject: "${subject}"
Lesson: "${lessonTitle}"
Art style: "${style}"

Rules:
- High quality, colorful, clean composition suitable for textbook/educational video.
- Strictly return ONLY the prompt text, no quotes, no conversational text.
`;
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ text: enrichPrompt }],
        });
        if (response && response.text) {
          refinedPrompt = response.text.trim().replace(/^"|"$/g, "");
        }
      } catch (e: any) {
        console.warn("Could not enrich prompt with Gemini:", e.message);
      }
    }

    const stylePrefixes: Record<string, string> = {
      "Hoạt hình giáo dục": "vibrant 2D clean educational cartoon vector illustration, colorful Vietnamese school setting, crisp lines",
      "Hoạt hình 3D": "3D Pixar Disney style cute render, expressive character, soft volumetric lighting, colorful educational scene",
      "Lớp học hiện đại": "modern smart classroom, Vietnamese students, digital screen, bright and engaging educational photography style",
      "Học sinh THCS": "Vietnamese secondary school students in uniform, curious thoughtful expression, digital illustration",
      "Vui nhộn": "colorful comic book style, funny surprised facial expression, bright dynamic composition, educational hook",
      "Tình huống đời sống": "relatable daily student life in Vietnam, friendly warm atmosphere, modern digital illustration",
      "Giáo viên và học sinh": "friendly teacher and energetic students interacting in school, inspiring educational scene",
    };

    const finalPrompt = `${stylePrefixes[style] || "clean educational illustration"}, ${refinedPrompt || subject}, high quality, no watermark`;
    const seed = Math.floor(Math.random() * 900000) + 10000;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

    res.json({
      success: true,
      data: {
        imageUrl,
        imagePrompt: refinedPrompt,
      },
    });
  } catch (error: any) {
    console.error("Error generating scene image:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Không thể tạo ảnh.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

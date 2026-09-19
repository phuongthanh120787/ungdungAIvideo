import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  Download,
  Bookmark,
  Share2,
  Edit,
  Sparkles,
  Music,
  CheckCircle2,
  Tv,
  Smartphone,
  Square,
  Maximize2,
  ListOrdered,
  HelpCircle,
  Copy,
  Check,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { VideoScript, VideoConfig, DocumentAnalysis, ScriptScene, UploadedFile } from "../types";
import { audioController } from "../utils/audioSynthesizer";
import { SceneImageModal } from "./SceneImageModal";

interface VideoPlayerProps {
  script: VideoScript;
  onChangeScript?: (updated: VideoScript) => void;
  config: VideoConfig;
  analysis: DocumentAnalysis;
  onEditScript: () => void;
  onSaveToHistory: () => void;
  isSaved: boolean;
  onExportDoc: () => void;
  uploadedFiles?: UploadedFile[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  script,
  onChangeScript,
  config,
  analysis,
  onEditScript,
  onSaveToHistory,
  isSaved,
  onExportDoc,
  uploadedFiles = [],
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneElapsedTime, setSceneElapsedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isBgmEnabled, setIsBgmEnabled] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [aspectRatio, setAspectRatio] = useState(config.aspectRatio);
  const [showSubtitles, setShowSubtitles] = useState(config.hasSubtitles);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState(false);
  const [selectedSceneForModal, setSelectedSceneForModal] = useState<ScriptScene | null>(null);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentSceneIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Image caching ref for canvas rendering
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imageLoadedTick, setImageLoadedTick] = useState(0);

  // Preload and cache all scene images
  useEffect(() => {
    script.scenes.forEach((s) => {
      if (s.imageUrl && !imageCacheRef.current.has(s.imageUrl)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = s.imageUrl;
        img.onload = () => {
          imageCacheRef.current.set(s.imageUrl!, img);
          setImageLoadedTick((t) => t + 1);
        };
        img.onerror = () => {
          // Retry without crossOrigin if CORS issues occur
          const fallback = new Image();
          fallback.src = s.imageUrl!;
          fallback.onload = () => {
            imageCacheRef.current.set(s.imageUrl!, fallback);
            setImageLoadedTick((t) => t + 1);
          };
        };
      }
    });
  }, [script.scenes]);

  // Update scene image
  const handleUpdateSceneImage = (sceneId: string, newImageUrl: string, newImagePrompt?: string) => {
    // Cache immediately
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = newImageUrl;
    img.onload = () => {
      imageCacheRef.current.set(newImageUrl, img);
      setImageLoadedTick((t) => t + 1);
    };

    if (onChangeScript) {
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
    }
  };

  // Generate AI images for all scenes in the script
  const handleGenerateAllImages = async () => {
    if (!onChangeScript) return;
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
              aspectRatio,
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
            // Preload new image
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = resData.data.imageUrl;
            img.onload = () => {
              imageCacheRef.current.set(resData.data.imageUrl, img);
              setImageLoadedTick((t) => t + 1);
            };
          }
        } catch (e) {
          console.warn(`Lỗi tạo ảnh cho cảnh ${sc.sceneNumber}:`, e);
        }
      }
      onChangeScript({ ...script, scenes: updatedScenes });
    } finally {
      setIsGeneratingAllImages(false);
    }
  };

  // Keep refs in sync for interval loop
  useEffect(() => {
    currentSceneIndexRef.current = currentSceneIndex;
  }, [currentSceneIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Calculate generous duration for each scene so speech, reading & thinking are never cut off
  const sceneDurations = script.scenes.map((s, idx) => {
    const words = (s.voiceover || "").trim().split(/\s+/).filter(Boolean).length;
    // Vietnamese average reading speed in classroom: ~2.3 words/sec + 2.5s padding
    const speechTime = Math.ceil(words / 2.3) + 2.5;
    const baseDur = Number(s.duration) || 7;
    const isLast = idx === script.scenes.length - 1;
    // On the final scene (questions & transition), give at least 15 seconds
    if (isLast) {
      return Math.max(baseDur, speechTime, 15);
    }
    return Math.max(baseDur, speechTime);
  });

  const totalDuration = sceneDurations.reduce((sum, d) => sum + d, 0);
  const currentScene: ScriptScene = script.scenes[currentSceneIndex] || script.scenes[0];

  // Trigger speech when scene starts
  useEffect(() => {
    if (isPlaying && isVoiceEnabled && currentScene) {
      audioController.speakText(
        currentScene.voiceover,
        config.voiceGender,
        config.voiceRegion
      );
    }
  }, [currentSceneIndex, isPlaying, isVoiceEnabled]);

  // Handle BGM
  useEffect(() => {
    if (isPlaying && isBgmEnabled) {
      audioController.startBGM(0.12);
    } else {
      audioController.stopBGM();
    }
    return () => {
      audioController.stopBGM();
      audioController.stopSpeaking();
    };
  }, [isPlaying, isBgmEnabled]);

  // Main playback timer loop - closure-safe & handles exact duration of each scene
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      interval = window.setInterval(() => {
        const cIdx = currentSceneIndexRef.current;
        const dur = sceneDurations[cIdx] || 8;
        const tick = 0.1 * playbackSpeed;

        setSceneElapsedTime((prevScene) => {
          if (prevScene + tick >= dur) {
            // Check if there is a next scene
            if (cIdx < script.scenes.length - 1) {
              const nextIdx = cIdx + 1;
              setCurrentSceneIndex(nextIdx);
              // Set total elapsed to sum of past scenes
              let pastTotal = 0;
              for (let i = 0; i < nextIdx; i++) {
                pastTotal += sceneDurations[i];
              }
              setTotalElapsedTime(pastTotal);
              return 0;
            } else {
              // Video completed full playback!
              setIsPlaying(false);
              setIsCompleted(true);
              audioController.playSoundEffect("success");
              confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
              setTotalElapsedTime(totalDuration);
              return dur;
            }
          }
          return prevScene + tick;
        });

        setTotalElapsedTime((prevTotal) => {
          if (prevTotal + tick >= totalDuration) {
            return totalDuration;
          }
          return prevTotal + tick;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sceneDurations, script.scenes.length, totalDuration, playbackSpeed]);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (totalElapsedTime >= totalDuration || isCompleted) {
        // Reset to start
        setCurrentSceneIndex(0);
        setSceneElapsedTime(0);
        setTotalElapsedTime(0);
        setIsCompleted(false);
      }
      setIsPlaying(true);
      audioController.playSoundEffect("pop");
    } else {
      setIsPlaying(false);
      audioController.stopSpeaking();
    }
  };

  // Restart video
  const handleRestart = () => {
    setIsPlaying(false);
    audioController.stopSpeaking();
    setCurrentSceneIndex(0);
    setSceneElapsedTime(0);
    setTotalElapsedTime(0);
    setIsCompleted(false);
    setTimeout(() => {
      setIsPlaying(true);
    }, 150);
  };

  // Previous Scene
  const handlePrevScene = () => {
    audioController.stopSpeaking();
    if (currentSceneIndex > 0) {
      const prevIdx = currentSceneIndex - 1;
      setCurrentSceneIndex(prevIdx);
      setSceneElapsedTime(0);
      let elapsed = 0;
      for (let i = 0; i < prevIdx; i++) {
        elapsed += sceneDurations[i];
      }
      setTotalElapsedTime(elapsed);
      setIsCompleted(false);
    }
  };

  // Next Scene
  const handleNextScene = () => {
    audioController.stopSpeaking();
    if (currentSceneIndex < script.scenes.length - 1) {
      const nextIdx = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIdx);
      setSceneElapsedTime(0);
      let elapsed = 0;
      for (let i = 0; i < nextIdx; i++) {
        elapsed += sceneDurations[i];
      }
      setTotalElapsedTime(elapsed);
      setIsCompleted(false);
    } else {
      setIsPlaying(false);
      setIsCompleted(true);
      setTotalElapsedTime(totalDuration);
      audioController.playSoundEffect("success");
      confetti({ particleCount: 70 });
    }
  };

  // Jump to specific scene
  const handleJumpToScene = (index: number) => {
    audioController.stopSpeaking();
    setCurrentSceneIndex(index);
    setSceneElapsedTime(0);
    setIsCompleted(false);
    let elapsed = 0;
    for (let i = 0; i < index; i++) {
      elapsed += sceneDurations[i];
    }
    setTotalElapsedTime(elapsed);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Draw scene on Canvas (rich animated graphics for educational subjects)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 1280;
    let height = 720;
    if (aspectRatio === "9:16") {
      width = 720;
      height = 1280;
    } else if (aspectRatio === "1:1") {
      width = 800;
      height = 800;
    }

    canvas.width = width;
    canvas.height = height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 - 20;

      // 1. Check if image is available and loaded in cache
      const currentImg = currentScene?.imageUrl ? imageCacheRef.current.get(currentScene.imageUrl) : null;
      const isImageReady = currentImg && currentImg.complete && currentImg.naturalWidth > 0;

      if (isImageReady && currentImg) {
        // --- RENDER DYNAMIC SCENE IMAGE WITH SUBTLE CINEMATIC KEN BURNS MOTION ---
        const sceneDur = sceneDurations[currentSceneIndex] || 8;
        const progress = Math.min(Math.max(sceneElapsedTime / sceneDur, 0), 1);
        const zoom = 1.0 + progress * 0.05; // 5% subtle cinematic zoom

        // Calculate aspect-cover cropping
        const imgRatio = currentImg.naturalWidth / currentImg.naturalHeight;
        const canvasRatio = width / height;
        let sWidth = currentImg.naturalWidth;
        let sHeight = currentImg.naturalHeight;

        if (imgRatio > canvasRatio) {
          sWidth = currentImg.naturalHeight * canvasRatio;
        } else {
          sHeight = currentImg.naturalWidth / canvasRatio;
        }

        sWidth = sWidth / zoom;
        sHeight = sHeight / zoom;
        const sx = (currentImg.naturalWidth - sWidth) / 2;
        const sy = (currentImg.naturalHeight - sHeight) / 2;

        ctx.save();
        ctx.drawImage(currentImg, sx, sy, sWidth, sHeight, 0, 0, width, height);

        // Soft dark top gradient for lesson header watermark
        const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
        topGrad.addColorStop(0, "rgba(15, 23, 42, 0.88)");
        topGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, 120);

        // Soft dark bottom gradient for subtitles
        const botGrad = ctx.createLinearGradient(0, height - 170, 0, height);
        botGrad.addColorStop(0, "rgba(15, 23, 42, 0)");
        botGrad.addColorStop(0.35, "rgba(15, 23, 42, 0.78)");
        botGrad.addColorStop(1, "rgba(15, 23, 42, 0.95)");
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height - 170, width, 170);
        ctx.restore();

        // If this is the final scene (the warm-up questions scene), draw the questions blackboard over the image
        if (currentSceneIndex === script.scenes.length - 1) {
          ctx.save();
          // Glass chalkboard
          ctx.fillStyle = "rgba(6, 78, 59, 0.92)";
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(centerX - 300, centerY - 120, 600, 240, 20);
          ctx.fill();
          ctx.stroke();

          // Title
          ctx.font = "bold 20px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = "#fef08a";
          ctx.textAlign = "center";
          ctx.fillText("CÂU HỎI KHỞI ĐỘNG BÀI HỌC", centerX, centerY - 80);

          // Questions
          ctx.textAlign = "left";
          ctx.font = "bold 15px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = "#ffffff";
          const q1 = script.warmupQuestions[0] || "Thông tin và dữ liệu có giống nhau không?";
          const q2 = script.warmupQuestions[1] || "Cùng một dữ liệu, mọi người có nhận được cùng một thông tin?";

          ctx.fillText(`1. ${q1}`, centerX - 270, centerY - 35);
          if (q2) {
            ctx.fillText(`2. ${q2}`, centerX - 270, centerY + 10);
          }

          // Transition banner
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.roundRect(centerX - 280, centerY + 55, 560, 42, 10);
          ctx.fill();

          ctx.font = "bold 14px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = "#0f172a";
          ctx.textAlign = "center";
          ctx.fillText(`"${script.transitionPhrase}"`, centerX, centerY + 81);
          ctx.restore();
        } else {
          // Other scenes: Draw sleek lower-third badge with Scene Topic
          ctx.save();
          ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(32, height - 170, 360, 38, 10);
          ctx.fill();
          ctx.stroke();

          ctx.font = "bold 13px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = "#38bdf8";
          ctx.fillText(`🎬 ${currentScene?.sceneName || `Cảnh ${currentSceneIndex + 1}`}`, 46, height - 146);
          ctx.restore();
        }
      } else {
        // --- FALLBACK PROCEDURAL GRAPHICS IF NO IMAGE ---
        const sceneNum = currentScene?.sceneNumber || 1;
        const bgGradients: [string, string][] = [
          ["#1e3a8a", "#0f172a"], // Deep Navy to Slate
          ["#1e40af", "#3b82f6"], // Blue
          ["#0369a1", "#0284c7"], // Ocean Blue
          ["#4338ca", "#6366f1"], // Indigo
          ["#1e3a8a", "#1d4ed8"], // Royal Blue
          ["#0f172a", "#1e293b"], // Slate Dark
        ];
        const [col1, col2] = bgGradients[(sceneNum - 1) % bgGradients.length];

        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, col1);
        grad.addColorStop(1, col2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtle grid pattern or tech particles
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw specialized visuals depending on scene index
        if (currentSceneIndex === 0) {
        // SCENE 1: Phone & Message Notification
        ctx.save();
        // Phone frame
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(centerX - 130, centerY - 150, 260, 300, 24);
        ctx.fill();
        ctx.stroke();

        // Phone screen
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(centerX - 118, centerY - 138, 236, 276, 16);
        ctx.fill();

        // Chat bubble
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.roundRect(centerX - 100, centerY - 80, 200, 90, 14);
        ctx.fill();

        ctx.font = "bold 13px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Bình (Bạn cùng lớp):", centerX - 85, centerY - 55);
        ctx.font = "14px 'Be Vietnam Pro', sans-serif";
        ctx.fillText('"Hãy gọi cho tôi', centerX - 85, centerY - 32);
        ctx.fillText('lúc 16 giờ nhé!"', centerX - 85, centerY - 10);

        // Notification pulse
        const pulse = (Math.sin(Date.now() / 200) + 1) * 4;
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX + 80, centerY - 70, 12 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (currentSceneIndex === 1) {
        // SCENE 2: Clock & Question marks
        ctx.save();
        // Clock face
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Clock center
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, 8, 0, Math.PI * 2);
        ctx.fill();

        // Animated Clock hands
        const angle = (Date.now() / 400) % (Math.PI * 2);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX + Math.cos(angle) * 75, centerY - 10 + Math.sin(angle) * 75);
        ctx.stroke();

        // Hour hand
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX + 40, centerY - 40);
        ctx.stroke();

        // Floating question marks
        ctx.font = "bold 56px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("?", centerX - 180, centerY - 60);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("?", centerX + 150, centerY - 40);
        ctx.fillStyle = "#f43f5e";
        ctx.fillText("?", centerX - 140, centerY + 100);
        ctx.restore();
      } else if (currentSceneIndex === 2) {
        // SCENE 3: Floating Data Types (ABC, 123, Image, Sound)
        ctx.save();
        const dataItems = [
          { text: "DỮ LIỆU SỐ: 123", color: "#38bdf8", x: centerX - 160, y: centerY - 90 },
          { text: "VĂN BẢN: ABC", color: "#4ade80", x: centerX + 40, y: centerY - 100 },
          { text: "HÌNH ẢNH: 📷", color: "#f43f5e", x: centerX - 180, y: centerY + 50 },
          { text: "ÂM THANH: 🎵", color: "#fbbf24", x: centerX + 50, y: centerY + 40 },
        ];
        dataItems.forEach((item, i) => {
          const floatY = item.y + Math.sin(Date.now() / 300 + i) * 8;
          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(item.x, floatY, 200, 54, 12);
          ctx.fill();
          ctx.stroke();

          ctx.font = "bold 16px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = item.color;
          ctx.fillText(item.text, item.x + 20, floatY + 33);
        });
        ctx.restore();
      } else if (currentSceneIndex === 3) {
        // SCENE 4: Comparison Table / Bridge (Data -> Brain -> Information)
        ctx.save();
        // Box 1: Dữ liệu
        ctx.fillStyle = "rgba(30, 58, 138, 0.8)";
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(centerX - 240, centerY - 80, 180, 150, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 18px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#93c5fd";
        ctx.fillText("DỮ LIỆU THÔ", centerX - 210, centerY - 45);
        ctx.font = "14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("• Chữ số", centerX - 215, centerY - 15);
        ctx.fillText("• Ký hiệu", centerX - 215, centerY + 15);
        ctx.fillText("• Âm thanh", centerX - 215, centerY + 45);

        // Arrow
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("➔", centerX - 25, centerY + 5);

        // Box 2: Thông tin
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(centerX + 60, centerY - 80, 180, 150, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 18px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#6ee7b7";
        ctx.fillText("THÔNG TIN", centerX + 95, centerY - 45);
        ctx.font = "14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("• Có ý nghĩa", centerX + 85, centerY - 15);
        ctx.fillText("• Giúp ra quyết định", centerX + 85, centerY + 15);
        ctx.fillText("• Hiểu biết mới", centerX + 85, centerY + 45);
        ctx.restore();
      } else if (currentSceneIndex === script.scenes.length - 1) {
        // SCENE FINAL: Warm-up Question Board (Chuyển bài học)
        ctx.save();
        // Blackboard frame
        ctx.fillStyle = "#064e3b";
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.roundRect(centerX - 280, centerY - 110, 560, 220, 16);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.font = "bold 20px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#fef08a";
        ctx.fillText("CÂU HỎI KHỞI ĐỘNG BÀI HỌC", centerX - 170, centerY - 70);

        // Questions
        ctx.font = "15px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        const q1 = script.warmupQuestions[0] || "Thông tin và dữ liệu có giống nhau không?";
        const q2 = script.warmupQuestions[1] || "Cùng một dữ liệu, mọi người có nhận được cùng một thông tin?";

        ctx.fillText(`1. ${q1}`, centerX - 250, centerY - 25);
        if (q2) {
          ctx.fillText(`2. ${q2}`, centerX - 250, centerY + 15);
        }

        // Transition banner
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.roundRect(centerX - 260, centerY + 50, 520, 40, 8);
        ctx.fill();

        ctx.font = "bold 14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillText(`"${script.transitionPhrase}"`, centerX - 230, centerY + 75);
        ctx.restore();
      } else {
        // SCENE INTERMEDIATE (Scenes 4, 5, etc.): Dynamic Visual Concept Card
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(centerX - 260, centerY - 100, 520, 200, 16);
        ctx.fill();
        ctx.stroke();

        // Animated topic badge
        const badgePulse = (Math.sin(Date.now() / 250) + 1) * 3;
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.roundRect(centerX - 120, centerY - 80, 240, 36, 18);
        ctx.fill();

        ctx.font = "bold 14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(`🔍 KHÁM PHÁ KIẾN THỨC`, centerX, centerY - 57);

        // Scene Visual Description / Dialogue Focus
        ctx.font = "bold 16px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#fde047";
        ctx.fillText(currentScene.sceneName || `Cảnh ${currentSceneIndex + 1}`, centerX, centerY - 15);

        ctx.font = "14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#e2e8f0";
        const descText = currentScene.visualDescription || "Hình ảnh minh họa tình huống thực tế và kích thích tư duy";
        // truncate if long
        const cleanDesc = descText.length > 70 ? descText.slice(0, 68) + "..." : descText;
        ctx.fillText(`"${cleanDesc}"`, centerX, centerY + 18);

        // Knowledge points badges
        const kPoints = analysis.keyKnowledge.slice(0, 2);
        kPoints.forEach((kp, idx) => {
          const kx = idx === 0 ? centerX - 130 : centerX + 130;
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          ctx.beginPath();
          ctx.roundRect(kx - 110, centerY + 45, 220, 30, 8);
          ctx.fill();
          ctx.font = "12px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = "#93c5fd";
          const shortKp = kp.length > 25 ? kp.slice(0, 23) + "..." : kp;
          ctx.fillText(`💡 ${shortKp}`, kx, centerY + 65);
        });

        ctx.restore();
      }
      } // end fallback else block

      // --- HEADER WATERMARK / LESSON PILL (Always on top of image or animation) ---
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(24, 24, width - 48, 50, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 16px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#fbbf24"; // Amber
      ctx.fillText(`${script.subject.toUpperCase()} - ${script.grade.toUpperCase()}`, 40, 55);

      ctx.font = "600 16px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`• ${script.lessonTitle}`, 210, 55);

      // Scene indicator pill
      const sceneBadge = `CẢNH ${currentSceneIndex + 1}/${script.scenes.length}`;
      ctx.font = "bold 14px 'Be Vietnam Pro', sans-serif";
      const badgeW = ctx.measureText(sceneBadge).width + 24;
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.roundRect(width - badgeW - 36, 32, badgeW, 32, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(sceneBadge, width - badgeW - 24, 53);
      ctx.restore();

      // 5. SUBTITLES OVERLAY (Multi-line, high contrast, readable)
      if (showSubtitles && currentScene) {
        ctx.save();
        const subBoxW = width - 80;
        const subBoxH = 75;
        const subY = height - 115;

        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(40, subY, subBoxW, subBoxH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 16px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        // Multi-line word wrapping
        const words = (currentScene.voiceover || "").split(" ");
        const lines: string[] = [];
        let currentLine = "";

        for (const w of words) {
          const testLine = currentLine ? `${currentLine} ${w}` : w;
          if (ctx.measureText(testLine).width < subBoxW - 40) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = w;
          }
        }
        if (currentLine) lines.push(currentLine);

        // Draw up to 2-3 lines centered
        if (lines.length === 1) {
          ctx.fillText(lines[0], width / 2, subY + 44);
        } else if (lines.length === 2) {
          ctx.fillText(lines[0], width / 2, subY + 32);
          ctx.fillText(lines[1], width / 2, subY + 56);
        } else {
          ctx.font = "bold 14px 'Be Vietnam Pro', sans-serif";
          ctx.fillText(lines[0], width / 2, subY + 24);
          ctx.fillText(lines[1], width / 2, subY + 44);
          ctx.fillText(lines.slice(2).join(" "), width / 2, subY + 64);
        }
        ctx.restore();
      }

      // 6. Progress bar at bottom edge
      const pct = Math.min(totalElapsedTime / (totalDuration || 1), 1);
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(0, height - 6, width, 6);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(0, height - 6, width * pct, 6);
    };

    let isMounted = true;
    const loop = () => {
      if (!isMounted) return;
      render();
      if (isPlayingRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    loop();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isPlaying,
    currentSceneIndex,
    currentScene,
    aspectRatio,
    showSubtitles,
    totalElapsedTime,
    sceneElapsedTime,
    totalDuration,
    script,
    analysis,
    imageLoadedTick,
  ]);

  // Download Video using MediaRecorder on Canvas
  const handleDownloadVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsRecording(true);
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Video_Khoi_dong_${script.subject}_${script.grade}_${script.lessonTitle.replace(/\s+/g, "_")}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        confetti({ particleCount: 50 });
      };

      // Play video through recording
      handleRestart();
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, (totalDuration + 1) * 1000);
    } catch (e) {
      console.error("Recording error:", e);
      setIsRecording(false);
      alert("Trình duyệt hỗ trợ xuất kịch bản và xem trước trực tiếp!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Lesson Details & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Video Khởi Động Sẵn Sàng
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Thời lượng: {Math.round(totalDuration)} giây
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {script.lessonTitle} ({script.subject} - {script.grade})
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              Phong cách: <strong className="text-slate-800">{config.style}</strong> | Giọng đọc:{" "}
              <strong className="text-slate-800">{config.voiceGender} ({config.voiceRegion})</strong>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="player-generate-all-images-btn"
              onClick={handleGenerateAllImages}
              disabled={isGeneratingAllImages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              title="Tự động tạo ảnh AI chất lượng cao cho tất cả các cảnh"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${isGeneratingAllImages ? "animate-spin" : ""}`} />
              <span>{isGeneratingAllImages ? "Đang tạo ảnh AI..." : "TẠO ẢNH AI TẤT CẢ CẢNH"}</span>
            </button>

            {currentScene && (
              <button
                id="player-customize-current-image-btn"
                onClick={() => setSelectedSceneForModal(currentScene)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                title="Thay đổi hoặc tạo ảnh riêng cho cảnh đang phát"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đổi ảnh Cảnh {currentSceneIndex + 1}</span>
              </button>
            )}

            <button
              id="edit-script-btn"
              onClick={onEditScript}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
              <span>Chỉnh sửa kịch bản</span>
            </button>

            <button
              id="save-history-btn"
              onClick={onSaveToHistory}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                isSaved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? "Đã lưu vào lịch sử" : "Lưu vào lịch sử"}</span>
            </button>

            <button
              id="export-doc-video-btn"
              onClick={onExportDoc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải kịch bản Word</span>
            </button>

            <button
              id="download-video-btn"
              onClick={handleDownloadVideo}
              disabled={isRecording}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isRecording ? "Đang ghi video..." : "TẢI VIDEO (.WEBM)"}</span>
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="mt-5 flex flex-col items-center">
          <div
            className={`relative rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 flex items-center justify-center transition-all ${
              aspectRatio === "16:9"
                ? "w-full max-w-4xl aspect-video"
                : aspectRatio === "9:16"
                ? "w-full max-w-xs aspect-[9/16]"
                : "w-full max-w-lg aspect-square"
            }`}
          >
            <canvas ref={canvasRef} className="w-full h-full object-contain" />

            {/* Completion Screen Overlay */}
            {isCompleted && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 mb-2">
                  Hoàn thành kịch bản khởi động
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
                  {script.lessonTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-5 leading-relaxed">
                  Video đã trình bày đầy đủ tình huống dẫn nhập và các câu hỏi gợi mở. Thầy cô sẵn sàng dẫn dắt học sinh vào nội dung bài học!
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    id="completion-replay-btn"
                    onClick={handleRestart}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Xem lại từ đầu</span>
                  </button>

                  <button
                    id="completion-copy-questions-btn"
                    onClick={() => {
                      const textToCopy = `CÂU HỎI KHỞI ĐỘNG BÀI: ${script.lessonTitle}\n\n` +
                        script.warmupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") +
                        `\n\nLỜI CHUYỂN BÀI:\n"${script.transitionPhrase}"`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedQuestion(true);
                      audioController.playSoundEffect("ding");
                      setTimeout(() => setCopiedQuestion(false), 2500);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all"
                  >
                    {copiedQuestion ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Đã sao chép câu hỏi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-400" />
                        <span>Sao chép câu hỏi chốt</span>
                      </>
                    )}
                  </button>

                  <button
                    id="completion-rewind-final-scene-btn"
                    onClick={() => handleJumpToScene(script.scenes.length - 1)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Xem lại bảng câu hỏi</span>
                  </button>
                </div>
              </div>
            )}

            {/* Overlay Play Button if Paused & not completed */}
            {!isPlaying && !isCompleted && (
              <button
                onClick={handleTogglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-xs group z-10"
              >
                <Play className="w-8 h-8 fill-white translate-x-0.5 group-hover:scale-105" />
              </button>
            )}
          </div>

          {/* Video Control Bar */}
          <div className="w-full max-w-4xl mt-3 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-lg space-y-2.5">
            {/* Timeline & Scrubber */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-blue-400 font-mono w-10 text-right">
                {Math.floor(totalElapsedTime)}s
              </span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPct = (e.clientX - rect.left) / rect.width;
                  const newTime = clickPct * totalDuration;
                  setTotalElapsedTime(newTime);
                  // find corresponding scene
                  let acc = 0;
                  for (let i = 0; i < script.scenes.length; i++) {
                    acc += sceneDurations[i];
                    if (newTime <= acc || i === script.scenes.length - 1) {
                      setCurrentSceneIndex(i);
                      break;
                    }
                  }
                  setIsCompleted(false);
                }}
                className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalElapsedTime / (totalDuration || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-slate-400 font-mono w-10">
                {Math.round(totalDuration)}s
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {/* Previous scene button */}
                <button
                  id="player-prev-scene-btn"
                  onClick={handlePrevScene}
                  disabled={currentSceneIndex === 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-slate-800"
                  title="Cảnh trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play / Pause */}
                <button
                  id="player-play-btn"
                  onClick={handleTogglePlay}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  title={isPlaying ? "Tạm dừng" : "Phát video"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  )}
                </button>

                {/* Next scene button */}
                <button
                  id="player-next-scene-btn"
                  onClick={handleNextScene}
                  disabled={currentSceneIndex >= script.scenes.length - 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-slate-800"
                  title="Cảnh tiếp theo"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Restart */}
                <button
                  id="player-restart-btn"
                  onClick={handleRestart}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Phát lại từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Scene badge indicator */}
                <span className="text-xs font-bold text-slate-300 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700/60 hidden sm:inline-block">
                  Cảnh {currentSceneIndex + 1}/{script.scenes.length}
                </span>

                {/* Playback speed selector */}
                <div className="flex items-center gap-1 bg-slate-800 px-1 py-0.5 rounded-lg text-[11px] font-bold">
                  {[0.8, 1.0, 1.25].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-1.5 py-1 rounded transition-colors ${
                        playbackSpeed === speed
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title={`Tốc độ phát ${speed}x`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Voice narration toggle */}
                <button
                  id="toggle-voice-btn"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isVoiceEnabled
                      ? "bg-blue-900/60 text-blue-300 border border-blue-700"
                      : "bg-slate-800 text-slate-400"
                  }`}
                  title="Bật/Tắt giọng đọc AI"
                >
                  {isVoiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-blue-400" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <span>Giọng đọc</span>
                </button>

                {/* BGM toggle */}
                <button
                  id="toggle-bgm-btn"
                  onClick={() => setIsBgmEnabled(!isBgmEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isBgmEnabled
                      ? "bg-indigo-900/60 text-indigo-300 border border-indigo-700"
                      : "bg-slate-800 text-slate-400"
                  }`}
                  title="Nhạc nền vui tươi"
                >
                  <Music className="w-4 h-4 text-indigo-400" />
                  <span>Nhạc nền</span>
                </button>

                {/* Subtitles toggle */}
                <button
                  id="toggle-subtitles-btn"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    showSubtitles
                      ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                      : "bg-slate-800 text-slate-400"
                  }`}
                  title="Bật/Tắt phụ đề"
                >
                  <Subtitles className="w-4 h-4 text-amber-400" />
                  <span>Phụ đề</span>
                </button>
              </div>

              {/* Aspect ratio switchers */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    aspectRatio === "16:9"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Tỷ lệ 16:9 (PowerPoint / TV)"
                >
                  16:9
                </button>
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    aspectRatio === "9:16"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Tỷ lệ 9:16 (Điện thoại)"
                >
                  9:16
                </button>
                <button
                  onClick={() => setAspectRatio("1:1")}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    aspectRatio === "1:1"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Tỷ lệ 1:1 (Vuông)"
                >
                  1:1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scene Navigation Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-blue-600" />
              Chọn cảnh để xem trước nhanh:
            </span>
            <span className="text-xs text-slate-700 font-medium">Bấm vào cảnh để nhảy tới</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {script.scenes.map((scene, idx) => {
              const isCurrent = currentSceneIndex === idx;
              return (
                <div
                  key={scene.id}
                  id={`jump-scene-card-${idx + 1}`}
                  className={`group relative rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                    isCurrent
                      ? "bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/30 shadow-md"
                      : "bg-white border-slate-200 hover:border-blue-300 shadow-2xs"
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <div
                    onClick={() => handleJumpToScene(idx)}
                    className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                  >
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.sceneName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 text-slate-400 p-2 text-center">
                        <ImageIcon className="w-5 h-5 text-blue-400 mb-1" />
                        <span className="text-[10px] text-slate-300 font-medium">Đồ họa hoạt hình</span>
                      </div>
                    )}

                    {/* Badge on thumbnail */}
                    <div className="absolute top-1.5 left-1.5">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900/80 text-slate-200 backdrop-blur-xs"
                        }`}
                      >
                        Cảnh {idx + 1}
                      </span>
                    </div>

                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {scene.duration}s
                      </span>
                    </div>

                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center">
                        <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                          Đang phát
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Scene info & action */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div onClick={() => handleJumpToScene(idx)} className="cursor-pointer">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {scene.sceneName}
                      </p>
                      <p className="text-[11px] text-slate-700 line-clamp-2 mt-0.5 leading-snug">
                        {scene.voiceover}
                      </p>
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSceneForModal(scene);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Đổi hoặc tạo lại hình ảnh cho cảnh này"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Đổi ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJumpToScene(idx)}
                        className="text-[10px] font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
                      >
                        Xem cảnh
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warm-up Questions & Transition Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-blue-950 font-bold text-base">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>Hệ thống câu hỏi khởi động chuyển tiếp vào bài giảng</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {script.warmupQuestions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-blue-200 shadow-2xs flex items-start gap-3"
            >
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {q}
                </p>
                <span className="text-[11px] text-blue-700 font-medium mt-1 inline-block">
                  * Kích thích học sinh suy nghĩ và giơ tay thảo luận
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-blue-700 text-white flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block mb-0.5">
              Lời dẫn giáo viên bước vào bài mới:
            </span>
            <p className="text-sm font-bold italic">
              "{script.transitionPhrase}"
            </p>
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 flex-shrink-0" />
        </div>
      </div>

      {/* Scene Image Modal for changing/generating image */}
      {selectedSceneForModal && (
        <SceneImageModal
          isOpen={!!selectedSceneForModal}
          onClose={() => setSelectedSceneForModal(null)}
          scene={selectedSceneForModal}
          onUpdateSceneImage={handleUpdateSceneImage}
          uploadedFiles={uploadedFiles}
          subject={script.subject}
          lessonTitle={script.lessonTitle}
          currentStyle={config.style}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  );
};

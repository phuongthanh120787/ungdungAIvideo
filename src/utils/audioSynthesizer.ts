// Audio synthesizer using Web Audio API and Web Speech API for Vietnamese narration

class AudioController {
  private audioCtx: AudioContext | null = null;
  private isBgmPlaying: boolean = false;
  private bgmGainNode: GainNode | null = null;
  private bgmInterval: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  // Play gentle upbeat educational background music using synthesized chords & melody
  public startBGM(volume: number = 0.15) {
    if (this.isBgmPlaying) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    this.isBgmPlaying = true;
    this.bgmGainNode = this.audioCtx.createGain();
    this.bgmGainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    this.bgmGainNode.connect(this.audioCtx.destination);

    // Pentatonic happy upbeat educational notes (C, D, E, G, A)
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    let step = 0;

    const playNote = () => {
      if (!this.isBgmPlaying || !this.audioCtx || !this.bgmGainNode) return;
      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      // Soft sine or triangle sound
      osc.type = "sine";
      const freq = notes[step % notes.length];
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      noteGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGainNode);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.65);

      step++;
    };

    // Play every 350ms
    playNote();
    this.bgmInterval = window.setInterval(playNote, 360);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGainNode && this.audioCtx) {
      try {
        this.bgmGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch (e) {
        // ignore
      }
    }
  }

  public playSoundEffect(type: "pop" | "ding" | "success" | "chime") {
    this.initAudioContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "ding") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "success" || type === "chime") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
  }

  // Voice narration using Web Speech API
  public speakText(
    text: string,
    gender: "Nam" | "Nữ" = "Nữ",
    region: string = "Giọng miền Bắc",
    onEnd?: () => void
  ) {
    if (!("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Look for Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().includes("vi") || v.lang.toLowerCase().includes("vn"));

    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.lang = "vi-VN";
    utterance.rate = 1.0;
    // Pitch: higher for female, lower for male
    utterance.pitch = gender === "Nam" ? 0.85 : 1.15;

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }
}

export const audioController = new AudioController();

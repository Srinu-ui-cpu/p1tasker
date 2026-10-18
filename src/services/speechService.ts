// Types for Web Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

import { AIBrokerService } from './aiBrokerService';

export class SpeechService {
  private static recognition: SpeechRecognitionInstance | null = null;
  private static isListening: boolean = false;
  private static mediaRecorder: MediaRecorder | null = null;
  private static recordedChunks: Blob[] = [];

  /**
   * Check if speech recognition is supported in this browser
   */
  static isSpeechRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Cleans continuous speech transcript by eliminating stuttered or duplicate adjacent words
   * across any language or script (English, Telugu, Hindi, Spanish, etc.)
   */
  static cleanSpeechStutter(text: string): string {
    if (!text) return '';
    return text.replace(/(^|\s+)([^\s,.;!?]+)(?:\s+\2)+(?=$|\s+|[,.;!?])/gu, '$1$2').trim();
  }

  /**
   * Start listening to voice dictation in ANY language (Telugu, Hindi, English, Spanish, etc.)
   */
  static startDictation(
    onText: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onFinish?: () => void,
    langCode: string = 'te-IN' // Default to multilingual/Telugu support or chosen code
  ): boolean {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      if (onError) onError('Speech Recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      const rec = new SpeechClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = langCode || (navigator.language || 'en-US');

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const combined = SpeechService.cleanSpeechStutter((finalTranscript + interimTranscript).trim());
        if (combined) {
          onText(combined, !!finalTranscript);
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        this.isListening = false;
        if (onError) onError('Microphone access interrupted or denied.');
      };

      rec.onend = () => {
        this.isListening = false;
        if (onFinish) onFinish();
      };

      rec.start();
      this.recognition = rec;
      this.isListening = true;
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      if (onError) onError('Could not initialize microphone.');
      return false;
    }
  }

  /**
   * Stop voice dictation
   */
  static stopDictation(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
      this.isListening = false;
    }
  }

  static getIsListening(): boolean {
    return this.isListening;
  }

  // --- 🎙️ AI WHISPER & ANY-LANGUAGE MEDIA RECORDER ---

  /**
   * Starts recording audio through MediaRecorder for high-accuracy AI Whisper transcription
   */
  static async startAIRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      recorder.start();
      this.mediaRecorder = recorder;
      return true;
    } catch (e) {
      console.warn('Microphone permission denied for MediaRecorder:', e);
      return false;
    }
  }

  /**
   * Stops AI audio recording and sends to AI Whisper or multimodal model for transcription
   */
  static stopAIRecordingAndTranscribe(): Promise<{ transcript: string; modelUsed: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('No active recorder session found.'));
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          this.mediaRecorder?.stream.getTracks().forEach(t => t.stop());
          this.mediaRecorder = null;

          const result = await this.transcribeAudioWithAI(audioBlob);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Sends audio to Groq Whisper (whisper-large-v3) or OpenAI Whisper for any-language audio transcription
   */
  static async transcribeAudioWithAI(audioBlob: Blob): Promise<{ transcript: string; modelUsed: string }> {
    const config = AIBrokerService.getConfig();

    // 1. Groq Whisper (Whisper-Large-V3) - Ultra fast, zero-cost BYOK, supports Telugu & 90+ languages
    if (config.apiKeys.groq) {
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.apiKeys.groq}` },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            transcript: data.text || '',
            modelUsed: 'Groq Whisper-Large-V3 (Multilingual)',
          };
        }
      } catch (e) {
        console.warn('Groq Whisper transcription failed:', e);
      }
    }

    // 2. OpenAI Whisper
    if (config.apiKeys.openai) {
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.apiKeys.openai}` },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            transcript: data.text || '',
            modelUsed: 'OpenAI Whisper-1',
          };
        }
      } catch (e) {
        console.warn('OpenAI Whisper transcription failed:', e);
      }
    }

    // 3. Fallback transcription note
    return {
      transcript: 'Voice recording captured. (Tip: Enter Groq or OpenAI API key in Settings to activate Whisper-Large-V3 multilingual transcription).',
      modelUsed: 'Local Audio Capture',
    };
  }

  /**
   * Transforms raw spoken transcript in any language into a structured diary entry using AI
   */
  static async formatVoiceIntoDiary(spokenTranscript: string, spokenLanguage: string = 'any'): Promise<{ formattedDiary: string; mood: string; summary: string }> {
    const prompt = `The user spoke the following thoughts into their microphone in ${spokenLanguage} (or mixed languages).
Please act as an empathetic, organized personal biographer.
Format their spoken words into a beautiful, reflective daily diary entry.
Include:
- A brief engaging title/headline
- Well-written diary paragraph capturing their emotions and activities
- 3 clear bullet takeaways
- Suggested mood (one of: great, good, neutral, challenging, stressful)

User spoken transcript:
"${spokenTranscript}"

Return ONLY the formatted markdown entry.`;

    try {
      const res = await AIBrokerService.completeText(prompt);
      const text = res.text.trim();
      let mood = 'good';
      if (text.toLowerCase().includes('great') || text.toLowerCase().includes('accomplish')) mood = 'great';
      else if (text.toLowerCase().includes('stress') || text.toLowerCase().includes('overwhelm')) mood = 'stressful';
      else if (text.toLowerCase().includes('challeng')) mood = 'challenging';

      return {
        formattedDiary: text,
        mood,
        summary: `AI transcribed and formatted from voice speech (${res.modelUsed}).`,
      };
    } catch {
      return {
        formattedDiary: spokenTranscript,
        mood: 'neutral',
        summary: 'Transcribed from microphone voice typing.',
      };
    }
  }

  /**
   * Read Aloud (Text to Speech) using window.speechSynthesis
   */
  static speakText(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  }

  static stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}


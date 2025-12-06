/**
 * Speech Recognition Service using Chrome Web Speech API
 * Free to use, no API key required
 */

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.warn('[SpeechRecognition] Web Speech API not supported');
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Continuous listening
    this.recognition.continuous = false;
    // Return interim results
    this.recognition.interimResults = false;
    // Set language (default to zh-TW, can be changed)
    this.recognition.lang = 'zh-TW';

    // Handle start
    this.recognition.onstart = () => {
      console.log('[SpeechRecognition] Recognition started');
      this.isListening = true;
    };

    // Handle results
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('[SpeechRecognition] Recognized:', transcript);

      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
    };

    // Handle end
    this.recognition.onend = () => {
      console.log('[SpeechRecognition] Recognition ended');
      this.isListening = false;

      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    // Handle errors
    this.recognition.onerror = (event: any) => {
      console.error('[SpeechRecognition] Error:', event.error);
      this.isListening = false;

      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  public start(onResult: (text: string) => void, onEnd: () => void): boolean {
    if (!this.recognition) {
      alert('您的瀏覽器不支援語音輸入功能\nYour browser does not support voice input');
      return false;
    }

    if (this.isListening) {
      console.warn('[SpeechRecognition] Already listening');
      return false;
    }

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('[SpeechRecognition] Started listening');
      return true;
    } catch (error) {
      console.error('[SpeechRecognition] Failed to start:', error);
      return false;
    }
  }

  public stop(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      this.isListening = false;
      console.log('[SpeechRecognition] Stopped listening');
    } catch (error) {
      console.error('[SpeechRecognition] Failed to stop:', error);
    }
  }

  public setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }
}

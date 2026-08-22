declare module "opus-media-recorder" {
  interface WorkerOptions {
    encoderWorkerFactory: () => Worker;
    OggOpusEncoderWasmPath: string;
    WebMOpusEncoderWasmPath: string;
  }

  class OpusMediaRecorder {
    constructor(
      stream: MediaStream,
      options?: MediaRecorderOptions,
      workerOptions?: WorkerOptions
    );

    start(timeslice?: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    requestData(): void;

    readonly state:
      | "inactive"
      | "recording"
      | "paused";

    readonly stream: MediaStream;
    readonly mimeType: string;

    ondataavailable:
      ((event: BlobEvent) => void) | null;
    onerror:
      ((event: Event) => void) | null;
    onstart: (() => void) | null;
    onstop: (() => void) | null;
    onpause: (() => void) | null;
    onresume: (() => void) | null;
  }

  export default OpusMediaRecorder;
}
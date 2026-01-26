const audioElements = {
  tap: new Audio('/sounds/tap.mp3'),
  ding: new Audio('/sounds/ding.mp3'),
  gameOver: new Audio('/sounds/over.mp3'),
  error: new Audio('/sounds/error.mp3'),
} as const;

type AudioName = keyof typeof audioElements;

for (const audio of Object.values(audioElements)) {
  audio.load();
}

type ErrorAlert = 'none' | 'scheduled' | 'playing';

export class AudioFeedback {
  private errorAlert: ErrorAlert = 'none';
  private errorTimer: number | null = null;

  public constructor() { }

  public play(name: AudioName): void {
    this.reset();
    const audio = audioElements[name];
    audio.currentTime = 0;
    audio.play();
  }

  public scheduleErrorFeedback(): void {
    if (this.errorTimer !== null) {
      return;
    }

    this.errorAlert = 'scheduled';
    this.errorTimer = window.setInterval(() => {
      const audio = audioElements.error;
      audio.currentTime = 0;
      audio.play();
      this.errorAlert = 'playing';
    }, 1000);
  }

  public reset(): void {
    if (this.errorTimer !== null) {
      window.clearInterval(this.errorTimer);
      this.errorTimer = null;
      this.errorAlert = 'none';
    }
  }

  public get errorAlertState(): ErrorAlert {
    return this.errorAlert;
  }
}

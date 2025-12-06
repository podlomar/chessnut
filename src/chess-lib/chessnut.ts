import { Chess, Move } from 'chess.js';
import { BoardFeedback, BoardPosition, emptyDiff, Placement, PlacementDiff } from './placement';

const dataEquals = (data1: Uint8Array, data2: Uint8Array) => {
  for (let i = 0; i < data1.length; i++) {
    if (data1[i] !== data2[i]) {
      return false;
    }
  }
  return true;
}

interface PlayingState {
  position: BoardPosition;
  chess: Chess;
  status: 'playing';
  feedback: BoardFeedback;
  returned: boolean;
}

interface GameOverState {
  position: BoardPosition;
  status: 'over';
  chess: Chess;
}

interface RandomState {
  placement: Placement;
  status: 'random';
}

export type GameState = PlayingState | RandomState | GameOverState;

export class ChessnutDriver {
  private device: HIDDevice;;
  private currentState: GameState | null = null;
  private validMoves: Move[] = [];
  private onNewState?: ((state: GameState) => void);
  private lastData: Uint8Array | null = null;
  private wakeLock: WakeLockSentinel | null = null;

  private constructor(device: HIDDevice) {
    this.device = device;
    this.device.addEventListener('inputreport', this.handleReport.bind(this));
  }

  public static async connect(): Promise<ChessnutDriver | null> {
    const devices = await navigator.hid.requestDevice({
      filters: [{
        vendorId: 0x2d80,
        usagePage: 0xFF00
      }]
    });

    if (devices.length === 0) {
      return null;
    }

    const device = devices[0];
    await device.open();
    const collection = device.collections.find(
      c => c.usagePage === 0xFF00
    );

    if (!collection) {
      console.error("Could not find usagePage 0xFF00");
      return null;
    }

    const reportId = 0x21;
    await device.sendReport(reportId, new Uint8Array([0x01, 0x00]));

    return new ChessnutDriver(device);
  }

  public onStateChange(callback: (state: GameState) => void): void {
    this.onNewState = callback;
  }

  public offStateChange(): void {
    this.onNewState = undefined;
  }

  private async acquireWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock acquired');
      }
    } catch (err) {
      console.error('Failed to acquire wake lock:', err);
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock !== null) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Wake lock released');
    }
  }

  public async startGame(): Promise<void> {
    if (this.currentState === null) {
      return;
    }

    if (this.currentState.status === 'playing') {
      return;
    }

    if (this.currentState.status === 'over') {
      return;
    }

    if (!this.currentState.placement.isInitial()) {
      return;
    }

    await this.acquireWakeLock();

    const chess = new Chess();
    this.currentState = {
      position: new BoardPosition(Placement.INITIAL, 'w'),
      chess,
      status: 'playing',
      feedback: BoardFeedback.empty(),
      returned: false,
    };
    this.validMoves = chess.moves({ verbose: true });
    this.onNewState?.(this.currentState);
  }

  public takeBack(): void {
    if (this.currentState?.status !== 'playing') {
      return;
    }

    const move = this.currentState.chess.undo();
    if (move === null) {
      return;
    }

    const position = this.currentState.position;
    const undoedPosition = BoardPosition.fromFen(
      this.currentState.chess.fen()
    );
    const feedback = undoedPosition.buildFeedback(position.placement);
    this.currentState = {
      position: undoedPosition,
      chess: this.currentState.chess,
      status: 'playing',
      feedback: undoedPosition.buildFeedback(position.placement),
      returned: feedback.isEmpty(),
    };
    this.validMoves = this.currentState.chess.moves({ verbose: true });
    this.onNewState?.(this.currentState);
  }

  private handleReport(event: HIDInputReportEvent) {
    const { data, reportId } = event;
    if (reportId === 0x2a) {
      const bytes = new Uint8Array(data.buffer);
      if (bytes[0] === 0x02 && bytes[1] === 0x64 && bytes[2] === 0x01) {
        return;
      }
      console.log("Detected non-placement report:", bytes);
      return;
    }

    if (reportId !== 0x01) {
      return;
    }

    const bytes = new Uint8Array(data.buffer);
    const newData = bytes.slice(1, 33);

    if (this.lastData !== null && dataEquals(this.lastData, newData)) {
      return;
    }

    this.lastData = newData;
    const placement = Placement.fromBytes(newData);
    console.log("Placement data changed:", newData.toString(), placement.toFen());
    if (this.currentState?.status === 'playing') {
      for (const move of this.validMoves) {
        const position = BoardPosition.fromFen(move.after);
        const feedback = position.buildFeedback(placement);
        if (feedback.isEmpty()) {
          console.log("Detected move:", move.lan);
          this.currentState.chess.move(move);

          if (this.currentState.chess.isGameOver()) {
            this.currentState = {
              position,
              status: 'over',
              chess: this.currentState.chess,
            };
            this.validMoves = [];
            this.releaseWakeLock();
            this.onNewState?.(this.currentState);
            return;
          }

          this.validMoves = this.currentState.chess.moves({ verbose: true });
          this.currentState = {
            position,
            chess: this.currentState.chess,
            status: 'playing',
            feedback,
            returned: false,
          };

          this.currentState.chess.isGameOver();

          this.onNewState?.(this.currentState);
          return;
        }
      }

      const expectedPosition = BoardPosition.fromFen(this.currentState.chess.fen());
      const feedback = expectedPosition.buildFeedback(placement);
      this.currentState = {
        position: expectedPosition,
        chess: this.currentState.chess,
        status: 'playing',
        feedback,
        returned: feedback.isEmpty(),
      };
      this.onNewState?.(this.currentState);
      return;
    }

    const newState: GameState = {
      placement,
      status: 'random',
    };
    this.currentState = newState;
    this.validMoves = [];
    this.onNewState?.(newState);
  }
}

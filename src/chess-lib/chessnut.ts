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

interface PendingSide {
  color: 'w' | 'b';
  returnPlacement: Placement;
  validMoves: Move[];
}

interface TurnSide {
  color: 'w' | 'b';
  validMoves: Move[];
}

export class ChessnutDriver {
  private device: HIDDevice;;
  private currentState: GameState | null = null;
  private pendingSide: PendingSide | null = null;
  private turnSide: TurnSide | null = null;
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
    try {
      await device.open();
    } catch (err) {
      console.error("Failed to open device:", err);
      return null;
    }
    const collection = device.collections.find(
      c => c.usagePage === 0xFF00
    );

    if (!collection) {
      console.error("Could not find usagePage 0xFF00");
      return null;
    }

    const reportId = 0x21;
    try {
      await device.sendReport(reportId, new Uint8Array([0x01, 0x00]));
    } catch (err) {
      console.error("Failed to send initialization report:", err);
      return null;
    }

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
      }
    } catch (err) {
      console.error('Failed to acquire wake lock:', err);
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock !== null) {
      await this.wakeLock.release();
      this.wakeLock = null;
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
    const position = new BoardPosition(Placement.INITIAL, 'w');
    this.currentState = {
      position,
      chess,
      status: 'playing',
      feedback: BoardFeedback.empty(),
      returned: false,
    };
    this.pendingSide = null;
    this.turnSide = {
      color: 'w',
      validMoves: chess.moves({ verbose: true }),
    };
    this.onNewState?.(this.currentState);
  }

  public takeBack(): void {
    if (this.currentState === null || this.currentState.status === 'random') {
      return;
    }

    const chess = this.currentState.chess;
    const move = chess.undo();
    if (move === null) {
      return;
    }

    const position = this.currentState.position;
    const undoedPosition = BoardPosition.fromFen(
      chess.fen()
    );
    const feedback = undoedPosition.buildFeedback(position.placement);
    this.currentState = {
      position: undoedPosition,
      chess,
      status: 'playing',
      feedback,
      returned: feedback.isEmpty(),
    };
    this.pendingSide = null;
    this.turnSide = {
      color: chess.turn(),
      validMoves: chess.moves({ verbose: true }),
    };
    this.onNewState?.(this.currentState);
  }

  private handleReport(event: HIDInputReportEvent) {
    const { data, reportId } = event;
    if (reportId === 0x2a) {
      const bytes = new Uint8Array(data.buffer);
      if (bytes[0] === 0x02 && bytes[1] === 0x64 && bytes[2] === 0x01) {
        return;
      }
      return;
    }

    if (reportId !== 0x01) {
      return;
    }

    if (this.currentState?.status === 'over') {
      return;
    }

    const bytes = new Uint8Array(data.buffer);
    const newData = bytes.slice(1, 33);

    if (this.lastData !== null && dataEquals(this.lastData, newData)) {
      return;
    }

    this.lastData = newData;
    const placement = Placement.fromBytes(newData);
    if (this.currentState?.status === 'playing') {
      const currentPosition = this.currentState.position;
      const feedback = currentPosition.buildFeedback(placement);
      if (feedback.isEmpty()) {
        this.currentState = {
          position: currentPosition,
          chess: this.currentState.chess,
          status: 'playing',
          feedback,
          returned: true,
        };
        this.onNewState?.(this.currentState);
        return;
      }

      if (feedback.isLifted(this.turnSide!.color)) {
        console.log("Piece lifted for color:", this.turnSide!.color);
        console.log(feedback);
        this.currentState = {
          position: currentPosition,
          chess: this.currentState.chess,
          status: 'playing',
          feedback,
          returned: false,
        };
        this.pendingSide = null;
        this.onNewState?.(this.currentState);
        return;
      }

      console.log("Checking pending side...", this.pendingSide);
      if (this.pendingSide !== null) {
        const returnPlacement = this.pendingSide.returnPlacement;
        if (returnPlacement.equals(placement)) {
          this.currentState.chess.undo();
          this.currentState = {
            position: new BoardPosition(returnPlacement, this.pendingSide.color),
            chess: this.currentState.chess,
            status: 'playing',
            feedback: BoardFeedback.empty(),
            returned: true,
          };
          this.onNewState?.(this.currentState);
          return;
        }
      }

      console.log("Attempting to find matching move...", this.turnSide?.validMoves);

      for (const move of this.turnSide!.validMoves) {
        const position = BoardPosition.fromFen(move.after);
        const feedback = position.buildFeedback(placement);
        console.log("Checking move:", move.lan, "Feedback empty:", feedback.isEmpty());
        if (feedback.isEmpty()) {
          this.currentState.chess.move(move);

          if (this.currentState.chess.isGameOver()) {
            this.currentState = {
              position,
              status: 'over',
              chess: this.currentState.chess,
            };
            this.releaseWakeLock();
            this.onNewState?.(this.currentState);
            return;
          }

          this.pendingSide = {
            color: this.turnSide!.color,
            returnPlacement: currentPosition.placement,
            validMoves: this.turnSide!.validMoves,
          }
          this.turnSide = {
            color: this.turnSide!.color === 'w' ? 'b' : 'w',
            validMoves: this.currentState.chess.moves({ verbose: true }),
          };
          this.currentState = {
            position,
            chess: this.currentState.chess,
            status: 'playing',
            feedback,
            returned: false,
          };
          this.onNewState?.(this.currentState);
          return;
        }
      }

      for (const move of (this.pendingSide?.validMoves ?? [])) {
        const position = BoardPosition.fromFen(move.after);
        const feedback = position.buildFeedback(placement);
        if (feedback.isEmpty()) {
          this.currentState.chess.undo();
          this.currentState.chess.move(move);

          if (this.currentState.chess.isGameOver()) {
            this.currentState = {
              position,
              status: 'over',
              chess: this.currentState.chess,
            };
            this.releaseWakeLock();
            this.onNewState?.(this.currentState);
            return;
          }

          this.turnSide = {
            color: this.turnSide!.color,
            validMoves: this.currentState.chess.moves({ verbose: true }),
          };
          this.currentState = {
            position,
            chess: this.currentState.chess,
            status: 'playing',
            feedback,
            returned: false,
          };
          this.onNewState?.(this.currentState);
          return;
        }
      }

      this.currentState = {
        position: currentPosition,
        chess: this.currentState.chess,
        status: 'playing',
        feedback,
        returned: false,
      };
      this.onNewState?.(this.currentState);
      return;
    }

    const newState: GameState = {
      placement,
      status: 'random',
    };
    this.currentState = newState;
    this.onNewState?.(newState);
  }
}

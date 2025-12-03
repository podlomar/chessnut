import { Chess, Move } from 'chess.js';
import { emptyDiff, Placement, PlacementDiff } from './placement';

const dataEquals = (data1: Uint8Array, data2: Uint8Array) => {
  for (let i = 0; i < data1.length; i++) {
    if (data1[i] !== data2[i]) {
      return false;
    }
  }
  return true;
}

const getPlacement = (fen: string): string => {
  return fen.split(' ')[0];
};

interface InitialState {
  placement: Placement;
  status: 'initial';
}

interface PlayingState {
  placement: Placement;
  chess: Chess;
  status: 'playing';
  mismatch: boolean;
  diff: PlacementDiff;
}

interface RandomState {
  placement: Placement;
  status: 'random';
}

export type GameState = InitialState | PlayingState | RandomState;

export class ChessnutDriver {
  private currentState: GameState | null = null;
  private validMoves: Move[] = [];
  private onNewState: ((state: GameState) => void);
  private lastData: Uint8Array | null = null;
  private wakeLock: WakeLockSentinel | null = null;

  public constructor(onNewState: (state: GameState) => void) {
    this.onNewState = onNewState;
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
    if (this.currentState?.status !== 'initial') {
      return;
    }

    await this.acquireWakeLock();

    const chess = new Chess();
    this.currentState = {
      placement: Placement.INITIAL,
      chess,
      status: 'playing',
      mismatch: false,
      diff: emptyDiff(),
    };
    this.validMoves = chess.moves({ verbose: true });
    this.onNewState(this.currentState);
  }

  public takeBack(): void {
    if (this.currentState?.status !== 'playing') {
      return;
    }

    const move = this.currentState.chess.undo();
    if (move === null) {
      return;
    }

    const placement = this.currentState.placement;
    const undoedPlacement = Placement.fromFen(this.currentState.chess.fen());
    const diff = undoedPlacement.diff(placement);
    this.currentState = {
      placement: undoedPlacement,
      chess: this.currentState.chess,
      status: 'playing',
      mismatch: !undoedPlacement.equals(placement),
      diff,
    };
    this.validMoves = this.currentState.chess.moves({ verbose: true });
    this.onNewState(this.currentState);
  }

  public async connect() {
    const devices = await navigator.hid.requestDevice({
      filters: [{
        vendorId: 0x2d80,
        usagePage: 0xFF00
      }]
    });

    if (devices.length === 0) {
      return;
    }

    const device = devices[0];
    await device.open();
    const collection = device.collections.find(
      c => c.usagePage === 0xFF00
    );

    if (!collection) {
      console.error("Could not find usagePage 0xFF00");
      return;
    }

    const reportId = 0x21;
    await device.sendReport(reportId, new Uint8Array([0x01, 0x00]));
    device.addEventListener('inputreport', this.handleReport.bind(this));
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
        const afterPlacement = Placement.fromFen(move.after);
        if (afterPlacement.equals(placement)) {
          console.log("Detected move:", move.lan);
          this.currentState.chess.move(move);
          this.validMoves = this.currentState.chess.moves({ verbose: true });
          this.currentState = {
            placement,
            chess: this.currentState.chess,
            status: 'playing',
            mismatch: false,
            diff: emptyDiff(),
          };

          this.onNewState(this.currentState);
          break;
        }
      }

      const expectedPlacement = Placement.fromFen(this.currentState.chess.fen());
      this.currentState = {
        placement,
        chess: this.currentState.chess,
        status: 'playing',
        mismatch: !expectedPlacement.equals(placement),
        diff: expectedPlacement.diff(placement),
      };
      this.onNewState(this.currentState);
      return;
    }

    const newState: GameState = {
      placement,
      status: placement.isInitial() ? 'initial' : 'random',
    };
    this.currentState = newState;
    this.validMoves = [];
    this.onNewState(newState);
  }
}

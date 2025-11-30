import { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

console.log("Piece symbols:", new Chess().fen());

const pieces: (Piece | null)[] = [
  null,
  { type: 'q', color: 'b' },
  { type: 'k', color: 'b' },
  { type: 'b', color: 'b' },
  { type: 'p', color: 'b' },
  { type: 'n', color: 'b' },
  { type: 'r', color: 'w' },
  { type: 'p', color: 'w' },
  { type: 'r', color: 'b' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'w' },
  { type: 'q', color: 'w' },
  { type: 'k', color: 'w' },
];

const boardFiles = 'abcdefgh';

const byteToSquare = (index: number, part: 'low' | 'high'): Square => {
  const idx = 31 - index;
  const rank = Math.floor(idx / 4) + 1;
  const fileIndex = ((idx % 4) * 2) + (part === 'low' ? 1 : 0);
  return `${boardFiles[fileIndex]}${rank}` as Square;
}

export const readPosition = (data: Uint8Array): Chess => {
  const chess = new Chess();
  chess.clear();

  for (let i = 0; i < 32; i++) {
    const low = data[i] & 0x0F;
    const lowSquare = byteToSquare(i, 'low');
    const lowPiece = pieces[low];
    if (lowPiece !== null) {
      chess.put(lowPiece, lowSquare);
    }

    const high = (data[i] >> 4) & 0x0F;
    const highSquare = byteToSquare(i, 'high');
    const highPiece = pieces[high];
    if (highPiece !== null) {
      chess.put(highPiece, highSquare);
    }
  }

  chess.setTurn('w');
  return chess;
}

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

export class ChessnutDriver {
  private currentState: Chess | null = null;
  private validMoves: Move[] = [];
  private onNewState: ((chess: Chess) => void);
  private lastData: Uint8Array | null = null;

  public constructor(onNewState: (chess: Chess) => void) {
    this.onNewState = onNewState;
  }

  public async connect() {
    const devices = await navigator.hid.requestDevice({
      filters: [{
        vendorId: 0x2d80,
        usagePage: 0xFF00
      }]
    });

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

    device.addEventListener("inputreport", event => {
      const { data, reportId } = event;

      if (reportId !== 0x01) {
        return;
      }

      const bytes = new Uint8Array(data.buffer);
      const newData = bytes.slice(1, 33);

      if (this.lastData !== null && dataEquals(this.lastData, newData)) {
        console.log("No changes detected");
        return;
      }

      this.lastData = newData;
      const newState = readPosition(newData);
      if (this.currentState === null) {
        this.currentState = newState;
        this.validMoves = this.currentState.moves({ verbose: true });
        this.onNewState(newState);
        return;
      }

      const placement = getPlacement(newState.fen());
      for (const move of this.validMoves) {
        const afterPlacement = getPlacement(move.after);
        if (afterPlacement === placement) {
          console.log("Detected move:", move);
          this.currentState = new Chess(move.after);
          this.validMoves = this.currentState.moves({ verbose: true });
          this.onNewState(this.currentState);
          break;
        }
      }
    });
  }
}

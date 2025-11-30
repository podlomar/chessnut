import { Chess, Color, PieceSymbol, Square } from 'chess.js';

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

// '.', 'q', 'k', 'b', 'p', 'n', 'R', 'P', 'r', 'B', 'N', 'Q', 'K'

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

  return chess;
}

import { PieceSymbol, Color } from "chess.js";

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

export interface Pos {
  rank: number;
  file: number;
}

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

const byteIndexToPos = (index: number, part: 'low' | 'high'): Pos => {
  const rank = Math.floor(index / 4);
  const file = (((31 - index) % 4) * 2) + (part === 'low' ? 1 : 0);
  return { file, rank };
};

export class Placement {
  public readonly squares: readonly (Piece | null)[][];
  public static readonly INITIAL = Placement.fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  public static readonly EMPTY = Placement.empty();

  private constructor(squares: readonly (Piece | null)[][]) {
    this.squares = squares;
  }

  public static fromFen(fen: string): Placement {
    const firstPart = fen.split(' ')[0];
    const rows = firstPart.split('/');
    const squares: (Piece | null)[][] = [];

    for (let r = 0; r < 8; r++) {
      const row = rows[r];
      const squareRow: (Piece | null)[] = [];
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (isNaN(Number(char))) {
          const isUpper = char === char.toUpperCase();
          squareRow.push({
            type: char.toLowerCase() as PieceSymbol,
            color: isUpper ? 'w' : 'b',
          });
        } else {
          const emptyCount = Number(char);
          for (let j = 0; j < emptyCount; j++) {
            squareRow.push(null);
          }
        }
      }
      squares.push(squareRow);
    }

    return new Placement(squares);
  }

  public static fromBytes(data: Uint8Array): Placement {
    const squares: (Piece | null)[][] = Array.from(
      { length: 8 }, () => Array(8).fill(null)
    );

    for (let i = 0; i < 32; i++) {
      const low = data[i] & 0x0F;
      const lowPos = byteIndexToPos(i, 'low');
      const lowPiece = pieces[low];
      if (lowPiece !== null) {
        squares[lowPos.rank][lowPos.file] = lowPiece;
      }

      const high = (data[i] >> 4) & 0x0F;
      const highPos = byteIndexToPos(i, 'high');
      const highPiece = pieces[high];
      if (highPiece !== null) {
        squares[highPos.rank][highPos.file] = highPiece;
      }
    }

    return new Placement(squares);
  }

  public static empty(): Placement {
    const squares: (Piece | null)[][] = Array.from(
      { length: 8 }, () => Array(8).fill(null)
    );
    return new Placement(squares);
  }

  public equals(p: Placement): boolean {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq1 = this.squares[r][f];
        const sq2 = p.squares[r][f];
        if (sq1 === null && sq2 === null) {
          continue;
        }

        if (
          sq1 === null ||
          sq2 === null ||
          sq1.type !== sq2.type ||
          sq1.color !== sq2.color
        ) {
          return false;
        }
      }
    }
    return true;
  }

  public isInitial(): boolean {
    return this.equals(Placement.INITIAL);
  }

  public toFen(): string {
    const fenRows: string[] = [];

    for (const row of this.squares) {
      let fenRow = '';
      let emptyCount = 0;

      for (const square of row) {
        if (square !== null) {
          if (emptyCount > 0) {
            fenRow += emptyCount;
            emptyCount = 0;
          }
          fenRow += square.type;
        } else {
          emptyCount++;
        }
      }

      if (emptyCount > 0) {
        fenRow += emptyCount;
      }

      fenRows.push(fenRow);
    }

    return fenRows.join('/');
  }

  public toAscii(): string[] {
    return this.squares.map(row =>
      row.map(piece => (piece ? piece.type : '.')).join(' ')
    );
  }

  public ranksMap<T>(fn: (rank: (Piece | null)[], index: number) => T): T[] {
    return this.squares.map(fn);
  }
}

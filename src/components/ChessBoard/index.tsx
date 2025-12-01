import { Color, PieceSymbol } from 'chess.js';
import { ChessPiece } from '../ChessPiece';
import './styles.css';

interface Piece {
  symbol: PieceSymbol;
  color: Color;
}

type BoardPlan = (Piece | null)[][];

const buildBoardPlan = (placement: string): BoardPlan => {
  const rows = placement.split('/');
  const boardPlan: BoardPlan = [];

  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    const boardRow: (Piece | null)[] = [];
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (isNaN(Number(char))) {
        const isUpper = char === char.toUpperCase();
        boardRow.push({
          symbol: char.toLowerCase() as PieceSymbol,
          color: isUpper ? 'w' : 'b',
        });
      } else {
        const emptyCount = Number(char);
        for (let j = 0; j < emptyCount; j++) {
          boardRow.push(null);
        }
      }
    }
    boardPlan.push(boardRow);
  }

  return boardPlan;
};

interface Props {
  placement: string;
  dimmed?: boolean;
}

export const ChessBoard = ({ placement, dimmed = true }: Props) => {
  const plan = buildBoardPlan(placement);

  return (
    <div className={`chess-board ${dimmed ? 'dimmed' : ''}`}>
      {plan.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map((piece, colIndex) => (
            <div className="cell" key={colIndex}>
              {piece === null
                ? null :
                <ChessPiece symbol={piece.symbol} color={piece.color} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

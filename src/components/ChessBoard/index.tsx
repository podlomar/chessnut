import { Chess } from 'chess.js';
import { ChessPiece } from '../ChessPiece';
import './styles.css';

export type BoardLayout = ReturnType<Chess['board']>;

interface Props {
  layout: BoardLayout;
}

export const ChessBoard = ({ layout }: Props) => {
  return (
    <div className="chess-board">
      {layout.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map((cell, colIndex) => (
            <div className="cell" key={colIndex}>
              {cell === null
                ? null :
                <ChessPiece symbol={cell.type} color={cell.color} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

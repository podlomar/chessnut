import { ChessBoard } from './components/ChessBoard';
import { Chess } from 'chess.js';

const chess = new Chess(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
);

export const App = () => {
  return (
    <div className="container">
      <ChessBoard layout={chess.board()} />
    </div>
  );
};

import { useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChessnutDriver, readPosition } from './chessnut';
import { Chess } from 'chess.js';

// const chess = new Chess();
// console.log("Moves", chess.moves({ verbose: true }));

export const App = () => {
  const [chess, setChess] = useState<Chess | null>(null);

  const handleConnect = () => {
    const driver = new ChessnutDriver(setChess);
    driver.connect();
  };

  return (
    <div className="container">
      <button onClick={handleConnect}>Connect</button>
      {chess !== null && <ChessBoard layout={chess.board()} />}
    </div>
  );
};

import { useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChessnutDriver, GameState, readPosition } from './chessnut';
import { Chess } from 'chess.js';
import { MovesHistory } from './components/MovesHistory';

// const chess = new Chess();
// console.log("Moves", chess.moves({ verbose: true }));

export const App = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleConnect = () => {
    const driver = new ChessnutDriver((state => {
      setGameState(state);
      console.log("history", state.chess.history({ verbose: true }));
    }));
    driver.connect();
  };

  return (
    <div className="container">
      <button onClick={handleConnect}>Connect</button>
      {gameState !== null && <ChessBoard layout={gameState.chess.board()} />}
      <MovesHistory history={gameState ? gameState.chess.history({ verbose: true }) : []} />
    </div>
  );
};

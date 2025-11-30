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
      <header className="app-header">
        <h1 className="app-title">Chessnut</h1>
        <button className="connect-btn" onClick={handleConnect}>
          Connect Board
        </button>
      </header>

      <div className="game-container">
        {gameState !== null && <ChessBoard layout={gameState.chess.board()} />}
        <MovesHistory history={gameState ? gameState.chess.history({ verbose: true }) : []} />
      </div>
    </div>
  );
};

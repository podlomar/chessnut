import { useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChessnutDriver, GameState, readPosition } from './chessnut';
import { Chess } from 'chess.js';
import { MovesHistory } from './components/MovesHistory';

// const chess = new Chess();
// console.log("Moves", chess.moves({ verbose: true }));

export const App = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    const driver = new ChessnutDriver((state => {
      setGameState(state);
      console.log("history", state.chess.history({ verbose: true }));
    }));
    driver.connect();
  };

  const handleCopyPgn = async () => {
    if (!gameState) return;

    const pgn = gameState.chess.pgn();
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PGN:', err);
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Chessnut</h1>
        <div className="header-buttons">
          <button className="connect-btn" onClick={handleConnect}>
            Connect Board
          </button>
          <button
            className="copy-pgn-btn"
            onClick={handleCopyPgn}
            disabled={!gameState}
          >
            {copied ? '✓ Copied!' : 'Copy PGN'}
          </button>
        </div>
      </header>

      <div className="game-container">
        {gameState !== null && <ChessBoard layout={gameState.chess.board()} />}
        <MovesHistory history={gameState ? gameState.chess.history({ verbose: true }) : []} />
      </div>
    </div>
  );
};

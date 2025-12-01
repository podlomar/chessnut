import { useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChessnutDriver, GameState, readPlacement } from './chessnut';
import { MovesHistory } from './components/MovesHistory';

// const chess = new Chess();
// console.log("Moves", chess.moves({ verbose: true }));

export const App = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    const driver = new ChessnutDriver((state => {
      setGameState(state);
      console.log("New game state:", state.status);
    }));
    driver.connect();
  };

  const handleCopyPgn = async () => {
    if (gameState === null || gameState.status !== 'playing') {
      return;
    }

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
        {gameState !== null && (
          <ChessBoard
            placement={gameState.placement}
            dimmed={gameState.status === 'random'}
          />
        )}
        <MovesHistory
          history={
            gameState?.status === 'playing'
              ? gameState.chess.history({ verbose: true })
              : []
          }
        />
      </div>
    </div>
  );
};

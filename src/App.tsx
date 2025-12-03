import { useRef, useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChessnutDriver, GameState } from './chessnut';
import { MovesHistory } from './components/MovesHistory';
import './styles.css';
import { emptyDiff } from './placement';

const cleanPgn = (pgn: string): string => {
  return pgn
    .replace(/\[.*\]\n/g, '') // Remove header tags
    .replace(/\s+/g, ' ')     // Replace multiple spaces/newlines with single space
    .trim();                  // Trim leading/trailing whitespace
};

export const placementToAscii = (placement: string): string[] => {
  const rows = placement.split('/');
  return rows
    .map(row => {
      let asciiRow = '';
      for (const char of row) {
        if (isNaN(Number(char))) {
          asciiRow += char;
        } else {
          asciiRow += '.'.repeat(Number(char));
        }
      }
      return asciiRow;
    });
};

export const App = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);
  const driverRef = useRef<ChessnutDriver | null>(null);

  const handleConnect = () => {
    const driver = new ChessnutDriver((state => {
      setGameState(state);
    }));
    driverRef.current = driver;
    driver.connect();
  };

  const handleStartGame = () => {
    driverRef.current?.startGame();
  };

  const handleTakeBack = () => {
    driverRef.current?.takeBack();
  };

  const handleCopyPgn = async () => {
    if (gameState === null || gameState.status !== 'playing') {
      return;
    }

    const pgn = cleanPgn(gameState.chess.pgn());
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
        <h1 className="app-title">Chessnut Play</h1>
        <div className="header-buttons">
          <button className="connect-btn" onClick={handleConnect}>
            Connect Board
          </button>
          <button
            className="start-btn"
            onClick={handleStartGame}
            disabled={gameState?.status !== 'initial'}
          >
            Start Game
          </button>
          <button
            className="takeback-btn"
            onClick={handleTakeBack}
            disabled={gameState?.status !== 'playing' || gameState.chess.history().length === 0}
          >
            Take Back
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
            accented={gameState.status === 'playing' && gameState.mismatch}
            diff={gameState.status === 'playing' ? gameState.diff : emptyDiff()}
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
      <div className="position">
        {gameState?.status !== 'playing'
          ? null
          : gameState.placement.toAscii().map(
            (row, i) => (
              <p key={i}>{row}</p>
            )
          )}
      </div>
      <div className="position">
        {gameState?.status !== 'playing'
          ? null
          : gameState.chess.fen()
        }
      </div>
    </div>
  );
};

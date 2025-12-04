import { useEffect, useRef, useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChessnutDriver, GameState } from './chessnut';
import { MovesHistory } from './components/MovesHistory';
import { emptyDiff, getDiffSize } from './placement';
import './styles.css';


const cleanPgn = (pgn: string): string => {
  return pgn
    .replace(/\[.*\]\n/g, '') // Remove header tags
    .replace(/\s+/g, ' ')     // Replace multiple spaces/newlines with single space
    .trim();                  // Trim leading/trailing whitespace
};

const playDing = () => {
  const dingSound = new Audio('/sounds/tap.mp3');
  dingSound.play();
}

const playError = () => {
  // const errorSound = new Audio('/sounds/error2.mp3');
  // errorSound.play();
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

  useEffect(() => {
    const handleSpaceKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        driverRef.current?.startGame();
      }
    };

    window.addEventListener('keydown', handleSpaceKey);
    return () => {
      window.removeEventListener('keydown', handleSpaceKey);
    };
  }, []);

  useEffect(() => {
    if (gameState?.status !== 'playing') {
      return;
    }

    if (gameState.mismatch) {
      console.log('Position mismatch detected', gameState.diff.length);
      const diffSize = getDiffSize(gameState.diff);
      if (diffSize > 1) {
        playError();
      }
    } else {
      playDing();
    }
  }, [gameState]);

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
    </div>
  );
};

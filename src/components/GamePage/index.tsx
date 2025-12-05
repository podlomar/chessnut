import { useEffect, useState } from 'react';
import { Button } from '../Button';
import { ChessBoard } from '../ChessBoard';
import { ChessnutDriver, GameState } from '../../chess-lib/chessnut';
import { MovesHistory } from '../MovesHistory';
import { BoardFeedback, emptyDiff, getDiffSize } from '../../chess-lib/placement';
import './styles.css';

const cleanPgn = (pgn: string): string => {
  return pgn
    .replace(/\[.*\]\n/g, '') // Remove header tags
    .replace(/\s+/g, ' ')     // Replace multiple spaces/newlines with single space
    .trim();                  // Trim leading/trailing whitespace
};

const playDing = () => {
  const dingSound = new Audio('/sounds/ding.mp3');
  dingSound.play();
}

const playTap = () => {
  const dingSound = new Audio('/sounds/tap.mp3');
  dingSound.play();
}

const playError = () => {
  // const errorSound = new Audio('/sounds/error2.mp3');
  // errorSound.play();
};

interface Props {
  driver: ChessnutDriver;
}

export const GamePage = ({ driver }: Props) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    driver.onStateChange(setGameState);
    const handleSpaceKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        driver.startGame();
      }
    };

    const handleBackspaceKey = (event: KeyboardEvent) => {
      if (event.code === 'Backspace') {
        event.preventDefault();
        driver.takeBack();
      }
    };

    window.addEventListener('keydown', handleSpaceKey);
    window.addEventListener('keydown', handleBackspaceKey);

    return () => {
      window.removeEventListener('keydown', handleSpaceKey);
      window.removeEventListener('keydown', handleBackspaceKey);
      driver.offStateChange();
    };
  }, [driver]);

  const handleStartGame = () => {
    driver.startGame();
  };

  const handleTakeBack = () => {
    driver.takeBack();
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
    console.log('Game state updated:', gameState);
    if (gameState?.status !== 'playing') {
      return;
    }

    if (gameState.position.isInitial() && gameState.feedback.isEmpty()) {
      playDing();
      return;
    }

    if (gameState.returned) {
      playDing();
      return;
    }

    if (gameState.feedback.isEmpty()) {
      playTap();
    }
  }, [gameState]);

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Chessnut Play</h1>
        <div className="header-buttons">
          <Button primary
            onClick={handleStartGame}
            disabled={gameState === null || gameState.status === 'playing' || gameState.placement.isInitial() === false}
          >
            Start Game
          </Button>
          <Button
            onClick={handleTakeBack}
            disabled={gameState?.status !== 'playing' || gameState.chess.history().length === 0}
          >
            Take Back
          </Button>
          <Button
            onClick={handleCopyPgn}
            disabled={gameState === null || gameState.status !== 'playing' || gameState.chess.history().length === 0}
          >
            {copied ? '✓ Copied!' : 'Copy PGN'}
          </Button>
        </div>
      </header>

      <div className="game-container">
        {gameState !== null && (
          gameState.status === 'random' ? (
            <ChessBoard
              placement={gameState.placement}
              dimmed={gameState.placement.isInitial() === false}
              feedback={BoardFeedback.empty()}
            />
          ) : (
            <ChessBoard
              placement={gameState.position.placement}
              dimmed={false}
              feedback={gameState.feedback}
            />
          )
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

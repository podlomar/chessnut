import { JSX, useEffect, useRef, useState } from 'react';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { ChessBoard } from '../ChessBoard';
import { ChessnutDriver, GameState } from '../../chess-lib/chessnut';
import { MovesHistory } from '../MovesHistory';
import { BoardFeedback, emptyDiff, getDiffSize } from '../../chess-lib/placement';
import './styles.css';
import { Chess } from 'chess.js';

const cleanPgn = (pgn: string): string => {
  return pgn
    .replace(/\[.*\]\n/g, '') // Remove header tags
    .replace(/\s+/g, ' ')     // Replace multiple spaces/newlines with single space
    .trim();                  // Trim leading/trailing whitespace
};

const errorSound = new Audio('/sounds/error.mp3');
errorSound.load();

const playDing = () => {
  const dingSound = new Audio('/sounds/ding.mp3');
  dingSound.play();
}

const playTap = () => {
  const dingSound = new Audio('/sounds/tap.mp3');
  dingSound.play();
}

interface Props {
  driver: ChessnutDriver;
}

const buildGameOverMessage = (chess: Chess): JSX.Element => {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'Black' : 'White';
    return <span>The game has ended in checkmate! <strong>{winner} wins</strong>.</span>;
  } else if (chess.isStalemate()) {
    return <span>The game has ended in stalemate!</span>;
  } else if (chess.isThreefoldRepetition()) {
    return <span>The game has ended in a draw by threefold repetition.</span>;
  } else if (chess.isInsufficientMaterial()) {
    return <span>The game has ended in a draw due to insufficient material.</span>;
  } else if (chess.isDrawByFiftyMoves()) {
    return <span>The game has ended in a draw by the fifty-move rule.</span>;
  } else if (chess.isDraw()) {
    return <span>The game has ended in a draw.</span>;
  }
  return <span>The game has ended.</span>;
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
    if (gameState === null || gameState.status === 'random') {
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

  const errorTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState?.status !== 'playing') {
      window.clearInterval(errorTimerRef.current ?? undefined);
      errorTimerRef.current = null;
      return;
    }

    if (gameState.position.isInitial() && gameState.feedback.isEmpty()) {
      window.clearInterval(errorTimerRef.current ?? undefined);
      errorTimerRef.current = null;
      playDing();
      return;
    }

    if (gameState.returned) {
      window.clearInterval(errorTimerRef.current ?? undefined);
      errorTimerRef.current = null;
      playDing();
      return;
    }

    if (gameState.feedback.isEmpty()) {
      window.clearInterval(errorTimerRef.current ?? undefined);
      errorTimerRef.current = null;
      playTap();
      return;
    }

    if (gameState.feedback.hasErrors()) {
      if (errorTimerRef.current === null) {
        errorTimerRef.current = window.setInterval(() => {
          errorSound.play();
        }, 1500);
      }
    }
  }, [gameState]);

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Chessnut Play</h1>
        <div className="header-buttons">
          <Button primary
            onClick={handleStartGame}
            disabled={gameState === null || gameState.status === 'playing' || gameState.status === 'over' || gameState.placement.isInitial() === false}
          >
            Start Game
          </Button>
          <Button
            onClick={handleTakeBack}
            disabled={gameState === null || gameState.status === 'random' || gameState.chess.history().length === 0}
          >
            Take Back
          </Button>
          <Button
            onClick={handleCopyPgn}
            disabled={gameState === null || gameState.status === 'random' || gameState.chess.history().length === 0}
          >
            {copied ? '✓ Copied!' : 'Copy PGN'}
          </Button>
        </div>
      </header>

      {gameState?.status === 'over' && (
        <div className="alert-container">
          <Alert variant="info" title="Game Over">
            <p>{buildGameOverMessage(gameState.chess)}</p>
          </Alert>
        </div>
      )}

      <div className="game-container">
        {gameState?.status === 'random' && (
          <ChessBoard
            placement={gameState.placement}
            dimmed={gameState.placement.isInitial() === false}
            feedback={BoardFeedback.empty()}
          />
        )}
        {gameState?.status === 'over' && (
          <ChessBoard
            placement={gameState.position.placement}
            dimmed={false}
            feedback={BoardFeedback.empty()}
          />
        )}
        {gameState?.status === 'playing' && (
          <ChessBoard
            placement={gameState.position.placement}
            dimmed={false}
            feedback={gameState.feedback}
          />
        )}
        <MovesHistory
          history={
            gameState?.status === 'playing' || gameState?.status === 'over'
              ? gameState.chess.history({ verbose: true })
              : []
          }
        />
      </div>
    </div>
  );
};

import { JSX, useEffect, useRef, useState } from 'react';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { ChessBoard } from '../ChessBoard';
import { ChessnutDriver } from '../../chess-lib/chessnut';
import { MovesHistory } from '../MovesHistory';
import { GameOverState, useChessGame } from '../../chess-lib/chess-game';
import { AudioFeedback } from '../../lib/audio-feedback';
import './styles.css';

const cleanPgn = (pgn: string): string => {
  return pgn
    .replace(/\[.*\]\n/g, '') // Remove header tags
    .replace(/\s+/g, ' ')     // Replace multiple spaces/newlines with single space
    .trim();                  // Trim leading/trailing whitespace
};

interface Props {
  driver: ChessnutDriver;
}

const buildGameOverMessage = (gameOverState: GameOverState): JSX.Element => {
  const { ending, position } = gameOverState;
  const side = position.turnColor() === 'w' ? 'b' : 'w';

  if (ending === 'checkmate') {
    const winner = side === 'w' ? 'White' : 'Black';
    return <span>The game has ended in checkmate! <strong>{winner} wins</strong>.</span>;
  } else if (ending === 'stalemate') {
    return <span>The game has ended in stalemate!</span>;
  } else if (ending === 'threefold_repetition') {
    return <span>The game has ended in a draw by threefold repetition.</span>;
  } else if (ending === 'insufficient_material') {
    return <span>The game has ended in a draw due to insufficient material.</span>;
  } else if (ending === '50move_rule') {
    return <span>The game has ended in a draw by the fifty-move rule.</span>;
  }
  return <span>The game has ended.</span>;
}

export const GamePage = ({ driver }: Props) => {
  const [gameState, startGame] = useChessGame(driver);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleSpaceKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        startGame();
      }
    };

    const handleBackspaceKey = (event: KeyboardEvent) => {
      if (event.code === 'Backspace') {
        event.preventDefault();
        // driver.takeBack();
      }
    };

    const handleCtrlD = (event: KeyboardEvent) => {
      if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        driver.downloadGameLog();
      }
    };

    const handleFullscreen = (event: KeyboardEvent) => {
      if (event.code === 'KeyF') {
        event.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleCtrlD);
    window.addEventListener('keydown', handleSpaceKey);
    window.addEventListener('keydown', handleBackspaceKey);
    window.addEventListener('keydown', handleFullscreen);

    return () => {
      window.removeEventListener('keydown', handleSpaceKey);
      window.removeEventListener('keydown', handleBackspaceKey);
      window.removeEventListener('keydown', handleCtrlD);
      window.removeEventListener('keydown', handleFullscreen);
    };
  }, [driver]);

  const handleTakeBack = () => {
    // driver.takeBack();
  };

  const handleCopyPgn = async () => {
    if (gameState.phase === 'setting-up') {
      return;
    }

    const pgn = cleanPgn(gameState.position.pgn());
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PGN:', err);
    }
  };

  const { current: audioFeedback } = useRef(new AudioFeedback());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (gameState.phase === 'setting-up') {
      audioFeedback.reset();
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      return;
    }

    if (gameState.phase === 'game-over') {
      audioFeedback.play('gameOver');
      const pgn = cleanPgn(gameState.position.pgn());
      console.log("Game Over! PGN:\n", pgn);
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      return;
    }

    if (wakeLockRef.current === null) {
      navigator.wakeLock.request('screen')
        .then((lock) => {
          wakeLockRef.current = lock;
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        })
        .catch((err) => {
          console.error("Failed to acquire wake lock:", err);
        });
    }

    if (gameState.position.status.type === 'ready') {
      if (audioFeedback.errorAlertState !== 'scheduled') {
        audioFeedback.play('ding');
      }
      audioFeedback.reset();
      return;
    }

    if (gameState.position.status.type === 'moved') {
      audioFeedback.play('tap');
      return;
    }

    if (gameState.position.status.type === 'errors') {
      audioFeedback.scheduleErrorFeedback();
    }
  }, [gameState]);

  console.log("Game state phase:", gameState);

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Chessnut Play</h1>
        <div className="header-buttons">
          <Button primary
            onClick={startGame}
            disabled={!gameState.canStartGame}
          >
            Start Game
          </Button>
          <Button
            onClick={handleTakeBack}
            disabled={gameState.gameStarting}
          >
            Take Back
          </Button>
          <Button
            onClick={handleCopyPgn}
            disabled={gameState.gameStarting}
          >
            {copied ? '✓ Copied!' : 'Copy PGN'}
          </Button>
        </div>
      </header>

      {gameState?.phase === 'game-over' && (
        <div className="alert-container">
          <Alert variant="info" title="Game Over">
            <p>{buildGameOverMessage(gameState)}</p>
          </Alert>
        </div>
      )}

      <div className="game-container">
        {gameState.phase === 'setting-up' && (
          <ChessBoard
            placement={gameState.placement}
            dimmed={gameState.placement.isStarting() === false}
          />
        )}
        {gameState.phase === 'in-progress' || gameState.phase === 'game-over' ? (
          <ChessBoard
            placement={gameState.position.placement}
            dimmed={false}
            status={gameState.position.status}
          />
        ) : null}
        <MovesHistory
          history={
            gameState.phase === 'in-progress' || gameState.phase === 'game-over'
              ? gameState.position.movesHistory()
              : []
          }
        />
      </div>
    </div>
  );
};

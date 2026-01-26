import { useState, useEffect, useCallback } from "react";
import { ChessPosition, GameEnding, PiecesPlacement } from "chessboard-sense";
import { ChessnutDriver } from "./chessnut.js";

export interface BaseState {
  readonly canStartGame: boolean;
  readonly gameStarting: boolean;
}

export interface SettingUpState extends BaseState {
  readonly phase: 'setting-up';
  readonly placement: PiecesPlacement;
}

export interface InProgressState extends BaseState {
  readonly phase: 'in-progress';
  readonly position: ChessPosition;
}

export interface GameOverState extends BaseState {
  readonly phase: 'game-over';
  readonly ending: GameEnding;
  readonly position: ChessPosition;
}

export type ChessGameState = SettingUpState | InProgressState | GameOverState;

export const useChessGame = (driver: ChessnutDriver): [ChessGameState, () => void] => {
  const [gameState, setGameState] = useState<ChessGameState>(() => ({
    phase: 'setting-up',
    placement: PiecesPlacement.empty(),
    canStartGame: false,
    gameStarting: true,
  }));

  useEffect(() => {
    driver.onPlacementChange((placement: PiecesPlacement) => {
      setGameState((prevState) => {
        if (prevState.phase === 'setting-up') {
          return {
            ...prevState,
            placement,
            canStartGame: placement.isStarting(),
            gameStarting: true,
          };
        } else if (prevState.phase === 'in-progress') {
          const position = prevState.position.next(placement);
          const ending = position.gameEnding();
          if (ending === null) {
            return {
              ...prevState,
              position,
              gameStarting: position.movesHistory().length === 0,
            };
          }

          return {
            phase: 'game-over',
            position,
            ending,
            canStartGame: false,
            gameStarting: false,
          }
        }

        return prevState;
      });
    });

    return () => {
      driver.offPlacementChange();
    };
  }, [driver]);

  const startGame = useCallback(() => {
    setGameState((prevState) => {
      if (prevState.phase === 'setting-up') {
        return {
          phase: 'in-progress',
          position: ChessPosition.initial(),
          canStartGame: false,
          gameStarting: true,
        };
      }
      return prevState;
    });
  }, []);

  return [gameState, startGame];
};

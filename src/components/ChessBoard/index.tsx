import { JSX } from 'react';
import clsx from 'clsx';
import { Panel } from '../Panel';
import { ChessPiece } from '../ChessPiece';
import { PiecesPlacement, Square, PositionStatus } from 'chessboard-sense';
import './styles.css';

interface Props {
  placement: PiecesPlacement;
  dimmed?: boolean;
  status?: PositionStatus;
}

export const ChessBoard = (
  { placement, dimmed, status }: Props
): JSX.Element => {
  const accented = status?.type === 'errors';
  return (
    <Panel className={clsx({ dimmed, accented })} contentClassName="chessboard">
      {placement.ranks().map((rank, rankIndex) => (
        <div className="row" key={rankIndex}>
          {rank.map((piece, fileIndex) => {
            const square = Square.fromCoords(7 - rankIndex, fileIndex);
            const isLifted = status?.type === 'lifted' && status.square === square;
            const feedbackSquare = status?.type === 'errors' ? status.targets.find(error => error.square === square) : undefined;

            const className = clsx('cell', {
              'cell--lifted': isLifted,
              'cell--error': feedbackSquare !== undefined,
            });

            const targetPiece = (feedbackSquare?.piece ?? null) ?? piece;
            return (
              <div className={className} key={fileIndex}>
                {targetPiece === null
                  ? null
                  : <ChessPiece piece={targetPiece} />}
              </div>
            );
          })}
        </div>
      ))}
    </Panel>
  );
};

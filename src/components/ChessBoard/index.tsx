import clsx from 'clsx';
import { Panel } from '../Panel';
import { ChessPiece } from '../ChessPiece';
import { BoardFeedback, Placement } from '../../chess-lib/placement';
import './styles.css';

interface Props {
  placement: Placement;
  dimmed: boolean;
  feedback: BoardFeedback;
}

export const ChessBoard = (
  { placement, dimmed, feedback }: Props) => {
  return (
    <Panel className={clsx({ dimmed, accented: feedback.hasErrors() })} contentClassName="chessboard">
      {placement.ranksMap((rank, rankIndex) => (
        <div className="row" key={rankIndex}>
          {rank.map((piece, fileIndex) => {
            const feedbackSquare = feedback.squares[rankIndex][fileIndex];
            const className = clsx('cell', {
              'cell--lifted': feedbackSquare?.type === 'lifted',
              'cell--error': feedbackSquare?.type === 'error',
            });

            const targetPiece = (feedbackSquare?.piece ?? null) ?? piece;
            return (
              <div className={className} key={fileIndex}>
                {targetPiece === null
                  ? null
                  : <ChessPiece type={targetPiece.type} color={targetPiece.color} />}
              </div>
            );
          })}
        </div>
      ))}
    </Panel>
  );
};

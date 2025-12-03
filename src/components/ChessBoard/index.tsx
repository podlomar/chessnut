import { ChessPiece } from '../ChessPiece';
import { Placement, PlacementDiff } from '../../placement';
import './styles.css';
import { Square } from 'chess.js';

interface Props {
  placement: Placement;
  dimmed: boolean;
  accented: boolean;
  diff: PlacementDiff;
}

export const ChessBoard = (
  { placement, dimmed, accented, diff }: Props) => {
  return (
    <div className={`chess-board ${dimmed ? 'dimmed' : ''} ${accented ? 'accented' : ''}`}>
      {placement.ranksMap((rank, rankIndex) => (
        <div className="row" key={rankIndex}>
          {rank.map((piece, fileIndex) => {
            const changed = diff[rankIndex][fileIndex];

            if (changed === null) {
              return (
                <div className="cell" key={fileIndex}>
                  {piece === null
                    ? null
                    : <ChessPiece type={piece.type} color={piece.color} />}
                </div>
              );
            }

            return (
              <div className="cell cell__accented" key={fileIndex}>
                {changed.from === null
                  ? null
                  : <ChessPiece type={changed.from.type} color={changed.from.color} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

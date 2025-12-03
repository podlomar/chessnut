import { ChessPiece } from '../ChessPiece';
import { Placement } from '../../placement';
import './styles.css';

interface Props {
  placement: Placement;
  dimmed?: boolean;
  accented?: boolean;
}

export const ChessBoard = ({ placement, dimmed = true, accented = false }: Props) => {
  return (
    <div className={`chess-board ${dimmed ? 'dimmed' : ''} ${accented ? 'accented' : ''}`}>
      {placement.ranksMap((rank, rankIndex) => (
        <div className="row" key={rankIndex}>
          {rank.map((piece, fileIndex) => (
            <div className="cell" key={fileIndex}>
              {piece === null
                ? null
                : <ChessPiece type={piece.type} color={piece.color} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

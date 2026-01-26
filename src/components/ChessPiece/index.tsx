import './styles.css';
import { Piece } from "chessboard-sense";

interface Props {
  piece: Piece;
}

export const ChessPiece = ({ piece }: Props) => {
  return (
    <div className={`piece ${piece.side()}${piece.symbol.toLowerCase()}`} />
  );
};

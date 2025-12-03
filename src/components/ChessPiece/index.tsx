import { PieceSymbol, Color } from "chess.js";
import './styles.css';

interface Props {
  type: PieceSymbol;
  color: Color;
}

export const ChessPiece = ({ type, color }: Props) => {
  return (
    <div className={`piece ${color}${type}`} />
  );
};

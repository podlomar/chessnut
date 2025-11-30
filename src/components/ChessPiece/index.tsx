import { PieceSymbol, Color } from "chess.js";
import './styles.css';

interface Props {
  symbol: PieceSymbol;
  color: Color;
}

export const ChessPiece = ({ symbol, color }: Props) => {
  return (
    <div className={`piece ${color}${symbol}`} />
  );
};

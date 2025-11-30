import { Move } from "chess.js";
import './styles.css';

interface Props {
  history: Move[];
}

const pieceSymbols: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

export const MovesHistory = ({ history }: Props) => {
  // Group moves into pairs (white, black)
  const movePairs: { white: Move; black?: Move }[] = [];

  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="moves-history">
      <h2 className="moves-history__title">Moves History</h2>
      {history.length === 0 ? (
        <p className="moves-history__empty">No moves yet. Start playing!</p>
      ) : (
        <ul className="moves-history__list">
          {movePairs.map((pair, index) => (
            <li key={index} className="moves-history__row">
              <span className="moves-history__number">{index + 1}.</span>
              <span className="moves-history__move moves-history__move--white">
                <span className="moves-history__move-icon">
                  {pieceSymbols[pair.white.piece]}
                </span>
                {pair.white.san}
              </span>
              {pair.black && (
                <span className="moves-history__move moves-history__move--black">
                  <span className="moves-history__move-icon">
                    {pieceSymbols[pair.black.piece]}
                  </span>
                  {pair.black.san}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

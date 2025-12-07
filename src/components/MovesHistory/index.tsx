import { Panel } from "../Panel";
import { Move } from "chess.js";
import './styles.css';
import { useEffect, useRef } from "react";

interface Props {
  history: Move[];
}

export const MovesHistory = ({ history }: Props) => {
  const movePairs: { white: Move; black?: Move }[] = [];

  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i],
      black: history[i + 1],
    });
  }

  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [history.length]);

  return (
    <Panel
      title="Moves"
      className="moves-history"
      contentClassName="moves-history__content"
    >
      {history.length === 0 ? (
        <p className="moves-history__empty">No moves yet. Start playing!</p>
      ) : (
        <ul ref={listRef} className="moves-history__list">
          {movePairs.map((pair, index) => (
            <li key={index} className="moves-history__row">
              <span className="moves-history__number">{index + 1}.</span>
              <span className="moves-history__move">
                {pair.white.san}
              </span>
              {pair.black && (
                <span className="moves-history__move">
                  {pair.black.san}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

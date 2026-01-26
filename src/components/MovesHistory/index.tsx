import { useEffect, useRef } from "react";
import { Panel } from "../Panel";
import { type Turn } from "chessboard-sense";
import './styles.css';

interface Props {
  history: Turn[];
}

export const MovesHistory = ({ history }: Props) => {
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
          {history.map((turn, index) => (
            <li key={index} className="moves-history__row">
              <span className="moves-history__number">{index + 1}.</span>
              <span className="moves-history__move">
                {turn.white}
              </span>
              {turn.black && (
                <span className="moves-history__move">
                  {turn.black}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

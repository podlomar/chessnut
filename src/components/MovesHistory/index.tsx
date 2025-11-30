import { Move } from "chess.js";

interface Props {
  history: Move[];
}

export const MovesHistory = ({ history }: Props) => {
  return (
    <div className="moves-history">
      <h2>Moves History</h2>
      <ul>
        {history.map((move, index) => (
          <li key={index}>
            {move.san}
          </li>
        ))}
      </ul>
    </div>
  );
};

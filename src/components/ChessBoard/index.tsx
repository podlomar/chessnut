import './styles.css';

export const ChessBoard = () => {
  return (
    <div className="chess-board">
      {Array.from({ length: 8 }, (_, row) => (
        <div className="row" key={row}>
          {Array.from({ length: 8 }, (_, col) => (
            <div className="cell" key={col} />
          ))}
        </div>
      ))}
    </div>
  );
};

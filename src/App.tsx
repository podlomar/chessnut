import { useState } from 'react';
import { ChessnutDriver } from './chessnut';
import { ConnectPage } from './components/ConnectPage';
import { GamePage } from './components/GamePage';
import './styles.css';


export const App = () => {
  const [driver, setDriver] = useState<ChessnutDriver | null>(null);

  const handleDriverConnect = (newDriver: ChessnutDriver) => {
    setDriver(newDriver);
  };

  if (driver === null) {
    return (
      <ConnectPage onDriverConnect={handleDriverConnect} />
    );
  }

  return (
    <GamePage driver={driver} />
  );
}

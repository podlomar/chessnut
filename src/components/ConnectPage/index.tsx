import { ChessnutDriver } from "../../chessnut";
import { Button } from "../Button";
import { Panel } from "../Panel";
import './styles.css';

interface Props {
  onDriverConnect: (driver: ChessnutDriver) => void;
}

export const ConnectPage = ({ onDriverConnect }: Props) => {
  const handleConnect = async () => {
    const driver = await ChessnutDriver.connect();
    if (driver !== null) {
      onDriverConnect(driver);
    }
  }

  return (
    <div className="container connect-page">
      <Panel
        title="Connect your chess board"
        className="connect-panel"
        footer={(
          <div className="connect-actions">
            <Button primary onClick={handleConnect}>
              Connect Board
            </Button>
          </div>
        )}
      >
        <p>
          To get started, please connect your electronic chess board.
        </p>
        <p>
          Make sure your board is powered on and connected to your computer via USB cable.
        </p>
      </Panel>
    </div>
  );
}

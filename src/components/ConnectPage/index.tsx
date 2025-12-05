import { ChessnutDriver } from "../../chess-lib/chessnut";
import { Button } from "../Button";
import { Panel } from "../Panel";
import './styles.css';

interface Props {
  onDriverConnect: (driver: ChessnutDriver) => void;
}

const browserSupportsWebUSB = () => {
  return 'hid' in navigator;
}

export const ConnectPage = ({ onDriverConnect }: Props) => {
  const handleConnect = async () => {
    const driver = await ChessnutDriver.connect();
    if (driver !== null) {
      onDriverConnect(driver);
    }
  }

  if (!browserSupportsWebUSB()) {
    return (
      <div className="container connect-page">
        <Panel
          title="Connect your chess board"
          className="connect-panel"
        >
          <p>
            Unfortunately, your browser does not support WebUSB API which is required to connect to an electronic chess board.
          </p>
          <p>
            Please use a compatible browser such as Google Chrome or Microsoft Edge.
          </p>
        </Panel>
      </div>
    );
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
          To get started, please connect your electronic chess board by following these steps:
        </p>
        <ol>
          <li>Turn on your chess board by long pressing the power button until the LED indicator lights up with a green color.</li>
          <li>Connect your chess board to your computer using a USB cable.</li>
          <li>Click the "Connect Board" button above.</li>
        </ol>
      </Panel>
    </div>
  );
}

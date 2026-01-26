import packageJson from "../../../package.json";
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
            Please use a compatible browser such as Google Chrome, Microsoft Edge or Opera.
          </p>
        </Panel>
        <div className="connect-version">v{packageJson.version}</div>
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
        <div className="connect-steps">
          <div className="connect-step">
            <div className="connect-step__number">1</div>
            <div className="connect-step__content">
              <div className="connect-step__title">Power on the board</div>
              <div className="connect-step__desc">
                Long press the power button until the LED indicator lights up with a green color.
              </div>
            </div>
          </div>
          <div className="connect-step">
            <div className="connect-step__number">2</div>
            <div className="connect-step__content">
              <div className="connect-step__title">Connect via USB</div>
              <div className="connect-step__desc">
                Connect your chess board to your computer using the provided USB cable.
              </div>
            </div>
          </div>
          <div className="connect-step">
            <div className="connect-step__number">3</div>
            <div className="connect-step__content">
              <div className="connect-step__title">Pair with browser</div>
              <div className="connect-step__desc">
                Click the "Connect Board" button below and select your device from the popup.
              </div>
            </div>
          </div>
        </div>
      </Panel>
      <div className="connect-version">Chessnut Play v{packageJson.version}</div>
    </div>
  );
}

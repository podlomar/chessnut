import { useEffect, useState } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { readPosition } from './chessnut';
import { Chess } from 'chess.js';

const chess = new Chess();
chess.clear();

const dataEquals = (data1: Uint8Array, data2: Uint8Array) => {
  for (let i = 0; i < data1.length; i++) {
    if (data1[i] !== data2[i]) {
      return false;
    }
  }
  return true;
}

const initMonitoring = async (callback: (chess: Chess) => void) => {
  const devices = await navigator.hid.requestDevice({
    filters: [{
      vendorId: 0x2d80,
      usagePage: 0xFF00
    }]
  });

  const device = devices[0];
  await device.open();
  const collection = device.collections.find(
    c => c.usagePage === 0xFF00
  );

  if (!collection) {
    console.error("Could not find usagePage 0xFF00");
    return;
  }

  const reportId = 0x21;
  await device.sendReport(reportId, new Uint8Array([0x01, 0x00]));

  let lastData: Uint8Array | null = null;

  device.addEventListener("inputreport", event => {
    const { data, reportId } = event;

    if (reportId !== 0x01) {
      return;
    }

    const bytes = new Uint8Array(data.buffer);
    const newData = bytes.slice(1, 33);

    if (lastData && dataEquals(lastData, newData)) {
      console.log("No changes detected");
      return;
    }

    lastData = newData;
    const chess = readPosition(newData);
    callback(chess);
  });
}

export const App = () => {
  const [chess, setChess] = useState<Chess | null>(null);

  const handleConnect = () => {
    initMonitoring((newChess) => {
      console.log("Report", newChess);
      setChess(newChess);
    });
  };

  return (
    <div className="container">
      <button onClick={handleConnect}>Connect</button>
      {chess !== null && <ChessBoard layout={chess.board()} />}
    </div>
  );
};

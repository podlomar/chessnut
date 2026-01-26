import { GameLog } from './game-log';
import { Piece, PiecesPlacement } from 'chessboard-sense';

const dataEquals = (data1: Uint8Array, data2: Uint8Array) => {
  for (let i = 0; i < data1.length; i++) {
    if (data1[i] !== data2[i]) {
      return false;
    }
  }
  return true;
}

const chessnutPieces: (Piece | null)[] = [
  null,
  Piece.BLACK_QUEEN,
  Piece.BLACK_KING,
  Piece.BLACK_BISHOP,
  Piece.BLACK_PAWN,
  Piece.BLACK_KNIGHT,
  Piece.WHITE_ROOK,
  Piece.WHITE_PAWN,
  Piece.BLACK_ROOK,
  Piece.WHITE_BISHOP,
  Piece.WHITE_KNIGHT,
  Piece.WHITE_QUEEN,
  Piece.WHITE_KING,
];

const reportToPlacement = (data: Uint8Array): PiecesPlacement => {
  let placement = PiecesPlacement.empty();

  for (let r = 0; r < 8; r++) {
    const rankContent: (Piece | null)[] = new Array(8).fill(null);
    for (let f = 0; f < 4; f++) {
      const byte = data[r * 4 + f];
      const lowNibble = byte & 0x0F;
      const highNibble = (byte >> 4) & 0x0F;
      const lowIndex = 7 - f * 2;
      const highIndex = lowIndex - 1;

      rankContent[lowIndex] = chessnutPieces[lowNibble];
      rankContent[highIndex] = chessnutPieces[highNibble];
    }
    placement = placement.fillRank(r, rankContent);
  }

  return placement;
};

export type PlacementCallback = (placement: PiecesPlacement) => void;

export class ChessnutDriver {
  private device: HIDDevice;
  private lastData: Uint8Array | null = null;
  private handlePlacement: PlacementCallback = () => { };
  private gameLog: GameLog | null = null;

  private constructor(device: HIDDevice) {
    this.device = device;
    this.device.addEventListener('inputreport', this.handleReport.bind(this));
  }

  public static async connect(): Promise<ChessnutDriver | null> {
    const devices = await navigator.hid.requestDevice({
      filters: [{
        vendorId: 0x2d80,
        usagePage: 0xFF00
      }]
    });

    if (devices.length === 0) {
      return null;
    }

    const device = devices[0];
    try {
      await device.open();
    } catch (err) {
      console.error("Failed to open device:", err);
      return null;
    }
    const collection = device.collections.find(
      c => c.usagePage === 0xFF00
    );

    if (!collection) {
      console.error("Could not find usagePage 0xFF00");
      return null;
    }

    const reportId = 0x21;
    try {
      await device.sendReport(reportId, new Uint8Array([0x01, 0x00]));
    } catch (err) {
      console.error("Failed to send initialization report:", err);
      return null;
    }

    return new ChessnutDriver(device);
  }

  public onPlacementChange(callback: PlacementCallback): void {
    this.handlePlacement = callback;
  }

  public offPlacementChange(): void {
    this.handlePlacement = () => { };
  }

  public downloadGameLog(): void {
    if (this.gameLog === null) {
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.gameLog.download(`game-log-${timestamp}.txt`);
  }

  private handleReport(event: HIDInputReportEvent) {
    const { data, reportId } = event;
    if (reportId === 0x2a) {
      const bytes = new Uint8Array(data.buffer);
      if (bytes[0] === 0x02 && bytes[1] === 0x64 && bytes[2] === 0x01) {
        return;
      }

      return;
    }

    if (reportId !== 0x01) {
      console.log('Unknown report id', reportId);
      return;
    }

    const bytes = new Uint8Array(data.buffer);
    const newData = bytes.slice(1, 33);
    console.log("Received data:", Array.from(newData).map(b => b.toString(16).padStart(2, '0')).join(' '));
    if (this.lastData !== null && dataEquals(this.lastData, newData)) {
      return;
    }

    this.gameLog?.addPosition(newData);

    this.lastData = newData;
    this.handlePlacement(reportToPlacement(newData));
  }
}

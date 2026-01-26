import os
import struct
from threading import Thread
import time

UHID_DESTROY = 1
UHID_START = 2
UHID_STOP = 3
UHID_OPEN = 4
UHID_CLOSE = 5
UHID_OUTPUT = 6
UHID_CREATE = 11
UHID_INPUT = 12
HID_MAX_DESCRIPTOR_SIZE = 4096

hid_descriptor = bytes([
    0x06, 0x00, 0xFF,        # Usage Page (Vendor-Defined 0xFF00)
    0x09, 0x01,              # Usage 1
    0xA1, 0x01,              # Collection (Application)

    # Report ID 0x21 (initialization output)
    0x85, 0x21,              #   Report ID 0x21
    0x09, 0x02,              #   Usage 2
    0x15, 0x00,              #   Logical Min 0
    0x26, 0xFF, 0x00,        #   Logical Max 255
    0x75, 0x08,              #   Report Size 8 bits
    0x95, 0x02,              #   Report Count 2 bytes
    0x91, 0x02,              #   Output (Data, Var, Abs)

    # Report ID 0x01 (chessboard 32-byte placement input)
    0x85, 0x01,              #   Report ID 0x01
    0x09, 0x03,              #   Usage 3
    0x15, 0x00,              #   Logical Min 0
    0x26, 0xFF, 0x00,        #   Logical Max 255
    0x75, 0x08,              #   Report Size = 8 bits
    0x95, 0x21,              #   Report Count = 33 bytes
    0x81, 0x02,              #   Input (Data, Var, Abs)

    0xC0                     # End Collection
])

pieces = {
    '.': 0x00,
    'q': 0x01,
    'k': 0x02,
    'b': 0x03,
    'p': 0x04,
    'n': 0x05,
    'R': 0x06,
    'P': 0x07,
    'r': 0x08,
    'B': 0x09,
    'N': 0x0A,
    'Q': 0x0B,
    'K': 0x0C,
}

initial_board = [
    "rnbqkbnr",
    "pppppppp",
    "........",
    "........",
    "........",
    "........",
    "PPPPPPPP",
    "RNBQKBNR",
]

def board_to_bytes(board_str):
    result = bytearray()
    for row in board_str:
        byte = None
        for ch in reversed(row):
            if byte is None:
                byte = pieces[ch]
            else:
                byte |= (pieces[ch] << 4)
                result.append(byte)
                byte = None
    
    return bytes(result)

def hex_string_to_bytes(s):
    result = bytearray()
    for i in range(0, len(s), 2):
        byte_str = s[i:i+2]
        result.append(int(byte_str, 16))
    return bytes(result)
    

def read_game_file(path):
    moves = []
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            board_str = parts[0].replace('-', '')
            delay_ms = int(parts[1]) if len(parts) > 1 else 1000
            moves.append((hex_string_to_bytes(board_str), delay_ms))
    return moves

class VirtualChessboard:
    def __init__(self, fd):
        self.fd = fd
        self.game_moves = None
        self.move_index = None
        Thread(target=self.read_loop, daemon=True).start()

    @classmethod
    def create(cls):
        fd = os.open("/dev/uhid", os.O_RDWR | os.O_NONBLOCK)
        name = b"VirtualChessboard"
        phys = b""
        uniq = b""

        rd_size = len(hid_descriptor)
        if rd_size > HID_MAX_DESCRIPTOR_SIZE:
            raise ValueError("Report descriptor too large")

        bus = 0x03
        vendor = 0x2d80
        product = 0x0001
        version = 0
        country = 0

        # Build the fixed part of uhid_create2_req
        create2 = struct.pack(
            "<128s64s64sHHIIII",
            name.ljust(128, b"\0"),
            phys.ljust(64, b"\0"),
            uniq.ljust(64, b"\0"),
            rd_size,
            bus,
            vendor,
            product,
            version,
            country
        )

        # Append descriptor and pad to max size
        create2 += hid_descriptor
        create2 += b"\0" * (HID_MAX_DESCRIPTOR_SIZE - rd_size)

        # Wrap into uhid_event
        event = struct.pack("<I", UHID_CREATE) + create2

        os.write(fd, event)
        time.sleep(1)  # Wait a bit for udev to create the node
        os.chmod('/dev/hidraw4', 0o666)

        print("Virtual HID device created")
        return cls(fd)
        
    def send_position(self, payload):
        report = bytes([0x01, 0x3d]) + payload
        # print("Sending position:", " ".join([hex(byte) for byte in report]))
        header = struct.pack("<IH", UHID_INPUT, len(report))
        os.write(self.fd, header + report)

    def read_event(self):
        try:
            data = os.read(self.fd, 4096)
            if data:
                return data
        except BlockingIOError:
            pass
    
    def read_loop(self):
        while True:
            event = self.read_event()
            if event:
                ev_type = struct.unpack("<I", event[:4])[0]

                if ev_type == UHID_CREATE:
                    print("Device created")
                elif ev_type == UHID_START:
                    print("Device started")
                elif ev_type == UHID_STOP:
                    print("Device stopped")
                elif ev_type == UHID_OPEN:
                    print("Device opened")
                elif ev_type == UHID_CLOSE:
                    print("Device closed")
                elif ev_type == UHID_OUTPUT:
                    print("Output event received")

            if self.game_moves is not None:
                if self.move_index < len(self.game_moves):
                    placement, delay = self.game_moves[self.move_index]
                    self.send_position(placement)
                    self.move_index += 1
                    time.sleep(1)
                else:
                    self.game_moves = 'finished'
                    self.move_index = None
                    print("Game finished, resetting board")
            elif self.game_moves == 'finished':
                time.sleep(1)
            else:
                placement = board_to_bytes(initial_board)
                self.send_position(placement)
                time.sleep(1)

    def run_game(self):
        self.game_moves = read_game_file('games/02-log.txt')
        self.move_index = 0
            

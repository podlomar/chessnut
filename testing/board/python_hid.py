from .virtual_board import VirtualChessboard

def main():
    board = VirtualChessboard.create()
    input("Virtual chessboard created. Press Enter to start a game...\n")
    board.run_game()
    input("Game started. Press Enter to exit...\n")

if __name__ == "__main__":
    main()

export type Cell = "X" | "O" | null;
export type Mark = "X" | "O";

export interface RoomState {
  id: string;
  board: Cell[];
  turn: Mark;
  players: {
    X: string | null; // token of the player assigned to X
    O: string | null; // token of the player assigned to O
  };
  winner: Mark | "draw" | null;
  winningLine: number[] | null;
  createdAt: number;
  updatedAt: number;
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(board: Cell[]): { winner: Mark | "draw" | null; line: number[] | null } {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }
  return { winner: null, line: null };
}

export function createEmptyBoard(): Cell[] {
  return Array(9).fill(null);
}

export function generateId(length = 5): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars (0/O, 1/I)
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateToken(): string {
  return (
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  );
}

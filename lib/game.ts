export type Cell = "X" | "O" | null;
export type Mark = "X" | "O";

export type GameMode = "classic" | "connect4in6" | "connect5in7" | "connect6in8";

export interface GameModeConfig {
  size: number; // board is size x size
  winLength: number; // number of marks in a row needed to win
  label: string;
  description: string;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    size: 3,
    winLength: 3,
    label: "Classic 3×3",
    description: "The original. Three in a row wins.",
  },
  connect4in6: {
    size: 6,
    winLength: 4,
    label: "4 in a Row · 6×6",
    description: "Bigger board, no gravity — click any cell. Four in a row wins.",
  },
  connect5in7: {
    size: 7,
    winLength: 5,
    label: "5 in a Row · 7×7",
    description: "Bigger board, no gravity — click any cell. Five in a row wins.",
  },
  connect6in8: {
    size: 8,
    winLength: 5,
    label: "5 in a Row · 8×8",
    description: "Bigger board, no gravity — click any cell. Five in a row wins.",
  },
};

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && value in GAME_MODES;
}

export interface RoomState {
  id: string;
  mode: GameMode;
  size: number;
  winLength: number;
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

// Four directions are enough to cover every line orientation on a grid:
// horizontal, vertical, and both diagonals. Walking each cell as a
// potential line-start in each direction finds every winning run for any
// board size / win length combination.
const DIRECTIONS: Array<[number, number]> = [
  [0, 1], // horizontal →
  [1, 0], // vertical ↓
  [1, 1], // diagonal ↘
  [1, -1], // diagonal ↙
];

export function checkWinner(
  board: Cell[],
  size: number,
  winLength: number
): { winner: Mark | "draw" | null; line: number[] | null } {
  const at = (row: number, col: number): Cell => {
    if (row < 0 || row >= size || col < 0 || col >= size) return null;
    return board[row * size + col];
  };

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const mark = at(row, col);
      if (!mark) continue;

      for (const [dRow, dCol] of DIRECTIONS) {
        const line: number[] = [];
        let matched = true;

        for (let step = 0; step < winLength; step++) {
          const r = row + dRow * step;
          const c = col + dCol * step;
          if (at(r, c) !== mark) {
            matched = false;
            break;
          }
          line.push(r * size + c);
        }

        if (matched) {
          return { winner: mark, line };
        }
      }
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }

  return { winner: null, line: null };
}

export function createEmptyBoard(size: number): Cell[] {
  return Array(size * size).fill(null);
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

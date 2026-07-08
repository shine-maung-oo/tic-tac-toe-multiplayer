import { NextRequest, NextResponse } from "next/server";
import {
  GAME_MODES,
  GameMode,
  createEmptyBoard,
  generateId,
  generateToken,
  isGameMode,
} from "@/lib/game";
import { getRoom, setRoom } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const requestedMode = body?.mode;
  const mode: GameMode = isGameMode(requestedMode) ? requestedMode : "classic";
  const { size, winLength } = GAME_MODES[mode];

  // Make sure we don't collide with an existing room id.
  let id = generateId();
  let attempts = 0;
  while ((await getRoom(id)) && attempts < 10) {
    id = generateId();
    attempts++;
  }

  const token = generateToken();
  const now = Date.now();

  await setRoom({
    id,
    mode,
    size,
    winLength,
    board: createEmptyBoard(size),
    turn: "X",
    players: { X: token, O: null },
    winner: null,
    winningLine: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ roomId: id, player: "X", token, mode, size });
}

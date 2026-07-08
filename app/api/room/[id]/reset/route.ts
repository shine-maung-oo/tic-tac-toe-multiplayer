import { NextRequest, NextResponse } from "next/server";
import { createEmptyBoard } from "@/lib/game";
import { getRoom, setRoom } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = id.toUpperCase();
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { token } = await req.json();
  const isPlayer = room.players.X === token || room.players.O === token;

  if (!isPlayer) {
    return NextResponse.json({ error: "Invalid player token" }, { status: 403 });
  }

  room.board = createEmptyBoard(room.size);
  room.winner = null;
  room.winningLine = null;
  room.turn = "X";
  room.updatedAt = Date.now();
  await setRoom(room);

  return NextResponse.json({
    id: room.id,
    mode: room.mode,
    size: room.size,
    winLength: room.winLength,
    board: room.board,
    turn: room.turn,
    winner: room.winner,
    winningLine: room.winningLine,
    hasX: !!room.players.X,
    hasO: !!room.players.O,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { checkWinner } from "@/lib/game";
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

  const { token, index } = await req.json();

  if (typeof index !== "number" || index < 0 || index > 8) {
    return NextResponse.json({ error: "Invalid cell index" }, { status: 400 });
  }

  if (room.winner) {
    return NextResponse.json({ error: "Game is already over" }, { status: 409 });
  }

  const mark = room.players.X === token ? "X" : room.players.O === token ? "O" : null;

  if (!mark) {
    return NextResponse.json({ error: "Invalid player token" }, { status: 403 });
  }

  if (mark !== room.turn) {
    return NextResponse.json({ error: "Not your turn" }, { status: 409 });
  }

  if (room.board[index] !== null) {
    return NextResponse.json({ error: "Cell already taken" }, { status: 409 });
  }

  room.board[index] = mark;
  const { winner, line } = checkWinner(room.board);
  room.winner = winner;
  room.winningLine = line;
  room.turn = mark === "X" ? "O" : "X";
  room.updatedAt = Date.now();
  await setRoom(room);

  return NextResponse.json({
    id: room.id,
    board: room.board,
    turn: room.turn,
    winner: room.winner,
    winningLine: room.winningLine,
    hasX: !!room.players.X,
    hasO: !!room.players.O,
  });
}

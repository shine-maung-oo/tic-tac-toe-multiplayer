import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = id.toUpperCase();
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

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

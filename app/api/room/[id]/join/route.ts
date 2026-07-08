import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/game";
import { getRoom, setRoom } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = id.toUpperCase();
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.players.O) {
    return NextResponse.json({ error: "Room is already full" }, { status: 409 });
  }

  const token = generateToken();
  room.players.O = token;
  room.updatedAt = Date.now();
  await setRoom(room);

  return NextResponse.json({ roomId: room.id, player: "O", token });
}

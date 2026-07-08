import { NextResponse } from "next/server";
import { createEmptyBoard, generateId, generateToken } from "@/lib/game";
import { getRoom, setRoom } from "@/lib/store";

export async function POST() {
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
    board: createEmptyBoard(),
    turn: "X",
    players: { X: token, O: null },
    winner: null,
    winningLine: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ roomId: id, player: "X", token });
}

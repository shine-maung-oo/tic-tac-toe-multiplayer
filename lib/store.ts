import { RoomState } from "./game";

// In-memory store. Works great for local development / a single Node.js
// server process (e.g. `npm start` on your own VPS).
//
// IMPORTANT: If you deploy this to a serverless platform that runs multiple
// instances (e.g. Vercel), each instance has its own memory, so two players
// hitting different instances won't see the same room. For that kind of
// deployment, swap this file's Map for a shared store like Vercel KV, Redis,
// Upstash, or a small database — the rest of the app doesn't need to change,
// only the functions below.

declare global {
  // eslint-disable-next-line no-var
  var __ticTacToeRooms: Map<string, RoomState> | undefined;
}

const rooms: Map<string, RoomState> =
  global.__ticTacToeRooms ?? new Map<string, RoomState>();

if (!global.__ticTacToeRooms) {
  global.__ticTacToeRooms = rooms;
}

// Clean up rooms older than 6 hours so memory doesn't grow forever.
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function cleanupOldRooms() {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.updatedAt > MAX_AGE_MS) {
      rooms.delete(id);
    }
  }
}

export function getRoom(id: string): RoomState | undefined {
  cleanupOldRooms();
  return rooms.get(id);
}

export function setRoom(room: RoomState): void {
  rooms.set(room.id, room);
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}

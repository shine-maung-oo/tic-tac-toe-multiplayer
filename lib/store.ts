import { Redis } from "@upstash/redis";
import { RoomState } from "./game";

// Two storage backends:
//
// 1. Upstash Redis (used automatically when UPSTASH_REDIS_REST_URL and
//    UPSTASH_REDIS_REST_TOKEN are set as environment variables). This is a
//    shared store all server instances can see, so it works correctly on
//    Vercel (or any platform that runs multiple serverless instances).
//
// 2. An in-memory Map (fallback for local development when no Redis env
//    vars are set). This only works within a single Node.js process, so it
//    is NOT suitable for most production deployments — but it means you can
//    `npm run dev` locally with zero extra setup.
//
// See README.md for how to set up a free Upstash Redis database.

const ROOM_PREFIX = "ttt:room:";
const MAX_AGE_SECONDS = 6 * 60 * 60; // rooms expire after 6 hours

declare global {
  // eslint-disable-next-line no-var
  var __ticTacToeRooms: Map<string, RoomState> | undefined;
}

const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasRedisConfig ? Redis.fromEnv() : null;

// In-memory fallback store, kept on `global` so it survives Next.js dev-mode
// hot reloads within the same process.
const memoryRooms: Map<string, RoomState> =
  global.__ticTacToeRooms ?? new Map<string, RoomState>();

if (!global.__ticTacToeRooms) {
  global.__ticTacToeRooms = memoryRooms;
}

function cleanupOldMemoryRooms() {
  const now = Date.now();
  for (const [id, room] of memoryRooms.entries()) {
    if (now - room.updatedAt > MAX_AGE_SECONDS * 1000) {
      memoryRooms.delete(id);
    }
  }
}

export async function getRoom(id: string): Promise<RoomState | undefined> {
  if (redis) {
    const room = await redis.get<RoomState>(ROOM_PREFIX + id);
    return room ?? undefined;
  }
  cleanupOldMemoryRooms();
  return memoryRooms.get(id);
}

export async function setRoom(room: RoomState): Promise<void> {
  if (redis) {
    // `ex` sets a TTL in seconds — Redis auto-deletes the key once it's hit,
    // so it self-cleans the same way the in-memory fallback does.
    await redis.set(ROOM_PREFIX + room.id, room, { ex: MAX_AGE_SECONDS });
    return;
  }
  memoryRooms.set(room.id, room);
}

export async function deleteRoom(id: string): Promise<void> {
  if (redis) {
    await redis.del(ROOM_PREFIX + id);
    return;
  }
  memoryRooms.delete(id);
}

export function usingRedis(): boolean {
  return hasRedisConfig;
}

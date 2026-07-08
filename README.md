# Tic Tac Toe — Multiplayer

A real two-device tic-tac-toe game built with Next.js (App Router). One
player creates a room and gets a 5-letter code; the other player enters that
code to join. Moves sync between the two devices by polling a small API
every second — no extra services required.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — that's player one. Click **Start a new game**
to get a room code.

### Playing from a second device

`localhost` only works on the same machine, so for a *second physical
device* (another laptop, or your phone) to join, both devices need to reach
the same server over your network:

1. Find your computer's local IP address (e.g. `192.168.1.42`).
2. Run the dev server so it listens on your network: `next dev -H 0.0.0.0`
   (or edit the `dev` script in `package.json` to add `-H 0.0.0.0`).
3. On the second device (same Wi-Fi), open `http://192.168.1.42:3000`.
4. Enter the room code from the first device and tap **Join**.

For devices on *different* networks (e.g. across the internet), deploy the
app somewhere public — see below — and share that URL instead.

## How it works

- `lib/game.ts` — board logic: win/draw detection, ID/token generation.
- `lib/store.ts` — room storage. Uses Upstash Redis when configured (see
  Deploying section below); otherwise falls back to an in-memory `Map` for
  local development.
- `app/api/room/create` — creates a room, returns a room code + your token.
- `app/api/room/[id]/join` — the second player joins as `O`.
- `app/api/room/[id]` — `GET` returns the current board/turn/winner (this is
  what each browser polls every second).
- `app/api/room/[id]/move` — makes a move (validated: right player, right
  turn, empty cell).
- `app/api/room/[id]/reset` — clears the board for a rematch.
- `app/room/[id]/page.tsx` — the game screen; polls the state endpoint and
  renders the board.

Each browser stores its own `{ player, token }` for a room in
`localStorage`, so only the player who created/joined a room as `X` or `O`
can move as that mark — a bit of protection against someone else guessing
the room code and messing with your game (not high-security, just enough to
stop accidental collisions).

## Deploying so anyone, anywhere can play

You can deploy this to Vercel, Render, Railway, or any Node host.

> **Important:** Vercel (and similar serverless platforms) can run multiple
> instances of your app at once. Player 1's request might hit instance A
> while player 2's hits instance B — and since the original in-memory store
> only lived in one instance's memory, the room would look "not found"
> almost immediately, even seconds after being created. This project now
> uses [Upstash Redis](https://upstash.com) — a shared store every instance
> can see — to fix that.

### Setting up Redis (needed for Vercel / most hosted deployments)

1. Create a free account at [upstash.com](https://upstash.com) and create a
   new Redis database (any region close to your deployment is fine).
2. On the database's page, copy the **REST URL** and **REST Token**.
3. Add them as environment variables:
   - Locally: create a `.env.local` file in the project root with:
     ```
     UPSTASH_REDIS_REST_URL=your-url-here
     UPSTASH_REDIS_REST_TOKEN=your-token-here
     ```
   - On Vercel: Project Settings → Environment Variables → add the same two
     keys, then redeploy.
4. That's it — `lib/store.ts` detects these automatically and switches from
   the in-memory fallback to Redis. No other code changes needed.

**Local development without Redis:** if you don't set those two environment
variables, the app automatically falls back to the in-memory store — fine
for `npm run dev` on your own machine, but not for a multi-instance
deployment.

Rooms self-expire after 6 hours either way (via Redis TTL, or the
in-memory cleanup check).

## Notes / possible next steps

- Swap polling for a WebSocket (e.g. `ws`, Pusher, or Ably) for instant
  moves instead of a ~1 second delay.
- Add a simple "watch only" spectator mode for a 3rd visitor to a room.
- Persist match history per room code.

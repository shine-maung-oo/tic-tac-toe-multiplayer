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
- `lib/store.ts` — an in-memory `Map` holding all active rooms.
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

You can deploy this to Vercel, Render, Railway, or any Node host. One
important caveat:

> **The in-memory store (`lib/store.ts`) only works reliably on a single
> server process.** Platforms like Vercel can run multiple serverless
> instances, so two players might land on different instances and not see
> the same room.
>
> - Easiest fix for Vercel: deploy with a single long-running Node server
>   instead of serverless functions (e.g. `next start` on a small VPS,
>   Render, Railway, or Fly.io — all run one persistent process by default).
> - If you want to stay on Vercel's serverless functions: swap the `Map` in
>   `lib/store.ts` for a shared store like [Vercel KV](https://vercel.com/docs/storage/vercel-kv),
>   Upstash Redis, or a small database. Only that one file needs to change —
>   every API route just calls `getRoom`/`setRoom`/`deleteRoom`.

Rooms are also automatically cleared out after 6 hours to keep memory tidy.

## Notes / possible next steps

- Swap polling for a WebSocket (e.g. `ws`, Pusher, or Ably) for instant
  moves instead of a ~1 second delay.
- Add a simple "watch only" spectator mode for a 3rd visitor to a room.
- Persist match history per room code.

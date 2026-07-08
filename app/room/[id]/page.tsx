"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Cell, Mark } from "@/lib/game";

interface RoomView {
  id: string;
  board: Cell[];
  turn: Mark;
  winner: Mark | "draw" | null;
  winningLine: number[] | null;
  hasX: boolean;
  hasO: boolean;
}

interface Session {
  player: Mark;
  token: string;
}

const POLL_MS = 1000;

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = String(params.id).toUpperCase();

  const [session, setSession] = useState<Session | null>(null);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load this browser's session (player + token) for this room.
  useEffect(() => {
    const raw = localStorage.getItem(`ttt:${roomId}`);
    if (raw) {
      setSession(JSON.parse(raw));
    }
  }, [roomId]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setRoom(data);
    } catch {
      // transient network hiccup during polling — ignore and retry next tick
    }
  }, [roomId]);

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchState]);

  async function handleJoinAsSpectatorSelf() {
    // Someone opened the link without creating/joining first (e.g. shared URL).
    try {
      const res = await fetch(`/api/room/${roomId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not join this room");
        return;
      }
      const s = { player: data.player, token: data.token };
      localStorage.setItem(`ttt:${roomId}`, JSON.stringify(s));
      setSession(s);
    } catch {
      setError("Could not join this room");
    }
  }

  async function handleCellClick(index: number) {
    if (!session || !room) return;
    if (room.winner) return;
    if (room.board[index] !== null) return;
    if (room.turn !== session.player) return;

    setError(null);
    try {
      const res = await fetch(`/api/room/${roomId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.token, index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "That move didn't go through");
        return;
      }
      setRoom(data);
    } catch {
      setError("That move didn't go through");
    }
  }

  async function handleRematch() {
    if (!session) return;
    try {
      const res = await fetch(`/api/room/${roomId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.token }),
      });
      const data = await res.json();
      if (res.ok) setRoom(data);
    } catch {
      // ignore; next poll will resync
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (notFound) {
    return (
      <CenteredMessage
        title="This board doesn't exist"
        subtitle="The room may have expired, or the code was typed wrong."
        action={{ label: "Back to start", onClick: () => router.push("/") }}
      />
    );
  }

  if (!room) {
    return <CenteredMessage title="Wiping the board clean…" subtitle="" />;
  }

  if (!session) {
    return (
      <CenteredMessage
        title="Join this game?"
        subtitle={`Room ${roomId} is waiting for a second player.`}
        action={{ label: "Take the open seat", onClick: handleJoinAsSpectatorSelf }}
      />
    );
  }

  const isMyTurn = room.turn === session.player && !room.winner;
  const waitingForOpponent = session.player === "X" ? !room.hasO : !room.hasX;

  let statusText: string;
  if (room.winner === "draw") {
    statusText = "It's a draw.";
  } else if (room.winner) {
    statusText = room.winner === session.player ? "You won! 🎉" : "You lost this one.";
  } else if (waitingForOpponent) {
    statusText = "Waiting for the other player to join…";
  } else if (isMyTurn) {
    statusText = "Your move";
  } else {
    statusText = `Waiting on ${room.turn}…`;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <h1 className="chalk-font" style={{ fontSize: "1.8rem", margin: 0 }}>
          room <span style={{ color: "var(--chalk-yellow)" }}>{roomId}</span>
        </h1>
        <button
          onClick={handleCopyCode}
          style={{
            border: "1px solid rgba(241,239,228,0.25)",
            background: "transparent",
            color: "var(--chalk-white)",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: "0.8rem",
          }}
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: "0.9rem",
          color: "rgba(241,239,228,0.6)",
        }}
      >
        <span style={{ color: session.player === "X" ? "var(--chalk-yellow)" : undefined }}>
          You are {session.player}
        </span>
        <span>·</span>
        <span>{room.hasX && room.hasO ? "Both players present" : "Waiting for opponent"}</span>
      </div>

      <Board
        board={room.board}
        winningLine={room.winningLine}
        onCellClick={handleCellClick}
        interactive={isMyTurn && !waitingForOpponent}
      />

      <p
        className="chalk-font"
        style={{
          fontSize: "1.4rem",
          margin: 0,
          minHeight: "1.4em",
          color: room.winner && room.winner !== "draw"
            ? (room.winner === session.player ? "var(--chalk-yellow)" : "var(--chalk-rose)")
            : "var(--chalk-white)",
        }}
      >
        {statusText}
      </p>

      {error && (
        <p role="alert" style={{ color: "var(--chalk-rose)", margin: 0, fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {room.winner && (
        <button
          onClick={handleRematch}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: "var(--chalk-yellow)",
            color: "#2a2115",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Rematch
        </button>
      )}
    </main>
  );
}

function Board({
  board,
  winningLine,
  onCellClick,
  interactive,
}: {
  board: Cell[];
  winningLine: number[] | null;
  onCellClick: (i: number) => void;
  interactive: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "min(90vw, 340px)",
        height: "min(90vw, 340px)",
        background: "var(--board-slate-light)",
        borderRadius: 16,
        border: "1px solid rgba(241,239,228,0.12)",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.3)",
        padding: 14,
      }}
    >
      <svg viewBox="0 0 300 300" style={{ position: "absolute", inset: 14 }} aria-hidden>
        {/* hand-drawn-feeling grid lines */}
        <path
          d="M 100 12 C 98 90, 102 200, 99 288"
          stroke="var(--chalk-white)"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 200 10 C 202 100, 198 190, 201 290"
          stroke="var(--chalk-white)"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 12 100 C 100 98, 200 102, 288 99"
          stroke="var(--chalk-white)"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 10 200 C 100 202, 190 198, 290 201"
          stroke="var(--chalk-white)"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {winningLine && <WinLine indices={winningLine} />}
      </svg>

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          width: "100%",
          height: "100%",
        }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => onCellClick(i)}
            disabled={!interactive || cell !== null}
            aria-label={cell ? `Cell ${i + 1}: ${cell}` : `Cell ${i + 1}: empty`}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: interactive && !cell ? "pointer" : "default",
            }}
          >
            {cell === "X" && <XMark />}
            {cell === "O" && <OMark />}
          </button>
        ))}
      </div>
    </div>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 60 60" width="58%" height="58%">
      <path
        d="M 8 8 L 52 52"
        stroke="var(--chalk-yellow)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: 70,
          strokeDashoffset: 70,
          animation: "draw 260ms ease-out forwards",
        }}
      />
      <path
        d="M 52 8 L 8 52"
        stroke="var(--chalk-yellow)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: 70,
          strokeDashoffset: 70,
          animation: "draw 260ms ease-out 120ms forwards",
        }}
      />
      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

function OMark() {
  return (
    <svg viewBox="0 0 60 60" width="58%" height="58%">
      <circle
        cx="30"
        cy="30"
        r="22"
        stroke="var(--chalk-rose)"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray: 140,
          strokeDashoffset: 140,
          animation: "draw-circle 320ms ease-out forwards",
        }}
      />
      <style>{`@keyframes draw-circle { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

const LINE_COORDS: Record<string, [number, number, number, number]> = {
  "0,1,2": [10, 50, 290, 50],
  "3,4,5": [10, 150, 290, 150],
  "6,7,8": [10, 250, 290, 250],
  "0,3,6": [50, 10, 50, 290],
  "1,4,7": [150, 10, 150, 290],
  "2,5,8": [250, 10, 250, 290],
  "0,4,8": [16, 16, 284, 284],
  "2,4,6": [284, 16, 16, 284],
};

function WinLine({ indices }: { indices: number[] }) {
  const key = indices.join(",");
  const coords = LINE_COORDS[key];
  if (!coords) return null;
  const [x1, y1, x2, y2] = coords;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--chalk-yellow)"
      strokeWidth="6"
      strokeLinecap="round"
      style={{
        strokeDasharray: 320,
        strokeDashoffset: 320,
        animation: "draw-win 400ms ease-out forwards",
      }}
    >
      <animate attributeName="stroke-dashoffset" from="320" to="0" dur="0.4s" fill="freeze" />
    </line>
  );
}

function CenteredMessage({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 className="chalk-font" style={{ fontSize: "2rem", margin: 0 }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: "rgba(241,239,228,0.6)", margin: 0 }}>{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 8,
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: "var(--chalk-yellow)",
            color: "#2a2115",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          {action.label}
        </button>
      )}
    </main>
  );
}

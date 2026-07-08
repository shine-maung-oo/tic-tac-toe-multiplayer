"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading("create");
    setError(null);
    try {
      const res = await fetch("/api/room/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create a room");
      localStorage.setItem(
        `ttt:${data.roomId}`,
        JSON.stringify({ player: data.player, token: data.token })
      );
      router.push(`/room/${data.roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Type in the room code first");
      return;
    }
    setLoading("join");
    setError(null);
    try {
      const res = await fetch(`/api/room/${code}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join that room");
      localStorage.setItem(
        `ttt:${data.roomId}`,
        JSON.stringify({ player: data.player, token: data.token })
      );
      router.push(`/room/${data.roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--board-slate-light)",
          border: "1px solid rgba(241,239,228,0.12)",
          borderRadius: 18,
          padding: "40px 32px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
          position: "relative",
        }}
      >
        {/* chalk tray shadow accent */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: -6,
            height: 10,
            background: "rgba(0,0,0,0.25)",
            filter: "blur(6px)",
            borderRadius: "50%",
          }}
        />

        <h1
          className="chalk-font"
          style={{
            fontSize: "clamp(2.4rem, 6vw, 3.2rem)",
            textAlign: "center",
            margin: "0 0 4px",
            color: "var(--chalk-white)",
          }}
        >
          tic <span style={{ color: "var(--chalk-yellow)" }}>tac</span> toe
        </h1>
        <p
          style={{
            textAlign: "center",
            margin: "0 0 32px",
            color: "rgba(241,239,228,0.6)",
            fontSize: "0.95rem",
          }}
        >
          Two devices, one board. Pass the code, take the desk.
        </p>

        <button
          onClick={handleCreate}
          disabled={loading !== null}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 10,
            border: "none",
            background: "var(--chalk-yellow)",
            color: "#2a2115",
            fontWeight: 600,
            fontSize: "1rem",
            marginBottom: 14,
            opacity: loading === "create" ? 0.7 : 1,
          }}
        >
          {loading === "create" ? "Setting up the board…" : "Start a new game"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "18px 0",
            color: "rgba(241,239,228,0.4)",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(241,239,228,0.15)" }} />
          or join a friend
          <div style={{ flex: 1, height: 1, background: "rgba(241,239,228,0.15)" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ROOM CODE"
            maxLength={5}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid rgba(241,239,228,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "var(--chalk-white)",
              fontSize: "1rem",
              letterSpacing: "0.15em",
              textAlign: "center",
            }}
          />
          <button
            onClick={handleJoin}
            disabled={loading !== null}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              border: "1px solid var(--chalk-rose)",
              background: "transparent",
              color: "var(--chalk-rose)",
              fontWeight: 600,
              opacity: loading === "join" ? 0.7 : 1,
            }}
          >
            {loading === "join" ? "…" : "Join"}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              color: "var(--chalk-rose)",
              textAlign: "center",
              marginTop: 18,
              marginBottom: 0,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";

/* ─── Brand Tokens ───────────────────────────────────────────────────────── */
const t = {
  navy:     "#0B1120",
  indigo:   "#4F6EF7",
  indigoBg: "#EEF1FF",
  surface:  "#FFFFFF",
  bg:       "#F4F6FB",
  border:   "#E4E7F0",
  text:     "#1A2236",
  textSoft: "#4B5568",
  muted:    "#8A94A6",
  success:  "#10B981",
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getInitial = (sender) =>
  sender ? sender.substring(0, 1).toUpperCase() : "?";

const WorkspaceChat = () => {
  const { workspaceId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const response = await api.get(`workspaces/${workspaceId}/messages/`);
      const normalizedHistory = response.data.map((msg) => ({
        message: msg.content || msg.message,
        sender: msg.sender || msg.user_email || msg.user,
        timestamp: msg.timestamp,
      }));
      setMessages(normalizedHistory);
    } catch (err) {
      console.error("❌ History fetch error:", err);
    }
  }, [workspaceId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!workspaceId) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/ws/chat/${workspaceId}/`;
    console.log(`🔌 Connecting to: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    socket.onopen = () => console.log("WebSocket Connected");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, {
        message: data.message,
        sender: data.sender,
        timestamp: new Date().toISOString(),
      }]);
    };
    socket.onclose = (e) => console.log(`❌ WebSocket Closed: ${e.code}`);
    socket.onerror = (err) => console.error("WebSocket Error:", err);
    return () => socket.close();
  }, [workspaceId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: input.trim(), sender: user?.email }));
      setInput("");
    }
  };

  return (
    <div style={{
      height: "85vh", display: "flex", flexDirection: "column",
      borderRadius: 16, overflow: "hidden",
      background: t.surface, border: `1px solid ${t.border}`,
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .chat-input:focus { outline: none; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn:not(:disabled):hover { background: #3D5CE8 !important; transform: scale(1.04); }
        .msg-bubble-me:hover .msg-time,
        .msg-bubble-other:hover .msg-time { opacity: 1 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: t.navy, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(79,110,247,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "#fff", letterSpacing: "-0.2px" }}>
              Workspace Chat
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
              #{workspaceId}
            </p>
          </div>
        </div>
        {/* Live badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: t.success,
            boxShadow: `0 0 6px ${t.success}`,
          }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: t.success }}>Live</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 20px 12px",
        background: t.bg, display: "flex", flexDirection: "column", gap: 4,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
            color: t.muted, paddingBottom: 40,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 13,
              background: t.indigoBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.indigo} strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.textSoft }}>No messages yet</p>
            <p style={{ margin: 0, fontSize: 12.5, color: t.muted }}>Send a message to start the conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender === user?.email;
          const showSender = !isMe && (i === 0 || messages[i - 1]?.sender !== msg.sender);

          return (
            <div key={`${i}-${msg.timestamp}`} style={{
              display: "flex", flexDirection: "column",
              alignItems: isMe ? "flex-end" : "flex-start",
              marginBottom: 6,
            }}>
              {/* Sender label */}
              {showSender && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, marginLeft: 2 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: t.indigo + "22", color: t.indigo,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                  }}>{getInitial(msg.sender)}</div>
                  <span style={{ fontSize: 11.5, color: t.muted, fontWeight: 500 }}>{msg.sender}</span>
                </div>
              )}

              {/* Bubble + time */}
              <div className={isMe ? "msg-bubble-me" : "msg-bubble-other"} style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                <div style={{
                  maxWidth: "68%",
                  padding: "9px 14px",
                  borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isMe ? t.indigo : t.surface,
                  color: isMe ? "#fff" : t.text,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  border: isMe ? "none" : `1px solid ${t.border}`,
                  boxShadow: isMe ? "0 2px 8px rgba(79,110,247,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
                  wordBreak: "break-word",
                }}>
                  {msg.message}
                </div>
                {/* Timestamp */}
                <span className="msg-time" style={{
                  fontSize: 10.5, color: t.muted, fontWeight: 500,
                  whiteSpace: "nowrap", paddingBottom: 2,
                  opacity: 0.7, transition: "opacity .15s",
                }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ── Input ── */}
      <form onSubmit={sendMessage} style={{
        padding: "12px 16px",
        background: t.surface,
        borderTop: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: t.bg, borderRadius: 24,
          border: `1.5px solid ${focused ? t.indigo : t.border}`,
          boxShadow: focused ? `0 0 0 3px ${t.indigoBg}` : "none",
          transition: "border-color .15s, box-shadow .15s",
          padding: "2px 6px 2px 16px",
        }}>
          <input
            className="chat-input"
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13.5, color: t.text, padding: "9px 0",
              fontFamily: "'DM Sans', sans-serif",
            }}
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>

        <button
          type="submit"
          className="send-btn"
          disabled={!input.trim()}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: t.indigo, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
            transition: "background .15s, transform .1s",
            boxShadow: "0 2px 10px rgba(79,110,247,0.35)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default WorkspaceChat;
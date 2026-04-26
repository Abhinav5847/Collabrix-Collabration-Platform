import React, { useState, useEffect, useRef } from "react";

const CollabrixChat = ({ docId = "1", workspaceId = "1" }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // --- THE CRITICAL FIX ---
  // We now point to the Nginx Gateway (Port 80) 
  // Nginx handles the /ai/ prefix and forwards it to port 8001 internally.
  const GATEWAY_URL = "http://localhost/ai";

  // 1. Load History on Mount
  useEffect(() => {
    const loadSavedHistory = async () => {
      if (!docId) return;
      try {
        const res = await fetch(`${GATEWAY_URL}/chat/history/${docId}`);
        if (res.ok) {
          const data = await res.json();
          const formattedMessages = data.history.map(item => ({
            role: item.role,
            content: item.content
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("History Load Error:", err);
      }
    };

    loadSavedHistory();
  }, [docId]);

  // 2. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Send Message Logic
  const sendMessage = async (e) => {
    e?.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    setInput("");
    const newUserMessage = { role: "user", content: userMsg };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`${GATEWAY_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          workspace_id: String(workspaceId),
          doc_id: String(docId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server Error: ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data?.response || "I processed the request but have no response." }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `⚠️ ${err.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      sendMessage(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f5f4f0", borderRadius: "12px", border: "1px solid #ddd", overflow: "hidden" }}>
      {/* HEADER */}
      <div style={{ background: "#1a1a1a", padding: "12px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: "14px" }}>Collabrix AI Chat</span>
        <span style={{ fontSize: "10px", opacity: 0.6 }}>Doc: {docId}</span>
      </div>

      {/* CHAT WINDOW */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && !isLoading && (
          <div style={{ margin: "auto", color: "#999", textAlign: "center", fontSize: "13px" }}>
            Ask anything about this document...
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%",
              padding: "10px 14px",
              borderRadius: "15px",
              background: msg.role === "user" ? "#000" : "#fff",
              color: msg.role === "user" ? "#fff" : "#000",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              fontSize: "14px",
              lineHeight: "1.5",
              border: msg.role === "ai" ? "1px solid #eee" : "none"
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ color: "#777", fontSize: "12px", fontStyle: "italic", paddingLeft: "5px" }}>
            Thinking...
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: "15px", background: "#fff", borderTop: "1px solid #ddd" }}>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px" }}>
          <input
            style={{ flex: 1, padding: "10px 15px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", fontSize: "14px" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "0 20px",
              background: isLoading || !input.trim() ? "#ccc" : "#000",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollabrixChat;
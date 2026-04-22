import React, { useState, useEffect, useRef } from "react";

const CollabrixChat = ({ docId = "1", workspaceId = "1" }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef(null);

  // --- 1. FETCH ACTUAL HISTORY FROM DYNAMODB ON MOUNT ---
  useEffect(() => {
    const loadSavedHistory = async () => {
      try {
        // This hits the NEW GET endpoint we added to chat.py
        const res = await fetch(`http://localhost:8001/ai/chat/history/${docId}`);
        if (res.ok) {
          const data = await res.json();
          
          // Map DynamoDB items (role/content) to the UI state
          const formattedMessages = data.history.map(item => ({
            role: item.role,
            content: item.content
          }));
          
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("Could not load previous messages:", err);
      }
    };

    if (docId) {
      loadSavedHistory();
    }
  }, [docId]);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageToBackend = async (payload) => {
    const res = await fetch("http://localhost:8001/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }

    return res.json();
  };

  const sendMessage = async (e) => {
    e?.preventDefault();

    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    setInput("");

    const newUserMessage = {
      role: "user",
      content: userMsg,
    };

    // Update UI immediately with the user's message
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const payload = {
        message: userMsg,
        workspace_id: String(workspaceId),
        doc_id: String(docId),
        // History is handled by the backend now, so we keep the payload light
      };

      const data = await sendMessageToBackend(payload);

      const aiMessage = {
        role: "ai",
        content: data?.response || "I processed the document but have no response.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `⚠️ ${err.message}`,
        },
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif", background: "#f5f4f0" }}>
      {/* HEADER */}
      <div style={{ background: "#1a1a1a", padding: "14px 20px", display: "flex", alignItems: "center", color: "#fff" }}>
        <div style={{ fontWeight: "bold" }}>Collabrix AI Chat</div>
        <div style={{ marginLeft: "auto", fontSize: 11, opacity: 0.7 }}>
          Workspace: {workspaceId} | Doc: {docId}
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && !isLoading && (
          <div style={{ margin: "auto", color: "#888", textAlign: "center", maxWidth: "250px" }}>
            Ask anything about this document. Your history is saved automatically.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: "15px",
                borderBottomRightRadius: msg.role === "user" ? "2px" : "15px",
                borderBottomLeftRadius: msg.role === "ai" ? "2px" : "15px",
                background: msg.role === "user" ? "#007AFF" : "#fff",
                color: msg.role === "user" ? "#fff" : "#000",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ padding: "10px", color: "#777", fontSize: "13px", fontStyle: "italic" }}>
            Thinking...
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: "16px", borderTop: "1px solid #ddd", background: "#fff", display: "flex", gap: 10 }}>
        <input
          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about requirements, summaries..."
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "0 20px",
            background: isLoading || !input.trim() ? "#ccc" : "#000",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CollabrixChat;
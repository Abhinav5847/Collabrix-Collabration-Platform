import React, { useState, useEffect, useRef } from "react";
import { aiApi } from "../../services/aiApi"; 

const CollabrixChat = ({ docId, workspaceId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef(null);

  // 1. Sync with the new backend route: /ai/history/{doc_id}
  useEffect(() => {
    const loadSavedHistory = async () => {
      if (!docId) return;
      try {
        setHistoryLoading(true);
        // Note: baseURL is already /ai/, so we just call 'history/{id}'
        const res = await aiApi.get(`history/${docId}`);
        if (res.data?.history) {
          // Slice to the last 10 messages to keep the UI light
          const recent = res.data.history.slice(-10).map(item => ({
            role: item.role,
            content: item.content
          }));
          setMessages(recent);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadSavedHistory();
  }, [docId]);

  // 2. Optimized Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 3. Send Message Logic
  const sendMessage = async (e) => {
    e?.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      // Calling /ai/chat
      const res = await aiApi.post("chat", {
        message: userMsg,
        workspace_id: String(workspaceId),
        doc_id: String(docId),
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: res.data?.response || "I couldn't process that." }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `⚠️ Error: ${err.response?.data?.detail || "Service Unavailable"}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", flexDirection: "column", height: "100%", 
      width: "100%", background: "#fdfdfd", borderLeft: "1px solid #eee" 
    }}>
      {/* HEADER */}
      <div style={{ 
        background: "#ffffff", padding: "12px 20px", color: "#000", 
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #eee"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", background: "#10a37f", borderRadius: "50%" }}></div>
          <span style={{ fontWeight: "700", fontSize: "14px" }}>AI ASSISTANT</span>
        </div>
        <span style={{ fontSize: "10px", color: "#999", fontWeight: "600" }}>ID: {docId}</span>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {historyLoading ? (
            <div style={{ margin: "auto", fontSize: "12px", color: "#999" }}>Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", color: "#ccc" }}>
            <p style={{ fontSize: "12px" }}>Ask a question about this doc</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: "12px",
                background: msg.role === "user" ? "#007bff" : "#f1f1f1",
                color: msg.role === "user" ? "#fff" : "#222",
                fontSize: "13.5px",
                lineHeight: "1.5",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{ display: "flex", gap: "4px", padding: "8px" }}>
             <span className="ai-typing" style={{ color: "#007bff", fontSize: "11px", fontWeight: "bold" }}>AI is analyzing...</span>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <div style={{ padding: "16px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px" }}>
          <input
            style={{ 
              flex: 1, padding: "10px 14px", background: "#f8f9fa", 
              border: "1px solid #e9ecef", borderRadius: "8px", outline: "none", fontSize: "13px" 
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "0 16px",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              opacity: (isLoading || !input.trim()) ? 0.4 : 1
            }}
          >
            →
          </button>
        </form>
      </div>
      <style>{`
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        .ai-typing { animation: pulse 1s infinite; }
      `}</style>
    </div>
  );
};

export default CollabrixChat;
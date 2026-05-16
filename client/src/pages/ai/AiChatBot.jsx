import React, { useState, useEffect, useRef } from "react";
import { aiApi } from "../../services/aiApi";

const CollabrixChat = ({ docId, workspaceId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef(null);

  // Sync historic RAG transactions
  useEffect(() => {
    const loadSavedHistory = async () => {
      if (!docId || !userId) return;
      try {
        setHistoryLoading(true);
        const res = await aiApi.get(`history/${docId}`, {
          params: { user_id: userId }
        });
        if (res.data?.history) {
          const recent = res.data.history.slice(-10).map(item => ({
            role: item.role,
            text: item.content // Normalized identifier matching layout template
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
  }, [docId, userId]);

  // Auto-scroller anchor
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await aiApi.post("chat", {
        message: userMsg,
        workspace_id: String(workspaceId),
        doc_id: String(docId),
        user_id: String(userId)
      });
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data?.response || "I couldn't process that." }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `⚠️ Error: ${err.response?.data?.detail || "Service Unavailable"}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cc-root">
      {/* HEADER */}
      <div className="cc-header">
        <div className="cc-header-left">
          <div className="cc-status-dot" />
          <span className="cc-label">AI Assistant</span>
        </div>
        <span className="cc-doc-id">#{docId}</span>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="cc-messages">
        {historyLoading ? (
          <div className="cc-center-state">
            <div className="cc-loading-dots">
              <span /><span /><span />
            </div>
            <p>Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="cc-center-state">
            <div className="cc-empty-icon">✦</div>
            <p>Ask anything about this document</p>
            <span className="cc-powered-tag">Collabrix RAG · Powered by AI</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`cc-bubble-row ${msg.role === "user" ? "cc-bubble-row--user" : ""}`}>
              {msg.role === "ai" && (
                <div className="cc-avatar">✦</div>
              )}
              <div className={`cc-bubble ${msg.role === "user" ? "cc-bubble--user" : "cc-bubble--ai"}`}>
                {msg.text}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="cc-bubble-row">
            <div className="cc-avatar">✦</div>
            <div className="cc-bubble cc-bubble--ai cc-bubble--thinking">
              <span className="cc-dot cc-dot-1" />
              <span className="cc-dot cc-dot-2" />
              <span className="cc-dot cc-dot-3" />
            </div>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <div className="cc-footer">
        <form onSubmit={sendMessage} className="cc-form">
          <input
            className="cc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="cc-send"
            disabled={isLoading || !input.trim()}
          >
            →
          </button>
        </form>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .cc-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #ffffff;
          font-family: 'DM Sans', sans-serif;
          border-left: 1px solid #e8e6e0;
          overflow: hidden;
        }

        .cc-header {
          height: 48px;
          padding: 0 40px 0 14px; /* Space added for parent close button alignment */
          background: #faf9f7;
          border-bottom: 1px solid #f0ede8;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .cc-header-left { display: flex; align-items: center; gap: 7px; }
        .cc-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #1d9e75; box-shadow: 0 0 0 2px #e1f5ee; flex-shrink: 0; }
        .cc-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #1a1a1a; }
        .cc-doc-id { font-size: 10px; color: #c5c1b9; font-family: monospace; background: #f0ede8; padding: 2px 8px; border-radius: 20px; margin-right: auto; margin-left: 10px; }

        .cc-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #faf9f7; }
        .cc-messages::-webkit-scrollbar { width: 4px; }
        .cc-messages::-webkit-scrollbar-thumb { background: #e0ddd5; border-radius: 2px; }

        .cc-center-state { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; color: #c5c1b9; text-align: center; }
        .cc-empty-icon { font-size: 24px; color: #ccc9c2; }
        .cc-center-state p { font-size: 13px; color: #9e9a93; font-weight: 500; }
        .cc-powered-tag { font-size: 11px; color: #c5c1b9; background: #f0ede8; padding: 3px 10px; border-radius: 20px; }

        .cc-bubble-row { display: flex; align-items: flex-end; gap: 7px; }
        .cc-bubble-row--user { flex-direction: row-reverse; }

        .cc-avatar { width: 22px; height: 22px; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; font-size: 10px; }
        .cc-bubble { max-width: 82%; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.6; word-break: break-word; }
        .cc-bubble--ai { background: #ffffff; border: 1px solid #e8e6e0; color: #2d2d2d; border-bottom-left-radius: 4px; }
        .cc-bubble--user { background: #1a1a1a; color: #f0ede8; border-bottom-right-radius: 4px; }
        
        .cc-bubble--thinking { display: flex; align-items: center; gap: 5px; padding: 12px 18px; }
        .cc-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #c5c1b9; animation: ccBounce 1.2s infinite ease-in-out; }
        .cc-dot-2 { animation-delay: 0.2s; }
        .cc-dot-3 { animation-delay: 0.4s; }
        @keyframes ccBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }

        .cc-footer { padding: 12px 14px; border-top: 1px solid #f0ede8; background: #ffffff; }
        .cc-form { display: flex; gap: 8px; align-items: center; }
        .cc-input { flex: 1; border: 1px solid #e8e6e0; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; background: #faf9f7; color: #1a1a1a; outline: none; transition: border-color 0.15s, background 0.15s; }
        .cc-input:focus { border-color: #1a1a1a; background: #ffffff; }
        .cc-send { width: 34px; height: 34px; border-radius: 8px; border: none; background: #1a1a1a; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s, transform 0.1s; }
        .cc-send:hover:not(:disabled) { background: #333; }
        .cc-send:active:not(:disabled) { transform: scale(0.93); }
        .cc-send:disabled { opacity: 0.35; cursor: not-allowed; }
        
        .cc-loading-dots span { display: inline-block; width: 8px; height: 8px; margin: 0 3px; background: #9e9a93; border-radius: 50%; animation: ccBounce 1.2s infinite white; }
      `}</style>
    </div>
  );
};

export default CollabrixChat;
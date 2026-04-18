import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";

const WorkspaceChat = () => {
  const { workspaceId } = useParams();
  const { token, user } = useSelector((state) => state.auth);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const socketRef = useRef(null);
  const scrollRef = useRef(null);


  const fetchHistory = useCallback(async () => {
    if (!workspaceId || !token || loadingHistory) return;
    
    setLoadingHistory(true);
    try {
      const response = await axios.get(
        `http://localhost/workspaces/${workspaceId}/messages/`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (err) {
      console.error("❌ History fetch error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [workspaceId, token]);


  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // WebSocket Connection
  useEffect(() => {
    if (!workspaceId || !token) return;

    const wsUrl = `ws://localhost/ws/chat/${workspaceId}/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    socket.onopen = () => console.log("Chat Connected");
    socket.onclose = () => console.log("Chat Disconnected");

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [workspaceId, token]);

  // 4. Auto-Scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: input }));
      setInput("");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm" style={{ height: "80vh" }}>
        <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
          <span>Collabrix Chat (ID: {workspaceId})</span>
          {loadingHistory && <span className="spinner-border spinner-border-sm"></span>}
        </div>

        <div className="card-body overflow-auto bg-light d-flex flex-column p-3">
          {messages.map((msg, index) => {
            const isMe = user && msg.sender === user.email;
            return (
              <div key={msg.id || index} className={`mb-3 d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}>
                <small className="text-muted px-2" style={{ fontSize: '0.7rem' }}>
                  {msg.sender} {isMe ? "(You)" : ""}
                </small>
                <div className={`p-3 rounded-3 shadow-sm ${isMe ? "bg-primary text-white" : "bg-white border text-dark"}`} style={{ maxWidth: "80%" }}>
                  {msg.message}
                </div>
                {msg.timestamp && (
                  <small className="text-muted mt-1" style={{ fontSize: '0.6rem' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                )}
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="card-footer bg-white p-3">
          <form onSubmit={sendMessage} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Write a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loadingHistory}
            />
            <button type="submit" className="btn btn-primary px-4" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceChat;
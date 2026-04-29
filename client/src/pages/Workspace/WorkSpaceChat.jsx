import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { api } from "../../services/api"; 

const WorkspaceChat = () => {
    const { workspaceId } = useParams();
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const socketRef = useRef(null);
    const scrollRef = useRef(null);

    // 1. Fetch History from Database (Persistent Storage)
    const fetchHistory = useCallback(async () => {
        if (!workspaceId) return;
        try {
            const response = await api.get(`workspaces/${workspaceId}/messages/`);
            
            // Normalize history: maps backend 'content' or 'message' to local 'message'
            const normalizedHistory = response.data.map(msg => ({
                message: msg.content || msg.message, 
                sender: msg.sender || msg.user_email || msg.user, 
                timestamp: msg.timestamp
            }));
            
            setMessages(normalizedHistory);
        } catch (err) {
            console.error("❌ History fetch error:", err);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // 2. Auto-Scroll to Bottom on new messages
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 3. WebSocket Connection (Live Communication)
    useEffect(() => {
        if (!workspaceId) return;

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = window.location.host;
        const wsUrl = `${protocol}://${host}/ws/chat/${workspaceId}/`;
        
        console.log(`🔌 Connecting to: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => console.log("✅ WebSocket Connected");

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Map incoming live data to our message structure
            const newMessage = {
                message: data.message,
                sender: data.sender,
                timestamp: new Date().toISOString()
            };

            setMessages((prev) => [...prev, newMessage]);
        };

        socket.onclose = (e) => console.log(`❌ WebSocket Closed: ${e.code}`);
        socket.onerror = (err) => console.error("⚠️ WebSocket Error:", err);

        return () => socket.close();
    }, [workspaceId]);

    // 4. Send Message via WebSocket
    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
            const payload = { 
                message: input.trim(),
                sender: user?.email 
            };
            
            socketRef.current.send(JSON.stringify(payload));
            setInput("");
        }
    };

    return (
        <div className="card shadow-sm border-0" style={{ height: "85vh", display: 'flex', flexDirection: 'column', borderRadius: "12px" }}>
            {/* Header */}
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                <h6 className="mb-0 fw-bold">Workspace Chat #{workspaceId}</h6>
                <span className="badge rounded-pill bg-success px-3">Live</span>
            </div>

            {/* Chat Area */}
            <div className="card-body overflow-auto p-4" style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
                {messages.length === 0 && (
                    <div className="text-center mt-5 text-muted">
                        <p>No messages yet. Send a message to start the conversation!</p>
                    </div>
                )}
                
                {messages.map((msg, i) => {
                    const isMe = msg.sender === user?.email;
                    
                    return (
                        <div key={`${i}-${msg.timestamp}`} className={`mb-3 d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}>
                            <small className="text-muted mb-1 px-2" style={{ fontSize: '0.7rem' }}>
                                {isMe ? "You" : msg.sender}
                            </small>
                            <div 
                                className={`p-2 px-3 shadow-sm`} 
                                style={{ 
                                    maxWidth: "75%", 
                                    backgroundColor: isMe ? "#007bff" : "#ffffff", 
                                    color: isMe ? "#fff" : "#212529",
                                    borderRadius: isMe ? "18px 18px 0 18px" : "18px 18px 18px 0",
                                    border: isMe ? "none" : "1px solid #e0e0e0"
                                }}
                            >
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="card-footer bg-white p-3 border-top d-flex gap-2">
                <input 
                    className="form-control border-0 bg-light py-2" 
                    placeholder="Type your message..."
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    style={{ borderRadius: "20px" }}
                />
                <button 
                    type="submit" 
                    className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" 
                    disabled={!input.trim()}
                    style={{ width: "45px", height: "45px" }}
                >
                    <i className="bi bi-send-fill">➤</i>
                </button>
            </form>
        </div>
    );
};

export default WorkspaceChat;
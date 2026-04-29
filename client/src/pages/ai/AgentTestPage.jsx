import React, { useState, useEffect, useRef } from 'react';

const AgentTestPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Generates a stable thread ID for the session
    const [threadId, setThreadId] = useState(`thread-${Math.floor(1000 + Math.random() * 9000)}`);
    const [userId] = useState(1);
    const scrollRef = useRef(null);

    // Gateway points to your Nginx/FastAPI setup
    const AGENT_GATEWAY_URL = "http://localhost/ai/agent";

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(AGENT_GATEWAY_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: currentInput,
                    thread_id: String(threadId),
                    user_id: userId
                }),
            });

            // Handle potential non-JSON (like Nginx 502/504 errors)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Server returned status ${response.status}. Check backend logs.`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.error || "Agent failed to process request.");
            }

            // Extract the actual text response from the data
            const aiResponse = data.response || data.output || "Agent completed the task, but returned no text.";

            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: aiResponse 
            }]);

        } catch (err) {
            console.error("Agent UI Error:", err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `⚠️ Error: ${err.message}` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetChat = () => {
        setMessages([]);
        setThreadId(`thread-${Date.now()}`);
    };

    return (
        <div className="container-fluid vh-100 d-flex flex-column bg-light p-0" style={{ fontFamily: 'inter, system-ui, sans-serif' }}>
            {/* Navbar */}
            <div className="d-flex justify-content-between align-items-center p-3 bg-white border-bottom shadow-sm">
                <div>
                    <h5 className="mb-0 text-primary fw-bold">Collabrix Global Agent</h5>
                    <div className="d-flex align-items-center">
                        <span className="badge bg-success-subtle text-success me-2" style={{fontSize: '0.65rem'}}>STABLE</span>
                        <small className="text-muted font-monospace" style={{fontSize: '0.75rem'}}>ID: {threadId}</small>
                    </div>
                </div>
                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={resetChat}>
                    Clear Chat
                </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-grow-1 overflow-auto p-4" style={{ background: '#f8f9fa' }}>
                <div className="mx-auto" style={{ maxWidth: '850px' }}>
                    {messages.length === 0 && (
                        <div className="text-center mt-5 py-5 border rounded-4 bg-white shadow-sm">
                            <div className="display-5 mb-3">🤖</div>
                            <h5 className="text-dark">Collabrix Agent Ready</h5>
                            <p className="text-muted small">Ask about workspaces, member management, or search the web.</p>
                        </div>
                    )}
                    
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`d-flex mb-4 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className={`p-3 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-4 rounded-bottom-end-0' : 'bg-white text-dark border rounded-4 rounded-bottom-start-0'}`} style={{ maxWidth: '75%' }}>
                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="d-flex mb-4 justify-content-start">
                            <div className="bg-white border p-3 rounded-4 shadow-sm text-muted d-flex align-items-center">
                                <div className="spinner-grow spinner-grow-sm text-primary me-3" role="status"></div>
                                <span className="small">Agent is processing...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-top">
                <form onSubmit={handleSendMessage} className="mx-auto" style={{ maxWidth: '850px' }}>
                    <div className="input-group shadow-sm border rounded-pill overflow-hidden bg-light">
                        <input 
                            type="text" 
                            className="form-control border-0 bg-transparent py-3 px-4" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Type your command..." 
                            disabled={isLoading}
                        />
                        <button 
                            className="btn btn-primary px-4 m-1 rounded-pill" 
                            type="submit" 
                            disabled={isLoading || !input.trim()}
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentTestPage;
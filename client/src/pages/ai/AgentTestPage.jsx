import React, { useState, useEffect, useRef } from 'react';

const AgentTestPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState(`thread-${Math.floor(Math.random() * 1000)}`);
    const [userId] = useState(1);
    const scrollRef = useRef(null);

    const AGENT_GATEWAY_URL = "http://localhost/ai/agent";

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: input }]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(AGENT_GATEWAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    thread_id: String(threadId),
                    user_id: userId
                }),
            });

            const contentType = response.headers.get("content-type");

            if (!response.ok || !contentType || !contentType.includes("application/json")) {
                const errorText = await response.text();
                throw new Error(errorText || "Server crashed without returning JSON.");
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

        } catch (err) {
            console.error("Agent Error:", err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `⚠️ Error: ${err.message.includes('Unexpected token') ? 'Service unreachable' : err.message}` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex flex-column bg-light p-0">
            <div className="d-flex justify-content-between align-items-center p-3 bg-white border-bottom shadow-sm">
                <div>
                    <h5 className="mb-0 text-primary fw-bold">Collabrix Global Agent</h5>
                    <small className="text-muted font-monospace">Thread: {threadId}</small>
                </div>
                <button className="btn btn-outline-danger btn-sm" onClick={() => {setMessages([]); setThreadId(`thread-${Date.now()}`)}}>New Session</button>
            </div>

            <div ref={scrollRef} className="flex-grow-1 overflow-auto p-4" style={{ background: '#f0f2f5' }}>
                <div className="mx-auto" style={{ maxWidth: '850px' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`d-flex mb-4 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark'}`} style={{ maxWidth: '80%' }}>
                                <small className="d-block fw-bold mb-1 opacity-50" style={{ fontSize: '0.6rem' }}>{msg.role.toUpperCase()}</small>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-muted small p-2 animate-pulse">Agent is executing tools...</div>}
                </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-top">
                <div className="mx-auto" style={{ maxWidth: '850px' }}>
                    <div className="input-group shadow-sm rounded-3 overflow-hidden">
                        <input type="text" className="form-control border-0 bg-light py-3" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Assign a task..." disabled={isLoading} />
                        <button className="btn btn-primary px-4" type="submit" disabled={isLoading || !input.trim()}>Send</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AgentTestPage;
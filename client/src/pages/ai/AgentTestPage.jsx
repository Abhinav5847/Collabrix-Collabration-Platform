import React, { useState, useEffect, useRef } from 'react';
import { aiApi } from "../../services/aiApi"; 
import Swal from 'sweetalert2';
import { 
    FiSend, FiCpu, FiTerminal, FiCheckCircle, 
    FiAlertCircle, FiLoader, FiCommand, FiActivity, FiLayers 
} from 'react-icons/fi';

const AgentTestPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId] = useState(`thread-${Math.floor(1000 + Math.random() * 9000)}`);
    const scrollRef = useRef(null);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userMsg = input.trim();
        if (!userMsg || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await aiApi.post("agent/chat", {
                message: userMsg,
                thread_id: String(threadId)
            });

            const history = res.data?.messages || [];
            const aiContent = history[history.length - 1]?.content || "Process complete.";

            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: aiContent,
                isSuccess: aiContent.includes("✅"),
                isError: aiContent.includes("❌")
            }]);

            if (aiContent.includes("✅")) Toast.fire({ icon: 'success', title: 'Task Executed' });

        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Agent Gateway Timeout";
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${errorMsg}`, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow-1 d-flex flex-column bg-white h-100 overflow-hidden" style={{fontFamily: "'JetBrains Mono', 'Inter', monospace"}}>
            
            {/* --- TOP STATUS BAR --- */}
            <div className="px-4 py-2 border-bottom bg-white d-flex align-items-center justify-content-between shadow-sm">
                <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center gap-2">
                        <div className="spinner-grow text-primary" style={{width: 8, height: 8}}></div>
                        <span className="fw-bold small text-dark tracking-tighter">AGENT_CORE_v1</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted">
                        <FiActivity size={14}/>
                        <small style={{fontSize: '0.7rem'}}>LATENCY: 24ms</small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-dark text-white rounded-1 fw-normal" style={{fontSize: '0.65rem'}}>STABLE_RELEASE</span>
                    <small className="text-primary fw-bold" style={{fontSize: '0.7rem'}}>{threadId.toUpperCase()}</small>
                </div>
            </div>

            {/* --- WORKSPACE / LOG AREA --- */}
            <div ref={scrollRef} className="flex-grow-1 overflow-auto p-4 bg-white">
                <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                    
                    {messages.length === 0 && (
                        <div className="text-center my-5 py-5 border rounded-4 border-light bg-light-subtle">
                            <FiLayers size={32} className="text-primary mb-3" />
                            <h6 className="fw-bold text-dark">READY FOR COMMANDS</h6>
                            <p className="text-muted small mx-auto" style={{maxWidth: '300px'}}>
                                Global Agent is synchronized with Collabrix workspaces. Enter a task below to begin.
                            </p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`mb-4 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className="d-flex flex-column gap-2" style={{ maxWidth: '90%', minWidth: '300px' }}>
                                
                                {/* Header / Role Label */}
                                <div className={`d-flex align-items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`rounded-circle d-flex align-items-center justify-content-center`} 
                                         style={{width: 24, height: 24, background: msg.role === 'user' ? '#212529' : '#0d6efd'}}>
                                        {msg.role === 'user' ? <FiTerminal size={12} color="white"/> : <FiCpu size={12} color="white"/>}
                                    </div>
                                    <span className="fw-bold" style={{fontSize: '0.7rem', letterSpacing: '1px', color: msg.role === 'user' ? '#212529' : '#0d6efd'}}>
                                        {msg.role === 'user' ? 'OPERATOR' : 'AGENT_EXECUTOR'}
                                    </span>
                                </div>

                                {/* Content Box */}
                                <div className={`p-3 border shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-white border-dark text-dark' 
                                    : msg.isError ? 'bg-danger-subtle border-danger' : 'bg-white border-primary-subtle border-start-4'
                                }`} style={{borderLeft: msg.role === 'assistant' ? '4px solid #0d6efd' : '1px solid #212529', borderRadius: '4px 12px 12px 12px'}}>
                                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* DYNAMIC EXECUTION STATE */}
                    {isLoading && (
                        <div className="d-flex mb-4">
                            <div className="p-3 border-start border-primary border-4 bg-light shadow-sm d-flex align-items-center gap-3" style={{width: '100%', borderRadius: '4px'}}>
                                <FiLoader className="spinner-border spinner-border-sm border-0 text-primary" />
                                <div className="d-flex flex-column">
                                    <span className="small fw-bold text-primary" style={{fontSize: '0.65rem', letterSpacing: '1px'}}>EXECUTING_WORKSPACE_TOOL</span>
                                    <span className="text-muted small" style={{fontSize: '0.75rem'}}>Authorizing request and applying workspace parameters...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-white">
                <form onSubmit={handleSendMessage} className="mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="input-group border border-2 border-dark rounded-3 overflow-hidden shadow">
                        <span className="input-group-text bg-dark border-0 rounded-0 text-white px-3">
                            <FiCommand size={18} />
                        </span>
                        <input 
                            className="form-control border-0 py-3 shadow-none fw-medium" 
                            value={input} 
                            onChange={(e)=>setInput(e.target.value)} 
                            placeholder="SYSTEM_INPUT > _" 
                            style={{ fontSize: '0.9rem', backgroundColor: '#fff' }}
                            disabled={isLoading}
                        />
                        <button 
                            className={`btn px-4 fw-bold rounded-0 ${!input.trim() || isLoading ? 'btn-light' : 'btn-primary'}`}
                            type="submit" 
                            disabled={isLoading || !input.trim()}
                        >
                            RUN_TASK
                        </button>
                    </div>
                    <div className="d-flex justify-content-between mt-2 px-1">
                        <small className="text-muted" style={{fontSize: '0.6rem'}}>SECURE_CHANNEL: ACTIVE</small>
                        <small className="text-muted" style={{fontSize: '0.6rem'}}>MODEL: LLAMA-3.1-8B-INSTANT</small>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentTestPage;
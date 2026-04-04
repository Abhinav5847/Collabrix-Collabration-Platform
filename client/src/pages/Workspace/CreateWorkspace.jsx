import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function CreateWorkspace() {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [status, setStatus] = useState('idle'); 
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');
        try {
            const res = await api.post('workspaces/', formData);
            setStatus('idle');
            navigate(`/workspace/${res.data.id}`);
            window.location.reload();
        } catch (err) {
            setErrorMsg(err.response?.data?.name || 'Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    const nameOk = formData.name.trim().length >= 4;
    const charCount = formData.description.length;

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '560px', margin: '0 auto' }}>

            <Link
                to="/"
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', fontWeight: 500, color: '#64748b',
                    textDecoration: 'none', marginBottom: '24px'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
                <ArrowLeft size={14} /> Back to Dashboard
            </Link>


            <div style={{
                background: '#fff', borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '24px 28px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '11px',
                        background: '#eff6ff', border: '1px solid #dbeafe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Building2 size={20} color="#2563eb" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                            Create a Workspace
                        </h2>
                        <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                            Set up a shared space for your team
                        </p>
                    </div>
                </div>

   
                <div style={{ padding: '28px' }}>
                    {status === 'error' && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '10px', padding: '12px 14px',
                            marginBottom: '22px'
                        }}>
                            <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '13.5px', color: '#b91c1c', fontWeight: 500 }}>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>
                                Workspace Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="e.g. Marketing Team"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '10px 40px 10px 14px',
                                        fontSize: '14px', color: '#0f172a',
                                        background: '#f8fafc',
                                        border: `1.5px solid ${formData.name && !nameOk ? '#fca5a5' : formData.name && nameOk ? '#86efac' : '#e2e8f0'}`,
                                        borderRadius: '9px', outline: 'none',
                                        transition: 'border-color 0.15s, box-shadow 0.15s'
                                    }}
                                    onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'}
                                    onBlur={e => e.target.style.boxShadow = 'none'}
                                />
                                {formData.name && (
                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                        <CheckCircle2 size={16} color={nameOk ? '#16a34a' : '#ef4444'} />
                                    </div>
                                )}
                            </div>
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                Minimum 4 characters. This will be visible to all members.
                            </p>
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Description <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                                </label>
                                <span style={{ fontSize: '11px', color: charCount > 200 ? '#ef4444' : '#94a3b8' }}>
                                    {charCount} / 300
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                placeholder="Describe the purpose of this workspace…"
                                value={formData.description}
                                maxLength={300}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '10px 14px', fontSize: '14px', color: '#0f172a',
                                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                    borderRadius: '9px', outline: 'none', resize: 'vertical',
                                    lineHeight: 1.6, fontFamily: 'inherit',
                                    transition: 'border-color 0.15s, box-shadow 0.15s'
                                }}
                                onFocus={e => { e.target.style.borderColor = '#bfdbfe'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>


                        <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 24px' }} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link
                                to="/"
                                style={{
                                    flex: '0 0 auto', padding: '10px 20px',
                                    borderRadius: '9px', fontSize: '14px', fontWeight: 600,
                                    color: '#64748b', textDecoration: 'none',
                                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                    display: 'inline-flex', alignItems: 'center',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={!nameOk || status === 'loading'}
                                style={{
                                    flex: 1, padding: '10px 20px',
                                    borderRadius: '9px', fontSize: '14px', fontWeight: 600,
                                    color: '#fff', border: 'none', cursor: !nameOk || status === 'loading' ? 'not-allowed' : 'pointer',
                                    background: !nameOk || status === 'loading' ? '#93c5fd' : '#2563eb',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: nameOk && status !== 'loading' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => { if (nameOk && status !== 'loading') e.currentTarget.style.background = '#1d4ed8'; }}
                                onMouseLeave={e => { if (nameOk && status !== 'loading') e.currentTarget.style.background = '#2563eb'; }}
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 size={15} style={{ animation: 'spin 0.75s linear infinite' }} />
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <Building2 size={15} /> Launch Workspace
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
                You can invite members after the workspace is created.
            </p>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
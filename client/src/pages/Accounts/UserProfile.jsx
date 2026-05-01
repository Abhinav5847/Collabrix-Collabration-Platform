import React from 'react';
import { useSelector } from 'react-redux';
import { 
    User, Mail, ShieldCheck, Calendar, 
    Edit3, Key, BadgeCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { user } = useSelector((state) => state.auth);

    if (!user) return null;

    const infoRowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '12px'
    };

    const labelStyle = {
        fontSize: '12px',
        fontWeight: 600,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '4px'
    };

    const valueStyle = {
        fontSize: '15px',
        fontWeight: 500,
        color: '#1e293b',
        margin: 0
    };

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
                    My Profile
                </h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    Manage your personal information and account security.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
                
                {/* Main Info Column */}
                <section>
                    <div style={{ ...infoRowStyle, background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
                        <div style={{ 
                            width: '64px', height: '64px', borderRadius: '16px', 
                            background: '#2563eb', color: '#fff', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700 
                        }}>
                            {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                                {user.first_name} {user.last_name}
                            </h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>@{user.username}</p>
                        </div>
                        <button style={{ 
                            marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', 
                            border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', 
                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
                        }}>
                            <Edit3 size={14} /> Edit
                        </button>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '16px' }}>Account Details</h3>
                        
                        <div style={infoRowStyle}>
                            <div style={{ color: '#2563eb', background: '#eff6ff', p: '10px', borderRadius: '10px' }}><Mail size={20} /></div>
                            <div>
                                <p style={labelStyle}>Email Address</p>
                                <p style={valueStyle}>{user.email}</p>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                                <BadgeCheck size={14} /> Verified
                            </div>
                        </div>

                        <div style={infoRowStyle}>
                            <div style={{ color: '#2563eb', background: '#eff6ff', p: '10px', borderRadius: '10px' }}><User size={20} /></div>
                            <div>
                                <p style={labelStyle}>Full Name</p>
                                <p style={valueStyle}>{user.first_name || 'Not set'} {user.last_name || ''}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar/Security Column */}
                <aside>
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={18} color="#2563eb" /> Security
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link to="/enable_Mfa" style={{ 
                                textDecoration: 'none', padding: '12px', borderRadius: '10px', 
                                background: '#f8fafc', border: '1px solid #f1f5f9', display: 'block' 
                            }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Two-Factor Auth</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Add an extra layer of security</p>
                            </Link>

                            <button style={{ 
                                textAlign: 'left', padding: '12px', borderRadius: '10px', 
                                background: 'transparent', border: '1px solid #e2e8f0', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%'
                            }}>
                                <Key size={16} color="#64748b" />
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>Change Password</span>
                            </button>
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                                User ID: {user.id}
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
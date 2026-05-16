import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    User, Mail, ShieldCheck, Edit3, Key, BadgeCheck, ShieldAlert, CheckCircle2, X, Save, Lock, AlertTriangle, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { updateUserProfile, clearError } from '../../store/slices/authSlice';

export default function Profile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, error, loading } = useSelector((state) => state.auth);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [successMessage, setSuccessMessage] = useState('');
    
    // Defensive Confirmation State (SweetAlert inspired full-width warning)
    const [showEmailWarning, setShowEmailWarning] = useState(false);

    // OTP / Verification States for existing unverified accounts
    const [needsVerification, setNeedsVerification] = useState(false);

    // Load initial values from Redux user state
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || ''
            });
            setNeedsVerification(user.is_email_verified === false);
        }
    }, [user, isEditing]);

    if (!user) return null;

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // First Step: Triggered when user clicks "Save"
    const handlePreSaveCheck = () => {
        dispatch(clearError());
        setSuccessMessage('');

        const isEmailChanged = formData.email !== user.email;

        // SweetAlert style interception: If email changed, show warning banner first
        if (isEmailChanged) {
            setShowEmailWarning(true);
        } else {
            // If only username changed, proceed immediately
            executeProfileUpdate();
        }
    };

    // Second Step: User confirms they understand the security logout consequences
    const executeProfileUpdate = () => {
        setShowEmailWarning(false);
        
        dispatch(updateUserProfile(formData))
            .unwrap()
            .then((response) => {
                setIsEditing(false);
                const isEmailChanged = formData.email !== user.email;
                
                if (isEmailChanged || response?.needs_verification) {
                    // Navigate to the centralized OTP check, passing the new target email
                    navigate('/verify-otp', { state: { email: formData.email } });
                } else {
                    setSuccessMessage('Profile saved successfully!');
                }
            })
            .catch(() => {});
    };

    // Styling Definitions
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

    const inputStyle = {
        width: '100%',
        maxWidth: '300px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        color: '#1e293b',
        outline: 'none',
        background: '#f8fafc'
    };

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
                    My Profile
                </h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    Manage your personal information and account security settings.
                </p>
            </div>

            {/* INTERACTIVE ALERT: SweetAlert Toast Styled Warning Banner */}
            {showEmailWarning && (
                <div style={{ 
                    padding: '20px', 
                    background: '#fff7ed', 
                    border: '1px solid #ffedd5', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.1)',
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ background: '#ffea00', padding: '8px', borderRadius: '50%' }}>
                            <AlertTriangle color="#ea580c" size={24} />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#9a3412' }}>
                                Email Re-verification Required
                            </h4>
                            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#c2410c', lineHeight: '1.5' }}>
                                Changing your account email address from <strong>{user.email}</strong> to <strong>{formData.email}</strong> will require security authorization. You will be logged out of your current session, and an authentication code will be sent to your email.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={executeProfileUpdate}
                                    style={{ 
                                        padding: '8px 16px', borderRadius: '6px', border: 'none',
                                        background: '#ea580c', color: '#fff', fontSize: '13px', 
                                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    Proceed & Verify <ArrowRight size={14} />
                                </button>
                                <button 
                                    onClick={() => setShowEmailWarning(false)}
                                    style={{ 
                                        padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                        background: '#fff', color: '#475569', fontSize: '13px', 
                                        fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    Keep Original Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error & Success Feedback Banners */}
            {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
                </div>
            )}
            {successMessage && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {successMessage}
                </div>
            )}

            {/* Unverified State Callout Banner */}
            {needsVerification && !isEditing && (
                <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <ShieldAlert color="#d97706" size={20} />
                        <div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#92400e' }}>Action Required: Verify Email Address</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>Please verify your active identity profile to unblock workspace permissions.</p>
                        </div>
                    </div>
                    <Link 
                        to="/verify-otp" 
                        state={{ email: formData.email }}
                        style={{
                            display: 'inline-block', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none',
                            background: '#d97706', color: '#fff', fontSize: '13px', fontWeight: 600
                        }}
                    >
                        Go to Verification Page
                    </Link>
                </div>
            )}

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
                                @{user.username}
                            </h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Workspace Identity Profile</p>
                        </div>

                        {/* Toggle Action Buttons */}
                        {!isEditing ? (
                            <button 
                                onClick={() => { dispatch(clearError()); setSuccessMessage(''); setIsEditing(true); }}
                                style={{ 
                                    marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', 
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
                                }}
                            >
                                <Edit3 size={14} /> Edit Profile
                            </button>
                        ) : (
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={handlePreSaveCheck}
                                    disabled={loading || showEmailWarning}
                                    style={{ 
                                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                                        background: '#10b981', color: '#fff', fontSize: '13px', 
                                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
                                    }}
                                >
                                    <Save size={14} /> {loading ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    onClick={() => { setIsEditing(false); setShowEmailWarning(false); }}
                                    style={{ 
                                        padding: '8px 16px', borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', 
                                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
                                    }}
                                >
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '16px' }}>Account Details</h3>
                        
                        {/* Username Row */}
                        <div style={infoRowStyle}>
                            <div style={{ color: '#2563eb', background: '#eff6ff', padding: '10px', borderRadius: '10px' }}><User size={20} /></div>
                            <div style={{ flexGrow: 1 }}>
                                <p style={labelStyle}>Username</p>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        name="username" 
                                        disabled={showEmailWarning}
                                        value={formData.username} 
                                        onChange={handleInputChange} 
                                        style={inputStyle} 
                                    />
                                ) : (
                                    <p style={valueStyle}>@{user.username}</p>
                                )}
                            </div>
                        </div>

                        {/* Email Row */}
                        <div style={infoRowStyle}>
                            <div style={{ color: '#2563eb', background: '#eff6ff', padding: '10px', borderRadius: '10px' }}><Mail size={20} /></div>
                            <div style={{ flexGrow: 1 }}>
                                <p style={labelStyle}>Email Address</p>
                                {isEditing ? (
                                    <input 
                                        type="email" 
                                        name="email" 
                                        disabled={showEmailWarning}
                                        value={formData.email} 
                                        onChange={handleInputChange} 
                                        style={inputStyle} 
                                    />
                                ) : (
                                    <p style={valueStyle}>{user.email}</p>
                                )}
                            </div>
                            {!isEditing && (
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: needsVerification ? '#d97706' : '#10b981', fontSize: '12px', fontWeight: 600 }}>
                                    {needsVerification ? (
                                        <> <ShieldAlert size={14} /> Pending Verification </>
                                    ) : (
                                        <> <BadgeCheck size={14} /> Verified </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* MFA Status Row */}
                        <div style={infoRowStyle}>
                            <div style={{ 
                                color: user.mfa_enabled ? '#10b981' : '#f59e0b', 
                                background: user.mfa_enabled ? '#ecfdf5' : '#fffbeb', 
                                padding: '10px', borderRadius: '10px' 
                            }}>
                                {user.mfa_enabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                            </div>
                            <div>
                                <p style={labelStyle}>Two-Factor Authentication</p>
                                <p style={{ ...valueStyle, color: user.mfa_enabled ? '#10b981' : '#b45309' }}>
                                    {user.mfa_enabled ? 'Active & Protected' : 'Not Enabled'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar Column */}
                <aside>
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={18} color="#2563eb" /> Security
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link to="/enable_Mfa" style={{ 
                                pointerEvents: (needsVerification || isEditing) ? 'none' : 'auto',
                                opacity: (needsVerification || isEditing) ? 0.6 : 1,
                                textDecoration: 'none', padding: '12px', borderRadius: '10px', 
                                background: user.mfa_enabled ? '#f0fdf4' : '#fffbeb', 
                                border: user.mfa_enabled ? '1px solid #dcfce7' : '1px solid #fef3c7', 
                                display: 'block' 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                        {needsVerification ? 'MFA Locked' : 'Two-Factor Auth'}
                                    </p>
                                    {user.mfa_enabled && !needsVerification && <CheckCircle2 size={14} color="#10b981" />}
                                    {needsVerification && <Lock size={14} color="#94a3b8" />}
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                    {needsVerification ? 'Verify email to configure security.' : user.mfa_enabled ? 'Your account is extra secure.' : 'Add an extra layer of security.'}
                                </p>
                            </Link>

                            <button 
                                disabled={needsVerification || isEditing}
                                style={{ 
                                    opacity: (needsVerification || isEditing) ? 0.6 : 1,
                                    textAlign: 'left', padding: '12px', borderRadius: '10px', 
                                    background: 'transparent', border: '1px solid #e2e8f0', cursor: (needsVerification || isEditing) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%'
                                }}
                            >
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
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
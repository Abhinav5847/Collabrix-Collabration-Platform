import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
    Bell, CheckCheck, Circle, Clock, 
    MoreHorizontal, Trash2, Info 
} from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('notifications/');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`notifications/${id}/read/`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };

    const markAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await api.patch('notifications/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Error marking all as read", err);
        } finally {
            setMarkingAll(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '24px' 
            }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        Stay updated with your latest workspace activities.
                    </p>
                </div>
                
                {notifications.some(n => !n.is_read) && (
                    <button 
                        onClick={markAllAsRead}
                        disabled={markingAll}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                            background: '#fff', fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s', color: '#1d4ed8'
                        }}
                    >
                        <CheckCheck size={16} />
                        {markingAll ? 'Marking...' : 'Mark all as read'}
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ 
                            width: '48px', height: '48px', background: '#f1f5f9', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' 
                        }}>
                            <Bell size={24} />
                        </div>
                        <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>No notifications yet</p>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>We'll notify you when something happens.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif.id}
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                gap: '16px',
                                background: notif.is_read ? 'transparent' : '#f8faff',
                                transition: 'background 0.2s',
                                position: 'relative'
                            }}
                        >
                            {/* Icon Indicator */}
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: notif.is_read ? '#f1f5f9' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: notif.is_read ? '#94a3b8' : '#2563eb', flexShrink: 0
                            }}>
                                <Info size={20} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <p style={{ 
                                        margin: 0, fontSize: '14px', lineHeight: '1.5',
                                        fontWeight: notif.is_read ? 500 : 600, 
                                        color: notif.is_read ? '#475569' : '#0f172a' 
                                    }}>
                                        {notif.message}
                                    </p>
                                    {!notif.is_read && (
                                        <button 
                                            onClick={() => markAsRead(notif.id)}
                                            title="Mark as read"
                                            style={{ 
                                                border: 'none', background: 'none', cursor: 'pointer',
                                                color: '#2563eb', padding: '4px' 
                                            }}
                                        >
                                            <Circle size={8} fill="#2563eb" />
                                        </button>
                                    )}
                                </div>
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '4px', 
                                    marginTop: '6px', color: '#94a3b8', fontSize: '12px' 
                                }}>
                                    <Clock size={12} />
                                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
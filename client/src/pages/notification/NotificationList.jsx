import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
    Bell, CheckCheck, Circle, Clock, 
    AtSign, UserPlus, Info 
} from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        // 1. Initial fetch of old notifications from DB
        fetchNotifications();

        // 2. Setup WebSocket for Real-time updates
        // window.location.host will handle the domain automatically
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const socket = new WebSocket(`${protocol}://${window.location.host}/ws/notifications/`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'send_notification') {
                // Add new notification to the top of the list instantly
                setNotifications(prev => [data.content, ...prev]);
            }
        };

        socket.onerror = (err) => console.error("WebSocket Error:", err);

        return () => socket.close();
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
            await api.patch('notifications/mark-all-read/');
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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        Stay updated with mentions and invitations.
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
                            cursor: 'pointer', color: '#1d4ed8'
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
                        <Bell size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
                        <p style={{ fontWeight: 600, color: '#0f172a' }}>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id} style={{
                            padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                            display: 'flex', gap: '16px', background: notif.is_read ? 'transparent' : '#f8faff'
                        }}>
                            {/* Dynamic Icon based on type */}
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: notif.notification_type === 'invitation' ? '#fef3c7' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: notif.notification_type === 'invitation' ? '#d97706' : '#2563eb'
                            }}>
                                {notif.notification_type === 'invitation' ? <UserPlus size={20} /> : <AtSign size={20} />}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: notif.is_read ? 500 : 600 }}>
                                        {notif.message}
                                    </p>
                                    {!notif.is_read && (
                                        <button onClick={() => markAsRead(notif.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                            <Circle size={8} fill="#2563eb" color="#2563eb" />
                                        </button>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#94a3b8', fontSize: '12px' }}>
                                    <Clock size={12} />
                                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                                </div>

                                {/* Action button for invitations */}
                                {notif.notification_type === 'invitation' && !notif.is_read && (
                                    <button style={{
                                        marginTop: '10px', padding: '6px 12px', background: '#2563eb',
                                        color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                                    }}>
                                        Join Workspace
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
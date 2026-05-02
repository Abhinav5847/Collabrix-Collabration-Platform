import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Bell, CheckCheck, Circle, Clock, UserPlus, AtSign } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        fetchNotifications();

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const socket = new WebSocket(`${protocol}://${window.location.host}/ws/notifications/`);

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'send_notification') {

                setNotifications(prev => [data.content, ...prev]);
            }
        };
        return () => socket.close();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('notifications/');
            setNotifications(res.data);
        } catch (err) { console.error(err); }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`notifications/${id}/`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) { console.error("Mark as read failed", err); }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('notifications/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Notifications</h3>
                <button onClick={handleMarkAllRead} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#2563eb' }}>
                    Mark all as read
                </button>
            </div>

            {notifications.map(notif => (
                <div key={notif.id} style={{
                    display: 'flex', padding: '15px', borderBottom: '1px solid #eee',
                    background: notif.is_read ? 'white' : '#f0f7ff', borderRadius: '8px', marginBottom: '5px'
                }}>
                    <div style={{ marginRight: '15px' }}>
                        {notif.notification_type === 'invitation' ? <UserPlus color="#d97706" /> : <AtSign color="#2563eb" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: notif.is_read ? 400 : 600 }}>{notif.message}</p>
                        <small style={{ color: '#888' }}>{new Date(notif.created_at).toLocaleTimeString()}</small>
                    </div>
                    {!notif.is_read && (
                        <button onClick={() => handleMarkAsRead(notif.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Circle size={10} fill="#2563eb" color="#2563eb" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
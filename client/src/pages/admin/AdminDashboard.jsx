import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { toast } from "react-toastify";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("collabrix_admin/dashboard/stats/");
                setStats(response.data);
            } catch (err) {
                toast.error("Failed to load dashboard metrics");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="spinner-border text-primary"></div>;

    return (
        <div className="row g-4">
            
            <div className="col-md-4">
                <div className="card shadow-sm border-0 p-3">
                    <h6 className="text-muted small fw-bold">TOTAL USERS</h6>
                    <h2 className="fw-bold">{stats?.user_metrics?.total_users}</h2>
                    <span className="text-success small">+{stats?.user_metrics?.new_users_24h} in last 24h</span>
                </div>
            </div>

            
            <div className="col-md-4">
                <div className="card shadow-sm border-0 p-3">
                    <h6 className="text-muted small fw-bold">DATABASE STATUS</h6>
                    <h2 className="text-primary fw-bold">{stats?.system_status?.db_connection}</h2>
                    <span className="text-muted small">Server: {stats?.system_status?.server_time}</span>
                </div>
            </div>

            
            <div className="col-md-4">
                <div className="card shadow-sm border-0 p-3">
                    <h6 className="text-muted small fw-bold">ADMINISTRATORS</h6>
                    <h2 className="fw-bold">{stats?.user_metrics?.active_staff}</h2>
                    <span className="text-muted small">Active Staff Accounts</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
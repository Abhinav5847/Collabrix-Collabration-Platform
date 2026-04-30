import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

export default function JoinWorkspace() {
    // Destructure 'id' to match the path="/workspaces/join/:id" in App.jsx
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [status, setStatus] = useState('joining');

    useEffect(() => {
        const performJoin = async () => {
            // Guard clause: prevent execution if id is not yet available
            if (!id || id === 'undefined') return;

            try {
                // Hits the Django endpoint: /api/workspaces/workspace/<int:pk>/join/
                await api.post(`workspaces/workspace/${id}/join/`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Joined!',
                    text: 'You are now a member of this workspace.',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Redirect to the workspace detail page
                navigate(`/workspace/${id}`);
            } catch (err) {
                console.error("Join Error:", err);
                setStatus('error');
                Swal.fire({
                    icon: 'error',
                    title: 'Join Failed',
                    text: err.response?.data?.detail || 'Something went wrong.'
                });
            }
        };

        performJoin();
    }, [id, navigate]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            {status === 'joining' ? (
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="fw-bold">Joining workspace, please wait...</p>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-danger">Failed to join workspace. Redirecting...</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/')}
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}
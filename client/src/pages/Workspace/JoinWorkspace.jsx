import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

export default function JoinWorkspace() {
    // 1. Ensure your Route in App.js is: <Route path="/workspaces/join/:token" element={<JoinWorkspace />} />
    const { token } = useParams(); 
    const navigate = useNavigate();
    const [status, setStatus] = useState('joining');

    useEffect(() => {
        const acceptInvitation = async () => {
            // If the token is missing from the URL params, fail immediately
            if (!token) {
                console.error("No token detected in the URL.");
                setStatus('error');
                return;
            }

            try {
                /** 
                 * 2. URL ALIGNMENT:
                 * Your backend path is: workspaces/invite/accept/<uuid:token>/
                 * If your 'api' instance has a base URL like '/api/', 
                 * the final request will be: /api/workspaces/invite/accept/{token}/
                 */
                const response = await api.post(`workspaces/workspaces/invite/accept/${token}/`);
                const { workspace_id, message } = response.data;

                Swal.fire({
                    icon: 'success',
                    title: 'Access Granted',
                    text: message || 'Welcome to the workspace!',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Navigate to the specific workspace detail page
                navigate(`/workspace/${workspace_id}`);
            } catch (err) {
                console.error("Invitation Error:", err.response?.data);
                setStatus('error');
                
                const errorMessage = err.response?.data?.error || 'This link is invalid or has expired.';
                
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Invitation',
                    text: errorMessage
                });
            }
        };

        acceptInvitation();
    }, [token, navigate]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center p-5 bg-white shadow-lg rounded-4" style={{ maxWidth: '450px' }}>
                {status === 'joining' ? (
                    <>
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h4 className="fw-bold">Verifying Your Access</h4>
                        <p className="text-muted">Please wait while we validate your secure invitation token...</p>
                    </>
                ) : (
                    <>
                        <div className="text-danger mb-3">
                            {/* Using a standard Bootstrap icon or similar */}
                            <i className="bi bi-x-circle-fill" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h4 className="fw-bold">Verification Failed</h4>
                        <p className="text-muted">
                            This invitation may have expired (48-hour limit), already been used, 
                            or was sent to a different email address.
                        </p>
                        <button className="btn btn-primary w-100 rounded-pill mt-3" onClick={() => navigate('/')}>
                            Return to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
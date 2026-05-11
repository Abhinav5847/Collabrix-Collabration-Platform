import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch,useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";

// Redux Actions
import { fetchUserProfile } from "./store/slices/authSlice";

// Auth Pages
import UserLogin from './pages/Accounts/UserLogin';
import UserRegister from './pages/Accounts/UserRegister';
import VerifyOTP from './pages/Accounts/verifyOtp';
import GoogleCallback from './pages/Accounts/GoogleCallback';
import ForgotPassword from './pages/Accounts/ForgotPassword';
import ResetPassword from './pages/Accounts/ResetPassword';
import EnableMFA from './pages/Accounts/EnableMFA';
import VerifyMFA from './pages/Accounts/VerifyMFA';
import Profile from './pages/Accounts/UserProfile';

// Workspace Pages
import Dashboard from './pages/Accounts/Dashboard';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import WorkspaceDetail from './pages/Workspace/WorkspaceDetail';
import CreateWorkspace from './pages/Workspace/CreateWorkspace';
import WorkspaceChat from './pages/Workspace/WorkSpaceChat';
import WorkspaceMembers from './pages/Workspace/WorkspaceMembers';
import JoinWorkspace from './pages/Workspace/JoinWorkspace';
import WorkspaceManagePage from './pages/Workspace/WorkSpaceSettings';


// AI & Docs
import CollabrixChat from './pages/ai/aiChatBot';
import AgentTestPage from './pages/ai/AgentTestPage';
import DocumentList from './pages/docs/DocsDashboard';
import DocumentDetail from './pages/docs/DocsDetails';
import TrashManager from './pages/docs/DocsTrash';

// Misc
import NotificationsPage from './pages/notification/NotificationList';
import ProtectedRoute from "./ProtectedRouting"; 

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

// Styles
import './App.css';
import "react-toastify/dist/ReactToastify.css";
import MeetingList from "./pages/Workspace/MeetingListPage";
import MeetingSummaryList from "./pages/Workspace/MeetingDetailView";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWorkspaces from "./pages/admin/AdminWorkspaces";



function App() {
  const dispatch = useDispatch();

  const { isAuthenticated, user,loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const hasToken = localStorage.getItem('isAuthenticated') === 'true';
    if (hasToken && !user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user]);

  if (localStorage.getItem('isAuthenticated') === 'true' && !user && loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading Session...</div>;
  }

  return (
    <>
      <Router>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/register" element={<UserRegister />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot_password" element={<ForgotPassword />} />
          <Route path="/reset_password/:uid/:token" element={<ResetPassword />} />
          <Route path="/google/callback" element={<GoogleCallback />} />

          {/* --- PROTECTED USER WORKSPACE ROUTES --- */}
          <Route element={<ProtectedRoute adminOnly={false} />}>
            <Route element={<WorkspaceLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/workspace/:id" element={<WorkspaceDetail />} />
              <Route path="/workspace/create" element={<CreateWorkspace />} />
              <Route path="/workspace/:id/manage" element={<WorkspaceManagePage />} />
              <Route path="/enable_Mfa" element={<EnableMFA />} />
              <Route path="/verify_Mfa" element={<VerifyMFA />} />
              <Route path="/workspace/:workspaceId/chat" element={<WorkspaceChat />} />
              <Route path="/chatbot" element={<CollabrixChat />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/workspace/:workspaceId/members" element={<WorkspaceMembers />} />
              <Route path="/agent" element={<AgentTestPage />} />
              <Route path="/workspaces/join/:token" element={<JoinWorkspace />} />
              <Route path="/workspace/:workspaceId/documents" element={<DocumentList />} />
              <Route path="/documents/:pk" element={<DocumentDetail />} />
              <Route path="/workspace/:workspaceId/trash" element={<TrashManager />} />
              
              {/* FIXED MEETING ROUTES */}
              <Route path="/workspace/:workspaceId/meetings" element={<MeetingList/>} />
              <Route path="/workspace/:workspaceId/summaries" element={<MeetingSummaryList/>} />
              <Route path="/workspace/:workspaceId/summaries/:meetingId" element={<MeetingSummaryList/>} />
              
            </Route>
          </Route>

          {/* --- PROTECTED ADMIN ROUTES --- */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
  <Route path="/collabrix_admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} /> 
    <Route path="dashboard" element={<AdminDashboard />} />
    
    {/* Corrected paths to match Sidebar NavLinks */}
    <Route path="users" element={<AdminUsers/>} /> 
    <Route path="workspaces" element={<AdminWorkspaces/>} />
    
    <Route path="security" element={<div>Security Analytics</div>} />
    <Route path="settings" element={<div>Admin Settings Page</div>} />
  </Route>
</Route>

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Router>
      
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
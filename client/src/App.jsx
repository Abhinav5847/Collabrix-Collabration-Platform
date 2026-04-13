import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserLogin from './pages/Accounts/UserLogin';
import UserRegister from './pages/Accounts/UserRegister';
import VerifyOTP from './pages/Accounts/verifyOtp';
import './App.css'
import GoogleCallback from './pages/Accounts/GoogleCallback';
import ForgotPassword from './pages/Accounts/ForgotPassword';
import ResetPassword from './pages/Accounts/ResetPassword';
import Dashboard from './pages/Accounts/Dashboard';
import EnableMFA from './pages/Accounts/EnableMFA';
import VerifyMFA from './pages/Accounts/VerifyMFA';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import WorkspaceDetail from './pages/Workspace/WorkspaceDetail';
import CreateWorkspace from './pages/Workspace/CreateWorkspace';
import WorkspaceChat from './pages/Workspace/WorkSpaceChat';


function App() {
  const [count, setCount] = useState(0)


  return (
    <>


     <Router>
      <Routes>
        <Route path="/register" element={<UserRegister/>} />
        <Route path="/login" element={<UserLogin/>} />
        <Route path="/verify-otp" element={<VerifyOTP/>} />
        <Route path="/forgot_password" element={<ForgotPassword/>} />
        <Route path="/reset_password/:uid/:token" element={<ResetPassword/>} />
        <Route path="/google/callback" element={<GoogleCallback/>} />
 
        <Route element={<WorkspaceLayout/>}>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/workspace/:id" element={<WorkspaceDetail/>} />
          <Route path="/workspace/create" element={<CreateWorkspace/>} />
          <Route path="/enable_Mfa" element={<EnableMFA/>} />
          <Route path="/verify_Mfa" element={<VerifyMFA/>} />
          <Route path="/workspace/:workspaceId/chat" element={<WorkspaceChat/>} />
        </Route>
      </Routes>
    </Router>
    </>
  )
}

export default App

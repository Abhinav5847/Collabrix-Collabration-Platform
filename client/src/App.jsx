import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import VerifyOTP from './pages/verifyOtp';
import './App.css'
import GoogleCallback from './pages/GoogleCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import EnableMFA from './pages/EnableMFA';
import VerifyMFA from './pages/VerifyMFA';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import WorkspaceDetail from './pages/Workspace/WorkspaceDetail';
import CreateWorkspace from './pages/Workspace/CreateWorkspace';


function App() {
  const [count, setCount] = useState(0)


  return (
    <>


     <Router>
      <Routes>
        {/* Auth Routes (No Navbar) */}
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
        </Route>
      </Routes>
    </Router>
    </>
  )
}

export default App

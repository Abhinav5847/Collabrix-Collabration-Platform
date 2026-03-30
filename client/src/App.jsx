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


function App() {
  const [count, setCount] = useState(0)


  return (
    <>
       <Router>
      <Routes>
        <Route path="/register" element={<UserRegister/>} />
        <Route path="/verify-otp" element={<VerifyOTP/>} />
        <Route path="/login" element={<UserLogin/>} />
         <Route path="/google/callback" element={<GoogleCallback/>} />
      </Routes>
    </Router>
    </>
  )
}

export default App

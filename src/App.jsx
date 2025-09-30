import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Chat from './screen/ChatsScreen.jsx';
import Profile from './screen/profile.jsx';
import EmailVerify from './screen/EmailVerification.jsx';
import Login from './screen/Login.jsx';
import EmailRegister from './screen/EmailRegister.jsx';
import SplashScreen from "./screen/SplashScreen.jsx";
import SessionData from "./screen/Sessions.jsx";
import TwoFactorScreen from "./screen/TwoFactorScreen.jsx";


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path='/user/auth/v1/authenticate' element={<Login />} />
        <Route path='/user/auth/v1/register' element={<EmailRegister />} />
        <Route path='/user/auth/v1/verify' element={<EmailVerify />} />
        <Route path='/friend/chat/conversation' element={<Chat />} />
        <Route path='/user/auth/v1/profile' element={<Profile />} />
        <Route path='/user/auth/v1/sessions' element={<SessionData />} />
        <Route path='/user/auth/v1/2FA-Verification' element={<TwoFactorScreen />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App;

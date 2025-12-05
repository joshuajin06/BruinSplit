import React from 'react';
import './pages.css';
import LoginSignup from '../components/loginsignup';

export default function Login() {
  return (<>
        <div className="page-container login-page-right">
            <div className='login-left-image'>
                <img src="/download.png" alt="BruinSplit" />
            </div>
            <div className='Login-Box'>
                <LoginSignup />
            </div>
        </div>
  </>
  );


}
import React from 'react';
import './pages.css';
import LoginSignup from '../components/loginsignup';

export default function Login() {
  return (<>
        <div className="page-container">
            <div className='Login-Box'>
                <LoginSignup />
            </div>
        </div>
  </>
  );


}
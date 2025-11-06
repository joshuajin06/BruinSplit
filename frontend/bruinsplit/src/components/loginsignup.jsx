import { useState } from 'react'
import './loginsignup.css';

export default function LoginSignup() {
    const [signUpOrLogin, setSignUpOrLogin] = useState('Sign Up');

    return (
        <>
            <div className="page-container"> 
                <div className='header'>
                    <div className='text'><h1>{ signUpOrLogin }</h1></div>
                </div>
                <div className='username-input'>
                    <input type="text" placeholder="Username" />
                </div>
                <div className='email-input'>
                    <input type="text" placeholder="Email" />
                </div>
                <div className='password-input'>
                    <input type="password" placeholder="Password" />
                </div>
                <div>
                    <button className='login-signup-button'>{ signUpOrLogin }</button>
                </div>
            </div>
        </>
    );
}
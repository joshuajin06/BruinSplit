import { useState } from 'react'
import Person from '../assets/person.png';
import './loginsignup.css';

export default function LoginSignup() {
    const [signUpOrLogin, setSignUpOrLogin] = useState('Sign Up');

    return (
        <div className="body">
            <div className="login-page-container"> 
                <div className='header'>
                    <div className='text'><h1>{ signUpOrLogin }</h1></div>
                    <div className='underline'></div>
                </div>
                <div className='input'>
                    <input type="text" placeholder="Username" className='username-input'/>
                </div>
                <div className='input'>
                    <input type="text" placeholder="Email" className='email-input'/>
                </div>
                <div className='input'>
                    <input type="password" placeholder="Password" className='password-input'/>
                </div>
                <div>
                    <button className='login-signup-button'>{ signUpOrLogin }</button>
                </div>
            </div>
        </div>
    );
}
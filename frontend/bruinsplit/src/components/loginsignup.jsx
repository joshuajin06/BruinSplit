import { useState } from 'react'
import Person from '../assets/person.png';
import './loginsignup.css';

export default function LoginSignup() {
    const [loggedIn, setLoggedIn] = useState(true); // true for login, false for signup

    return (
        <div className="body">
            <div className="login-page-container"> 
                <div className='header'>
                    <div className='text'><h1>{loggedIn ? "Login" : "Sign Up"}</h1></div>
                    <div className='underline'></div>
                </div>
                <div className='input'>
                    <input type="text" placeholder="Username" className='username-input'/>
                </div>
                {loggedIn? null :
                        <div className='input'>
                            <input type="text" placeholder="Name" className='name-input'/>
                        </div>
                    }
                <div>
                <div className='input'>
                    <input type="text" placeholder="Email" className='email-input'/>
                </div>
                <div className='input'>
                    <input type="password" placeholder="Password" className='password-input'/>
                </div>
                <div className='toggle-action'>
                    <span className="toggle-action-button" onClick={() => { setLoggedIn(!loggedIn) }}>
                        {loggedIn ? "Don't have an account? " : "Already have an account? "}
                        {loggedIn ? false : true}
                    </span>
                </div>
                    <button className='login-signup-button'>{loggedIn ? "Login" : "Sign Up"}</button>
                </div>
            </div>
        </div>
    );
}
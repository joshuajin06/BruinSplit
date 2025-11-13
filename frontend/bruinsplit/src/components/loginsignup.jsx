import { useState } from 'react'
import Person from '../assets/person.png';
import './loginsignup.css';

export default function LoginSignup() {
    const [loggedIn, setLoggedIn] = useState(true); // true for login, false for signup
    const [formData, setFormData] = useState({
        email: '',
        password: '', //should be held as a hash -> leaving as it would be a secuirity risk
        first_name: '',
        last_name: '',
        user_name: '',
        age: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = 'api/users';

        const action = loggedIn ? 'login' : 'signup';

        await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...formData })
        });
        console.log("handleSubmit Run");
    }

    return (
        <div className="body">
            <div className="login-page-container"> 
                <div className='header'>
                    <div className='text'><h1>{loggedIn ? "Login" : "Sign Up"}</h1></div>
                    <div className='underline'></div>
                </div>
                <div className='input'>
                    <input type="text" placeholder="Username" className='username-input' value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}/>
                </div>
                {loggedIn? null :
                    <>
                        <div className='input'>
                            <input type="text" placeholder="First Name" className='firstNamr-input' value={formData.first_name} 
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}/>
                        </div>
                        <div className='input'>
                            <input type="text" placeholder="Last Name" className='lastName-input' value={formData.last_name} 
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}/>
                        </div>
                    </>
                    }
                <div>
                <div className='input'>
                    <input type="text" placeholder="Email" className='email-input' value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}/>
                </div>
                <div className='input'>
                    <input type="password" placeholder="Password" className='password-input' value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})}/>
                </div>
                <div className='toggle-action'>
                    <span className="toggle-action-button" onClick={() => { setLoggedIn(!loggedIn) }}>
                        {loggedIn ? "Don't have an account? " : "Already have an account? "}
                        {loggedIn ? false : true}
                    </span>
                </div>
                    <button className='login-signup-button' onClick={handleSubmit}>{loggedIn ? "Login" : "Sign Up"}</button>
                </div>
            </div>
        </div>
    );
}
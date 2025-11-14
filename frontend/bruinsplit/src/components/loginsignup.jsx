import { useState } from 'react'
import Person from '../assets/person.png';
import './loginsignup.css';
import { useNavigate } from 'react-router-dom'

export default function LoginSignup() {
    const [loggedIn, setLoggedIn] = useState(true); // true for login, false for signup
    const [formData, setFormData] = useState({
        email: '',
        password: '', //should be held as a hash -> leaving as it would be a secuirity risk
        first_name: '',
        last_name: '',
        user_name: ''
    });

    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            if(loggedIn) {
                const response = await fetch('http://localhost:8080/api/auth/login', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                })

                const data = await response.json();

                if(!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                console.log('Logged in:', data.user);

                navigate('/');
            }
            else {
                const response = await fetch('http://localhost:8080/api/auth/signup', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        password: formData.password,
                        username: formData.user_name
                    })
                })
                const data = await response.json();

                if(!response.ok) {
                    throw new Error(data.error || 'Signup failed');
                }

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                console.log('Signed up:', data.user);

                navigate('/');
            }
        } catch(error) {
            setError(error.message);
        }
    }

    const toggleMode = () => {
        setLoggedIn(!loggedIn);
        setError('');
    }


    return (
        <div className="body">
            <div className="login-page-container"> 
                <div className='header'>
                    <div className='text'><h1>{loggedIn ? "Welcome Back" : "Create Account"}</h1></div>
                    {error && (
                    
                    <div className="error-message">
                        <span>⚠️</span> {error}
                        </div>
                    )}
                    <div className='underline'></div>
                </div>
                    <input type="text" placeholder="Username" className='input' value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}/>
                {loggedIn? null :
                    <>
                        <input type="text" placeholder="First Name" className='input' value={formData.first_name} 
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}/>
                        <input type="text" placeholder="Last Name" className='input' value={formData.last_name} 
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}/>
                    </>
                }
                <div>
                    <input type="text" placeholder="Email" className='input' value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}/>
                    <input type="password" placeholder="Password" className='input' value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}/>
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
import express from 'express';
import { supabase } from '../src/lib/supabase.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { authenticateUser } from '../server.js';

const router = express.Router()

//SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const {email, username, password, first_name, last_name} = req.body;

    if(!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, password, and username are all required'
      })
    }

    if(password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      })
    }

    const {data : existingUsers} = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email}, username.eq.${username}`);

    if(existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Email or username already exists'
      })
    }

    const password_hash = await hashPassword(password);

    const {data : user, error} = await supabase
      .from('users')
      .insert([{
        email,
        username,
        password_hash,
        first_name,
        last_name
      }])
      .select('id, email, username, first_name, last_name, created_at')
      .single();

    if(error) throw error;

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Get user from database (including password_hash)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.log('User not found or query error');
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Generate JWT token
    const token = generateToken(user.id, user.email);
    
    // Remove password_hash from response
    delete user.password_hash;
    
    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
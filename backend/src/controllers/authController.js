import { signupUser, loginUser } from '../services/userService.js';
import { supabase } from '../supabase.js';
import { comparePassword, hashPassword } from '../utils/auth.js';


// SIGNUP - create a new user account
export async function signup(req, res, next) {
    try {
    const {email, username, password, first_name, last_name} = req.body;
  
      // validate input
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
  
    // Call service to do the actual work (database operations)
    const result = await signupUser({ email, username, password, first_name, last_name });
  
    // Send success response
    res.status(201).json({
        message: 'User created successfully',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
  

  // LOGIN - authenticate an existing user and return a JWT token
  export async function login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }
      
    // Call service to do the actual work (database operations)
    const result = await loginUser({ email, password });

    // Send success response
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}


export async function retrieveUser(req, res, next) {
  try {
    res.json(req.user);
  } catch(error) {
    res.status(400).json({error: error.message});
  }
}


export async function logout(req, res, next) {
  res.json({message: 'Logged out successfully'});
}


export async function changePassword(req, res, next) {
  try {
      const {currentPassword, newPassword, confirmNewPassword} = req.body;
  
      if(!currentPassword || !newPassword) {
        return res.status(400).json({error: "Current and new password are both required"});
      }
  
      if(newPassword.length < 8) {
        return res.status(400).json({error: "New password length must be longer than 8"});
      }

      if(newPassword != confirmNewPassword) {
        return res.status(400).json({error: "New passwords do not match"});
      }
  
      if(currentPassword == newPassword) {
        return res.status(400).json({error: "New Password cannot be the same as the old password"});
      }
  
      const {data: user} = await supabase
        .from('profiles')
        .select('password_hash')
        .eq('id', req.user.id)
        .single()
  
      const validPassword = await comparePassword(currentPassword, user.password_hash);
  
      if(!validPassword) {
        return res.status(400).json({error: "Current password is not valid"});
      }
  
      const newPasswordHash = await hashPassword(newPassword);
  
      const { error } = await supabase
        .from('profiles')
        .update({password_hash : newPasswordHash})
        .eq('id', req.user.id)
  
      if(error) throw error;
  
      res.json({ message: 'Password changed successfully' });
  
    } catch (error) {
  
      console.error(error);
      res.status(400).json({ error: error.message || 'Failed to change password' });
      
    }
}
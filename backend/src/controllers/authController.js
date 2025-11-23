import { signupUser, loginUser } from '../services/userService.js';


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
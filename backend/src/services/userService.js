import { supabase } from '../supabase.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

// Service function to sign up a new user
export async function signupUser({ email, username, password, first_name, last_name }) {
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .or(`email.eq.${email},username.eq.${username}`)
    .maybeSingle();

  if (existingUser) {
    const error = new Error('Email or username already exists');
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user in database
  const { data: user, error } = await supabase
    .from('profiles')
    .insert([{
      email,
      username,
      password_hash,
      first_name,
      last_name
    }])
    .select('id, email, username, first_name, last_name, created_at')
    .single();

  if (error) {
    error.statusCode = 400;
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    },
    token
  };
}


// Service function to login a user
export async function loginUser({ email, password }) {
    // Get user from database
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, username, first_name, last_name, password_hash')
      .eq('email', email)
      .single();
  
    if (error || !user) {
      const authError = new Error('Invalid email or password');
      authError.statusCode = 401;
      throw authError;
    }
  
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
  
    if (!isValidPassword) {
      const authError = new Error('Invalid email or password');
      authError.statusCode = 401;
      throw authError;
    }
  
    // Generate JWT token
    const token = generateToken(user.id, user.email);
  
    // Remove password_hash from user object
    const { password_hash, ...userWithoutPassword } = user;
  
    return {
      user: userWithoutPassword,
      token
    };
  }

  
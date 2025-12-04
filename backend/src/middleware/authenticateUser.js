import { supabase } from '../supabase.js';
import { verifyToken } from '../utils/auth.js';



// authentication middleware - this middleware checks if a user is logged in
export async function authenticateUser(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      const decoded = verifyToken(token);
  
      if(!decoded) {
        return res.status(401).json({error: 'Invalid or expired token'});
      }
  
      // changed to get user from profiles table (NOT users)
      const {data: user, error} = await supabase
        .from('profiles')
        .select('id, email, username, first_name, last_name, profile_photo_url, created_at')
        .eq('id', decoded.userId)
        .single();
  
  
      if(error || !user) {
        return res.status(401).json({error: 'User not found'});
      }
      
      // attach user to request object so controllers can access it
      req.user = user;
      next(); // continue to the next middleware or route handler
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }


  // Optional authentication middleware: attach req.user if a valid Bearer token is present,
  // otherwise continue without error. Useful for public endpoints that can optionally
  // include user-specific fields (e.g. is_member).
  export async function maybeAuthenticateUser(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

      const token = authHeader.replace('Bearer ', '');
      const decoded = verifyToken(token);
      if (!decoded) return next();

      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email, username, first_name, last_name, profile_photo_url, created_at')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) return next();

      req.user = user;
      return next();
    } catch (err) {
      return next();
    }
  }


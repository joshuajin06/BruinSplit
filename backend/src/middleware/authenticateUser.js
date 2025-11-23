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
        .select('id, email, username, first_name, last_name')
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


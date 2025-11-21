// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file in root directory
dotenv.config();

// Your Supabase credentials (stored securely in .env)
const supabaseUrl = process.env.SUPABASE_URL;
<<<<<<< HEAD
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // or SUPABASE_ANON_KEY for frontend //UPABASE_SERVICE_ROLE_KEY;
=======
// Prefer service role key on the server (bypasses RLS). Fall back to anon key if not provided.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
>>>>>>> eff0df85571949f6e60ed73232e4f23a75f7402e

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  console.log("SUPABASE_URL:", supabaseUrl);
<<<<<<< HEAD
  console.log("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey);
=======
  console.log("SUPABASE_KEY_PRESENT:", !!supabaseKey);
>>>>>>> eff0df85571949f6e60ed73232e4f23a75f7402e
  throw new Error("Supabase URL and Key are required");
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Using SUPABASE_SERVICE_ROLE_KEY for server-side requests (RLS bypass enabled)');
} else {
  console.log('Using SUPABASE_ANON_KEY for Supabase client (RLS applies)');
}


// Initialize the client
export const supabase = createClient(supabaseUrl, supabaseKey);

// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file in root directory
dotenv.config();

// Your Supabase credentials (stored securely in .env)
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key on the server (bypasses RLS). Fall back to anon key if not provided.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  console.log("SUPABASE_URL:", supabaseUrl);
  console.log("SUPABASE_KEY_PRESENT:", !!supabaseKey);
  throw new Error("Supabase URL and Key are required");
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Using SUPABASE_SERVICE_ROLE_KEY for server-side requests (RLS bypass enabled)');
} else {
  console.log('Using SUPABASE_ANON_KEY for Supabase client (RLS applies)');
}


// Initialize the client
export const supabase = createClient(supabaseUrl, supabaseKey);

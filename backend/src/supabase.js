// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables (this runs when the module is imported)
dotenv.config();

// Your Supabase credentials (stored securely in .env)
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the service role key on the server (bypasses RLS) and fall back to anon if not present
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  console.log("SUPABASE_URL:", supabaseUrl);
  console.log("SUPABASE_SERVICE_ROLE_KEY present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("SUPABASE_ANON_KEY present:", !!process.env.SUPABASE_ANON_KEY);
  throw new Error("Supabase URL and Key are required");
}

// Initialize the client (server should use service role key)
export const supabase = createClient(supabaseUrl, supabaseKey);

// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file in root directory
dotenv.config();

// Your Supabase credentials (stored securely in .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // or SUPABASE_ANON_KEY for frontend //UPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  console.log("SUPABASE_URL:", supabaseUrl);
  console.log("SUPABASE_ANON_KEY:", supabaseKey);
  throw new Error("Supabase URL and Key are required");
}


// Initialize the client
export const supabase = createClient(supabaseUrl, supabaseKey);

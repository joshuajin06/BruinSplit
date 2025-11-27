import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

// Load credentials from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;  // backend key

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🌟 Testing Supabase connection...");

  try {
    const { data, error } = await supabase.from("events").select("*").limit(1);

    if (error) {
      console.error("❌ Supabase error:", error);
      return;
    }

    console.log("✔ Supabase returned data:", data);
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

testConnection();
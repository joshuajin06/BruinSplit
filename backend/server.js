import { supabase } from "./src/lib/supabase.js"
import express from 'express';


const app = express();
app.use(express.json()); // Middleware



app.get("/api/events", async (req, res) => {
  try {
    const { data, error } = await supabase
    .from("events")
    .select('*')

    if(error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
})

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
})
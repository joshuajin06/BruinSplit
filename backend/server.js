import { supabase } from "./src/lib/supabase.js"
import express from 'express';
import cors from 'cors';


const app = express();
app.use(express.json()); // Middleware
app.use(cors()); // Enable CORS for all routes



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

app.post('/api/users', createUser);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
})
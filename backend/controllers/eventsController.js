import { supabase } from "../src/lib/supabase.js"; 

console.log("Supabase client URL from controller:", supabase.restUrl);


export const getEvents = async (req, res) => {
    console.log("Controller hit for GET /api/events");
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true});

    if (error) return res.status(400).json({ error });
    res.json(data);
};  

/*
export const getEvents = async (req, res) => {
    console.log("🔥 getEvents CONTROLLER HIT");
    
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

    if (error) {
        console.log("❌ Supabase error:", error);
        return res.status(400).json({ error });
    }

    console.log("✔ Got events:", data);
    res.json(data);
};
*/

export const createEvent = async (req, res) => {
  // Mock user for testing
  const user = { id: "123e4567-e89b-12d3-a456-426614174000" };

  // Prepare event object with correct columns
  const event = {
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    event_date: req.body.event_date,
    event_type: req.body.event_type || "General", // optional default
    created_by: user.id,
    created_at: new Date().toISOString() // automatically set timestamp
  };

  try {
    const { data, error } = await supabase
      .from("events")
      .insert(event)
      .select();

    if (error) {
      console.log("Supabase error:", error);
      return res.status(400).json({ error });
    }

    console.log("Inserted event:", data[0]);
    res.status(201).json(data[0]);

  } catch (err) {
    console.error("Exception:", err);
    res.status(500).json({ error: err.message });
  }
};

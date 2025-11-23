import { supabase } from "../supabase.js"; 

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

//useful for event details
export const getEventById = async (req, res) => {
  const { id } = req.params; 
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single(); //returns a single element

  if (error) return res.status(404).json({ error: "Event not found" });
  res.json(data);
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
  .from("events")
  .delete()
  .eq("id", id);

  if (error) return req.status(400).json({ error })
  res.json({ message: "Event Deleted" });
}

export const updateEvent = async (req, res) => {
  const { id } = reqparams;
  const updates = req.body;

  const { data, error } = await supabase
  .from("events")
  .update(updates)
  .eq("id", id)
  .select(); //selects all text from an html input field

  if (error) return res.status(400).json({ error });
  res.json(data[0]);
}


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
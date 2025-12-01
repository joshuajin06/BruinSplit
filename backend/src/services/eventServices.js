import { supabase } from '../supabase.js';

export const getAllEvents = async() => {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true});

    if (error) {
        throw new Error(error.message);
    }
    return data;
};  

export const createEventService = async(eventData, userId) => {
    // Prepare event object with correct columns
  const event = {
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    event_date: eventData.event_date,
    event_type: eventData.event_type || "General", // optional default
    created_by: userId,
    created_at: new Date().toISOString() // automatically set timestamp
  };

  const { data, error } = await supabase
      .from("events")
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
};

export const fetchEventByIdService = async(id) => {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single(); //returns a single element

    if (error) throw new Error(error.message);

    return data;
}   

export const deleteEventService = async (eventId, userId) => {
    const event = await fetchEventByIdService(eventId);

    if (event.created_by !== userId) {
        throw new Error("Unauthorized access");
    }

    const { error } = await supabase
        .from("events")
        .delete()   
        .eq("id", eventId);

    if (error) throw new Error(error.message);
    return true;
}

export const updateEventService = async (eventId, updates, userId) => {

    const event = await fetchEventById(eventId);

    if (event.created_by !== userId) {
        throw new Error("Unauthorized access");
    }

    //Sanitize Inputs to only allow certain fields to be updates
    const safeUpdates = {};
    if (updates.title) safeUpdates.title = updates.title;
    if (updates.description) safeUpdates.description = updates.description;
    if (updates.location) safeUpdates.location = updates.location;
    if (updates.event_date) safeUpdates.event_date = updates.event_date;
    if (updates.event_type) safeUpdates.event_type = updates.event_type;

    const { data, error } = await supabase
        .from("events")
        .update(safeUpdates)
        .eq("id", eventId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}
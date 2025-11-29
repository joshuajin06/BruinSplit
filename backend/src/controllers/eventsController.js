import { supabase } from "../supabase.js"; 
import { getAllEvents, createEventService, fetchEventByIdService, deleteEventService, updateEventService} from '../services/eventServices.js';

console.log("Supabase client URL from controller:", supabase.restUrl);



export const getEvents = async (req, res) => {
    try {
        const events = await getAllEvents();
        res.status(200).json(events);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};  



export const createEvent = async (req, res) => {
  const user = req.user; 
  if (!user || !user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const event = await createEventService(req.body, user.id);
    res.status(201).json(event);

  } catch (err) {
    console.error("Create event error:", err);
    res.status(400).json({ error: err.message });
  }
};



//useful for event details
export const getEventById = async (req, res) => {
  const  id  =   Number(req.params.id); //req.params; 

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID provided" });
  }

  try {
    const event = await fetchEventByIdService(id);
    res.json(event);
  } catch (error) {
    res.status(404).json({error: "Event not found"});
  }
};



export const deleteEvent = async (req, res) => {
  const eventId = Number(req.params.id);
  if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid ID format' });
  
  const user = req.user; 
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try{
    await deleteEventService(eventId, user.id);
    res.json({ message: "Event Deleted" });
    
  } catch (error) {

    if (error .message === "Unauthorized access") 
      return res.status(403).json({ error: 'Not authorized to delete this event' });

    res.status(404).json({ error: "Event not found or could not be deleted" });
  }
};




export const updateEvent = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const updatedEvent = await updateEventService(id, req.body, user.id);
        res.json(updatedEvent);
    } catch (error) {
        if (error.message === "Unauthorized access") {
            return res.status(403).json({ error: "Not authorized to update this event" });
        }
        res.status(400).json({ error: error.message });
    }
};

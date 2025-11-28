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

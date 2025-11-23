<<<<<<< HEAD:backend/controllers/controllers.js
import { supabase } from "../src/lib/supabase.js";
=======
const supabase = require('../src/supabase');
>>>>>>> e7060ec459fbaa01082fe561ee6da1182af486a8:backend/src/controllers/controllers.js

export const createUser = async (req, res) => {
    try {
        const { email, password, first_name, last_name, user_name, age } = req.body;
        if (!email || !password || !first_name || !last_name || !user_name || !age) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // check if username already exists
        const {data : existingUser} = await supabase
            .from('users')
            .select('user_name')
            .eq('user_name', user_name)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email or username already exists' });
        }

        // create new user created with the aid of copilot 
        const {data, error} = await supabase
        .from('users') 
        .insert([{
            email,
            password, //should be hashed in future implementation
            first_name,
            last_name,
            user_name,
            age
        }])
        .select()
        .single();
        
        if (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ error: 'Error creating user' });
        }

    } catch (error) {
        console.error("Authentication error:", error.message)
    }

};

export { createUser };


import { supabase } from '../src/lib/supabase.js';


export const createUser = async (req, res) => {
    try {
        const { email, password, first_name, last_name, user_name, age } = req.body;
        if (!email || !password || !first_name || !last_name || !user_name || !age) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: existingByUsername, error: usernameErr } = await supabase
            .from('users')
            .select('id')
            .eq('user_name', user_name)
            .limit(1);

        if (usernameErr) {
            console.error('Error checking username:', usernameErr);
            return res.status(500).json({ error: 'Error checking username' });
        }

        if (existingByUsername && existingByUsername.length > 0) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const { data: existingByEmail, error: emailErr } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (emailErr) {
            console.error('Error checking email:', emailErr);
            return res.status(500).json({ error: 'Error checking email' });
        }

        if (existingByEmail && existingByEmail.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password,
                    first_name,
                    last_name,
                    user_name,
                    age,
                },
            ])
            .select()
            .limit(1);

        if (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ error: 'Error creating user' });
        }
        return res.status(201).json({ user: data && data[0] ? data[0] : data });
    } catch (err) {
        console.error('Unexpected error creating user:', err);
        return res.status(500).json({ error: 'Unexpected server error' });
    }
};

export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Missing user id' });

        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({ error: 'Error fetching user' });
        }

        if (!data) return res.status(404).json({ error: 'User not found' });

        return res.status(200).json({ user: data });
    } catch (err) {
        console.error('Unexpected error fetching user:', err);
        return res.status(500).json({ error: 'Unexpected server error' });
    }
};

export default { createUser, getUser };


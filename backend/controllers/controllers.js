const supabase = require('../src/lib/supabase');

const createUser = async (req, res) => {
    try {
        const {email, password, first_name, last_name, user_name, age} = req.body;
        // check if all fields are provided
        if (!email || !password || !first_name || !last_name || !user_name || !age) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // check if username already exists
        const {data : existingUser} = await supabase
            .from('users')
            .select('user_name')
            .eq('user_name', user_name)
            .single();
        
    } catch (error) {
        console.error('')
    }
};

import { supabase } from '../supabase.js';


// function to get profile info
export async function getProfileService(userId) {

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, username, first_name, last_name, created_at, phone_number, profile_photo_url')
        .eq('id', userId)
        .single();

    if (error) {
        // check if it's a not found error from supabase
        if (error.code === 'PGRST116') {
            const notFoundError = new Error('Profile not found');
            notFoundError.statusCode = 404;
            throw notFoundError;
        }
        // otherwise it's a server/database error
        error.statusCode = 500;
        throw error;
    }

    if (!profile) {
        const notFoundError = new Error('Profile not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return profile;
}

// function to get profile information by ID
export async function getProfileByIdService(userId) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, username, first_name, last_name, created_at, phone_number, profile_photo_url')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            const notFoundError = new Error('Profile not found');
            notFoundError.statusCode = 404;
            throw notFoundError;
        }
        error.statusCode = 500;
        throw error;
    }

    if (!profile) {
        const notFoundError = new Error('Profile not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return profile;

}


// function to update a user's profile
export async function updateProfileService(userId, updates) {

    // will not allow updates to id, email, passwrod_hash, created_at
    const allowedFields = ['first_name', 'last_name', 'username', 'phone_number', 'profile_photo_url'];
    
    // filter the updates object passed into the function to only allow the fields defined above
    // .reduce() builds a new object with only the allowed fields
    const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = updates[key];
            return obj;
        }, {});
    
    // throw error if no valid fields to update
    if (Object.keys(filteredUpdates).length === 0) {
        const error = new Error('No valid fields to update');
        error.statusCode = 400;
        throw error;
    }

    // if username is being updates, check if it's already taken by another user
    if (filteredUpdates.username) {
        const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', filteredUpdates.username)
            .neq('id', userId)
            .maybeSingle();

        if (checkError) {
            checkError.statusCode = 500;
            throw checkError;
        }

        // reject request if another user already has this username
        if (existingUser) {
            const error = new Error('Username already taken');
            error.statusCode = 400;
            throw error;
        }
    }

    // if phone_number is being updated, check if it's already taken by another user
    if (filteredUpdates.phone_number !== undefined && filteredUpdates.phone_number !== null) {
        const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone_number', filteredUpdates.phone_number)
            .neq('id', userId)
            .maybeSingle();

        if (checkError) {
            checkError.statusCode = 500;
            throw checkError;
        }

        // reject request if another user already has this phone number
        if (existingUser) {
            const error = new Error('Phone number is already taken');
            error.statusCode = 400;
            throw error;
        }
    }

    // perform the update to the profile data
    const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', userId)
        .select('id, email, username, first_name, last_name, created_at, phone_number, profile_photo_url')
        .single()
    
    if (error) {

        // check if it's a unique constraint violation (phone_number already exists)
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
            const uniqueError = new Error('Phone number already in use by another account');
            uniqueError.statusCode = 400;
            throw uniqueError;
        }

        // if the user is not found in database
        if (error.code === 'PGRST116') {
            const notFoundError = new Error('Profile not found');
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        error.statusCode = 500
        throw error;
    }

    if (!updatedProfile) {
        const notFoundError = new Error('Profile not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return updatedProfile;

}



import { getProfileService, getProfileByIdService, updateProfileService } from '../services/profileService.js';


// GET /api/profile/me
export async function getProfile(req, res, next) {
    try {

        const userId = req.user.id;

        const profile = await getProfileService(userId);

        return res.status(200).json({
            profile
        });

    } catch (error) {
        console.error('Get profile error:', error);
        next(error);
    }
}


// GET /api/profile/:userId - get any user's public profile
export async function getProfileById(req, res, next) {
    try {

        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const profile = await getProfileByIdService(userId);

        return res.status(200).json({ profile });

    } catch (error) {
        console.error('Get profile by ID error:', error);
        next(error);
    }
}


// PUT /api/profile/me
export async function updateProfile(req, res, next) {
    try {

        const userId = req.user.id;

        const { first_name, last_name, username } = req.body;

        const updates = {};

        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name !== undefined) updates.last_name = last_name;
        if (username !== undefined) updates.username = username;

        // validate that at least one field is being updates
        if(Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'At least one field (first_name, last_name, or username) is required'
            });
        }

        // validate username if provided
        if (updates.username) {

            // trim whitespace
            updates.username = updates.username.trim();

            // minimum length of username must be three
            if (updates.username.length < 3) {
                return res.status(400).json({
                    error: 'Username must be at least 3 characters long'
                });
            }

            // check for invalid characters (anything other than letters, numbers, and underscores)
            if (!/^[a-zA-Z0-9_]+$/.test(updates.username)) {
                return res.status(400).json({
                    error: 'Username can only contain letters, numbers, and underscores'
                });
            }
        }

        // first name cannot be empty
        if (updates.first_name) {
            updates.first_name = updates.first_name.trim();
            if(updates.first_name.length === 0) {
                return res.status(400).json({
                    error: 'First name cannot be empty'
                });
            }
        }

        // last name cannot be empty
        if(updates.last_name) {
            updates.last_name = updates.last_name.trim();
            if (updates.last_name.length === 0) {
                return res.status(400).json({
                    error: 'Last name cannot be empty'
                });
            }
        }

        // call service to update profile
        const updatedProfile = await updateProfileService(userId, updates);

        return res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Update profile error:', error);
        next(error);
    }
}


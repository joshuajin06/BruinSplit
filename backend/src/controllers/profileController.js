import { getProfileService, getProfileByIdService, updateProfileService } from '../services/profileService.js';
import multer from 'multer';
import { uploadProfilePhotoService, deleteProfilePhotoService } from '../services/uploadService.js';


// configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    }
});


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

        const { first_name, last_name, username, phone_number } = req.body;

        const updates = {};

        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name !== undefined) updates.last_name = last_name;
        if (username !== undefined) updates.username = username;
        if (phone_number !== undefined) updates.phone_number = phone_number;

        // validate that at least one field is being updates
        if(Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'At least one field (first_name, last_name, username, or phone_number) is required'
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

        // phone number validation
        if (updates.phone_number !== undefined) {

            // trim whitespace
            updates.phone_number = updates.phone_number.trim();

            // allow empty string to clear/remove phone number (set to null)
            if (updates.phone_number.length === 0) {
                updates.phone_number = null;
            } else {
                // remove common formatting characters for validation (e.g. spaces, dashes, parentheses, dots, etc.)
                const digitsOnly = updates.phone_number.replace(/[\s\-\(\)\.]/g, '');

                // validate that the number must be 10-15 digits
                if (!/^\d{10,15}$/.test(digitsOnly)) {
                    return res.status(400).json({
                        error: 'Phone number must be 10-15 digits'
                    });
                }
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


// POST /api/profile/me/photo - upload profile photo
export async function uploadProfilePhoto(req, res, next) {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // get current profile to delete old photo
        const currentProfile = await getProfileService(userId);
        const oldPhotoUrl = currentProfile.profile_photo_url;

        // upload new photo (automatic JPEG conversion)
        const photoUrl = await uploadProfilePhotoService(
            userId,
            req.file.buffer,
            req.file.mimetype
        );

        // update profile with new photo URL
        const updatedProfile = await updateProfileService(userId, {
            profile_photo_url: photoUrl
        });

        // delete old photo in background (don't wait for it)
        if (oldPhotoUrl) {
            deleteProfilePhotoService(oldPhotoUrl).catch(err => {
                console.error('Failed to delete old profile photo:', err);
            });
        }

        return res.status(200).json({
            message: 'Profile photo uploaded successfully',
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Upload profile photo error:', error);
        next(error);
    }
}

// DELETE /api/profile/me/photo - delete profile photo
export async function deleteProfilePhoto(req, res, next) {
    try {
        const userId = req.user.id;

        // get current profile
        const currentProfile = await getProfileService(userId);
        const photoUrl = currentProfile.profile_photo_url;

        if (!profileUrl) {
            return res.status(400).json({ error: 'No profile photo to delete' });
        }

        // delete from storage
        await deleteProfilePhotoService(photoUrl);

        // update profile to remove photo URL
        const updatedProfile = await updateProfilePhotoService(userId, {
            profile_photo_url: null
        });

        return res.status(200).json({
            message: 'Profile photo deleted successfully',
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Delete profile photo error:', error);
        next(error);
    }
}
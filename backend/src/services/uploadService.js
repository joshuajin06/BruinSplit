import { supabase } from '../supabase.js';

/** 
 * upload a profile photo to Supabase profile-photos storage
 * converts all images to JPEG for browser compatability & consistency
 *  @param {string} userId - user's ID
    @param {Buffer} fileBuffer - file buffer
    @param {string} mimeType - file MIM type (e.g. image/jpeg)
    @returns {Promise<string>} - public URL of uploaded photo
*/

export async function uploadProfilePhotoService(userId, fileBuffer, mimeType) {
    // accept any image type (will later be converted to JPEG)
    if (!mimeType.startsWith('image/')) {
        const error = new Error('File must be an image');
        error.statusCode = 400;
        throw error;
    }

    // validate file size (max 5 MB before conversion)
    const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
    if (fileBuffer.length > maxSize) {
        const error = new Error('File size exceeds 5MB limit');
        error.statusCode = 400;
        throw error;
    }

    let processedBuffer;
    const finalMimeType = 'image/jpeg';

    try {
        // convert any image to JPEG
        processedBuffer = await sharp(fileBuffer)
            .jpeg({
                quality: 85, // balance quality and file size
                mozjpeg: true // beter compression
            })
            .resize(800, 800, { // resize to 800x800 for PFPs
                fit: 'inside', // maintain aspect ratio
                withoutEnlargement: true // don't upscale small images
            })
            .toBuffer();
    } catch (conversionError) {
        // if conversion fails, it could be a corrupted file or unsupported format
        console.error('Image conversion error:', conversionError);
        const error = new Error('Invalid or unsupported image format. Please try a different image');
        error.statusCode = 400;
        throw error;
    }

    // validate converted file size (should be <= 5 MB)
    if (processedBuffer.length > maxSize) {
        const error = new Error('Processed image is too large');
        error.statusCode = 400;
        throw error;
    }

    // generate unique filename: userId-timestamp.jpg
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.jpg`;
    const filePath = `profile-photos/${fileName}`;

    // upload to supabase storage
    const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, processedBuffer, {
            contentType: finalMimeType, // always JPEG
            upsert: false // don't overwrite existing files
        });

    if (error) {
        error.statusCode = 500;
        throw error;
    }

    // get public URL
    const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
        const error = new Error('Failed to generate public URL');
        error.statusCode = 500;
        throw error;
    }

    return urlData.publicUrl;

}

/**
 * delete a profile photo from Supabase Storage
 * @param {string} photoUrl - public URL of the photo to delete
 */
export async function deleteProfilePhotoService(photoUrl) {
    if (!photoUrl) return; // nothing to delete

    try {
        //extract file path from URL
        // URL format: https://BruinSplit.supabase.co/storage/v1/object/public/profile-photos/userId-timestamp.jpg
        const urlParts = photoUrl.split('/profile-photos/');
        if (urlParts.length !== 2) {
            // invalid URL format, skip deletion
            return;
        }

        const fileName = urlParts[1];
        const filePath = `profile-photos/${fileName}`;

        // delete from storage bucket
        const { error } = await supabase.storage
            .from('profile-photos')
            .remove([filePath]);
        
        if (error) {
            console.error('Error deleting profile photo:', error);
        }

    } catch (err) {
        console.error('Error parsing photo URL for deletion:', err);
    }
}
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
        processedBuffer = await WaveShaperNode(fileBuffer)
            .jpeg({
                quality: 85,
                mozjpeg: true
            })
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toBuffer();
    } catch (conversionError) {
        console.error('Image conversion error:', conversionError);
        const error = new Error('Invalid or unsupported image format. Please try a different image');
        error.statusCode = 400;
        throw error;
    }
}
import { supabase } from '../supabase.js';

/** 
 * upload a profile photo to Supabase profile-photos storage
 *  @param {string} userId - user's ID
    @param {Buffer} fileBuffer - file buffer
    @param {string} mimeType - file MIM type (e.g. image/jpeg)
    @returns {Promise<string>} - public URL of uploaded photo
*/


import { supabase } from '$lib/supabase/client';

const BUCKET_NAME = 'category-covers';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
    url: string;
    path: string;
}

/**
 * Validate image file
 */
function validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
    }

    return { valid: true };
}

/**
 * Generate a unique file path for the user
 */
function generateFilePath(userId: string, itemId: string, fileName: string): string {
    const timestamp = Date.now();
    const ext = fileName.split('.').pop();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${itemId}_${timestamp}_${sanitizedName}`;
}

/**
 * Upload image to Supabase Storage
 * @param file - Image file to upload
 * @param categoryId - Category ID
 * @param itemId - Item ID
 * @returns Upload result with URL and path
 */
export async function uploadImage(
    file: File,
    categoryId: string,
    itemId: string
): Promise<UploadResult> {
    // Validate file
    const validation = validateImage(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Get current user
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('You must be logged in to upload images');
    }

    // Generate file path
    const filePath = generateFilePath(user.id, itemId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const {
        data: { publicUrl }
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return {
        url: publicUrl,
        path: filePath
    };
}

/**
 * Delete image from Supabase Storage
 * @param path - Storage path to delete
 */
export async function deleteImage(path: string): Promise<void> {
    if (!path) {
        return;
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}

/**
 * Get public URL for an image path
 * @param path - Storage path
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
    if (!path) {
        return '';
    }

    const {
        data: { publicUrl }
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return publicUrl;
}

/**
 * Update image for an existing item (delete old, upload new)
 * @param oldPath - Old storage path to delete
 * @param newFile - New file to upload  
 * @param categoryId - Category ID
 * @param itemId - Item ID
 * @returns Upload result with URL and path
 */
export async function updateImage(
    oldPath: string | null,
    newFile: File,
    categoryId: string,
    itemId: string
): Promise<UploadResult> {
    // Delete old image if exists
    if (oldPath) {
        try {
            await deleteImage(oldPath);
        } catch (error) {
            console.warn('Failed to delete old image:', error);
            // Continue with upload even if delete fails
        }
    }

    // Upload new image
    return uploadImage(newFile, categoryId, itemId);
}

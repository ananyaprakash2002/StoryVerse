import { supabase } from '$lib/supabase/client';
import type { CategoryItem, CategoryItemInput } from '$lib/types/category';

/**
 * Get all items for a category
 */
export async function getItems(categoryId: string): Promise<CategoryItem[]> {
    const { data, error } = await supabase
        .from('category_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CategoryItem[];
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<CategoryItem> {
    const { data, error } = await supabase
        .from('category_items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as CategoryItem;
}

/**
 * Create a new item in a category
 */
export async function createItem(
    categoryId: string,
    itemData: CategoryItemInput
): Promise<CategoryItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('category_items')
        .insert({
            category_id: categoryId,
            user_id: user.id,
            data: itemData.data,
            cover_image_url: itemData.cover_image_url || null,
            cover_image_path: itemData.cover_image_path || null,
            api_source: itemData.api_source || null,
            api_id: itemData.api_id || null
        })
        .select()
        .single();

    if (error) throw error;
    return data as CategoryItem;
}

/**
 * Update an item
 */
export async function updateItem(id: string, itemData: CategoryItemInput): Promise<CategoryItem> {
    const { data, error } = await supabase
        .from('category_items')
        .update({
            data: itemData.data,
            cover_image_url: itemData.cover_image_url !== undefined ? itemData.cover_image_url : undefined,
            cover_image_path: itemData.cover_image_path !== undefined ? itemData.cover_image_path : undefined,
            api_source: itemData.api_source !== undefined ? itemData.api_source : undefined,
            api_id: itemData.api_id !== undefined ? itemData.api_id : undefined,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CategoryItem;
}

/**
 * Delete an item
 */
export async function deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('category_items').delete().eq('id', id);

    if (error) throw error;
}

/**
 * Search items by field values
 */
export async function searchItems(categoryId: string, searchTerm: string): Promise<CategoryItem[]> {
    // This uses PostgreSQL's jsonb operators to search within the data field
    const { data, error } = await supabase
        .from('category_items')
        .select('*')
        .eq('category_id', categoryId)
        .textSearch('data', searchTerm);

    if (error) {
        // Fallback: get all items and filter client-side
        const allItems = await getItems(categoryId);
        const searchLower = searchTerm.toLowerCase();

        return allItems.filter((item) => {
            const dataString = JSON.stringify(item.data).toLowerCase();
            return dataString.includes(searchLower);
        });
    }

    return data as CategoryItem[];
}

import { supabase } from '$lib/supabase/client';
import type { CategoryField, CategoryFieldInput } from '$lib/types/category';

/**
 * Get all fields for a category
 */
export async function getFieldsForCategory(categoryId: string): Promise<CategoryField[]> {
    const { data, error } = await supabase
        .from('category_fields')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index');

    if (error) throw error;
    return data as CategoryField[];
}

/**
 * Create a new field for a category
 */
export async function createField(
    categoryId: string,
    field: CategoryFieldInput
): Promise<CategoryField> {
    const { data, error } = await supabase
        .from('category_fields')
        .insert({
            category_id: categoryId,
            ...field
        })
        .select()
        .single();

    if (error) throw error;
    return data as CategoryField;
}

/**
 * Update a field
 */
export async function updateField(
    id: string,
    updates: Partial<CategoryFieldInput>
): Promise<CategoryField> {
    const { data, error } = await supabase
        .from('category_fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CategoryField;
}

/**
 * Delete a field
 */
export async function deleteField(id: string): Promise<void> {
    const { error } = await supabase.from('category_fields').delete().eq('id', id);

    if (error) throw error;
}

/**
 * Reorder fields - update order_index for multiple fields
 */
export async function reorderFields(categoryId: string, fieldIds: string[]): Promise<void> {
    const updates = fieldIds.map((id, index) => ({
        id,
        category_id: categoryId,
        order_index: index + 1
    }));

    for (const update of updates) {
        const { error } = await supabase
            .from('category_fields')
            .update({ order_index: update.order_index })
            .eq('id', update.id);

        if (error) throw error;
    }
}

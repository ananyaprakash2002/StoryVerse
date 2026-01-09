import { supabase } from '$lib/supabase/client';
import type { Category, CategoryInput, CategoryUpdate } from '$lib/types/category';

/**
 * Get all categories for the current user (including templates)
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select(
            `
      *,
      fields:category_fields(*)
    `
        )
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Category[];
}

/**
 * Get templates (system categories that users can clone)
 */
export async function getTemplates(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select(
            `
      *,
      fields:category_fields(*)
    `
        )
        .eq('is_template', true)
        .order('name');

    if (error) throw error;
    return data as Category[];
}

/**
 * Get user's own categories (not templates)
 */
export async function getUserCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select(
            `
      *,
      fields:category_fields(*)
    `
        )
        .eq('is_template', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Category[];
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string): Promise<Category> {
    const { data, error } = await supabase
        .from('categories')
        .select(
            `
      *,
      fields:category_fields(*)
    `
        )
        .eq('id', id)
        .single();

    if (error) throw error;

    // Sort fields by order_index
    if (data.fields) {
        data.fields.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    return data as Category;
}

/**
 * Create a new category
 */
export async function createCategory(category: CategoryInput): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('categories')
        .insert({
            user_id: user.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            description: category.description,
            is_template: false
        })
        .select()
        .single();

    if (error) throw error;

    // Create fields if provided
    if (category.fields && category.fields.length > 0) {
        const fieldsToInsert = category.fields.map((field) => ({
            category_id: data.id,
            ...field
        }));

        const { error: fieldsError } = await supabase
            .from('category_fields')
            .insert(fieldsToInsert);

        if (fieldsError) throw fieldsError;
    }

    return data as Category;
}

/**
 * Clone a template category for the current user
 */
export async function cloneTemplate(templateId: string, customName?: string): Promise<Category> {
    const template = await getCategory(templateId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create the category
    const categoryData: CategoryInput = {
        name: customName || template.name,
        icon: template.icon,
        color: template.color,
        description: template.description,
        fields: template.fields?.map((field) => ({
            name: field.name,
            label: field.label,
            field_type: field.field_type,
            placeholder: field.placeholder,
            options: field.options,
            required: field.required,
            order_index: field.order_index
        }))
    };

    return createCategory(categoryData);
}

/**
 * Update a category
 */
export async function updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
        .from('categories')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Category;
}

/**
 * Delete a category and all its items
 */
export async function deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) throw error;
}

/**
 * Get category statistics (item count, etc.)
 */
export async function getCategoryStats(categoryId: string) {
    const { count, error } = await supabase
        .from('category_items')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

    if (error) throw error;

    return {
        total_items: count || 0
    };
}

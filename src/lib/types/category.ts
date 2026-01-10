// Field types supported by the custom categories system
export type FieldType =
    | 'text' // Single line text input
    | 'textarea' // Multi-line text input
    | 'number' // Numeric input
    | 'date' // Date picker
    | 'boolean' // Checkbox
    | 'url' // URL input with validation
    | 'select' // Single select dropdown
    | 'multiselect' // Multiple select dropdown
    | 'tags' // Tag input (freeform text tags)
    | 'rating'; // Star rating (1-5 or configurable)

// Field definition for a category
export interface CategoryField {
    id: string;
    category_id: string;
    name: string; // Internal field name (snake_case)
    label: string; // Display label (human readable)
    field_type: FieldType;
    placeholder?: string;
    options?: any; // For select/multiselect: string[], for rating: {max: number}
    required: boolean;
    order_index: number;
    created_at: string;
}

// Input type for creating a new field
export interface CategoryFieldInput {
    name: string;
    label: string;
    field_type: FieldType;
    placeholder?: string;
    options?: any;
    required: boolean;
    order_index: number;
}

// Category definition
export interface Category {
    id: string;
    user_id: string;
    name: string;
    icon?: string;
    color?: string;
    description?: string;
    is_template: boolean;
    created_at: string;
    updated_at: string;
    fields?: CategoryField[]; // Populated when needed
}

// Input type for creating a new category
export interface CategoryInput {
    name: string;
    icon?: string;
    color?: string;
    description?: string;
    fields?: CategoryFieldInput[];
}

// Update type for categories
export interface CategoryUpdate {
    name?: string;
    icon?: string;
    color?: string;
    description?: string;
}

// Item within a category
export interface CategoryItem {
    id: string;
    category_id: string;
    user_id: string;
    data: Record<string, any>; // Dynamic data based on category fields
    created_at: string;
    updated_at: string;
    cover_image_url?: string; // URL to cover image (external or Supabase storage)
    cover_image_path?: string; // Storage path if uploaded to Supabase storage
    api_source?: 'google_books' | null; // Source API for auto-filled data
    api_id?: string; // ID from the external API for reference
}

// Input type for creating/updating items
export interface CategoryItemInput {
    data: Record<string, any>;
    cover_image_url?: string;
    cover_image_path?: string;
    api_source?: 'google_books' | null;
    api_id?: string;
}

// Template for creating categories from predefined structures
export interface CategoryTemplate {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    fields: CategoryFieldInput[];
}

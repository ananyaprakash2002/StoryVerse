// Search-related type definitions
import type { CategoryItem, Category } from './category';

// Search filters
export interface SearchFilters {
    categoryIds?: string[]; // Filter by specific categories
    dateFrom?: string; // Created after this date
    dateTo?: string; // Created before this date
    ratingMin?: number; // Minimum rating  
    ratingMax?: number; // Maximum rating
    tags?: string[]; // Filter by tags
    status?: string; // Filter by status field
    sortBy?: 'relevance' | 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';
}

// Search result with category info
export interface SearchResult {
    item: CategoryItem;
    category: Category;
    matchedFields: string[]; // Which fields matched the search
    rank: number; // Search ranking score
}

// Search response
export interface SearchResponse {
    results: SearchResult[];
    totalCount: number;
    query: string;
    filters: SearchFilters;
}

// Search suggestion
export interface SearchSuggestion {
    text: string;
    type: 'recent' | 'popular' | 'suggestion';
    categoryId?: string;
    itemId?: string;
}

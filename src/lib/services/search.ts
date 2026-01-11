import { supabase } from '$lib/supabase/client';
import { error as logError } from '$lib/utils/logger';
import { getUserCategories } from './categories';
import type { SearchFilters, SearchResult, SearchResponse, SearchSuggestion } from '$lib/types/search';
import type { CategoryItem, Category } from '$lib/types/category';

// Recent searches stored in localStorage
const RECENT_SEARCHES_KEY = 'storyverse_recent_searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Get recent search queries from localStorage
 */
export function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];

    try {
        const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
        return recent ? JSON.parse(recent) : [];
    } catch {
        return [];
    }
}

/**
 * Save a search query to recent searches
 */
export function saveRecentSearch(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return;

    try {
        const recent = getRecentSearches();
        const updated = [query, ...recent.filter(q => q !== query)].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
        logError('Failed to save recent search:', error);
    }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(RECENT_SEARCHES_KEY);
}

/**
 * Global search across all categories
 * @param query - Search query
 * @param filters - Optional filters
 * @returns Search response with results
 */
export async function globalSearch(
    query: string,
    filters: SearchFilters = {}
): Promise<SearchResponse> {
    if (!query.trim()) {
        return {
            results: [],
            totalCount: 0,
            query,
            filters
        };
    }

    try {
        // Get all user categories first
        const categories = await getUserCategories();
        const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

        // Build query
        let supabaseQuery = supabase
            .from('category_items')
            .select('*');

        // Apply category filter
        if (filters.categoryIds && filters.categoryIds.length > 0) {
            supabaseQuery = supabaseQuery.in('category_id', filters.categoryIds);
        } else {
            // Only search in user's categories
            const categoryIds = categories.map(cat => cat.id);
            if (categoryIds.length === 0) {
                return { results: [], totalCount: 0, query, filters };
            }
            supabaseQuery = supabaseQuery.in('category_id', categoryIds);
        }

        // Apply date filters
        if (filters.dateFrom) {
            supabaseQuery = supabaseQuery.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            supabaseQuery = supabaseQuery.lte('created_at', filters.dateTo);
        }

        const { data: items, error } = await supabaseQuery;

        if (error) {
            logError('Search error:', error);
            throw error;
        }

        if (!items || items.length === 0) {
            return { results: [], totalCount: 0, query, filters };
        }

        // Filter and rank results client-side
        const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const results: SearchResult[] = [];

        for (const item of items as CategoryItem[]) {
            const category = categoryMap.get(item.category_id);
            if (!category) continue;

            // Search in all data fields
            const dataStr = JSON.stringify(item.data).toLowerCase();
            const matchedFields: string[] = [];
            let rank = 0;

            // Check each search term
            for (const term of searchTerms) {
                if (dataStr.includes(term)) {
                    rank += 1;

                    // Check which specific fields matched
                    for (const [key, value] of Object.entries(item.data)) {
                        if (String(value).toLowerCase().includes(term)) {
                            if (!matchedFields.includes(key)) {
                                matchedFields.push(key);
                            }
                        }
                    }
                }
            }

            // If no match, skip this item
            if (rank === 0) continue;

            // Boost rank for exact matches in common fields
            const titleFields = ['title', 'name', 'item_name'];
            for (const field of titleFields) {
                if (item.data[field]) {
                    const fieldValue = String(item.data[field]).toLowerCase();
                    if (searchTerms.some(term => fieldValue.includes(term))) {
                        rank += 2; // Boost for title matches
                    }
                }
            }

            // Apply rating filter
            if (filters.ratingMin !== undefined || filters.ratingMax !== undefined) {
                const rating = item.data.rating;
                if (typeof rating === 'number') {
                    if (filters.ratingMin !== undefined && rating < filters.ratingMin) continue;
                    if (filters.ratingMax !== undefined && rating > filters.ratingMax) continue;
                } else if (filters.ratingMin !== undefined || filters.ratingMax !== undefined) {
                    continue; // Skip items without rating if rating filter is applied
                }
            }

            // Apply status filter
            if (filters.status && item.data.status !== filters.status) {
                continue;
            }

            // Apply tags filter
            if (filters.tags && filters.tags.length > 0) {
                const itemTags = item.data.tags;
                if (!Array.isArray(itemTags)) continue;
                const hasMatchingTag = filters.tags.some(tag => itemTags.includes(tag));
                if (!hasMatchingTag) continue;
            }

            results.push({
                item,
                category,
                matchedFields,
                rank
            });
        }

        // Sort results
        const sortBy = filters.sortBy || 'relevance';
        results.sort((a, b) => {
            switch (sortBy) {
                case 'relevance':
                    return b.rank - a.rank;
                case 'date_desc':
                    return new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime();
                case 'date_asc':
                    return new Date(a.item.created_at).getTime() - new Date(b.item.created_at).getTime();
                case 'rating_desc':
                    return (b.item.data.rating || 0) - (a.item.data.rating || 0);
                case 'rating_asc':
                    return (a.item.data.rating || 0) - (b.item.data.rating || 0);
                default:
                    return b.rank - a.rank;
            }
        });

        // Save search query
        saveRecentSearch(query);

        return {
            results,
            totalCount: results.length,
            query,
            filters
        };
    } catch (error) {
        logError('Global search error:', error);
        throw error;
    }
}

/**
 * Search within a specific category
 * @param categoryId - Category ID to search in
 * @param query - Search query
 * @param filters - Optional filters
 * @returns Search results
 */
export async function searchByCategory(
    categoryId: string,
    query: string,
    filters: SearchFilters = {}
): Promise<SearchResult[]> {
    const response = await globalSearch(query, {
        ...filters,
        categoryIds: [categoryId]
    });

    return response.results;
}

/**
 * Get search suggestions based on recent searches
 * @param query - Current query
 * @returns Array of suggestions
 */
export function getSearchSuggestions(query: string): SearchSuggestion[] {
    const recent = getRecentSearches();
    const lowerQuery = query.toLowerCase();

    return recent
        .filter(search => search.toLowerCase().includes(lowerQuery))
        .slice(0, 5)
        .map(text => ({
            text,
            type: 'recent' as const
        }));
}

import type { GoogleBooksSearchResponse, GoogleBooksVolume, BookData, APIError } from '$lib/types/api';

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

// Get API key from environment variable
const getApiKey = (): string => {
    const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    if (!key) {
        console.warn('Google Books API key not configured. API calls may be rate-limited.');
    }
    return key || '';
};

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data as T;
    }
    cache.delete(key);
    return null;
}

function setCache(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Normalize Google Books volume to our BookData format
function normalizeBookData(volume: GoogleBooksVolume): BookData {
    const info = volume.volumeInfo;

    // Get best quality cover image
    const coverImage = info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.small ||
        info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail;

    // Get ISBN
    const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    const isbn = isbn13 || isbn10;

    return {
        id: volume.id,
        title: info.title,
        authors: info.authors,
        description: info.description,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        categories: info.categories,
        rating: info.averageRating,
        coverImage: coverImage?.replace('http:', 'https:'), // Force HTTPS
        isbn,
        language: info.language,
        publisher: info.publisher
    };
}

/**
 * Search for books using the Google Books API
 * @param query - Search query (title, author, ISBN, etc.)
 * @param maxResults - Maximum number of results to return (default: 10)
 * @returns Array of normalized book data
 */
export async function searchBooks(query: string, maxResults: number = 10): Promise<BookData[]> {
    if (!query.trim()) {
        return [];
    }

    const cacheKey = `search:${query}:${maxResults}`;
    const cached = getCached<BookData[]>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const apiKey = getApiKey();
        const params = new URLSearchParams({
            q: query,
            maxResults: Math.min(maxResults, 40).toString(), // Google Books max is 40
            printType: 'books',
            orderBy: 'relevance'
        });

        if (apiKey) {
            params.append('key', apiKey);
        }

        const url = `${GOOGLE_BOOKS_API_BASE}/volumes?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data: GoogleBooksSearchResponse = await response.json();

        if (!data.items || data.items.length === 0) {
            return [];
        }

        const books = data.items.map(normalizeBookData);
        setCache(cacheKey, books);

        return books;
    } catch (error) {
        console.error('Google Books API search error:', error);
        console.error('API Key present:', !!getApiKey());
        console.error('Query:', query);

        // Better error message based on error type
        let errorMessage = 'Failed to search books. ';
        if (error instanceof Error && error.message.includes('403')) {
            errorMessage += 'API key may be invalid or Books API not enabled.';
        } else if (error instanceof Error && error.message.includes('429')) {
            errorMessage += 'API quota exceeded. Try again later.';
        } else {
            errorMessage += 'Please check browser console for details.';
        }

        throw {
            message: errorMessage,
            details: error
        } as APIError;
    }
}

/**
 * Get detailed information about a specific book
 * @param id - Google Books volume ID
 * @returns Detailed book data
 */
export async function getBookDetails(id: string): Promise<BookData> {
    const cacheKey = `details:${id}`;
    const cached = getCached<BookData>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const apiKey = getApiKey();
        const params = new URLSearchParams();
        if (apiKey) {
            params.append('key', apiKey);
        }

        const url = `${GOOGLE_BOOKS_API_BASE}/volumes/${id}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const volume: GoogleBooksVolume = await response.json();
        const book = normalizeBookData(volume);

        setCache(cacheKey, book);
        return book;
    } catch (error) {
        console.error('Google Books API details error:', error);
        throw {
            message: 'Failed to get book details. Please try again.',
            details: error
        } as APIError;
    }
}

/**
 * Search by ISBN (more precise than general search)
 * @param isbn - ISBN-10 or ISBN-13
 * @returns Book data or null if not found
 */
export async function searchByISBN(isbn: string): Promise<BookData | null> {
    const books = await searchBooks(`isbn:${isbn}`, 1);
    return books.length > 0 ? books[0] : null;
}

/**
 * Clear the API cache (useful for testing or if stale data is suspected)
 */
export function clearCache(): void {
    cache.clear();
}

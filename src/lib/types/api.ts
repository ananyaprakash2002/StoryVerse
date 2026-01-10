// API integration type definitions

// Google Books API types
export interface GoogleBooksVolume {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        description?: string;
        publishedDate?: string;
        pageCount?: number;
        categories?: string[];
        averageRating?: number;
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
            small?: string;
            medium?: string;
            large?: string;
        };
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
        language?: string;
        publisher?: string;
    };
}

export interface GoogleBooksSearchResponse {
    kind: string;
    totalItems: number;
    items?: GoogleBooksVolume[];
}

// Normalized book data for our app
export interface BookData {
    id: string;
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    rating?: number;
    coverImage?: string;
    isbn?: string;
    language?: string;
    publisher?: string;
}

// API error type
export interface APIError {
    message: string;
    code?: number;
    details?: any;
}

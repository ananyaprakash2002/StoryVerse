// AniList GraphQL API integration
// Docs: https://docs.anilist.co/guide/graphql/

import { error as logError } from '$lib/utils/logger';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Types for AniList API response
export interface AniListMedia {
    id: number;
    title: {
        romaji: string;
        english: string | null;
        native: string | null;
    };
    description: string | null;
    episodes: number | null;
    chapters: number | null;
    volumes: number | null;
    status: string | null;
    genres: string[];
    averageScore: number | null;
    coverImage: {
        large: string | null;
        medium: string | null;
    };
    startDate: {
        year: number | null;
        month: number | null;
        day: number | null;
    } | null;
    endDate: {
        year: number | null;
        month: number | null;
        day: number | null;
    } | null;
    studios: {
        nodes: Array<{ name: string }>;
    } | null;
    format: string | null;
    season: string | null;
    seasonYear: number | null;
    source: string | null;
    duration: number | null;
    synonyms: string[];
    siteUrl: string;
}

// Normalized data for our app
export interface AnimeData {
    id: string;
    title: string;
    titleEnglish: string | null;
    titleNative: string | null;
    description: string | null;
    episodes: number | null;
    chapters: number | null;
    volumes: number | null;
    status: string | null;
    genres: string[];
    score: number | null;
    coverImage: string | null;
    startDate: string | null;
    endDate: string | null;
    studios: string[];
    format: string | null;
    season: string | null;
    source: string | null;
    duration: number | null;
    siteUrl: string;
    type: 'ANIME' | 'MANGA';
}

// Cache for API responses
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

// GraphQL query for searching media
const SEARCH_MEDIA_QUERY = `
query ($search: String, $type: MediaType, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
        media(search: $search, type: $type, sort: POPULARITY_DESC) {
            id
            title {
                romaji
                english
                native
            }
            description(asHtml: false)
            episodes
            chapters
            volumes
            status
            genres
            averageScore
            coverImage {
                large
                medium
            }
            startDate {
                year
                month
                day
            }
            endDate {
                year
                month
                day
            }
            studios {
                nodes {
                    name
                }
            }
            format
            season
            seasonYear
            source
            duration
            synonyms
            siteUrl
        }
    }
}
`;

// Format date from AniList format
function formatDate(date: { year: number | null; month: number | null; day: number | null } | null): string | null {
    if (!date || !date.year) return null;
    const parts = [date.year];
    if (date.month) parts.push(date.month);
    if (date.day) parts.push(date.day);
    return parts.map(p => String(p).padStart(2, '0')).join('-');
}

// Remove HTML tags from description
function stripHtml(html: string | null): string | null {
    if (!html) return null;
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Normalize AniList media to our app format
function normalizeMedia(media: AniListMedia, type: 'ANIME' | 'MANGA'): AnimeData {
    return {
        id: String(media.id),
        title: media.title.english || media.title.romaji,
        titleEnglish: media.title.english,
        titleNative: media.title.native,
        description: stripHtml(media.description),
        episodes: media.episodes,
        chapters: media.chapters,
        volumes: media.volumes,
        status: media.status?.replace(/_/g, ' ') || null,
        genres: media.genres || [],
        score: media.averageScore ? media.averageScore / 10 : null, // Convert to 0-10 scale
        coverImage: media.coverImage?.large || media.coverImage?.medium || null,
        startDate: formatDate(media.startDate),
        endDate: formatDate(media.endDate),
        studios: media.studios?.nodes.map(s => s.name) || [],
        format: media.format?.replace(/_/g, ' ') || null,
        season: media.season ? `${media.season} ${media.seasonYear || ''}`.trim() : null,
        source: media.source?.replace(/_/g, ' ') || null,
        duration: media.duration,
        siteUrl: media.siteUrl,
        type
    };
}

// Make GraphQL request
async function graphqlRequest(query: string, variables: Record<string, any>): Promise<any> {
    const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AniList API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();

    if (json.errors) {
        throw new Error(`AniList GraphQL error: ${json.errors[0]?.message || 'Unknown error'}`);
    }

    return json.data;
}

/**
 * Search for anime by title
 * @param query - Search query
 * @param maxResults - Maximum number of results (default: 10)
 */
export async function searchAnime(query: string, maxResults: number = 10): Promise<AnimeData[]> {
    if (!query.trim()) return [];

    const cacheKey = `anime:${query}:${maxResults}`;
    const cached = getCached<AnimeData[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await graphqlRequest(SEARCH_MEDIA_QUERY, {
            search: query,
            type: 'ANIME',
            perPage: Math.min(maxResults, 25)
        });

        const results = (data.Page?.media || []).map((m: AniListMedia) => normalizeMedia(m, 'ANIME'));
        setCache(cacheKey, results);
        return results;
    } catch (error) {
        logError('AniList anime search error:', error);
        throw error;
    }
}

/**
 * Search for manga by title
 * @param query - Search query
 * @param maxResults - Maximum number of results (default: 10)
 */
export async function searchManga(query: string, maxResults: number = 10): Promise<AnimeData[]> {
    if (!query.trim()) return [];

    const cacheKey = `manga:${query}:${maxResults}`;
    const cached = getCached<AnimeData[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await graphqlRequest(SEARCH_MEDIA_QUERY, {
            search: query,
            type: 'MANGA',
            perPage: Math.min(maxResults, 25)
        });

        const results = (data.Page?.media || []).map((m: AniListMedia) => normalizeMedia(m, 'MANGA'));
        setCache(cacheKey, results);
        return results;
    } catch (error) {
        logError('AniList manga search error:', error);
        throw error;
    }
}

/**
 * Clear the API cache
 */
export function clearCache(): void {
    cache.clear();
}

import { supabase } from '$lib/supabase/client';

export interface DashboardStats {
    totalBooks: number;
    totalManga: number;
    totalAnime: number;
    totalMovies: number;
    completedBooks: number;
    completedManga: number;
    completedAnime: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const [books, manga, anime, movies] = await Promise.all([
        supabase.from('books').select('*'),
        supabase.from('manga').select('*'),
        supabase.from('anime').select('*'),
        supabase.from('movies').select('*')
    ]);

    return {
        totalBooks: books.data?.length || 0,
        totalManga: manga.data?.length || 0,
        totalAnime: anime.data?.length || 0,
        totalMovies: movies.data?.length || 0,
        completedBooks: books.data?.filter((b) => b.completed).length || 0,
        completedManga: manga.data?.filter((m) => m.completed).length || 0,
        completedAnime: anime.data?.filter((a) => a.completed).length || 0
    };
}

export async function getRecentActivity() {
    const [books, manga, anime, movies] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('manga').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('anime').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('movies').select('*').order('created_at', { ascending: false }).limit(3)
    ]);

    return {
        books: books.data || [],
        manga: manga.data || [],
        anime: anime.data || [],
        movies: movies.data || []
    };
}

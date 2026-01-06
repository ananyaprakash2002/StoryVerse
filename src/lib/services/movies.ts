import { supabase } from '$lib/supabase/client';
import type { Movie, MovieInput, MovieUpdate } from '$lib/types';

export async function getMovies() {
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('date_watched', { ascending: false });

    if (error) throw error;
    return data as Movie[];
}

export async function getMovie(id: string) {
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Movie;
}

export async function createMovie(movie: MovieInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('movies')
        .insert({ ...movie, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data as Movie;
}

export async function updateMovie(id: string, updates: MovieUpdate) {
    const { data, error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Movie;
}

export async function deleteMovie(id: string) {
    const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

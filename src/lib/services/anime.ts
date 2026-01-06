import { supabase } from '$lib/supabase/client';
import type { Anime, AnimeInput, AnimeUpdate } from '$lib/types';

export async function getAnime() {
    const { data, error } = await supabase
        .from('anime')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Anime[];
}

export async function getAnimeById(id: string) {
    const { data, error } = await supabase
        .from('anime')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Anime;
}

export async function createAnime(anime: AnimeInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('anime')
        .insert({ ...anime, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data as Anime;
}

export async function updateAnime(id: string, updates: AnimeUpdate) {
    const { data, error } = await supabase
        .from('anime')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Anime;
}

export async function deleteAnime(id: string) {
    const { error } = await supabase
        .from('anime')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

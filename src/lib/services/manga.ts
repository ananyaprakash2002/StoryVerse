import { supabase } from '$lib/supabase/client';
import type { Manga, MangaInput, MangaUpdate } from '$lib/types';

export async function getManga() {
    const { data, error } = await supabase
        .from('manga')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Manga[];
}

export async function getMangaById(id: string) {
    const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Manga;
}

export async function createManga(manga: MangaInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('manga')
        .insert({ ...manga, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data as Manga;
}

export async function updateManga(id: string, updates: MangaUpdate) {
    const { data, error } = await supabase
        .from('manga')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Manga;
}

export async function deleteManga(id: string) {
    const { error } = await supabase
        .from('manga')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

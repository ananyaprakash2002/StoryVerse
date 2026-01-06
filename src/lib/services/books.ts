import { supabase } from '$lib/supabase/client';
import type { Book, BookInput, BookUpdate } from '$lib/types';

export async function getBooks() {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Book[];
}

export async function getBook(id: string) {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Book;
}

export async function createBook(book: BookInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('books')
        .insert({ ...book, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data as Book;
}

export async function updateBook(id: string, updates: BookUpdate) {
    const { data, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Book;
}

export async function deleteBook(id: string) {
    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

import { supabase } from './client';
import type { User } from '@supabase/supabase-js';

export interface AuthError {
    message: string;
}

export interface AuthResponse {
    user: User | null;
    error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    return {
        user: data.user,
        error: error ? { message: error.message } : null
    };
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return {
        user: data.user,
        error: error ? { message: error.message } : null
    };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return {
        error: error ? { message: error.message } : null
    };
}

/**
 * Get the current user session
 */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    return {
        session: data.session,
        error: error ? { message: error.message } : null
    };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}

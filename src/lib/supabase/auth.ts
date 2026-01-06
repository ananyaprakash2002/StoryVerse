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
 * Sign up a new user with username, email and password
 */
export async function signUp(
    username: string,
    email: string,
    password: string
): Promise<AuthResponse> {
    // Check if username already exists
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    if (existingProfile) {
        return {
            user: null,
            error: { message: 'Username already taken' }
        };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });

    return {
        user: data.user,
        error: error ? { message: error.message } : null
    };
}

/**
 * Sign in with username and password
 */
export async function signIn(username: string, password: string): Promise<AuthResponse> {
    // Look up email from username
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single();

    if (profileError || !profile) {
        return {
            user: null,
            error: { message: 'Invalid username or password' }
        };
    }

    // Sign in with the email
    const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
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

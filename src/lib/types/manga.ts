export interface Manga {
    id: string;
    user_id: string;
    name: string;
    chapter: number;
    completed: boolean;
    link: string | null;
    date_started: string | null;
    date_completed: string | null;
    notes: string | null;
    created_at: string;
}

export interface MangaInput {
    name: string;
    chapter?: number;
    completed?: boolean;
    link?: string;
    date_started?: string;
    date_completed?: string;
    notes?: string;
}

export interface MangaUpdate {
    name?: string;
    chapter?: number;
    completed?: boolean;
    link?: string;
    date_started?: string;
    date_completed?: string;
    notes?: string;
}

export interface Anime {
    id: string;
    user_id: string;
    name: string;
    season: number;
    episode: number;
    completed: boolean;
    link: string | null;
    date_started: string | null;
    date_completed: string | null;
    notes: string | null;
    created_at: string;
}

export interface AnimeInput {
    name: string;
    season?: number;
    episode?: number;
    completed?: boolean;
    link?: string;
    date_started?: string;
    date_completed?: string;
    notes?: string;
}

export interface AnimeUpdate {
    name?: string;
    season?: number;
    episode?: number;
    completed?: boolean;
    link?: string;
    date_started?: string;
    date_completed?: string;
    notes?: string;
}

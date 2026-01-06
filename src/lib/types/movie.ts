export interface Movie {
    id: string;
    user_id: string;
    name: string;
    date_watched: string;
    notes: string | null;
    created_at: string;
}

export interface MovieInput {
    name: string;
    date_watched: string;
    notes?: string;
}

export interface MovieUpdate {
    name?: string;
    date_watched?: string;
    notes?: string;
}

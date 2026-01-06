export interface Book {
    id: string;
    user_id: string;
    title: string;
    author: string | null;
    completed: boolean;
    date_started: string | null;
    date_completed: string | null;
    notes: string | null;
    created_at: string;
}

export interface BookInput {
    title: string;
    author?: string;
    completed?: boolean;
    date_started?: string;
    date_completed?: string;
    notes?: string;
}

export interface BookUpdate {
    title?: string;
    author?: string;
    completed?: boolean;
    date_started?: string;
    date_completed?: string;
    notes?: string;
}

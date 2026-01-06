import { writable } from 'svelte/store';

export interface ToastMessage {
    type: 'success' | 'error' | 'info';
    message: string;
    id: number;
}

function createToastStore() {
    const { subscribe, update } = writable<ToastMessage[]>([]);

    let nextId = 0;

    return {
        subscribe,
        success: (message: string) => {
            const id = nextId++;
            update((toasts) => [...toasts, { type: 'success', message, id }]);
            setTimeout(() => remove(id), 3000);
        },
        error: (message: string) => {
            const id = nextId++;
            update((toasts) => [...toasts, { type: 'error', message, id }]);
            setTimeout(() => remove(id), 5000);
        },
        info: (message: string) => {
            const id = nextId++;
            update((toasts) => [...toasts, { type: 'info', message, id }]);
            setTimeout(() => remove(id), 3000);
        },
        remove: (id: number) => {
            update((toasts) => toasts.filter((t) => t.id !== id));
        }
    };

    function remove(id: number) {
        update((toasts) => toasts.filter((t) => t.id !== id));
    }
}

export const toasts = createToastStore();

export const isLoading = writable(false);

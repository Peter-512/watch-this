import { writable } from 'svelte/store';

interface Toast {
	id: number;
	type: keyof (typeof import('./components/ui/alert/index').alertVariants)['variants']['variant'];
	timeout: number;
	title: string;
	message: string;
}

type AddToast = Partial<Toast> & Pick<Toast, 'title' | 'message'>;
export const toasts = writable<Toast[]>([]);

export const addToast = (toast: AddToast) => {
	const id = Math.floor(Math.random() * 10000);

	const defaults = {
		id,
		type: 'default' as const,
		timeout: 5000
	};

	const newToast = { ...defaults, ...toast };

	toasts.update((all) => [newToast, ...all]);

	if (newToast.timeout) setTimeout(() => dismissToast(id), newToast.timeout);
};

export const dismissToast = (id: number) => {
	toasts.update((all) => all.filter((t) => t.id !== id));
};

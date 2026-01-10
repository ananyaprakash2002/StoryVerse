<script lang="ts">
	import { theme } from '$lib/stores/theme';

	function handleToggle() {
		theme.toggle();
	}

	let currentTheme: 'light' | 'dark';
	theme.subscribe(val => currentTheme = val);
</script>

<button 
	class="theme-toggle"
	onclick={handleToggle}
	aria-label="Toggle theme"
	title="Toggle light/dark mode"
>
	{#if currentTheme === 'dark'}
		<span class="icon">☀️</span>
		<span class="label">Light</span>
	{:else}
		<span class="icon">🌙</span>
		<span class="label">Dark</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.theme-toggle:hover {
		background: var(--bg-elevated);
		border-color: var(--border-light);
		transform: translateY(-1px);
	}

	.icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.label {
		@media (max-width: 640px) {
			display: none;
		}
	}
</style>

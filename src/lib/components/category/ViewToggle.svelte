<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		currentView: 'table' | 'grid';
	}

	let { currentView }: Props = $props();

	const dispatch = createEventDispatcher<{ change: 'table' | 'grid' }>();

	function handleToggle(view: 'table' | 'grid') {
		console.log('ViewToggle: switching to', view);
		dispatch('change', view);
	}
</script>

<div class="view-toggle">
	<button
		class="toggle-btn"
		class:active={currentView === 'table'}
		onclick={() => handleToggle('table')}
		aria-label="Table view"
		title="Table view"
	>
		<span class="icon">📋</span>
		<span class="label">Table</span>
	</button>
	<button
		class="toggle-btn"
		class:active={currentView === 'grid'}
		onclick={() => handleToggle('grid')}
		aria-label="Grid view"
		title="Grid view"
	>
		<span class="icon">🎴</span>
		<span class="label">Grid</span>
	</button>
</div>

<style>
	.view-toggle {
		display: flex;
		gap: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: transparent;
		border: none;
		border-right: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.toggle-btn:last-child {
		border-right: none;
	}

	.toggle-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.toggle-btn.active {
		background: var(--primary);
		color: white;
	}

	.icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	@media (max-width: 640px) {
		.label {
			display: none;
		}

		.toggle-btn {
			padding: var(--space-sm);
		}
	}
</style>

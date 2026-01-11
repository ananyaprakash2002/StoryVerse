<script lang="ts">
	import { goto } from '$app/navigation';
	import { createCategory } from '$lib/services/categories';
	import { toasts } from '$lib/stores/ui';
	import type { CategoryFieldInput } from '$lib/types/category';
	import Button from '$lib/components/common/Button.svelte';
	import Input from '$lib/components/common/Input.svelte';
	import FieldBuilder from '$lib/components/category/FieldBuilder.svelte';

	let name = '';
	let icon = '📁';
	let color = '#60a5fa';
	let description = '';
	let fields: CategoryFieldInput[] = [];
	let saving = false;

	const iconOptions = ['📁', '📚', '🎬', '🎮', '🎵', '💼', '🏋️', '🍳', '✈️', '🎨', '💡', '🔧'];
	const colorOptions = [
		'#60a5fa',
		'#10b981',
		'#ef4444',
		'#f59e0b',
		'#8b5cf6',
		'#ec4899',
		'#06b6d4',
		'#84cc16'
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!name.trim()) {
			toasts.error('Category name is required');
			return;
		}

		saving = true;
		try {
		const category = await createCategory({
			name: name.trim(),
			icon,
			color,
			description: description.trim(),
			fields
		});

		toasts.success('Category created successfully!');
		goto(`/categories/${category.id}`);
		} catch (err: any) {
			toasts.error(err.message || 'Failed to create category');
		} finally {
			saving = false;
		}
	}
</script>

<div class="page container">
	<div class="page-header">
		<div>
			<button class="back-button" on:click={() => goto('/categories')}>
				← Back to Categories
			</button>
			<h1>Create Custom Category</h1>
			<p class="text-muted">Build a category from scratch</p>
		</div>
	</div>

	<div class="form-card card">
		<form on:submit={handleSubmit}>
			<Input label="Category Name" bind:value={name} placeholder="e.g., Video Games, Podcasts" required />

			<fieldset class="form-group">
				<legend class="form-label">Icon</legend>
				<div class="icon-grid">
					{#each iconOptions as iconOption}
						<button
							type="button"
							class="icon-button"
							class:active={icon === iconOption}
							on:click={() => (icon = iconOption)}
							aria-label="Select icon {iconOption}"
						>
							{iconOption}
						</button>
					{/each}
				</div>
			</fieldset>

			<fieldset class="form-group">
				<legend class="form-label">Color</legend>
				<div class="color-grid">
					{#each colorOptions as colorOption}
						<button
							type="button"
							class="color-button"
							class:active={color === colorOption}
							style="background-color: {colorOption}"
							on:click={() => (color = colorOption)}
							aria-label="Select color {colorOption}"
						>
							{#if color === colorOption}
								✓
							{/if}
						</button>
					{/each}
				</div>
			</fieldset>

			<div class="form-group">
				<label for="description" class="form-label">Description (Optional)</label>
				<textarea
					id="description"
					class="form-textarea"
					bind:value={description}
					placeholder="What will you track in this category?"
					rows="3"
				></textarea>
			</div>

			<!-- Field Builder -->
			<FieldBuilder bind:fields />

			<div class="form-actions">
				<Button type="button" variant="secondary" onClick={() => goto('/categories')}>
					Cancel
				</Button>
				<Button type="submit" variant="primary" disabled={saving}>
					{saving ? 'Creating...' : 'Create Category'}
				</Button>
			</div>
		</form>

		<div class="help-text">
			<p>💡 <strong>Tip:</strong> Add fields above to define what data you want to track.</p>
		</div>
	</div>
</div>

<style>
	.page-header {
		margin-bottom: var(--space-2xl);
	}

	.back-button {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
		padding: 0;
		transition: color var(--transition-fast);
	}

	.back-button:hover {
		color: var(--primary-hover);
	}

	.form-card {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-2xl);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	legend {
		padding: 0;
	}

	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
		gap: var(--space-sm);
	}

	.icon-button {
		aspect-ratio: 1;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-md);
		font-size: 2rem;
		cursor: pointer;
		transition: all var(--transition-fast);
		padding: var(--space-sm);
	}

	.icon-button:hover {
		border-color: var(--primary);
		transform: scale(1.05);
	}

	.icon-button.active {
		border-color: var(--primary);
		background: rgba(96, 165, 250, 0.1);
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
		gap: var(--space-sm);
	}

	.color-button {
		aspect-ratio: 1;
		border: 3px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: 1.25rem;
		color: white;
		font-weight: 700;
	}

	.color-button:hover {
		transform: scale(1.1);
	}

	.color-button.active {
		border-color: white;
		box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px currentColor;
	}

	.form-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
		margin-top: var(--space-lg);
	}

	.help-text {
		margin-top: var(--space-2xl);
		padding: var(--space-lg);
		background: rgba(96, 165, 250, 0.1);
		border-left: 4px solid var(--primary);
		border-radius: var(--radius-md);
	}

	.help-text p {
		margin: 0;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.form-card {
			padding: var(--space-lg);
		}

		.icon-grid {
			grid-template-columns: repeat(6, 1fr);
		}

		.color-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>

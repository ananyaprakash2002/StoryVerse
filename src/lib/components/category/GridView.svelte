<script lang="ts">
	import type { CategoryItem } from '$lib/types/category';
	import CoverImage from '$lib/components/media/CoverImage.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		items: CategoryItem[];
		categoryName: string;
		onEdit: (item: CategoryItem) => void;
		onDelete: (item: CategoryItem) => void;
		onViewDetails: (item: CategoryItem) => void;
	}

	let { items, categoryName, onEdit, onDelete, onViewDetails }: Props = $props();

	const dispatch = createEventDispatcher();
</script>

<div class="grid-view">
	{#if items.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📦</span>
			<p>No items yet. Add your first {categoryName.toLowerCase()} item!</p>
		</div>
	{:else}
		<div class="grid">
			{#each items as item}
				<div 
					class="grid-card" 
					onclick={() => onViewDetails(item)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onViewDetails(item)}
					role="button" 
					tabindex="0"
				>
					<!-- Cover Image -->
					{#if item.cover_image_url}
						<div class="card-cover">
							<CoverImage 
								imageUrl={item.cover_image_url} 
								title={item.data.title || item.data.name || 'Item'}
								size="md"
							/>
						</div>
					{:else}
						<div class="card-cover-placeholder">
							<span class="placeholder-icon">📄</span>
						</div>
					{/if}

					<!-- Card Content -->
					<div class="card-content">
						<!-- Title -->
						{#if item.data.title || item.data.name}
							<h3 class="card-title">
								{item.data.title || item.data.name}
							</h3>
						{/if}

						<!-- Author (if exists) -->
						{#if item.data.author}
							<p class="card-author">by {item.data.author}</p>
						{/if}

						<!-- Status Badge -->
						{#if item.data.status}
							<div class="card-meta">
								<span class="status-badge" class:completed={item.data.status.toLowerCase() === 'completed'}>
									{item.data.status}
								</span>
							</div>
						{/if}

						<!-- Tags -->
						{#if item.data.tags && item.data.tags.length > 0}
							<div class="card-tags">
								{#each item.data.tags.slice(0, 3) as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}

						<!-- Actions -->
						<div 
							class="card-actions" 
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
							role="group"
						>
							<Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
								Edit
							</Button>
							<Button variant="danger" size="sm" onClick={() => onDelete(item)}>
								Delete
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.grid-view {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
		color: var(--text-muted);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: var(--space-lg);
		opacity: 0.5;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-lg);
	}

	.grid-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all var(--transition-base);
		cursor: pointer;
	}

	.grid-card:hover {
		border-color: var(--primary);
		transform: translateY(-4px);
		box-shadow: var(--shadow-xl);
	}

	.card-cover,
	.card-cover-placeholder {
		width: 100%;
		aspect-ratio: 2/3;
		overflow: hidden;
		background: var(--bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon {
		font-size: 4rem;
		opacity: 0.3;
	}

	.card-content {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.card-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-author {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
	}

	.card-meta {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.status-badge {
		padding: var(--space-xs) var(--space-sm);
		background: rgba(96, 165, 250, 0.2);
		color: var(--primary);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-badge.completed {
		background: rgba(16, 185, 129, 0.2);
		color: var(--success);
	}

	.card-tags {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.tag {
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}

	.card-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border-color);
	}

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: var(--space-md);
		}

		.card-content {
			padding: var(--space-md);
		}
	}

	@media (max-width: 480px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>

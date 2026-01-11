<script lang="ts">
	import type { CategoryItem } from '$lib/types/category';
	import CoverImage from '$lib/components/media/CoverImage.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

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
			{#each items as item, index}
				<div 
					class="grid-card" 
					onclick={() => onViewDetails(item)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onViewDetails(item)}
					role="button" 
					tabindex="0"
					in:scale={{ duration: 400, delay: index * 50, easing: quintOut, start: 0.9 }}
				>
					<!-- Cover Image with Gradient Overlay -->
					<div class="card-cover-wrapper">
						{#if item.cover_image_url}
							<div class="card-cover">
								<CoverImage 
									imageUrl={item.cover_image_url} 
									title={item.data.title || item.data.name || 'Item'}
									size="md"
								/>
								<div class="gradient-overlay"></div>
							</div>
						{:else}
							<div class="card-cover-placeholder">
								<span class="placeholder-icon">📄</span>
								<div class="gradient-overlay"></div>
							</div>
						{/if}
						
						<!-- Floating Rating Badge -->
						{#if item.data.rating}
							<div class="floating-rating">
								<span class="rating-star">★</span>
								<span class="rating-value">{item.data.rating}</span>
							</div>
						{/if}
					</div>

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
								<span class="status-badge" class:completed={item.data.status.toLowerCase() === 'completed'}
									class:reading={item.data.status.toLowerCase() === 'reading'}
									class:planning={item.data.status.toLowerCase() === 'planning' || item.data.status.toLowerCase() === 'planned'}>
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
								{#if item.data.tags.length > 3}
									<span class="tag more-tags">+{item.data.tags.length - 3}</span>
								{/if}
							</div>
						{/if}

						<!-- Actions -->
						<div class="card-actions" role="group">
							<Button variant="secondary" size="sm" onClick={() => onEdit(item)} stopPropagation={true}>
								✏️ Edit
							</Button>
							<Button variant="danger" size="sm" onClick={() => onDelete(item)} stopPropagation={true}>
								🗑️ Delete
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
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-lg);
	}

	.grid-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		position: relative;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.grid-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 1;
	}

	.grid-card:hover::before {
		opacity: 1;
	}

	.grid-card:hover {
		border-color: var(--primary);
		transform: translateY(-8px) scale(1.02);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04),
		            0 0 0 3px rgba(96, 165, 250, 0.1);
	}

	.grid-card:active {
		transform: translateY(-6px) scale(1.01);
	}

	.card-cover-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 2/3;
		overflow: hidden;
		background: var(--bg-tertiary);
	}

	.card-cover,
	.card-cover-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.gradient-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
		opacity: 0.6;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.grid-card:hover .gradient-overlay {
		opacity: 0.8;
	}

	.floating-rating {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-radius: var(--radius-full);
		padding: 6px 12px;
		display: flex;
		align-items: center;
		gap: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 10;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.rating-star {
		color: #fbbf24;
		font-size: 14px;
		filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5));
	}

	.rating-value {
		color: white;
		font-size: 13px;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.placeholder-icon {
		font-size: 4rem;
		opacity: 0.3;
		filter: grayscale(100%);
	}

	.card-content {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		background: var(--bg-secondary);
		position: relative;
		z-index: 2;
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
		line-height: 1.4;
		transition: color 0.2s ease;
	}

	.grid-card:hover .card-title {
		color: var(--primary);
	}

	.card-author {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
		font-weight: 400;
	}

	.card-meta {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin-top: 2px;
	}

	.status-badge {
		padding: 6px 12px;
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.25) 100%);
		color: var(--primary);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		font-weight: 600;
		text-transform: capitalize;
		border: 1px solid rgba(96, 165, 250, 0.3);
		box-shadow: 0 2px 4px rgba(96, 165, 250, 0.1);
		transition: all 0.2s ease;
	}

	.status-badge:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(96, 165, 250, 0.2);
	}

	.status-badge.completed {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.25) 100%);
		color: var(--success);
		border-color: rgba(16, 185, 129, 0.3);
		box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
	}

	.status-badge.reading {
		background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.25) 100%);
		color: #f59e0b;
		border-color: rgba(251, 191, 36, 0.3);
		box-shadow: 0 2px 4px rgba(251, 191, 36, 0.1);
	}

	.status-badge.planning {
		background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.25) 100%);
		color: #a855f7;
		border-color: rgba(168, 85, 247, 0.3);
		box-shadow: 0 2px 4px rgba(168, 85, 247, 0.1);
	}

	.card-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.tag {
		padding: 4px 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.tag:hover {
		background: rgba(96, 165, 250, 0.1);
		border-color: var(--primary);
		color: var(--primary);
		transform: translateY(-2px);
	}

	.tag.more-tags {
		background: rgba(96, 165, 250, 0.15);
		color: var(--primary);
		border-color: rgba(96, 165, 250, 0.3);
		font-weight: 600;
	}

	.card-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-color);
	}

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: var(--space-md);
		}
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: var(--space-md);
		}

		.card-content {
			padding: var(--space-md);
		}

		.floating-rating {
			top: 8px;
			right: 8px;
			padding: 4px 8px;
		}
	}

	@media (max-width: 480px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>

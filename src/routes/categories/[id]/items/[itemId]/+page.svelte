<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCategory } from '$lib/services/categories';
	import { getItem, updateItem, deleteItem } from '$lib/services/category-items';
	import { toasts } from '$lib/stores/ui';
	import type { Category, CategoryItem, CategoryItemInput } from '$lib/types/category';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import CoverImage from '$lib/components/media/CoverImage.svelte';
	import DynamicFormEnhanced from '$lib/components/category/DynamicFormEnhanced.svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let category: Category | null = null;
	let item: CategoryItem | null = null;
	let loading = true;
	let showEditModal = false;
	let formValues: Record<string, any> = {};
	let saving = false;
	let expandedFields = new Set<string>();

	function toggleFieldExpansion(fieldName: string) {
		if (expandedFields.has(fieldName)) {
			expandedFields.delete(fieldName);
		} else {
			expandedFields.add(fieldName);
		}
		expandedFields = expandedFields;
	}

	let categoryId: string = '';
	let itemId: string = '';

	$: categoryId = $page.params.id ?? '';
	$: itemId = $page.params.itemId ?? '';

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			[category, item] = await Promise.all([getCategory(categoryId), getItem(itemId)]);
		} catch (err: any) {
			toasts.error(err.message || 'Failed to load item details');
			goto(`/categories/${categoryId}`);
		} finally {
			loading = false;
		}
	}

	function openEditModal() {
		if (!item) return;
		formValues = { ...item.data };
		showEditModal = true;
	}

	async function handleSubmit(data: Record<string, any>, imageData?: { url: string; path: string; apiSource?: string; apiId?: string }) {
		if (!item) return;
		
		saving = true;
		try {
			const itemData: CategoryItemInput = {
				data,
				cover_image_url: imageData?.url ?? item.cover_image_url,
				cover_image_path: imageData?.path ?? item.cover_image_path,
				api_source: imageData?.apiSource === 'google_books' ? 'google_books' : (item.api_source ?? null),
				api_id: imageData?.apiId ?? item.api_id
			};

			await updateItem(item.id, itemData);
			toasts.success('Item updated!');
			showEditModal = false;
			await loadData();
		} catch (err: any) {
			toasts.error(err.message || 'Failed to update item');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!item || !confirm('Are you sure you want to delete this item?')) return;

		try {
			await deleteItem(item.id);
			toasts.success('Item deleted!');
			goto(`/categories/${categoryId}`);
		} catch (err: any) {
			toasts.error(err.message || 'Failed to delete item');
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function goBack() {
		goto(`/categories/${categoryId}`);
	}
</script>

<div class="page container">
	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
		</div>
	{:else if item && category}
		<div class="item-details-page" in:fade={{ duration: 300 }}>
			<!-- Header with Back Button -->
			<div class="page-header">
				<button class="back-button" on:click={goBack}>
					← Back to {category.name}
				</button>

				<div class="breadcrumb">
					<a href="/categories">Categories</a>
					<span class="separator">/</span>
					<a href="/categories/{categoryId}">{category.name}</a>
					<span class="separator">/</span>
					<span class="current">{item.data.title || item.data.name || 'Item'}</span>
				</div>
			</div>

			<div class="details-container">
				<!-- Cover Image Section -->
				{#if item.cover_image_url}
					<div class="details-cover" in:scale={{ duration: 400, easing: quintOut }}>
						<CoverImage 
							imageUrl={item.cover_image_url} 
							title={item.data.title || item.data.name || 'Item'}
							size="lg"
						/>
					</div>
				{/if}

				<!-- Main Content -->
				<div class="details-content">
					<!-- Title Section with Actions and Metadata -->
					<div class="title-section" in:fade={{duration: 400, delay: 100 }}>
						<div class="title-row">
							<div>
								<h1 class="item-title">
									{item.data.title || item.data.name || 'Untitled Item'}
								</h1>
								{#if item.data.author}
									<p class="item-author">by {item.data.author}</p>
								{/if}
							</div>
							
							<!-- Actions at top -->
							<div class="header-actions">
								<Button variant="primary" onClick={openEditModal}>
									✏️ Edit
								</Button>
								<button class="btn btn-danger btn-sm" on:click={handleDelete}>
									🗑️ Delete
								</button>
							</div>
						</div>

						<!-- Metadata at top -->
						<div class="header-meta">
							<div class="meta-badge">
								<span class="meta-icon">📅</span>
								<span>Created: {formatDate(item.created_at)}</span>
							</div>
							<div class="meta-badge">
								<span class="meta-icon">🔄</span>
								<span>Updated: {formatDate(item.updated_at)}</span>
							</div>
						</div>
					</div>

					<!-- Fields Grid -->
					<div class="details-grid" in:fade={{ duration: 400, delay: 200 }}>
						{#each category.fields || [] as field, index}
							<div class="detail-card" in:scale={{ duration: 300, delay: 250 + index * 30, easing: quintOut, start: 0.95 }}>
								<div class="detail-label">{field.label}</div>
								<div class="detail-value">
									{#if field.field_type === 'boolean'}
										<span class="badge">{item.data[field.name] ? '✓ Yes' : '✗ No'}</span>
									{:else if field.field_type === 'rating'}
										<div class="rating-display">
											{#each Array(item.data[field.name] || 0) as _}
												<span class="star filled">★</span>
											{/each}
											{#each Array(5 - (item.data[field.name] || 0)) as _}
												<span class="star">☆</span>
											{/each}
										</div>
									{:else if field.field_type === 'tags' || field.field_type === 'multiselect'}
										{#if Array.isArray(item.data[field.name]) && item.data[field.name].length > 0}
											<div class="chips">
												{#each item.data[field.name] as tag}
													<span class="chip-large">{tag}</span>
												{/each}
											</div>
										{:else}
											<span class="text-muted">-</span>
										{/if}
									{:else if field.field_type === 'url'}
										{#if item.data[field.name]}
											<a
												href={item.data[field.name]}
												target="_blank"
												rel="noopener noreferrer"
												class="url-link-large"
											>
												🔗 {item.data[field.name]}
											</a>
										{:else}
											<span class="text-muted">-</span>
										{/if}
									{:else if field.field_type === 'textarea'}
										{@const content = item.data[field.name] || '-'}
										{@const isExpanded = expandedFields.has(field.name)}
										{@const isLong = content.length > 200}
										
										<div class="textarea-container">
											<div class="textarea-display" class:collapsed={!isExpanded && isLong}>
												{content}
											</div>
											{#if isLong}
												<button class="expand-button" on:click={() => toggleFieldExpansion(field.name)}>
													{isExpanded ? '▲ Show less' : '▼ Show more'}
												</button>
											{/if}
										</div>
									{:else}
										{item.data[field.name] || '-'}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Edit Modal -->
<Modal bind:isOpen={showEditModal} title="Edit Item">
	{#if category && item}
		<DynamicFormEnhanced
			fields={category.fields || []}
			bind:values={formValues}
			onSubmit={handleSubmit}
			submitLabel="Update"
			loading={saving}
			categoryName={category.name}
			itemId={item.id}
		/>
	{/if}
</Modal>

<style>
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--border-color);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.item-details-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: var(--space-2xl);
	}

	.back-button {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font-size: var(--font-size-md);
		padding: var(--space-sm) 0;
		margin-bottom: var(--space-md);
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.back-button:hover {
		color: var(--primary-hover);
		transform: translateX(-4px);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		flex-wrap: wrap;
	}

	.breadcrumb a {
		color: var(--primary);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.breadcrumb a:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	.breadcrumb .separator {
		color: var(--text-muted);
	}

	.breadcrumb .current {
		color: var(--text-primary);
		font-weight: 500;
	}

	.details-container {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2xl);
		align-items: start;
	}

	.details-cover {
		position: sticky;
		top: var(--space-xl);
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--space-xl);
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%);
		border-radius: var(--radius-xl);
		border: 1px solid var(--border-color);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
		max-width: 300px;
	}

	.details-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xl);
		flex: 1;
	}

	.title-section {
		padding-bottom: var(--space-xl);
		border-bottom: 2px solid var(--border-color);
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-lg);
		margin-bottom: var(--space-lg);
	}

	.item-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 var(--space-xs) 0;
		line-height: 1.2;
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.item-author {
		font-size: var(--font-size-md);
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.header-meta {
		display: flex;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.meta-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}

	.meta-icon {
		font-size: 1rem;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-lg);
	}

	.detail-card {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(96, 165, 250, 0.02) 100%);
		padding: var(--space-xl);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.detail-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		background: linear-gradient(to bottom, var(--primary) 0%, rgba(168, 85, 247, 0.8) 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.detail-card:hover {
		border-color: rgba(96, 165, 250, 0.3);
		transform: translateY(-4px);
		box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(96, 165, 250, 0.1);
	}

	.detail-card:hover::before {
		opacity: 1;
	}

	.detail-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-bottom: var(--space-md);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.detail-label::before {
		content: '';
		width: 6px;
		height: 6px;
		background: var(--primary);
		border-radius: 50%;
		display: inline-block;
	}

	.detail-value {
		font-size: var(--font-size-md);
		color: var(--text-primary);
		word-break: break-word;
		line-height: 1.6;
		font-weight: 500;
	}

	.badge {
		display: inline-block;
		padding: var(--space-sm) var(--space-md);
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.25) 100%);
		border-radius: var(--radius-full);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border: 1px solid rgba(96, 165, 250, 0.3);
		box-shadow: 0 2px 4px rgba(96, 165, 250, 0.1);
	}

	.rating-display {
		display: flex;
		gap: 4px;
		font-size: 1.75rem;
	}

	.star.filled {
		color: #fbbf24;
		filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5));
		animation: starPulse 2s ease-in-out infinite;
	}

	@keyframes starPulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}

	.star {
		color: var(--text-muted);
		opacity: 0.3;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.chip-large {
		display: inline-block;
		padding: 8px 16px;
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.12) 0%, rgba(96, 165, 250, 0.18) 100%);
		color: var(--primary);
		border-radius: var(--radius-full);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border: 1px solid rgba(96, 165, 250, 0.3);
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(96, 165, 250, 0.1);
	}

	.chip-large:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(96, 165, 250, 0.2);
	}

	.url-link-large {
		color: var(--primary);
		text-decoration: none;
		word-break: break-all;
		transition: color 0.2s ease;
	}

	.url-link-large:hover {
		text-decoration: underline;
		color: var(--primary-hover);
	}

	.textarea-container {
		position: relative;
	}

	.textarea-display {
		white-space: pre-wrap;
		line-height: 1.8;
		transition: max-height 0.3s ease;
	}

	.textarea-display.collapsed {
		max-height: 120px;
		overflow: hidden;
		position: relative;
	}

	.textarea-display.collapsed::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60px;
		background: linear-gradient(to bottom, transparent 0%, var(--bg-secondary) 100%);
		pointer-events: none;
	}

	.expand-button {
		margin-top: var(--space-sm);
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font-size: var(--font-size-sm);
		font-weight: 600;
		padding: var(--space-xs) 0;
		transition: color 0.2s ease;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.expand-button:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	@media (max-width: 1024px) {
		.details-container {
			grid-template-columns: 1fr;
		}

		.details-cover {
			position: static;
			max-width: 100%;}

		.item-title {
			font-size: 1.75rem;
		}

		.title-row {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			justify-content: flex-start;
		}
	}

	@media (max-width: 768px) {
		.details-grid {
			grid-template-columns: 1fr;
		}

		.header-meta {
			flex-direction: column;
			gap: var(--space-sm);
		}

		.item-title {
			font-size: 1.5rem;
		}
	}
</style>


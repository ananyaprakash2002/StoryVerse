<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUserCategories, getTemplates, cloneTemplate } from '$lib/services/categories';
	import { getCategoryStats } from '$lib/services/categories';
	import { toasts } from '$lib/stores/ui';
	import type { Category } from '$lib/types/category';
	import Button from '$lib/components/common/Button.svelte';
	import Loader from '$lib/components/common/Loader.svelte';

	let categories: Category[] = [];
	let templates: Category[] = [];
	let loading = true;
	let showTemplates = false;
	let categoryStats: Record<string, { total_items: number }> = {};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			[categories, templates] = await Promise.all([getUserCategories(), getTemplates()]);

			// Load stats for each category
			for (const category of categories) {
				categoryStats[category.id] = await getCategoryStats(category.id);
			}
		} catch (err: any) {
			toasts.error(err.message || 'Failed to load categories');
		} finally {
			loading = false;
		}
	}

	async function handleCloneTemplate(templateId: string) {
		try {
			const newCategory = await cloneTemplate(templateId);
			toasts.success(`Created ${newCategory.name} category!`);
			await loadData();
		} catch (err: any) {
			toasts.error(err.message || 'Failed to create category');
		}
	}

	function viewCategory(id: string) {
		goto(`/categories/${id}`);
	}
</script>

<div class="page container">
	<div class="page-header">
		<div>
			<h1>My Categories</h1>
			<p class="text-muted">Manage your custom tracking categories</p>
		</div>
		<Button variant="primary" onClick={() => (showTemplates = !showTemplates)}>
			{showTemplates ? 'Hide Templates' : '+ New Category'}
		</Button>
	</div>

	{#if showTemplates}
		<div class="templates-section card">
			<h3>Choose a Template</h3>
			<p class="text-muted">Start with a pre-configured category template</p>

		<div class="templates-grid">
			<!-- Create Custom Option -->
			<button class="template-card custom-card" on:click={() => goto('/categories/new')}>
				<span class="template-icon">✨</span>
				<div class="template-info">
					<h4>Create Custom</h4>
					<p>Build from scratch with your own fields</p>
					<span class="field-count">Fully customizable</span>
				</div>
			</button>
			
			<!-- Templates -->
			{#each templates as template}
				<button class="template-card" on:click={() => handleCloneTemplate(template.id)}>
					<span class="template-icon">{template.icon}</span>
					<div class="template-info">
						<h4>{template.name}</h4>
						<p>{template.description}</p>
						<span class="field-count">{template.fields?.length || 0} fields</span>
					</div>
				</button>
			{/each}
		</div>
		</div>
	{/if}

	{#if loading}
		<div class="loading-container">
			<Loader size="lg" />
		</div>
	{:else if categories.length === 0 && !showTemplates}
		<div class="empty-state card">
			<span class="empty-icon">📦</span>
			<h3>No Categories Yet</h3>
			<p>Create your first category to start tracking anything you want!</p>
			<Button variant="primary" onClick={() => (showTemplates = true)}>
				Get Started
			</Button>
		</div>
	{:else}
		<div class="categories-grid">
			{#each categories as category}
				<button class="category-card card" on:click={() => viewCategory(category.id)}>
					<div class="category-header">
						<span class="category-icon" style="color: {category.color || 'var(--primary)'}">
							{category.icon || '📁'}
						</span>
						<h3>{category.name}</h3>
					</div>

					{#if category.description}
						<p class="category-description">{category.description}</p>
					{/if}

					<div class="category-stats">
						<div class="stat">
							<span class="stat-value">{categoryStats[category.id]?.total_items || 0}</span>
							<span class="stat-label">Items</span>
						</div>
						<div class="stat">
							<span class="stat-value">{category.fields?.length || 0}</span>
							<span class="stat-label">Fields</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-2xl);
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: var(--space-2xl);
	}

	.templates-section {
		margin-bottom: var(--space-2xl);
		padding: var(--space-xl);
	}

	.templates-section h3 {
		margin-bottom: var(--space-sm);
	}

	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--space-lg);
		margin-top: var(--space-lg);
	}

	.template-card {
		background: rgba(31, 41, 55, 0.3);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-base);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
	}

	.template-card:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.custom-card {
		border: 2px solid var(--primary);
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
	}

	.custom-card:hover {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
	}

	.template-icon {
		font-size: 3rem;
	}

	.template-info {
		text-align: center;
	}

	.template-info h4 {
		margin-bottom: var(--space-xs);
	}

	.template-info p {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}

	.field-count {
		font-size: var(--font-size-xs);
		color: var(--primary);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: var(--space-lg);
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-lg);
	}

	.category-card {
		padding: var(--space-xl);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-base);
		width: 100%;
	}

	.category-card:hover {
		transform: translateY(-2px);
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.category-icon {
		font-size: 2.5rem;
	}

	.category-description {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-lg);
	}

	.category-stats {
		display: flex;
		gap: var(--space-2xl);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-color);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.stat-value {
		font-size: var(--font-size-2xl);
		font-weight: 700;
		color: var(--primary);
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: var(--space-md);
		}

		.categories-grid,
		.templates-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

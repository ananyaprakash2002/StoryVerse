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
	<!-- Hero Section -->
	<div class="hero-section">
		<div class="hero-content">
			<h1 class="hero-title">🎨 Custom Categories</h1>
			<p class="hero-subtitle">Design your perfect tracking system. Create categories with custom fields, icons, and colors to track anything you want.</p>
		</div>
	</div>

	<div class="page-header">
		<div>
			<h2 class="page-title">My Categories</h2>
			<p class="page-subtitle">Manage your custom tracking categories</p>
		</div>
		<Button variant="primary" onClick={() => (showTemplates = !showTemplates)}>
			{showTemplates ? 'Hide Templates' : '+ New Category'}
		</Button>
	</div>

	{#if showTemplates}
		<div class="templates-section card">
			<div class="templates-header">
				<h3 class="section-title">Choose a Template</h3>
				<p class="section-subtitle">Start with a pre-configured category template</p>
			</div>

		<div class="templates-grid">
			<!-- Create Custom Option -->
			<button class="template-card custom-card" style="animation-delay: 0.1s" on:click={() => goto('/categories/new')}>
				<span class="template-icon">✨</span>
				<div class="template-info">
					<h4>Create Custom</h4>
					<p>Build from scratch with your own fields</p>
					<span class="field-count">Fully customizable</span>
				</div>
			</button>
			
			<!-- Templates -->
			{#each templates as template, index}
				<button class="template-card" style="animation-delay: {0.2 + index * 0.1}s" on:click={() => handleCloneTemplate(template.id)}>
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
			{#each categories as category, index}
				<button class="category-card card" style="animation-delay: {0.1 + index * 0.08}s" on:click={() => viewCategory(category.id)}>
					<div class="category-accent" style="background: {category.color || 'var(--primary)'}"></div>
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
	/* Hero Section */
	.hero-section {
		margin-bottom: var(--space-2xl);
		padding: var(--space-2xl);
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
		border-radius: var(--radius-xl);
		border: 1px solid var(--border-color);
		position: relative;
		overflow: hidden;
		animation: fadeInUp 0.6s ease-out;
	}

	.hero-section::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -30%;
		width: 60%;
		height: 200%;
		background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
		pointer-events: none;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 700px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 3rem;
		font-weight: 800;
		margin-bottom: var(--space-md);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 50%, var(--primary-light) 100%);
		background-size: 200% 200%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradientShift 3s ease infinite;
	}

	@keyframes gradientShift {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	.hero-subtitle {
		font-size: var(--font-size-lg);
		color: var(--text-muted);
		line-height: 1.6;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-2xl);
		animation: fadeInUp 0.6s ease-out 0.2s backwards;
	}

	.page-title {
		font-size: var(--font-size-2xl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-md);
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: var(--space-2xl);
	}

	.templates-section {
		margin-bottom: var(--space-2xl);
		padding: var(--space-2xl);
		animation: fadeInUp 0.6s ease-out 0.3s backwards;
	}

	.templates-header {
		margin-bottom: var(--space-xl);
	}

	.section-title {
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 700;
		margin-bottom: var(--space-sm);
	}

	.section-subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-md);
	}

	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--space-lg);
		margin-top: var(--space-lg);
	}

	.template-card {
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		text-align: left;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		position: relative;
		overflow: hidden;
		animation: fadeInUp 0.4s ease-out backwards;
	}

	.template-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transition: left 0.5s;
	}

	.template-card:hover::before {
		left: 100%;
	}

	.template-card:hover {
		border-color: var(--primary);
		transform: translateY(-6px) scale(1.02);
		box-shadow: 
			0 12px 32px rgba(99, 102, 241, 0.15),
			0 0 40px rgba(99, 102, 241, 0.1);
	}

	.custom-card {
		border: 2px solid var(--primary);
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
	}

	.custom-card:hover {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
		box-shadow: 
			0 12px 32px rgba(99, 102, 241, 0.25),
			0 0 60px rgba(99, 102, 241, 0.15);
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
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		position: relative;
		overflow: hidden;
		animation: fadeInUp 0.5s ease-out backwards;
	}

	.category-accent {
		position: absolute;
		left: 0;
		top: 0;
		width: 4px;
		height: 100%;
		opacity: 0.7;
		transition: all var(--transition-base);
	}

	.category-card:hover {
		transform: translateY(-6px) scale(1.02);
		box-shadow: 
			0 12px 32px rgba(0, 0, 0, 0.15),
			0 0 40px rgba(99, 102, 241, 0.1);
	}

	.category-card:hover .category-accent {
		width: 6px;
		opacity: 1;
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
		font-weight: 800;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	@media (max-width: 768px) {
		.hero-title {
			font-size: 2rem;
		}

		.hero-section {
			padding: var(--space-xl);
		}

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

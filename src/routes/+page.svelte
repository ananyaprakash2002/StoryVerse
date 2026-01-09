<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUserCategories, getCategoryStats } from '$lib/services/categories';
	import { getItems } from '$lib/services/category-items';
	import type { Category, CategoryItem } from '$lib/types/category';
	import Loader from '$lib/components/common/Loader.svelte';
	import Button from '$lib/components/common/Button.svelte';

	let categories: Category[] = [];
	let loading = true;
	let totalItems = 0;
	let recentActivity: Array<{
		categoryId: string;
		categoryName: string;
		categoryIcon: string;
		item: CategoryItem;
	}> = [];
	let categoryStats: Record<string, { total_items: number }> = {};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			categories = await getUserCategories();

			// Load stats for each category
			const statsPromises = categories.map(async (cat) => {
				const stats = await getCategoryStats(cat.id);
				categoryStats[cat.id] = stats;
				return stats.total_items;
			});

			const itemCounts = await Promise.all(statsPromises);
			totalItems = itemCounts.reduce((sum, count) => sum + count, 0);

			// Load recent items from all categories
			const recentPromises = categories.map(async (cat) => {
				const items = await getItems(cat.id);
				return items.slice(0, 5).map((item) => ({
					categoryId: cat.id,
					categoryName: cat.name,
					categoryIcon: cat.icon || '📁',
					item
				}));
			});

			const allRecent = await Promise.all(recentPromises);
			recentActivity = allRecent
				.flat()
				.sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime())
				.slice(0, 10);
		} catch (err) {
			console.error('Failed to load dashboard:', err);
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) return 'Today';
		if (diffInDays === 1) return 'Yesterday';
		if (diffInDays < 7) return `${diffInDays} days ago`;
		return date.toLocaleDateString();
	}

	function getItemTitle(item: CategoryItem): string {
		// Try common title fields
		const titleFields = ['title', 'name', 'item_name'];
		for (const field of titleFields) {
			if (item.data[field]) return item.data[field];
		}
		// Fallback to first non-empty value
		const values = Object.values(item.data).filter((v) => v && typeof v === 'string');
		return values[0] || 'Untitled';
	}
</script>

<div class="page container">
	<div class="welcome-section">
		<div>
			<h1>Welcome back! 👋</h1>
			<p class="text-muted">Here's what's happening with your tracking</p>
		</div>
		<Button variant="primary" onClick={() => goto('/categories')}>+ New Category</Button>
	</div>

	{#if loading}
		<div class="loading-container">
			<Loader size="lg" />
		</div>
	{:else if categories.length === 0}
		<div class="empty-state card">
			<span class="empty-icon">🎯</span>
			<h2>Start Your Journey</h2>
			<p>Create your first category to start tracking what matters to you</p>
			<Button variant="primary" onClick={() => goto('/categories')}>Create Category</Button>
		</div>
	{:else}
		<!-- Quick Stats -->
		<div class="quick-stats">
			<div class="stat-item">
				<span class="stat-number">{categories.length}</span>
				<span class="stat-text">{categories.length === 1 ? 'Category' : 'Categories'}</span>
			</div>
			<div class="divider"></div>
			<div class="stat-item">
				<span class="stat-number">{totalItems}</span>
				<span class="stat-text">Items Tracked</span>
			</div>
			<div class="divider"></div>
			<div class="stat-item">
				<span class="stat-number">{recentActivity.length > 0 ? formatDate(recentActivity[0].item.created_at) : '-'}</span>
				<span class="stat-text">Last Activity</span>
			</div>
		</div>

		<!-- Your Categories - Immediately Actionable -->
		<div class="section">
			<div class="section-header">
				<h2>Your Categories</h2>
				<p class="section-subtitle">Click to view and manage items</p>
			</div>
			<div class="categories-grid">
				{#each categories as category}
					<button class="category-card card" on:click={() => goto(`/categories/${category.id}`)}>
						<div class="card-header">
							<span class="category-icon-large" style="color: {category.color || 'var(--primary)'}">
								{category.icon || '📁'}
							</span>
							<div class="progress-indicator">
								<span class="item-count">{categoryStats[category.id]?.total_items || 0}</span>
								<span class="item-label">items</span>
							</div>
						</div>
						<h3 class="category-name">{category.name}</h3>
						{#if category.description}
							<p class="category-desc">{category.description}</p>
						{/if}
						<div class="quick-action">
							<span>View all →</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Recent Activity -->
		{#if recentActivity.length > 0}
			<div class="section">
				<div class="section-header">
					<h2>Recent Activity</h2>
					<p class="section-subtitle">Latest items you've added</p>
				</div>
				<div class="activity-list card">
					{#each recentActivity.slice(0, 5) as activity}
						<button
							class="activity-item"
							on:click={() => goto(`/categories/${activity.categoryId}`)}
						>
							<span class="activity-icon">{activity.categoryIcon}</span>
							<div class="activity-content">
								<div class="activity-title">{getItemTitle(activity.item)}</div>
								<div class="activity-meta">
									<span class="category-badge">{activity.categoryName}</span>
									<span class="activity-date">{formatDate(activity.item.created_at)}</span>
								</div>
							</div>
							<span class="arrow">→</span>
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="cta-card card">
				<div class="cta-icon">✨</div>
				<h3>Start Tracking!</h3>
				<p>Add your first item to any category to see your activity here</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.welcome-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-2xl);
	}

	.welcome-section h1 {
		font-size: 2.5rem;
		margin-bottom: var(--space-sm);
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: var(--space-2xl);
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

	.quick-stats {
		display: flex;
		align-items: center;
		justify-content: space-around;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		margin-bottom: var(--space-2xl);
		border: 1px solid var(--border-color);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
	}

	.stat-number {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--primary);
		line-height: 1;
	}

	.stat-text {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.divider {
		width: 1px;
		height: 40px;
		background: var(--border-color);
	}

	.section {
		margin-bottom: var(--space-2xl);
	}

	.section-header {
		margin-bottom: var(--space-lg);
	}

	.section-header h2 {
		margin-bottom: var(--space-xs);
	}

	.section-subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-lg);
	}

	.category-card {
		padding: var(--space-xl);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-base);
		width: 100%;
		border: 1px solid var(--border-color);
	}

	.category-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--primary);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-lg);
	}

	.category-icon-large {
		font-size: 3rem;
	}

	.progress-indicator {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.item-count {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}

	.item-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.category-name {
		font-size: var(--font-size-xl);
		margin-bottom: var(--space-sm);
		color: var(--text-primary);
	}

	.category-desc {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin-bottom: var(--space-lg);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.quick-action {
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-color);
		color: var(--primary);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.activity-list {
		padding: 0;
		overflow: hidden;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		width: 100%;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-color);
		cursor: pointer;
		text-align: left;
		transition: background var(--transition-fast);
		color: inherit;
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-item:hover {
		background: rgba(96, 165, 250, 0.05);
	}

	.activity-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-title {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--font-size-md);
	}

	.activity-meta {
		display: flex;
		gap: var(--space-md);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		align-items: center;
	}

	.category-badge {
		background: rgba(96, 165, 250, 0.1);
		color: var(--primary);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
	}

	.arrow {
		color: var(--text-muted);
		font-size: 1.25rem;
		flex-shrink: 0;
		transition: transform var(--transition-fast);
	}

	.activity-item:hover .arrow {
		transform: translateX(4px);
		color: var(--primary);
	}

	.cta-card {
		text-align: center;
		padding: var(--space-2xl);
	}

	.cta-icon {
		font-size: 3rem;
		margin-bottom: var(--space-lg);
	}

	.cta-card h3 {
		margin-bottom: var(--space-sm);
	}

	.cta-card p {
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.welcome-section {
			flex-direction: column;
			gap: var(--space-md);
		}

		.welcome-section h1 {
			font-size: 2rem;
		}

		.quick-stats {
			flex-direction: column;
			gap: var(--space-lg);
		}

		.divider {
			width: 100%;
			height: 1px;
		}

		.categories-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

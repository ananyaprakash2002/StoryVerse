<script lang="ts">
	import { onMount } from 'svelte';
	import { error as logError } from '$lib/utils/logger';
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
	let allItems: CategoryItem[] = [];

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			categories = await getUserCategories();

			// Load stats and items for each category
			const statsPromises = categories.map(async (cat) => {
				const stats = await getCategoryStats(cat.id);
				categoryStats[cat.id] = stats;
				return stats.total_items;
			});

			const itemsPromises = categories.map(async (cat) => {
				return await getItems(cat.id);
			});

			const [itemCounts, itemsArrays] = await Promise.all([
				Promise.all(statsPromises),
				Promise.all(itemsPromises)
			]);

			totalItems = itemCounts.reduce((sum, count) => sum + count, 0);
			allItems = itemsArrays.flat();

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
			logError('Failed to load dashboard:', err);
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

	// Calculate items added in last 7 and 30 days
	$: itemsLast7Days = allItems.filter((item) => {
		const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
		return daysSince <= 7;
	}).length;

	$: itemsLast30Days = allItems.filter((item) => {
		const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
		return daysSince <= 30;
	}).length;

	// Top categories by activity
	$: topCategories = categories
		.map((cat) => ({
			...cat,
			itemCount: categoryStats[cat.id]?.total_items || 0,
			percentage: totalItems > 0 ? ((categoryStats[cat.id]?.total_items || 0) / totalItems) * 100 : 0
		}))
		.sort((a, b) => b.itemCount - a.itemCount)
		.slice(0, 5);

	$: mostActiveCategory = topCategories[0];
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
		<!-- Enhanced Quick Stats -->
		<div class="stats-row">
			<div class="stat-box">
				<div class="stat-icon">📊</div>
				<div class="stat-content">
					<div class="stat-value">{categories.length}</div>
					<div class="stat-label">{categories.length === 1 ? 'Category' : 'Categories'}</div>
				</div>
			</div>

			<div class="stat-box">
				<div class="stat-icon">📝</div>
				<div class="stat-content">
					<div class="stat-value">{totalItems}</div>
					<div class="stat-label">Total Items</div>
				</div>
			</div>

			<div class="stat-box">
				<div class="stat-icon">🔥</div>
				<div class="stat-content">
					<div class="stat-value">{itemsLast7Days}</div>
					<div class="stat-label">Last 7 Days</div>
				</div>
			</div>

			<div class="stat-box">
				<div class="stat-icon">📈</div>
				<div class="stat-content">
					<div class="stat-value">{itemsLast30Days}</div>
					<div class="stat-label">Last 30 Days</div>
				</div>
			</div>
		</div>

		<!-- Top Categories Distribution -->
		{#if topCategories.length > 0}
			<div class="section">
				<h2>Category Distribution</h2>
				<div class="distribution-list card">
					{#each topCategories as category}
						<button
							class="distribution-item"
							on:click={() => goto(`/categories/${category.id}`)}
						>
							<div class="distribution-header">
								<span class="category-icon-small" style="color: {category.color || 'var(--primary)'}">
									{category.icon || '📁'}
								</span>
								<span class="category-name">{category.name}</span>
								<span class="item-count">{category.itemCount} items</span>
							</div>
							<div class="progress-bar">
								<div
									class="progress-fill"
									style="width: {category.percentage}%; background-color: {category.color || 'var(--primary)'}"
								></div>
							</div>
							<div class="percentage-label">{category.percentage.toFixed(1)}%</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Your Categories Grid -->
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

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-lg);
		margin-bottom: var(--space-2xl);
	}

	.stat-box {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		transition: all var(--transition-base);
	}

	.stat-box:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.stat-icon {
		font-size: 2.5rem;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--primary);
		line-height: 1;
	}

	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: var(--space-xs);
	}

	.distribution-list {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.distribution-item {
		display: block;
		text-align: left;
		background: transparent;
		border: none;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
		color: inherit;
		width: 100%;
	}

	.distribution-item:hover {
		background: rgba(96, 165, 250, 0.05);
	}

	.distribution-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.category-icon-small {
		font-size: 1.5rem;
	}

	.category-name {
		font-weight: 500;
		flex: 1;
	}

	.item-count {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.progress-bar {
		height: 8px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-sm);
		overflow: hidden;
		margin-bottom: var(--space-xs);
	}

	.progress-fill {
		height: 100%;
		transition: width var(--transition-base);
		border-radius: var(--radius-sm);
	}

	.percentage-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-align: right;
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

		.stats-row {
			grid-template-columns: 1fr;
		}

		.categories-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

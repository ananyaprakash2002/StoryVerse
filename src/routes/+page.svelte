<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { error as logError } from '$lib/utils/logger';
	import { goto } from '$app/navigation';
	import { getUserCategories, getCategoryStats } from '$lib/services/categories';
	import { getItems } from '$lib/services/category-items';
	import type { Category, CategoryItem } from '$lib/types/category';
	import Loader from '$lib/components/common/Loader.svelte';
	import Button from '$lib/components/common/Button.svelte';

	// Animated counters
	const categoriesCount = tweened(0, { duration: 1000, easing: cubicOut });
	const totalItemsCount = tweened(0, { duration: 1200, easing: cubicOut });
	const last7DaysCount = tweened(0, { duration: 800, easing: cubicOut });
	const last30DaysCount = tweened(0, { duration: 1000, easing: cubicOut });

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

	// Time-based greeting
	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

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
			// Animate counters after loading
			setTimeout(() => {
				categoriesCount.set(categories.length);
				totalItemsCount.set(totalItems);
			}, 100);
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

	// Update animated counters when values change
	$: if (!loading) {
		last7DaysCount.set(itemsLast7Days);
		last30DaysCount.set(itemsLast30Days);
	}

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
		<div class="welcome-content">
			<h1 class="welcome-title">{getGreeting()}! 👋</h1>
			<p class="welcome-subtitle">Here's what's happening with your tracking journey</p>
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
		<!-- Enhanced Quick Stats with Animations -->
		<div class="stats-row">
			<div class="stat-box" style="animation-delay: 0.1s">
				<div class="stat-icon">📊</div>
				<div class="stat-content">
					<div class="stat-value">{Math.floor($categoriesCount)}</div>
					<div class="stat-label">{categories.length === 1 ? 'Category' : 'Categories'}</div>
				</div>
			</div>

			<div class="stat-box" style="animation-delay: 0.2s">
				<div class="stat-icon">📝</div>
				<div class="stat-content">
					<div class="stat-value">{Math.floor($totalItemsCount)}</div>
					<div class="stat-label">Total Items</div>
				</div>
			</div>

			<div class="stat-box" style="animation-delay: 0.3s">
				<div class="stat-icon">🔥</div>
				<div class="stat-content">
					<div class="stat-value">{Math.floor($last7DaysCount)}</div>
					<div class="stat-label">Last 7 Days</div>
				</div>
			</div>

			<div class="stat-box" style="animation-delay: 0.4s">
				<div class="stat-icon">📈</div>
				<div class="stat-content">
					<div class="stat-value">{Math.floor($last30DaysCount)}</div>
					<div class="stat-label">Last 30 Days</div>
				</div>
			</div>
		</div>

		<!-- Top Categories Distribution -->
		{#if topCategories.length > 0}
			<div class="section distribution-section">
				<div class="section-header">
					<h2 class="section-title">Category Distribution</h2>
					<p class="section-subtitle">See how your collection is distributed</p>
				</div>
				<div class="distribution-list card">
					{#each topCategories as category, index}
						<button
							class="distribution-item"
							style="animation-delay: {0.5 + index * 0.1}s"
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
									style="width: {category.percentage}%; background-color: {category.color || 'var(--primary)'}; animation-delay: {0.6 + index * 0.1}s"
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
			<div class="section activity-section">
				<div class="section-header">
					<h2 class="section-title">Recent Activity</h2>
					<p class="section-subtitle">Latest items you've added</p>
				</div>
				<div class="activity-list card">
					{#each recentActivity.slice(0, 5) as activity, index}
						<button
							class="activity-item"
							style="animation-delay: {0.5 + index * 0.08}s"
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
		animation: fadeInUp 0.6s ease-out;
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

	.welcome-title {
		font-size: 2.5rem;
		margin-bottom: var(--space-sm);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 800;
	}

	.welcome-subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-lg);
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
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		animation: fadeInUp 0.6s ease-out backwards;
	}

	.stat-box::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		opacity: 0;
		transition: opacity var(--transition-base);
	}

	.stat-box:hover {
		transform: translateY(-4px) scale(1.02);
		box-shadow: 
			0 12px 32px rgba(99, 102, 241, 0.15),
			0 0 40px rgba(99, 102, 241, 0.1);
		border-color: var(--primary);
	}

	.stat-box:hover::before {
		opacity: 0.05;
	}

	.stat-icon {
		font-size: 2.5rem;
		position: relative;
		z-index: 1;
	}

	.stat-content {
		flex: 1;
		position: relative;
		z-index: 1;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--primary);
		line-height: 1;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: var(--space-xs);
	}

	.distribution-list {
		padding: var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.distribution-item {
		display: block;
		text-align: left;
		background: transparent;
		border: none;
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		color: inherit;
		width: 100%;
		position: relative;
		animation: fadeInUp 0.4s ease-out backwards;
	}

	.distribution-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 3px;
		background: var(--primary);
		opacity: 0;
		transition: opacity var(--transition-fast);
	}

	.distribution-item:hover {
		background: rgba(99, 102, 241, 0.05);
		transform: translateX(8px);
	}

	.distribution-item:hover::before {
		opacity: 1;
	}

	.distribution-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.category-icon-small {
		font-size: 1.75rem;
	}

	.category-name {
		font-weight: 600;
		flex: 1;
		color: var(--text-primary);
	}

	.item-count {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.progress-bar {
		height: 10px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: var(--space-sm);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.progress-fill {
		height: 100%;
		transition: width var(--transition-base);
		border-radius: var(--radius-full);
		box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
		animation: progressGrow 0.8s ease-out backwards;
	}

	@keyframes progressGrow {
		from { width: 0 !important; }
	}

	.percentage-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-align: right;
	}

	.section {
		margin-bottom: var(--space-2xl);
	}

	.section.distribution-section,
	.section.activity-section {
		animation: fadeInUp 0.6s ease-out 0.4s backwards;
	}

	.section-title {
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 700;
	}

	.section-header {
		margin-bottom: var(--space-lg);
	}

	.section-header h2 {
		margin-bottom: var(--space-xs);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
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
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.category-card:hover {
		transform: translateY(-6px) scale(1.02);
		box-shadow: 
			0 12px 32px rgba(0, 0, 0, 0.15),
			0 0 40px rgba(99, 102, 241, 0.1);
		border-color: var(--primary);
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
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
		line-clamp: 2;
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
		gap: var(--space-lg);
		padding: var(--space-xl);
		width: 100%;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-color);
		cursor: pointer;
		text-align: left;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		color: inherit;
		animation: fadeInUp 0.4s ease-out backwards;
		position: relative;
	}

	.activity-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 3px;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		opacity: 0;
		transform: scaleY(0);
		transition: all var(--transition-base);
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-item:hover {
		background: linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%);
		transform: translateX(8px);
	}

	.activity-item:hover::before {
		opacity: 1;
		transform: scaleY(1);
	}

	.activity-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-title {
		font-weight: 600;
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
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);
		color: var(--primary);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border: 1px solid rgba(99, 102, 241, 0.2);
	}

	.arrow {
		color: var(--text-muted);
		font-size: 1.5rem;
		flex-shrink: 0;
		transition: all var(--transition-fast);
	}

	.activity-item:hover .arrow {
		transform: translateX(6px) scale(1.1);
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

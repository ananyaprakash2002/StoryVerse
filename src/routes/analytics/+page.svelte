<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { getAllAnalytics, type AnalyticsData } from '$lib/services/analytics';
	import { error as logError } from '$lib/utils/logger';
	import Loader from '$lib/components/common/Loader.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import TimeSeriesChart from '$lib/components/analytics/TimeSeriesChart.svelte';
	import DistributionChart from '$lib/components/analytics/DistributionChart.svelte';
	import RatingChart from '$lib/components/analytics/RatingChart.svelte';
	import InsightsPanel from '$lib/components/analytics/InsightsPanel.svelte';

	// Animated counters
	const totalCategoriesCount = tweened(0, { duration: 1000, easing: cubicOut });
	const totalItemsCount = tweened(0, { duration: 1200, easing: cubicOut });
	const categoriesWithItemsCount = tweened(0, { duration: 800, easing: cubicOut });
	const avgItemsCount = tweened(0, { duration: 1000, easing: cubicOut });

	let loading = true;
	let analytics: AnalyticsData | null = null;
	let selectedPeriod: '7d' | '30d' | '90d' | '1y' | 'all' = '30d';

	onMount(async () => {
		await loadAnalytics();
	});

	async function loadAnalytics() {
		loading = true;
		try {
			analytics = await getAllAnalytics(selectedPeriod);
			// Animate counters after loading
			if (analytics) {
				setTimeout(() => {
					totalCategoriesCount.set(analytics!.overallStats.totalCategories);
					totalItemsCount.set(analytics!.overallStats.totalItems);
					categoriesWithItemsCount.set(analytics!.overallStats.categoriesWithItems);
					avgItemsCount.set(analytics!.overallStats.averageItemsPerCategory);
				}, 100);
			}
		} catch (err) {
			logError('Failed to load analytics:', err);
		} finally {
			loading = false;
		}
	}

	async function handlePeriodChange(period: typeof selectedPeriod) {
		selectedPeriod = period;
		await loadAnalytics();
	}
</script>

<div class="page container">
	<div class="header">
		<div>
			<h1 class="page-title">Analytics</h1>
			<p class="subtitle">Visualize your media tracking journey</p>
		</div>
		<!-- Future: Export button -->
		<!-- <Button variant="secondary">📥 Export Data</Button> -->
	</div>

	{#if loading}
		<div class="loading-container">
			<Loader size="lg" />
		</div>
	{:else if analytics}
		<!-- Period Selector -->
		<div class="period-selector">
			<button
				class="period-btn"
				class:active={selectedPeriod === '7d'}
				on:click={() => handlePeriodChange('7d')}
			>
				7 Days
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === '30d'}
				on:click={() => handlePeriodChange('30d')}
			>
				30 Days
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === '90d'}
				on:click={() => handlePeriodChange('90d')}
			>
				90 Days
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === '1y'}
				on:click={() => handlePeriodChange('1y')}
			>
				1 Year
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === 'all'}
				on:click={() => handlePeriodChange('all')}
			>
				All Time
			</button>
		</div>

		<!-- Insights -->
		{#if analytics.insights.length > 0}
			<section class="section insights-section">
				<h2 class="section-title">Key Insights</h2>
				<InsightsPanel insights={analytics.insights} />
			</section>
		{/if}

		<!-- Overall Stats Summary -->
		<section class="section stats-section">
			<h2 class="section-title">Summary</h2>
			<div class="stats-grid">
				<div class="stat-card" style="animation-delay: 0.1s">
					<span class="stat-label">Total Categories</span>
					<span class="stat-value">{Math.floor($totalCategoriesCount)}</span>
				</div>
				<div class="stat-card" style="animation-delay: 0.2s">
					<span class="stat-label">Total Items</span>
					<span class="stat-value">{Math.floor($totalItemsCount)}</span>
				</div>
				<div class="stat-card" style="animation-delay: 0.3s">
					<span class="stat-label">Categories with Items</span>
					<span class="stat-value">{Math.floor($categoriesWithItemsCount)}</span>
				</div>
				<div class="stat-card" style="animation-delay: 0.4s">
					<span class="stat-label">Avg Items per Category</span>
					<span class="stat-value">{$avgItemsCount.toFixed(1)}</span>
				</div>
			</div>
		</section>

		<!-- Time Series Chart -->
		{#if analytics.timeSeries.length > 0}
			<section class="section chart-section">
				<div class="card chart-card">
					<TimeSeriesChart data={analytics.timeSeries} />
				</div>
			</section>
		{/if}

		<!-- Charts Grid -->
		<section class="section chart-section">
			<div class="charts-grid">
				<!-- Category Distribution -->
				{#if analytics.categoryDistribution.length > 0}
					<div class="card chart-card">
						<DistributionChart data={analytics.categoryDistribution} />
					</div>
				{/if}

				<!-- Rating Distribution -->
				{#if analytics.ratingDistribution.some((d) => d.count > 0)}
					<div class="card chart-card">
						<RatingChart data={analytics.ratingDistribution} />
					</div>
				{/if}
			</div>
		</section>
	{:else}
		<div class="empty-state card">
			<span class="empty-icon">📊</span>
			<h2>No Data Yet</h2>
			<p>Start adding items to your categories to see analytics here!</p>
		</div>
	{/if}
</div>

<style>
	.header {
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

	.page-title {
		font-size: 2.5rem;
		margin-bottom: var(--space-sm);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 800;
	}

	.subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-md);
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: var(--space-2xl);
	}

	.period-selector {
		display: inline-flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-2xl);
		padding: var(--space-xs);
		background: var(--bg-secondary);
		border-radius: var(--radius-full);
		border: 1px solid var(--border-color);
		position: relative;
		animation: fadeInUp 0.6s ease-out 0.2s backwards;
	}

	.period-btn {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: none;
		border-radius: var(--radius-full);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		z-index: 1;
	}

	.period-btn:hover {
		color: var(--text-primary);
	}

	.period-btn.active {
		background: var(--primary);
		color: white;
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
	}

	.section {
		margin-bottom: var(--space-2xl);
	}

	.section.insights-section,
	.section.stats-section {
		animation: fadeInUp 0.6s ease-out 0.3s backwards;
	}

	.section.chart-section {
		animation: fadeInUp 0.6s ease-out 0.4s backwards;
	}

	.section-title {
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 700;
		margin-bottom: var(--space-xl);
	}

	.chart-card {
		padding: var(--space-xl);
		animation: fadeInUp 0.5s ease-out backwards;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: var(--space-lg);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-lg);
	}

	.stat-card {
		padding: var(--space-xl);
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: fadeInUp 0.5s ease-out backwards;
	}

	.stat-card::before {
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

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 
			0 8px 24px rgba(99, 102, 241, 0.15),
			0 0 40px rgba(99, 102, 241, 0.1);
		border-color: var(--primary);
	}

	.stat-card:hover::before {
		opacity: 0.05;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		position: relative;
		z-index: 1;
	}

	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: var(--space-lg);
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: var(--space-md);
		}

		.header h1 {
			font-size: 2rem;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.period-selector {
			justify-content: center;
		}

		.stats-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>

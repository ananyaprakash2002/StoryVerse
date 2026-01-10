<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllAnalytics, type AnalyticsData } from '$lib/services/analytics';
	import Loader from '$lib/components/common/Loader.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import TimeSeriesChart from '$lib/components/analytics/TimeSeriesChart.svelte';
	import DistributionChart from '$lib/components/analytics/DistributionChart.svelte';
	import RatingChart from '$lib/components/analytics/RatingChart.svelte';
	import InsightsPanel from '$lib/components/analytics/InsightsPanel.svelte';

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
		} catch (err) {
			console.error('Failed to load analytics:', err);
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
			<h1>📊 Analytics</h1>
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
			<section class="section">
				<h2>Key Insights</h2>
				<InsightsPanel insights={analytics.insights} />
			</section>
		{/if}

		<!-- Overall Stats Summary -->
		<section class="section">
			<div class="stats-summary card">
				<h3>Summary</h3>
				<div class="stats-grid">
					<div class="stat">
						<span class="stat-label">Total Categories</span>
						<span class="stat-value">{analytics.overallStats.totalCategories}</span>
					</div>
					<div class="stat">
						<span class="stat-label">Total Items</span>
						<span class="stat-value">{analytics.overallStats.totalItems}</span>
					</div>
					<div class="stat">
						<span class="stat-label">Categories with Items</span>
						<span class="stat-value">{analytics.overallStats.categoriesWithItems}</span>
					</div>
					<div class="stat">
						<span class="stat-label">Avg Items per Category</span>
						<span class="stat-value">{analytics.overallStats.averageItemsPerCategory.toFixed(1)}</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Time Series Chart -->
		{#if analytics.timeSeries.length > 0}
			<section class="section">
				<div class="card chart-card">
					<TimeSeriesChart data={analytics.timeSeries} />
				</div>
			</section>
		{/if}

		<!-- Charts Grid -->
		<section class="section">
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
	}

	.header h1 {
		font-size: 2.5rem;
		margin-bottom: var(--space-sm);
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
		display: flex;
		gap: var(--space-sm);
		margin-bottom: var(--space-2xl);
		flex-wrap: wrap;
	}

	.period-btn {
		padding: var(--space-sm) var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.period-btn:hover {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.period-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.section {
		margin-bottom: var(--space-2xl);
	}

	.section h2 {
		margin-bottom: var(--space-lg);
	}

	.chart-card {
		padding: var(--space-xl);
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: var(--space-lg);
	}

	.stats-summary h3 {
		margin-bottom: var(--space-lg);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-lg);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
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

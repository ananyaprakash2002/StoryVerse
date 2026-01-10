<script lang="ts">
	import {
		Chart,
		BarElement,
		BarController,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		type ChartConfiguration
	} from 'chart.js';
	import type { RatingDistribution } from '$lib/services/analytics';

	// Register Chart.js components
	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

	interface Props {
		data: RatingDistribution[];
		title?: string;
	}

	let { data, title = 'Rating Distribution' }: Props = $props();

	let canvasRef: HTMLCanvasElement | undefined = $state();
	let chart: Chart | null = null;

	// Color gradient from red to green
	const ratingColors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];
	let currentTheme = $state('dark');

	import { onMount } from 'svelte';
	
	onMount(() => {
		currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
		
		// Watch for theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'data-theme') {
					currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
				}
			});
		});
		observer.observe(document.documentElement, { attributes: true });
		
		return () => {
			observer.disconnect();
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});

	// Initialize chart when canvas is ready, or theme changes
	$effect(() => {
		// Reference currentTheme so effect re-runs on theme change
		const theme = currentTheme;
		
		if (!canvasRef || !data) return;

		// Destroy existing chart if it exists
		if (chart) {
			chart.destroy();
		}

		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels: data.map((d) => `${d.rating} ⭐`),
				datasets: [
					{
						label: 'Count',
						data: data.map((d) => d.count),
						backgroundColor: ratingColors,
						borderColor: ratingColors.map((c) => c),
						borderWidth: 1,
						borderRadius: 8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						padding: 12,
						titleColor: '#fff',
						bodyColor: '#fff',
						borderWidth: 1,
						callbacks: {
							label: function (context) {
								return `${context.parsed.y} ${context.parsed.y === 1 ? 'item' : 'items'}`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							stepSize: 1,
							color: document.documentElement.getAttribute('data-theme') !== 'light' ? '#f9fafb' : '#24292f'
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.1)'
						}
					},
					x: {
						ticks: {
							color: document.documentElement.getAttribute('data-theme') !== 'light' ? '#f9fafb' : '#24292f'
						},
						grid: {
							display: false
						}
					}
				}
			}
		};

		chart = new Chart(canvasRef, config);

		// Cleanup function
		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});

	// Calculate average rating
	let averageRating = $derived(() => {
		const total = data.reduce((sum, d) => sum + d.rating * d.count, 0);
		const count = data.reduce((sum, d) => sum + d.count, 0);
		return count > 0 ? (total / count).toFixed(1) : '0.0';
	});
</script>

<div class="chart-container">
	{#if title}
		<div class="header">
			<h3 class="chart-title">{title}</h3>
			{#if data.some((d) => d.count > 0)}
				<div class="average">
					<span class="average-label">Average:</span>
					<span class="average-value">{averageRating()} ⭐</span>
				</div>
			{/if}
		</div>
	{/if}
	<div class="chart-wrapper">
		{#if !data.some((d) => d.count > 0)}
			<div class="empty-state">
				<p>No rated items yet</p>
			</div>
		{:else}
			<canvas bind:this={canvasRef}></canvas>
		{/if}
	</div>
</div>

<style>
	.chart-container {
		width: 100%;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-md);
	}

	.chart-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
	}

	.average {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.average-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.average-value {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--primary);
	}

	.chart-wrapper {
		position: relative;
		height: 250px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-state {
		text-align: center;
		color: var(--text-muted);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, ArcElement, DoughnutController, Tooltip, Legend, type ChartConfiguration } from 'chart.js';
	import type { CategoryDistribution } from '$lib/services/analytics';
	import { goto } from '$app/navigation';

	// Register Chart.js components
	Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

	interface Props {
		data: CategoryDistribution[];
		title?: string;
		clickable?: boolean;
	}

	let { data, title = 'Category Distribution', clickable = true }: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let chart: Chart | null = null;
	let mounted = $state(false);
	let currentTheme = $state('dark');

	function handleChartClick(event: any) {
		if (!chart || !clickable) return;

		const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);

		if (points.length > 0) {
			const firstPoint = points[0];
			const category = data[firstPoint.index];
			if (category) {
				goto(`/categories/${category.categoryId}`);
			}
		}
	}

	onMount(() => {
		mounted = true;
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

	// Initialize chart when canvas and data are ready, or theme changes
	$effect(() => {
		// Reference currentTheme so effect re-runs on theme change
		const theme = currentTheme;
		
		if (!mounted || !canvasElement || !data || data.length === 0) {
			return;
		}

		// Destroy existing chart if it exists
		if (chart) {
			chart.destroy();
		}

		try {
			const config: ChartConfiguration = {
				type: 'doughnut',
				data: {
					labels: data.map((d) => d.categoryName),
					datasets: [
						{
							data: data.map((d) => d.count),
							backgroundColor: data.map((d) => d.categoryColor),
							borderColor: 'rgba(0, 0, 0, 0.1)',
							borderWidth: 2,
							hoverOffset: 10
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'right',
							labels: {
								color: document.documentElement.getAttribute('data-theme') !== 'light' ? '#f9fafb' : '#24292f',
								padding: 15,
								font: {
									size: 13
								},
								generateLabels: (chart) => {
									const datasets = chart.data.datasets;
									if (datasets.length === 0) return [];

									return (
										chart.data.labels?.map((label, i) => {
											const dataset = datasets[0];
											const value = dataset.data[i] as number;
											const category = data[i];
											const percentage = category.percentage.toFixed(1);

											return {
												text: `${label} (${value}) ${percentage}%`,
												fillStyle: dataset.backgroundColor?.[i] as string,
												fontColor: document.documentElement.getAttribute('data-theme') !== 'light' ? '#f9fafb' : '#24292f',
												hidden: false,
												index: i
											};
										}) || []
									);
								}
							}
						},
						tooltip: {
							backgroundColor: 'rgba(0, 0, 0, 0.8)',
							padding: 12,
							titleColor: '#fff',
							bodyColor: '#fff',
							borderWidth: 1,
							callbacks: {
								label: function (context) {
									const category = data[context.dataIndex];
									return `${category.categoryName}: ${category.count} items (${category.percentage.toFixed(1)}%)`;
								}
							}
						}
					},
					onClick: clickable ? handleChartClick : undefined
				}
			};

			chart = new Chart(canvasElement, config);
		} catch (error) {
			console.error('Error creating chart:', error);
		}
	});
</script>

<div class="chart-container">
	{#if title}
		<h3 class="chart-title">{title}</h3>
	{/if}
	<div class="chart-wrapper">
		{#if data.length === 0}
			<div class="empty-state">
				<p>No data to display</p>
			</div>
		{:else}
			<canvas bind:this={canvasElement}></canvas>
		{/if}
	</div>
</div>

<style>
	.chart-container {
		width: 100%;
	}

	.chart-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-md);
		color: var(--text-primary);
	}

	.chart-wrapper {
		position: relative;
		height: 300px;
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

<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Chart,
		CategoryScale,
		LinearScale,
		LineElement,
		LineController,
		PointElement,
		Title,
		Tooltip,
		Legend,
		Filler,
		type ChartConfiguration
	} from 'chart.js';
	import type { TimeSeriesDataPoint } from '$lib/services/analytics';

	// Register Chart.js components
	Chart.register(LineController, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

	interface Props {
		data: TimeSeriesDataPoint[];
		title?: string;
		color?: string;
	}

	let { data, title = 'Items Added Over Time', color = '#60a5fa' }: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let chart: Chart | null = null;
	let mounted = $state(false);
	let currentTheme = $state('dark');

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
				type: 'line',
				data: {
					labels: data.map((d) => {
						const date = new Date(d.date);
						return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
					}),
					datasets: [
						{
							label: 'Items',
							data: data.map((d) => d.count),
							borderColor: color,
							backgroundColor: color + '33',
							fill: true,
							tension: 0.4,
							pointRadius: 4,
							pointHoverRadius: 6
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
						title: {
							display: false
						},
						tooltip: {
							mode: 'index',
							intersect: false,
							backgroundColor: 'rgba(0, 0, 0, 0.8)',
							padding: 12,
							titleColor: '#fff',
							bodyColor: '#fff',
							borderColor: color,
							borderWidth: 1
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
								color: document.documentElement.getAttribute('data-theme') !== 'light' ? '#f9fafb' : '#24292f',
								maxRotation: 45,
								minRotation: 0
							},
							grid: {
								color: 'rgba(255, 255, 255, 0.1)'
							}
						}
					}
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
		<canvas bind:this={canvasElement}></canvas>
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
	}
</style>

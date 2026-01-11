<script lang="ts">
	import type { Insight } from '$lib/services/analytics';

	interface Props {
		insights: Insight[];
	}

	let { insights }: Props = $props();
</script>

<div class="insights-grid">
	{#each insights as insight}
		<div class="insight-card" class:achievement={insight.type === 'achievement'}>
			<div class="insight-icon">{insight.icon}</div>
			<div class="insight-content">
				<div class="insight-header">
					<span class="insight-title">{insight.title}</span>
					{#if insight.trend}
						<span class="trend" class:up={insight.trend === 'up'} class:down={insight.trend === 'down'}>
							{#if insight.trend === 'up'}
								↑
							{:else if insight.trend === 'down'}
								↓
							{:else}
								−
							{/if}
							{#if insight.trendValue !== undefined}
								{insight.trendValue}%
							{/if}
						</span>
					{/if}
				</div>
				<div class="insight-value">{insight.value}</div>
				<div class="insight-description">{insight.description}</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-lg);
	}

	.insight-card {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		transition: all var(--transition-base);
	}

	.insight-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--primary);
	}

	.insight-card.achievement {
		/* Use the same background and border as other cards to keep visual consistency across themes */
		background: var(--bg-secondary);
		border-color: var(--border-color);
	}

	/* Keep the icon visually inline with other cards: remove boxed container */
	.insight-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
		background: transparent;
		border: none;
		padding: 0;
		box-shadow: none;
		border-radius: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.insight-content {
		flex: 1;
		min-width: 0;
	}

	.insight-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xs);
	}

	.insight-title {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.trend {
		font-size: var(--font-size-xs);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.trend.up {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
	}

	.trend.down {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.insight-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
		line-height: 1.2;
	}

	.insight-description {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.insights-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

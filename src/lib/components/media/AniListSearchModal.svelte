<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { searchAnime, searchManga, type AnimeData } from '$lib/services/api-integrations/anilist';
	import { error as logError } from '$lib/utils/logger';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Loader from '$lib/components/common/Loader.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		defaultType?: 'ANIME' | 'MANGA';
	}

	let { isOpen, onClose, defaultType = 'ANIME' }: Props = $props();

	const dispatch = createEventDispatcher<{ select: AnimeData }>();

	let searchQuery = $state('');
	let searchType: 'ANIME' | 'MANGA' = $state(defaultType);
	let searching = $state(false);
	let results: AnimeData[] = $state([]);
	let error = $state('');

	// Reset search type when defaultType changes
	$effect(() => {
		searchType = defaultType;
	});

	async function handleSearch() {
		if (!searchQuery.trim()) return;

		searching = true;
		error = '';
		results = [];

		try {
			if (searchType === 'ANIME') {
				results = await searchAnime(searchQuery.trim(), 10);
			} else {
				results = await searchManga(searchQuery.trim(), 10);
			}
			
			if (results.length === 0) {
				error = `No ${searchType.toLowerCase()} found. Try a different search term.`;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to search. Please try again.';
			logError('AniList search error:', err);
		} finally {
			searching = false;
		}
	}

	function handleSelect(item: AnimeData) {
		dispatch('select', item);
		handleClose();
	}

	function handleClose() {
		searchQuery = '';
		results = [];
		error = '';
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	function formatScore(score: number | null): string {
		if (score === null) return 'N/A';
		return `${score.toFixed(1)}/10`;
	}
</script>

<Modal {isOpen} {onClose} title="Search AniList">
	<div class="search-modal">
		<!-- Search Type Selector -->
		<div class="search-type">
			<button
				class="type-btn"
				class:active={searchType === 'ANIME'}
				onclick={() => (searchType = 'ANIME')}
			>
				📺 Anime
			</button>
			<button
				class="type-btn"
				class:active={searchType === 'MANGA'}
				onclick={() => (searchType = 'MANGA')}
			>
				📖 Manga
			</button>
		</div>

		<!-- Search Input -->
		<div class="search-input-group">
			<input
				type="text"
				class="search-input"
				placeholder={`Search ${searchType.toLowerCase()} by title...`}
				bind:value={searchQuery}
				onkeydown={handleKeydown}
			/>
			<Button variant="primary" onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
				{searching ? 'Searching...' : '🔍 Search'}
			</Button>
		</div>

		<!-- Loading State -->
		{#if searching}
			<div class="loading">
				<Loader size="md" />
				<p>Searching AniList...</p>
			</div>
		{/if}

		<!-- Error State -->
		{#if error}
			<div class="error-message">
				<span class="error-icon">⚠️</span>
				{error}
			</div>
		{/if}

		<!-- Results -->
		{#if results.length > 0 && !searching}
			<div class="results">
				<p class="results-count">Found {results.length} {results.length === 1 ? 'result' : 'results'}</p>
				<div class="results-grid">
					{#each results as item}
						<div class="media-card">
							<div class="media-cover">
								{#if item.coverImage}
									<img src={item.coverImage} alt={item.title} />
								{:else}
									<div class="no-cover">{searchType === 'ANIME' ? '📺' : '📖'}</div>
								{/if}
							</div>
							<div class="media-info">
								<h4 class="media-title">{item.title}</h4>
								{#if item.titleEnglish && item.titleEnglish !== item.title}
									<p class="media-alt-title">{item.titleEnglish}</p>
								{/if}
								<div class="media-meta">
									{#if item.format}
										<span class="meta-tag">{item.format}</span>
									{/if}
									{#if item.status}
										<span class="meta-tag status">{item.status}</span>
									{/if}
									{#if item.episodes}
										<span class="meta-info">{item.episodes} eps</span>
									{/if}
									{#if item.chapters}
										<span class="meta-info">{item.chapters} chs</span>
									{/if}
								</div>
								{#if item.genres.length > 0}
									<p class="media-genres">{item.genres.slice(0, 3).join(', ')}</p>
								{/if}
								<div class="media-score">
									⭐ {formatScore(item.score)}
								</div>
								<Button variant="secondary" size="sm" onClick={() => handleSelect(item)}>
									Select
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Modal>

<style>
	.search-modal {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-height: 400px;
	}

	.search-type {
		display: flex;
		gap: var(--space-sm);
	}

	.type-btn {
		flex: 1;
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.type-btn:hover {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.type-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.search-input-group {
		display: flex;
		gap: var(--space-sm);
	}

	.search-input {
		flex: 1;
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-md);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-2xl);
		color: var(--text-muted);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		color: #ef4444;
	}

	.error-icon {
		font-size: 1.25rem;
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.results-count {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.results-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		max-height: 500px;
		overflow-y: auto;
	}

	.media-card {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.media-card:hover {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.media-cover {
		flex-shrink: 0;
		width: 85px;
		height: 120px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-tertiary);
	}

	.media-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-cover {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		opacity: 0.3;
	}

	.media-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-width: 0;
	}

	.media-title {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	.media-alt-title {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin: 0;
		font-style: italic;
	}

	.media-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}

	.meta-tag {
		padding: 2px 8px;
		background: rgba(96, 165, 250, 0.15);
		border-radius: var(--radius-sm);
		font-size: 11px;
		color: var(--primary);
		text-transform: uppercase;
		font-weight: 500;
	}

	.meta-tag.status {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.meta-info {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.media-genres {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		margin: 0;
	}

	.media-score {
		font-size: var(--font-size-sm);
		color: var(--warning);
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.media-card {
			flex-direction: column;
		}

		.media-cover {
			width: 100%;
			height: 200px;
		}
	}
</style>

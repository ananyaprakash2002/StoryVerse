<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { searchBooks, searchByISBN } from '$lib/services/api-integrations/google-books';
	import type { BookData } from '$lib/types/api';
	import { error as logError } from '$lib/utils/logger';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Loader from '$lib/components/common/Loader.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const dispatch = createEventDispatcher<{ select: BookData }>();

	let searchQuery = $state('');
	let searchType: 'title' | 'isbn' = $state('title');
	let searching = $state(false);
	let results: BookData[] = $state([]);
	let error = $state('');

	async function handleSearch() {
		if (!searchQuery.trim()) return;

		searching = true;
		error = '';
		results = [];

		try {
			if (searchType === 'isbn') {
				const book = await searchByISBN(searchQuery.trim());
				results = book ? [book] : [];
				if (!book) {
					error = 'No book found with that ISBN';
				}
			} else {
				results = await searchBooks(searchQuery.trim(), 10);
				if (results.length === 0) {
					error = 'No books found. Try a different search term.';
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to search books';
			logError('Search error:', err);
		} finally {
			searching = false;
		}
	}

	function handleSelect(book: BookData) {
		dispatch('select', book);
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
</script>

<Modal {isOpen} {onClose} title="Search Google Books">
	<div class="search-modal">
		<!-- Search Type Selector -->
		<div class="search-type">
			<button
				class="type-btn"
				class:active={searchType === 'title'}
				onclick={() => (searchType = 'title')}
			>
				📚 Title/Author
			</button>
			<button
				class="type-btn"
				class:active={searchType === 'isbn'}
				onclick={() => (searchType = 'isbn')}
			>
				🔢 ISBN
			</button>
		</div>

		<!-- Search Input -->
		<div class="search-input-group">
			<input
				type="text"
				class="search-input"
				placeholder={searchType === 'isbn' ? 'Enter ISBN (e.g., 9780439708180)' : 'Enter book title or author'}
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
				<p>Searching Google Books...</p>
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
				<p class="results-count">Found {results.length} {results.length === 1 ? 'book' : 'books'}</p>
				<div class="results-grid">
					{#each results as book}
						<div class="book-card">
							<div class="book-cover">
								{#if book.coverImage}
									<img src={book.coverImage} alt={book.title} />
								{:else}
									<div class="no-cover">📚</div>
								{/if}
							</div>
							<div class="book-info">
								<h4 class="book-title">{book.title}</h4>
								{#if book.authors && book.authors.length > 0}
									<p class="book-author">by {book.authors.join(', ')}</p>
								{/if}
								{#if book.publishedDate}
									<p class="book-meta">{book.publishedDate}</p>
								{/if}
								{#if book.isbn}
									<p class="book-meta">ISBN: {book.isbn}</p>
								{/if}
								<Button variant="secondary" size="sm" onClick={() => handleSelect(book)}>
									Select This Book
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

	.book-card {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.book-card:hover {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.book-cover {
		flex-shrink: 0;
		width: 80px;
		height: 120px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-tertiary);
	}

	.book-cover img {
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

	.book-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.book-title {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.book-author {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin: 0;
	}

	.book-meta {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin: 0;
	}

	@media (max-width: 768px) {
		.book-card {
			flex-direction: column;
		}

		.book-cover {
			width: 100%;
			height: 200px;
		}
	}
</style>

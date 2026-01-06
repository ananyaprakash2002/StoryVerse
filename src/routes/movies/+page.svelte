<script lang="ts">
	import { onMount } from 'svelte';
	import { getMovies, createMovie, updateMovie, deleteMovie } from '$lib/services/movies';
	import { formatDate, getTodayDate } from '$lib/utils/dates';
	import { toasts } from '$lib/stores/ui';
	import type { Movie, MovieInput } from '$lib/types';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Loader from '$lib/components/common/Loader.svelte';
	import DeleteConfirm from '$lib/components/media/DeleteConfirm.svelte';

	let movies: Movie[] = [];
	let loading = true;
	let showModal = false;
	let showDeleteModal = false;
	let isEditing = false;
	let currentMovie: Movie | null = null;

	let formData: MovieInput = {
		name: '',
		date_watched: '',
		notes: ''
	};

	onMount(async () => {
		await loadMovies();
	});

	async function loadMovies() {
		loading = true;
		try {
			movies = await getMovies();
		} catch (error: any) {
			toasts.error('Failed to load movies: ' + error.message);
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		isEditing = false;
		currentMovie = null;
		formData = {
			name: '',
			date_watched: getTodayDate(),
			notes: ''
		};
		showModal = true;
	}

	function openEditModal(movie: Movie) {
		isEditing = true;
		currentMovie = movie;
		formData = {
			name: movie.name,
			date_watched: movie.date_watched,
			notes: movie.notes || ''
		};
		showModal = true;
	}

	function openDeleteModal(movie: Movie) {
		currentMovie = movie;
		showDeleteModal = true;
	}

	async function handleSubmit() {
		if (!formData.name.trim()) {
			toasts.error('Name is required');
			return;
		}

		if (!formData.date_watched) {
			toasts.error('Date watched is required');
			return;
		}

		try {
			if (isEditing && currentMovie) {
				await updateMovie(currentMovie.id, formData);
				toasts.success('Movie updated successfully');
			} else {
				await createMovie(formData);
				toasts.success('Movie added successfully');
			}
			showModal = false;
			await loadMovies();
		} catch (error: any) {
			toasts.error('Failed to save movie: ' + error.message);
		}
	}

	async function handleDelete() {
		if (!currentMovie) return;

		try {
			await deleteMovie(currentMovie.id);
			toasts.success('Movie deleted successfully');
			showDeleteModal = false;
			currentMovie = null;
			await loadMovies();
		} catch (error: any) {
			toasts.error('Failed to delete movie: ' + error.message);
		}
	}
</script>

<div class="page">
	<div class="container">
		<div class="page-header flex justify-between items-center">
			<div>
				<h1>🎥 Movies</h1>
				<p class="text-muted">Track the movies you've watched</p>
			</div>
			<Button variant="primary" onClick={openAddModal}>+ Add Movie</Button>
		</div>

		{#if loading}
			<Loader size="lg" />
		{:else if movies.length === 0}
			<div class="empty-state card">
				<div class="empty-icon">🎥</div>
				<h3>No movies yet</h3>
				<p>Start tracking the movies you watch!</p>
				<Button variant="primary" onClick={openAddModal}>Add Your First Movie</Button>
			</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Date Watched</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each movies as movie}
							<tr>
								<td>
									<strong>{movie.name}</strong>
									{#if movie.notes}
										<p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
											{movie.notes}
										</p>
									{/if}
								</td>
								<td>{formatDate(movie.date_watched)}</td>
								<td>
									<div class="action-buttons">
										<button
											class="btn btn-secondary btn-sm"
											on:click={() => openEditModal(movie)}
										>
											Edit
										</button>
										<button
											class="btn btn-danger btn-sm"
											on:click={() => openDeleteModal(movie)}
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<Modal bind:isOpen={showModal} title={isEditing ? 'Edit Movie' : 'Add Movie'}>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="name" class="form-label">Name <span class="text-danger">*</span></label>
			<input
				type="text"
				id="name"
				class="form-input"
				bind:value={formData.name}
				placeholder="Enter movie name"
				required
			/>
		</div>

		<div class="form-group">
			<label for="date_watched" class="form-label">
				Date Watched <span class="text-danger">*</span>
			</label>
			<input
				type="date"
				id="date_watched"
				class="form-input"
				bind:value={formData.date_watched}
				required
			/>
		</div>

		<div class="form-group">
			<label for="notes" class="form-label">Notes</label>
			<textarea
				id="notes"
				class="form-textarea"
				bind:value={formData.notes}
				placeholder="Add your thoughts about the movie..."
			></textarea>
		</div>

		<div class="modal-footer">
			<button type="button" class="btn btn-secondary" on:click={() => (showModal = false)}>
				Cancel
			</button>
			<button type="submit" class="btn btn-primary">
				{isEditing ? 'Update' : 'Add'} Movie
			</button>
		</div>
	</form>
</Modal>

<DeleteConfirm
	bind:isOpen={showDeleteModal}
	itemName={currentMovie?.name || ''}
	onConfirm={handleDelete}
	onCancel={() => (showDeleteModal = false)}
/>

<style>
	.page-header {
		margin-bottom: var(--space-2xl);
	}

	.page-header h1 {
		margin-bottom: var(--space-xs);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: var(--space-lg);
	}

	.empty-state h3 {
		margin-bottom: var(--space-sm);
	}

	.empty-state p {
		margin-bottom: var(--space-xl);
	}

	.action-buttons {
		display: flex;
		gap: var(--space-sm);
	}

	@media (max-width: 768px) {
		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 600px;
		}
	}
</style>

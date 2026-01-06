<script lang="ts">
	import { onMount } from 'svelte';
	import { getAnime, createAnime, updateAnime, deleteAnime } from '$lib/services/anime';
	import { formatDate, getTodayDate } from '$lib/utils/dates';
	import { toasts } from '$lib/stores/ui';
	import type { Anime, AnimeInput } from '$lib/types';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Loader from '$lib/components/common/Loader.svelte';
	import StatusBadge from '$lib/components/media/StatusBadge.svelte';
	import DeleteConfirm from '$lib/components/media/DeleteConfirm.svelte';

	let animeList: Anime[] = [];
	let loading = true;
	let showModal = false;
	let showDeleteModal = false;
	let isEditing = false;
	let currentAnime: Anime | null = null;

	let formData: AnimeInput = {
		name: '',
		season: 1,
		episode: 0,
		completed: false,
		link: '',
		date_started: '',
		date_completed: '',
		notes: ''
	};

	onMount(async () => {
		await loadAnime();
	});

	async function loadAnime() {
		loading = true;
		try {
			animeList = await getAnime();
		} catch (error: any) {
			toasts.error('Failed to load anime: ' + error.message);
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		isEditing = false;
		currentAnime = null;
		formData = {
			name: '',
			season: 1,
			episode: 0,
			completed: false,
			link: '',
			date_started: getTodayDate(),
			date_completed: '',
			notes: ''
		};
		showModal = true;
	}

	function openEditModal(anime: Anime) {
		isEditing = true;
		currentAnime = anime;
		formData = {
			name: anime.name,
			season: anime.season,
			episode: anime.episode,
			completed: anime.completed,
			link: anime.link || '',
			date_started: anime.date_started || '',
			date_completed: anime.date_completed || '',
			notes: anime.notes || ''
		};
		showModal = true;
	}

	function openDeleteModal(anime: Anime) {
		currentAnime = anime;
		showDeleteModal = true;
	}

	async function handleSubmit() {
		if (!formData.name.trim()) {
			toasts.error('Name is required');
			return;
		}

		try {
			if (isEditing && currentAnime) {
				await updateAnime(currentAnime.id, formData);
				toasts.success('Anime updated successfully');
			} else {
				await createAnime(formData);
				toasts.success('Anime added successfully');
			}
			showModal = false;
			await loadAnime();
		} catch (error: any) {
			toasts.error('Failed to save anime: ' + error.message);
		}
	}

	async function handleDelete() {
		if (!currentAnime) return;

		try {
			await deleteAnime(currentAnime.id);
			toasts.success('Anime deleted successfully');
			showDeleteModal = false;
			currentAnime = null;
			await loadAnime();
		} catch (error: any) {
			toasts.error('Failed to delete anime: ' + error.message);
		}
	}

	function handleCompletedChange() {
		if (formData.completed && !formData.date_completed) {
			formData.date_completed = getTodayDate();
		}
	}
</script>

<div class="page">
	<div class="container">
		<div class="page-header flex justify-between items-center">
			<div>
				<h1>🎬 Anime</h1>
				<p class="text-muted">Track your anime watching progress</p>
			</div>
			<Button variant="primary" onClick={openAddModal}>+ Add Anime</Button>
		</div>

		{#if loading}
			<Loader size="lg" />
		{:else if animeList.length === 0}
			<div class="empty-state card">
				<div class="empty-icon">🎬</div>
				<h3>No anime yet</h3>
				<p>Start tracking your anime by adding your first one!</p>
				<Button variant="primary" onClick={openAddModal}>Add Your First Anime</Button>
			</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Progress</th>
							<th>Status</th>
							<th>Link</th>
							<th>Started</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each animeList as anime}
							<tr>
								<td>
									<strong>{anime.name}</strong>
									{#if anime.notes}
										<p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
											{anime.notes}
										</p>
									{/if}
								</td>
								<td>S{anime.season} E{anime.episode}</td>
								<td><StatusBadge status={anime.completed} /></td>
								<td>
									{#if anime.link}
										<a href={anime.link} target="_blank" rel="noopener noreferrer" class="link">
											Watch
										</a>
									{:else}
										-
									{/if}
								</td>
								<td>{formatDate(anime.date_started)}</td>
								<td>
									<div class="action-buttons">
										<button
											class="btn btn-secondary btn-sm"
											on:click={() => openEditModal(anime)}
										>
											Edit
										</button>
										<button
											class="btn btn-danger btn-sm"
											on:click={() => openDeleteModal(anime)}
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

<Modal bind:isOpen={showModal} title={isEditing ? 'Edit Anime' : 'Add Anime'}>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="name" class="form-label">Name <span class="text-danger">*</span></label>
			<input
				type="text"
				id="name"
				class="form-input"
				bind:value={formData.name}
				placeholder="Enter anime name"
				required
			/>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="season" class="form-label">Season</label>
				<input
					type="number"
					id="season"
					class="form-input"
					bind:value={formData.season}
					min="1"
					placeholder="1"
				/>
			</div>

			<div class="form-group">
				<label for="episode" class="form-label">Current Episode</label>
				<input
					type="number"
					id="episode"
					class="form-input"
					bind:value={formData.episode}
					min="0"
					placeholder="0"
				/>
			</div>
		</div>

		<div class="form-group">
			<label for="link" class="form-label">Link</label>
			<input
				type="url"
				id="link"
				class="form-input"
				bind:value={formData.link}
				placeholder="https://..."
			/>
		</div>

		<div class="form-group">
			<label for="date_started" class="form-label">Date Started</label>
			<input
				type="date"
				id="date_started"
				class="form-input"
				bind:value={formData.date_started}
			/>
		</div>

		<div class="form-group">
			<label class="form-label flex items-center gap-sm">
				<input
					type="checkbox"
					class="form-checkbox"
					bind:checked={formData.completed}
					on:change={handleCompletedChange}
				/>
				Completed
			</label>
		</div>

		{#if formData.completed}
			<div class="form-group">
				<label for="date_completed" class="form-label">Date Completed</label>
				<input
					type="date"
					id="date_completed"
					class="form-input"
					bind:value={formData.date_completed}
				/>
			</div>
		{/if}

		<div class="form-group">
			<label for="notes" class="form-label">Notes</label>
			<textarea
				id="notes"
				class="form-textarea"
				bind:value={formData.notes}
				placeholder="Add your thoughts..."
			></textarea>
		</div>

		<div class="modal-footer">
			<button type="button" class="btn btn-secondary" on:click={() => (showModal = false)}>
				Cancel
			</button>
			<button type="submit" class="btn btn-primary">
				{isEditing ? 'Update' : 'Add'} Anime
			</button>
		</div>
	</form>
</Modal>

<DeleteConfirm
	bind:isOpen={showDeleteModal}
	itemName={currentAnime?.name || ''}
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

	.link {
		color: var(--primary);
		text-decoration: underline;
	}

	.link:hover {
		color: var(--primary-hover);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	@media (max-width: 768px) {
		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 800px;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>

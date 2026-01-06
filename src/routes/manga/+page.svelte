<script lang="ts">
	import { onMount } from 'svelte';
	import { getManga, createManga, updateManga, deleteManga } from '$lib/services/manga';
	import { formatDate, getTodayDate } from '$lib/utils/dates';
	import { toasts } from '$lib/stores/ui';
	import type { Manga, MangaInput } from '$lib/types';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Loader from '$lib/components/common/Loader.svelte';
	import StatusBadge from '$lib/components/media/StatusBadge.svelte';
	import DeleteConfirm from '$lib/components/media/DeleteConfirm.svelte';

	let mangaList: Manga[] = [];
	let loading = true;
	let showModal = false;
	let showDeleteModal = false;
	let isEditing = false;
	let currentManga: Manga | null = null;

	let formData: MangaInput = {
		name: '',
		chapter: 0,
		completed: false,
		link: '',
		date_started: '',
		date_completed: '',
		notes: ''
	};

	onMount(async () => {
		await loadManga();
	});

	async function loadManga() {
		loading = true;
		try {
			mangaList = await getManga();
		} catch (error: any) {
			toasts.error('Failed to load manga: ' + error.message);
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		isEditing = false;
		currentManga = null;
		formData = {
			name: '',
			chapter: 0,
			completed: false,
			link: '',
			date_started: getTodayDate(),
			date_completed: '',
			notes: ''
		};
		showModal = true;
	}

	function openEditModal(manga: Manga) {
		isEditing = true;
		currentManga = manga;
		formData = {
			name: manga.name,
			chapter: manga.chapter,
			completed: manga.completed,
			link: manga.link || '',
			date_started: manga.date_started || '',
			date_completed: manga.date_completed || '',
			notes: manga.notes || ''
		};
		showModal = true;
	}

	function openDeleteModal(manga: Manga) {
		currentManga = manga;
		showDeleteModal = true;
	}

	async function handleSubmit() {
		if (!formData.name.trim()) {
			toasts.error('Name is required');
			return;
		}

		try {
			if (isEditing && currentManga) {
				await updateManga(currentManga.id, formData);
				toasts.success('Manga updated successfully');
			} else {
				await createManga(formData);
				toasts.success('Manga added successfully');
			}
			showModal = false;
			await loadManga();
		} catch (error: any) {
			toasts.error('Failed to save manga: ' + error.message);
		}
	}

	async function handleDelete() {
		if (!currentManga) return;

		try {
			await deleteManga(currentManga.id);
			toasts.success('Manga deleted successfully');
			showDeleteModal = false;
			currentManga = null;
			await loadManga();
		} catch (error: any) {
			toasts.error('Failed to delete manga: ' + error.message);
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
				<h1>📖 Manga</h1>
				<p class="text-muted">Track your manga reading progress</p>
			</div>
			<Button variant="primary" onClick={openAddModal}>+ Add Manga</Button>
		</div>

		{#if loading}
			<Loader size="lg" />
		{:else if mangaList.length === 0}
			<div class="empty-state card">
				<div class="empty-icon">📖</div>
				<h3>No manga yet</h3>
				<p>Start tracking your manga by adding your first one!</p>
				<Button variant="primary" onClick={openAddModal}>Add Your First Manga</Button>
			</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Chapter</th>
							<th>Status</th>
							<th>Link</th>
							<th>Started</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each mangaList as manga}
							<tr>
								<td>
									<strong>{manga.name}</strong>
									{#if manga.notes}
										<p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
											{manga.notes}
										</p>
									{/if}
								</td>
								<td>Chapter {manga.chapter}</td>
								<td><StatusBadge status={manga.completed} /></td>
								<td>
									{#if manga.link}
										<a href={manga.link} target="_blank" rel="noopener noreferrer" class="link">
											View
										</a>
									{:else}
										-
									{/if}
								</td>
								<td>{formatDate(manga.date_started)}</td>
								<td>
									<div class="action-buttons">
										<button
											class="btn btn-secondary btn-sm"
											on:click={() => openEditModal(manga)}
										>
											Edit
										</button>
										<button
											class="btn btn-danger btn-sm"
											on:click={() => openDeleteModal(manga)}
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

<Modal bind:isOpen={showModal} title={isEditing ? 'Edit Manga' : 'Add Manga'}>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="name" class="form-label">Name <span class="text-danger">*</span></label>
			<input
				type="text"
				id="name"
				class="form-input"
				bind:value={formData.name}
				placeholder="Enter manga name"
				required
			/>
		</div>

		<div class="form-group">
			<label for="chapter" class="form-label">Current Chapter</label>
			<input
				type="number"
				id="chapter"
				class="form-input"
				bind:value={formData.chapter}
				min="0"
				placeholder="0"
			/>
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
				{isEditing ? 'Update' : 'Add'} Manga
			</button>
		</div>
	</form>
</Modal>

<DeleteConfirm
	bind:isOpen={showDeleteModal}
	itemName={currentManga?.name || ''}
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

	@media (max-width: 768px) {
		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 800px;
		}
	}
</style>

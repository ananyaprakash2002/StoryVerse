<script lang="ts">
	import { onMount } from 'svelte';
	import { getBooks, createBook, updateBook, deleteBook } from '$lib/services/books';
	import { formatDate, getTodayDate } from '$lib/utils/dates';
	import { toasts } from '$lib/stores/ui';
	import type { Book, BookInput } from '$lib/types';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Loader from '$lib/components/common/Loader.svelte';
	import StatusBadge from '$lib/components/media/StatusBadge.svelte';
	import DeleteConfirm from '$lib/components/media/DeleteConfirm.svelte';

	let books: Book[] = [];
	let loading = true;
	let showModal = false;
	let showDeleteModal = false;
	let isEditing = false;
	let currentBook: Book | null = null;

	// Form state
	let formData: BookInput = {
		title: '',
		author: '',
		completed: false,
		date_started: '',
		date_completed: '',
		notes: ''
	};

	onMount(async () => {
		await loadBooks();
	});

	async function loadBooks() {
		loading = true;
		try {
			books = await getBooks();
		} catch (error: any) {
			toasts.error('Failed to load books: ' + error.message);
		} finally {
			loading = false;
		}
	}

	function openAddModal() {
		isEditing = false;
		currentBook = null;
		formData = {
			title: '',
			author: '',
			completed: false,
			date_started: getTodayDate(),
			date_completed: '',
			notes: ''
		};
		showModal = true;
	}

	function openEditModal(book: Book) {
		isEditing = true;
		currentBook = book;
		formData = {
			title: book.title,
			author: book.author || '',
			completed: book.completed,
			date_started: book.date_started || '',
			date_completed: book.date_completed || '',
			notes: book.notes || ''
		};
		showModal = true;
	}

	function openDeleteModal(book: Book) {
		currentBook = book;
		showDeleteModal = true;
	}

	async function handleSubmit() {
		if (!formData.title.trim()) {
			toasts.error('Title is required');
			return;
		}

		try {
			if (isEditing && currentBook) {
				await updateBook(currentBook.id, formData);
				toasts.success('Book updated successfully');
			} else {
				await createBook(formData);
				toasts.success('Book added successfully');
			}
			showModal = false;
			await loadBooks();
		} catch (error: any) {
			toasts.error('Failed to save book: ' + error.message);
		}
	}

	async function handleDelete() {
		if (!currentBook) return;

		try {
			await deleteBook(currentBook.id);
			toasts.success('Book deleted successfully');
			showDeleteModal = false;
			currentBook = null;
			await loadBooks();
		} catch (error: any) {
			toasts.error('Failed to delete book: ' + error.message);
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
				<h1>📚 Books</h1>
				<p class="text-muted">Track your reading journey</p>
			</div>
			<Button variant="primary" onClick={openAddModal}>+ Add Book</Button>
		</div>

		{#if loading}
			<Loader size="lg" />
		{:else if books.length === 0}
			<div class="empty-state card">
				<div class="empty-icon">📚</div>
				<h3>No books yet</h3>
				<p>Start tracking your reading by adding your first book!</p>
				<Button variant="primary" onClick={openAddModal}>Add Your First Book</Button>
			</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Title</th>
							<th>Author</th>
							<th>Status</th>
							<th>Started</th>
							<th>Completed</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each books as book}
							<tr>
								<td>
									<strong>{book.title}</strong>
									{#if book.notes}
										<p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
											{book.notes}
										</p>
									{/if}
								</td>
								<td>{book.author || '-'}</td>
								<td><StatusBadge status={book.completed} /></td>
								<td>{formatDate(book.date_started)}</td>
								<td>{formatDate(book.date_completed)}</td>
								<td>
									<div class="action-buttons">
										<button class="btn btn-secondary btn-sm" on:click={() => openEditModal(book)}>
											Edit
										</button>
										<button
											class="btn btn-danger btn-sm"
											on:click={() => openDeleteModal(book)}
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

<!-- Add/Edit Modal -->
<Modal bind:isOpen={showModal} title={isEditing ? 'Edit Book' : 'Add Book'}>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="title" class="form-label">Title <span class="text-danger">*</span></label>
			<input
				type="text"
				id="title"
				class="form-input"
				bind:value={formData.title}
				placeholder="Enter book title"
				required
			/>
		</div>

		<div class="form-group">
			<label for="author" class="form-label">Author</label>
			<input
				type="text"
				id="author"
				class="form-input"
				bind:value={formData.author}
				placeholder="Enter author name"
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
				{isEditing ? 'Update' : 'Add'} Book
			</button>
		</div>
	</form>
</Modal>

<!-- Delete Confirmation Modal -->
<DeleteConfirm
	bind:isOpen={showDeleteModal}
	itemName={currentBook?.title || ''}
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
			min-width: 800px;
		}
	}
</style>

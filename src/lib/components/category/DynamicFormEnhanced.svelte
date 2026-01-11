<script lang="ts">
	import type { CategoryField } from '$lib/types/category';
	import type { BookData } from '$lib/types/api';
	import DynamicField from './DynamicField.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import APISearchModal from '$lib/components/media/APISearchModal.svelte';
	import ImageUpload from '$lib/components/media/ImageUpload.svelte';

	export let fields: CategoryField[];
	export let values: Record<string, any> = {};
	export let onSubmit: (data: Record<string, any>, imageData?: { url: string; path: string; apiSource?: string; apiId?: string }) => void;
	export let submitLabel = 'Save';
	export let loading = false;
	export let categoryName = ''; // To detect if it's a Books category
	export let itemId = ''; // For image uploads

	let showAPISearch = false;
	let imageData: { url: string; path: string; apiSource?: string; apiId?: string } | null = null;

	// Check if this is a Books-related category (only show for books)
	$: isBookCategory = categoryName.toLowerCase().includes('book');

	// Initialize values for all fields
	fields.forEach((field) => {
		if (!(field.name in values)) {
			// Set default values based on field type
			switch (field.field_type) {
				case 'boolean':
					values[field.name] = false;
					break;
				case 'multiselect':
				case 'tags':
					values[field.name] = [];
					break;
				case 'number':
				case 'rating':
					values[field.name] = null;
					break;
				default:
					values[field.name] = '';
			}
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit(values, imageData || undefined);
	}

	function handleBookSelect(event: CustomEvent<BookData>) {
		const book = event.detail;
		
		// Auto-fill form with book data - match fields by common names
		const titleField = fields.find(f => f.name.toLowerCase().includes('title'));
		const authorField = fields.find(f => f.name.toLowerCase().includes('author'));
		const isbnField = fields.find(f => f.name.toLowerCase().includes('isbn'));
		const publisherField = fields.find(f => f.name.toLowerCase().includes('publisher'));
		const yearField = fields.find(f => f.name.toLowerCase().includes('year') || f.name.toLowerCase().includes('published'));
		const descriptionField = fields.find(f => f.name.toLowerCase().includes('description') || f.name.toLowerCase().includes('notes'));

		if (titleField) values[titleField.name] = book.title;
		if (authorField) values[authorField.name] = book.authors?.join(', ') || '';
		if (isbnField) values[isbnField.name] = book.isbn || '';
		if (publisherField) values[publisherField.name] = book.publisher || '';
		if (yearField) values[yearField.name] = book.publishedDate || '';
		if (descriptionField) values[descriptionField.name] = book.description || '';

		// Store image data
		if (book.coverImage) {
			imageData = {
				url: book.coverImage,
				path: '', // API image doesn't have a path in storage
				apiSource: 'google_books',
				apiId: book.id
			};
		}

		showAPISearch = false;
	}

	function handleImageUpload(event: CustomEvent<{url: string; path: string}>) {
		imageData = {
			url: event.detail.url,
			path: event.detail.path
		};
	}

	function handleImageDelete() {
		imageData = null;
	}

	function openAPISearch() {
		showAPISearch = true;
	}
</script>

<form on:submit={handleSubmit} class="dynamic-form">
	<!-- Google Books Search Button (only for book categories) -->
	{#if isBookCategory}
		<div class="api-search-section">
			<p class="helper-text">💡 Save time by searching Google Books to auto-fill details</p>
			<Button type="button" variant="secondary" onClick={openAPISearch}>
				🔍 Search Google Books
			</Button>
		</div>
	{/if}

	<!-- Cover Image Upload Section -->
	<div class="image-section">
		<label class="section-label">Cover Image (Optional)</label>
		<ImageUpload
			currentImageUrl={imageData?.url || ''}
			currentImagePath={imageData?.path || ''}
			{itemId}
			on:upload={handleImageUpload}
			on:delete={handleImageDelete}
		/>
	</div>

	<!-- Regular Form Fields -->
	<div class="fields-section">
		{#each fields as field (field.id)}
			<DynamicField {field} bind:value={values[field.name]} disabled={loading} />
		{/each}
	</div>

	<!-- Form Actions -->
	<div class="form-actions">
		<slot name="actions">
			<button type="submit" class="btn btn-primary" disabled={loading}>
				{loading ? 'Saving...' : submitLabel}
			</button>
		</slot>
	</div>
</form>

<!-- API Search Modal -->
<APISearchModal 
	isOpen={showAPISearch} 
	onClose={() => showAPISearch = false}
	on:select={handleBookSelect}
/>

<style>
	.dynamic-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.api-search-section {
		padding: var(--space-md);
		background: rgba(96, 165, 250, 0.1);
		border: 1px solid rgba(96, 165, 250, 0.3);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.helper-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin: 0;
	}

	.image-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.section-label {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
	}

	.fields-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.form-actions {
		margin-top: var(--space-lg);
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
	}
</style>

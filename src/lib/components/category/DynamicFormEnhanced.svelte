<script lang="ts">
	import type { CategoryField } from '$lib/types/category';
	import type { BookData } from '$lib/types/api';
	import DynamicField from './DynamicField.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import APISearchModal from '$lib/components/media/APISearchModal.svelte';
	import AniListSearchModal from '$lib/components/media/AniListSearchModal.svelte';
	import type { AnimeData } from '$lib/services/api-integrations/anilist';
	import ImageUpload from '$lib/components/media/ImageUpload.svelte';

	export let fields: CategoryField[];
	export let values: Record<string, any> = {};
	export let onSubmit: (data: Record<string, any>, imageData?: { url: string; path: string; apiSource?: string; apiId?: string }) => void;
	export let submitLabel = 'Save';
	export let loading = false;
	export let categoryName = ''; // To detect if it's a Books category
	export let itemId = ''; // For image uploads

	let showAPISearch = false;
	let showAniListSearch = false;
	let imageData: { url: string; path: string; apiSource?: string; apiId?: string } | null = null;

	// Check if this is a Books-related category
	$: isBookCategory = categoryName.toLowerCase().includes('book');
	
	// Check if this is an Anime/Manga-related category
	$: isAnimeCategory = categoryName.toLowerCase().includes('anime') || categoryName.toLowerCase().includes('anilist');
	$: isMangaCategory = categoryName.toLowerCase().includes('manga') || categoryName.toLowerCase().includes('manhwa') || categoryName.toLowerCase().includes('webtoon');
	$: isMediaCategory = isAnimeCategory || isMangaCategory;
	$: defaultMediaType = (isAnimeCategory ? 'ANIME' : 'MANGA') as 'ANIME' | 'MANGA';

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

	function openAniListSearch() {
		showAniListSearch = true;
	}

	function handleAnimeSelect(event: CustomEvent<AnimeData>) {
		const media = event.detail;
		
		// Auto-fill form with anime/manga data - match fields by common names
		const titleField = fields.find(f => f.name.toLowerCase().includes('title') || f.name.toLowerCase().includes('name'));
		const episodeField = fields.find(f => f.name.toLowerCase().includes('episode'));
		const chapterField = fields.find(f => f.name.toLowerCase().includes('chapter'));
		const statusField = fields.find(f => f.name.toLowerCase().includes('status'));
		const genreField = fields.find(f => f.name.toLowerCase().includes('genre'));
		const ratingField = fields.find(f => f.name.toLowerCase().includes('rating') || f.name.toLowerCase().includes('score'));
		const descriptionField = fields.find(f => f.name.toLowerCase().includes('description') || f.name.toLowerCase().includes('notes') || f.name.toLowerCase().includes('synopsis'));
		const formatField = fields.find(f => f.name.toLowerCase().includes('format') || f.name.toLowerCase().includes('type'));
		const studioField = fields.find(f => f.name.toLowerCase().includes('studio'));
		const yearField = fields.find(f => f.name.toLowerCase().includes('year') || f.name.toLowerCase().includes('date'));
		const linkField = fields.find(f => f.name.toLowerCase().includes('link') || f.name.toLowerCase().includes('url'));

		if (titleField) values[titleField.name] = media.title;
		if (episodeField && media.episodes) values[episodeField.name] = String(media.episodes);
		if (chapterField && media.chapters) values[chapterField.name] = String(media.chapters);
		if (statusField) values[statusField.name] = media.status || '';
		if (genreField) {
			// Handle both string and array genre fields
			const genreFieldDef = fields.find(f => f.name === genreField.name);
			if (genreFieldDef?.field_type === 'multiselect' || genreFieldDef?.field_type === 'tags') {
				values[genreField.name] = media.genres;
			} else {
				values[genreField.name] = media.genres.join(', ');
			}
		}
		if (ratingField && media.score) values[ratingField.name] = media.score;
		if (descriptionField) values[descriptionField.name] = media.description || '';
		if (formatField) values[formatField.name] = media.format || '';
		if (studioField) values[studioField.name] = media.studios.join(', ');
		if (yearField && media.startDate) values[yearField.name] = media.startDate;
		if (linkField) values[linkField.name] = media.siteUrl;

		// Store cover image data
		if (media.coverImage) {
			imageData = {
				url: media.coverImage,
				path: '',
				apiSource: 'anilist',
				apiId: media.id
			};
		}

		showAniListSearch = false;
	}

	// Auto-update reading link when chapter changes
	let previousChapter: string | null = null;
	
	$: {
		// Find chapter and link fields
		const chapterField = fields.find(f => 
			f.name.toLowerCase().includes('chapter') && 
			!f.name.toLowerCase().includes('link')
		);
		const linkField = fields.find(f => 
			f.name.toLowerCase().includes('link') || 
			f.name.toLowerCase().includes('url')
		);

		// Only proceed if both fields exist
		if (chapterField && linkField) {
			const currentChapter = values[chapterField.name];
			const currentLink = values[linkField.name];

			// Check if chapter was changed (not initial load)
			if (previousChapter !== null && 
				currentChapter !== previousChapter && 
				currentChapter && 
				currentLink) {
				
				// Update the URL by replacing chapter number
				const updatedLink = updateChapterInUrl(currentLink, currentChapter);
				if (updatedLink !== currentLink) {
					values[linkField.name] = updatedLink;
				}
			}

			// Store current chapter for next comparison
			previousChapter = currentChapter;
		}
	}

	/**
	 * Updates the chapter number in a URL
	 * Handles patterns like: /chapter-20/, /chapter/20/, /ch-20/, etc.
	 */
	function updateChapterInUrl(url: string, newChapter: string): string {
		// Common manga URL patterns
		const patterns = [
			/(\/chapter[-_]?)(\d+(?:\.\d+)?)(\/|$)/i,  // /chapter-20/ or /chapter_20/
			/(\/chapter\/?)(\d+(?:\.\d+)?)(\/|$)/i,    // /chapter/20/
			/(\/ch[-_]?)(\d+(?:\.\d+)?)(\/|$)/i,       // /ch-20/
			/(\/ep[-_]?)(\d+(?:\.\d+)?)(\/|$)/i,       // /ep-20/ (episode)
			/(\/episode[-_]?)(\d+(?:\.\d+)?)(\/|$)/i,  // /episode-20/
		];

		for (const pattern of patterns) {
			if (pattern.test(url)) {
				return url.replace(pattern, `$1${newChapter}$3`);
			}
		}

		// If no pattern matched, return original URL
		return url;
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

	<!-- AniList Search Button (only for anime/manga categories) -->
	{#if isMediaCategory}
		<div class="api-search-section anilist">
			<p class="helper-text">📺 Search AniList to auto-fill {isAnimeCategory ? 'anime' : 'manga'} details</p>
			<Button type="button" variant="secondary" onClick={openAniListSearch}>
				🔍 Search AniList
			</Button>
		</div>
	{/if}

	<!-- Cover Image Upload Section -->
	<div class="image-section">
		<h4 class="section-label">Cover Image (Optional)</h4>
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

<!-- AniList Search Modal -->
<AniListSearchModal 
	isOpen={showAniListSearch} 
	onClose={() => showAniListSearch = false}
	defaultType={defaultMediaType}
	on:select={handleAnimeSelect}
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

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { uploadImage, deleteImage } from '$lib/services/image-upload';
	import Button from '$lib/components/common/Button.svelte';
	import Loader from '$lib/components/common/Loader.svelte';

	interface Props {
		currentImageUrl?: string;
		currentImagePath?: string;
		itemId?: string;
	}

	let { currentImageUrl = '', currentImagePath = '', itemId = '' }: Props = $props();

	const dispatch = createEventDispatcher<{
		upload: { url: string; path: string };
		delete: void;
	}>();

	let uploading = $state(false);
	let deleting = $state(false);
	let error = $state('');
	let dragActive = $state(false);
	let fileInputRef: HTMLInputElement;

	async function handleFileSelect(file: File | null) {
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Please select an image file (JPG, PNG, GIF, WebP)';
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Image must be smaller than 5MB';
			return;
		}

		error = '';
		uploading = true;

		try {
			const result = await uploadImage(file, itemId);
			dispatch('upload', result);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to upload image';
			console.error('Upload error:', err);
		} finally {
			uploading = false;
		}
	}

	async function handleDelete() {
		if (!currentImagePath) return;

		deleting = true;
		error = '';

		try {
			await deleteImage(currentImagePath);
			dispatch('delete');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete image';
			console.error('Delete error:', err);
		} finally {
			deleting = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;

		const file = e.dataTransfer?.files[0];
		if (file) {
			handleFileSelect(file);
		}
	}

	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	}

	function triggerFileInput() {
		fileInputRef?.click();
	}
</script>

<div class="image-upload">
	{#if currentImageUrl}
		<!-- Preview Section -->
		<div class="preview-section">
			<div class="preview-image">
				<img src={currentImageUrl} alt="Cover preview" />
			</div>
			<div class="preview-actions">
				<Button variant="secondary" size="sm" onclick={triggerFileInput} disabled={uploading || deleting}>
					{uploading ? 'Uploading...' : '🔄 Replace'}
				</Button>
				<Button variant="danger" size="sm" onclick={handleDelete} disabled={uploading || deleting}>
					{deleting ? 'Deleting...' : '🗑️ Remove'}
				</Button>
			</div>
		</div>
	{:else}
		<!-- Upload Section -->
		<div
			class="upload-zone"
			class:drag-active={dragActive}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			onclick={triggerFileInput}
			onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
		>
			{#if uploading}
				<Loader size="md" />
				<p>Uploading image...</p>
			{:else}
				<div class="upload-icon">📸</div>
				<p class="upload-text">Drag & drop an image here</p>
				<p class="upload-subtext">or click to browse</p>
				<p class="upload-hint">JPG, PNG, GIF, WebP • Max 5MB</p>
			{/if}
		</div>
	{/if}

	<!-- Hidden File Input -->
	<input
		bind:this={fileInputRef}
		type="file"
		accept="image/*"
		onchange={handleInputChange}
		style="display: none;"
	/>

	<!-- Error Message -->
	{#if error}
		<div class="error-message">
			<span class="error-icon">⚠️</span>
			{error}
		</div>
	{/if}
</div>

<style>
	.image-upload {
		width: 100%;
	}

	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border: 2px dashed var(--border-color);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.upload-zone:hover,
	.upload-zone.drag-active {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.upload-icon {
		font-size: 3rem;
		margin-bottom: var(--space-md);
		opacity: 0.5;
	}

	.upload-text {
		font-size: var(--font-size-md);
		font-weight: 500;
		color: var(--text-primary);
		margin: 0 0 var(--space-xs) 0;
	}

	.upload-subtext {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin: 0 0 var(--space-md) 0;
	}

	.upload-hint {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin: 0;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.preview-image {
		width: 100%;
		max-width: 300px;
		aspect-ratio: 2/3;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.preview-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		padding: var(--space-md);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		color: #ef4444;
		font-size: var(--font-size-sm);
	}

	.error-icon {
		font-size: 1.25rem;
	}
</style>

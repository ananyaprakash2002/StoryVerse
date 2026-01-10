<script lang="ts">
	interface Props {
		imageUrl: string;
		title: string;
		size?: 'sm' | 'md' | 'lg';
		clickable?: boolean;
	}

	let { imageUrl, title, size = 'md', clickable = false }: Props = $props();

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleImageError() {
		imageError = true;
		imageLoaded = false;
	}
</script>

<div 
	class="cover-image" 
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
	class:size-lg={size === 'lg'}
	class:clickable
>
	{#if imageUrl && !imageError}
		<img
			src={imageUrl}
			alt={`Cover for ${title}`}
			onload={handleImageLoad}
			onerror={handleImageError}
			class:loaded={imageLoaded}
		/>
	{:else}
		<div class="no-image">
			<span class="icon">📚</span>
			<span class="text">No Cover</span>
		</div>
	{/if}
</div>

<style>
	.cover-image {
		position: relative;
		width: 100%;
		aspect-ratio: 2/3;
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: all var(--transition-fast);
	}

	.cover-image.size-sm {
		max-width: 80px;
	}

	.cover-image.size-md {
		max-width: 150px;
	}

	.cover-image.size-lg {
		max-width: 250px;
	}

	.cover-image.clickable {
		cursor: pointer;
	}

	.cover-image.clickable:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.cover-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}

	.cover-image img.loaded {
		opacity: 1;
	}

	.no-image {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		color: var(--text-muted);
	}

	.no-image .icon {
		font-size: 2rem;
		opacity: 0.3;
	}

	.no-image .text {
		font-size: var(--font-size-xs);
		font-weight: 500;
	}

	.size-sm .no-image .icon {
		font-size: 1.5rem;
	}

	.size-sm .no-image .text {
		display: none;
	}

	.size-lg .no-image .icon {
		font-size: 3rem;
	}

	.size-lg .no-image .text {
		font-size: var(--font-size-sm);
	}
</style>

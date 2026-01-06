<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';

	const sizes = {
		sm: '30px',
		md: '40px',
		lg: '60px'
	};
</script>

<div class="loader-container" role="status" aria-label="Loading">
	<div class="loader" style="width: {sizes[size]}; height: {sizes[size]}"></div>
</div>

<style>
	.loader-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
	}

	.loader {
		border: 3px solid var(--bg-tertiary);
		border-top: 3px solid var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>

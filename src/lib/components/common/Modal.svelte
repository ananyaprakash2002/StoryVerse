<script lang="ts">
	export let isOpen = false;
	export let title = '';
	export let onClose: (() => void) | undefined = undefined;

	const handleClose = () => {
		isOpen = false; // Needed for bind:isOpen to work
		if (onClose) onClose();
	};

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	};
</script>

{#if isOpen}
	<div 
		class="modal-overlay" 
		on:click={handleBackdropClick}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog" 
		aria-modal="true"
		tabindex="-1"
	>
		<div class="modal">
			<div class="modal-header">
				<h3>{title}</h3>
				<button
					class="btn btn-secondary btn-sm"
					on:click={handleClose}
					aria-label="Close modal"
				>
					✕
				</button>
			</div>
			<div class="modal-body">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		animation: fadeIn 0.2s ease-in-out;
	}

	.modal {
		animation: slideUp 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(50px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>

<script lang="ts">
	export let isOpen = false;
	export let itemName: string;
	export let onConfirm: () => void;
	export let onCancel: () => void;
</script>

{#if isOpen}
	<div 
		class="modal-overlay" 
		on:click={(e) => { if (e.target === e.currentTarget) onCancel(); }}
		on:keydown={(e) => e.key === 'Escape' && onCancel()}
		role="dialog" 
		aria-modal="true"
		tabindex="-1"
	>
		<div 
			class="modal delete-modal" 
			role="document"
		>
			<div class="modal-header">
				<h3>Confirm Delete</h3>
			</div>
			<div class="modal-body">
				<p>Are you sure you want to delete <strong>"{itemName}"</strong>?</p>
				<p class="warning-text">This action cannot be undone.</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={onCancel}> Cancel </button>
				<button class="btn btn-danger" on:click={onConfirm}> Delete </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.delete-modal {
		max-width: 400px;
	}

	.warning-text {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		margin-top: var(--space-sm);
	}

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

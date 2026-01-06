<script lang="ts">
	import { toasts } from '$lib/stores/ui';
</script>

<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<div class="toast toast-{toast.type}">
			<p>{toast.message}</p>
		</div>
	{/each}
</div>

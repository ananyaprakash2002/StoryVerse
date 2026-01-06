<script lang="ts">
	export let status: boolean;
</script>

<span class="badge" class:badge-success={status} class:badge-warning={!status}>
	{status ? '✓ Completed' : '⏳ In Progress'}
</span>

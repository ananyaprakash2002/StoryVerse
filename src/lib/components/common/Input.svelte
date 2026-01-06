<script lang="ts">
	export let type: 'text' | 'email' | 'password' | 'date' | 'number' = 'text';
	export let label = '';
	export let value: string | number = '';
	export let placeholder = '';
	export let required = false;
	export let disabled = false;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let id: string | undefined = undefined;

	const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="form-group">
	{#if label}
		<label for={inputId} class="form-label">
			{label}
			{#if required}<span class="text-danger">*</span>{/if}
		</label>
	{/if}
	<input
		{type}
		id={inputId}
		class="form-input"
		bind:value
		{placeholder}
		{required}
		{disabled}
		{min}
		{max}
		on:input
		on:change
		on:blur
	/>
</div>

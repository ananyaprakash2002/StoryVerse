<script lang="ts">
	import type { CategoryField } from '$lib/types/category';
	import DynamicField from './DynamicField.svelte';

	export let fields: CategoryField[];
	export let values: Record<string, any> = {};
	export let onSubmit: (data: Record<string, any>) => void;
	export let submitLabel = 'Save';
	export let loading = false;

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
		onSubmit(values);
	}
</script>

<form on:submit={handleSubmit} class="dynamic-form">
	{#each fields as field (field.id)}
		<DynamicField {field} bind:value={values[field.name]} disabled={loading} />
	{/each}

	<div class="form-actions">
		<slot name="actions">
			<button type="submit" class="btn btn-primary" disabled={loading}>
				{loading ? 'Saving...' : submitLabel}
			</button>
		</slot>
	</div>
</form>

<style>
	.dynamic-form {
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

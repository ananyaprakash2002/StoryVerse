<script lang="ts">
	import type { CategoryField } from '$lib/types/category';

	export let field: CategoryField;
	export let value: any = null;
	export let disabled = false;

	// Handle value changes
	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

		switch (field.field_type) {
			case 'number':
				value = target.value ? Number(target.value) : null;
				break;
			case 'boolean':
				value = (target as HTMLInputElement).checked;
				break;
			case 'multiselect':
				const select = target as HTMLSelectElement;
				value = Array.from(select.selectedOptions).map((opt) => opt.value);
				break;
			case 'tags':
				// Tags are stored as array of strings
				value = target.value
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t);
				break;
			default:
				value = target.value;
		}
	}

	// For rating field
	function setRating(rating: number) {
		value = rating;
	}

	// Get max rating from options
	const maxRating = field.field_type === 'rating' ? (field.options?.max || 5) : 5;

	// For tags display
	$: tagsValue = field.field_type === 'tags' && Array.isArray(value) ? value.join(', ') : '';
</script>

<div class="field-wrapper">
	<label for={field.name} class="form-label">
		{field.label}
		{#if field.required}
			<span class="required">*</span>
		{/if}
	</label>

	{#if field.field_type === 'text'}
		<input
			type="text"
			id={field.name}
			name={field.name}
			class="form-input"
			placeholder={field.placeholder || ''}
			bind:value
			required={field.required}
			{disabled}
		/>
	{:else if field.field_type === 'textarea'}
		<textarea
			id={field.name}
			name={field.name}
			class="form-textarea"
			placeholder={field.placeholder || ''}
			bind:value
			required={field.required}
			{disabled}
			rows="4"
		/>
	{:else if field.field_type === 'number'}
		<input
			type="number"
			id={field.name}
			name={field.name}
			class="form-input"
			placeholder={field.placeholder || ''}
			value={value || ''}
			on:input={handleChange}
			required={field.required}
			{disabled}
		/>
	{:else if field.field_type === 'date'}
		<input
			type="date"
			id={field.name}
			name={field.name}
			class="form-input"
			bind:value
			required={field.required}
			{disabled}
		/>
	{:else if field.field_type === 'boolean'}
		<label class="checkbox-wrapper">
			<input
				type="checkbox"
				id={field.name}
				name={field.name}
				class="form-checkbox"
				checked={value || false}
				on:change={handleChange}
				{disabled}
			/>
			<span>{field.placeholder || 'Yes'}</span>
		</label>
	{:else if field.field_type === 'url'}
		<input
			type="url"
			id={field.name}
			name={field.name}
			class="form-input"
			placeholder={field.placeholder || 'https://...'}
			bind:value
			required={field.required}
			{disabled}
		/>
	{:else if field.field_type === 'select'}
		<select
			id={field.name}
			name={field.name}
			class="form-select"
			bind:value
			required={field.required}
			{disabled}
		>
			<option value="">Select an option...</option>
			{#if field.options && Array.isArray(field.options)}
				{#each field.options as option}
					<option value={option}>{option}</option>
				{/each}
			{/if}
		</select>
	{:else if field.field_type === 'multiselect'}
		<select
			id={field.name}
			name={field.name}
			class="form-select"
			multiple
			on:change={handleChange}
			required={field.required}
			{disabled}
			size="5"
		>
			{#if field.options && Array.isArray(field.options)}
				{#each field.options as option}
					<option value={option} selected={value && value.includes(option)}>{option}</option>
				{/each}
			{/if}
		</select>
		<p class="field-hint">Hold Ctrl/Cmd to select multiple</p>
	{:else if field.field_type === 'tags'}
		<input
			type="text"
			id={field.name}
			name={field.name}
			class="form-input"
			placeholder={field.placeholder || 'tag1, tag2, tag3'}
			value={tagsValue}
			on:input={handleChange}
			required={field.required}
			{disabled}
		/>
		<p class="field-hint">Separate tags with commas</p>
	{:else if field.field_type === 'rating'}
		<div class="rating-wrapper">
			{#each Array(maxRating) as _, i}
				<button
					type="button"
					class="star-button"
					class:active={value && value > i}
					on:click={() => setRating(i + 1)}
					{disabled}
				>
					{value && value > i ? '★' : '☆'}
				</button>
			{/each}
			{#if value}
				<span class="rating-text">{value}/{maxRating}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.field-wrapper {
		margin-bottom: var(--space-lg);
	}

	.required {
		color: var(--danger);
		margin-left: var(--space-xs);
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
	}

	.field-hint {
		margin-top: var(--space-xs);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.rating-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.star-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-muted);
		transition: all var(--transition-fast);
		padding: 0;
	}

	.star-button:hover:not(:disabled) {
		color: var(--warning);
		transform: scale(1.1);
	}

	.star-button.active {
		color: var(--warning);
	}

	.star-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.rating-text {
		margin-left: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}
</style>

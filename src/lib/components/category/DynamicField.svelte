<script lang="ts">
	import type { CategoryField } from '$lib/types/category';

	export let field: CategoryField;
	export let value: any = null;
	export let disabled = false;

	let showDropdown = false;

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
		></textarea>
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
		<div class="multiselect-dropdown">
			<div class="multiselect-selected" on:click={() => showDropdown = !showDropdown} on:keydown={(e) => e.key === 'Enter' && (showDropdown = !showDropdown)} role="button" tabindex="0">
				{#if value && value.length > 0}
					<span class="selected-count">{value.length} selected</span>
					<span class="selected-preview">{value.slice(0, 2).join(', ')}{value.length > 2 ? '...' : ''}</span>
				{:else}
					<span class="placeholder">Select options...</span>
				{/if}
				<span class="dropdown-arrow">▼</span>
			</div>
			{#if showDropdown}
				<div class="multiselect-options">
					{#if field.options && Array.isArray(field.options)}
						{#each field.options as option}
							<label class="multiselect-option">
								<input
									type="checkbox"
									checked={value && value.includes(option)}
									on:change={(e) => {
										if (e.currentTarget.checked) {
											value = [...(value || []), option];
										} else {
											value = (value || []).filter((v: string) => v !== option);
										}
									}}
									{disabled}
								/>
								<span>{option}</span>
							</label>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
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

	.multiselect-dropdown {
		position: relative;
		width: 100%;
	}

	.multiselect-selected {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		min-height: 42px;
	}

	.multiselect-selected:hover {
		border-color: var(--primary);
	}

	.selected-count {
		background: var(--primary);
		color: white;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 600;
	}

	.selected-preview {
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.placeholder {
		flex: 1;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.dropdown-arrow {
		color: var(--text-muted);
		font-size: 10px;
		transition: transform var(--transition-fast);
	}

	.multiselect-options {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: var(--space-xs);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		max-height: 250px;
		overflow-y: auto;
		z-index: 100;
		padding: var(--space-xs);
	}

	.multiselect-option {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
	}

	.multiselect-option:hover {
		background: var(--bg-tertiary);
	}

	.multiselect-option input[type="checkbox"] {
		cursor: pointer;
	}

	.multiselect-option span {
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

</style>

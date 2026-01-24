<script lang="ts">
	import type { CategoryField } from '$lib/types/category';
	import { createEventDispatcher } from 'svelte';

	export let field: CategoryField;
	export let index: number;
	export let canReorder: boolean = true;
	export let isFirst: boolean = false;
	export let isLast: boolean = false;

	const dispatch = createEventDispatcher();

	let optionsText: string = Array.isArray(field.options) ? field.options.join('\n') : '';
	
	// Check if this is a new field (not yet saved to database)
	$: isNewField = field.id?.toString().startsWith('new_') ?? false;

	function handleDelete() {
		dispatch('delete', index);
	}

	function handleMoveUp() {
		dispatch('moveup', index);
	}

	function handleMoveDown() {
		dispatch('movedown', index);
	}

	function handleUpdate() {
		dispatch('update', field);
	}

	function handleOptionsInput() {
		field.options = optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
		handleUpdate();
	}
</script>

<div class="field-editor">
	<!-- Reorder buttons -->
	{#if canReorder}
		<div class="field-controls">
			<button
				class="btn-icon btn-sm"
				on:click={handleMoveUp}
				disabled={isFirst}
				title="Move up"
			>
				↑
			</button>
			<button
				class="btn-icon btn-sm"
				on:click={handleMoveDown}
				disabled={isLast}
				title="Move down"
			>
				↓
			</button>
		</div>
	{/if}

	<!-- Field properties -->
	<div class="field-inputs">
		<div class="field-row">
			<div class="form-group">
				<label for={"field-label-" + index}>Label</label>
				<input
					type="text"
					id={"field-label-" + index}
					class="input input-sm"
					bind:value={field.label}
					on:input={handleUpdate}
					placeholder="Field Label"
				/>
			</div>

			<div class="form-group">
				<label for={"field-name-" + index}>Field Name</label>
				<input
					type="text"
					id={"field-name-" + index}
					class="input input-sm"
					bind:value={field.name}
					on:input={handleUpdate}
					disabled={!isNewField}
					title={isNewField ? "Set a unique field name" : "Field name cannot be changed after creation"}
				/>
			</div>

			<div class="form-group">
				<label for={"field-type-" + index}>Type</label>
				{#if isNewField}
					<select
						id={"field-type-" + index}
						class="input input-sm"
						bind:value={field.field_type}
						on:change={handleUpdate}
						title="Choose field type"
					>
						<option value="text">Text</option>
						<option value="textarea">Textarea</option>
						<option value="number">Number</option>
						<option value="date">Date</option>
						<option value="select">Select (Dropdown)</option>
						<option value="multiselect">Multi-select</option>
						<option value="url">URL</option>
						<option value="rating">Rating</option>
					</select>
				{:else}
					<input
						type="text"
						id={"field-type-" + index}
						class="input input-sm"
						value={field.field_type}
						disabled
						title="Field type cannot be changed after creation"
					/>
				{/if}
			</div>
		</div>

		<div class="field-row">
			<label class="checkbox-label">
				<input
					type="checkbox"
					bind:checked={field.required}
					on:change={handleUpdate}
				/>
				<span>Required</span>
			</label>

			{#if field.placeholder !== undefined}
					<div class="form-group flex-1">
						<label for={"field-placeholder-" + index}>Placeholder</label>
						<input
							type="text"
							id={"field-placeholder-" + index}
							class="input input-sm"
							bind:value={field.placeholder}
							on:input={handleUpdate}
							placeholder="Optional placeholder text"
						/>
					</div>
			{/if}
		</div>

		{#if (field.field_type === 'select' || field.field_type === 'multiselect') && field.options}
			<div class="form-group">
				<label for={"field-options-" + index}>Options (one per line)</label>
				<textarea
					id={"field-options-" + index}
					class="input input-sm"
					rows="3"
					bind:value={optionsText}
					on:input={handleOptionsInput}
					placeholder="Option 1&#10;Option 2&#10;Option 3"
				></textarea>
			</div>
		{/if}
	</div>

	<!-- Delete button -->
	<div class="field-actions">
		<button
			class="btn btn-sm btn-danger"
			on:click={handleDelete}
			title="Delete field"
		>
			🗑️ Delete
		</button>
	</div>
</div>

<style>
	.field-editor {
			display: grid;
			grid-template-columns: auto 1fr auto;
			gap: var(--space-md);
			padding: calc(var(--space-md) + 2px);
			background: linear-gradient(180deg, rgba(255,255,255,0.01), transparent);
			border: 1px solid rgba(255,255,255,0.03);
			border-radius: calc(var(--radius-md) + 2px);
			margin-bottom: var(--space-md);
			align-items: start;
			box-shadow: 0 6px 18px rgba(2,6,23,0.45) inset;
	}

	.field-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.field-inputs {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		flex: 1;
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-md);
		align-items: end;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-group label {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
	}

	.input {
		padding: var(--space-sm);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
	}

	.input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--bg-secondary);
	}

	.input-sm {
		padding: 6px 10px;
		font-size: var(--font-size-sm);
	}

	.btn-icon {
		padding: 4px 8px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--text-primary);
		transition: all 0.2s ease;
		font-size: 12px;
	}

	.btn-icon:hover:not(:disabled) {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.btn-icon:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: var(--font-size-sm);
	}

	.flex-1 {
		flex: 1;
	}

	.field-actions {
		display: flex;
		align-items: flex-start;
	}

	textarea.input {
		resize: vertical;
		min-height: 60px;
		font-family: inherit;
	}

	@media (max-width: 768px) {
		.field-editor {
			grid-template-columns: 1fr;
		}

		.field-controls {
			flex-direction: row;
			order: -1;
		}

		.field-actions {
			justify-content: flex-end;
		}
	}
</style>

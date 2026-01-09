<script lang="ts">
	import type { CategoryFieldInput, FieldType } from '$lib/types/category';

	export let fields: CategoryFieldInput[] = [];

	const fieldTypes: { value: FieldType; label: string }[] = [
		{ value: 'text', label: 'Text' },
		{ value: 'textarea', label: 'Long Text' },
		{ value: 'number', label: 'Number' },
		{ value: 'date', label: 'Date' },
		{ value: 'boolean', label: 'Checkbox' },
		{ value: 'url', label: 'URL' },
		{ value: 'select', label: 'Dropdown' },
		{ value: 'multiselect', label: 'Multi-Select' },
		{ value: 'tags', label: 'Tags' },
		{ value: 'rating', label: 'Rating' }
	];

	function addField() {
		fields = [
			...fields,
			{
				name: '',
				label: '',
				field_type: 'text',
				required: false,
				order_index: fields.length + 1
			}
		];
	}

	function removeField(index: number) {
		fields = fields.filter((_, i) => i !== index);
		// Update order indices
		fields = fields.map((f, i) => ({ ...f, order_index: i + 1 }));
	}

	function moveUp(index: number) {
		if (index === 0) return;
		const newFields = [...fields];
		[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
		fields = newFields.map((f, i) => ({ ...f, order_index: i + 1 }));
	}

	function moveDown(index: number) {
		if (index === fields.length - 1) return;
		const newFields = [...fields];
		[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
		fields = newFields.map((f, i) => ({ ...f, order_index: i + 1 }));
	}

	function generateFieldName(label: string): string {
		return label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '');
	}

	function handleLabelChange(index: number, label: string) {
		fields[index].label = label;
		// Auto-generate name from label if name is empty
		if (!fields[index].name || fields[index].name === generateFieldName(fields[index].label)) {
			fields[index].name = generateFieldName(label);
		}
	}

	// Handle options for select/multiselect fields
	function handleOptionsChange(index: number, value: string) {
		const options = value
			.split('\n')
			.map((opt) => opt.trim())
			.filter((opt) => opt);
		fields[index].options = options;
	}

	function getOptionsText(field: CategoryFieldInput): string {
		if (Array.isArray(field.options)) {
			return field.options.join('\n');
		}
		return '';
	}
</script>

<div class="field-builder">
	<div class="builder-header">
		<h3>Fields</h3>
		<button type="button" class="btn btn-sm btn-secondary" on:click={addField}>
			+ Add Field
		</button>
	</div>

	{#if fields.length === 0}
		<div class="empty-fields">
			<p>No fields yet. Click "Add Field" to get started!</p>
		</div>
	{:else}
		<div class="fields-list">
			{#each fields as field, index}
				<div class="field-item card">
					<div class="field-header">
						<span class="field-number">{index + 1}</span>
						<div class="field-actions">
							<button
								type="button"
								class="icon-btn"
								on:click={() => moveUp(index)}
								disabled={index === 0}
								title="Move up"
							>
								↑
							</button>
							<button
								type="button"
								class="icon-btn"
								on:click={() => moveDown(index)}
								disabled={index === fields.length - 1}
								title="Move down"
							>
								↓
							</button>
							<button
								type="button"
								class="icon-btn danger"
								on:click={() => removeField(index)}
								title="Remove field"
							>
								×
							</button>
						</div>
					</div>

					<div class="field-content">
						<div class="form-row">
							<div class="form-group">
								<label class="form-label">Label</label>
								<input
									type="text"
									class="form-input"
									bind:value={field.label}
									on:input={(e) => handleLabelChange(index, e.currentTarget.value)}
									placeholder="e.g., Title, Rating, Genre"
									required
								/>
							</div>

							<div class="form-group">
								<label class="form-label">Type</label>
								<select class="form-select" bind:value={field.field_type}>
									{#each fieldTypes as type}
										<option value={type.value}>{type.label}</option>
									{/each}
								</select>
							</div>
						</div>

						{#if field.field_type === 'select' || field.field_type === 'multiselect'}
							<div class="form-group">
								<label class="form-label">Options (one per line)</label>
								<textarea
									class="form-textarea"
									value={getOptionsText(field)}
									on:input={(e) => handleOptionsChange(index, e.currentTarget.value)}
									placeholder="Option 1&#10;Option 2&#10;Option 3"
									rows="3"
								/>
							</div>
						{/if}

						<div class="form-row">
							<div class="form-group">
								<label class="form-label">Placeholder (optional)</label>
								<input
									type="text"
									class="form-input"
									bind:value={field.placeholder}
									placeholder="Hint text for users"
								/>
							</div>

							<div class="form-group checkbox-group">
								<label class="checkbox-wrapper">
									<input type="checkbox" class="form-checkbox" bind:checked={field.required} />
									<span>Required field</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.field-builder {
		margin-top: var(--space-xl);
	}

	.builder-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-lg);
	}

	.builder-header h3 {
		margin: 0;
	}

	.empty-fields {
		text-align: center;
		padding: var(--space-2xl);
		color: var(--text-muted);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		border: 2px dashed var(--border-color);
	}

	.fields-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.field-item {
		padding: var(--space-lg);
	}

	.field-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--border-color);
	}

	.field-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: var(--primary);
		color: white;
		border-radius: 50%;
		font-weight: 600;
		font-size: var(--font-size-sm);
	}

	.field-actions {
		display: flex;
		gap: var(--space-xs);
	}

	.icon-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.icon-btn:hover:not(:disabled) {
		background: var(--bg-tertiary);
		border-color: var(--primary);
	}

	.icon-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.icon-btn.danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.1);
		border-color: var(--danger);
		color: var(--danger);
	}

	.field-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.checkbox-group {
		display: flex;
		align-items: flex-end;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
		padding: var(--space-sm);
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>

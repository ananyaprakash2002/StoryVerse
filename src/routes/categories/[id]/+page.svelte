<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCategory, deleteCategory } from '$lib/services/categories';
	import { getItems, createItem, updateItem, deleteItem } from '$lib/services/category-items';
	import { toasts } from '$lib/stores/ui';
	import type { Category, CategoryItem, CategoryItemInput } from '$lib/types/category';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Loader from '$lib/components/common/Loader.svelte';
	import DynamicFormEnhanced from '$lib/components/category/DynamicFormEnhanced.svelte';

	import GridView from '$lib/components/category/GridView.svelte';
	import ViewToggle from '$lib/components/category/ViewToggle.svelte';
	import FieldEditor from '$lib/components/category/FieldEditor.svelte';
	import { exportToJSON, exportToExcel, exportToPDF, parseImportedJSON } from '$lib/utils/export-utils';
	import { updateCategoryWithFields } from '$lib/services/categories';

	let category: Category | null = null;
	let items: CategoryItem[] = [];
	let loading = true;
	let showModal = false;
	let editingItem: CategoryItem | null = null;
	let formValues: Record<string, any> = {};
	let saving = false;

	// Search, Sort, Column Filters, and Bulk Actions
	let searchQuery = '';
	let sortField: string | null = null;
	let showColumnDropdown = false;
	let sortDirection: 'asc' | 'desc' = 'asc';
	let columnFilters: Record<string, string> = {};
	let selectedItems = new Set<string>();
	let visibleColumns = new Set<string>();
	let viewMode: 'table' | 'grid' = 'grid';
	
	// Export/Import
	let showExportMenu = false;
	let importing = false;
	let showFormatHelpModal = false;
	let copied = false;

	// Edit Category
	let showEditCategoryModal = false;
	let isEditingCategoryPage = false;
	let categoryFormData = {
		name: '',
		icon: '',
		color: '',
		description: '',
		fields: [] as any[]
	};
	let savingCategory = false;

	let categoryId: string = '';
	$: categoryId = $page.params.id ?? '';

	onMount(() => {
		// Use inner async function to avoid returning a Promise from onMount
	 	const init = async () => {
	 		await loadData();
	 	};

	 	init();

	 	// Close dropdown when clicking outside
	 	const handleClickOutside = (e: MouseEvent) => {
	 		const target = e.target as HTMLElement | null;
	 		if (!target || !target.closest('.dropdown')) {
	 			showColumnDropdown = false;
				showExportMenu = false;
	 		}
	 	};
	 	document.addEventListener('click', handleClickOutside);

	 	return () => {
	 		document.removeEventListener('click', handleClickOutside);
	 	};
	});

	function handleViewChange(newView: 'table' | 'grid') {
		console.log('handleViewChange called with:', newView);
		viewMode = newView;
		localStorage.setItem(`viewMode_${categoryId}`, newView);
		console.log('viewMode is now:', viewMode);
	}

	async function loadData() {
		loading = true;
		try {
			[category, items] = await Promise.all([getCategory(categoryId), getItems(categoryId)]);
			
			// Initialize visible columns
			if (category?.fields) {
				visibleColumns = new Set(category.fields.map(f => f.name));
				// Load from localStorage
				const saved = localStorage.getItem(`columns_${categoryId}`);
				if (saved) {
					visibleColumns = new Set(JSON.parse(saved));
				}
			}
		} catch (err: any) {
			toasts.error(err.message || 'Failed to load category');
			goto('/categories');
		} finally {
			loading = false;
		}
	}

	// Save column visibility to localStorage
	$: if (categoryId && visibleColumns.size > 0) {
		localStorage.setItem(`columns_${categoryId}`, JSON.stringify([...visibleColumns]));
	}

	// Filtered and sorted items
	$: filteredItems = items.filter((item) => {
		// Global search filter
		if (searchQuery) {
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch = Object.values(item.data).some((value) => {
				if (typeof value === 'string') {
					return value.toLowerCase().includes(searchLower);
				}
				if (Array.isArray(value)) {
					return value.some((v) => String(v).toLowerCase().includes(searchLower));
				}
				return String(value).toLowerCase().includes(searchLower);
			});
			if (!matchesSearch) return false;
		}

		// Column-specific filters
		for (const [fieldName, filterValue] of Object.entries(columnFilters)) {
			if (!filterValue) continue;

			const itemValue = item.data[fieldName];
			const filterLower = filterValue.toLowerCase();

			if (Array.isArray(itemValue)) {
				const hasMatch = itemValue.some((v) =>
					String(v).toLowerCase().includes(filterLower)
				);
				if (!hasMatch) return false;
			} else {
				const itemStr = String(itemValue || '').toLowerCase();
				if (!itemStr.includes(filterLower)) return false;
			}
		}

		return true;
	});

	$: sortedItems = [...filteredItems].sort((a, b) => {
		if (!sortField) return 0;

		const aVal = a.data[sortField];
		const bVal = b.data[sortField];

		// Handle null/undefined
		if (aVal == null && bVal == null) return 0;
		if (aVal == null) return 1;
		if (bVal == null) return -1;

		// Compare values
		let comparison = 0;
		if (typeof aVal === 'number' && typeof bVal === 'number') {
			comparison = aVal - bVal;
		} else {
			comparison = String(aVal).localeCompare(String(bVal));
		}

		return sortDirection === 'asc' ? comparison : -comparison;
	});

	function toggleSort(fieldName: string) {
		if (sortField === fieldName) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = fieldName;
			sortDirection = 'asc';
		}
	}

	function clearFilters() {
		columnFilters = {};
		searchQuery = '';
	}

	function toggleColumnVisibility(fieldName: string) {
		if (visibleColumns.has(fieldName)) {
			visibleColumns.delete(fieldName);
		} else {
			visibleColumns.add(fieldName);
		}
		visibleColumns = visibleColumns;
	}

	function showAllColumns() {
		if (category?.fields) {
			visibleColumns = new Set(category.fields.map(f => f.name));
		}
	}

	function hideAllColumns() {
		visibleColumns = new Set();
	}

	function toggleSelection(itemId: string) {
		if (selectedItems.has(itemId)) {
			selectedItems.delete(itemId);
		} else {
			selectedItems.add(itemId);
		}
		selectedItems = selectedItems;
	}

	function toggleSelectAll() {
		if (selectedItems.size === sortedItems.length) {
			selectedItems = new Set();
		} else {
			selectedItems = new Set(sortedItems.map(item => item.id));
		}
	}

	async function bulkDelete() {
		if (selectedItems.size === 0) return;
		
		if (!confirm(`Delete ${selectedItems.size} selected items?`)) return;

		try {
			await Promise.all([...selectedItems].map(id => deleteItem(id)));
			toasts.success(`Deleted ${selectedItems.size} items!`);
			selectedItems = new Set();
			await loadData();
		} catch (err: any) {
			toasts.error(err.message || 'Failed to delete items');
		}
	}

	function viewItemDetails(item: CategoryItem) {
		goto(`/categories/${categoryId}/items/${item.id}`);
	}

	function openAddModal() {
		editingItem = null;
		formValues = {};
		showModal = true;
	}

	function openEditModal(item: CategoryItem) {
		editingItem = item;
		formValues = { ...item.data };
		showModal = true;
	}

	async function handleSubmit(data: Record<string, any>, imageData?: { url: string; path: string; apiSource?: string; apiId?: string }) {
		saving = true;
		try {
					const itemData: CategoryItemInput = {
						data,
						cover_image_url: imageData?.url ?? (editingItem?.cover_image_url || ''),
						cover_image_path: imageData?.path ?? (editingItem?.cover_image_path || ''),
						api_source: imageData?.apiSource === 'google_books' ? 'google_books' : (editingItem?.api_source ?? null),
						api_id: imageData?.apiId ?? (editingItem?.api_id || '')
					};

			if (editingItem) {
				await updateItem(editingItem.id, itemData);
				toasts.success('Item updated!');
			} else {
				await createItem(categoryId, itemData);
				toasts.success('Item created!');
			}
			showModal = false;
			await loadData();
		} catch (err: any) {
			toasts.error(err.message || 'Failed to save item');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(item: CategoryItem) {
		if (!confirm('Are you sure you want to delete this item?')) return;

		try {
			await deleteItem(item.id);
			toasts.success('Item deleted!');
			await loadData();
		} catch (err: any) {
			toasts.error(err.message || 'Failed to delete item');
		}
	}

	async function handleDeleteCategory() {
		if (
			!confirm(
				`Are you sure you want to delete the "${category?.name}" category? This will also delete all ${items.length} items.`
			)
		)
			return;

		try {
			await deleteCategory(categoryId);
			toasts.success('Category deleted!');
			goto('/categories');
		} catch (err: any) {
			toasts.error(err.message || 'Failed to delete category');
		}
	}

	// --- Edit Category helpers ---
	function openEditCategoryModal() {
		if (!category) return;
		// Deep copy category data into form
		categoryFormData = {
			name: category.name || '',
			icon: category.icon || '',
			color: category.color || '',
			description: category.description || '',
			fields: (category.fields || []).map((f) => ({ ...f }))
		};
		isEditingCategoryPage = true;
		// scroll to top for the in-page editor
		setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
	}

	function addNewField() {
		const newField = {
			id: `new_${Date.now()}`,
			name: `field_${Date.now()}`,
			label: 'New Field',
			field_type: 'text',
			placeholder: '',
			options: [],
			required: false,
			order_index: categoryFormData.fields.length
		};

		categoryFormData.fields = [...categoryFormData.fields, newField];

		// Scroll to new field
		setTimeout(() => {
			const last = document.querySelector('.field-editor:last-child') as HTMLElement | null;
			last?.scrollIntoView({ behavior: 'smooth' });
		}, 100);
	}

	function confirmDeleteField(index: number) {
		const field = categoryFormData.fields[index];
		
		// If items exist, show strong warning about data loss
		if (items.length > 0) {
			const confirmed = confirm(
				`⚠️ WARNING: Delete field "${field.label}"?\n\n` +
				`This category has ${items.length} item(s).\n` +
				`All data in this field will be PERMANENTLY DELETED from all items!\n\n` +
				`This action CANNOT be undone.\n\n` +
				`Are you sure you want to continue?`
			);
			
			if (!confirmed) return;
		} else {
			// No items, just confirm normally
			if (!confirm(`Delete field "${field.label}"?\n\nThis action cannot be undone.`)) return;
		}
		
		// Delete the field
		const newFields = [...categoryFormData.fields];
		newFields.splice(index, 1);
		// Re-index order_index
		categoryFormData.fields = newFields.map((f, i) => ({ ...f, order_index: i }));
		
		if (items.length > 0) {
			toasts.success(`Field "${field.label}" will be deleted when you save changes`);
		}
	}

	function updateField(index: number, updated: any) {
		const fields = [...categoryFormData.fields];
		fields[index] = { ...fields[index], ...updated };
		categoryFormData.fields = fields;
	}

	function moveField(index: number, direction: number) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= categoryFormData.fields.length) return;
		const fields = [...categoryFormData.fields];
		[fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
		categoryFormData.fields = fields.map((f, i) => ({ ...f, order_index: i }));
	}

	async function handleSaveCategoryChanges() {
		if (!category) return;
		// Basic validation
		if (!categoryFormData.name || !categoryFormData.name.trim()) {
			toasts.error('Category name is required');
			return;
		}

		// Unique field names
		const names = categoryFormData.fields.map((f) => f.name);
		if (new Set(names).size !== names.length) {
			toasts.error('Field names must be unique');
			return;
		}

		savingCategory = true;
		try {
			// Prepare fields for DB: remove transient props
			const fieldsToSave = categoryFormData.fields.map((f, i) => ({
				name: f.name,
				label: f.label,
				field_type: f.field_type,
				placeholder: f.placeholder ?? null,
				options: f.options ?? null,
				required: !!f.required,
				order_index: f.order_index ?? i
			}));

			const updated = await updateCategoryWithFields(categoryId, {
				name: categoryFormData.name,
				icon: categoryFormData.icon,
				color: categoryFormData.color,
				description: categoryFormData.description
			}, fieldsToSave);

			category = updated;
			await loadData(); // reload items and fields
			toasts.success('Category updated successfully!');
			isEditingCategoryPage = false; // Just close edit mode, stay on page
		} catch (err: any) {
			toasts.error(err?.message || 'Failed to update category');
		} finally {
			savingCategory = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	// Export handlers
	function handleExportJSON() {
		if (!category || items.length === 0) {
			toasts.error('No items to export');
			return;
		}
		exportToJSON(items, category.name);
		toasts.success(`Exported ${items.length} items as JSON`);
		showExportMenu = false;
	}

	function handleExportExcel() {
		if (!category || items.length === 0) {
			toasts.error('No items to export');
			return;
		}
		exportToExcel(items, category.fields || [], category.name);
		toasts.success(`Exported ${items.length} items as Excel`);
		showExportMenu = false;
	}

	function handleExportPDF() {
		if (!category || items.length === 0) {
			toasts.error('No items to export');
			return;
		}
		exportToPDF(items, category.fields || [], category.name);
		toasts.success(`Exported ${items.length} items as PDF`);
		showExportMenu = false;
	}

	// Import handler
	async function handleImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;

		importing = true;
		try {
			const { items: importedItems, category: importCategory, itemCount } = await parseImportedJSON(file);

			// Confirm import
			if (!confirm(`Import ${itemCount} items from "${importCategory}"?\n\nThis will add to your existing ${items.length} items.`)) {
				input.value = '';
				importing = false;
				return;
			}

			// Create items
			let successCount = 0;
			let errorCount = 0;

			for (const itemData of importedItems) {
				try {
					await createItem(categoryId, itemData);
					successCount++;
				} catch (err) {
					errorCount++;
					console.error('Failed to import item:', err);
				}
			}

			// Show result
			if (successCount > 0) {
				toasts.success(`Successfully imported ${successCount} items!`);
				await loadData();
			}
			if (errorCount > 0) {
				toasts.error(`Failed to import ${errorCount} items`);
			}
		} catch (err: any) {
			toasts.error('Import failed: ' + (err.message || 'Invalid file format'));
		} finally {
			input.value = ''; // Reset file input
			importing = false;
			showExportMenu = false;
		}
	}

	async function copyFormatTemplate() {
		const template = `{
  "category": "Category Name",
  "exportDate": "2024-01-24T12:00:00.000Z",
  "itemCount": 2,
  "version": "1.0",
  "items": [
    {
      "data": {
        "field1": "value1",
        "field2": "value2",
        "field3": "value3"
      },
      "cover_image_url": null,
      "cover_image_path": null,
      "api_source": null,
      "api_id": null
    }
  ]
}`;
		
		try {
			await navigator.clipboard.writeText(template);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch (err) {
			toasts.error('Failed to copy to clipboard');
		}
	}

	$: hasActiveFilters = searchQuery || Object.values(columnFilters).some((v) => v);
	$: visibleFields = category?.fields?.filter(f => visibleColumns.has(f.name)) || [];
	
	// Define which columns to show in the table (key fields only)
	$: tableColumns = category?.fields?.filter(f => {
		const fieldName = f.name.toLowerCase();
		return fieldName.includes('title') || 
		       fieldName.includes('name') ||
		       fieldName.includes('author') || 
		       fieldName.includes('status') ||
		       fieldName.includes('tag') ||
		       fieldName.includes('chapter');
	}) || [];

	// Derive the item order/chapter number based on created_at index
	$: itemIndexMap = Object.fromEntries(items.map((item, i) => [item.id, i + 1]));
</script>

<div class="page container">
	{#if loading}
		<div class="loading-container">
			<Loader size="lg" />
		</div>
	{:else if category}
		<div class="page-header">
			<div class="header-content">
				<button class="back-button" on:click={() => goto('/categories')}>
					← Back to Categories
				</button>
				<div class="category-title">
					<span class="category-icon" style="color: {category.color || 'var(--primary)'}">
						{category.icon || '📁'}
					</span>
					<div>
						<h1>{category.name}</h1>
						{#if category.description}
							<p class="text-muted">{category.description}</p>
						{/if}
					</div>
				</div>
			</div>
			<div class="header-actions">
				<Button variant="primary" onClick={openAddModal}>
					<span class="btn-full">+ Add Item</span>
					<span class="btn-short">+</span>
				</Button>
				<button class="btn btn-secondary action-btn" on:click={openEditCategoryModal} title="Edit Category">
					<span>✏️</span>
					<span class="btn-full">Edit</span>
				</button>
				<button class="btn btn-danger action-btn" on:click={handleDeleteCategory} title="Delete Category">
					<span>🗑️</span>
					<span class="btn-full">Delete</span>
				</button>
				
				<!-- Export/Import Menu -->
				<div class="export-menu dropdown" class:show={showExportMenu}>
					<button 
						class="btn btn-secondary export-btn action-btn"
						on:click={() => showExportMenu = !showExportMenu}
						title="Export / Import"
					>
						<span>📥</span>
						<span class="btn-full">Export/Import</span>
						<span class="dropdown-arrow">▼</span>
					</button>
					
					{#if showExportMenu}
						<div class="dropdown-content">
							<div class="dropdown-section">
								<div class="dropdown-label">Export</div>
								<button class="dropdown-item" on:click={handleExportJSON}>
									<span class="item-icon">💾</span>
									<span>JSON (Backup)</span>
								</button>
								<button class="dropdown-item" on:click={handleExportExcel}>
									<span class="item-icon">📊</span>
									<span>Excel Spreadsheet</span>
								</button>
								<button class="dropdown-item" on:click={handleExportPDF}>
									<span class="item-icon">📄</span>
									<span>PDF Document</span>
								</button>
							</div>
							
							<div class="dropdown-divider"></div>
							
							<div class="dropdown-section">
								<div class="dropdown-label">
									Import
									<button 
										class="help-icon" 
										title="Expected JSON Format"
										on:click={(e) => { e.stopPropagation(); showFormatHelpModal = true; }}
									>
										ℹ️
									</button>
								</div>
								<label class="dropdown-item import-item" class:importing>
									<span class="item-icon">{importing ? '⏳' : '📤'}</span>
									<span>{importing ? 'Importing...' : 'Import from JSON'}</span>
									<input 
										type="file" 
										accept=".json" 
										on:change={handleImport}
										disabled={importing}
										style="display: none;"
									/>
								</label>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if isEditingCategoryPage}
			<!-- In-place Edit Category -->
			{#if category}
				<div class="edit-page">
					<div class="edit-page-header">
						<button class="btn btn-ghost" on:click={() => (isEditingCategoryPage = false)}>← Back</button>
						<div class="breadcrumb">
							<a class="crumb" href="/categories">Categories</a>
							<span class="crumb-sep">/</span>
							<span class="crumb-current">{category.name}</span>
							<span class="crumb-sep">/</span>
							<span class="crumb-current muted">Edit</span>
						</div>
					</div>
					<div class="edit-category-form full-bleed">
						<!-- Section 1: Basic Info -->
						<div class="section">
							<h3>Category Details</h3>
							<div class="form-grid">
								<div class="form-group">
									<label for="edit-cat-name">Name</label>
									<input id="edit-cat-name" type="text" class="input" bind:value={categoryFormData.name} />
								</div>
								<div class="form-group">
									<label for="edit-cat-icon">Icon</label>
									<input id="edit-cat-icon" type="text" class="input" bind:value={categoryFormData.icon} placeholder="📁" />
								</div>
								<div class="form-group">
									<label for="edit-cat-color">Color</label>
									<input id="edit-cat-color" type="color" class="input" bind:value={categoryFormData.color} />
								</div>
								<div class="form-group full">
									<label for="edit-cat-desc">Description</label>
									<textarea id="edit-cat-desc" class="input" bind:value={categoryFormData.description} rows="3"></textarea>
								</div>
							</div>
						</div>

						<!-- Section 2: Field Management -->
						<div class="section">
							<h3>Fields</h3>
							<div class="fields-list">
								{#each categoryFormData.fields as field, idx}
									<FieldEditor
										field={field}
										index={idx}
										canReorder={true}
										isFirst={idx === 0}
										isLast={idx === categoryFormData.fields.length - 1}
										on:delete={(e) => confirmDeleteField(e.detail)}
										on:update={(e) => updateField(idx, e.detail)}
										on:moveup={(e) => moveField(e.detail, -1)}
										on:movedown={(e) => moveField(e.detail, 1)}
									/>
								{/each}
							</div>
							<div class="add-field-row">
								<Button variant="secondary" onClick={addNewField}>+ Add Field</Button>
							</div>
						</div>

						<!-- Actions -->
						<div class="modal-actions">
							<Button variant="primary" onClick={handleSaveCategoryChanges} disabled={savingCategory}>Save Changes</Button>
							<Button variant="secondary" onClick={() => (isEditingCategoryPage = false)}>Cancel</Button>
						</div>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Only show items/toolbar when NOT editing category -->
		{#if !isEditingCategoryPage}
		<!-- Toolbar with Search, Filters, and Column Visibility -->
		{#if items.length > 0}
			<div class="toolbar">
				<div class="search-bar">
					<input
						type="text"
						class="form-input search-input"
						placeholder="🔍 Search all fields..."
						bind:value={searchQuery}
					/>
					{#if hasActiveFilters}
						<button class="btn btn-sm btn-secondary" on:click={clearFilters}>
							Clear Filters
						</button>
					{/if}
				</div>


				<div class="toolbar-right">
				<ViewToggle currentView={viewMode} on:change={(e) => handleViewChange(e.detail)} />
				<span class="search-results">{filteredItems.length} of {items.length} items</span>
			</div>
			</div>

			<!-- Bulk Actions Bar -->
			{#if selectedItems.size > 0}
				<div class="bulk-actions-bar">
					<span>{selectedItems.size} selected</span>
					<button class="btn btn-sm btn-danger" on:click={bulkDelete}>
						Delete Selected
					</button>
					<button class="btn btn-sm btn-secondary" on:click={() => (selectedItems = new Set())}>
						Clear Selection
					</button>
				</div>
			{/if}
		{/if}

		{#if items.length === 0}
			<div class="empty-state card">
				<span class="empty-icon">{category.icon || '📦'}</span>
				<h3>No Items Yet</h3>
				<p>Add your first item to start tracking!</p>
				<Button variant="primary" onClick={openAddModal}>Add Item</Button>
			</div>
		{:else if sortedItems.length === 0}
			<div class="empty-state card">
				<span class="empty-icon">🔍</span>
				<h3>No Results Found</h3>
				<p>No items match your current filters</p>
				<button class="btn btn-secondary" on:click={clearFilters}>
					Clear All Filters
				</button>
			</div>
		{:else if viewMode === 'grid'}
			<!-- Grid View -->
			<GridView 
				items={sortedItems}
				categoryName={category?.name || ''}
				onEdit={openEditModal}
				onDelete={handleDelete}
				onViewDetails={viewItemDetails}
			/>
		{:else}
			<!-- Table View -->
			<div class="table-container">
				<table>
					<thead>
						<!-- Column Headers with Sort -->
						<tr>
							<th class="checkbox-col">
								<input
									type="checkbox"
									checked={selectedItems.size === sortedItems.length && sortedItems.length > 0}
									on:change={toggleSelectAll}
								/>
							</th>
							<!-- Chapter Number Column -->
							<th class="chapter-col">#</th>
							{#each tableColumns as field}
								<th>
									<button
										class="sort-button"
										class:active={sortField === field.name}
										on:click={() => toggleSort(field.name)}
									>
										{field.label}
										{#if sortField === field.name}
											<span class="sort-icon">
												{sortDirection === 'asc' ? '↑' : '↓'}
											</span>
										{:else}
											<span class="sort-icon inactive">↕</span>
										{/if}
									</button>
								</th>
							{/each}
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedItems as item}
							<tr class="clickable-row" on:click={(e) => {
								// Don't open details if clicking checkbox, button, or link
								const target = e.target as HTMLElement | null;
								if (!target) return;
								if (target instanceof HTMLInputElement || 
									target instanceof HTMLButtonElement || 
									target instanceof HTMLAnchorElement ||
									target.closest('button') ||
									target.closest('a')) {
									return;
								}
								viewItemDetails(item);
							}}>
								<td class="checkbox-col" on:click|stopPropagation>
									<input
										type="checkbox"
										checked={selectedItems.has(item.id)}
										on:change={() => toggleSelection(item.id)}
									/>
								</td>
								<!-- Chapter Number -->
								<td class="chapter-col">
									<span class="chapter-badge">{itemIndexMap[item.id] ?? ''}</span>
								</td>
								{#each tableColumns as field}
									<td>
										{#if field.field_type === 'boolean'}
											{item.data[field.name] ? '✓' : '✗'}
										{:else if field.field_type === 'rating'}
											{'★'.repeat(item.data[field.name] || 0)}
										{:else if field.field_type === 'tags'}
											{#if Array.isArray(item.data[field.name]) && item.data[field.name].length > 0}
												<div class="chips">
													{#each item.data[field.name] as tag}
														<span class="chip">{tag}</span>
													{/each}
												</div>
											{:else}
												-
											{/if}
										{:else if field.field_type === 'multiselect'}
											{#if Array.isArray(item.data[field.name]) && item.data[field.name].length > 0}
												<div class="chips">
													{#each item.data[field.name] as option}
														<span class="chip">{option}</span>
													{/each}
												</div>
											{:else}
												-
											{/if}
										{:else if field.field_type === 'url'}
											{#if item.data[field.name]}
												<a
													href={item.data[field.name]}
													target="_blank"
													rel="noopener noreferrer"
													class="url-link"
													on:click|stopPropagation
												>
													🔗 Link
												</a>
											{:else}
												-
											{/if}
										{:else}
											{item.data[field.name] || '-'}
										{/if}
									</td>
								{/each}
								<td on:click|stopPropagation>
									<div class="actions">
										<button class="btn btn-sm btn-secondary" on:click={() => openEditModal(item)}>
											Edit
										</button>
										<button class="btn btn-sm btn-danger" on:click={() => handleDelete(item)}>
											Delete
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		{/if} <!-- End !isEditingCategoryPage -->
	{/if}
</div>

<!-- Edit/Add Modal -->
<Modal bind:isOpen={showModal} title={editingItem ? 'Edit Item' : 'Add Item'}>
	{#if category}
		<DynamicFormEnhanced
			fields={category.fields || []}
			bind:values={formValues}
			onSubmit={handleSubmit}
			submitLabel={editingItem ? 'Update' : 'Create'}
			loading={saving}
			categoryName={category.name}
			itemId={editingItem?.id || ''}
		/>
	{/if}
</Modal>

<!-- JSON Format Help Modal -->
<Modal bind:isOpen={showFormatHelpModal} title="JSON Import Format">
	<div class="format-help">
		<div class="tip-section">
			<span class="tip-icon">💡</span>
			<p class="tip-text">Tip: Export an existing category to see the exact format! The exported file will have all the correct fields for your category.</p>
		</div>
		
		<div class="code-wrapper">
			<button class="copy-btn" on:click={copyFormatTemplate} title="Copy template">
				{copied ? '✓ Copied!' : '📋 Copy template'}
			</button>
			<pre class="json-code"><code>{`{
  "category": "Category Name",
  "exportDate": "2024-01-24T12:00:00.000Z",
  "itemCount": 2,
  "version": "1.0",
  "items": [
    {
      "data": {
        "field1": "value1",
        "field2": "value2",
        "field3": "value3"
      },
      "cover_image_url": null,
      "cover_image_path": null,
      "api_source": null,
      "api_id": null
    },
    {
      "data": {
        "field1": "another value",
        "field2": "more data",
        "field3": "etc"
      },
      "cover_image_url": "https://example.com/image.jpg",
      "cover_image_path": "",
      "api_source": "google_books",
      "api_id": "abc123"
    }
  ]
}`}</code></pre>
		</div>
		
		<div class="field-description">
			<h4>Field Descriptions:</h4>
			<ul>
				<li><code>category</code> - Name of the category (informational only)</li>
				<li><code>exportDate</code> - ISO timestamp of export</li>
				<li><code>itemCount</code> - Total number of items</li>
				<li><code>version</code> - Format version (1.0)</li>
				<li><code>items</code> - Array of items to import</li>
				<li><code>data</code> - Your custom field data (field names must match your category schema)</li>
			</ul>
		</div>
	</div>
</Modal>


 
<style>
	.loading-container {
		display: flex;
		justify-content: center;
		padding: var(--space-2xl);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-2xl);
		gap: var(--space-lg);
	}

	.header-content {
		flex: 1;
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.back-button {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
		padding: 0;
		transition: color var(--transition-fast);
	}

	.back-button:hover {
		color: var(--primary-hover);
	}

	.category-title {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
	}

	.category-icon {
		font-size: 3rem;
	}

	.toolbar {
		display: flex;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
		align-items: center;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex: 1;
	}

	.search-input {
		flex: 1;
		max-width: 400px;
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	/* Export/Import Menu Styles */
	.export-menu {
		position: relative;
	}

	.export-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.dropdown-arrow {
		font-size: 0.7rem;
		transition: transform 0.2s ease;
	}

	.export-menu.show .dropdown-arrow {
		transform: rotate(180deg);
	}

	.dropdown-content {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		min-width: 220px;
		z-index: 100;
		animation: slideDown 0.2s ease-out;
		backdrop-filter: blur(10px);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-section {
		padding: var(--space-sm);
	}

	.dropdown-label {
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		padding: var(--space-xs) var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: none;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.dropdown-item:hover {
		background: rgba(96, 165, 250, 0.1);
		color: var(--primary);
		transform: translateX(2px);
	}

	.import-item {
		cursor: pointer;
	}

	.import-item:hover {
		background: rgba(96, 165, 250, 0.1);
	}

	.item-icon {
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
	}

	.dropdown-divider {
		height: 1px;
		background: var(--border-color);
		margin: var(--space-xs) var(--space-md);
	}

	.help-icon {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		padding: 0 4px;
		margin-left: 4px;
		font-size: 14px;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.help-icon:hover {
		opacity: 1;
	}

	.import-item.importing {
		opacity: 0.7;
		pointer-events: none;
	}

	.import-item .item-icon {
		display: inline-block;
	}

	.importing .item-icon {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}



	.clickable-row {
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.clickable-row::after {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 3px;
		background: var(--primary);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.clickable-row:hover {
		background: linear-gradient(to right, rgba(96, 165, 250, 0.08) 0%, rgba(96, 165, 250, 0.02) 100%);
		transform: scale(1.005);
	}

	.clickable-row:hover::after {
		opacity: 1;
	}

	.clickable-row:nth-child(even) {
		background: rgba(0, 0, 0, 0.02);
	}

	.clickable-row:active {
		transform: scale(1.002);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		opacity: 0.5;
	}

	.sort-button {
		background: none;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-weight: 600;
		transition: color var(--transition-fast);
	}

	.sort-button:hover {
		color: var(--primary);
	}

	.sort-button.active {
		color: var(--primary);
	}

	.sort-icon {
		font-size: 0.875rem;
		opacity: 1;
	}

	.sort-icon.inactive {
		opacity: 0.3;
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
	}

	.url-link {
		color: var(--primary);
		text-decoration: none;
	}

	.url-link:hover {
		text-decoration: underline;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.chip {
		display: inline-block;
		padding: var(--space-xs) var(--space-sm);
		background: rgba(96, 165, 250, 0.1);
		color: var(--primary);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
		border: 1px solid rgba(96, 165, 250, 0.2);
	}

	/* Chapter badge in table */
	.chapter-col {
		width: 48px;
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.chapter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(167, 139, 250, 0.15));
		border: 1px solid rgba(96, 165, 250, 0.25);
		color: var(--primary);
		font-size: var(--font-size-xs);
		font-weight: 700;
		margin: 0 auto;
	}

	/* Action buttons in header - responsive behavior */
	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.btn-short {
		display: none;
	}

	.btn-full {
		display: inline;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: var(--space-md);
		}

		.header-actions {
			width: 100%;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			flex-wrap: nowrap;
		}

		.header-actions::-webkit-scrollbar {
			display: none;
		}

		/* On mobile, show short label and hide long label */
		.btn-short {
			display: inline;
		}

		.btn-full {
			display: none;
		}

		.action-btn {
			padding: var(--space-sm) var(--space-md);
			white-space: nowrap;
			flex-shrink: 0;
		}

		.table-container {
			overflow-x: auto;
		}

		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}

		.search-input {
			max-width: 100%;
		}

		.category-icon {
			font-size: 2rem !important;
		}

		.category-title {
			gap: var(--space-md);
		}
	}

	/* Edit Category modal improvements */
	.edit-category-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: var(--space-lg);
		background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		box-shadow: 0 12px 30px rgba(2,6,23,0.6);
		max-height: 70vh;
		overflow: auto;
	}

	.edit-category-form .section h3 {
		margin: 0 0 var(--space-md) 0;
		font-size: var(--font-size-lg);
		color: var(--text-primary);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: var(--space-sm);
	}

	/* In-page editor header */
	.edit-page {
		width: 100%;
		padding: 0 var(--space-lg) var(--space-2xl) var(--space-lg);
	}

	.edit-page-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.edit-page-header .btn-ghost {
		background: none;
		border: 1px solid transparent;
		color: var(--primary);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.breadcrumb {
		display:flex;
		align-items:center;
		gap:8px;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.breadcrumb .crumb { color: var(--text-muted); text-decoration: none }
	.breadcrumb .crumb-current { color: var(--text-primary); font-weight: 600 }
	.breadcrumb .muted { opacity: 0.85 }

	/* full-bleed editor - better alignment */
	.edit-category-form.full-bleed {
		background: transparent;
		border: none;
		box-shadow: none;
		padding: 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
		align-items: start;
	}

	.form-group.full { grid-column: 1 / -1; }

	.fields-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
	}

	.add-field-row { display:flex; justify-content:flex-start; }

	.modal-actions {
		display:flex;
		gap: var(--space-sm);
		justify-content: flex-end;
		padding-top: var(--space-sm);
		border-top: 1px dashed var(--border-color);
	}

	/* Make inputs and textarea visually consistent and READABLE in dark theme */
	.edit-category-form .input,
	.edit-category-form input[type="text"],
	.edit-category-form input[type="color"],
	.edit-category-form textarea,
	.edit-category-form select {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		width: 100%;
		transition: all 0.2s ease;
	}

	.edit-category-form .input:focus,
	.edit-category-form input:focus,
	.edit-category-form textarea:focus,
	.edit-category-form select:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
	}

	.edit-category-form .form-group label {
		display: block;
		margin-bottom: var(--space-xs);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-primary);
		text-transform: none;
	}

	.edit-category-form textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.edit-category-form input[type="color"] {
		height: 42px;
		cursor: pointer;
	}

	/* JSON Format Help Modal */
	.format-help {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.tip-section {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05));
		border-left: 3px solid var(--primary);
		border-radius: var(--radius-md);
	}

	.tip-icon {
		font-size: 20px;
		flex-shrink: 0;
	}

	.tip-text {
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.5;
	}

	.code-wrapper {
		position: relative;
	}

	.copy-btn {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		background: var(--primary);
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 1;
		font-weight: 500;
	}

	.copy-btn:hover {
		background: rgba(96, 165, 250, 0.9);
		transform: translateY(-1px);
	}

	.copy-btn:active {
		transform: translateY(0);
	}

	.json-code {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
		overflow-x: auto;
		margin: 0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
		font-size: 13px;
		line-height: 1.6;
		max-height: 400px;
		overflow-y: auto;
	}

	.json-code code {
		color: var(--text-primary);
		white-space: pre;
	}

	.field-description {
		background: var(--bg-secondary);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
	}

	.field-description h4 {
		margin: 0 0 var(--space-sm) 0;
		font-size: var(--font-size-md);
		color: var(--text-primary);
	}

	.field-description ul {
		margin: 0;
		padding-left: var(--space-lg);
		list-style-type: disc;
	}

	.field-description li {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-xs);
		line-height: 1.5;
	}

	.field-description code {
		background: rgba(96, 165, 250, 0.1);
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
		font-size: 12px;
		color: var(--primary);
	}

	@media (max-width: 900px) {
		.form-grid { grid-template-columns: 1fr; }
	}
</style>

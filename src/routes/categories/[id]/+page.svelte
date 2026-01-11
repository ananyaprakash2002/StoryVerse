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
	import CoverImage from '$lib/components/media/CoverImage.svelte';
	import GridView from '$lib/components/category/GridView.svelte';
	import ViewToggle from '$lib/components/category/ViewToggle.svelte';

	let category: Category | null = null;
	let items: CategoryItem[] = [];
	let loading = true;
	let showModal = false;
	let showDetailsModal = false;
	let editingItem: CategoryItem | null = null;
	let viewingItem: CategoryItem | null = null;
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
	let viewMode: 'table' | 'grid' = 'table';

	let categoryId: string = '';
	$: categoryId = $page.params.id ?? '';

	onMount(() => {
		// Use inner async function to avoid returning a Promise from onMount
	 	const init = async () => {
	 		// Load view preference from localStorage
	 		const saved = localStorage.getItem(`viewMode_${categoryId}`);
	 		if (saved === 'table' || saved === 'grid') {
	 			viewMode = saved;
	 			console.log('Loaded saved view mode:', saved);
	 		}

	 		await loadData();
	 	};

	 	init();

	 	// Close dropdown when clicking outside
	 	const handleClickOutside = (e: MouseEvent) => {
	 		const target = e.target as HTMLElement | null;
	 		if (!target || !target.closest('.dropdown')) {
	 			showColumnDropdown = false;
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
		viewingItem = item;
		showDetailsModal = true;
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
		showDetailsModal = false;
	}

	async function handleSubmit(data: Record<string, any>, imageData?: { url: string; path: string; apiSource?: string; apiId?: string }) {
		saving = true;
		try {
			const itemData: CategoryItemInput = {
				data,
				cover_image_url: imageData?.url || '',
				cover_image_path: imageData?.path || '',
				api_source: imageData?.apiSource === 'google_books' ? 'google_books' : null,
				api_id: imageData?.apiId || ''
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
			showDetailsModal = false;
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

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	$: hasActiveFilters = searchQuery || Object.values(columnFilters).some((v) => v);
	$: visibleFields = category?.fields?.filter(f => visibleColumns.has(f.name)) || [];
	
	// Define which columns to show in the table (only key fields)
	$: tableColumns = category?.fields?.filter(f => {
		const fieldName = f.name.toLowerCase();
		return fieldName.includes('title') || 
		       fieldName.includes('author') || 
		       fieldName.includes('status') ||
		       fieldName.includes('tag');
	}) || [];
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
				<Button variant="primary" onClick={openAddModal}>+ Add Item</Button>
				<button class="btn btn-danger" on:click={handleDeleteCategory}>
					Delete Category
				</button>
			</div>
		</div>

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

<!-- Item Details Modal -->
<Modal bind:isOpen={showDetailsModal} title="Item Details">
	{#if viewingItem && category}
		<div class="details-view">
			<!-- Cover Image -->
			{#if viewingItem.cover_image_url}
				<div class="details-cover">
					<CoverImage 
						imageUrl={viewingItem.cover_image_url} 
						title={viewingItem.data.title || viewingItem.data.name || 'Item'}
						size="lg"
					/>
				</div>
			{/if}

			<div class="details-grid">
				{#each category.fields || [] as field}
					<div class="detail-card">
						<div class="detail-label">{field.label}</div>
						<div class="detail-value">
							{#if field.field_type === 'boolean'}
								<span class="badge">{viewingItem.data[field.name] ? '✓ Yes' : '✗ No'}</span>
							{:else if field.field_type === 'rating'}
								<div class="rating-display">
									{#each Array(viewingItem.data[field.name] || 0) as _}
										<span class="star filled">★</span>
									{/each}
									{#each Array(5 - (viewingItem.data[field.name] || 0)) as _}
										<span class="star">☆</span>
									{/each}
								</div>
							{:else if field.field_type === 'tags' || field.field_type === 'multiselect'}
								{#if Array.isArray(viewingItem.data[field.name]) && viewingItem.data[field.name].length > 0}
									<div class="chips">
										{#each viewingItem.data[field.name] as tag}
											<span class="chip-large">{tag}</span>
										{/each}
									</div>
								{:else}
									<span class="text-muted">-</span>
								{/if}
							{:else if field.field_type === 'url'}
								{#if viewingItem.data[field.name]}
									<a
										href={viewingItem.data[field.name]}
										target="_blank"
										rel="noopener noreferrer"
										class="url-link-large"
									>
										🔗 {viewingItem.data[field.name]}
									</a>
								{:else}
									<span class="text-muted">-</span>
								{/if}
							{:else if field.field_type === 'textarea'}
								<div class="textarea-display">
									{viewingItem.data[field.name] || '-'}
								</div>
							{:else}
								{viewingItem.data[field.name] || '-'}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="details-meta">
				<div class="meta-item">
					<strong>Created:</strong> {formatDate(viewingItem.created_at)}
				</div>
				<div class="meta-item">
					<strong>Updated:</strong> {formatDate(viewingItem.updated_at)}
				</div>
			</div>

                <div class="details-actions">
                	<Button variant="primary" onClick={() => openEditModal(viewingItem as CategoryItem)}>
                		Edit Item
                	</Button>
                	<button class="btn btn-danger" on:click={() => handleDelete(viewingItem as CategoryItem)}>
                		Delete Item
                	</button>
                </div>
		</div>
	{/if}
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

	.dropdown {
		position: relative;
	}

	.dropdown.open .dropdown-menu {
		display: block;
	}

	.dropdown-menu {
		display: none;
		position: absolute;
		right: 0;
		top: 100%;
		margin-top: var(--space-xs);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-sm);
		min-width: 200px;
		max-height: 400px;
		overflow-y: auto;
		z-index: 100;
		box-shadow: var(--shadow-lg);
	}

	.dropdown-header {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border-bottom: 1px solid var(--border-color);
		margin-bottom: var(--space-sm);
		font-size: var(--font-size-xs);
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		padding: 0;
		font-size: var(--font-size-xs);
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}

	.dropdown-item:hover {
		background: var(--bg-tertiary);
	}

	.bulk-actions-bar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: rgba(96, 165, 250, 0.1);
		border: 1px solid rgba(96, 165, 250, 0.3);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
	}

	.bulk-actions-bar span {
		font-weight: 600;
		color: var(--primary);
	}

	.search-results {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		white-space: nowrap;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: var(--space-lg);
	}

	.checkbox-col {
		width: 40px;
		text-align: center;
	}

	.cover-col {
		width: 60px;
		padding: var(--space-xs);
	}

	.filter-row th {
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-secondary);
	}

	.column-filter {
		font-size: var(--font-size-xs);
		padding: var(--space-xs) var(--space-sm);
		margin: 0;
	}

	.clickable-row {
		cursor: pointer;
	}

	.clickable-row:hover {
		background: rgba(96, 165, 250, 0.05);
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

	/* Details Modal Styles */
	.details-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.details-cover {
		display: flex;
		justify-content: center;
		padding: var(--space-md);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--space-lg);
	}

	.detail-card {
		background: var(--bg-secondary);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
	}

	.detail-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.detail-value {
		font-size: var(--font-size-md);
		color: var(--text-primary);
		word-break: break-word;
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-sm);
		background: rgba(96, 165, 250, 0.1);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.rating-display {
		display: flex;
		gap: var(--space-xs);
		font-size: 1.5rem;
	}

	.star.filled {
		color: var(--warning);
	}

	.chip-large {
		display: inline-block;
		padding: var(--space-sm) var(--space-md);
		background: rgba(96, 165, 250, 0.1);
		color: var(--primary);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border: 1px solid rgba(96, 165, 250, 0.2);
		margin-right: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.url-link-large {
		color: var(--primary);
		text-decoration: none;
		word-break: break-all;
	}

	.url-link-large:hover {
		text-decoration: underline;
	}

	.textarea-display {
		white-space: pre-wrap;
		line-height: 1.6;
	}

	.details-meta {
		display: flex;
		gap: var(--space-xl);
		padding: var(--space-lg);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
	}

	.meta-item {
		color: var(--text-secondary);
	}

	.details-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
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

		.column-filter {
			font-size: var(--font-size-xs);
		}

		.details-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

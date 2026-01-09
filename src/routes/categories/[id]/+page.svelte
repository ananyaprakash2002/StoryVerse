<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCategory, deleteCategory } from '$lib/services/categories';
	import { getItems, createItem, updateItem, deleteItem } from '$lib/services/category-items';
	import { toasts } from '$lib/stores/ui';
	import type { Category, CategoryItem } from '$lib/types/category';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Loader from '$lib/components/common/Loader.svelte';
	import DynamicForm from '$lib/components/category/DynamicForm.svelte';

	let category: Category | null = null;
	let items: CategoryItem[] = [];
	let loading = true;
	let showModal = false;
	let editingItem: CategoryItem | null = null;
	let formValues: Record<string, any> = {};
	let saving = false;

	$: categoryId = $page.params.id;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			[category, items] = await Promise.all([getCategory(categoryId), getItems(categoryId)]);
		} catch (err: any) {
			toasts.error(err.message || 'Failed to load category');
			goto('/categories');
		} finally {
			loading = false;
		}
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

	async function handleSubmit(data: Record<string, any>) {
		saving = true;
		try {
			if (editingItem) {
				await updateItem(editingItem.id, { data });
				toasts.success('Item updated!');
			} else {
				await createItem(categoryId, { data });
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

		{#if items.length === 0}
			<div class="empty-state card">
				<span class="empty-icon">{category.icon || '📦'}</span>
				<h3>No Items Yet</h3>
				<p>Add your first item to start tracking!</p>
				<Button variant="primary" onClick={openAddModal}>Add Item</Button>
			</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							{#each category.fields || [] as field}
								<th>{field.label}</th>
							{/each}
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item}
							<tr>
								{#each category.fields || [] as field}
									<td>
										{#if field.field_type === 'boolean'}
											{item.data[field.name] ? '✓' : '✗'}
										{:else if field.field_type === 'rating'}
											{'★'.repeat(item.data[field.name] || 0)}
										{:else if field.field_type === 'tags'}
											{#if Array.isArray(item.data[field.name])}
												{item.data[field.name].join(', ')}
											{:else}
												{item.data[field.name] || '-'}
											{/if}
										{:else if field.field_type === 'multiselect'}
											{#if Array.isArray(item.data[field.name])}
												{item.data[field.name].join(', ')}
											{:else}
												{item.data[field.name] || '-'}
											{/if}
										{:else if field.field_type === 'url'}
											{#if item.data[field.name]}
												<a
													href={item.data[field.name]}
													target="_blank"
													rel="noopener noreferrer"
													class="url-link"
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
								<td>
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

<Modal bind:isOpen={showModal} title={editingItem ? 'Edit Item' : 'Add Item'}>
	{#if category}
		<DynamicForm
			fields={category.fields || []}
			bind:values={formValues}
			onSubmit={handleSubmit}
			submitLabel={editingItem ? 'Update' : 'Create'}
			loading={saving}
		/>
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

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: var(--space-lg);
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

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
		}

		.table-container {
			overflow-x: auto;
		}
	}
</style>

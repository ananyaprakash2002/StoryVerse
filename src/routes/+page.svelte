<script lang="ts">
	import { onMount } from 'svelte';
	import { getDashboardStats, getRecentActivity } from '$lib/services/dashboard';
	import { formatDate } from '$lib/utils/dates';
	import Loader from '$lib/components/common/Loader.svelte';
	import StatusBadge from '$lib/components/media/StatusBadge.svelte';

	let stats: any = null;
	let recentActivity: any = null;
	let loading = true;

	onMount(async () => {
		try {
			[stats, recentActivity] = await Promise.all([getDashboardStats(), getRecentActivity()]);
		} catch (error) {
			console.error('Error loading dashboard:', error);
		} finally {
			loading = false;
		}
	});

	$: totalItems =
		(stats?.totalBooks || 0) +
		(stats?.totalManga || 0) +
		(stats?.totalAnime || 0) +
		(stats?.totalMovies || 0);
	$: totalCompleted =
		(stats?.completedBooks || 0) + (stats?.completedManga || 0) + (stats?.completedAnime || 0);
	$: completionRate = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
</script>

<div class="page">
	<div class="container">
		<div class="page-header">
			<h1>Dashboard</h1>
			<p class="text-muted">Welcome back! Here's your media tracking overview.</p>
		</div>

		{#if loading}
			<Loader size="lg" />
		{:else}
			<div class="stats-grid">
				<div class="stat-card card">
					<div class="stat-icon">📚</div>
					<div class="stat-content">
						<h3 class="stat-value">{stats?.totalBooks || 0}</h3>
						<p class="stat-label">Books</p>
						<p class="stat-detail text-success">
							{stats?.completedBooks || 0} completed
						</p>
					</div>
				</div>

				<div class="stat-card card">
					<div class="stat-icon">📖</div>
					<div class="stat-content">
						<h3 class="stat-value">{stats?.totalManga || 0}</h3>
						<p class="stat-label">Manga</p>
						<p class="stat-detail text-success">
							{stats?.completedManga || 0} completed
						</p>
					</div>
				</div>

				<div class="stat-card card">
					<div class="stat-icon">🎬</div>
					<div class="stat-content">
						<h3 class="stat-value">{stats?.totalAnime || 0}</h3>
						<p class="stat-label">Anime</p>
						<p class="stat-detail text-success">
							{stats?.completedAnime || 0} completed
						</p>
					</div>
				</div>

				<div class="stat-card card">
					<div class="stat-icon">🎥</div>
					<div class="stat-content">
						<h3 class="stat-value">{stats?.totalMovies || 0}</h3>
						<p class="stat-label">Movies</p>
						<p class="stat-detail text-muted">All watched</p>
					</div>
				</div>
			</div>

			<div class="summary-card card">
				<h2>Overall Progress</h2>
				<div class="progress-stats">
					<div class="progress-item">
						<span class="progress-label">Total Items:</span>
						<span class="progress-value">{totalItems}</span>
					</div>
					<div class="progress-item">
						<span class="progress-label">Completed:</span>
						<span class="progress-value text-success">{totalCompleted}</span>
					</div>
					<div class="progress-item">
						<span class="progress-label">Completion Rate:</span>
						<span class="progress-value text-primary">{completionRate}%</span>
					</div>
				</div>
				<div class="progress-bar">
					<div class="progress-fill" style="width: {completionRate}%"></div>
				</div>
			</div>

			<div class="recent-section">
				<h2>Recent Activity</h2>
				<div class="recent-grid">
					{#if recentActivity?.books && recentActivity.books.length > 0}
						<div class="recent-card card">
							<h3>📚 Recent Books</h3>
							<div class="recent-list">
								{#each recentActivity.books as book}
									<div class="recent-item">
										<div>
											<p class="item-title">{book.title}</p>
											<p class="item-subtitle text-muted">{book.author || 'Unknown author'}</p>
										</div>
										<StatusBadge status={book.completed} />
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if recentActivity?.manga && recentActivity.manga.length > 0}
						<div class="recent-card card">
							<h3>📖 Recent Manga</h3>
							<div class="recent-list">
								{#each recentActivity.manga as manga}
									<div class="recent-item">
										<div>
											<p class="item-title">{manga.name}</p>
											<p class="item-subtitle text-muted">Chapter {manga.chapter}</p>
										</div>
										<StatusBadge status={manga.completed} />
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if recentActivity?.anime && recentActivity.anime.length > 0}
						<div class="recent-card card">
							<h3>🎬 Recent Anime</h3>
							<div class="recent-list">
								{#each recentActivity.anime as anime}
									<div class="recent-item">
										<div>
											<p class="item-title">{anime.name}</p>
											<p class="item-subtitle text-muted">
												S{anime.season} E{anime.episode}
											</p>
										</div>
										<StatusBadge status={anime.completed} />
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if recentActivity?.movies && recentActivity.movies.length > 0}
						<div class="recent-card card">
							<h3>🎥 Recent Movies</h3>
							<div class="recent-list">
								{#each recentActivity.movies as movie}
									<div class="recent-item">
										<div>
											<p class="item-title">{movie.name}</p>
											<p class="item-subtitle text-muted">
												{formatDate(movie.date_watched)}
											</p>
										</div>
										<span class="badge badge-success">Watched</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				{#if totalItems === 0}
					<div class="empty-state card">
						<div class="empty-icon">📝</div>
						<h3>Get Started</h3>
						<p>Start tracking your media by adding your first item!</p>
						<div class="quick-actions">
							<a href="/books" class="btn btn-primary">Add Book</a>
							<a href="/manga" class="btn btn-secondary">Add Manga</a>
							<a href="/anime" class="btn btn-secondary">Add Anime</a>
							<a href="/movies" class="btn btn-secondary">Add Movie</a>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.page-header {
		margin-bottom: var(--space-2xl);
	}

	.page-header h1 {
		margin-bottom: var(--space-sm);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-lg);
		margin-bottom: var(--space-2xl);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-xl);
	}

	.stat-icon {
		font-size: 3rem;
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: var(--font-size-3xl);
		font-weight: 700;
		margin: 0;
		color: var(--primary);
	}

	.stat-label {
		font-size: var(--font-size-lg);
		color: var(--text-secondary);
		margin: var(--space-xs) 0;
	}

	.stat-detail {
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.summary-card {
		margin-bottom: var(--space-2xl);
	}

	.summary-card h2 {
		margin-bottom: var(--space-lg);
	}

	.progress-stats {
		display: flex;
		gap: var(--space-2xl);
		margin-bottom: var(--space-lg);
	}

	.progress-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.progress-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.progress-value {
		font-size: var(--font-size-xl);
		font-weight: 600;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary) 0%, var(--success) 100%);
		transition: width 0.5s ease-in-out;
	}

	.recent-section h2 {
		margin-bottom: var(--space-lg);
	}

	.recent-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-lg);
	}

	.recent-card h3 {
		margin-bottom: var(--space-lg);
		font-size: var(--font-size-lg);
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.recent-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
	}

	.recent-item:hover {
		background: var(--bg-elevated);
	}

	.item-title {
		font-weight: 500;
		margin: 0 0 var(--space-xs) 0;
	}

	.item-subtitle {
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: var(--space-lg);
	}

	.empty-state h3 {
		margin-bottom: var(--space-sm);
	}

	.empty-state p {
		margin-bottom: var(--space-xl);
	}

	.quick-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.progress-stats {
			flex-direction: column;
			gap: var(--space-md);
		}

		.recent-grid {
			grid-template-columns: 1fr;
		}

		.quick-actions {
			flex-direction: column;
		}
	}
</style>

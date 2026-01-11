<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';
	import { signOut } from '$lib/supabase/auth';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/ui';
	import ThemeToggle from './ThemeToggle.svelte';

	const navItems = [
		{ name: 'Dashboard', href: '/', icon: '📊' },
		{ name: 'Categories', href: '/categories', icon: '📁' },
		{ name: 'Analytics', href: '/analytics', icon: '📈' }
	];

	let showUserMenu = false;

	const handleSignOut = async () => {
		const { error } = await signOut();
		if (error) {
			toasts.error(error.message);
		} else {
			user.set(null);
			goto('/login');
		}
	};

	const toggleUserMenu = () => {
		showUserMenu = !showUserMenu;
	};
</script>

<nav class="navbar">
	<div class="navbar-container">
		<div class="navbar-brand">
			<h1 class="brand-title">✨ StoryVerse</h1>
		</div>

		<div class="navbar-links">
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-link"
					class:active={$page.url.pathname === item.href}
				>
					<span class="nav-icon">{item.icon}</span>
					<span class="nav-text">{item.name}</span>
				</a>
			{/each}
		</div>

		<div class="navbar-user">
<ThemeToggle />
			{#if $user}
				<button class="user-button" on:click={toggleUserMenu}>
					<span class="user-email">{$user.email}</span>
					<span class="user-icon">👤</span>
				</button>

				{#if showUserMenu}
					<div class="user-menu">
						<button class="menu-item" on:click={handleSignOut}> Sign Out </button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</nav>

<style>
	.navbar {
		background: rgba(17, 24, 39, 0.8);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--border-color);
		padding: var(--space-md) 0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 var(--space-lg);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xl);
	}

	.navbar-brand {
		flex-shrink: 0;
	}

	.brand-title {
		font-size: var(--font-size-xl);
		font-weight: 700;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
	}

	.navbar-links {
		display: flex;
		gap: var(--space-sm);
		flex: 1;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--transition-fast);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.nav-link:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.nav-link.active {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
		color: var(--primary);
	}

	.nav-icon {
		font-size: 1.25rem;
	}

	.navbar-user {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		position: relative;
		flex-shrink: 0;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--font-size-sm);
	}

	.user-button:hover {
		background: var(--bg-elevated);
		border-color: var(--border-light);
	}

	.user-email {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-icon {
		font-size: 1.25rem;
	}

	.user-menu {
		position: absolute;
		top: calc(100% + var(--space-sm));
		right: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		min-width: 150px;
		overflow: hidden;
		animation: slideDown 0.2s ease-in-out;
	}

	.menu-item {
		width: 100%;
		padding: var(--space-md);
		background: transparent;
		border: none;
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
		font-size: var(--font-size-sm);
	}

	.menu-item:hover {
		background: var(--bg-tertiary);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.navbar-links {
			gap: 0;
		}

		.nav-link {
			padding: var(--space-sm);
		}

		.nav-text {
			display: none;
		}

		.nav-icon {
			font-size: 1.5rem;
		}

		.user-email {
			display: none;
		}
	}
</style>

<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';
	import { signOut } from '$lib/supabase/auth';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/ui';
	import ThemeToggle from './ThemeToggle.svelte';

	const navItems = [
		{ name: 'Dashboard', href: '/', icon: '🏠', label: 'Dashboard' },
		{ name: 'Categories', href: '/categories', icon: '📁', label: 'Categories' },
		{ name: 'Analytics', href: '/analytics', icon: '📈', label: 'Analytics' }
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
		showUserMenu = false;
	};

	const toggleUserMenu = () => {
		showUserMenu = !showUserMenu;
	};

	function getUserInitial(email: string | undefined) {
		return email ? email[0].toUpperCase() : '?';
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') showUserMenu = false;
	}
</script>

<!-- Desktop / Tablet Top Navbar -->
<nav class="navbar" aria-label="Main navigation">
	<div class="navbar-container">
		<div class="navbar-brand">
			<a href="/" class="brand-link">
				<span class="brand-sparkle">✨</span>
				<span class="brand-title">StoryVerse</span>
			</a>
		</div>

		<div class="navbar-links" role="menubar">
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-link"
					class:active={$page.url.pathname === item.href}
					role="menuitem"
					aria-current={$page.url.pathname === item.href ? 'page' : undefined}
				>
					<span class="nav-icon" aria-hidden="true">{item.icon}</span>
					<span class="nav-text">{item.name}</span>
					{#if $page.url.pathname === item.href}
						<span class="active-indicator" aria-hidden="true"></span>
					{/if}
				</a>
			{/each}
		</div>

		<div class="navbar-user">
			<ThemeToggle />
			{#if $user}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="user-wrapper" on:keydown={handleMenuKeydown}>
					<button class="user-button" on:click={toggleUserMenu} aria-expanded={showUserMenu} aria-haspopup="true">
						<div class="user-avatar" aria-hidden="true">
							{getUserInitial($user.email)}
						</div>
						<span class="user-email-text">{$user.email}</span>
						<span class="chevron" class:rotated={showUserMenu} aria-hidden="true">▾</span>
					</button>

					{#if showUserMenu}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="menu-backdrop" on:click={() => (showUserMenu = false)} on:keydown={() => {}}></div>
						<div class="user-menu" role="menu">
							<div class="user-menu-header">
								<div class="menu-avatar">{getUserInitial($user.email)}</div>
								<div class="menu-user-info">
									<span class="menu-email">{$user.email}</span>
									<span class="menu-status">● Active</span>
								</div>
							</div>
							<div class="menu-divider"></div>
							<button class="menu-item signout-item" on:click={handleSignOut} role="menuitem">
								<span class="menu-item-icon">🚪</span>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</nav>

<!-- Mobile Bottom Tab Bar -->
<nav class="mobile-nav" aria-label="Mobile navigation">
	{#each navItems as item}
		<a
			href={item.href}
			class="mobile-nav-item"
			class:active={$page.url.pathname === item.href}
			aria-current={$page.url.pathname === item.href ? 'page' : undefined}
		>
			<span class="mobile-icon" aria-hidden="true">{item.icon}</span>
			<span class="mobile-label">{item.label}</span>
			{#if $page.url.pathname === item.href}
				<span class="mobile-active-dot" aria-hidden="true"></span>
			{/if}
		</a>
	{/each}
	{#if $user}
		<button class="mobile-nav-item user-mobile" on:click={toggleUserMenu}>
			<div class="mobile-avatar">{getUserInitial($user?.email)}</div>
			<span class="mobile-label">Account</span>
		</button>
		{#if showUserMenu}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="menu-backdrop" on:click={() => (showUserMenu = false)} on:keydown={() => {}}></div>
			<div class="mobile-user-popup">
				<div class="popup-header">
					<div class="popup-avatar">{getUserInitial($user?.email)}</div>
					<div>
						<div class="popup-email">{$user?.email}</div>
						<div class="popup-theme-row"><ThemeToggle /></div>
					</div>
				</div>
				<button class="popup-signout" on:click={handleSignOut}>
					<span>🚪</span> Sign Out
				</button>
			</div>
		{/if}
	{/if}
</nav>

<style>
	/* ======= DESKTOP NAVBAR ======= */
	.navbar {
		background: rgba(17, 24, 39, 0.85);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		padding: 0;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 1px 20px rgba(0, 0, 0, 0.3);
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 var(--space-xl);
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
		gap: var(--space-xl);
	}

	.navbar-brand {
		flex-shrink: 0;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		text-decoration: none;
	}

	.brand-sparkle {
		font-size: 1.4rem;
		animation: sparkleFloat 3s ease-in-out infinite;
	}

	@keyframes sparkleFloat {
		0%, 100% { transform: rotate(-5deg); }
		50% { transform: rotate(5deg); }
	}

	.brand-title {
		font-size: var(--font-size-xl);
		font-weight: 800;
		background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%);
		background-size: 200% 200%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradientFlow 4s ease infinite;
		letter-spacing: -0.02em;
	}

	@keyframes gradientFlow {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	.navbar-links {
		display: flex;
		gap: var(--space-xs);
		flex: 1;
		justify-content: center;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-lg);
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--transition-fast);
		font-size: var(--font-size-sm);
		font-weight: 500;
		position: relative;
		white-space: nowrap;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.07);
		color: var(--text-primary);
	}

	.nav-link.active {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.18) 0%, rgba(167, 139, 250, 0.12) 100%);
		color: var(--primary);
		font-weight: 600;
	}

	.active-indicator {
		position: absolute;
		bottom: -2px;
		left: 50%;
		transform: translateX(-50%);
		width: 20px;
		height: 2px;
		background: linear-gradient(90deg, var(--primary), #a78bfa);
		border-radius: 2px;
	}

	.nav-icon {
		font-size: 1.1rem;
	}

	/* User section */
	.navbar-user {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex-shrink: 0;
		position: relative;
	}

	.user-wrapper {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 6px 12px 6px 6px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 40px;
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--font-size-sm);
	}

	.user-button:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(96, 165, 250, 0.3);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.875rem;
		color: white;
		flex-shrink: 0;
	}

	.user-email-text {
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--font-size-sm);
	}

	.chevron {
		font-size: 0.75rem;
		opacity: 0.6;
		transition: transform var(--transition-fast);
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 998;
	}

	.user-menu {
		position: absolute;
		top: calc(100% + 10px);
		right: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04);
		min-width: 240px;
		overflow: hidden;
		animation: menuSlideIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 999;
	}

	@keyframes menuSlideIn {
		from { opacity: 0; transform: translateY(-8px) scale(0.96); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	.user-menu-header {
		padding: var(--space-lg);
		display: flex;
		align-items: center;
		gap: var(--space-md);
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(167, 139, 250, 0.05));
	}

	.menu-avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
		color: white;
		flex-shrink: 0;
	}

	.menu-user-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
	}

	.menu-email {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.menu-status {
		font-size: var(--font-size-xs);
		color: var(--success);
		font-weight: 500;
	}

	.menu-divider {
		height: 1px;
		background: var(--border-color);
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg);
		background: transparent;
		border: none;
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.menu-item:hover {
		background: var(--bg-tertiary);
	}

	.menu-item-icon {
		font-size: 1rem;
	}

	.signout-item:hover {
		background: rgba(239, 68, 68, 0.08);
		color: var(--danger);
	}

	/* ======= MOBILE BOTTOM NAV ======= */
	.mobile-nav {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 200;
		background: rgba(17, 24, 39, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding: 8px 0 env(safe-area-inset-bottom, 8px);
		justify-content: space-around;
		align-items: center;
		box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.3);
	}

	.mobile-nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		padding: 8px 12px;
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-decoration: none;
		transition: all var(--transition-fast);
		min-width: 60px;
		position: relative;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.mobile-nav-item.active {
		color: var(--primary);
	}

	.mobile-nav-item.active .mobile-icon {
		transform: scale(1.15);
	}

	.mobile-icon {
		font-size: 1.4rem;
		transition: transform var(--transition-fast);
	}

	.mobile-label {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.mobile-active-dot {
		position: absolute;
		top: 4px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--primary);
		box-shadow: 0 0 6px var(--primary);
	}

	.mobile-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.8rem;
		color: white;
		transition: transform var(--transition-fast);
	}

	.user-mobile:hover .mobile-avatar,
	.user-mobile:active .mobile-avatar {
		transform: scale(1.1);
	}

	.mobile-user-popup {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04);
		width: calc(100% - 40px);
		max-width: 360px;
		z-index: 999;
		animation: mobilePopup 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
		overflow: hidden;
	}

	@keyframes mobilePopup {
		from { opacity: 0; transform: translateX(-50%) translateY(20px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	.popup-header {
		padding: var(--space-lg);
		display: flex;
		align-items: center;
		gap: var(--space-md);
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(167, 139, 250, 0.05));
	}

	.popup-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.2rem;
		color: white;
		flex-shrink: 0;
	}

	.popup-email {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		font-weight: 500;
		margin-bottom: 4px;
		word-break: break-all;
	}

	.popup-theme-row {
		margin-top: 4px;
	}

	.popup-signout {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: transparent;
		border: none;
		border-top: 1px solid var(--border-color);
		color: var(--danger);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.popup-signout:hover {
		background: rgba(239, 68, 68, 0.08);
	}

	/* Light theme overrides */
	:global([data-theme='light']) .navbar {
		background: rgba(255, 255, 255, 0.92) !important;
		border-bottom: 1px solid var(--border-color) !important;
		box-shadow: 0 1px 20px rgba(0, 0, 0, 0.08) !important;
	}

	:global([data-theme='light']) .brand-title {
		background: linear-gradient(135deg, #0969da 0%, #7c3aed 50%, #059669 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	:global([data-theme='light']) .nav-link.active {
		background: linear-gradient(135deg, rgba(9, 105, 218, 0.12), rgba(124, 58, 237, 0.08));
	}

	:global([data-theme='light']) .user-button {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global([data-theme='light']) .mobile-nav {
		background: rgba(255, 255, 255, 0.95) !important;
		border-top: 1px solid var(--border-color) !important;
	}

	:global([data-theme='light']) .mobile-user-popup {
		background: white;
		border-color: var(--border-color);
	}

	/* ======= RESPONSIVE ======= */
	@media (max-width: 768px) {
		.navbar {
			display: none; /* Hide top nav on mobile, use bottom nav instead */
		}

		.mobile-nav {
			display: flex;
		}
	}

	@media (max-width: 900px) {
		.user-email-text {
			display: none;
		}

		.navbar-container {
			padding: 0 var(--space-lg);
		}
	}

	@media (max-width: 600px) {
		.nav-text {
			display: none;
		}
	}
</style>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';
	import { theme } from '$lib/stores/theme';
	import { getCurrentUser, onAuthStateChange } from '$lib/supabase/auth';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Toast from '$lib/components/common/Toast.svelte';

	let loading = true;
	let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
	const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

	function resetInactivityTimer() {
		// Clear existing timer
		if (inactivityTimer) {
			clearTimeout(inactivityTimer);
		}

		// Only set timer if user is logged in
		if ($user) {
			inactivityTimer = setTimeout(async () => {
				// Log out user after inactivity
				const { signOut } = await import('$lib/supabase/auth');
				await signOut();
				user.set(null);
				goto('/login');
			}, INACTIVITY_TIMEOUT);
		}
	}

	onMount(() => {
		// Initialize theme
		theme.init();
		
		// Get initial user
		getCurrentUser().then((currentUser) => {
			user.set(currentUser);
			loading = false;
			
			// Start inactivity timer if user is logged in
			if (currentUser) {
				resetInactivityTimer();
			}
		});

		// Listen for auth changes
		const { data } = onAuthStateChange((newUser) => {
			user.set(newUser);
			
			// Reset timer on auth state change
			if (newUser) {
				resetInactivityTimer();
			} else if (inactivityTimer) {
				clearTimeout(inactivityTimer);
				inactivityTimer = null;
			}
		});

		// Track user activity
		const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
		
		activityEvents.forEach((event) => {
			window.addEventListener(event, resetInactivityTimer, { passive: true });
		});
		// Logout when tab/window closes
		const handleBeforeUnload = async () => {
			if ($user) {
				const { signOut } = await import('$lib/supabase/auth');
				await signOut();
			}
		};
		
		window.addEventListener('beforeunload', handleBeforeUnload);


		return () => {
			// Cleanup
			data?.subscription.unsubscribe();
			if (inactivityTimer) {
				clearTimeout(inactivityTimer);
			}
			activityEvents.forEach((event) => {
				window.removeEventListener(event, resetInactivityTimer);
			});
		};
	});

	// Redirect logic
	$: {
		if (!loading) {
			const isLoginPage = $page.url.pathname === '/login';
			if (!$user && !isLoginPage) {
				goto('/login');
			} else if ($user && isLoginPage) {
				goto('/');
			}
		}
	}
</script>

<div class="app">
	{#if loading}
		<div class="loading-screen">
			<div class="loader"></div>
			<p>Loading StoryVerse...</p>
		</div>
	{:else}
		{#if $user}
			<Navbar />
		{/if}
		<main>
			<slot />
		</main>
	{/if}
	<Toast />
</div>

<style>
	.app {
		min-height: 100vh;
	}

	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: var(--space-lg);
	}

	.loader {
		width: 50px;
		height: 50px;
		border: 4px solid var(--bg-tertiary);
		border-top: 4px solid var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	main {
		min-height: calc(100vh - 80px);
	}
</style>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';
	import { getCurrentUser, onAuthStateChange } from '$lib/supabase/auth';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Toast from '$lib/components/common/Toast.svelte';

	let loading = true;

	onMount(() => {
		// Get initial user
		getCurrentUser().then((currentUser) => {
			user.set(currentUser);
			loading = false;
		});

		// Listen for auth changes
		const { data } = onAuthStateChange((newUser) => {
			user.set(newUser);
		});

		return () => {
			data?.subscription.unsubscribe();
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

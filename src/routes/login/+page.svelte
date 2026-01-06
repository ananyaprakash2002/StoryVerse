<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn, signUp } from '$lib/supabase/auth';
	import { user } from '$lib/stores/user';
	import { toasts } from '$lib/stores/ui';
	import Button from '$lib/components/common/Button.svelte';

	let isSignUp = false;
	let username = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let showPassword = false;
	let showConfirmPassword = false;

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		error = '';

		if (isSignUp && password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;

		try {
			const result = isSignUp
				? await signUp(username, email, password)
				: await signIn(username, password);

			if (result.error) {
				error = result.error.message;
			} else if (result.user) {
				user.set(result.user);
				toasts.success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
				goto('/');
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
		} finally {
			loading = false;
		}
	};

	const toggleMode = () => {
		isSignUp = !isSignUp;
		error = '';
		username = '';
		email = '';
		password = '';
		confirmPassword = '';
	};
</script>

<div class="login-page">
	<div class="login-container">
		<div class="login-card card">
			<div class="login-header">
				<h1 class="brand-title">✨ StoryVerse</h1>
				<p class="brand-subtitle">Track your media journey</p>
			</div>

			<form on:submit={handleSubmit}>
				<div class="form-group">
					<label for="username" class="form-label">Username</label>
					<input
						type="text"
						id="username"
						class="form-input"
						bind:value={username}
						placeholder="Enter username"
						required
						disabled={loading}
					/>
				</div>

				{#if isSignUp}
					<div class="form-group">
						<label for="email" class="form-label">Email</label>
						<input
							type="email"
							id="email"
							class="form-input"
							bind:value={email}
							placeholder="your@email.com"
							required
							disabled={loading}
						/>
					</div>
				{/if}

				<div class="form-group">
					<label for="password" class="form-label">Password</label>
					<div class="password-input-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							class="form-input password-input"
							bind:value={password}
							placeholder="••••••••"
							required
							disabled={loading}
						/>
						<button
							type="button"
							class="password-toggle"
							on:click={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							tabindex="-1"
						>
							{#if showPassword}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
								<line x1="1" y1="1" x2="23" y2="23"></line>
							</svg>
						{/if}
						</button>
					</div>
				</div>

				{#if isSignUp}
					<div class="form-group">
						<label for="confirmPassword" class="form-label">Confirm Password</label>
						<div class="password-input-wrapper">
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								id="confirmPassword"
								class="form-input password-input"
								bind:value={confirmPassword}
								placeholder="••••••••"
								required
								disabled={loading}
							/>
							<button
								type="button"
								class="password-toggle"
								on:click={() => (showConfirmPassword = !showConfirmPassword)}
								aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
								tabindex="-1"
							>
								{#if showConfirmPassword}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
									<line x1="1" y1="1" x2="23" y2="23"></line>
								</svg>
							{/if}
							</button>
						</div>
					</div>
				{/if}

				{#if error}
					<div class="error-message">
						{error}
					</div>
				{/if}

				<Button type="submit" variant="primary" size="lg" disabled={loading}>
					{loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
				</Button>
			</form>

			<div class="toggle-mode">
				<p>
					{isSignUp ? 'Already have an account?' : "Don't have an account?"}
					<button type="button" class="link-button" on:click={toggleMode} disabled={loading}>
						{isSignUp ? 'Sign In' : 'Sign Up'}
					</button>
				</p>
			</div>
		</div>

		<div class="features">
			<div class="feature-item">
				<span class="feature-icon">📚</span>
				<h3>Track Books</h3>
				<p>Keep track of all the books you're reading</p>
			</div>
			<div class="feature-item">
				<span class="feature-icon">📖</span>
				<h3>Manga Collection</h3>
				<p>Monitor your manga reading progress</p>
			</div>
			<div class="feature-item">
				<span class="feature-icon">🎬</span>
				<h3>Anime & Movies</h3>
				<p>Log your favorite shows and films</p>
			</div>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
	}

	.login-container {
		width: 100%;
		max-width: 900px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2xl);
		align-items: center;
	}

	.login-card {
		padding: var(--space-2xl);
	}

	.login-header {
		text-align: center;
		margin-bottom: var(--space-2xl);
	}

	.brand-title {
		font-size: var(--font-size-4xl);
		font-weight: 700;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: var(--space-sm);
	}

	.brand-subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-lg);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		align-items: stretch;
	}

	form :global(.btn) {
		width: 100%;
	}

	.password-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.password-input-wrapper .password-input {
		padding-right: 45px;
	}

	.password-toggle {
		position: absolute;
		right: 12px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		padding: 4px 8px;
		color: var(--text-muted);
		transition: color var(--transition-fast);
		user-select: none;
	}

	.password-toggle:hover {
		color: var(--text-primary);
	}

	.password-toggle:focus {
		outline: none;
		color: var(--primary);
	}

	.error-message {
		padding: var(--space-md);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--danger);
		border-radius: var(--radius-md);
		color: var(--danger);
		font-size: var(--font-size-sm);
	}

	.toggle-mode {
		margin-top: var(--space-lg);
		text-align: center;
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.toggle-mode p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}

	.link-button {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font-weight: 500;
		text-decoration: underline;
		padding: 0;
		margin-left: var(--space-xs);
	}

	.link-button:hover {
		color: var(--primary-hover);
	}

	.features {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.feature-item {
		text-align: center;
		padding: var(--space-lg);
		background: rgba(31, 41, 55, 0.3);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		transition: all var(--transition-base);
	}

	.feature-item:hover {
		border-color: var(--primary);
		transform: translateX(5px);
	}

	.feature-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: var(--space-md);
	}

	.feature-item h3 {
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-sm);
	}

	.feature-item p {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	@media (max-width: 768px) {
		.login-container {
			grid-template-columns: 1fr;
			gap: var(--space-xl);
		}

		.features {
			order: -1;
		}

		.login-card {
			padding: var(--space-xl);
		}
	}
</style>

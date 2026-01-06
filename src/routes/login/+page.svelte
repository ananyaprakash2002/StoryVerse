<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn, signUp } from '$lib/supabase/auth';
	import { user } from '$lib/stores/user';
	import { toasts } from '$lib/stores/ui';
	import Button from '$lib/components/common/Button.svelte';

	let isSignUp = false;
	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';

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
			const result = isSignUp ? await signUp(email, password) : await signIn(email, password);

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

				<div class="form-group">
					<label for="password" class="form-label">Password</label>
					<input
						type="password"
						id="password"
						class="form-input"
						bind:value={password}
						placeholder="••••••••"
						required
						disabled={loading}
					/>
				</div>

				{#if isSignUp}
					<div class="form-group">
						<label for="confirmPassword" class="form-label">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							class="form-input"
							bind:value={confirmPassword}
							placeholder="••••••••"
							required
							disabled={loading}
						/>
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

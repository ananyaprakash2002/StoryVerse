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
			<div class="features-hero">
				<h2 class="features-title">Track Anything, Your Way</h2>
				<p class="features-subtitle">Create unlimited custom categories with your own fields, icons, and layouts</p>
			</div>
			<div class="feature-item featured">
				<span class="feature-badge">✨ Main Feature</span>
				<span class="feature-icon">🎨</span>
				<h3>Custom Categories</h3>
				<p>Design your own tracking categories with custom fields, colors, and icons. Track anything from books to workouts to recipes.</p>
			</div>

			<div class="feature-grid">
				<div class="feature-item compact">
					<span class="feature-icon">📋</span>
					<h3>Ready Templates</h3>
					<p>Start with Books, Movies, Anime, or Manga templates</p>
				</div>
				<div class="feature-item compact">
					<span class="feature-icon">📊</span>
					<h3>Analytics</h3>
					<p>Visualize trends and insights with beautiful charts</p>
				</div>
				<div class="feature-item compact">
					<span class="feature-icon">🔍</span>
					<h3>Global Search</h3>
					<p>Find anything across all your categories instantly</p>
				</div>
				<div class="feature-item compact">
					<span class="feature-icon">🌈</span>
					<h3>Your Rules</h3>
					<p>Track recipes, travel plans, or whatever matters to you</p>
				</div>
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
		background: linear-gradient(135deg, 
			var(--bg-primary) 0%, 
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
	}

	.login-page::before,
	.login-page::after {
		content: '';
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		opacity: 0.1;
	}

	.login-page::before {
		top: -10%;
		right: -5%;
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
		animation: float 20s ease-in-out infinite;
	}

	.login-page::after {
		bottom: -10%;
		left: -5%;
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
		animation: float 15s ease-in-out infinite reverse;
	}

	@keyframes float {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -30px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
	}

	.login-container {
		width: 100%;
		max-width: 900px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2xl);
		align-items: center;
		position: relative;
		z-index: 1;
	}

	.login-card {
		padding: var(--space-2xl);
		background: var(--bg-primary);
		backdrop-filter: blur(10px);
		border: 1px solid var(--border-color);
		box-shadow: 
			0 10px 30px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	:global([data-theme='light']) .login-card {
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.05);
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
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	form :global(.btn:hover) {
		box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
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
		animation: shake 0.3s ease-in-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
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
		font-weight: 600;
		text-decoration: none;
		padding: 0;
		margin-left: var(--space-xs);
		transition: all var(--transition-fast);
		border-bottom: 2px solid transparent;
	}

	.link-button:hover {
		color: var(--primary-hover);
		border-bottom-color: var(--primary-hover);
	}

	.features {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.features-hero {
		text-align: center;
		margin-bottom: var(--space-lg);
		animation: fadeInUp 0.6s ease-out;
	}

	.features-title {
		font-size: 2.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, var(--primary) 100%);
		background-size: 200% 200%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: var(--space-md);
		animation: gradientShift 3s ease infinite;
		text-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
	}

	@keyframes gradientShift {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.features-subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-lg);
		line-height: 1.6;
		font-weight: 500;
	}

	.feature-item {
		text-align: center;
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: fadeInUp 0.6s ease-out backwards;
		position: relative;
		overflow: hidden;
	}

	.feature-item.featured {
		background: linear-gradient(135deg, 
			var(--bg-secondary) 0%, 
			var(--bg-primary) 100%
		);
		border: 2px solid var(--primary);
		box-shadow: 
			0 8px 32px rgba(99, 102, 241, 0.3),
			0 0 60px rgba(99, 102, 241, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		animation: fadeInUp 0.6s ease-out 0.1s backwards, glow 3s ease-in-out infinite;
	}

	@keyframes glow {
		0%, 100% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3), 0 0 60px rgba(99, 102, 241, 0.15); }
		50% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5), 0 0 80px rgba(99, 102, 241, 0.25); }
	}

	:global([data-theme='light']) .feature-item.featured {
		box-shadow: 
			0 8px 32px rgba(99, 102, 241, 0.2),
			0 0 60px rgba(99, 102, 241, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
		animation: fadeInUp 0.6s ease-out 0.1s backwards, glowLight 3s ease-in-out infinite;
	}

	@keyframes glowLight {
		0%, 100% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2), 0 0 60px rgba(99, 102, 241, 0.1); }
		50% { box-shadow: 0 12px 40px rgba(99, 102, 241, 0.3), 0 0 80px rgba(99, 102, 241, 0.15); }
	}

	.feature-badge {
		position: absolute;
		top: var(--space-md);
		right: var(--space-md);
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		color: white;
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
		animation: pulse 2s ease-in-out infinite, shimmer 3s linear infinite;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.08); }
	}

	@keyframes shimmer {
		0% { background-position: -100% 0; }
		100% { background-position: 200% 0; }
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		animation-delay: 0.2s;
		gap: var(--space-md);
	}

	.feature-item.compact {
		padding: var(--space-lg);
	}

	.feature-item.compact:nth-child(1) {
		animation-delay: 0.3s;
	}

	.feature-item.compact:nth-child(2) {
		animation-delay: 0.4s;
	}

	.feature-item.compact:nth-child(3) {
		animation-delay: 0.5s;
	}

	.feature-item.compact:nth-child(4) {
		animation-delay: 0.6s;
	}

	.feature-item.compact .feature-icon {
		font-size: 2rem;
		margin-bottom: var(--space-sm);
	}

	.feature-item.compact h3 {
		font-size: var(--font-size-md);
		font-weight: 700;
	}

	.feature-item.compact p {
		font-size: var(--font-size-xs);
	}

	:global([data-theme='light']) .feature-item {
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(8px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.feature-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		opacity: 0;
		transition: opacity var(--transition-base);
	}

	.feature-item:hover {
		border-color: var(--primary);
		transform: translateY(-8px) scale(1.02);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
	}

	.feature-item.featured:hover {
		transform: translateY(-8px) scale(1.02);
		box-shadow: 
			0 16px 48px rgba(99, 102, 241, 0.4),
			0 0 80px rgba(99, 102, 241, 0.2);
	}

	.feature-item:hover::before {
		opacity: 0.05;
	}

	:global([data-theme='light']) .feature-item:hover {
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
	}

	.feature-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: var(--space-md);
		position: relative;
		z-index: 1;
	}

	.feature-item h3 {
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-sm);
		position: relative;
		z-index: 1;
		font-weight: 600;
	}

	.feature-item p {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		position: relative;
		z-index: 1;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.login-page {
			padding: var(--space-md);
		}

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

		.brand-title {
			font-size: var(--font-size-3xl);
		}

		.features-title {
			font-size: var(--font-size-xl);
		}

		.feature-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

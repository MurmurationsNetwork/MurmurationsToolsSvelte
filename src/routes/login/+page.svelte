<script lang="ts">
	import { slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { isAuthenticatedStore } from '$lib/stores/isAuthenticatedStore';

	let loginType = $state('login');
	let email = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	async function onsubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		isSubmitting = true;
		const res = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password, loginType })
		});

		const data = await res.json();

		if (data.success) {
			isAuthenticatedStore.set(true);
			await goto('/');
		} else {
			errorMessage =
				loginType === 'login'
					? 'Login failed: ' + data.error
					: 'Registration failed: ' + data.error;
		}

		// Clear the password (security)
		password = '';
		isSubmitting = false;
	}

	function updateLoginType(newLoginType: string): void {
		loginType = newLoginType;
	}
</script>

<div class="container mx-auto flex justify-center items-center md:p-4">
	<div class="flex flex-col grow items-center md:p-4">
		{#if errorMessage}
			<div class="variant-filled-error py-2 px-4 rounded-md">{errorMessage}</div>
		{/if}
		<div class="card variant-ghost-primary m-4 p-4 w-3/4 md:w-1/2">
			<form {onsubmit}>
				<fieldset class="flex my-3 justify-center">
					<label class="mr-3">
						<input
							class="variant-ghost-primary dark:bg-gray-700 dark:text-white"
							type="radio"
							name="login-type"
							value="login"
							checked
							onclick={() => updateLoginType('login')}
						/>
						Login
					</label>
					<label>
						<input
							class="variant-ghost-primary dark:bg-gray-700 dark:text-white"
							type="radio"
							name="login-type"
							value="register"
							onclick={() => updateLoginType('register')}
						/>
						Register
					</label>
				</fieldset>
				<div class="m-4 flex flex-col text-left">
					<label>
						<div class="my-2">Email:</div>
						<input
							class="w-full dark:bg-gray-700 dark:text-white"
							name="email"
							id="email"
							type="text"
							bind:value={email}
							required
						/>
					</label>
					<label>
						<div class="my-2">Password:</div>
						<input
							class="w-full dark:bg-gray-700 dark:text-white"
							name="password"
							id="password"
							type="password"
							bind:value={password}
							required
						/>
					</label>
				</div>
				<div class="flex justify-around mt-4 md:mt-8">
					<button
						type="submit"
						class="btn font-semibold md:btn-lg w-32 md:w-36 variant-filled-primary dark:bg-blue-700 dark:text-white"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<span transition:slide={{ delay: 50, duration: 100, axis: 'x' }}>Loading...</span>
						{:else if loginType === 'login'}
							<span transition:slide={{ delay: 50, duration: 100, axis: 'x' }}>Login</span>
						{:else}
							<span transition:slide={{ delay: 50, duration: 100, axis: 'x' }}>Register</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

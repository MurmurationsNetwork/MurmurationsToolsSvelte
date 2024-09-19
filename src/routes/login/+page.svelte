<script lang="ts">
	import { slide } from 'svelte/transition';
	import { backInOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { isAuthenticatedStore } from '$lib/stores/isAuthenticatedStore';

	let loginType = 'login';
	let email = '';
	let password = '';

	async function handleSubmit() {
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
			console.log('Login failed: ' + data.error);
		}

		// Clear the password (security)
		password = '';
	}
</script>

<div class="container mx-auto flex justify-center items-center md:p-4">
	<div class="flex flex-col grow items-center md:p-4">
		<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4 w-3/4 md:w-1/2">
			<form on:submit|preventDefault={handleSubmit}>
				<fieldset class="flex my-3 justify-center">
					<label class="mr-3">
						<input
							class="variant-ghost-primary"
							type="radio"
							name="login-type"
							value="login"
							checked
							on:click={() => (loginType = 'login')}
						/>
						Login
					</label>
					<label>
						<input
							class="variant-ghost-primary"
							type="radio"
							name="login-type"
							value="register"
							on:click={() => (loginType = 'register')}
						/>
						Register
					</label>
				</fieldset>
				<div class="m-4 flex flex-col text-left">
					<label>
						<div class="my-2">Email:</div>
						<input class="w-full" name="email" id="email" type="text" bind:value={email} required />
					</label>
					<label>
						<div class="my-2">Password:</div>
						<input
							class="w-full"
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
						class="btn font-semibold md:btn-lg w-32 md:w-36 variant-filled-primary"
					>
						{#if loginType === 'login'}
							<span transition:slide={{ delay: 50, duration: 100, easing: backInOut, axis: 'x' }}
								>Login</span
							>
						{:else}
							<span transition:slide={{ delay: 50, duration: 100, easing: backInOut, axis: 'x' }}
								>Register</span
							>
						{/if}
					</button>
					<button class="btn font-semibold md:btn-lg w-32 md:w-36 variant-filled-secondary"
						>Cancel</button
					>
				</div>
			</form>
		</div>
	</div>
</div>

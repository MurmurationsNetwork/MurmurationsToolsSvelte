<script>
	import { currentProfile, schemasSelected } from '$lib/stores';

	let profilePreview = false;

	function resetSchemas() {
		schemasSelected.set([]);
		currentProfile.set({});
	}

	function handleSubmit(event) {
		const formData = new FormData(event.target);
		// console.log([...formData.entries()]);
		// console.log(Object.fromEntries(formData));
		currentProfile.set(Object.fromEntries(formData));
		profilePreview = true;
		// event.target.reset();
	}
</script>

<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
	{#if !profilePreview}
		<div class="font-medium mb-4">Editing profile with the following schemas</div>

		{#each $schemasSelected as schema}
			<span class="badge variant-ghost-primary font-medium text-sm mx-4 mb-2">{schema}</span>
		{/each}

		<form on:submit|preventDefault={handleSubmit}>
			<div class="m-4 flex flex-col text-left">
				<label>
					<div class="my-2">Name:</div>
					<input
						class="w-full"
						name="name"
						id="name"
						type="text"
						required
						value={$currentProfile.name || ''}
					/>
				</label>
				<label>
					<div class="my-2">Primary URL:</div>
					<input
						class="w-full"
						name="primary_url"
						id="primary_url"
						type="text"
						required
						value={$currentProfile.primary_url || ''}
					/>
				</label>
			</div>
			<div class="flex justify-around mt-4 md:mt-8">
				<button type="submit" class="btn font-semibold md:btn-lg variant-filled-primary"
					>Validate</button
				>
				<button on:click={resetSchemas} class="btn font-semibold md:btn-lg variant-filled-secondary"
					>Reset</button
				>
			</div>
		</form>
	{/if}

	{#if profilePreview}
		<div class="font-medium text-lg mb-4 mx-4 variant-filled-success">The profile is valid</div>

		<div class="m-4 bg-primary-300 dark:bg-primary-900 rounded-xl px-4 py-2">
			<code class="text-sm text-left"
				>{JSON.stringify({ linked_schemas: $schemasSelected, ...$currentProfile })}</code
			>
		</div>
		<div class="flex justify-around mt-4 md:mt-8">
			<button
				on:click={() => (profilePreview = false)}
				class="btn font-semibold md:btn-lg variant-filled-primary">Continue Editing</button
			>
		</div>
		<div class="mt-4 md:mt-8">
			<div class="m-4 flex flex-col text-left">
				<label>
					<div class="my-2">Title:</div>
					<input class="w-full" name="title" id="title" type="text" required />
				</label>
			</div>
		</div>
		<button
			on:click={() => (profilePreview = false)}
			class="btn font-semibold md:btn-lg variant-filled-primary">Save & Post</button
		>
	{/if}
</div>

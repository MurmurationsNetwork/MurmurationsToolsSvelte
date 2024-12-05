<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_TOOLS_URL } from '$env/static/public';
	import SchemaSelector from '../profile-generator/SchemaSelector.svelte';

	// Fetch the list of schemas
	type Data = {
		schemasList: string[];
		errorMessage: string | null;
	};

	export let data: Data;
	$: ({ schemasList, errorMessage } = data);

	let title = '';
	let file: FileList | null = null;
	let batches: Batch[] = [];
	let schemasSelected: string[] = [];

	interface Batch {
		title: string;
		batch_id: string;
		schemas: string[];
	}

	async function handleImport() {
		if (!file || !title || schemasSelected.length === 0) {
			console.log('Title, file, and at least one schema are required');
			return;
		}

		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('file', file[0]);
			formData.append('schemas', JSON.stringify(schemasSelected));

			const response = await fetch(`${PUBLIC_TOOLS_URL}/batch-import`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const res = await response.json();
				console.log(res);
				return;
			}

			const data = await response.json();
			console.log(data);
		} catch (error) {
			console.log(error);
		}
	}

	function handleSchemasSelected(event: CustomEvent<string[]>) {
		schemasSelected = event.detail;
	}

	onMount(async () => {
		// Fetch initial batch data
	});
</script>

<div class="container mx-auto flex justify-center items-top">
	<div class="text-center md:flex flex-row grow items-top">
		<!-- BEGIN: List of batches -->
		<div class="bg-blue-50 dark:bg-gray-800 md:basis-1/3 m-2 px-2">
			{#if batches.length === 0}
				<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4 dark:border-gray-600">
					<!-- {#if !isDbOnline}
                        <p class="font-medium dark:text-white text-left">
                            Unable to connect to the database, Unable to load profiles
                        </p>
                    {:else if !isLoggedIn}
                        <p class="font-medium dark:text-white text-left">
                            Login first if you want to save your profile here, or just create a profile by
                            selecting a schema from the list.
                        </p>
                        <p class="font-medium dark:text-white pt-4">
                            <a
                                href="https://docs.murmurations.network/guides/create-a-profile.html#_2-hosted-by-our-profile-generator"
                                target="_blank"
                                class="text-blue-500 dark:text-blue-300">See our documentation for details</a
                            >
                        </p>
                    {:else} -->
					<p class="font-medium dark:text-white">No saved batches found</p>
					<!-- {/if} -->
				</div>
			{/if}
			{#each batches as batch}
				<div>
					<p>Title: {batch.title}</p>
					<p>Batch ID: {batch.batch_id}</p>
					<p>Schemas: {batch.schemas.join(', ')}</p>
				</div>
			{/each}
		</div>
		<!-- END: List of batches -->
		<!-- BEGIN: Schema selection box and import form -->
		<div class="md:basis-2/3 md:order-first p-2">
			{#if errorMessage}
				<div class="bg-red-500 text-white dark:text-white">
					<p class="font-medium">{errorMessage}</p>
				</div>
			{/if}
			<form on:submit|preventDefault={handleImport}>
				{#if schemasSelected.length === 0}
					<SchemaSelector {schemasList} on:schemaSelected={handleSchemasSelected} />
				{:else}
					<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
						<form on:submit|preventDefault={handleImport}>
							<div class="font-medium">Import a new batch</div>
							<div class="my-2">
								<label for="title">
									<div class="my-2 font-bold text-left">
										Title:<span class="ml-1 text-red-500">*</span>
									</div>
									<input
										class="w-full bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
										type="text"
										id="title"
										name="title"
										bind:value={title}
										required
									/>
								</label>
							</div>
							<div class="my-2">
								<label for="file">
									<div class="my-2 font-bold text-left">
										Upload File:<span class="ml-1 text-red-500">*</span>
									</div>
									<input
										class="w-full bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
										type="file"
										id="file"
										name="file"
										bind:files={file}
										required
										multiple={false}
									/>
								</label>
							</div>
							<div class="flex justify-around mt-4 md:mt-8">
								<button type="submit" class="btn font-semibold md:btn-lg variant-filled-primary"
									>Import</button
								>
								<button
									type="button"
									class="btn font-semibold md:btn-lg variant-filled-secondary"
									on:click={() => (schemasSelected = [])}>Reset</button
								>
							</div>
						</form>
					</div>
				{/if}
			</form>
		</div>
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_TOOLS_URL } from '$env/static/public';
	import SchemaSelector from '../profile-generator/SchemaSelector.svelte';
	import { dbStatus } from '$lib/stores/dbStatus';

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

	async function fetchBatches() {
		try {
			const response = await fetch(`${PUBLIC_TOOLS_URL}/batch-importer`);
			if (response.ok) {
				const data = await response.json();
				batches = data.data.map((batch: Batch) => ({
					title: batch.title,
					batch_id: batch.batch_id,
					schemas: batch.schemas
				}));
			} else {
				console.error('Failed to fetch batches:', response.status);
			}
		} catch (error) {
			console.error('Error fetching batches:', error);
		}
	}

	onMount(async () => {
		await fetchBatches();
	});

	let isDbOnline = true;

	$: dbStatus.subscribe((value) => {
		isDbOnline = value;
	});

	async function handleModify(batch_id: string) {
		console.log('Modify batch:', batch_id);
	}

	async function handleDelete(batch_id: string) {
		console.log('Delete batch:', batch_id);
	}
</script>

<div class="container mx-auto flex justify-center items-top">
	<div class="text-center md:flex flex-row grow items-top">
		<!-- BEGIN: List of batches -->
		<div class="bg-blue-50 dark:bg-gray-800 md:basis-1/3 m-2 px-2 overflow-auto">
			{#if batches.length === 0}
				<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4 dark:border-gray-600">
					<p class="font-medium dark:text-white">No saved batches found</p>
				</div>
			{/if}
			{#each batches as batch}
				<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
					<div class="font-medium break-words">{batch.title}</div>
					<div class="m-4">
						<span class="badge variant-ghost-primary font-bold text-sm mx-4 mt-2 break-words"
							>Batch ID: {batch.batch_id}</span
						>
						<span
							class="badge variant-ghost-primary font-bold text-sm mx-4 mt-2 break-words whitespace-pre-wrap"
							>Schemas: {batch.schemas.join(', ')}</span
						>
					</div>
					<div class="flex justify-around mt-4 md:mt-8">
						<button
							on:click={() => handleModify(batch.batch_id)}
							class="btn font-semibold md:btn-lg variant-filled-primary"
							disabled={!!errorMessage || !isDbOnline}>Modify</button
						>
						<button
							on:click={() => handleDelete(batch.batch_id)}
							class="btn font-semibold md:btn-lg variant-filled-secondary"
							disabled={!!errorMessage || !isDbOnline}>Delete</button
						>
					</div>
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

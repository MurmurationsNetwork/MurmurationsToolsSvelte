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
	let errorsMessage: string[] | null = null;
	let successMessage: string | null = null;

	interface Batch {
		title: string;
		batch_id: string;
		schemas: string[];
	}

	async function handleImport() {
		if (!file || !title || schemasSelected.length === 0) {
			errorMessage = 'Title, file, and at least one schema are required';
			return;
		}

		if (file[0].type !== 'text/csv') {
			errorMessage = 'Only CSV files are allowed';
			return;
		}

		try {
			const formData = new FormData();
			formData.append('file', file[0]);
			formData.append('schemas', JSON.stringify(schemasSelected));
			formData.append('title', title);

			// Use the POST method from +server.ts
			const response = await fetch(`${PUBLIC_TOOLS_URL}/batch-importer`, {
				method: 'POST',
				body: formData
			});

			const res = await response.json();

			if (!response.ok) {
				if (res.errors) {
					errorsMessage = res.errors.map(
						(error: {
							status: number;
							source: { oid?: string; pointer?: string };
							title?: string;
							detail?: string;
						}) => {
							const errorDetails = [];
							if (error.source?.oid !== undefined) errorDetails.push(`OID: ${error.source.oid}`);
							if (error.source?.pointer !== undefined)
								errorDetails.push(`Pointer: ${error.source.pointer}`);
							if (error.title !== undefined) errorDetails.push(`Title: ${error.title}`);
							if (error.detail !== undefined) errorDetails.push(`Detail: ${error.detail}`);
							return errorDetails.join(' - ');
						}
					);
				} else {
					errorMessage = res.error || 'Failed to import batch';
				}
				return;
			}

			await fetchBatches();
			resetForm();
			successMessage = 'Batch imported successfully';
		} catch (error) {
			errorMessage =
				(error as Error).message ||
				'An error occurred while processing your request, please try again later';
		}
	}

	function handleSchemasSelected(event: CustomEvent<string[]>) {
		schemasSelected = event.detail;
	}

	function resetForm() {
		schemasSelected = [];
		title = '';
		file = null;
		errorMessage = null;
		errorsMessage = null;
		successMessage = null;
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
			{#if errorsMessage !== null}
				<div class="bg-red-500 text-white dark:text-white p-4 rounded text-left">
					<p class="font-medium">There were errors in your submission:</p>
					<ul>
						{#each errorsMessage as error}
							<li class="font-medium list-disc list-inside">{error}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if successMessage}
				<div class="bg-green-500 text-white dark:text-white p-4 rounded text-left">
					<p class="font-medium">{successMessage}</p>
				</div>
			{/if}
			<form on:submit|preventDefault={handleImport}>
				{#if schemasSelected.length === 0}
					<SchemaSelector {schemasList} on:schemaSelected={handleSchemasSelected} />
				{:else}
					<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
						<form on:submit|preventDefault={handleImport}>
							<div class="font-medium">Import a new batch</div>
							<h3 class="mt-8 text-left">
								Schemas selected:
								<ol>
									{#each schemasSelected as schemaName}
										<li>
											<code>{schemaName}</code>
										</li>
									{/each}
								</ol>
							</h3>
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

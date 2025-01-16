<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_TOOLS_URL } from '$env/static/public';
	import SchemaSelector from '../profile-generator/SchemaSelector.svelte';
	import { dbStatus } from '$lib/stores/dbStatus';

	// Fetch the list of schemas
	interface PageData {
		schemasList: string[];
		errorMessage: string | null;
	}

	interface Batch {
		title: string;
		batch_id: string;
		schemas: string[];
	}

	let { data }: { data: PageData } = $props();

	let title = $state('');
	let file: FileList | null = $state(null);
	let batches: Batch[] = $state([]);
	let schemasSelected: string[] = $state([]);
	let errorsMessage: string[] | null = $state(null);
	let successMessage: string | null = $state(null);
	let isLoading = $state(false);
	let isModifyMode = $state(false);
	let currentBatchId: string | null = null;
	let isLoggedIn: boolean = $state(true);
	let isDbOnline = $state(true);

	// Subscribe to dbStatus changes
	dbStatus.subscribe((value) => (isDbOnline = value));

	onMount(async () => {
		if (isLoggedIn) {
			await fetchBatches();
		}
	});

	async function handleImportOrModify(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		try {
			isLoading = true;
			if (!file || !title || schemasSelected.length === 0) {
				data.errorMessage = 'Title, file, and at least one schema are required';
				return;
			}

			if (file[0].type !== 'text/csv') {
				data.errorMessage = 'Only CSV files are allowed';
				return;
			}

			const formData = new FormData();
			formData.append('file', file[0]);
			formData.append('schemas', JSON.stringify(schemasSelected));
			formData.append('title', title);

			let response;
			if (isModifyMode && currentBatchId) {
				formData.append('batch_id', currentBatchId);
				response = await fetch(`${PUBLIC_TOOLS_URL}/batch-importer`, {
					method: 'PUT',
					body: formData
				});
			} else {
				response = await fetch(`${PUBLIC_TOOLS_URL}/batch-importer`, {
					method: 'POST',
					body: formData
				});
			}

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
					data.errorMessage = res.error || 'Failed to import/modify batch';
				}
				return;
			}

			await fetchBatches();
			const wasModifyMode = isModifyMode;
			resetForm();
			successMessage = wasModifyMode
				? 'Batch modified successfully'
				: 'Batch imported successfully';
		} catch (err) {
			data.errorMessage =
				(err as Error).message ||
				'An error occurred while processing your request, please try again later';
		} finally {
			isLoading = false;
		}
	}

	async function handleDelete(batch_id: string): Promise<void> {
		try {
			isLoading = true;

			const formData = new FormData();
			formData.append('batch_id', batch_id);

			const response = await fetch(`${PUBLIC_TOOLS_URL}/batch-importer`, {
				method: 'DELETE',
				body: formData
			});

			if (!response.ok) {
				const res = await response.json();
				data.errorMessage = res.message || 'Failed to delete batch';
				return;
			}

			await fetchBatches();
			successMessage = 'Batch deleted successfully';
		} catch (err) {
			data.errorMessage =
				(err as Error).message ||
				'An error occurred while processing your request, please try again later';
		} finally {
			isLoading = false;
			resetForm();
		}
	}

	function handleSchemasSelected(schemas: string[]): void {
		schemasSelected = schemas;
	}

	function resetForm(): void {
		schemasSelected = [];
		title = '';
		file = null;
		data.errorMessage = null;
		errorsMessage = null;
		successMessage = null;
		isModifyMode = false;
		currentBatchId = null;
	}

	async function fetchBatches(): Promise<void> {
		try {
			const response = await fetch(`${PUBLIC_TOOLS_URL}/batch-importer`);
			if (response.ok) {
				const data = await response.json();
				batches = data.data.map((batch: Batch) => ({
					title: batch.title,
					batch_id: batch.batch_id,
					schemas: batch.schemas
				}));
				isLoggedIn = true;
			} else if (response.status === 401) {
				isLoggedIn = false;
			} else {
				isLoggedIn = true;
				data.errorMessage = 'Failed to fetch batches: ' + response.status;
			}
		} catch (err) {
			data.errorMessage = 'Error fetching batches: ' + (err as Error).message;
		}
	}

	function handleModify(batch: Batch): void {
		title = batch.title;
		schemasSelected = batch.schemas;
		currentBatchId = batch.batch_id;
		isModifyMode = true;
	}
</script>

<div class="container mx-auto flex justify-center items-top">
	<div class="text-center md:flex flex-row grow items-top">
		<!-- BEGIN: List of batches -->
		<div class="md:basis-1/3 px-2 overflow-auto">
			{#if batches.length === 0}
				<div class="card variant-ghost-primary mx-2 my-4 p-4">
					{#if !isDbOnline}
						<p class="font-medium dark:text-white text-left">
							Unable to connect to the database, Unable to load batches
						</p>
					{:else if !isLoggedIn}
						<p class="font-medium dark:text-white text-left">
							Login first if you want to save your batch here, or just create a batch by selecting a
							schema from the list.
						</p>
						<p class="font-medium dark:text-white pt-4">
							<a
								href="https://docs.murmurations.network/guides/create-a-profile.html#_2-hosted-by-our-profile-generator"
								target="_blank"
								class="text-blue-500 dark:text-blue-300">See our documentation for details</a
							>
						</p>
					{:else}
						<p class="font-medium dark:text-white">No saved batches found</p>
					{/if}
				</div>
			{/if}
			{#each batches as batch}
				<div class="card variant-ghost-primary mx-2 my-4 p-4">
					<div class="font-medium break-words">{batch.title}</div>
					<div class="m-4">
						<span class="badge variant-ghost-primary font-bold text-sm mx-4 mt-2 break-words"
							>Batch ID: {batch.batch_id.length > 6
								? `${batch.batch_id.substring(0, 6)}...`
								: batch.batch_id}</span
						>
						<span class="badge font-bold text-sm mx-4 mt-2 break-words whitespace-pre-wrap"
							>Schemas: {batch.schemas.join(', ')}</span
						>
					</div>
					<div class="flex justify-around mt-4 md:mt-8">
						<button
							onclick={() => handleModify(batch)}
							class="btn font-semibold md:btn-lg variant-filled-primary"
							disabled={!!data.errorMessage || !isDbOnline || isLoading}>Modify</button
						>
						<button
							onclick={() => handleDelete(batch.batch_id)}
							class="btn font-semibold md:btn-lg variant-filled-secondary"
							disabled={!!data.errorMessage || !isDbOnline || isLoading}>Delete</button
						>
					</div>
				</div>
			{/each}
		</div>
		<!-- END: List of batches -->
		<!-- BEGIN: Schema selection box and import form -->
		<div class="md:basis-2/3 md:order-first">
			{#if data.errorMessage}
				<div class="variant-filled-error m-4 py-2 px-4 rounded-md">
					<p class="font-medium">{data.errorMessage}</p>
				</div>
			{/if}
			{#if errorsMessage !== null}
				<div class="variant-filled-error py-2 px-4 m-4 rounded-md text-left">
					<p class="font-medium">There were errors in your submission:</p>
					<ul>
						{#each errorsMessage as error}
							<li class="font-medium list-disc list-inside">{error}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if successMessage}
				<div class="variant-filled-success m-4 py-2 px-4 rounded-md">
					<p class="font-medium">{successMessage}</p>
				</div>
			{/if}
			{#if schemasSelected.length === 0}
				<SchemaSelector schemasList={data.schemasList} schemaSelected={handleSchemasSelected} />
			{:else}
				<div class="card variant-ghost-primary m-4 p-4">
					<form onsubmit={handleImportOrModify}>
						<div class="font-medium">
							{isModifyMode ? 'Modify the batch' : 'Import a new batch'}
						</div>
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
							<button
								type="submit"
								class="btn font-semibold md:btn-lg variant-filled-primary"
								disabled={isLoading}>{isModifyMode ? 'Modify' : 'Import'}</button
							>
							<button
								type="button"
								class="btn font-semibold md:btn-lg variant-filled-secondary"
								onclick={resetForm}
								disabled={isLoading}>Reset</button
							>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>

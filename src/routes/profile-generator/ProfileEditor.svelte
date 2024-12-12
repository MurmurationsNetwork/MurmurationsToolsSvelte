<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ParseRef } from '$lib/parser';
	import { onMount } from 'svelte';
	import DynamicForm from './DynamicForm.svelte';
	import { GenerateSchemaInstance } from '$lib/generator';
	import type { Schema } from '$lib/types/Schema';
	import type { ProfileObject } from '$lib/types/ProfileObject';
	import { generateCuid } from '$lib/utils';
	import type { Profile } from '$lib/types/Profile';
	import { get } from 'svelte/store';
	import { isAuthenticatedStore } from '$lib/stores/isAuthenticatedStore';
	import { dbStatus } from '$lib/stores/dbStatus';

	const dispatch = createEventDispatcher();

	export let schemasSelected: string[] = [];

	export let currentProfile: ProfileObject = {};
	export let currentTitle: string = '';
	export let currentCuid: string = '';
	let profilePreview: boolean = false;
	let validationErrors: string[] = [];
	let serviceError: string = '';
	let isSubmitting: boolean = false;

	let top: HTMLDivElement;

	function scrollToTop() {
		top.scrollIntoView();
	}

	function resetSchemas(): void {
		dispatch('schemasReset');
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		// TODO - determine if we really need to prevent the default form submission behavior
		event.preventDefault();
		isSubmitting = true;
		serviceError = '';
		const target = event.target as HTMLFormElement | null;
		if (target) {
			const formData = new FormData(target);
			const formDataObject: Record<string, string | string[]> = {};

			// Find all the fields that have multiple select
			const multipleSelects: Set<string> = new Set();
			const selects = target.querySelectorAll('select[multiple]');
			selects.forEach((select) => {
				const selectElement = select as HTMLSelectElement;
				multipleSelects.add(selectElement.name);
			});

			formData.forEach((value, key) => {
				if (multipleSelects.has(key)) {
					if (!formDataObject[key]) {
						formDataObject[key] = [];
					}
					(formDataObject[key] as string[]).push(value as string);
				} else if (typeof value === 'string') {
					// Only retain string values
					formDataObject[key] = value;
				}
			});

			currentProfile = GenerateSchemaInstance(schemas, formDataObject);

			const response = await fetch('/profile-generator/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(currentProfile)
			});

			const data = await response.json();
			if (response.status === 422) {
				validationErrors = data?.errors?.map(
					(error: { title: string; detail: string; source?: { pointer?: string } }) => {
						const pointer = error.source?.pointer || 'Unknown source';
						return `${error.title}: ${error.detail} (Source: ${pointer})`;
					}
				);
				// Scroll to the top of the page if there are validation errors
				if (validationErrors.length > 0) {
					scrollToTop();
				}
			} else if (response.status !== 200) {
				serviceError =
					typeof data.errors === 'string'
						? data.errors
						: `Unexpected response status: ${response.status}`;
				scrollToTop();
			} else {
				validationErrors = [];
				profilePreview = true;
			}
		}
		isSubmitting = false;
	}

	let schemas: Schema | null = null;

	// Use parseRef to retrieve the schema based on schemasSelected
	onMount(async () => {
		try {
			dispatch('profileEditorErrorOccurred', null);
			schemas = await ParseRef(schemasSelected);
		} catch (error) {
			dispatch('profileEditorErrorOccurred', error);
			resetSchemas();
		}
	});

	async function saveAndPostProfile(event: SubmitEvent) {
		event.preventDefault();
		serviceError = '';

		if (!get(isAuthenticatedStore)) {
			alert('Please log in first.');
			return;
		}

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const title = formData.get('title') as string;

		try {
			const cuid = currentCuid || generateCuid();
			const profileToSave: Profile = {
				cuid,
				linked_schemas: schemasSelected,
				profile: JSON.stringify(currentProfile),
				title,
				ipfs: [],
				last_updated: Date.now(),
				node_id: ''
			};

			const method = currentCuid ? 'PATCH' : 'POST';

			const response = await fetch(`/profile-generator${currentCuid ? `/${cuid}` : ''}`, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(profileToSave)
			});

			if (response.status === 422) {
				const data = await response.json();
				validationErrors = data?.errors.map(
					(error: { source?: { pointer?: string }; title: string; detail: string }) => {
						const pointer = error.source?.pointer || 'Unknown source';
						return `${error.title}: ${error.detail} (Source: ${pointer})`;
					}
				);
				// Scroll to the top of the page if there are validation errors
				if (validationErrors.length > 0) {
					scrollToTop();
				}
				profilePreview = false;
				return;
			}

			if (!response.ok) {
				const errorData = await response.json();
				console.log('errorData', errorData);
				throw errorData.error || 'Error saving profile';
			}

			const result = await response.json();
			if (result.success) {
				console.log('Profile saved successfully!');
			} else {
				throw new Error('Unknown error occurred while saving profile');
			}

			if (currentCuid) {
				const node_id = await postProfileToIndex(cuid);
				console.log('Profile updated to index with node_id:', node_id);
			} else {
				// Update user's profiles list
				const updateResponse = await fetch(`/profile-generator/${cuid}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				if (!updateResponse.ok) {
					const updateErrorData = await updateResponse.json();
					throw new Error(updateErrorData.error || 'Error updating user profiles list');
				}

				const updateResult = await updateResponse.json();
				if (updateResult.success) {
					console.log('User profiles list updated successfully');
				} else {
					throw new Error('Unknown error occurred while updating user profiles list');
				}

				// Post profile URL to index and get node_id
				const node_id = await postProfileToIndex(cuid);

				// Update profile with node_id in MongoDB
				const updateNodeIdResponse = await fetch(`/profile-generator/${cuid}/update-node-id`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ profile_cuid: cuid, node_id })
				});

				if (!updateNodeIdResponse.ok) {
					const updateNodeIdErrorData = await updateNodeIdResponse.json();
					throw new Error(updateNodeIdErrorData.error || 'Error updating node_id');
				}

				const updateNodeIdResult = await updateNodeIdResponse.json();
				if (updateNodeIdResult.success) {
					console.log('Profile updated with node_id successfully');
				} else {
					throw new Error('Unknown error occurred while updating node_id');
				}
			}

			// Reset to initial state
			profilePreview = false;
			dispatch('profileEditorErrorOccurred', null);
			resetSchemas();
		} catch (error) {
			console.error('Error saving and posting profile:', error);
			dispatch('profileEditorErrorOccurred', error);
		}

		dispatch('profileUpdated');
	}

	async function postProfileToIndex(cuid: string): Promise<string> {
		try {
			const response = await fetch(`/profile-generator/index/${cuid}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Error posting profile to index');
			}

			const result = await response.json();
			return result.node_id;
		} catch (error) {
			console.error('Error posting profile to index:', error);
			throw error;
		}
	}

	let isDbOnline: boolean = get(dbStatus);

	// Subscribe to dbStatus changes
	dbStatus.subscribe((value) => {
		isDbOnline = value;
	});
</script>

<div class="md:basis-2/3 md:order-first">
	{#if validationErrors.length > 0}
		<div class="variant-filled-error m-4 py-2 px-4 rounded-md text-left">
			<p class="font-medium">There were errors in your submission:</p>
			<ul class="list-disc list-inside">
				{#each validationErrors as error}
					<li>{error}</li>
				{/each}
			</ul>
		</div>
	{/if}
	<div class="card variant-ghost-primary m-4 p-4" bind:this={top}>
		{#if serviceError != ''}
			<div class="variant-filled-error py-2 px-4 rounded-md">
				{serviceError}
			</div>
		{/if}

		{#if !profilePreview}
			<div class="font-medium mb-4">Editing profile with the following schemas</div>

			{#each schemasSelected as schema}
				<span class="badge variant-ghost-primary font-medium text-sm mx-4 mb-2">{schema}</span>
			{/each}

			<form on:submit|preventDefault={handleSubmit}>
				<div class="m-4 flex flex-col text-left">
					{#if schemas !== null}
						<DynamicForm {schemas} bind:currentProfile />
					{/if}
				</div>
				<div class="flex justify-around mt-0">
					<button
						type="submit"
						class="btn font-semibold md:btn-lg variant-filled-primary"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							Loading...
						{:else}
							Validate
						{/if}
					</button>
					<button
						type="button"
						on:click={resetSchemas}
						class="btn font-semibold md:btn-lg variant-filled-secondary">Reset</button
					>
				</div>
			</form>
		{/if}

		{#if profilePreview}
			<div class="font-medium text-lg mb-4 mx-4 variant-filled-success py-2 px-4 rounded-md">
				The profile is valid
			</div>

			<div class="m-4 bg-primary-300 dark:bg-primary-900 rounded-xl px-4 py-2">
				<pre class="text-sm text-left whitespace-pre-wrap break-all">{JSON.stringify(
						{ linked_schemas: schemasSelected, ...currentProfile },
						null,
						2
					)}</pre>
			</div>
			<div class="flex justify-around mt-4 md:mt-8">
				<button
					on:click={() => (profilePreview = false)}
					class="btn font-semibold md:btn-lg variant-filled-primary">Continue Editing</button
				>
			</div>
			<form on:submit|preventDefault={saveAndPostProfile}>
				<div class="mt-4 md:mt-8">
					<div class="m-4 flex flex-col text-left">
						<label>
							<div class="my-2 dark:text-white">Title:</div>
							<input
								class="w-full dark:bg-gray-700 dark:text-white"
								name="title"
								id="title"
								type="text"
								value={currentTitle}
								required
							/>
						</label>
					</div>
				</div>
				<button class="btn font-semibold md:btn-lg variant-filled-primary" disabled={!isDbOnline}
					>Save & Post</button
				>
			</form>
		{/if}
	</div>
</div>

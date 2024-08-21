<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ParseRef } from '$lib/parser';
	import { onMount } from 'svelte';
	import DynamicForm from './DynamicForm.svelte';
	import { GenerateSchemaInstance } from '$lib/generator';
	import type { Schema } from '$lib/types/schema';
	import type { ProfileObject } from '$lib/types/profile';

	const dispatch = createEventDispatcher();

	export let schemasSelected: string[] = [];

	let currentProfile: ProfileObject = {};
	let profilePreview: boolean = false;

	function resetSchemas(): void {
		currentProfile = {};
		dispatch('schemasReset');
	}

	function handleSubmit(event: SubmitEvent): void {
		// TODO - determine if we really need to prevent the default form submission behavior
		event.preventDefault();
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

			profilePreview = true;
			// TODO - clear the form fields
			// target.reset();
		}
	}

	let schemas: Schema | null = null;

	// Use parseRef to retrieve the schema based on schemasSelected
	onMount(async () => {
		schemas = await ParseRef(schemasSelected);
	});
</script>

<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
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
				<button type="submit" class="btn font-semibold md:btn-lg variant-filled-primary"
					>Validate</button
				>
				<button
					type="button"
					on:click={resetSchemas}
					class="btn font-semibold md:btn-lg variant-filled-secondary">Reset</button
				>
			</div>
		</form>
	{/if}

	{#if profilePreview}
		<div class="font-medium text-lg mb-4 mx-4 variant-filled-success">The profile is valid</div>

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

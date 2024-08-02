<script lang="ts">
	import { onMount } from 'svelte';
	import type { FormData, Schema } from '$lib/types/schema';
	import FormField from './FormField.svelte';

	export let schemas: Schema;

	let formData: FormData = {};

	onMount(() => {
		initializeFormData(schemas);
	});

	// console.log('dynamic form schema: ', schemas)

	function initializeFormData(schema: Schema, prefix = '') {
		Object.entries(schema.properties).forEach(([name, field]) => {
			const key = prefix ? `${prefix}.${name}` : name;
			if (field.type === 'object' && field.properties) {
				formData[key] = {};
				initializeFormData(field as Schema, key);
			} else if (field.type === 'array') {
				formData[key] = [];
			} else {
				formData[key] = '';
			}
		});
	}
</script>

<div class="m-4 flex flex-col text-left">
	{#each Object.entries(schemas.properties) as [name, field]}
		{#if name === 'linked_schemas'}
			<input type="hidden" name="linked_schemas" value={schemas?.metadata?.schema} />
		{:else}
			<FormField {name} {field} />
		{/if}
	{/each}
</div>

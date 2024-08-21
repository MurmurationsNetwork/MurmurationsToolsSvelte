<script lang="ts">
	import type { Schema } from '$lib/types/schema';
	import type { ProfileObject } from '$lib/types/profile';
	import FormField from './FormField.svelte';

	export let schemas: Schema;
	export let currentProfile: ProfileObject;
</script>

<div class="m-4 flex flex-col text-left">
	{#each Object.entries(schemas.properties) as [name, field]}
		{#if name === 'linked_schemas'}
			<input type="hidden" name="linked_schemas" value={schemas?.metadata?.schema} />
		{:else}
			<FormField
				{name}
				fieldName={name}
				{field}
				requiredFields={schemas.required}
				isParentRequired={true}
				currentProfile={currentProfile[name]}
			/>
		{/if}
	{/each}
</div>

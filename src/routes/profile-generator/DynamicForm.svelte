<script lang="ts">
	import type { Schema } from '$lib/types/Schema';
	import type { ProfileObject } from '$lib/types/ProfileObject';
	import FormField from './FormField.svelte';

	interface Props {
		schemas: Schema;
		currentProfile: ProfileObject;
	}

	let { schemas, currentProfile }: Props = $props();
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

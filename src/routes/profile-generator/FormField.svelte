<script lang="ts">
	import type { Field } from '$lib/types/schema';

	export let name: string;
	export let field: Field;
</script>

{#if field.type === 'string'}
	<label for={name}>
		<div class="my-2">{field.title}:</div>
		<input class="w-full" type="text" id={name} name={name} />
	</label>
{:else if field.type === 'number'}
	<label for={name}>
		<div class="my-2">{field.title}:</div>
		<input class="w-full" type="number" id={name} name={name} />
	</label>
{:else if field.type === 'array' && field.items}
	<label for={name}>
		<div class="my-2">{field.title}:</div>
		<input class="w-full" type="text" id={name} name={name} />
	</label>
{:else if field.type === 'object' && field.properties}
	<fieldset>
		<legend>{field.title}</legend>
		{#each Object.entries(field.properties) as [key, value]}
			<svelte:self name={name + '.' + key} field={value} />
		{/each}
	</fieldset>
{/if}

<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Field } from '$lib/types/schema';

	export let name: string;
	export let field: Field;
	export let hideTitle: boolean = false;

	const items = writable<(Field | string | number)[]>([getInitialItem()]);

	function getInitialItem(): Field | string | number {
		if (field.items?.type === 'object') {
			return { type: 'object', properties: {} };
		} else if (field.items?.type === 'string') {
			return '';
		} else {
			return 0;
		}
	}

	function addItem() {
		items.update((currentItems) => {
			const newItem = getInitialItem();
			return [...currentItems, newItem as string | number | Field];
		});
	}

	function removeItem(index: number) {
		items.update((currentItems) => {
			return currentItems.filter((_, i) => i !== index);
		});
	}
</script>

{#if field.type === 'string' && field.enum}
	<label for={name}>
		{#if !hideTitle}
			<div class="my-2 font-bold">{field.title}:</div>
		{/if}
		<select class="w-full" id={name} {name}>
			{#each field.enum as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>
{:else if field.type === 'string'}
	<label for={name}>
		{#if !hideTitle}
			<div class="my-2 font-bold">{field.title}:</div>
		{/if}
		<input class="w-full" type="text" id={name} {name} />
	</label>
{:else if field.type === 'number'}
	<label for={name}>
		{#if !hideTitle}
			<div class="my-2 font-bold">{field.title}:</div>
		{/if}
		<input class="w-full" type="number" id={name} {name} />
	</label>
{:else if field.type === 'array' && field.items}
	<label for={name}>
		<div class="my-2 font-bold">{field.title}</div>
		{#each $items as _, index}
			<div>
				<svelte:self name={`${name}[${index}]`} field={field.items} hideTitle={true} />
				<button
					type="button"
					class="btn font-semibold md:btn-lg variant-filled-secondary"
					on:click={() => removeItem(index)}>Remove</button
				>
			</div>
		{/each}
		<button
			type="button"
			class="btn font-semibold md:btn-lg variant-filled-primary"
			on:click={addItem}>Add</button
		>
	</label>
{:else if field.type === 'object' && field.properties}
	<fieldset>
		{#if !hideTitle}
			<legend class="my-2 font-bold">{field.title}</legend>
		{/if}
		{#each Object.entries(field.properties) as [key, value]}
			<svelte:self name={name + '.' + key} field={value} />
		{/each}
	</fieldset>
{/if}

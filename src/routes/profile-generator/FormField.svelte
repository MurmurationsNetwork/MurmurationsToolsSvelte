<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Field } from '$lib/types/schema';

	export let name: string;
	export let fieldName: string;
	export let field: Field;
	export let hideTitle: boolean = false;
	export let hideDescription: boolean = false;
	export let requiredFields: string[] = [];
	export let isParentArray: boolean = false;

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

	function integrateFieldsToItems(items: Field, name?: string, description?: string): Field {
		return {
			...items,
			title: name,
			description: description
		};
	}
</script>

<div class="my-2">
	{#if field.type === 'string' && field.enum}
		<label for={name}>
			{#if !hideTitle}
				<div class="my-2 font-bold">
					{field.title}:{#if requiredFields.includes(fieldName)}
						<span class="ml-1 text-red-500">*</span>{/if}
				</div>
			{/if}
			<select
				class="w-full"
				id={name}
				{name}
				required={requiredFields.includes(fieldName)}
				multiple={isParentArray}
			>
				{#each field.enum as option, index}
					<option value={option}>{field.enumNames ? field.enumNames[index] : option}</option>
				{/each}
			</select>
			{#if !hideDescription}
				<div class="text-sm text-gray-500">{field.description}</div>
			{/if}
		</label>
	{:else if field.type === 'string'}
		<label for={name}>
			{#if !hideTitle}
				<div class="my-2 font-bold">
					{field.title}:{#if requiredFields.includes(fieldName)}
						<span class="ml-1 text-red-500">*</span>{/if}
				</div>
			{/if}
			<input
				class="w-full"
				type="text"
				id={name}
				{name}
				required={requiredFields.includes(fieldName)}
			/>
			{#if !hideDescription}
				<div class="text-sm text-gray-500">{field.description}</div>
			{/if}
		</label>
	{:else if field.type === 'number'}
		<label for={name}>
			{#if !hideTitle}
				<div class="my-2 font-bold">
					{field.title}:{#if requiredFields.includes(fieldName)}
						<span class="ml-1 text-red-500">*</span>{/if}
				</div>
			{/if}
			<input
				class="w-full"
				type="number"
				id={name}
				{name}
				required={requiredFields.includes(fieldName)}
			/>
			{#if !hideDescription}
				<div class="text-sm text-gray-500">{field.description}</div>
			{/if}
		</label>
	{:else if field.type === 'array' && field.items}
		{#if field.items.type === 'string' && field.items.enum}
			<svelte:self
				{name}
				{fieldName}
				field={integrateFieldsToItems(field.items, field.title, field.description)}
				requiredFields={field.required}
				isParentArray={true}
			/>
		{:else}
			<fieldset class="px-4 py-0 border-4 border-dotted border-gray-500">
				<legend class="my-2 px-1 font-bold">
					{field.title}{#if requiredFields.includes(fieldName)}
						<span class="ml-1 text-red-500">*</span>{/if}
				</legend>
				<div class="text-sm text-gray-500">{field.description}</div>
				{#each $items as _, index}
					<svelte:self
						name={`${name}[${index}]`}
						{fieldName}
						field={field.items}
						hideTitle={true}
						hideDescription={field.items.type !== 'object'}
						requiredFields={field.required}
					/>
					<button
						type="button"
						class="btn font-semibold md:btn-lg variant-filled-secondary mt-2 mb-4"
						on:click={() => removeItem(index)}>Remove</button
					>
				{/each}
				<button
					type="button"
					class="btn font-semibold md:btn-lg variant-filled-primary"
					on:click={addItem}>Add</button
				>
			</fieldset>
		{/if}
	{:else if field.type === 'object' && field.properties}
		<fieldset class="px-4 py-0 border-4 border-dotted border-gray-500">
			{#if !hideTitle}
				<legend class="my-2 px-1 font-bold">{field.title}</legend>
			{/if}
			{#if !hideDescription && field.description}
				<div class="text-sm text-gray-500">{field.description}</div>
			{/if}
			{#each Object.entries(field.properties) as [key, value]}
				<svelte:self
					name={name + '.' + key}
					fieldName={key}
					field={value}
					requiredFields={field.required}
				/>
			{/each}
		</fieldset>
	{/if}
</div>

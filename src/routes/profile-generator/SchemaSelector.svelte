<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let schemasSelected: string[] = [];

	function selectSchemas() {
		dispatch('schemaSelected', schemasSelected);
	}

	export let schemasList: string[];
</script>

<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
	<form on:submit|preventDefault={selectSchemas}>
		<div class="font-medium">Select one or more schemas to create a new profile</div>
		<div class="m-4">
			<select
				bind:value={schemasSelected}
				multiple
				required
				size="6"
				class="select text-sm"
				id="schemaSelector"
			>
				{#each schemasList as schema}
					<option value={schema}>{schema}</option>
				{/each}
			</select>
		</div>
		<div class="flex justify-center mt-4 md:mt-8">
			<button class="btn font-semibold md:btn-lg variant-filled-primary">Select</button>
		</div>
	</form>
</div>

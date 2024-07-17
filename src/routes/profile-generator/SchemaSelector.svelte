<script lang="ts">
	export let schemas: string[] = ['schema1', 'schema2'];
	import { schemasSelected } from '$lib/stores';

	function selectSchemas(): void {
		const schemaSelector = document.getElementById('schemaSelector') as HTMLSelectElement;
		const selectedSchemas = Array.from(schemaSelector?.selectedOptions || []).map(
			(option) => option.value
		);
		schemasSelected.set(selectedSchemas);
	}
</script>

<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
	<form on:submit|preventDefault={selectSchemas}>
		<div class="font-medium">Select one or more schemas to create a new profile</div>
		<div class="m-4">
			<select multiple required size="3" class="select text-sm" id="schemaSelector">
				{#each schemas as schema}
					<option value={schema}>{schema}</option>
				{/each}
			</select>
		</div>
		<div class="flex justify-center mt-4 md:mt-8">
			<button class="btn font-semibold md:btn-lg variant-filled-primary">Select</button>
		</div>
	</form>
</div>

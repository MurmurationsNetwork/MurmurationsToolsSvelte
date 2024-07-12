<script>
	import { schemasSelected } from '$lib/stores';

	function resetSchemas() {
		schemasSelected.set([]);
	}
</script>

<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
	<div class="font-medium mb-4">Editing profile with the following schemas</div>

	{#each $schemasSelected as schema}
		<span class="badge variant-ghost-primary font-medium text-sm mx-4 mb-2">{schema}</span>
	{/each}

	<div class="mt-4">
		<button on:click={resetSchemas} class="btn font-semibold md:btn-lg variant-filled-secondary"
			>Reset</button
		>
	</div>
</div>

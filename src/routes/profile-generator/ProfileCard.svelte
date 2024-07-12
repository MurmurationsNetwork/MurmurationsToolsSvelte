<script lang="ts">
	export let title = 'title';
	export let status = 'status';
	export let last_updated = 'last_updated';
	export let schemas = ['schema1', 'schema2'];

	let statusColor =
		status === 'posted'
			? 'variant-filled-success'
			: status === 'received' || status === 'validated'
				? 'variant-filled-warning'
				: 'variant-filled-error';
</script>

<!-- BEGIN: Profile card -->
<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
	<div class="font-medium">{title}</div>
	<div class="m-4">
		<span class="badge {statusColor} font-bold text-sm mx-4">{status}</span>
		<span class="badge variant-ghost-primary font-bold text-sm mx-4">{last_updated}</span>
	</div>
	<div class="flex justify-center">
		<ul class="list text-xs">
			{#each schemas as schema}
				<li>{schema}</li>
			{/each}
		</ul>
	</div>
	<div class="flex justify-around mt-4 md:mt-8">
		<button class="btn font-semibold md:btn-lg variant-filled-primary">Modify</button>
		<button class="btn font-semibold md:btn-lg variant-filled-secondary">Delete</button>
	</div>
</div>
<!-- END: Profile card -->

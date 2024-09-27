<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let cuid: string;
	export let title: string;
	export let node_id: string;
	export let status: string;
	export let last_updated: string;
	export let schemas: string[];

	let statusColor: string;
	const dispatch = createEventDispatcher();

	switch (status) {
		case 'posted':
			statusColor = 'variant-filled-success';
			break;
		case 'received':
		case 'validated':
			statusColor = 'variant-filled-warning';
			break;
		default:
			statusColor = 'variant-filled-error';
			break;
	}

	function handleDelete() {
		if (confirm('Are you sure you want to delete this profile?')) {
			deleteProfile();
		}
	}

	async function deleteProfile() {
		try {
			// Delete profile
			const response = await fetch(`/profile-generator/${cuid}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();
			if (result.success) {
				console.log('Profile deleted successfully');
			} else {
				console.error('Failed to delete profile:', result.error);
			}

			// Delete index if node_id exists
			if (node_id) {
				const indexResponse = await fetch('/profile-generator/index', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ node_id })
				});

				if (!indexResponse.ok) {
					console.log('Failed to delete index:', (await indexResponse.json()).error);
				}
			}

			dispatch('profileUpdated');
		} catch (error) {
			console.error('Error deleting profile:', error);
		}
	}
</script>

<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
	<div class="font-medium">{title}</div>
	<div class="m-4">
		<span class="badge {statusColor} font-bold text-sm mx-4">{status}</span>
		<span class="badge variant-ghost-primary font-bold text-sm mx-4 mt-2">{last_updated}</span>
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
		<button on:click={handleDelete} class="btn font-semibold md:btn-lg variant-filled-secondary"
			>Delete</button
		>
	</div>
</div>

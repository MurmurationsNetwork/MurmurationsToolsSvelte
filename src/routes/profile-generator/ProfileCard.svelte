<script lang="ts">
	import { QueryClient, QueryClientProvider, createQuery } from '@tanstack/svelte-query';
	import { dbStatus } from '$lib/stores/dbStatus';
	import { get } from 'svelte/store';

	interface Props {
		cuid: string;
		title: string;
		node_id: string;
		status: string;
		last_updated: string;
		schemas: string[];
		profileErrorOccurred: (error: any) => void;
		profileUpdated: () => void;
		profileModify: (cuid: string) => void;
	}

	let {
		cuid,
		title,
		node_id,
		status = $bindable(),
		last_updated,
		schemas,
		profileErrorOccurred,
		profileUpdated,
		profileModify
	}: Props = $props();

	let errorMessage: string = $state('');
	let statusColor: string = $state('variant-filled-success');
	const queryClient = new QueryClient();
	let isDbOnline: boolean = $state(get(dbStatus));

	// Subscribe to dbStatus changes
	dbStatus.subscribe((value) => (isDbOnline = value));

	// Function to fetch status
	async function fetchStatus(): Promise<string> {
		if (!node_id) return 'unknown';
		if (['posted', 'deleted', 'validation_failed', 'post_failed'].includes(status)) {
			return status;
		}

		try {
			const response = await fetch(`/profile-generator/index/${node_id}`);
			const data = await response.json();
			if (response.ok) {
				errorMessage = '';
				profileErrorOccurred(null);
				return data.status ?? 'unknown';
			} else {
				handleFetchError(response, data);
				return 'unknown';
			}
		} catch (error) {
			console.error('Error fetching status:', error);
			return 'unknown';
		}
	}

	// Handle fetch error
	function handleFetchError(response: Response, data: any) {
		if (response.status === 404) {
			return 'Not found';
		}
		console.error('Failed to fetch status:', data.error || response.statusText);
		errorMessage =
			data.error ||
			`Unknown error occurred. HTTP Status: ${response.status}. Please try again in a few minutes.`;
		profileErrorOccurred(errorMessage);
	}

	// Use svelte-query to fetch status
	const statusQuery = createQuery({
		queryKey: ['status', node_id],
		queryFn: fetchStatus,
		refetchInterval: 5000
	});

	$effect(() => {
		status = $statusQuery.data ?? status;
		statusColor = getStatusColor(status);
	});

	// Get status color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'posted':
				return 'variant-filled-success';
			case 'received':
			case 'validated':
				return 'variant-filled-warning';
			default:
				return 'variant-filled-error';
		}
	}

	function handleDelete() {
		if (confirm('Are you sure you want to delete this profile?')) {
			deleteProfile();
		}
	}

	async function deleteProfile() {
		try {
			await performDelete(`/profile-generator/${cuid}`);
			if (node_id) {
				await performDelete(`/profile-generator/index/${node_id}`);
			}
			profileUpdated();
		} catch (error) {
			console.error('Error deleting profile:', error);
		}
	}

	// Perform delete operation
	async function performDelete(url: string) {
		const response = await fetch(url, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await response.json();
		if (!result.success) {
			console.error('Failed to delete:', result.error);
		}
	}

	function handleModify() {
		profileModify(cuid);
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="card variant-ghost-primary mx-2 my-4 p-4">
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
			<button
				onclick={handleModify}
				class="btn font-semibold md:btn-lg variant-filled-primary"
				disabled={!!errorMessage || !isDbOnline}>Modify</button
			>
			<button
				onclick={handleDelete}
				class="btn font-semibold md:btn-lg variant-filled-secondary"
				disabled={!!errorMessage || !isDbOnline}>Delete</button
			>
		</div>
	</div>
</QueryClientProvider>

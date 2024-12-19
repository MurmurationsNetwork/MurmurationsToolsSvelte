<script lang="ts">
	interface Props {
		prop: string;
		currentSortProp: string;
		currentSortOrder: 'asc' | 'desc' | null;
		onSort: (key: string, order: 'asc' | 'desc') => void;
		children?: import('svelte').Snippet;
	}

	let { prop, currentSortProp, currentSortOrder, onSort, children }: Props = $props();

	function handleSort() {
		let newOrder: 'asc' | 'desc' = 'asc';
		if (currentSortProp === prop) {
			newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
		}
		onSort(prop, newOrder);
	}
</script>

<th onclick={handleSort} class="cursor-pointer">
	{@render children?.()}
	{#if currentSortProp === prop}
		{#if currentSortOrder === 'asc'}
			▲
		{:else}
			▼
		{/if}
	{/if}
</th>

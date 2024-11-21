<script lang="ts">
	export let prop: string;
	export let currentSortProp: string;
	export let currentSortOrder: 'asc' | 'desc' | null;
	export let onSort: (key: string, order: 'asc' | 'desc') => void;

	function handleSort() {
		let newOrder: 'asc' | 'desc' = 'asc';
		if (currentSortProp === prop) {
			newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
		}
		onSort(prop, newOrder);
	}
</script>

<th on:click={handleSort} class="cursor-pointer">
	<slot></slot>
	{#if currentSortProp === prop}
		{#if currentSortOrder === 'asc'}
			▲
		{:else}
			▼
		{/if}
	{/if}
</th>

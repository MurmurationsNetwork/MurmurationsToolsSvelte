<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { createEventDispatcher } from 'svelte';

	interface Props {
		links: { self: string };
		meta: { total_pages: number };
		searchParams: { page: string; page_size: string; schema: string };
	}

	let { links, meta, searchParams }: Props = $props();

	const dispatch = createEventDispatcher();

	// Get current link
	let url = links.self;
	// Get current page
	let currentPage = searchParams.page ? parseInt(searchParams.page) : 1;
	// Get total pages
	const pageSize = searchParams.page_size ? parseInt(searchParams.page_size) : 30;
	const maxPageSize = Math.floor(10000 / pageSize);
	let totalPages = meta.total_pages < maxPageSize ? meta.total_pages : maxPageSize;

	// Process URL
	let schema = searchParams.schema === 'all' ? 'schema=all&' : '';
	if (searchParams.schema === 'all' && !url.includes('schema=all')) {
		url = schema + url.substring(url.indexOf('?') + 1);
	} else {
		url = url.substring(url.indexOf('?') + 1);
	}

	const createPageLink = (page: number) => {
		const pageRegex = /page=\d+/;
		return url.replace(pageRegex, `page=${page}`);
	};

	// Determine the pages to display
	let pages: (number | string)[] = [];
	for (let i = 1; i <= totalPages; i++) {
		if (
			i === 1 ||
			i === totalPages ||
			i === currentPage ||
			i === currentPage - 1 ||
			i === currentPage + 1
		) {
			pages.push(i);
		} else if (i === currentPage - 2 || i === currentPage + 2) {
			pages.push('...');
		}
	}

	function handlePageChange(page: number) {
		dispatch('pageChange', page);
	}
</script>

<nav>
	<ul class="inline-flex -space-x-px">
		{#if currentPage > 1}
			<li>
				<a
					href={`/index-explorer?${createPageLink(currentPage - 1)}`}
					class="ml-0 rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
					onclick={preventDefault(() => handlePageChange(currentPage - 1))}
				>
					Previous
				</a>
			</li>
		{/if}
		{#each pages as page}
			<li>
				{#if page === '...'}
					<span
						class="border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
					>
						...
					</span>
				{:else}
					<a
						href={`/index-explorer?${createPageLink(Number(page))}`}
						class="border border-gray-300 px-3 py-2 leading-tight hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white {page ===
						currentPage
							? 'bg-primary-500 text-white'
							: 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400'}"
						onclick={preventDefault(() => handlePageChange(Number(page)))}
					>
						{page}
					</a>
				{/if}
			</li>
		{/each}
		{#if currentPage < totalPages}
			<li>
				<a
					href={`/index-explorer?${createPageLink(currentPage + 1)}`}
					class="rounded-r-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
					onclick={preventDefault(() => handlePageChange(currentPage + 1))}
				>
					Next
				</a>
			</li>
		{/if}
	</ul>
</nav>

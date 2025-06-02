<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { timestampToDatetime } from '$lib/datetime';
	import SortableColumn from './SortableColumn.svelte';
	import Pagination from './Pagination.svelte';
	import { pushState } from '$app/navigation';

	// Fetch the list of schemas and countries
	interface PageData {
		schemasList: string[];
		countries: string[];
		errorMessage: string | null;
		loadSearchParams: URLSearchParams;
	}

	type Node = {
		primary_url: string;
		name: string;
		profile_url: string;
		last_updated: string;
		tags: string[];
		locality: string;
		region: string;
		country: string;
	};

	type Links = {
		first: string;
		prev: string;
		self: string;
		next: string;
		last: string;
	};

	type Meta = {
		message: string;
		number_of_results: number;
		total_pages: number;
	};

	type SearchParamsObj = {
		schema: string;
		name: string;
		tags: string;
		primary_url: string;
		last_updated: string;
		lat: string;
		lon: string;
		range: string;
		locality: string;
		region: string;
		country: string;
		status: string;
		tags_exact: string;
		tags_filter: string;
		page_size: string;
		page: string;
	};

	let { data }: { data: PageData } = $props();

	let error: string | null = $state(null);
	let sortedNodes: Node[] = $state([]);
	let links: Links | null = $state(null);
	let meta: Meta | null = $state(null);
	let page: number = $state(1);
	let pageSize: number = $state(30);
	let searchParamsObj: SearchParamsObj = $state({
		schema: '',
		name: '',
		tags: '',
		primary_url: '',
		last_updated: '',
		lat: '',
		lon: '',
		range: '',
		locality: '',
		region: '',
		country: '',
		status: '',
		tags_filter: 'or',
		tags_exact: 'false',
		page_size: '30',
		page: '1'
	});
	let searchParams: URLSearchParams = $state(data.loadSearchParams);
	let isLoading: boolean = $state(false);
	let tagsFilterChecked: boolean = $state(false);
	let tagsExactChecked: boolean = $state(false);
	let sortProp: string = $state('');
	let sortOrder: 'asc' | 'desc' | null = $state(null);

	onMount(async () => {
		if (searchParams.toString()) {
			await performSearch();
		}
	});

	async function performSearch(): Promise<void> {
		isLoading = true;

		for (const [key] of Object.entries(searchParamsObj)) {
			if (searchParams.has(key) && searchParams.get(key)) {
				if (key === 'last_updated') {
					searchParamsObj[key as keyof SearchParamsObj] = new Date(
						parseInt(searchParams.get(key) as string) * 1000
					)
						.toISOString()
						.slice(0, 16);
				} else {
					searchParamsObj[key as keyof SearchParamsObj] = searchParams.get(key) as string;
				}
			}
		}

		if (!searchParamsObj.schema && searchParams.toString()) {
			error = 'The schema is required';
			isLoading = false;
			return;
		}

		// Set the tags filter and exact checked states
		tagsFilterChecked = searchParamsObj.tags_filter === 'and';
		tagsExactChecked = searchParamsObj.tags_exact === 'true';

		// Clear the error message
		error = null;

		// Set the page and page size
		page = searchParams.has('page') ? parseInt(searchParams.get('page') as string) : 1;
		pageSize = searchParams.has('page_size')
			? parseInt(searchParams.get('page_size') as string)
			: 30;

		// Wait for the route to update, prevent the error at the upcoming pushState
		await tick();

		// Update the URL with the current search parameters
		const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
		pushState(newUrl, '');

		const response = await fetch(`/index-explorer?${searchParams.toString()}`);
		const result = await response.json();
		if (response.ok) {
			sortedNodes = Array.isArray(result.data) ? result.data : [];
			links = result.links;
			meta = result.meta;
		} else {
			error = result?.error ?? 'Error fetching data';
		}
		isLoading = false;
	}

	async function handleSearch(event: Event): Promise<void> {
		event.preventDefault();
		isLoading = true;
		searchParams = new URLSearchParams();

		for (const [key, value] of Object.entries(searchParamsObj)) {
			if (value) {
				if (key === 'last_updated') {
					searchParams.append(key, (new Date(value).valueOf() / 1000).toString());
				} else {
					searchParams.append(key, value.toString());
				}
			} else {
				searchParams.delete(key);
			}
		}

		// If we are performing a new search, set the page to 1
		searchParams.delete('page');
		searchParams.set('page', '1');

		await performSearch();
	}

	function handleSort(key: string, order: 'asc' | 'desc'): void {
		sortProp = key;
		sortOrder = order;

		if (sortProp && sortProp !== 'tags') {
			sortedNodes = [...sortedNodes].sort((a, b) => {
				if (sortProp === 'last_updated') {
					return sortOrder === 'desc'
						? new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
						: new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
				}
				if (
					typeof a[sortProp as keyof Node] === 'string' &&
					typeof b[sortProp as keyof Node] === 'string'
				) {
					return sortOrder === 'desc'
						? (b[sortProp as keyof Node] as string)?.localeCompare(
								a[sortProp as keyof Node] as string
							)
						: (a[sortProp as keyof Node] as string)?.localeCompare(
								b[sortProp as keyof Node] as string
							);
				}
				return 0;
			});
		}
	}

	function handlePageChange(page: number): void {
		searchParams.set('page', page.toString());
		performSearch();
	}
</script>

<div class="mx-auto p-2 md:p-4">
	{#if data.errorMessage || error}
		<div class="variant-filled-error py-2 px-4 mb-2 rounded-md">
			Error: {data.errorMessage || error}
		</div>
	{/if}
	<div class="mb-4 sm:flex sm:items-center">
		<div class="text-gray-900 sm:flex-auto dark:text-gray-50">
			<p>
				{' '}
				<a
					class="text-primary-500"
					target="_blank"
					rel="noreferrer"
					href="https://docs.murmurations.network/guides/view-the-data.html#search-the-index"
				>
					See our documentation
				</a>
				for a description of the input fields below.
			</p>
		</div>
	</div>
	<form onsubmit={handleSearch} class="mb-2">
		<div class="card flex flex-row flex-wrap justify-center gap-2 p-2 md:p-4 variant-ghost-primary">
			<div class="flex flex-row flex-wrap items-center gap-2 justify-center">
				<select
					class="flex-auto rounded dark:bg-gray-800"
					bind:value={searchParamsObj.schema}
					name="schema"
				>
					<option value="">Select a schema</option>
					<option value="all">All schemas</option>
					{#each data.schemasList as schema}
						<option value={schema}>{schema}</option>
					{/each}
				</select>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.name}
					name="name"
					placeholder="name search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.tags}
					name="tags"
					placeholder="tag search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.primary_url}
					name="primary_url"
					placeholder="primary_url search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="datetime-local"
					name="last_updated"
					placeholder="last_updated search"
					bind:value={searchParamsObj.last_updated}
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.lat}
					name="lat"
					placeholder="lat search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.lon}
					name="lon"
					placeholder="lon search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.range}
					name="range"
					placeholder="range search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.locality}
					name="locality"
					placeholder="locality search"
				/>
				<input
					class="flex-auto rounded p-2 dark:bg-gray-800"
					type="text"
					bind:value={searchParamsObj.region}
					name="region"
					placeholder="region search"
				/>
				<select
					class="flex-auto rounded dark:bg-gray-800"
					bind:value={searchParamsObj.country}
					name="country"
				>
					<option value="">Select a Country</option>
					{#each data.countries as country}
						<option value={country} selected={searchParamsObj.country === country}>{country}</option
						>
					{/each}
				</select>
				<select
					class="flex-auto rounded dark:bg-gray-800"
					bind:value={searchParamsObj.status}
					name="status"
				>
					<option value="">Select a Status (default: all)</option>
					<option value="posted" selected={searchParamsObj.status === 'posted'}>posted</option>
					<option value="deleted" selected={searchParamsObj.status === 'deleted'}>deleted</option>
				</select>
				<select
					class="flex-auto rounded dark:bg-gray-800"
					bind:value={searchParamsObj.page_size}
					name="page_size"
				>
					<option value="30" selected={searchParamsObj.page_size === '30'}
						>Select the Page Size (default: 30)</option
					>
					<option value="100" selected={searchParamsObj.page_size === '100'}>100</option>
					<option value="500" selected={searchParamsObj.page_size === '500'}>500</option>
				</select>
				<div class="flex-auto">
					<input
						type="checkbox"
						bind:checked={tagsFilterChecked}
						name="tags_filter"
						class="mr-2"
						onchange={(event) => {
							const target = event.target as HTMLInputElement;
							if (!target) return;
							tagsFilterChecked = target.checked;
							searchParamsObj.tags_filter = tagsFilterChecked ? 'and' : 'or';
						}}
					/>
					all tags
				</div>
				<div class="flex-auto">
					<input
						type="checkbox"
						bind:checked={tagsExactChecked}
						name="tags_exact"
						class="mr-2"
						onchange={(event) => {
							const target = event.target as HTMLInputElement;
							if (!target) return;
							tagsExactChecked = target.checked;
							searchParamsObj.tags_exact = tagsExactChecked ? 'true' : 'false';
						}}
					/>
					exact matches only
				</div>
			</div>
			<button
				class="font-semibold md:btn-lg variant-filled-primary rounded-3xl w-1/2 md:w-1/4 max-w-32 md:max-w-48"
				type="submit"
				disabled={isLoading}
				onclick={() => {
					window.goatcounter.count({
						path: (p) => p + '?search',
						title: 'IE search',
						event: true
					});
				}}
			>
				{#if isLoading}
					Searching...
				{:else}
					Search
				{/if}
			</button>
		</div>
	</form>

	<div class="sm:flex sm:items-center">
		<div class="text-gray-900 sm:flex-auto dark:text-gray-50">
			<p class="text-sm">
				When searching for tags, select <em>all tags</em> so only nodes with all of the tags entered
				are shown. Select{' '}
				<em>exact matches only</em> so that spelling variations are not shown.
			</p>
		</div>
	</div>

	<div class="mt-2 flex flex-col md:mt-4">
		{#if meta?.number_of_results && !isLoading}
			<div class="mb-2 flex-auto">
				Result Count: {page > 1 ? (page - 1) * pageSize + 1 : 1}-
				{page * pageSize > meta.number_of_results ? meta.number_of_results : page * pageSize} / {meta.number_of_results}
			</div>
		{/if}
		<div class="mx-4 my-2 overflow-x-auto text-center sm:-mx-6 lg:-mx-8">
			{#if isLoading}
				<div class="loading-indicator">Loading...</div>
			{:else if sortedNodes.length === 0}
				<div class="text-center">Result not found, try to search again!</div>
			{:else}
				<div>
					<div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div class="variant-ghost-primary overflow-hidden md:rounded-lg">
							<table class="min-w-full">
								<thead class="variant-ghost-primary">
									<tr>
										<SortableColumn
											prop="primary_url"
											currentSortProp={sortProp}
											currentSortOrder={sortOrder}
											onSort={handleSort}
										>
											Primary URL
										</SortableColumn>
										<SortableColumn
											prop="name"
											currentSortProp={sortProp}
											currentSortOrder={sortOrder}
											onSort={handleSort}
										>
											Name
										</SortableColumn>
										<SortableColumn
											prop="profile_url"
											currentSortProp={sortProp}
											currentSortOrder={sortOrder}
											onSort={handleSort}
										>
											Profile URL
										</SortableColumn>
										<SortableColumn
											prop="last_updated"
											currentSortProp={sortProp}
											currentSortOrder={sortOrder}
											onSort={handleSort}
										>
											Last Updated
										</SortableColumn>
										<th>Tags</th>
										{#if searchParamsObj?.locality}
											<SortableColumn
												prop="locality"
												currentSortProp={sortProp}
												currentSortOrder={sortOrder}
												onSort={handleSort}
											>
												Locality
											</SortableColumn>
										{/if}
										{#if searchParamsObj?.region}
											<SortableColumn
												prop="region"
												currentSortProp={sortProp}
												currentSortOrder={sortOrder}
												onSort={handleSort}
											>
												Region
											</SortableColumn>
										{/if}
										{#if searchParamsObj?.country}
											<SortableColumn
												prop="country"
												currentSortProp={sortProp}
												currentSortOrder={sortOrder}
												onSort={handleSort}
											>
												Country
											</SortableColumn>
										{/if}
									</tr>
								</thead>
								<tbody class="">
									{#each sortedNodes as node}
										<tr class="hover:opacity-80">
											<td class="whitespace-normal p-1 text-sm md:p-2">
												<a
													href={`https://${node.primary_url || ''}`}
													target="_blank"
													rel="noreferrer"
													class="font-bold text-primary-500"
												>
													{node.primary_url && node.primary_url.length > 30
														? `${node.primary_url.substring(0, 30)}...`
														: node.primary_url || 'N/A'}
												</a>
											</td>
											<td class="whitespace-normal p-1 text-sm md:p-2">
												{node.name || 'N/A'}
											</td>
											<td class="whitespace-normal p-1 text-sm md:p-2">
												<a
													href={`${node.profile_url || ''}`}
													target="_blank"
													rel="noreferrer"
													class="font-bold text-primary-500"
												>
													{node.profile_url && node.profile_url.length > 65
														? `${node.profile_url.substring(0, 65)}...`
														: node.profile_url || 'N/A'}
												</a>
											</td>
											<td
												class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
											>
												{node.last_updated ? timestampToDatetime(node.last_updated) : 'N/A'}
											</td>
											<td class="p-1 text-sm md:p-2">
												<div class="flex flex-wrap">
													{#if node?.tags?.length}
														{#each node.tags as tag}
															<div
																class="m-1 rounded-lg px-1 md:px-2 md:py-1 variant-ghost-primary"
															>
																{tag}
															</div>
														{/each}
													{:else}
														<div class="m-1 text-gray-500">No Tags</div>
													{/if}
												</div>
											</td>
											{#if searchParamsObj?.locality}
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
												>
													{node.locality || 'N/A'}
												</td>
											{/if}
											{#if searchParamsObj?.region}
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
												>
													{node.region || 'N/A'}
												</td>
											{/if}
											{#if searchParamsObj?.country}
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
												>
													{node.country || 'N/A'}
												</td>
											{/if}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
					<div class="my-4 text-center">
						{#if links && meta && searchParams.has('schema')}
							<Pagination
								{links}
								{meta}
								searchParams={searchParamsObj}
								onPageChange={handlePageChange}
							/>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

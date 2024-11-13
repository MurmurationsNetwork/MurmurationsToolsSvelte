<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { timestampToDatetime } from '$lib/datetime';
	import SortableColumn from './SortableColumn.svelte';
	import Pagination from './Pagination.svelte';
	import { pushState } from '$app/navigation';

	// Fetch the list of schemas and countries
	type Data = {
		schemasList: string[];
		countries: string[];
		errorMessage: string | null;
	};

	export let data: Data;
	$: ({ schemasList, countries, errorMessage } = data);

	let error: string | null = null;

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
		region: string;
		locality: string;
		country: string;
		status: string;
		tags_exact: string;
		tags_filter: string;
		page_size: string;
		page: string;
	};

	let sortedNodes: Node[] = [];
	let links: Links | null = null;
	let meta: Meta | null = null;
	let page: number = 1;
	let pageSize: number = 30;

	let searchParamsObj: SearchParamsObj = {
		schema: '',
		name: '',
		tags: '',
		primary_url: '',
		last_updated: '',
		lat: '',
		lon: '',
		region: '',
		locality: '',
		country: '',
		status: '',
		tags_filter: 'and',
		tags_exact: 'false',
		page_size: '30',
		page: '1'
	};

	let searchParams: URLSearchParams;
	let isLoading: boolean = false;

	let tagsFilterChecked: boolean = false;
	let tagsExactChecked: boolean = false;

	$: searchParamsObj.tags_filter = tagsFilterChecked ? 'or' : 'and';
	$: searchParamsObj.tags_exact = tagsExactChecked ? 'true' : 'false';

	onMount(async () => {
		searchParams = new URLSearchParams(window.location.search);
		await performSearch();
	});

	async function performSearch() {
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

		// Check if schema is empty
		if (!searchParamsObj.schema) {
			error = 'The schema is required';
			isLoading = false;
			return;
		}

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
			sortedNodes = result.data;
			links = result.links;
			meta = result.meta;
		} else {
			error = result?.error ?? 'Error fetching data';
		}

		isLoading = false;
	}

	async function handleSearch(event: Event) {
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

	let sortProp: string = '';
	let sortOrder: 'asc' | 'desc' | null = null;

	function handleSort(key: string, order: 'asc' | 'desc') {
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

	function handlePageChange(event: CustomEvent) {
		page = event.detail;
		searchParams.set('page', page.toString());
		performSearch();
	}
</script>

<div class="mx-auto max-w-6xl py-2">
	<div class="mb-4 sm:flex sm:items-center">
		<div class="text-gray-900 sm:flex-auto dark:text-gray-50">
			<p>
				For a description of the input fields below, please{' '}
				<a
					class="text-red-500 dark:text-purple-200"
					target="_blank"
					rel="noreferrer"
					href="https://docs.murmurations.network/guides/view-the-data.html#search-the-index"
				>
					see our documentation
				</a>
				.
			</p>
		</div>
	</div>
	<form on:submit={handleSearch} class="mb-2">
		<div class="flex flex-row flex-wrap items-center gap-2 bg-gray-50 p-6 dark:bg-gray-600">
			<select
				class="flex-auto rounded dark:bg-gray-700"
				bind:value={searchParamsObj.schema}
				name="schema"
			>
				<option value="">Select a schema</option>
				<option value="all">All schemas</option>
				{#each schemasList as schema}
					<option value={schema}>{schema}</option>
				{/each}
			</select>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="text"
				bind:value={searchParamsObj.name}
				name="name"
				placeholder="name search"
			/>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="text"
				bind:value={searchParamsObj.tags}
				name="tags"
				placeholder="tag search"
			/>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="text"
				bind:value={searchParamsObj.primary_url}
				name="primary_url"
				placeholder="primary_url search"
			/>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="datetime-local"
				name="last_updated"
				placeholder="last_updated search"
				bind:value={searchParamsObj.last_updated}
			/>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="text"
				bind:value={searchParamsObj.lat}
				name="lat"
				placeholder="lat search"
			/>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="text"
				bind:value={searchParamsObj.lon}
				name="lon"
				placeholder="lon search"
			/>
			<input
				class="flex-auto rounded p-2 dark:bg-gray-700"
				type="text"
				bind:value={searchParamsObj.region}
				name="region"
				placeholder="region search"
			/>
			<select
				class="flex-auto rounded dark:bg-gray-700"
				bind:value={searchParamsObj.country}
				name="country"
			>
				<option value="">Select a Country</option>
				{#each countries as country}
					<option value={country} selected={searchParamsObj.country === country}>{country}</option>
				{/each}
			</select>
			<select
				class="flex-auto rounded dark:bg-gray-700"
				bind:value={searchParamsObj.status}
				name="status"
			>
				<option value="">Select a Status (default: all)</option>
				<option value="posted" selected={searchParamsObj.status === 'posted'}>posted</option>
				<option value="deleted" selected={searchParamsObj.status === 'deleted'}>deleted</option>
			</select>
			<select
				class="flex-auto rounded dark:bg-gray-700"
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
				<input type="checkbox" bind:checked={tagsFilterChecked} name="tags_filter" class="mr-2" /> all
				tags
			</div>
			<div class="flex-auto">
				<input type="checkbox" bind:checked={tagsExactChecked} name="tags_exact" class="mr-2" /> exact
				matches only
			</div>
			<button
				class="w-full rounded py-1 font-bold text-white {isLoading
					? 'bg-gray-500'
					: 'bg-red-500 hover:bg-red-400 dark:bg-purple-200 dark:text-gray-800 dark:hover:bg-purple-100'}"
				type="submit"
				disabled={isLoading}
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

	{#if errorMessage || error}
		<div class="text-red-500">Error: {errorMessage || error}</div>
	{:else}
		<div class="mt-2 flex flex-col md:mt-4">
			{#if meta?.number_of_results}
				<div class="mb-2 flex-auto">
					Result Count: {page > 1 ? (page - 1) * pageSize + 1 : 1}-
					{page * pageSize > meta.number_of_results ? meta.number_of_results : page * pageSize} / {meta.number_of_results}
				</div>
			{/if}
			<div class="-mx-4 -my-2 overflow-x-auto text-center sm:-mx-6 lg:-mx-8">
				{#if isLoading}
					<div class="loading-indicator">Loading...</div>
				{:else if sortedNodes.length === 0}
					<div class="text-center">Result not found, try to search again!</div>
				{:else}
					<div>
						<div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
							<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
								<table class="min-w-full divide-y divide-gray-300">
									<thead class="bg-gray-100 dark:bg-gray-500">
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
									<tbody class="divide-y divide-gray-200 bg-gray-50 dark:bg-gray-600">
										{#each sortedNodes as node}
											<tr>
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
												>
													<a
														href={`https://${node.primary_url}`}
														target="_blank"
														rel="noreferrer"
														class="text-yellow-600 no-underline hover:underline dark:text-green-300"
													>
														{node.primary_url?.length > 30
															? `${node.primary_url?.substring(0, 30)}...`
															: node.primary_url}
													</a>
												</td>
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
													>{node.name}</td
												>
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
												>
													<a
														href={`${node.profile_url}`}
														target="_blank"
														rel="noreferrer"
														class="text-yellow-600 no-underline hover:underline dark:text-green-300"
													>
														{node.profile_url?.length > 65
															? `${node.profile_url?.substring(0, 65)}...`
															: node.profile_url}
													</a>
												</td>
												<td
													class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
													>{timestampToDatetime(node.last_updated)}</td
												>
												<td class="p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50">
													<div class="flex flex-wrap">
														{#each node.tags as tag}
															<div
																class="m-1 rounded-lg bg-red-200 px-1 md:px-2 md:py-1 dark:bg-purple-400"
															>
																{tag}
															</div>
														{/each}
													</div>
												</td>
												{#if searchParamsObj?.locality}
													<td
														class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
														>{node.locality}</td
													>
												{/if}
												{#if searchParamsObj?.region}
													<td
														class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
														>{node.region}</td
													>
												{/if}
												{#if searchParamsObj?.country}
													<td
														class="whitespace-normal p-1 text-sm text-gray-900 md:p-2 dark:text-gray-50"
														>{node.country}</td
													>
												{/if}
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
						<div class="my-4 text-center">
							{#if links && meta && searchParams.has('page') && searchParams.has('page_size') && searchParams.has('schema')}
								<Pagination
									{links}
									{meta}
									searchParams={searchParamsObj}
									on:pageChange={handlePageChange}
								/>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

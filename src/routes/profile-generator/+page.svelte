<script lang="ts">
	import { onMount } from 'svelte';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileEditor from './ProfileEditor.svelte';
	import SchemaSelector from './SchemaSelector.svelte';
	import type { Profile } from '$lib/types/Profile';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import type { ProfileObject } from '$lib/types/ProfileObject';

	const queryClient = new QueryClient();

	// Fetch the list of schemas
	type Data = {
		schemasList: string[];
		errorMessage: string | null;
	};

	export let data: Data;
	$: ({ schemasList, errorMessage } = data);

	// Set selected schema in the parent component
	let schemasSelected: string[] = [];
	let isLoggedIn: boolean = false;

	function handleSchemasSelected(event: CustomEvent<string[]>) {
		schemasSelected = event.detail;
	}

	function handleSchemasReset() {
		schemasSelected = [];
		currentProfile = {};
		currentTitle = '';
		currentCuid = '';
	}

	interface ProfileCard {
		cuid: string;
		node_id: string;
		title: string;
		status: 'posted' | 'received' | 'validated' | 'deleted' | 'validation_failed' | 'post_failed';
		last_updated: string; // TODO - change to Unix timestamp (number) and convert into local date string
		schemas: string[];
	}

	function handleProfileUpdated() {
		fetchProfiles();
	}

	async function fetchProfiles() {
		try {
			const response = await fetch('/profile-generator');
			if (response.ok) {
				const data = await response.json();
				profileCards = data.profiles.map((profile: Profile) => ({
					cuid: profile.cuid,
					title: profile.title,
					node_id: profile.node_id,
					status: 'received',
					last_updated: new Date(profile.last_updated).toLocaleString(),
					schemas: profile.linked_schemas
				}));
				isLoggedIn = true;
			} else if (response.status === 401) {
				isLoggedIn = false;
			} else {
				isLoggedIn = true;
				console.error('Failed to fetch profiles:', response.statusText);
			}
		} catch (error) {
			console.error('Error fetching profiles:', error);
		}
	}

	let profileCards: ProfileCard[] = [];
	onMount(fetchProfiles);

	let currentProfile: ProfileObject = {};
	let currentTitle: string = '';
	let currentCuid: string = '';

	async function handleProfileModify(event: CustomEvent<ProfileCard>) {
		const { cuid } = event.detail;

		try {
			const response = await fetch(`/profile-generator/${cuid}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch profile details: ${response.statusText}`);
			}

			const data = await response.json();
			if (!data.success) {
				console.log(data);
				throw new Error('Profile fetch was not successful');
			}

			const profileData = data.profile;

			currentProfile = JSON.parse(profileData.profile);
			schemasSelected = profileData.linked_schemas;
			currentTitle = profileData.title;
			currentCuid = cuid;
		} catch (error) {
			console.error('Error fetching profile details:', error);
		}
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="container mx-auto flex justify-center items-top">
		<div class="text-center md:flex flex-row grow items-top">
			<!-- BEGIN: List of user-generated profiles -->
			<div class="bg-blue-50 dark:bg-gray-800 md:basis-1/3 m-2 px-2">
				{#if profileCards.length === 0}
					<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4 dark:border-gray-600">
						{#if !isLoggedIn}
							<p class="font-medium dark:text-white text-left">
								Login first if you want to save your profile here, or just create a profile by
								selecting a schema from the list.
							</p>
							<p class="font-medium dark:text-white pt-4">
								<a
									href="https://docs.murmurations.network/guides/create-a-profile.html#_2-hosted-by-our-profile-generator"
									target="_blank"
									class="text-blue-500 dark:text-blue-300">See our documentation for details</a
								>
							</p>
						{:else}
							<p class="font-medium dark:text-white">No saved profiles found</p>
						{/if}
					</div>
				{/if}
				{#each profileCards as profileCard}
					<ProfileCard
						cuid={profileCard.cuid}
						title={profileCard.title}
						node_id={profileCard.node_id}
						status={profileCard.status}
						last_updated={profileCard.last_updated}
						schemas={profileCard.schemas}
						on:profileUpdated={handleProfileUpdated}
						on:profileModify={handleProfileModify}
					/>
				{/each}
			</div>
			<!-- END: List of user-generated profiles -->
			<!-- BEGIN: Schema selection box / Create/modify profile input / Profile preview -->
			<div class="md:basis-2/3 md:order-first p-2">
				{#if schemasSelected.length === 0}
					<SchemaSelector {schemasList} {errorMessage} on:schemaSelected={handleSchemasSelected} />
				{:else}
					<ProfileEditor
						{schemasSelected}
						{currentProfile}
						{currentTitle}
						{currentCuid}
						on:schemasReset={handleSchemasReset}
						on:profileUpdated={handleProfileUpdated}
					/>
				{/if}
			</div>
			<!-- END: Schema selection box / Create/modify profile input / Profile preview -->
		</div>
	</div>
</QueryClientProvider>

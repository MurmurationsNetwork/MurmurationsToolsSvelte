<script lang="ts">
	import { onMount } from 'svelte';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileEditor from './ProfileEditor.svelte';
	import SchemaSelector from './SchemaSelector.svelte';
	import type { Profile } from '$lib/types/Profile';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import type { ProfileObject } from '$lib/types/ProfileObject';
	import { dbStatus } from '$lib/stores/dbStatus';
	import { PUBLIC_TOOLS_URL } from '$env/static/public';

	const queryClient = new QueryClient();

	interface PageData {
		schemasList: string[];
		errorMessage: string | null;
	}

	type ProfileCardType = {
		cuid: string;
		node_id: string;
		title: string;
		status: 'posted' | 'received' | 'validated' | 'deleted' | 'validation_failed' | 'post_failed';
		last_updated: string; // TODO - change to Unix timestamp (number) and convert into local date string
		schemas: string[];
	};

	let { data }: { data: PageData } = $props();

	// Set selected schema in the parent component
	let schemasSelected: string[] = $state([]);
	let profileCards: ProfileCardType[] = $state([]);
	let profileErrorMessage: string | null = $state(null);
	let profileEditorErrorMessage: string | null = $state(null);
	let currentProfile: ProfileObject = $state({});
	let currentTitle: string = $state('');
	let currentCuid: string = $state('');
	let isDbOnline = $state(true);
	let isLoggedIn: boolean = $state(true);

	// Subscribe to dbStatus changes
	dbStatus.subscribe((value) => (isDbOnline = value));

	onMount(async () => {
		if (isLoggedIn) {
			await fetchProfiles();
		}
	});

	// Fetch profiles when dbStatus is online and user is logged in
	$effect(() => {
		if (isDbOnline && isLoggedIn) {
			fetchProfiles();
		}
	});

	function handleSchemasSelected(schemas: string[]): void {
		schemasSelected = schemas;
	}

	function handleSchemasReset(): void {
		schemasSelected = [];
		currentProfile = {};
		currentTitle = '';
		currentCuid = '';
	}

	function handleProfileUpdated(): void {
		if (isLoggedIn) {
			fetchProfiles();
		}
	}

	async function fetchProfiles(): Promise<void> {
		try {
			const response = await fetch(`${PUBLIC_TOOLS_URL}/profile-generator`);
			if (response.ok) {
				const responseData = await response.json();
				profileCards = responseData.profiles.map((profile: Profile) => ({
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

	function handleProfileErrorOccurred(error: string | null): void {
		profileErrorMessage = error;
	}

	function handleProfileEditorErrorOccurred(error: string | null): void {
		profileEditorErrorMessage = error;
	}

	async function handleProfileModify(cuid: string): Promise<void> {
		handleSchemasReset();
		try {
			const response = await fetch(`/profile-generator/${cuid}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch profile details: ${response.statusText}`);
			}

			const responseData = await response.json();
			if (!responseData.success) {
				console.log(responseData);
				throw new Error('Profile fetch was not successful');
			}

			const profileData = responseData.profile;

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
			<div class="md:basis-1/3 px-2 overflow-auto">
				{#if profileCards.length === 0}
					<div class="card variant-ghost-primary mx-2 my-4 p-4">
						{#if !isDbOnline}
							<p class="font-medium dark:text-white text-left">
								Unable to connect to the database, Unable to load profiles
							</p>
						{:else if !isLoggedIn}
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
						{...profileCard}
						profileUpdated={handleProfileUpdated}
						profileModify={handleProfileModify}
						profileErrorOccurred={handleProfileErrorOccurred}
					/>
				{/each}
			</div>
			<!-- END: List of user-generated profiles -->
			<!-- BEGIN: Schema selection box / Create/modify profile input / Profile preview -->
			<div class="md:basis-2/3 md:order-first">
				{#if profileErrorMessage || profileEditorErrorMessage}
					<div class="variant-filled-error py-2 px-4 m-4 rounded-md">
						<p class="font-medium">{profileErrorMessage || profileEditorErrorMessage}</p>
					</div>
				{/if}
				{#if data.errorMessage}
					<div class="variant-filled-error py-2 px-4 m-4 rounded-md">
						<p class="font-medium">{data.errorMessage}</p>
					</div>
				{/if}
				{#if schemasSelected.length === 0}
					<SchemaSelector schemasList={data.schemasList} schemaSelected={handleSchemasSelected} />
				{:else}
					<ProfileEditor
						{schemasSelected}
						{currentProfile}
						{currentTitle}
						{currentCuid}
						schemasReset={handleSchemasReset}
						profileUpdated={handleProfileUpdated}
						profileEditorErrorOccurred={handleProfileEditorErrorOccurred}
					/>
				{/if}
			</div>
			<!-- END: Schema selection box / Create/modify profile input / Profile preview -->
		</div>
	</div>
</QueryClientProvider>

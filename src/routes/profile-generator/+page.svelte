<script lang="ts">
	import { onMount } from 'svelte';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileEditor from './ProfileEditor.svelte';
	import SchemaSelector from './SchemaSelector.svelte';

	// Fetch the list of schemas
	type Data = {
		schemasList: string[];
	};

	export let data: Data;
	$: ({ schemasList } = data);

	// Set selected schema in the parent component
	let schemasSelected: string[] = [];

	function handleSchemasSelected(event: CustomEvent<string[]>) {
		schemasSelected = event.detail;
	}

	function handleSchemasReset() {
		schemasSelected = [];
	}

	interface ProfileCard {
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
				profileCards = data.profiles.map((profile: any) => ({
					title: profile.title,
					status: 'received',
					last_updated: new Date(profile.last_updated).toLocaleString(),
					schemas: profile.linked_schemas
				}));
			} else {
				console.error('Failed to fetch profiles:', response.statusText);
			}
		} catch (error) {
			console.error('Error fetching profiles:', error);
		}
	}

	let profileCards: ProfileCard[] = [];
	onMount(fetchProfiles);
</script>

<div class="container mx-auto flex justify-center items-top">
	<div class="text-center md:flex flex-row grow items-top">
		<!-- BEGIN: List of user-generated profiles -->
		<div class="bg-blue-50 md:basis-1/3 m-2 px-2">
			{#if profileCards.length === 0}
				<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4">
					<p class="font-medium">No saved profiles found</p>
					<p class="mt-4 text-left">Login and then select a schema to create and save a profile.</p>
				</div>
			{/if}
			{#each profileCards as profileCard}
				<ProfileCard
					title={profileCard.title}
					status={profileCard.status}
					last_updated={profileCard.last_updated}
					schemas={profileCard.schemas}
				/>
			{/each}
		</div>
		<!-- END: List of user-generated profiles -->
		<!-- BEGIN: Schema selection box / Create/modify profile input / Profile preview -->
		<div class="md:basis-2/3 md:order-first p-2">
			{#if schemasSelected.length === 0}
				<SchemaSelector {schemasList} on:schemaSelected={handleSchemasSelected} />
			{:else}
				<ProfileEditor
					{schemasSelected}
					on:schemasReset={handleSchemasReset}
					on:profileUpdated={handleProfileUpdated}
				/>
			{/if}
		</div>
		<!-- END: Schema selection box / Create/modify profile input / Profile preview -->
	</div>
</div>

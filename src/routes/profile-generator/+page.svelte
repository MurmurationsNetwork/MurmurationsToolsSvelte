<script lang="ts">
	import ProfileCard from './ProfileCard.svelte';
	import ProfileEditor from './ProfileEditor.svelte';
	import SchemaSelector from './SchemaSelector.svelte';
	import { schemasSelected } from '$lib/stores';

	interface ProfileCard {
		title: string;
		status: 'posted' | 'received' | 'validated' | 'deleted' | 'validation_failed' | 'post_failed';
		last_updated: string; // TODO - change to Unix timestamp (number) and convert into local date string
		schemas: string[];
	}

	// TODO - fetch the user profiles data
	let profileCards: ProfileCard[] = [
		{
			title: 'My First Profile',
			status: 'posted',
			last_updated: 'Thu 11 Jul 2024',
			schemas: ['organizations_schema-v1.0.0', 'permaculture_schema-v0.1.0']
		},
		{
			title: 'My Second Profile',
			status: 'received',
			last_updated: 'Fri 12 Jul 2024',
			schemas: ['organizations_schema-v1.0.0']
		}
	];

	type Data = {
		schemasList: string[];
	};

	export let data: Data;
	$: ({ schemasList } = data);
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
			{#if $schemasSelected.length === 0}
				<SchemaSelector {schemasList} />
			{:else}
				<ProfileEditor />
			{/if}
		</div>
		<!-- END: Schema selection box / Create/modify profile input / Profile preview -->
	</div>
</div>

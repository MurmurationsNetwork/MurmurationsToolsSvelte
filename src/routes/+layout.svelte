<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthenticatedStore } from '$lib/stores/isAuthenticatedStore';
	import '../app.postcss';
	import {
		AppRail,
		AppRailAnchor,
		AppShell,
		AppBar,
		autoModeWatcher,
		popup
	} from '@skeletonlabs/skeleton';

	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import xml from 'highlight.js/lib/languages/xml';
	import css from 'highlight.js/lib/languages/css';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';

	hljs.registerLanguage('xml', xml);
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	storeHighlightJs.set(hljs);

	// Icons for AppRail
	import Icon from 'svelte-awesome';
	import fileO from 'svelte-awesome/icons/fileO';
	import copy from 'svelte-awesome/icons/copy';
	import search from 'svelte-awesome/icons/search';
	import edit from 'svelte-awesome/icons/edit';
	import map0 from 'svelte-awesome/icons/mapO';

	// Page store
	import { page } from '$app/stores';

	// Floating UI for popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	// Popup for site environment
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { checkDbStatus } from '$lib/checkDbStatus';
	import { dbStatus } from '$lib/stores/dbStatus';

	const hoverSiteEnv: PopupSettings = {
		event: 'hover',
		target: 'hoverSiteEnv',
		placement: 'bottom'
	};

	export let data;
	if (data?.userData) {
		isAuthenticatedStore.set(true);
	}

	// Logout
	async function logout() {
		try {
			const response = await fetch('/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			if (response.ok) {
				localStorage.removeItem('murmurations_tools_session');
				isAuthenticatedStore.set(false);
				await goto('/login');
			} else {
				const result = await response.json();
				console.error('Failed to logout: ' + result.error);
			}
		} catch (error) {
			console.error('Failed to logout:', error);
		}
	}

	let isOnline = true;

	onMount(() => {
		isOnline = navigator.onLine;

		// Add event listeners for online/offline events
		const updateOnlineStatus = () => (isOnline = navigator.onLine);
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		// Cleanup event listeners on component unmount
		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	});

	let isDbOnline = true;

	$: dbStatus.subscribe((value) => {
		isDbOnline = value;
	});

	onMount(() => {
		checkDbStatus();
	});
</script>

<!-- Sync system light/dark mode -->
<svelte:head>
	<!-- eslint-disable-next-line -->
	{@html '<script>(' + autoModeWatcher.toString() + ')();</script>'}
	<title>Murmurations Tools</title>
</svelte:head>

<AppShell>
	<svelte:fragment slot="header">
		{#if !isOnline}
			<div class="bg-red-500 text-white text-center p-2">
				O F F L I N E -- Check your network connection
			</div>
		{/if}
		{#if !isDbOnline}
			<div class="bg-yellow-200 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center">
				<p>Unable to connect to the database, please try again in a few minutes</p>
			</div>
		{/if}
		<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
			<svelte:fragment slot="lead">
				<a class="text-xl font-bold" href="/" id="site-logo"
					><span class="md:hidden">Tools</span><span class="max-md:hidden">Murmurations Tools</span
					></a
				>
			</svelte:fragment>
			<!-- TODO - link to test/prod based on site third-level domain -->
			<span>
				<span class="md:hidden">Test</span><span class="max-md:hidden">Test Site</span> -
				<a href="https://tools.murmurations.network/" class="underline text-primary-500">
					<span class="md:hidden">Live</span><span class="max-md:hidden">switch to Live</span>
				</a>
				<button class="badge variant-filled-primary" use:popup={hoverSiteEnv}>?</button>
			</span>
			<div class="card p-4 w-72 shadow-xl variant-filled-primary text-sm" data-popup="hoverSiteEnv">
				We offer both test and live sites so you can experiment in our test environment before
				posting data to the live one.
			</div>
			<svelte:fragment slot="trail">
				{#if $isAuthenticatedStore}
					<button
						on:click={logout}
						class="btn btn-sm variant-filled-primary"
						id="logout"
						disabled={!isDbOnline}
					>
						Logout
					</button>
				{:else}
					<a
						class="btn btn-sm variant-filled-primary"
						href="/login"
						id="login"
						aria-disabled={!isDbOnline}
						class:disabled={!isDbOnline}
					>
						Login
					</a>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>

	<svelte:fragment slot="sidebarLeft">
		<AppRail slot="lead">
			<AppRailAnchor
				id="profile-generator"
				href="/profile-generator"
				selected={$page.url.pathname === '/profile-generator'}
			>
				<svelte:fragment>
					<Icon data={fileO} />
					<div class="mt-2">Profile Generator</div>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor
				id="batch-importer"
				href="/batch-importer"
				selected={$page.url.pathname === '/batch-importer'}
			>
				<svelte:fragment>
					<Icon data={copy} />
					<div class="mt-2">Batch Importer</div>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor
				id="index-explorer"
				href="/index-explorer"
				selected={$page.url.pathname === '/index-explorer'}
			>
				<svelte:fragment>
					<Icon data={search} />
					<div class="mt-2">Index Explorer</div>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor
				id="index-updater"
				href="/index-updater"
				selected={$page.url.pathname === '/index-updater'}
			>
				<svelte:fragment>
					<Icon data={edit} />
					<div class="mt-2">Index Updater</div>
				</svelte:fragment>
			</AppRailAnchor>
			<!-- TODO - link to test/prod based on site third-level domain -->
			<AppRailAnchor id="map" href="https://test-map.murmurations.network/" target="_blank">
				<svelte:fragment>
					<Icon data={map0} />
					<div class="mt-2">Map ↗</div>
				</svelte:fragment>
			</AppRailAnchor>
		</AppRail>
	</svelte:fragment>

	<slot />
</AppShell>

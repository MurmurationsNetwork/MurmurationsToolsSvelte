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
	import { page } from '$app/state';

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

	// Define routes that do not require DB status check
	const routesWithoutDbCheck = ['/index-explorer', '/index-updater'];

	let isDbOnline = $state(false);

	// Subscribe to dbStatus only if the route requires it
	if (!routesWithoutDbCheck.includes(page.url.pathname)) {
		dbStatus.subscribe((value) => {
			isDbOnline = value;
		});
	}

	onMount(() => {
		if (!routesWithoutDbCheck.includes(page.url.pathname)) {
			checkDbStatus();
		}
	});

	let isOnline = $state(true);

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

	let { data, children } = $props();
	$effect(() => {
		isAuthenticatedStore.set(data.isAuthenticated);
	});
</script>

<!-- Sync system light/dark mode -->
<svelte:head>
	<!-- eslint-disable-next-line --><!-- svelte-ignore hydration_html_changed -->
	{@html '<script>(' + autoModeWatcher.toString() + ')();</script>'}
	<title>Murmurations Tools</title>
	<script
		data-goatcounter={import.meta.env.PROD
			? 'https://stats-tools.murmurations.network/count'
			: 'https://test-stats-tools.murmurations.network/count'}
		async
		src="//stats.murmurations.network/count.js"
	></script>
</svelte:head>

<AppShell>
	<div slot="header">
		{#if !isOnline}
			<div class="variant-filled-error font-bold text-lg text-center">
				O F F L I N E - Check your network connection
			</div>
		{/if}
		{#if !routesWithoutDbCheck.includes(page.url.pathname) && !isDbOnline}
			<div class="bg-yellow-200 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center">
				<p>Unable to connect to the database, please try again in a few minutes</p>
			</div>
		{/if}
		<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
			<div slot="lead">
				<a class="text-xl font-bold" href="/" id="site-logo"
					><span class="md:hidden">Tools</span><span class="max-md:hidden">Murmurations Tools</span
					></a
				>
			</div>
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
			<div slot="trail">
				{#if $isAuthenticatedStore}
					<button
						onclick={logout}
						class="btn btn-sm variant-filled-primary"
						id="logout"
						disabled={!isDbOnline}
					>
						Logout
					</button>
				{:else}
					<a
						class="btn btn-sm variant-filled-primary {!isDbOnline &&
							'opacity-50 pointer-events-none cursor-not-allowed'}"
						href="/login"
						id="login"
						aria-disabled={!isDbOnline}
						class:disabled={!isDbOnline}
					>
						Login
					</a>
				{/if}
			</div>
		</AppBar>
	</div>

	<div slot="sidebarLeft">
		<AppRail>
			<AppRailAnchor
				id="profile-generator"
				href="/profile-generator"
				selected={page.url.pathname === '/profile-generator'}
			>
				<svelte:fragment>
					<Icon data={fileO} />
					<div class="mt-2">Profile Generator</div>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor
				id="batch-importer"
				href="/batch-importer"
				selected={page.url.pathname === '/batch-importer'}
			>
				<svelte:fragment>
					<Icon data={copy} />
					<div class="mt-2">Batch Importer</div>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor
				id="index-explorer"
				href="/index-explorer"
				selected={page.url.pathname === '/index-explorer'}
			>
				<svelte:fragment>
					<Icon data={search} />
					<div class="mt-2">Index Explorer</div>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor
				id="index-updater"
				href="/index-updater"
				selected={page.url.pathname === '/index-updater'}
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
	</div>

	{@render children()}
</AppShell>

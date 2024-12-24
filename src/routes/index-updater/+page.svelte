<script lang="ts">
	let postProfileUrl = $state('');
	let checkProfileUrl = $state('');
	let deleteProfileUrl = $state('');
	let postResponse = $state('');
	let statusResponse = $state('');
	let deleteResponse = $state('');
	let postResponseOk = $state(true);
	let statusResponseOk = $state(true);
	let deleteResponseOk = $state(true);
	let isSubmittingPost = $state(false);
	let isSubmittingCheck = $state(false);
	let isSubmittingDelete = $state(false);

	async function postProfile(): Promise<void> {
		isSubmittingPost = true;
		const response = await fetch('/index-updater', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ profile_url: postProfileUrl })
		});
		const data = await response.json();
		if (data?.data) {
			postResponseOk = true;
			postResponse = JSON.stringify(data?.data);
		} else {
			postResponse = JSON.stringify(data);
			postResponseOk = false;
		}
		isSubmittingPost = false;
	}

	async function checkProfileStatus() {
		isSubmittingCheck = true;
		const response = await fetch(`/index-updater?url=${checkProfileUrl}`);
		const data = await response.json();
		if (data?.data) {
			statusResponse = JSON.stringify(data?.data);
			statusResponseOk = true;
		} else {
			statusResponse = JSON.stringify(data);
			statusResponseOk = false;
		}
		isSubmittingCheck = false;
	}

	async function deleteProfile() {
		isSubmittingDelete = true;
		const response = await fetch('/index-updater', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ profile_url: deleteProfileUrl })
		});
		const data = await response.json();
		deleteResponseOk = response.ok;
		deleteResponse = JSON.stringify(data);
		isSubmittingDelete = false;
	}
</script>

<div class="container mx-auto justify-center items-center flex">
	<div class="card variant-ghost-primary m-4 p-6 w-3/4 md:w-1/2">
		<h1 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
			Index Updater
		</h1>
		<div class="mb-6">
			<h2 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
				Add/Update Profile in Index
			</h2>
			<p class="text-gray-700 dark:text-gray-300 mb-4">
				Post your profile to your website then add your profile, and always update the Index every
				time you change it to enable data aggregators to learn about your recent changes.
			</p>
			<div class="flex flex-col md:flex-row">
				<input
					type="text"
					placeholder="https://your.site/directory/profile.json"
					class="w-full bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mr-2 md:mr-4 mb-2 md:mb-0"
					bind:value={postProfileUrl}
				/>
				<button
					class="btn font-semibold md:btn-lg variant-filled-primary rounded-3xl w-1/3"
					onclick={postProfile}
					disabled={isSubmittingPost}
				>
					{isSubmittingPost ? 'Posting...' : 'Post'}
				</button>
			</div>
			{#if postResponse}
				<div
					class="my-2 overflow-auto rounded-xl p-2 text-sm md:my-4 md:p-4 {postResponseOk
						? 'bg-green-200 dark:bg-green-700'
						: 'bg-red-200 dark:bg-red-700'}"
				>
					<pre class="text-gray-900 dark:text-gray-100">{JSON.stringify(
							JSON.parse(postResponse),
							null,
							2
						)}</pre>
				</div>
			{/if}
		</div>

		<div class="mb-6">
			<h2 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
				Check Profile Status in Index
			</h2>
			<p class="text-gray-700 dark:text-gray-300 mb-4">
				Get status and other information about your profile from the Index.
			</p>
			<div class="flex flex-col md:flex-row">
				<input
					type="text"
					placeholder="https://your.site/directory/profile.json"
					class="w-full bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mr-2 md:mr-4 mb-2 md:mb-0"
					bind:value={checkProfileUrl}
				/>
				<button
					class="btn font-semibold md:btn-lg variant-filled-primary rounded-3xl w-1/3"
					onclick={checkProfileStatus}
					disabled={isSubmittingCheck}
				>
					{isSubmittingCheck ? 'Checking...' : 'Check'}
				</button>
			</div>
			{#if statusResponse}
				<div
					class="my-2 overflow-auto rounded-xl p-2 text-sm md:my-4 md:p-4 {statusResponseOk
						? 'bg-green-200 dark:bg-green-700'
						: 'bg-red-200 dark:bg-red-700'}"
				>
					<pre class="text-gray-900 dark:text-gray-100">{JSON.stringify(
							JSON.parse(statusResponse),
							null,
							2
						)}</pre>
				</div>
			{/if}
		</div>

		<div>
			<h2 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
				Delete Profile from Index
			</h2>
			<p class="text-gray-700 dark:text-gray-300 mb-4">
				Remove your profile from your website first (it should return a <code>404 Not Found</code> status
				code) and then submit it here to delete it from the Index.
			</p>
			<div class="flex flex-col md:flex-row">
				<input
					type="text"
					placeholder="https://your.site/directory/profile.json"
					class="w-full bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mr-2 md:mr-4 mb-2 md:mb-0"
					bind:value={deleteProfileUrl}
				/>
				<button
					class="btn font-semibold md:btn-lg variant-filled-primary rounded-3xl w-1/3"
					onclick={deleteProfile}
					disabled={isSubmittingDelete}
				>
					{isSubmittingDelete ? 'Deleting...' : 'Delete'}
				</button>
			</div>
			{#if deleteResponse}
				<div
					class="my-2 overflow-auto rounded-xl p-2 text-sm md:my-4 md:p-4 {deleteResponseOk
						? 'bg-green-200 dark:bg-green-700'
						: 'bg-red-200 dark:bg-red-700'}"
				>
					<pre class="text-gray-900 dark:text-gray-100">{JSON.stringify(
							JSON.parse(deleteResponse),
							null,
							2
						)}</pre>
				</div>
			{/if}
		</div>
	</div>
</div>

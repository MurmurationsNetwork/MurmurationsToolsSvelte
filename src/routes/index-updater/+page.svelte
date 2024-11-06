<script lang="ts">
	let postProfileUrl = '';
	let checkProfileUrl = '';
	let deleteProfileUrl = '';
	let postResponse = '';
	let statusResponse = '';
	let deleteResponse = '';
	let postResponseOk = true;
	let statusResponseOk = true;
	let deleteResponseOk = true;
	let isSubmittingPost = false;
	let isSubmittingCheck = false;
	let isSubmittingDelete = false;

	async function postProfile() {
		isSubmittingPost = true;
		const response = await fetch('/index-updater', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ profile_url: postProfileUrl })
		});
		const data = await response.json();
		postResponseOk = response.ok;
		if (data?.data) {
			postResponse = JSON.stringify(data?.data);
		} else {
			postResponse = JSON.stringify(data);
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

<div class="container mx-auto p-6">
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
		<div class="flex">
			<input
				type="text"
				placeholder="https://your.site/directory/profile.json"
				class="flex-grow p-2 border rounded-l-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
				bind:value={postProfileUrl}
			/>
			<button
				class="bg-red-500 text-white px-4 py-2 rounded-r-md hover:bg-red-600 disabled:bg-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:disabled:bg-red-500"
				on:click={postProfile}
				disabled={isSubmittingPost}
			>
				{isSubmittingPost ? 'Submitting...' : 'Post Profile'}
			</button>
		</div>
		{#if postResponse}
			<div
				class="my-2 overflow-auto rounded-xl p-2 text-sm md:my-4 md:p-4 {postResponseOk
					? 'bg-green-100 dark:bg-green-700'
					: 'bg-red-100 dark:bg-red-700'}"
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
		<div class="flex">
			<input
				type="text"
				placeholder="https://your.site/directory/profile.json"
				class="flex-grow p-2 border rounded-l-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
				bind:value={checkProfileUrl}
			/>
			<button
				class="bg-red-500 text-white px-4 py-2 rounded-r-md hover:bg-red-600 disabled:bg-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:disabled:bg-red-500"
				on:click={checkProfileStatus}
				disabled={isSubmittingCheck}
			>
				{isSubmittingCheck ? 'Submitting...' : 'Check Status'}
			</button>
		</div>
		{#if statusResponse}
			<div
				class="my-2 overflow-auto rounded-xl p-2 text-sm md:my-4 md:p-4 {statusResponseOk
					? 'bg-green-100 dark:bg-green-700'
					: 'bg-red-100 dark:bg-red-700'}"
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
		<div class="flex">
			<input
				type="text"
				placeholder="https://your.site/directory/profile.json"
				class="flex-grow p-2 border rounded-l-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
				bind:value={deleteProfileUrl}
			/>
			<button
				class="bg-red-500 text-white px-4 py-2 rounded-r-md hover:bg-red-600 disabled:bg-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:disabled:bg-red-500"
				on:click={deleteProfile}
				disabled={isSubmittingDelete}
			>
				{isSubmittingDelete ? 'Submitting...' : 'Delete Profile'}
			</button>
		</div>
		{#if deleteResponse}
			<div
				class="my-2 overflow-auto rounded-xl p-2 text-sm md:my-4 md:p-4 {deleteResponseOk
					? 'bg-green-100 dark:bg-green-700'
					: 'bg-red-100 dark:bg-red-700'}"
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

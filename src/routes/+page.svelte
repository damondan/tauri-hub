<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';

	interface TauriApp {
		id: string;
		name: string;
		description: string;
		path: string;
		executable: string;
		icon?: string;
		status: 'Running' | 'Stopped' | 'Error';
	}

	let apps: TauriApp[] = [];
	let loading = false;
	let showAddDialog = false;
	let newApp = {
		id: '',
		name: '',
		description: '',
		path: '',
		executable: '',
		icon: ''
	};

	async function loadApps() {
		loading = true;
		try {
			apps = await invoke<TauriApp[]>('get_registered_apps');
		} catch (error) {
			console.error('Failed to load apps:', error);
		} finally {
			loading = false;
		}
	}

	async function launchApp(appId: string) {
		try {
			await invoke('launch_app', { appId });
			await loadApps(); // Refresh to get updated status
		} catch (error) {
			console.error('Failed to launch app:', error);
			alert('Failed to launch app: ' + error);
		}
	}

	async function stopApp(appId: string) {
		try {
			await invoke('stop_app', { appId });
			await loadApps(); // Refresh to get updated status
		} catch (error) {
			console.error('Failed to stop app:', error);
			alert('Failed to stop app: ' + error);
		}
	}

	async function addApp() {
		if (!newApp.name || !newApp.path || !newApp.executable) {
			alert('Please fill in all required fields');
			return;
		}

		newApp.id = Date.now().toString(); // Simple ID generation
		
		try {
			const appToAdd = {
				...newApp,
				status: 'Stopped' as const
			};
			await invoke('register_app', { app: appToAdd });
			showAddDialog = false;
			newApp = { id: '', name: '', description: '', path: '', executable: '', icon: '' };
			await loadApps();
		} catch (error) {
			console.error('Failed to add app:', error);
			alert('Failed to add app: ' + error);
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'Running': return 'bg-green-100 text-green-800';
			case 'Stopped': return 'bg-red-100 text-red-800';
			case 'Error': return 'bg-yellow-100 text-yellow-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'Running': return '🟢';
			case 'Stopped': return '🔴';
			case 'Error': return '🟡';
			default: return '⚪';
		}
	}

	onMount(() => {
		loadApps();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-white mb-4 drop-shadow-lg">
				🚀 Tauri Hub
			</h1>
			<p class="text-xl text-white/90 drop-shadow">
				Your Desktop Application Management Center
			</p>
		</div>

		<!-- Apps Grid -->
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
			</div>
		{:else if apps.length === 0}
			<div class="text-center py-20">
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto">
					<h3 class="text-2xl font-semibold text-white mb-4">No applications registered yet</h3>
					<p class="text-white/80 mb-6">Add your first Tauri application to get started</p>
					<button 
						on:click={() => showAddDialog = true}
						class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
					>
						➕ Add Application
					</button>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				{#each apps as app (app.id)}
					<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
						<div class="flex items-start justify-between mb-4">
							<div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
								{app.icon || '📱'}
							</div>
							<span class="px-3 py-1 rounded-full text-xs font-medium {getStatusColor(app.status)}">
								{getStatusIcon(app.status)} {app.status}
							</span>
						</div>

						<h3 class="text-xl font-semibold text-white mb-2">{app.name}</h3>
						<p class="text-white/80 text-sm mb-4">{app.description}</p>
						<p class="text-white/60 text-xs mb-4">📁 {app.path}</p>

						<div class="flex gap-2">
							{#if app.status === 'Running'}
								<button 
									on:click={() => stopApp(app.id)}
									class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
								>
									⏹️ Stop
								</button>
							{:else}
								<button 
									on:click={() => launchApp(app.id)}
									class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
								>
									▶️ Launch
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Controls -->
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
			<h2 class="text-2xl font-semibold text-white mb-6">Hub Controls</h2>
			<div class="flex flex-wrap gap-4">
				<button 
					on:click={loadApps}
					class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
				>
					🔄 Refresh Apps
				</button>
				<button 
					on:click={() => showAddDialog = true}
					class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
				>
					➕ Add Application
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Add App Dialog -->
{#if showAddDialog}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-2xl p-8 w-full max-w-md">
			<h3 class="text-2xl font-bold mb-6">Add New Application</h3>
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
					<input 
						bind:value={newApp.name}
						type="text" 
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="My Tauri App"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
					<textarea 
						bind:value={newApp.description}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						rows="3"
						placeholder="Description of your application"
					></textarea>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Path *</label>
					<input 
						bind:value={newApp.path}
						type="text" 
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="/path/to/app/directory"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Executable *</label>
					<input 
						bind:value={newApp.executable}
						type="text" 
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="./target/release/my-app"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Icon (emoji)</label>
					<input 
						bind:value={newApp.icon}
						type="text" 
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="📱"
					/>
				</div>
			</div>

			<div class="flex gap-4 mt-8">
				<button 
					on:click={() => showAddDialog = false}
					class="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button 
					on:click={addApp}
					class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
				>
					Add App
				</button>
			</div>
		</div>
	</div>
{/if}

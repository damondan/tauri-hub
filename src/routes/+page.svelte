<script lang="ts">
	import { onMount } from "svelte";
	import { invoke } from "@tauri-apps/api/core";

	interface TauriApp {
		id: string;
		name: string;
		description: string;
		path: string;
		executable: string;
		icon?: string;
		status: "Running" | "Stopped" | "Error";
	}

	type RecordingStatus = "Idle" | "Recording" | "Paused" | "Processing";

	let apps: TauriApp[] = [];
	let loading = false;
	let showAddDialog = false;
	let recordingStatus: RecordingStatus = "Idle";
	let transcribedText = "";
	let ossecRunning = false;
	let alertsLogModified = false;
	let ossecNotificationsEnabled = true;
	let showOssecTooltip = false;
	let ossecTooltipTimeout: number | null = null;
	let showAideTooltip = false;
	let aideTooltipTimeout: number | null = null;
	let showAideUpdateTooltip = false;
	let aideUpdateTooltipTimeout: number | null = null;
	let aideLastCheckDate: string = "";
	let opensnitchRunning = false;
	let contextMenu: { show: boolean; x: number; y: number; appId: string } = {
		show: false,
		x: 0,
		y: 0,
		appId: "",
	};
	let newApp = {
		id: "",
		name: "",
		description: "",
		path: "",
		executable: "",
		icon: "",
	};

	async function loadApps() {
		loading = true;
		try {
			apps = await invoke<TauriApp[]>("get_registered_apps");
		} catch (error) {
			console.error("Failed to load apps:", error);
		} finally {
			loading = false;
		}
	}

	async function launchApp(appId: string) {
		try {
			await invoke("launch_app", { appId });
			await loadApps(); // Refresh to get updated status
		} catch (error) {
			console.error("Failed to launch app:", error);
			alert("Failed to launch app: " + error);
		}
	}

	async function stopApp(appId: string) {
		try {
			await invoke("stop_app", { appId });
			await loadApps(); // Refresh to get updated status
		} catch (error) {
			console.error("Failed to stop app:", error);
			alert("Failed to stop app: " + error);
		}
	}

	async function addApp() {
		if (!newApp.name || !newApp.path || !newApp.executable) {
			alert("Please fill in all required fields");
			return;
		}

		newApp.id = Date.now().toString(); // Simple ID generation

		try {
			const appToAdd = {
				...newApp,
				status: "Stopped" as const,
			};
			await invoke("register_app", { app: appToAdd });
			showAddDialog = false;
			newApp = {
				id: "",
				name: "",
				description: "",
				path: "",
				executable: "",
				icon: "",
			};
			await loadApps();
		} catch (error) {
			console.error("Failed to add app:", error);
			alert("Failed to add app: " + error);
		}
	}

	function showContextMenu(event: MouseEvent, appId: string) {
		event.preventDefault();
		contextMenu = {
			show: true,
			x: event.clientX,
			y: event.clientY,
			appId,
		};
	}

	function hideContextMenu() {
		contextMenu.show = false;
	}

	async function removeApp(appId: string) {
		try {
			await invoke("remove_app", { appId });
			hideContextMenu();
			await loadApps();
		} catch (error) {
			console.error("Failed to remove app:", error);
			alert("Failed to remove app: " + error);
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case "Running":
				return "bg-green-100 text-green-800";
			case "Stopped":
				return "bg-red-100 text-red-800";
			case "Error":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case "Running":
				return "🟢";
			case "Stopped":
				return "🔴";
			case "Error":
				return "🟡";
			default:
				return "⚪";
		}
	}

	// Speech-to-text functions
	async function startRecording() {
		try {
			await invoke("start_recording");
			recordingStatus = "Recording";
			transcribedText = "";
		} catch (error) {
			console.error("Failed to start recording:", error);
			alert("Failed to start recording: " + error);
		}
	}

	async function pauseRecording() {
		try {
			await invoke("pause_recording");
			recordingStatus = "Paused";
		} catch (error) {
			console.error("Failed to pause recording:", error);
			alert("Failed to pause recording: " + error);
		}
	}

	async function resumeRecording() {
		try {
			await invoke("resume_recording");
			recordingStatus = "Recording";
		} catch (error) {
			console.error("Failed to resume recording:", error);
			alert("Failed to resume recording: " + error);
		}
	}

	async function stopRecordingAndTranscribe() {
		try {
			recordingStatus = "Processing";
			const text = await invoke<string>("stop_recording_and_transcribe");
			transcribedText = text;
			recordingStatus = "Idle";
		} catch (error) {
			console.error("Failed to stop and transcribe:", error);
			alert("Failed to transcribe: " + error);
			recordingStatus = "Idle";
		}
	}

	function handlePlayPause() {
		console.log("in handlePlayPause");
		if (recordingStatus === "Idle") {
			startRecording();
		} else if (recordingStatus === "Recording") {
			pauseRecording();
		} else if (recordingStatus === "Paused") {
			resumeRecording();
		}
	}

	// OSSEC functions
	async function checkOssecStatus() {
		try {
			ossecRunning = await invoke<boolean>("check_ossec_status");
		} catch (error) {
			console.error("Failed to check OSSEC status:", error);
		}
	}

	async function checkAlertsLogModified() {
		try {
			alertsLogModified = await invoke<boolean>("check_alerts_log_modified");
		} catch (error) {
			console.error("Failed to check alerts log:", error);
		}
	}

	async function toggleOssec() {
		try {
			await invoke("toggle_ossec", { start: !ossecRunning });
			await checkOssecStatus();
		} catch (error) {
			console.error("Failed to toggle OSSEC:", error);
			alert("Failed to toggle OSSEC: " + error);
		}
	}

	async function openAlertsLog() {
		try {
			await invoke("open_file_in_terminal", {
				filePath: "/var/ossec/logs/alerts/alerts.log",
			});
			// Reset the baseline after opening
			await invoke("reset_alerts_log_baseline");
			alertsLogModified = false;
		} catch (error) {
			console.error("Failed to open alerts log:", error);
			alert("Failed to open alerts log: " + error);
		}
	}

	async function openOssecConfig() {
		try {
			await invoke("open_file_in_terminal", {
				filePath: "/var/ossec/etc/ossec.conf",
			});
		} catch (error) {
			console.error("Failed to open OSSEC config:", error);
			alert("Failed to open OSSEC config: " + error);
		}
	}

	function handleOssecTooltipEnter() {
		ossecTooltipTimeout = window.setTimeout(() => {
			showOssecTooltip = true;
		}, 1000);
	}

	function handleOssecTooltipLeave() {
		if (ossecTooltipTimeout) {
			clearTimeout(ossecTooltipTimeout);
			ossecTooltipTimeout = null;
		}
		showOssecTooltip = false;
	}

	async function checkOssecNotificationsEnabled() {
		try {
			ossecNotificationsEnabled = await invoke<boolean>("get_ossec_notifications_enabled");
		} catch (error) {
			console.error("Failed to check OSSEC notifications:", error);
		}
	}

	async function toggleOssecNotifications() {
		try {
			const newState = !ossecNotificationsEnabled;
			await invoke("toggle_ossec_notifications", { enabled: newState });
			ossecNotificationsEnabled = newState;
		} catch (error) {
			console.error("Failed to toggle OSSEC notifications:", error);
			alert("Failed to toggle notifications: " + error);
		}
	}

	// AIDE functions
	async function openAideLog() {
		try {
			await invoke("open_file_in_terminal", {
				filePath: "/var/log/aide/aide.log",
			});
		} catch (error) {
			console.error("Failed to open AIDE log:", error);
			alert("Failed to open AIDE log: " + error);
		}
	}

	async function runAideCheck() {
		try {
			const result = await invoke<string>("aide_check");
			console.log("AIDE check result:", result);
			// Update last check date
			const now = new Date();
			aideLastCheckDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
			localStorage.setItem("aideLastCheckDate", aideLastCheckDate);
			alert("AIDE check completed. Check console for details.");
		} catch (error) {
			console.error("Failed to run AIDE check:", error);
			alert("Failed to run AIDE check: " + error);
		}
	}

	async function runAideUpdate() {
		try {
			const result = await invoke<string>("aide_update");
			alert(result);
		} catch (error) {
			console.error("Failed to update AIDE database:", error);
			alert("Failed to update AIDE database: " + error);
		}
	}

	function handleAideTooltipEnter() {
		aideTooltipTimeout = window.setTimeout(() => {
			showAideTooltip = true;
		}, 1000);
	}

	function handleAideTooltipLeave() {
		if (aideTooltipTimeout) {
			clearTimeout(aideTooltipTimeout);
			aideTooltipTimeout = null;
		}
		showAideTooltip = false;
	}

	function handleAideUpdateTooltipEnter() {
		aideUpdateTooltipTimeout = window.setTimeout(() => {
			showAideUpdateTooltip = true;
		}, 1000);
	}

	function handleAideUpdateTooltipLeave() {
		if (aideUpdateTooltipTimeout) {
			clearTimeout(aideUpdateTooltipTimeout);
			aideUpdateTooltipTimeout = null;
		}
		showAideUpdateTooltip = false;
	}

	// OpenSnitch functions
	async function checkOpenSnitchStatus() {
		try {
			opensnitchRunning = await invoke<boolean>("check_opensnitch_status");
		} catch (error) {
			console.error("Failed to check OpenSnitch status:", error);
		}
	}

	async function toggleOpenSnitch() {
		try {
			await invoke("toggle_opensnitch", { start: !opensnitchRunning });
			await checkOpenSnitchStatus();
		} catch (error) {
			console.error("Failed to toggle OpenSnitch:", error);
			alert("Failed to toggle OpenSnitch: " + error);
		}
	}

	// Keyboard shortcuts handler
	function handleKeydown(e: KeyboardEvent) {
		// Ignore modifier keys by themselves
		if (
			e.key === "Control" ||
			e.key === "Shift" ||
			e.key === "Alt" ||
			e.key === "Meta"
		) {
			return;
		}

		console.log("Key:", e.key, "Alt:", e.altKey);

		if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
			if (e.key === "3") {
				e.preventDefault();
				console.log("Alt+3 detected! Starting handlePlayPause");
				handlePlayPause();
			} else if (e.key === "4") {
				e.preventDefault();
				console.log("Alt+4 detected! Status:", recordingStatus);
				if (
					recordingStatus !== "Idle" &&
					recordingStatus !== "Processing"
				) {
					stopRecordingAndTranscribe();
				}
			}
		}
	}

	onMount(() => {
		loadApps();
		checkOssecStatus();
		checkAlertsLogModified();
		checkOssecNotificationsEnabled();
		checkOpenSnitchStatus();
		// Load AIDE last check date from localStorage
		const savedDate = localStorage.getItem("aideLastCheckDate");
		if (savedDate) {
			aideLastCheckDate = savedDate;
		}
		// Hide context menu on click anywhere
		document.addEventListener("click", hideContextMenu);
		return () => {
			document.removeEventListener("click", hideContextMenu);
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-black">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<!-- <div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-white mb-4 drop-shadow-lg">
				🚀 Tauri Hu
			</h1>
		</div> -->

		<!-- Apps Grid -->
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div
					class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"
				></div>
			</div>
		{:else if apps.length === 0}
			<div class="text-center py-20">
				<div
					class="bg-white/10 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto"
				>
					<h3 class="text-2xl font-semibold text-white mb-4">
						No applications registered yet
					</h3>
					<p class="text-white/80 mb-6">
						Add your first Tauri application to get started
					</p>
					<button
						on:click={() => (showAddDialog = true)}
						class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
					>
						➕ Add Application
					</button>
				</div>
			</div>
		{:else}
			<div class="flex flex-wrap gap-6">
				{#each apps as app (app.id)}
					<div
						class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 w-64 h-64 flex flex-col"
						on:contextmenu={(e) => showContextMenu(e, app.id)}
					>
						<div class="flex items-start justify-between mb-4">
							<h3 class="text-xl font-semibold text-white">
								{app.name}
							</h3>
							<span
								class="px-3 py-1 rounded-full text-xs font-medium {getStatusColor(
									app.status,
								)} whitespace-nowrap ml-2"
							>
								{getStatusIcon(app.status)}
								{app.status}
							</span>
						</div>

						<!-- <p class="text-white/80 text-sm mb-4">{app.description}</p> -->
						<p class="text-white/60 text-xs mb-auto">
							📁 {app.path}
						</p>

						<div class="flex gap-2" style="margin-top: 10px;">
							{#if app.status === "Running"}
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

			<!-- Controls -->
			<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
				<!-- <h2 class="text-2xl font-semibold text-white mb-6">
					Hub Controls
				</h2> -->
				<div class="flex flex-wrap gap-4 items-stretch">
					<button
						on:click={loadApps}
						class="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-lg font-semibold transition-colors flex items-center gap-2 h-[72px]"
					>
						🔄 RefApps
					</button>
					<button
						on:click={() => (showAddDialog = true)}
						class="bg-green-500 hover:bg-green-600 text-white px-6 rounded-lg font-semibold transition-colors flex items-center gap-2 h-[72px]"
					>
						➕ AddApps
					</button>
					<!-- Speech to Text Controls -->
					<div
						class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 w-64 h-[72px]"
					>
						<div class="flex items-center gap-2">
							<!-- Microphone Icon -->
							<div class="text-white text-2xl">🎤</div>

							<!-- Play/Pause Button -->
							<button
								on:click={handlePlayPause}
								disabled={recordingStatus === "Processing"}
								class="w-12 h-12 rounded-lg font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
								class:bg-green-500={recordingStatus ===
									"Recording"}
								class:hover:bg-green-600={recordingStatus ===
									"Recording"}
								class:bg-yellow-500={recordingStatus ===
									"Paused"}
								class:hover:bg-yellow-600={recordingStatus ===
									"Paused"}
								class:bg-gray-700={recordingStatus === "Idle"}
								class:hover:bg-gray-600={recordingStatus ===
									"Idle"}
								class:text-white={true}
							>
								{#if recordingStatus === "Recording"}
									⏸️
								{:else if recordingStatus === "Processing"}
									⏳
								{:else}
									▶️
								{/if}
							</button>

							<!-- Stop Button -->
							<button
								on:click={stopRecordingAndTranscribe}
								disabled={recordingStatus === "Idle" ||
									recordingStatus === "Processing"}
								class="w-12 h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
							>
								⏹️
							</button>

							<!-- Status Text -->
							<div class="ml-2 flex-1">
								<p class="text-white font-semibold text-sm">
									{#if recordingStatus === "Recording"}
										Recording...
									{:else if recordingStatus === "Paused"}
										Paused
									{:else if recordingStatus === "Processing"}
										Processing...
									{:else}
										Ready
									{/if}
								</p>
								{#if transcribedText}
									<p class="text-green-300 text-xs mt-0.5">
										✓ Copied
									</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- OSSEC Controls -->
					<div
						class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 w-80 h-[72px]"
					>
						<div class="text-white text-center font-semibold text-xs mb-1">
							OSSEC
						</div>
						<div class="flex items-center gap-2 justify-center">
							<!-- Toggle OSSEC Button (1st) -->
							<button
								on:click={toggleOssec}
								class="px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center {ossecRunning
									? 'bg-green-500 hover:bg-green-600'
									: 'bg-red-500 hover:bg-red-600'} text-white w-16 h-10"
							>
								{ossecRunning ? "On" : "Off"}
							</button>

							<!-- Notification Toggle Button (2nd) -->
							<button
								on:click={toggleOssecNotifications}
								class="px-2 py-1 rounded-lg font-semibold text-xl transition-colors flex items-center justify-center {ossecNotificationsEnabled
									? 'bg-purple-500 hover:bg-purple-600'
									: 'bg-gray-600 hover:bg-gray-700'} text-white w-12 h-10"
								title={ossecNotificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
							>
								{ossecNotificationsEnabled ? '🔔' : '🔕'}
							</button>

							<!-- View Logs Button (3rd) -->
							<button
								on:click={openAlertsLog}
								class="px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center {alertsLogModified
									? 'bg-blue-500 hover:bg-blue-600'
									: 'bg-green-500 hover:bg-green-600'} text-white w-16 h-10"
							>
								<span class="text-center leading-tight">View Logs</span>
							</button>

							<!-- View Config Button with Tooltip -->
							<div class="relative group">
								<button
									on:click={openOssecConfig}
									on:mouseenter={handleOssecTooltipEnter}
									on:mouseleave={handleOssecTooltipLeave}
									class="bg-white hover:bg-gray-100 text-black px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center w-16 h-10"
								>
									<span class="text-center leading-tight">View Config</span>
								</button>

								<!-- Tooltip -->
								{#if showOssecTooltip}
									<div
										class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-3 w-80 z-50 shadow-xl"
									>
										<div class="font-bold mb-2">OSSEC HIDS</div>
										<div class="space-y-1 text-left">
											<p>
												<strong>Weekly:</strong> Review
												/var/ossec/logs/alerts/alerts.log
											</p>
											<p>
												<strong>Start:</strong>
												/var/ossec/bin/ossec-control start
											</p>
											<p>
												<strong>Stop:</strong>
												/var/ossec/bin/ossec-control stop
											</p>
											<p>
												<strong>Config:</strong> /var/ossec/etc/ossec.conf
											</p>
										</div>
										<!-- Tooltip arrow -->
										<div
											class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"
										></div>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- AIDE Controls -->
					<div
						class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 w-64 h-[72px]"
					>
						<div class="text-white text-center font-semibold text-xs mb-1">
							AIDE{#if aideLastCheckDate} - {aideLastCheckDate}{/if}
						</div>
						<div class="flex items-center gap-2 justify-center">
							<!-- View Log Button with Tooltip -->
							<div class="relative group">
								<button
									on:click={openAideLog}
									on:mouseenter={handleAideTooltipEnter}
									on:mouseleave={handleAideTooltipLeave}
									class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center w-16 h-10"
								>
									<span class="text-center leading-tight">View Log</span>
								</button>

								<!-- Tooltip -->
								{#if showAideTooltip}
									<div
										class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-3 w-96 z-50 shadow-xl"
									>
										<div class="font-bold mb-2">AIDE</div>
										<div class="space-y-1 text-left">
											<p class="font-semibold">
												BEFORE DOING PACMAN SYSTEM UPDATE:
											</p>
											<p>
												Check if AIDE has problem files through
												/var/log/aide.log
											</p>
											<p class="mt-2">
												When doing --check, if changes are harmless,
												update database:
											</p>
											<p class="font-mono text-xxs">
												sudo aide --update
											</p>
											<p class="font-mono text-xxs">
												sudo mv /var/lib/aide/aide.db.new.gz
												/var/lib/aide/aide.db.gz
											</p>
										</div>
										<!-- Tooltip arrow -->
										<div
											class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"
										></div>
									</div>
								{/if}
							</div>

							<!-- Check Button -->
							<button
								on:click={runAideCheck}
								class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center w-16 h-10"
							>
								<span class="text-center leading-tight">Check</span>
							</button>

							<!-- Update Button -->
							<div class="relative group">
								<button
									on:click={runAideUpdate}
									on:mouseenter={handleAideUpdateTooltipEnter}
									on:mouseleave={handleAideUpdateTooltipLeave}
									class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center w-16 h-10"
								>
									<span class="text-center leading-tight">Update</span>
								</button>

								<!-- Warning Tooltip -->
								{#if showAideUpdateTooltip}
									<div
										class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-900 text-white text-xs rounded-lg p-3 w-64 z-50 shadow-xl"
									>
										<div class="font-bold text-center">
											⚠️ WARNING ⚠️
										</div>
										<p class="text-center mt-1">
											Only Update after possible security threats
											have been mitigated
										</p>
										<!-- Tooltip arrow -->
										<div
											class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-900"
										></div>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- OpenSnitch Controls -->
					<div
						class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 w-64 h-[72px]"
					>
						<div class="text-white text-center font-semibold text-xs mb-1">
							OpSni
						</div>
						<div class="flex items-center gap-2 justify-center">
							<!-- Toggle OpenSnitch Button -->
							<button
								on:click={toggleOpenSnitch}
								class="px-2 py-1 rounded-lg font-semibold text-md transition-colors flex items-center justify-center {opensnitchRunning
									? 'bg-green-500 hover:bg-green-600'
									: 'bg-red-500 hover:bg-red-600'} text-white w-16 h-10"
							>
								{opensnitchRunning ? "On" : "Off"}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Add App Dialog -->
{#if showAddDialog}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
	>
		<div class="bg-white rounded-2xl p-8 w-full max-w-md">
			<h3 class="text-2xl font-bold mb-6">Add New Application</h3>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2"
						>Name *</label
					>
					<input
						bind:value={newApp.name}
						type="text"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="My Tauri App"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2"
						>Description</label
					>
					<textarea
						bind:value={newApp.description}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						rows="3"
						placeholder="Description of your application"
					></textarea>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2"
						>Path *</label
					>
					<input
						bind:value={newApp.path}
						type="text"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="/path/to/app/directory"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2"
						>Executable *</label
					>
					<input
						bind:value={newApp.executable}
						type="text"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="./target/release/my-app"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2"
						>Icon (emoji)</label
					>
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
					on:click={() => (showAddDialog = false)}
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

<!-- Context Menu -->
{#if contextMenu.show}
	<div
		class="fixed bg-white rounded-lg shadow-xl py-2 z-50 min-w-[150px]"
		style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
	>
		<button
			on:click={() => removeApp(contextMenu.appId)}
			class="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 font-medium transition-colors flex items-center gap-2"
		>
			🗑️ Remove App
		</button>
	</div>
{/if}

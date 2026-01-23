<!-- src/lib/components/ProjectsComponent.svelte -->
<script lang="ts">
  import { projectsData, deleteProject, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks } from '$lib/stores/general';

  function toggleProject(projectName: string) {
    projectExpandedProjects.update(state => ({ ...state, [projectName]: !state[projectName] }));
  }

  function toggleSubproject(key: string) {
    projectExpandedSubprojects.update(state => ({ ...state, [key]: !state[key] }));
  }

  function toggleTask(key: string) {
    projectExpandedTasks.update(state => ({ ...state, [key]: !state[key] }));
  }

  function formatDate(isoString: string): string {
    return isoString.split('T')[0];
  }

  function formatDateTime(isoString: string | undefined): string {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
</script>

<!-- Header -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">Projects</h1>
</div>

<!-- Empty state -->
{#if Object.keys($projectsData).length === 0}
  <div class="text-white/70 italic">No projects yet. Send a Todo from the To Do tab to create your first project.</div>
{/if}

<!-- Projects list -->
{#each Object.values($projectsData) as project (project.name)}
  <div class="mb-3">
    <!-- Level 1: Project -->
    <div 
      class="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/15"
      on:click={() => toggleProject(project.name)}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
        <span class="text-white text-3xl w-6">{$projectExpandedProjects[project.name] ? '▼' : '▶'}</span>
          <span class="text-white text-3xl font-semibold">{project.name}</span>
        </div>
        <button 
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg"
          on:click|stopPropagation={() => deleteProject(project.name)}
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Level 2: Subprojects (only show when project expanded) -->
    {#if $projectExpandedProjects[project.name]}
      <div class="ml-12 mt-2 space-y-2">
        {#each Object.values(project.subprojects) as subproject (subproject.name)}
          {@const subKey = `${project.name}-${subproject.name}`}
          <div 
            class="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/15"
            on:click={() => toggleSubproject(subKey)}
          >
            <div class="flex items-center gap-3">
              <span class="text-white text-3xl w-6">{$projectExpandedSubprojects[subKey] ? '▼' : '▶'}</span>
              <span class="text-white text-3xl">{subproject.name}</span>
            </div>
          </div>

          <!-- Level 3: Tasks (only show when subproject expanded) -->
          {#if $projectExpandedSubprojects[subKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each subproject.tasks as task (task.id)}
                {@const taskKey = `${project.name}-${subproject.name}-${task.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div 
                    class="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded p-2 -m-2"
                    on:click={() => toggleTask(taskKey)}
                  >
                    <span class="text-white text-3xl w-6">{$projectExpandedTasks[taskKey] ? '▼' : '▶'}</span>
                    <span class="text-white text-3xl">{task.description} {formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
                  </div>

                  <!-- Todo Rows (only show when task expanded) -->
                  {#if $projectExpandedTasks[taskKey]}
                    <div class="mt-3 space-y-2">
                      {#each task.rows as row (row.id)}
                        <div class="border rounded-lg p-2 flex items-start gap-3 {row.completed ? 'border-green-500' : 'border-red-500'}">
                          <!-- Completion indicator -->
                          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center {row.completed ? 'border-green-500' : 'border-red-500'}">
                            {#if row.completed}
                              ✅
                            {:else}
                              <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                            {/if}
                          </div>

                          <!-- Row text -->
                          <div class="flex-1 text-white text-3xl leading-tight break-words whitespace-normal">
                            {row.text}
                          </div>
                          
                          <!-- Timestamps -->
                          <div class="text-white/70 text-2xl whitespace-nowrap">
                            Start: {formatDateTime(row.startTime)} | Finish: {formatDateTime(row.finishTime)}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/each}

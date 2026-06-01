<script lang="ts">
  import { buttonStyles } from "$lib/styles";
  import { autoResize } from "$lib/utils/textareaResize";
  import { appPersState } from "$lib/stores/state.svelte";
  import {
    persGoalHighlights,
    updateTopHighlight,
    addHighlightItem,
    addSubHighlight,
    addDetailHighlight,
    removeHighlight,
    removeSubHighlight,
    removeDetailHighlight,
    updateSubHighlight,
    updateDetailHighlight,
  } from "$lib/stores/persgoal";
  // let { showTop } = $props();

  let selectedGoalId: string | null = null;

  function toggleExpand(dayId: string) {
    const currentState = appPersState.expandedRowsTexArea[dayId] ?? false;

    appPersState.expandedRowsTexArea = {
      ...appPersState.expandedRowsTexArea,
      [dayId]: !currentState,
    };

    console.log(
      `ID: ${dayId} is now:`,
      appPersState.expandedRowsTexArea[dayId],
    );
  }

  function togglesublevel(id: string) {
    appPersState.expandedRows[id] = !appPersState.expandedRows[id];
  }

  function togglethirdlevel(childid: string) {
    appPersState.expandedRows[childid] = !appPersState.expandedRows[childid];
  }
</script>

<div class="m-0 p-0">
  <button
    class="bg-white/10 text-white/30 m-0 p-0
          hover:bg-black/70 hover:text-white/80
          float-left rounded text-md w-6 h-full
          border border-white/30"
    onclick={() => addHighlightItem()}
  >
    +
  </button>
</div>

<!-- Top level -->
{#each Object.entries($persGoalHighlights) as [id, levelOne] (id)}
  <div class="w-full flex flex-col gap-0 mb-5 pb-5 font-mono">
    <div class="flex">
      <button
        class="bg-white/5 text-white/10
      hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => addSubHighlight(id)}
      >
        +
      </button>

      <button
        class="text-white/20 text-3xl w-6"
        onclick={() => togglesublevel(id)}
      >
        {appPersState.expandedRows[id] ? "▼" : "▷"}
      </button>

      <textarea
        class="w-full flex-1 rounded-2xl px-8 pb-5 pt-6 ml-3 mr-3 bg-indigo-400/20 text-indigo-200/50 text-4xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:shadow-[0_0_20px_rgba(165,180,252,0.35)]"
        placeholder="Domains ? => Principles ... Questions ... Dialog ... Vocabulary ..."
        rows="1"
        value={levelOne.text || ""}
        oninput={(e) => {
          updateTopHighlight(id, (e.target as HTMLTextAreaElement).value);
        }}
      />

      <button
        class="bg-white/5 text-white/10
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => removeHighlight(id)}
      >
        -
      </button>
    </div>

    <!-- Middle level: only render when this top row is expanded -->
    {#if appPersState.expandedRows[id] && levelOne.children && Object.keys(levelOne.children).length > 0}
      {#each Object.entries(levelOne.children ?? {}) as [childid, levelTwo] (childid)}
        <div class="px-6 flex flex-col w-full gap-3 mt-4">
          <div class="flex flex-row gap-2">
            <button
              class="bg-white/5 text-white/10
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
              onclick={() => addDetailHighlight(id, childid)}
            >
              +
            </button>

            <button
              onclick={() => toggleExpand(childid)}
              class="mt-1 w-6 h-6 mt-5 rounded-lg border border-white/20 bg-white/5
               hover:bg-white/20 hover:text-white/70 text-white/20 font-mono text-xs transition-colors"
              title="Toggle Expand"
            >
              {appPersState.expandedRowsTexArea[childid] ? "S" : "E"}
            </button>

            <button
              class="text-white/20 text-3xl w-6"
              onclick={() => togglethirdlevel(childid)}
            >
              {appPersState.expandedRows[childid] ? "▼" : "▷"}
            </button>

            <textarea
              class="flex-1 pb-3 pt-3 mb-2 bg-sky-400/20 rounded-2xl px-3 py-1 text-sky-200/70 text-3xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-sky-300/80"
              use:autoResize={[
                levelTwo.text,
                appPersState.expandedRowsTexArea[childid],
              ]}
              rows="1"
              value={levelTwo.text}
              oninput={async (e) => {
                updateSubHighlight(
                  id,
                  childid,
                  (e.target as HTMLTextAreaElement).value,
                );
              }}
            />

            <button
              class="bg-white/5 text-white/10
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
              onclick={() => removeSubHighlight(id, childid)}
            >
              -
            </button>
          </div>

          <!-- Lower level: only render when this middle row is expanded -->
          {#if appPersState.expandedRows[childid] && levelTwo.children && Object.keys(levelTwo.children).length > 0}
            {#each Object.entries(levelTwo.children ?? {}) as [detailid, levelThree] (detailid)}
              <div class="ml-15 flex items-center px-16 w-[95%] mt-0">
                <button
                  onclick={() => toggleExpand(detailid)}
                  class="mt-0 mr-2 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                  title="Toggle Expand"
                >
                  {appPersState.expandedRowsTexArea[detailid] ? "S" : "E"}
                </button>

                <textarea
                  class="flex-1 pb-2 pt-2 mb-4 bg-amber-400/10 rounded-2xl px-3 py-1 text-amber-100/60 text-2xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-amber-300/80"
                  use:autoResize={[
                    levelThree.text,
                    appPersState.expandedRowsTexArea[detailid],
                  ]}
                  value={levelThree.text}
                  rows="1"
                  oninput={(e) => {
                    updateDetailHighlight(
                      id,
                      childid,
                      detailid,
                      (e.target as HTMLTextAreaElement).value,
                    );
                  }}
                />

                <button
                  class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6 ml-2 mr-25"
                  onclick={() => removeDetailHighlight(id, childid, detailid)}
                >
                  -
                </button>
              </div>
            {/each}
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/each}

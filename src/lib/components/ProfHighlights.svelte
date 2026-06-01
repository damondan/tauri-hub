<script lang="ts">
  import { buttonStyles } from "$lib/styles";
  import { autoResize } from "$lib/utils/textareaResize";
  import { appProfState } from "$lib/stores/state.svelte";

  import {
    profGoalHighlights,
    addHighlightItem,
    updateTopHighlight,
    addSubHighlight,
    addDetailHighlight,
    removeHighlight,
    removeSubHighlight,
    removeDetailHighlight,
    updateSubHighlight,
    updateDetailHighlight,
    updateDetailHighlightPattern,
  } from "$lib/stores/profgoal";
  import PatternComponent from "./PatternComponent.svelte";

  let editingDay = $state<{
    eid: string;
    echildid: string;
    edetailid: string;
    etext: string;
  } | null>(null);

  function toggleExpand(dayId: string) {
    const currentState = appProfState.expandedRowsTexArea[dayId] ?? false;

    appProfState.expandedRowsTexArea = {
      ...appProfState.expandedRowsTexArea,
      [dayId]: !currentState,
    };

    console.log(
      `ID: ${dayId} is now:`,
      appProfState.expandedRowsTexArea[dayId],
    );
  }

  function togglesublevel(id: string) {
    appProfState.expandedRowsProf[id] = !appProfState.expandedRowsProf[id];
  }

  function togglethirdlevel(childid: string) {
    appProfState.expandedRowsProf[childid] =
      !appProfState.expandedRowsProf[childid];
  }

  function addPattern(id: string, childid: string, detailid: string) {}
</script>

<div class="m-0 p-0">
  <button
    class="domainsAddButton bg-white/20 hover:bg-white/40 text-white/50
    hover:text-white px-3 py-1 rounded-lg transition-colors float-left"
    onclick={() => addHighlightItem()}
  >
    +
  </button>
</div>

<!-- Top level -->
{#each Object.entries($profGoalHighlights) as [id, levelOne] (id)}
  <div class="w-full flex flex-col gap-0 mb-5 pb-5 font-mono">
    <div class="flex">
      <button
        class="bg-white/5 text-white/10
      hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => {
          addSubHighlight(id);
          appProfState.expandedRowsProf[id] = true;
        }}
      >
        +
      </button>

      <button
        class="text-white/20 text-3xl w-6"
        onclick={() => togglesublevel(id)}
      >
        {appProfState.expandedRowsProf[id] ? "▼" : "▷"}
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
    {#if appProfState.expandedRowsProf[id] && levelOne.children && Object.keys(levelOne.children).length > 0}
      {#each Object.entries(levelOne.children ?? {}) as [childid, levelTwo] (childid)}
        <div class="px-6 flex flex-col w-full gap-3 mt-4">
          <div class="flex flex-row gap-2">
            <button
              class="bg-white/5 text-white/10
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
              onclick={() => {
                addDetailHighlight(id, childid);
                appProfState.expandedRowsProf[childid] = true;
              }}
            >
              +
            </button>

            <button
              onclick={() => toggleExpand(childid)}
              class="mt-1 w-6 h-6 mt-5 rounded-lg border border-white/20 bg-white/5
               hover:bg-white/20 hover:text-white/70 text-white/20 font-mono text-xs transition-colors"
              title="Toggle Expand"
            >
              {appProfState.expandedRowsTexArea[childid] ? "S" : "E"}
            </button>

            <button
              class="text-white/20 text-3xl w-6"
              onclick={() => togglethirdlevel(childid)}
            >
              {appProfState.expandedRowsProf[childid] ? "▼" : "▷"}
            </button>

            <textarea
              class="flex-1 pb-3 pt-3 mb-2 bg-sky-400/20 rounded-2xl px-3 py-1 text-sky-200/70 text-3xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-sky-300/80"
              use:autoResize={[
                levelTwo.text,
                appProfState.expandedRowsTexArea[childid],
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

            <button
              class="bg-white/3 text-white/10
  hover:bg-black/70 hover:text-white/80 float-left rounded text-xl w-auto pl-2 pr-2 h-10 ml-2 mt-3"
              onclick={() => updateDetailHighlightPattern(id, childid)}
            >
              Pattern
            </button>
          </div>

          <!-- Lower level: only render when this middle row is expanded -->
          {#if appProfState.expandedRowsProf[childid] && levelTwo.children && Object.keys(levelTwo.children).length > 0}
            {#each Object.entries(levelTwo.children ?? {}) as [detailid, levelThree] (detailid)}
              <div class="ml-15 flex items-center px-16 w-[95%] mt-0">
                <button
                  onclick={() => toggleExpand(detailid)}
                  class="mt-0 mr-2 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                  title="Toggle Expand"
                >
                  {appProfState.expandedRowsTexArea[detailid] ? "S" : "E"}
                </button>

                <textarea
                  class="flex-1 pb-2 pt-2 mb-4 bg-amber-400/10 rounded-2xl px-3 py-1 text-amber-100/60 text-2xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-amber-300/80"
                  use:autoResize={[
                    levelThree.text,
                    appProfState.expandedRowsTexArea[detailid],
                  ]}
                  ondblclick={() => {
                    editingDay = {
                      eid: id,
                      echildid: childid,
                      edetailid: detailid,
                      etext: levelThree.text || "",
                    };
                  }}
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
            {#if appProfState.expandedRowsProf[childid] && Object.keys(levelTwo.patterns ?? {}).length !== 0}
              <PatternComponent {id} {childid} {levelTwo} />
            {/if}
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/each}

{#if editingDay}
  <div class="fixed inset-0 z-[100] flex items-center justify-center">
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-md"
      onclick={() => (editingDay = null)}
    ></div>

    <div
      class="relative w-[95vw] md:w-[90vw] lg:w-[85vw] h-[80vh] bg-[#1a1a1a] border border-white/20 rounded-3xl flex flex-col shadow-2xl"
    >
      <div
        class="p-4 border-b border-white/10 flex justify-between items-center text-white/50 font-mono"
      >
        <span>EDITOR</span>
        <span class="text-xs">Through Perseverance We Conquer</span>
      </div>

      <textarea
        class="flex-1 bg-transparent p-4 text-white text-2xl font-mono outline-none resize-none overflow-y-auto"
        style="padding-top: 5vh; padding-bottom: 5vh;"
        bind:value={editingDay.etext}
        autofocus
      ></textarea>

      <div class="p-6 border-t border-white/10 flex">
        <div class="flex mr-4">
          <button
            onclick={() => {
              const current = editingDay;
              if (!current) return;
              updateDetailHighlight(
                current.eid,
                current.echildid,
                current.edetailid,
                current.etext,
              );

              // saveUserEncryptionData();
              editingDay = null;
            }}
            class="border hover:border-white bg-black/50 text-white/30 hover:text-white px-3 py-1 rounded-lg transition-colors"
          >
            Save
          </button>

          <button
            onclick={() => {
              editingDay = null;
            }}
            class="border hover:border-white bg-black/50 text-white/30 hover:text-white px-3 py-1 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

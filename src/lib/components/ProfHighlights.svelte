<script lang="ts">
  import { borderNTextNBg, buttonStyles } from "$lib/styles";
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
<!--Top level-->
{#each Object.entries($profGoalHighlights) as [id, levelOne]}
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
        {appProfState.expandedRowsProf[id] ? "▼" : "▷"}
      </button>
      <textarea
        class="w-full flex-1 rounded-2xl px-8 pb-5 pt-6 ml-3 mr-3 bg-purple-500/20 text-purple-600/50 text-4xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)]"
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

    <!--Middle Level-->
    {#if levelOne.children && Object.keys(levelOne.children).length > 0}
      {#each Object.entries(levelOne.children ?? {}) as [childid, levelTwo]}
        <div
          class="{appProfState.expandedRowsProf[id]
            ? 'px-6 flex flex-col w-full gap-3 mt-4'
            : borderNTextNBg.collapseRows}"
        >
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
              {appProfState.expandedRowsTexArea[childid] ? "S" : "E"}
            </button>
            <button
              class="text-white/20 text-3xl w-6"
              onclick={() => togglethirdlevel(childid)}
            >
              {appProfState.expandedRowsProf[childid] ? "▼" : "▷"}
            </button>
            <textarea
              class="flex-1 pb-3 pt-3 mb-2 bg-blue-500/20 rounded-2xl px-3 py-1 text-blue-600/70 text-3xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
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
          <div class="{appProfState.expandedRowsProf[childid] ? "" : borderNTextNBg.collapseRows}">
            {#if Object.keys(levelTwo.patterns ?? {}).length !== 0}
            
              <PatternComponent {id} {childid} {levelTwo} />

            {/if}
          </div>
        </div>

        {#if levelTwo.children && Object.keys(levelTwo.children).length > 0}
          <!--Lower Level-->
          {#each Object.entries(levelTwo.children ?? {}) as [detailid, levelThree]}
            <div
              class={appProfState.expandedRowsProf[childid]
                ? "ml-15 flex items-center px-16 w-[95%] flex mt-2"
                : borderNTextNBg.collapseRows}
            >
              <button
                onclick={() => toggleExpand(detailid)}
                class="mt-1 mr-2 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                title="Toggle Expand"
              >
                {appProfState.expandedRowsTexArea[detailid] ? "S" : "E"}
              </button>
              <textarea
                class="flex-1 pb-2 pt-2 mb-2 bg-yellow-100/10 rounded-2xl px-3 py-1 text-white/50 text-xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-yellow-300 focus:shadow-[0_0_20px_rgba(250,204,21,0.35)]"
                use:autoResize={[
                  levelThree.text,
                  appProfState.expandedRowsTexArea[detailid],
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
      {/each}
    {/if}
  </div>
{/each}

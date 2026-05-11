<script lang="ts">
  import { borderNTextNBg } from "$lib/styles";
  import { autoResize } from "$lib/utils/textareaResize";
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
    updateDetailHighlight
  } from "$lib/stores/persgoal";
  // let { showTop } = $props();

  let selectedGoalId: string | null = null;
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
<!--Top level-->
{#each Object.entries($persGoalHighlights) as [id, levelOne]}
  <div class="w-full flex flex-col gap-0 mb-10 font-mono">

    <div class="flex">
      <button
        class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => addSubHighlight(id)}
      >
        +
      </button>
      <textarea
        class="w-full text-4xl bg-transparent text-white border border-white/20 rounded px-8 pb-5 pt-8 ml-3 mr-3"
        placeholder="Standards Questions Dialog Vocabulary ..."
        rows="1"
        value={levelOne.text || ""}
        oninput={(e) => {
                  updateTopHighlight(id,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
      />
      <button
        class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => removeHighlight(id)}
      >
        -
      </button>
    </div>

    <!--Middle Level-->
    {#if levelOne.children && Object.keys(levelOne.children).length > 0}
      {#each Object.entries(levelOne.children ?? {}) as [childid, levelTwo]}

        <div class="px-6 flex w-full gap-3 mt-2">
          <button
            class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
            onclick={() => addDetailHighlight(id, childid)}
          >
            +
          </button>
          <textarea
          
            class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            value={levelTwo.text}
            rows="1"
             oninput={(e) => {
                  updateSubHighlight(id, childid,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
      />
          <button
            class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
            onclick={() => removeSubHighlight(id, childid)}
          >
            -
          </button>
          </div>
          {#if levelTwo.children && Object.keys(levelTwo.children).length > 0}

            <!--Lower Level-->
            {#each Object.entries(levelTwo.children ?? {}) as [detailid, levelThree]}
              <div class="ml-4 px-16 w-full flex mt-2">
                <textarea
                  class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  value={levelThree.text}
                  rows="1"
                  oninput={(e) => {
                  updateDetailHighlight(id, childid,detailid,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
                />
                <button
                  class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
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

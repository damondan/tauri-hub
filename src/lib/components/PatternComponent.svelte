<script lang="ts">
    import {
        type HighlightLevel2,
        updatePatternSteps,
        initStep,
        removeStep,
    } from "$lib/stores/profgoal";
    import { buttonStyles } from "$lib/styles";
    import  ChevronRight from "@lucide/svelte/icons/chevron-right";
    import { remove } from "@tauri-apps/plugin-fs";

    interface Props {
        id: string;
        childid: string;
        levelTwo: HighlightLevel2;
    }
    let showSaved = $state(false);

    let { id, childid, levelTwo }: Props = $props();

    let tempValues = $state<string[]>([]);

    function showSavedFunc() {
        showSaved = true;

        setTimeout(() => {
            showSaved = false;
        }, 1000);
    }
</script>

<div class="flex flex-col mr-4">
    {#each Object.entries(levelTwo.patterns ?? {}) as [patternId, values]}
        <div class="flex flex-row gap-2 items-center">
        {#if patternId != ""}
            <div class="flex flex-col mr-30">
                <button
                    class="bg-emerald-400/15 hover:bg-emerald-400/25
text-emerald-200 hover:text-emerald-50
px-3 py-1 rounded-lg transition-colors"
                    onclick={() => initStep(id, childid, patternId)}
                >
                    +
                </button>
                <button
                    class="bg-rose-400/15 hover:bg-rose-400/25
text-rose-200 hover:text-rose-50
px-3 py-1 rounded-lg transition-colors"
                    onclick={() => removeStep(id, childid, patternId)}
                >
                    -
                </button>
            </div>
            {/if}
            {#each values as value, valueIndex}
                {#if valueIndex > 0}
                    <ChevronRight
                        class="mt-5 mr-2 w-10 h-10 
                        text-gray-400
                        hover:text-green-500
                        hover:translate-x-4
                        transition-all
                        duration-200"
                    />
                {/if}
                <input
                    type="text"
                    {value}
                    placeholder="step?"
                    oninput={(e) => {
                        updatePatternSteps(
                            id,
                            childid,
                            patternId,
                            valueIndex,
                            (e.target as HTMLTextAreaElement).value,
                        );
                    }}
                    class={`patternstep mt-4 bg-transparent border rounded px-2 py-1 text-center text-xl outline-none w-64 mr-5
                    ${valueIndex === values.length - 1
                    ? "border-4 border-green-400/30 text-green-700"
                    : "border-white/10 text-white"}`}
                    />
            {/each}
        </div>
    {/each}
</div>


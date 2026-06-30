import { writable,get } from 'svelte/store';
import { persGoalHighlights, type HighlightLevel2 } from "$lib/stores/persgoal";

export interface PersHighlightOrder {
  top: string[];
  middle: Record<string, string[]>;
  lower: Record<string, string[]>;
}

export const persHighlightOrder = writable<PersHighlightOrder>({
  top: [],
  middle: {},
  lower: {},
});

export interface PersHighlightExpanded {
  top: Record<string, boolean>;
  middle: Record<string, boolean>;
  lower: Record<string, boolean>;
}

export const persHighlightExpanded = writable<PersHighlightExpanded>({
  top: {},
  middle: {},
  lower: {},
});

export function initPersHighlightExpanded() {
  const highlights = get(persGoalHighlights);

  if (!highlights || Object.keys(highlights).length === 0) return;

  persHighlightExpanded.update((currentExpansion) => {
    const alreadyInitialized =
      Object.keys(currentExpansion.top).length > 0 ||
      Object.keys(currentExpansion.middle).length > 0 ||
      Object.keys(currentExpansion.lower).length > 0;

    if (alreadyInitialized) {
      return currentExpansion;
    }

    console.log("Initializing profHighlightExpanded");

    const expandData: PersHighlightExpanded = {
      top: {},
      middle: {},
      lower: {},
    };

    for (const [levelOneId, levelOne] of Object.entries(highlights)) {
      expandData.top[levelOneId] = false;

      const levelTwoEntries = Object.entries(levelOne.children ?? {}) as [
        string,
        HighlightLevel2,
      ][];

      for (const [levelTwoId, levelTwo] of levelTwoEntries) {
        expandData.middle[levelTwoId] = false;

        for (const levelThreeId of Object.keys(levelTwo.children ?? {})) {
          expandData.lower[levelThreeId] = false;
        }
      }
    }

    return expandData;
  });
}

export function initPersHighlightOrder() {
    const highlights = get(persGoalHighlights);
    if (!highlights || Object.keys(highlights).length === 0) return;

    persHighlightOrder.update((currentOrder) => {
        //If profHighlightOrder levels are initialized with data return
        const alreadyInitialized =
            currentOrder.top.length > 0 ||
            Object.keys(currentOrder.middle).length > 0 ||
            Object.keys(currentOrder.lower).length > 0;

        if (alreadyInitialized) {
            return currentOrder;
        }

        console.log("Initializing profHighlightOrder");
        const orderData: PersHighlightOrder = {
            top: [],
            middle: {},
            lower: {},
        };
        for (const [levelOneId, levelOne] of Object.entries(highlights)) {
            orderData.top.push(levelOneId);

            const levelTwoEntries = Object.entries(levelOne.children ?? {});
            orderData.middle[levelOneId] = levelTwoEntries.map(
                ([levelTwoId]) => levelTwoId,
            );

            for (const [levelTwoId, levelTwo] of levelTwoEntries) {
                orderData.lower[levelTwoId] = Object.keys(levelTwo.children ?? {});
            }
        }

        return orderData;
    });
}

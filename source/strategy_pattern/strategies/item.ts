import AL, { Character } from "alclient"
import { Strategy, LoopName, Loop } from "../context.js"

// TODO: Pass in the friends contexts, so we can potentially transfer items to other players to stack them to reduce overall inventory space

export class OptimizeItemsStrategy<Type extends Character> implements Strategy<Type> {
    public loops = new Map<LoopName, Loop<Type>>()

    public constructor() {
        this.loops.set("item", {
            fn: async (bot: Type) => {
                await this.stackItems(bot)
                await this.organizeItems(bot)
                await this.moveOverflowItems(bot)
            },
            interval: 1_000
        })
    }

    /**
     * Sort items how I like them to be sorted
     */
    private async organizeItems (bot: Type) {
        // TODO: Sort locked items at the beginning
        // TODO: Sort tracker in last slot
        // TODO: Sort hp and mp potions in 2nd and 3rd last slot
    }

    /**
     * Look for items that can be stacked and stack them
     */
    private async stackItems(bot: Type) {
        for (let i = 0; i < bot.isize - 1; i++) {
            const item1 = bot.items[i]
            if (!item1) continue // No item
            if (!item1.q) continue // Not stackable
            for (let j = i + 1; j < bot.isize; j++) {
                const item2 = bot.items[j]
                if (!item2) continue // No item
                if (!item2.q) continue // Not stackable
                if (item1.name !== item2.name) continue // Different items
                if (item1.p !== item2.p) continue // Item is a different kind of special
                if (item1.v !== item2.v) continue // One is PVP marked

                const gInfo = AL.Game.G.items[item1.name]
                if (item1.q + item2.q > gInfo.s) continue // Too many to stack

                // Stack the items!
                await bot.swapItems(j, i)
                return
            }
        }
    }

    /**
     * Look for items that are in the overflow area of the items, and swap them to normal inventory spaces
     */
    private async moveOverflowItems(bot: Type) {
        for (let i = bot.isize; i < bot.items.length; i++) {
            const item = bot.items[i]
            if (!item) continue // No item in overflow slot
            for (let j = 0; j < bot.isize; j++) {
                const item2 = bot.items[j]
                if (item2) continue // Item in normal inventory slot
                await bot.swapItems(i, j) // Swap the item from overflow in to our normal inventory
                break
            }
        }
    }
}
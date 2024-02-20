import AL, { PingCompensatedCharacter, Player } from "alclient"
import { Strategy, LoopName, Loop, Strategist, filterContexts } from "../context.js"
import { DEFAULT_ITEM_CONFIG, ItemConfig } from "../../base/itemsNew.js"

export type ItemStrategyOptions = {
    itemConfig: ItemConfig
    /** If available, we can do things like stacking items on one character instead of across three */
    contexts?: Strategist<PingCompensatedCharacter>[]
    /** If set, we will transfer items to this player if we see them and they have space */
    transferItemsTo?: string
}

export const defaultNewItemStrategyOptions: ItemStrategyOptions = {
    itemConfig: DEFAULT_ITEM_CONFIG
}

export class ItemStrategy<Type extends PingCompensatedCharacter> implements Strategy<Type> {
    public loops = new Map<LoopName, Loop<Type>>()

    protected options: ItemStrategyOptions

    public constructor(options: ItemStrategyOptions = defaultNewItemStrategyOptions) {
        this.options = options

        this.loops.set("item", {
            fn: async (bot: Type) => {
                await this.moveOverflowItems(bot).catch(console.error)
                await this.stackItems(bot).catch(console.error)
                await this.organizeItems(bot).catch(console.error)
                await this.transferItems(bot).catch(console.error)
                await this.transferSellableItems(bot).catch(console.error)
                await this.transferStackableItems(bot).catch(console.error)
            },
            interval: 5_000
        })
    }

    /**
     * Moves items that are outside of the normal inventory bounds back in
     * if there is space
     */
    private async moveOverflowItems(bot: Type) {
        for (let i = bot.isize; i < bot.items.length; i++) {
            const item = bot.items[i]
            if (!item) continue // No item in overflow slot
            for (let j = 0; j < bot.isize; j++) {
                const item2 = bot.items[j]
                if (item2) continue // Not empty
                return bot.swapItems(i, j)
            }
        }
    }

    /**
     * Organize inventory
     */
    private async organizeItems(bot: Type) {
        for (let i = 0; i < bot.isize; i++) {
            const item = bot.items[i]
            if (!item) continue // No item

            // Check if we want to hold it in a specific slot
            const itemConfig = this.options.itemConfig[item.name]
            if (itemConfig && itemConfig.hold && itemConfig.holdSlot !== i) {
                await bot.swapItems(i, itemConfig.holdSlot)
                continue
            }

            // Sort locked items first
            if (!item.l) continue
            for (let j = 0; j < i; j++) {
                const item2 = bot.items[j]
                if (!item2 || !item2.l) {
                    await bot.swapItems(i, j)
                    break
                }
            }
        }
    }

    /**
     * Optimize stacks of items
     */
    private async stackItems(bot: Type) {
        for (let i = 0; i < bot.isize - 1; i++) {
            const item1 = bot.items[i]
            if (!item1) continue // No item
            if (!item1.q) continue // Not stackable

            const gItem = AL.Game.G.items[item1.name]
            if (item1.q === gItem.s) continue // Full stack

            for (let j = i + 1; j < bot.isize; j++) {
                const item2 = bot.items[j]
                if (!item2) continue // No item
                if (item2.name !== item1.name) continue // Different item
                if (item2.p !== item1.p) continue // Different title
                if (item2.v !== item1.v) continue // Different PVP marking
                if (item2.q === gItem.s) continue // Full stack

                if (item1.q + item2.q <= gItem.s) {
                    // We can stack one on the other
                    await bot.swapItems(j, i)
                } else if (bot.esize) {
                    // We can optimize them so one is fully stacked
                    const newSlot = await bot.splitItem(j, gItem.s - item1.q)
                    await bot.swapItems(newSlot, i)
                }
            }
        }
    }

    /**
     * If the `transferItemsTo` option is set, transfer items to that player
     */
    private async transferItems(bot: Type) {
        if (!this.options.transferItemsTo) return // Option isn't set
        if (bot.id === this.options.transferItemsTo) return // Option is set to ourself

        let player: PingCompensatedCharacter | Player = bot.players.get(this.options.transferItemsTo)
        if (!player) return // Couldn't find them
        if (AL.Tools.squaredDistance(bot, player) >= AL.Constants.NPC_INTERACTION_DISTANCE_SQUARED) return // They're too far away

        // If we have the context of the player we want to send items to, we can perform extra checks to see if we can send the item
        if (this.options.contexts) {
            for (const context of filterContexts(this.options.contexts, { serverData: bot.serverData })) {
                if (context.bot.id !== this.options.transferItemsTo) continue // Not the player we want to transfer items to
                player = context.bot
                break
            }
        }

        for (const [slot, item] of bot.getItems()) {
            if (item.l) continue // Can't send locked items
            const itemConfig = this.options.itemConfig[item.name]
            if (itemConfig) {
                if (itemConfig.hold === true || itemConfig.hold.includes(bot.ctype)) continue
                if (itemConfig.sell && bot.canSell()) continue // We'll sell it soon
                if (itemConfig.destroyBelowLevel && item.level < itemConfig.destroyBelowLevel) continue // We'll destroy it soon
            }

            if (player instanceof PingCompensatedCharacter && player.esize === 0) {
                if (!item.q) continue // It's not stackable, and they have no space
                if (!player.hasItem(item.name, player.items, { quantityLessThan: AL.Game.G.items[item.name].s + 1 - item.q })) continue // We can't stack it
            }

            await bot.sendItem(this.options.transferItemsTo, slot, item.q ?? 1)
        }
    }

    /**
     * Send sellable items to a nearby context if we can't sell, but they can
     */
    private async transferSellableItems(bot: Type) {
        if (!this.options.contexts) return // No context information
        if (bot.canSell()) return // We can sell from where we currently are

        for (const context of filterContexts(this.options.contexts, { owner: bot.owner, serverData: bot.serverData })) {
            const friend = context.bot
            if (friend.esize <= 0) continue // They have no space
            if (AL.Tools.squaredDistance(bot, friend) > AL.Constants.NPC_INTERACTION_DISTANCE_SQUARED) continue // They're too far away
            if (!friend.canSell()) continue // They can't sell it either

            for (const [slot, item] of bot.getItems()) {
                if (item.l) continue // Can't send locked items

                const itemConfig = this.options.itemConfig[item.name]
                if (!itemConfig) continue // No item config, assume we don't want to sell it
                if (itemConfig.hold === true || itemConfig.hold.includes(bot.ctype)) continue // 
                if (!itemConfig.sell) continue // We don't want to sell it

                await bot.sendItem(friend.id, slot, item.q ?? 1)
            }
        }
    }

    /**
     * Transfer stackable items to the other players to reduce the number of stacks in total
     */
    private async transferStackableItems(bot: Type) {
        if (!this.options.contexts) return // No context information

        for (const context of filterContexts(this.options.contexts, { owner: bot.owner, serverData: bot.serverData })) {
            const friend = context.bot
            if (AL.Tools.squaredDistance(bot, friend) > AL.Constants.NPC_INTERACTION_DISTANCE_SQUARED) continue // They're too far away
            for (const [slot, item] of bot.getItems()) {
                if (item.l) continue // Can't send locked items
                if (!item.q) continue // Don't send non-stackable items

                const itemConfig = this.options.itemConfig[item.name]
                if (itemConfig) {
                    if (itemConfig.sell) continue // We want to sell this item
                    if (itemConfig.hold === true || itemConfig.hold?.includes(bot.ctype)) continue // We want to hold this item
                }

                const friendSlot = friend.locateItem(item.name, friend.items, { quantityLessThan: AL.Game.G.items[item.name].s + 1 - item.q }) // We can't stack it
                if (friendSlot === undefined) continue // They don't have this item to stack
                const friendItem = friend.items[friendSlot]
                if (friendItem.q < item.q) continue // We have more
                if (friendItem.q === item.q && friend.id > bot.id) continue // If they're the same amount, only transfer if our name is sorted before theirs alphabetically

                await bot.sendItem(friend.id, slot, item.q ?? 1)
            }
        }
    }
}

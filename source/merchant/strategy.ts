import AL, { BankPackName, Character, IPosition, ItemName, LocateItemsFilters, MapName, Merchant, PingCompensatedCharacter, SlotType, Tools, TradeSlotType } from "alclient"
import { getItemsToCompoundOrUpgrade, getOfferingToUse, IndexesToCompoundOrUpgrade, withdrawItemFromBank } from "../base/items.js"
import { checkOnlyEveryMS, sleep } from "../base/general.js"
import { bankingPosition, mainFishingSpot, miningSpot } from "../base/locations.js"
import { filterContexts, Loop, LoopName, Strategist, Strategy } from "../strategy_pattern/context.js"
import { BaseAttackStrategy } from "../strategy_pattern/strategies/attack.js"
import { BuyStrategy } from "../strategy_pattern/strategies/buy.js"
import { AcceptPartyRequestStrategy } from "../strategy_pattern/strategies/party.js"
import { ToggleStandStrategy } from "../strategy_pattern/strategies/stand.js"
import { TrackerStrategy } from "../strategy_pattern/strategies/tracker.js"
import { addCryptMonstersToDB, getKeyForCrypt, refreshCryptMonsters } from "../base/crypt.js"
import { DEFAULT_CRAFTABLES, DEFAULT_EXCHANGEABLES, DEFAULT_GOLD_TO_HOLD, DEFAULT_IDENTIFIER, DEFAULT_ITEMS_TO_BUY, DEFAULT_ITEMS_TO_HOLD, DEFAULT_MERCHANT_ITEMS_TO_HOLD, DEFAULT_MERCHANT_REPLENISHABLES, DEFAULT_REGION, DEFAULT_REPLENISHABLES, DEFAULT_REPLENISH_RATIO } from "../base/defaults.js"
import { BankItemPosition, goAndWithdrawItem, tidyBank } from "../base/banking.js"
import { AvoidDeathStrategy } from "../strategy_pattern/strategies/avoid_death.js"

export type MerchantMoveStrategyOptions = {
    /** If enabled, we will log debug messages */
    debug?: true
    /** The default position to stand when upgrading / waiting for things to do */
    defaultPosition: IPosition
    /** If enabled, the merchant will
     *  - find the lowest level piece of armor that's lower than the level set on the bots running in the given contexts
     *  - buy and upgrade store armor (helmet, coat, pants, boots, and gloves) until it's 1 level higher than what's currently equipped
     *  - apply the correct scroll for the character type
     *  - deliver it and equip it
     */
    enableBuyAndUpgrade?: {
        upgradeToLevel: number
    },
    /** If enabled, the merchant will
     * - buy replenishables in the list for the bots running in the given contexts if they get below the replenish ratio
     */
    enableBuyReplenishables?: {
        all: Map<ItemName, number>
        merchant?: Map<ItemName, number>
        ratio: number,
    }
    /** If enabled, the merchant will
     * - withdraw items needed to craft the items in the list from the bank
     * - craft the items in the given list
     * - buy items from the vendor if they are needed to craft
     */
    enableCraft?: {
        items: Set<ItemName>
    },
    /** If enabled, the merchant will
     * - check that instances are still available periodically
     * - open a new instance if there are no monsters in the database from that crypt and we have an item
     */
    enableInstanceProvider?: {
        crypt?: true
    }
    /** If enabled, the merchant will
     * - Look for merchants with things we want to buy and move to them
     */
    enableDealFinder?: {
        itemsToBuy: Map<ItemName, number>
    }
    /** If enabled, the merchant will
     * - withdraw items to exchange from the bank if we have enough free spaces
     * - if they have the required amount of each exchangeable
     *   - move to where they can exchange the item(s)
     *   - exchange the item(s)
     */
    enableExchange?: {
        items: Set<ItemName>
        /** Lost earrings can be exchanged at different levels for different items, if this is set we will exchange them at the level provided */
        lostEarring?: number
    }
    /** If enabled, the merchant will
     * - make a rod if it doesn't have one
     * - go fishing
     */
    enableFishing?: true
    /** If enabled the merchant will
     * - join all giveaways it sees that it's not currently a part of
     */
    enableJoinGiveaways?: true
    /** If enabled, the merchant will
     * - make a pickaxe if it doesn't have one
     * - go mining
     */
    enableMining?: true
    /** If enabled, the merchant will
     * - mluck based on the options
     */
    enableMluck?: {
        /** Should we mluck those that we pass through `contexts`? */
        contexts?: true
        /** Should we mluck others? */
        others?: true
        /** Should we mluck ourself? */
        self?: true
        /** Should we travel to mluck our own characters and others? */
        travel?: true
    }
    /** If enabled, the merchant will
     * - grab items off the bots running in the given contexts if they drop below `esize` free inventory slots.
     * - give or take gold so the bots in the given contexts will have `goldToHold` gold
     * - take items not in the `itemsToHold` set
     */
    enableOffload?: {
        esize: number,
        goldToHold: number,
        itemsToHold: Set<ItemName>
    },
    /** If enabled, the merchant will
     * - upgrade spare items
     */
    enableUpgrade?: boolean
    goldToHold: number,
    itemsToHold: Set<ItemName>,
}

export const DEFAULT_MERCHANT_MOVE_STRATEGY_OPTIONS: MerchantMoveStrategyOptions = {
    debug: true,
    // enableBuyAndUpgrade: {
    //     upgradeToLevel: 9
    // },
    defaultPosition: {
        map: "main",
        x: 0,
        y: 0
    },
    enableBuyReplenishables: {
        all: DEFAULT_REPLENISHABLES,
        merchant: DEFAULT_MERCHANT_REPLENISHABLES,
        ratio: DEFAULT_REPLENISH_RATIO,
    },
    enableCraft: {
        items: DEFAULT_CRAFTABLES
    },
    enableDealFinder: {
        itemsToBuy: DEFAULT_ITEMS_TO_BUY
    },
    enableExchange: {
        items: DEFAULT_EXCHANGEABLES,
        lostEarring: 2,
    },
    enableFishing: true,
    enableJoinGiveaways: true,
    enableMining: true,
    enableMluck: {
        contexts: true,
        others: true,
        self: true,
        travel: true,
    },
    enableOffload: {
        esize: 3,
        goldToHold: DEFAULT_GOLD_TO_HOLD,
        itemsToHold: DEFAULT_ITEMS_TO_HOLD,
    },
    // enableUpgrade: true,
    goldToHold: DEFAULT_GOLD_TO_HOLD,
    itemsToHold: DEFAULT_MERCHANT_ITEMS_TO_HOLD,
}

export class MerchantStrategy implements Strategy<Merchant> {
    public loops = new Map<LoopName, Loop<Merchant>>()

    protected contexts: Strategist<PingCompensatedCharacter>[]

    protected options: MerchantMoveStrategyOptions

    protected toUpgrade: IndexesToCompoundOrUpgrade = []

    public constructor(contexts: Strategist<PingCompensatedCharacter>[], options: MerchantMoveStrategyOptions = DEFAULT_MERCHANT_MOVE_STRATEGY_OPTIONS) {
        this.contexts = contexts
        this.options = options

        this.loops.set("move", {
            fn: async (bot: Merchant) => { await this.move(bot).catch(console.error) },
            interval: 250
        })

        if (this.options.enableMluck) {
            this.loops.set("mluck", {
                fn: async (bot: Merchant) => { await this.mluck(bot).catch(console.error) },
                interval: ["mluck"]
            })
        }

        if (this.options.enableUpgrade) {
            this.loops.set("compound", {
                fn: async (bot: Merchant) => { await this.compound(bot).catch(console.error) },
                interval: 250
            })
            this.loops.set("upgrade", {
                fn: async (bot: Merchant) => { await this.upgrade(bot).catch(console.error) },
                interval: 250
            })
        }
    }

    protected async move(bot: Merchant) {
        try {
            // Respawn if dead
            if (bot.rip) return bot.respawn()

            // Emergency banking if full
            if (bot.esize == 0) {
                this.debug(bot, "Emergency Banking")
                // Go to bank and get item counts
                this.toUpgrade = []
                await bot.smartMove(bankingPosition)
                await tidyBank(bot, { itemsToHold: this.options.itemsToHold })

                // Withdraw things that we can upgrade
                if (this.options.enableUpgrade) {
                    this.toUpgrade = await getItemsToCompoundOrUpgrade(bot)
                }

                // Withdraw extra gold
                if (bot.bank.gold > this.options.goldToHold) await bot.withdrawGold(this.options.goldToHold)

                // Go to our default position and wait a bit for things to upgrade
                await bot.smartMove(this.options.defaultPosition)
                await sleep(15_000)
                return
            }

            // Move things from "overflow" slots
            for (let i = bot.isize; i < bot.items.length; i++) {
                const free = bot.getFirstEmptyInventorySlot()
                if (free === undefined) break
                await bot.swapItems(i, free)
            }

            // Do banking if we have a lot of gold, or it's been a while (10 minutes)
            if (
                (bot.gold > (this.options.goldToHold * 2))
                || (bot.esize < 2 && !this.toUpgrade.length)
                || checkOnlyEveryMS(`${bot.id}_banking`, 600_000)
            ) {
                this.debug(bot, "Normal Banking")
                // Move to town first, to have a chance to sell unwanted items
                await bot.smartMove("main")

                // Then go to the bank to bank things
                this.toUpgrade = []
                await bot.smartMove(bankingPosition)
                await tidyBank(bot, { itemsToHold: this.options.itemsToHold })

                // Withdraw things that we can upgrade
                if (this.options.enableUpgrade) {
                    this.debug(bot, "Looking for items to compound or upgrade...")
                    this.toUpgrade = await getItemsToCompoundOrUpgrade(bot)
                }

                // Withdraw an item we want to craft
                if (this.options.enableCraft && bot.esize >= 3) {
                    this.debug(bot, "Looking for craftables in bank...")
                    for (const itemToCraft of this.options.enableCraft.items) {
                        const gCraft = AL.Game.G.craft[itemToCraft]
                        const itemsToWithdraw: BankItemPosition[] = []
                        let foundAll = true
                        craftItemCheck:
                        for (const [requiredQuantity, requiredItem, requiredItemLevel] of gCraft.items) {
                            // If the item is compoundable or upgradable, the level needs to be 0
                            let fixedItemLevel = requiredItemLevel
                            if (fixedItemLevel === undefined) {
                                const gInfo = AL.Game.G.items[requiredItem]
                                if (gInfo.upgrade || gInfo.compound) fixedItemLevel = 0
                            }

                            // Check if it's already in our inventory
                            if (bot.hasItem(requiredItem, bot.items, { level: requiredItemLevel })) continue

                            // Look in bank
                            for (const bankSlot in bot.bank) {
                                for (let i = 0; i < bot.bank[bankSlot as BankPackName].length; i++) {
                                    const bankItem = bot.bank[bankSlot as BankPackName][i]
                                    if (!bankItem) continue // Empty slot
                                    if (bankItem.name !== requiredItem) continue // Not the required item
                                    if (bankItem.level !== fixedItemLevel) continue // Not the required level
                                    if (bankItem.q !== undefined && bankItem.q < requiredQuantity) continue // Not enough

                                    // We found it in our bank
                                    itemsToWithdraw.push([bankSlot as BankPackName, i])
                                    continue craftItemCheck
                                }
                            }

                            if (!fixedItemLevel && bot.canBuy(requiredItem, { ignoreLocation: true, quantity: requiredQuantity })) continue

                            // We don't have this required item
                            foundAll = false
                            break
                        }
                        if (foundAll && bot.esize > itemsToWithdraw.length) {
                            for (const [bankPack, i] of itemsToWithdraw) {
                                await goAndWithdrawItem(bot, bankPack, i).catch(console.error)
                            }
                            break
                        }
                    }
                }

                // Withdraw an item we want to exchange
                if (this.options.enableExchange && bot.esize >= 3) {
                    this.debug(bot, "Looking for exchangables in bank...")
                    for (const item of this.options.enableExchange.items) {
                        const options: LocateItemsFilters = {
                            locked: false,
                            quantityGreaterThan: (AL.Game.G.items[item].e ?? 1) - 1
                        }
                        await withdrawItemFromBank(bot, item, options, { freeSpaces: 3, itemsToHold: this.options.itemsToHold })
                        if (bot.hasItem(item, bot.items, options)) break // We found something to exchange
                    }
                    if (this.options.enableExchange.lostEarring !== undefined) {
                        await withdrawItemFromBank(bot, "lostearring", { level: this.options.enableExchange.lostEarring, locked: false }, { freeSpaces: 1, itemsToHold: this.options.itemsToHold })
                    }
                }

                if (bot.gold > this.options.goldToHold) {
                    await bot.depositGold(bot.gold - this.options.goldToHold)
                } else if (bot.gold < this.options.goldToHold) {
                    await bot.withdrawGold(this.options.goldToHold - bot.gold)
                }

                await bot.smartMove("main")
            }

            if (bot.map.startsWith("bank")) {
                this.debug(bot, "Moving out of bank...")
                await bot.smartMove("main")
            }

            if (this.options.enableJoinGiveaways) {
                for (const player of bot.getPlayers({ withinRange: AL.Constants.NPC_INTERACTION_DISTANCE })) {
                    for (const s in player.slots) {
                        const slot = s as TradeSlotType
                        const item = player.slots[slot]
                        if (!item) continue // Nothing in the slot
                        if (!item.giveaway) continue // Not a giveaway
                        if (item.list && item.list.includes(bot.id)) continue // We're already in the giveaway
                        await (bot as Merchant).joinGiveaway(slot, player.id, item.rid)
                    }
                }
            }

            if (this.options.enableBuyReplenishables) {
                // Find own characters with low replenishables and go deliver some
                for (const friendContext of filterContexts(this.contexts, { owner: bot.owner, serverData: bot.serverData })) {
                    const friend = friendContext.bot
                    for (const [item, numTotal] of this.options.enableBuyReplenishables.all) {
                        const numFriendHas = friend.countItem(item)
                        if (numFriendHas == 0 && friend.esize == 0) continue // Friend has no space for more items
                        if (numFriendHas > numTotal * this.options.enableBuyReplenishables.ratio) continue // They still have enough

                        const numWeHave = bot.countItem(item)
                        const numToBuy = (numTotal * 2) - numFriendHas - numWeHave
                        if (!bot.canBuy(item, { ignoreLocation: true, quantity: numToBuy })) continue // We don't have enough gold to buy them all

                        // Go buy the item(s)
                        if (numToBuy > 0) {
                            if (!bot.hasItem(["computer", "supercomputer"])) {
                                this.debug(bot, `Replenishables - Moving to buy ${numToBuy}x${item}`)
                                await bot.smartMove(item, { getWithin: AL.Constants.NPC_INTERACTION_DISTANCE / 2 })
                            }
                            this.debug(bot, `Replenishables - Buying ${numToBuy}x${item}`)
                            if (bot.canBuy(item, { quantity: numToBuy })) await bot.buy(item, numToBuy)
                        }

                        // Go deliver the item(s)
                        if (bot.id !== friend.id) {
                            this.debug(bot, `Replenishables - Delivering ${numToBuy}x${item} to ${friend.id}`)
                            await bot.smartMove(friend, { getWithin: 25 })
                            if (AL.Tools.squaredDistance(bot, friend) > AL.Constants.NPC_INTERACTION_DISTANCE_SQUARED) {
                                // We're not near them, so they must have moved, return so we can try again next loop
                                return
                            }
                            await bot.sendItem(friend.id, bot.locateItem(item, bot.items), numTotal - numFriendHas)
                        }
                    }
                }

                // Buy replenishables for ourselves
                if (this.options.enableBuyReplenishables.merchant) {
                    for (const [item, numTotal] of this.options.enableBuyReplenishables.merchant) {
                        const numHave = bot.countItem(item)
                        if (numHave >= numTotal) continue // We have enough
                        const numToBuy = numTotal - numHave
                        if (!bot.canBuy(item, { quantity: numToBuy })) continue // We can't buy them
                        await bot.buy(item, numToBuy)
                    }
                }
            }

            // Find own characters with low inventory space and go grab some items off of them
            if (this.options.enableOffload) {
                for (const friendContext of filterContexts(this.contexts, { owner: bot.owner, serverData: bot.serverData })) {
                    const friend = friendContext.bot
                    if (friend == bot) continue // Skip ourself
                    if (friend.gold < (this.options.enableOffload.goldToHold * 2)) {
                        if (friend.esize > 3) continue // They don't have a lot to offload

                        // Check if they have items that we can grab
                        let skipItems = true
                        for (let i = 0; i < friend.isize; i++) {
                            const item = friend.items[i]
                            if (!item) continue // No item here
                            if (item.l) continue // Can't send locked items
                            if (this.options.enableOffload.itemsToHold.has(item.name)) continue // We want to hold this item
                            skipItems = false
                            break
                        }
                        if (skipItems) continue // They are full, but they're full of useful items
                    }

                    // Go find them
                    this.debug(bot, `Moving to ${friend.id} to offload things`)
                    await bot.smartMove(friend, { getWithin: 25 })
                    if (AL.Tools.squaredDistance(bot, friend) > AL.Constants.NPC_INTERACTION_DISTANCE_SQUARED) {
                        // We're not near them, so they must have moved, return so we can try again next loop
                        return
                    }

                    // Grab extra gold
                    if (friend.gold > this.options.enableOffload.goldToHold) {
                        // Take their gold for safe keeping
                        this.debug(bot, `Offloading gold from ${friend.id}.`)
                        await friend.sendGold(bot.id, friend.gold - this.options.enableOffload.goldToHold)
                    } else if (bot.gold > this.options.enableOffload.goldToHold) {
                        // Send them some of our gold
                        this.debug(bot, `Giving gold from ${friend.id}.`)
                        await bot.sendGold(friend.id, Math.min(bot.gold - this.options.enableOffload.goldToHold, this.options.enableOffload.goldToHold - friend.gold))
                    }

                    // Grab items
                    this.debug(bot, `Offloading items from ${friend.id}.`)
                    for (let i = 0; i < friend.isize && bot.esize > 0; i++) {
                        const item = friend.items[i]
                        if (!item) continue // No item here
                        if (item.l) continue // Can't send locked items
                        if (this.options.enableOffload.itemsToHold.has(item.name)) continue // We want to hold this item
                        await friend.sendItem(bot.id, i, item.q ?? 1)
                    }

                    // Return so we can deal with a full inventory if we need to
                    return
                }
            }

            // Go fishing
            if (this.options.enableFishing && bot.canUse("fishing", { ignoreEquipped: true, ignoreLocation: true })) {
                this.debug(bot, "Fishing")
                const rodItems = new Set<ItemName>([...this.options.itemsToHold, "rod", "spidersilk", "staff"])

                if (!bot.hasItem("rod") && !bot.isEquipped("rod")) {
                    this.debug(bot, "Fishing - Looking for a rod in the bank")
                    // We don't have a rod, see if there's one in our bank
                    await withdrawItemFromBank(bot, "rod", {}, {
                        freeSpaces: bot.esize,
                        itemsToHold: rodItems
                    })
                }

                if (!bot.hasItem("rod") && !bot.isEquipped("rod") && !bot.hasItem("spidersilk")) {
                    this.debug(bot, "Fishing - Looking for spidersilk in the bank")
                    // We didn't find one in our bank, see if we spider silk to make one
                    await withdrawItemFromBank(bot, "spidersilk", {}, {
                        freeSpaces: bot.esize,
                        itemsToHold: rodItems
                    })
                }

                if (!bot.hasItem("rod") && !bot.isEquipped("rod") && bot.hasItem("spidersilk") && !bot.hasItem("staff", bot.items, { level: 0, locked: false })) {
                    this.debug(bot, "Fishing - Looking for a staff in the bank")
                    // We found spider silk, see if we have a staff, too
                    await withdrawItemFromBank(bot, "staff", { level: 0, locked: false }, {
                        freeSpaces: bot.esize,
                        itemsToHold: rodItems
                    })

                    if (!bot.hasItem("staff")) {
                        this.debug(bot, "Fishing - Buying a staff")
                        // We didn't find a staff, but we can go buy one
                        await bot.smartMove("staff", { getWithin: 50 })
                        await sleep(Math.max(2000, bot.s.penalty_cd?.ms ?? 0)) // The game can still think you're in the bank for a while
                        await bot.buy("staff")
                    }
                }

                if (!bot.hasItem("rod") && !bot.isEquipped("rod") && bot.canCraft("rod", { ignoreLocation: true })) {
                    // We can make a rod, let's go do that
                    if (bot.hasItem(["computer", "supercomputer"])) {
                        this.debug(bot, "Fishing - Moving to fishing spot before crafting a rod")
                        await bot.smartMove(mainFishingSpot)
                    } else {
                        this.debug(bot, "Fishing - Moving to craftsman to craft a rod")
                        await bot.smartMove("craftsman", { getWithin: AL.Constants.NPC_INTERACTION_DISTANCE - 50 })
                    }
                    await bot.craft("rod")
                }

                if (bot.isEquipped("rod") || bot.hasItem("rod") && AL.Tools.distance(bot, mainFishingSpot) > 10) {
                    this.debug(bot, "Fishing - Moving to fishing spot")
                    // TODO: find closest fishing spot
                    await bot.smartMove(mainFishingSpot, { costs: { transport: 9999 } })
                }

                if (!bot.isEquipped("rod") && bot.hasItem("rod")) {
                    this.debug(bot, "Fishing - Equipping the fishing rod")
                    // Equip the rod if we don't have it equipped already
                    const rod = bot.locateItem("rod", bot.items, { returnHighestLevel: true })
                    if (bot.slots.offhand) await bot.unequip("offhand")
                    await bot.equip(rod)
                }

                // Wait a bit if we're on cooldown
                if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms)

                if (bot.canUse("fishing")) {
                    this.debug(bot, "Fishing - Casting our rod!")
                    return bot.fish()
                }
            }

            // Go mining
            if (this.options.enableMining && bot.canUse("mining", { ignoreEquipped: true, ignoreLocation: true })) {
                this.debug(bot, "Mining")
                const pickaxeItems = new Set<ItemName>([...this.options.itemsToHold, "pickaxe", "spidersilk", "staff", "blade"])

                if (!bot.hasItem("pickaxe") && !bot.isEquipped("pickaxe")) {
                    // We don't have a pickaxe, see if there's one in our bank
                    await bot.smartMove(bankingPosition)
                    await withdrawItemFromBank(bot, "pickaxe", {}, {
                        freeSpaces: bot.esize,
                        itemsToHold: pickaxeItems
                    })
                }

                if (!bot.hasItem("pickaxe") && !bot.isEquipped("pickaxe") && !bot.hasItem("spidersilk")) {
                    // We didn't find one in our bank, see if we spider silk to make one
                    await withdrawItemFromBank(bot, "spidersilk", {}, {
                        freeSpaces: bot.esize,
                        itemsToHold: pickaxeItems
                    })
                }

                if (!bot.hasItem("pickaxe") && !bot.isEquipped("pickaxe") && bot.hasItem("spidersilk")
                    && !bot.hasItem("staff", bot.items, { level: 0, locked: false })
                    && !bot.hasItem("blade", bot.items, { level: 0, locked: false })) {
                    // We found spider silk, see if we have a staff and blade, too
                    await withdrawItemFromBank(bot, "staff", { level: 0, locked: false }, {
                        freeSpaces: bot.esize,
                        itemsToHold: pickaxeItems
                    })
                    await withdrawItemFromBank(bot, "blade", { level: 0, locked: false }, {
                        freeSpaces: bot.esize,
                        itemsToHold: pickaxeItems
                    })

                    if (!bot.hasItem("staff") || !bot.hasItem("blade")) {
                        // We didn't find a staff and/or a blade, but we can go buy one
                        await bot.smartMove("staff", { getWithin: 50 })
                        await sleep(2000) // The game can still think you're in the bank for a while
                        if (!bot.hasItem("staff") && bot.canBuy("staff") && bot.canBuy("blade")) await bot.buy("staff")
                        if (!bot.hasItem("blade") && bot.canBuy("blade")) await bot.buy("blade")
                    }
                }

                if (!bot.hasItem("pickaxe") && !bot.isEquipped("pickaxe") && bot.canCraft("pickaxe", { ignoreLocation: true })) {
                    // We can make a pickaxe, let's go do that
                    if (bot.hasItem(["computer", "supercomputer"])) {
                        await bot.smartMove(miningSpot)
                    } else {
                        await bot.smartMove("craftsman", { getWithin: AL.Constants.NPC_INTERACTION_DISTANCE - 50 })
                    }
                    await bot.craft("pickaxe")
                }

                if (bot.isEquipped("pickaxe") || bot.hasItem("pickaxe")) {
                    // Move to mining spot
                    // TODO: find closest mining spot
                    await bot.smartMove(miningSpot)
                }

                if (!bot.isEquipped("pickaxe") && bot.hasItem("pickaxe")) {
                    // Equip the pickaxe if we don't have it equipped already
                    const pickaxe = bot.locateItem("pickaxe", bot.items, { returnHighestLevel: true })
                    if (bot.slots.offhand) await bot.unequip("offhand")
                    await bot.equip(pickaxe)
                }

                // Wait a bit if we're on cooldown
                if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms)

                if (bot.canUse("mining")) {
                    await bot.mine()
                    return
                }
            }

            // Equip items that make you go fast
            const broom = bot.locateItem("broom", bot.items, { returnHighestLevel: true })
            if (broom !== undefined) {
                if (
                    !bot.slots.mainhand // Nothing equipped in mainhand
                    || bot.slots.mainhand.name !== "broom" // Broom not equipped in mainhand
                    || bot.items[broom].level > bot.slots.mainhand.level // It's higher level than the one we have equipped
                ) {
                    await bot.equip(broom)
                }
            }

            // Go travel to mluck players
            if (this.options.enableMluck?.travel && bot.canUse("mluck", { ignoreCooldown: true, ignoreLocation: true, ignoreMP: true })) {
                if (this.options.enableMluck.contexts) {
                    for (const context of filterContexts(this.contexts, { serverData: bot.serverData })) {
                        const friend = context.bot
                        if (
                            friend.s.mluck // They have mluck
                            && friend.s.mluck.f == bot.id // It's from us
                            && friend.s.mluck?.ms > 900_000 // There's 15 minutes or more left
                        ) continue // Ignore
                        if (
                            friend.s.mluck // They have mluck
                            && friend.s.mluck.f !== bot.id // It's not from us
                            && friend.s.mluck.strong // It's strong
                        ) continue // Ignore, because we can't override it
                        this.debug(bot, `Moving to ${friend.name} (context) to mluck them`)
                        await bot.smartMove(friend, { getWithin: AL.Game.G.skills.mluck.range / 2 })
                        // Wait a bit if we had to enter a door
                        if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms + 1000)
                        return
                    }
                }
                if (this.options.enableMluck.others) {
                    const player = await AL.PlayerModel.findOne(
                        {
                            $or: [
                                { "s.mluck": undefined }, // They don't have mluck
                                { "s.mluck.f": { "$ne": bot.id }, "s.mluck.strong": undefined } // We can steal mluck
                            ],
                            lastSeen: { $gt: Date.now() - 30000 },
                            serverIdentifier: bot.server.name,
                            serverRegion: bot.server.region
                        },
                        {
                            _id: 0,
                            map: 1,
                            name: 1,
                            x: 1,
                            y: 1
                        }
                    ).lean().exec()
                    if (player) {
                        this.debug(bot, `Moving to ${player.name} to mluck them`)
                        await bot.smartMove(player, { getWithin: AL.Game.G.skills.mluck.range / 2 })
                        // Wait a bit if we had to enter a door
                        if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms + 1000)
                        return
                    }
                }
            }

            if (this.options.enableCraft) {
                // Craft items in our list
                for (const itemToCraft of this.options.enableCraft.items) {
                    if (!bot.canCraft(itemToCraft, { ignoreLocation: true, ignoreNpcItems: true })) continue // We can't craft it

                    if (!bot.canCraft(itemToCraft, { ignoreLocation: true })) {
                        // We need to buy some items from the NPCs first
                        const gCraft = AL.Game.G.craft[itemToCraft]
                        for (const [requiredQuantity, requiredItem] of gCraft.items) {
                            if (!bot.canBuy(requiredItem, { ignoreLocation: true, quantity: requiredQuantity })) break
                            if (!bot.hasItem(["computer", "supercomputer"])) {
                                this.debug(bot, `Moving to NPC to buy ${requiredItem}x${requiredQuantity} to craft ${itemToCraft}`)
                                await bot.smartMove(requiredItem)
                            }
                            this.debug(bot, `Buying ${requiredItem}x${requiredQuantity} to craft ${itemToCraft}`)
                            await bot.buy(requiredItem, requiredQuantity)
                        }
                    }

                    if (!bot.canCraft(itemToCraft, { ignoreLocation: true })) continue // We can't craft it

                    if (!bot.hasItem(["computer", "supercomputer"])) {
                        // Walk to the NPC
                        const npc = AL.Pathfinder.locateCraftNPC(itemToCraft)
                        this.debug(bot, `Moving to NPC to craft ${itemToCraft}`)
                        await bot.smartMove(npc, { getWithin: AL.Constants.NPC_INTERACTION_DISTANCE - 50 })
                    }
                    bot.craft(itemToCraft).catch(console.error)
                    break
                }
            }

            if (this.options.enableExchange && !bot.map.startsWith("bank")) {
                // Exchange items in our list
                for (let i = 0; i < bot.isize && bot.esize > 1; i++) {
                    const item = bot.items[i]
                    if (!item) continue // No item
                    if (item.l) continue // Item is locked
                    if (!this.options.enableExchange.items.has(item.name)) continue // Not an exchangeable, or we don't want to exchange it
                    if ((item.q ?? 1) < (AL.Game.G.items[item.name].e ?? 1)) continue // We don't have enough to exchange
                    if (!bot.hasItem(["computer", "supercomputer"])) {
                        // Walk to the NPC
                        const npc = AL.Pathfinder.locateExchangeNPC(item.name)
                        this.debug(bot, `Moving to NPC to exchange ${item.name}`)
                        await bot.smartMove(npc, { getWithin: AL.Constants.NPC_INTERACTION_DISTANCE - 50 })
                    }
                    if (!bot.q.exchange) bot.exchange(i).catch(console.error)
                    break
                }

                if (this.options.enableExchange.lostEarring !== undefined) {
                    // Exchange earrings of the provided level
                    for (let i = 0; i < bot.isize; i++) {
                        const item = bot.items[i]
                        if (!item) continue // No item
                        if (item.l) continue // Item is locked
                        if (item.name !== "lostearring" || item.level !== this.options.enableExchange.lostEarring) continue // Wrong level of earring
                        if (!bot.hasItem(["computer", "supercomputer"])) {
                            // Walk to the NPC
                            const npc = AL.Pathfinder.locateExchangeNPC(item.name)
                            this.debug(bot, `Moving to NPC to exchange ${item.name}`)
                            await bot.smartMove(npc, { getWithin: AL.Constants.NPC_INTERACTION_DISTANCE - 50 })
                        }
                        if (!bot.q.exchange) bot.exchange(i).catch(console.error)
                        break
                    }
                }
            }

            if (this.options.enableBuyAndUpgrade) {
                // Find the lowest level item across all characters
                let lowestItemSlot: SlotType
                let lowestItemLevel: number = Number.MAX_SAFE_INTEGER
                let getFor: Character
                itemSearch:
                for (const friendContext of filterContexts(this.contexts, { owner: bot.owner, serverData: bot.serverData })) {
                    const friend = friendContext.bot
                    if (friend == bot) continue // Skip ourself
                    for (const sN in friend.slots) {
                        const slotName = sN as SlotType
                        if (slotName.startsWith("trade")) continue // Don't look at trade slots
                        if (!(["chest", "gloves", "helmet", "mainhand", "pants", "shoes"]).includes(slotName)) continue
                        const slot = friend.slots[slotName]
                        if (!slot) {
                            // We have nothing in this slot, let's get something for it
                            lowestItemSlot = slotName
                            lowestItemLevel = 0
                            getFor = friend
                            break itemSearch
                        }
                        if (slot.level > this.options.enableBuyAndUpgrade.upgradeToLevel) continue // We already have something pretty good
                        if (slot.level >= lowestItemLevel) continue // We have already found something at a lower level

                        // We found a new low
                        lowestItemLevel = slot.level
                        lowestItemSlot = slotName
                        getFor = friend
                    }
                }

                // Buy and upgrade the store-level item to a higher level to replace it
                if (lowestItemSlot) {
                    let item: ItemName
                    switch (lowestItemSlot) {
                        case "chest":
                            item = "coat"
                            break
                        case "gloves":
                            item = "gloves"
                            break
                        case "helmet":
                            item = "helmet"
                            break
                        case "mainhand":
                            // Get the item that will attack the fastest
                            switch (getFor.ctype) {
                                case "mage":
                                    item = "wand"
                                    break
                                case "paladin":
                                    item = "mace"
                                    break
                                case "priest":
                                    item = "wand"
                                    break
                                case "ranger":
                                    item = "bow"
                                    break
                                case "rogue":
                                    item = "claw"
                                    break
                                case "warrior":
                                    item = "claw"
                                    break
                            }
                            break
                        case "offhand":
                            switch (getFor.ctype) {
                                case "rogue":
                                    item = "claw"
                                    break
                                case "warrior":
                                    item = "claw"
                                    break
                            }
                            break
                        case "pants":
                            item = "pants"
                            break
                        case "shoes":
                            item = "shoes"
                            break
                    }

                    // If we have a higher level item, make sure it has the correct scroll, then go deliver and equip it
                    const potential = bot.locateItem(item, bot.items, { levelGreaterThan: lowestItemLevel, returnHighestLevel: true })
                    if (potential !== undefined) {
                        // Apply the correct stat scroll if we need
                        const itemData = bot.items[potential]
                        const stat = AL.Game.G.items[item].stat ? AL.Game.G.classes[getFor.ctype].main_stat : undefined
                        if (itemData.stat_type !== stat) {
                            // Go to the upgrade NPC
                            if (!bot.hasItem(["computer", "supercomputer"])) {
                                await bot.smartMove("newupgrade", { getWithin: 25 })
                            }

                            // Buy the correct stat scroll(s) and apply them
                            const grade = bot.calculateItemGrade(itemData)
                            const statScroll = `${stat}scroll` as ItemName
                            const numNeeded = Math.pow(10, grade)
                            const numHave = bot.countItem(statScroll, bot.items)

                            try {
                                if (numNeeded > numHave && bot.canBuy(statScroll, { quantity: numNeeded - numHave }))
                                    await bot.buy(statScroll, numNeeded - numHave)
                                const statScrollPosition = bot.locateItem(statScroll, bot.items, { quantityGreaterThan: numNeeded - 1 })
                                if (statScrollPosition !== undefined)
                                    await bot.upgrade(potential, statScrollPosition)
                            } catch (e) {
                                console.error(e)
                            }
                        }

                        const potentialWithScroll = bot.locateItem(item, bot.items, { levelGreaterThan: lowestItemLevel, returnHighestLevel: true, statType: stat })
                        if (potentialWithScroll !== undefined) {
                            await bot.smartMove(getFor, { getWithin: 25 })
                            if (AL.Tools.squaredDistance(bot, getFor) > AL.Constants.NPC_INTERACTION_DISTANCE_SQUARED) {
                                // We're not near them, so they must have moved, return so we can try again next loop
                                return
                            }

                            // Send it and equip it
                            await bot.sendItem(getFor.id, potentialWithScroll)
                            const equipItem = getFor.locateItem(item, getFor.items, { levelGreaterThan: lowestItemLevel, returnHighestLevel: true, statType: stat })
                            await getFor.equip(equipItem, lowestItemSlot)

                            // Send the old item back to the merchant
                            await getFor.sendItem(bot.id, equipItem)
                        }
                    }

                    if (!bot.hasItem(item)) {
                        // Go to bank and see if we have one
                        await bot.smartMove(bankingPosition)
                        await withdrawItemFromBank(bot, item, { locked: false }, { freeSpaces: 2, itemsToHold: this.options.itemsToHold })
                        await bot.smartMove("main")
                    }

                    // Go to the upgrade NPC
                    if (!bot.hasItem(["computer", "supercomputer"])) {
                        await bot.smartMove("newupgrade", { getWithin: 25 })
                    }

                    // Buy if we need
                    if (bot.canBuy(item) && !bot.hasItem(item)) {
                        await bot.buy(item)
                    }

                    // Find the lowest level item, we'll upgrade that one
                    const lowestLevelPosition = bot.locateItem(item, bot.items, { returnLowestLevel: true })
                    if (lowestLevelPosition == undefined) return // We probably couldn't afford to buy one
                    const lowestLevel = bot.items[lowestLevelPosition].level

                    // Don't upgrade if it's already the level we want
                    if (lowestLevel < lowestItemLevel + 1) {
                        /** Find the scroll that corresponds with the grade of the item */
                        const grade = bot.calculateItemGrade(bot.items[lowestLevelPosition])
                        const scroll = `scroll${grade}` as ItemName

                        /** Buy a scroll if we don't have one */
                        let scrollPosition = bot.locateItem(scroll)
                        if (scrollPosition == undefined && bot.canBuy(scroll)) {
                            await bot.buy(scroll)
                            scrollPosition = bot.locateItem(scroll)
                        }

                        if (scrollPosition !== undefined) {
                            /** Speed up the upgrade if we can */
                            if (bot.canUse("massproduction")) await bot.massProduction()

                            /** Upgrade! */
                            await bot.upgrade(lowestLevelPosition, scrollPosition)
                            return
                        }
                    }
                }
            }

            if (this.options.enableDealFinder) {
                const merchants = await AL.PlayerModel.find({
                    lastSeen: { $gt: Date.now() - 120000 },
                    serverRegion: bot.serverData.region,
                    serverIdentifier: bot.serverData.name,
                    $or: [
                        { "slots.trade1": { $ne: undefined } },
                        { "slots.trade2": { $ne: undefined } },
                        { "slots.trade3": { $ne: undefined } },
                        { "slots.trade4": { $ne: undefined } },
                        { "slots.trade5": { $ne: undefined } },
                        { "slots.trade6": { $ne: undefined } },
                        { "slots.trade7": { $ne: undefined } },
                        { "slots.trade8": { $ne: undefined } },
                        { "slots.trade9": { $ne: undefined } },
                        { "slots.trade10": { $ne: undefined } },
                        { "slots.trade11": { $ne: undefined } },
                        { "slots.trade12": { $ne: undefined } },
                        { "slots.trade13": { $ne: undefined } },
                        { "slots.trade14": { $ne: undefined } },
                        { "slots.trade15": { $ne: undefined } },
                        { "slots.trade16": { $ne: undefined } },
                        { "slots.trade17": { $ne: undefined } },
                        { "slots.trade18": { $ne: undefined } },
                        { "slots.trade19": { $ne: undefined } },
                        { "slots.trade20": { $ne: undefined } },
                        { "slots.trade21": { $ne: undefined } },
                        { "slots.trade22": { $ne: undefined } },
                        { "slots.trade23": { $ne: undefined } },
                        { "slots.trade24": { $ne: undefined } },
                        { "slots.trade25": { $ne: undefined } },
                        { "slots.trade26": { $ne: undefined } },
                        { "slots.trade27": { $ne: undefined } },
                        { "slots.trade28": { $ne: undefined } },
                        { "slots.trade29": { $ne: undefined } },
                        { "slots.trade30": { $ne: undefined } },
                    ],
                }).lean().exec()
                const merchantsToCheck = merchants
                    .filter((v) => {
                        for (const slotName in v.slots) {
                            const slotData = v.slots[slotName as TradeSlotType]
                            if (!slotData) continue // No data

                            if (slotData.giveaway && !slotData.list.includes(bot.id)) return true // There's a giveaway we want to join on this merchant

                            if (!slotData.price) continue // Not a trade slot
                            if (slotData.b) continue // Buying, not selling
                            let priceToPay = DEFAULT_ITEMS_TO_BUY.get(slotData.name)
                            if (priceToPay < 0) priceToPay = (AL.Game.G.items[slotData.name].g / AL.Game.G.items[slotData.name].markup ?? 1) * -priceToPay
                            if (!priceToPay || slotData.price > priceToPay) continue // Not on our wishlist, or more than we want to pay

                            return true // There's something we want from this merchant
                        }
                    })
                if (merchantsToCheck.length > 0) {
                    const target = merchantsToCheck[0]
                    await bot.smartMove(target, { getWithin: 25 })
                    return
                }
            }

            if (this.options.enableInstanceProvider && bot.serverData.region === DEFAULT_REGION && bot.serverData.name === DEFAULT_IDENTIFIER) {
                for (const key in this.options.enableInstanceProvider) {
                    if (!checkOnlyEveryMS(`${bot.id}_instance_${key}`, 60_000)) continue // We've checked this recently
                    const map = key as MapName
                    const item = getKeyForCrypt(map)

                    const instanceMonster = await AL.EntityModel.findOne({
                        lastSeen: { $lt: Date.now() - 3.6e+6 },
                        map: map,
                        serverIdentifier: bot.serverData.name,
                        serverRegion: bot.serverData.region,
                    }).sort({
                        lastSeen: -1
                    }).lean().exec()

                    if (instanceMonster) {
                        // Check if the instance is still valid
                        try {
                            await bot.smartMove(instanceMonster)
                            if (bot.in === instanceMonster.in) {
                                // Update last seen for all monsters in this instance
                                await refreshCryptMonsters(bot)
                            } else {
                                // We opened a new instance
                                await addCryptMonstersToDB(bot)
                            }
                        } catch (e) {
                            // TODO: Remove the crypt ID from the database
                            console.error(e)
                        }
                    } else {
                        // We don't have any data to check
                        const instanceMonster = await AL.EntityModel.findOne({
                            map: map
                        }).sort({
                            lastSeen: -1
                        }).lean().exec()

                        if (!instanceMonster) {
                            // We don't have any instance monsters for this crypt, open one
                            if (!bot.hasItem(item)) {
                                // We don't have a key, check our bank for one
                                const items = new Set<ItemName>([...this.options.itemsToHold, item])
                                await bot.smartMove(bankingPosition)
                                await withdrawItemFromBank(bot, item, {}, {
                                    freeSpaces: bot.esize,
                                    itemsToHold: items
                                })
                            }

                            if (bot.hasItem(item)) {
                                try {
                                    // We have a key, let's go open a crypt
                                    await bot.smartMove(map)
                                    if (bot.map === map) {
                                        await addCryptMonstersToDB(bot)
                                    }
                                } catch (e) {
                                    console.error(e)
                                }
                            }
                        }
                    }
                }
            }

            // Go to our default position and wait for things to do
            await bot.smartMove(this.options.defaultPosition)
        } catch (e) {
            console.error(e)
        }
    }

    protected async debug(bot: Merchant, message: string) {
        if (!this.options.debug) return
        console.debug(`[${(new Date()).toISOString()}] [${bot.id}] DEBUG: ${message}`)
    }

    protected async mluck(bot: Merchant) {
        if (!bot.canUse("mluck")) return

        // mluck ourself
        if (this.options.enableMluck.self &&
            (!bot.s.mluck || bot.s.mluck.f !== bot.id)) {
            return bot.mluck(bot.id)
        }

        // mluck contexts
        if (this.options.enableMluck.contexts) {
            for (const context of filterContexts(this.contexts, { serverData: bot.serverData })) {
                const friend = context.bot
                if (Tools.distance(bot, friend) > AL.Game.G.skills.mluck.range) continue

                if (!friend.s.mluck) return bot.mluck(friend.id) // They don't have mluck
                if (friend.s.mluck.strong && friend.s.mluck.f !== bot.id) continue // We can't steal the mluck
                if (friend.s.mluck.f == "earthMer" && bot.id !== "earthMer" && bot.owner !== friend.owner) continue // Don't compete with earthMer

                if (friend.s.mluck.f == bot.id && friend.s.mluck.ms > (AL.Game.G.skills.mluck.duration / 2)) continue // They still have a lot of time left

                return bot.mluck(friend.id)
            }
        }

        // mluck others
        if (this.options.enableMluck.others) {
            for (const player of bot.getPlayers({ isNPC: false, withinRange: "mluck" })) {
                if (!player.s.mluck) return bot.mluck(player.id) // They don't have mluck
                if (player.s.mluck.strong && player.s.mluck.f !== bot.id) continue // We can't steal the mluck
                if (player.s.mluck.f == "earthMer" && bot.id !== "earthMer" && bot.owner !== player.owner) continue // Don't compete with earthMer

                if (player.s.mluck.f == bot.id && player.s.mluck.ms > (AL.Game.G.skills.mluck.duration / 2)) continue // They still have a lot of time left

                return bot.mluck(player.id)
            }
        }
    }

    protected async compound(bot: Merchant) {
        if (bot.map.startsWith("bank")) return // Can't compound in bank
        if (this.toUpgrade === undefined || this.toUpgrade.length == 0) return // Nothing to compound
        if (bot.s.penalty_cd && bot.map == "main") return // We recently moved through a door to main, we potentially just came out of the bank, and that's pretty glitchy

        for (let i = 0; i < this.toUpgrade.length; i++) {
            const indexes = this.toUpgrade[i]
            if (indexes.length !== 3) continue
            const item = bot.items[indexes[0]]
            if (!item) {
                this.toUpgrade.splice(i, 1)
                i--
                continue
            }
            const offering = getOfferingToUse(item)
            if (offering && !bot.hasItem(offering)) {
                this.debug(bot, `Compound - Offering - We don't have a '${offering}' to compound ${item.name}(${item.level})`)
                this.toUpgrade.splice(i, 1)
                i--
                continue
            }
            const grade = bot.calculateItemGrade(item)
            if (grade === undefined) {
                this.debug(bot, `Compound - Couldn't compute grade for ${item.name}`)
                this.toUpgrade.splice(i, 1)
                i--
                continue
            }
            const scroll = `cscroll${grade}` as ItemName
            if (!bot.hasItem(scroll)) {
                if (bot.canBuy(scroll)) {
                    this.debug(bot, `Compound - Scroll - Buying '${scroll}' to compound ${item.name}(${item.level})`)
                    return bot.buy(scroll)
                } else {
                    this.debug(bot, `Compound - Scroll - We don't have a '${scroll}' to compound ${item.name}(${item.level})`)
                    this.toUpgrade.splice(i, 1)
                    i--
                    continue
                }
            }
            this.debug(bot, `Compounding ${item.name}(${item.level})`)
            this.toUpgrade.splice(i, 1)
            i--
            if (bot.canUse("massproduction")) await bot.massProduction()
            return bot.compound(indexes[0], indexes[1], indexes[2], bot.locateItem(scroll), offering ? bot.locateItem(offering) : undefined)
        }
    }

    protected async upgrade(bot: Merchant) {
        if (bot.map.startsWith("bank")) return // Can't upgrade in bank
        if (this.toUpgrade === undefined || this.toUpgrade.length == 0) return // Nothing to upgrade
        if (bot.s.penalty_cd && bot.map == "main") return // We recently moved through a door to main, we potentially just came out of the bank, and that's pretty glitchy

        for (let i = 0; i < this.toUpgrade.length; i++) {
            const indexes = this.toUpgrade[i]
            if (indexes.length !== 1) continue
            const item = bot.items[indexes[0]]
            if (!item) {
                this.debug(bot, "Upgrade - Item went missing")
                this.toUpgrade.splice(i, 1)
                i--
                continue
            }
            const offering = getOfferingToUse(item)
            if (offering && !bot.hasItem(offering)) {
                this.debug(bot, `Upgrade - Offering - We don't have a '${offering}' to upgrade ${item.name}(${item.level})`)
                this.toUpgrade.splice(i, 1)
                i--
                continue
            }
            const grade = bot.calculateItemGrade(item)
            if (grade === undefined) {
                this.debug(bot, `Upgrade - Couldn't compute grade for ${item.name}`)
                this.toUpgrade.splice(i, 1)
                i--
                continue
            }
            const scroll = `scroll${grade}` as ItemName
            if (!bot.hasItem(scroll)) {
                if (bot.canBuy(scroll)) {
                    this.debug(bot, `Upgrade - Scroll - Buying '${scroll}' to upgrade ${item.name}(${item.level})`)
                    return bot.buy(scroll)
                } else {
                    this.debug(bot, `Upgrade - Scroll - We don't have a '${scroll}' to upgrade ${item.name}(${item.level})`)
                    this.toUpgrade.splice(i, 1)
                    i--
                    continue
                }
            }
            this.debug(bot, `Upgrading ${item.name}(${item.level})`)
            this.toUpgrade.splice(i, 1)
            if (bot.canUse("massproduction")) await bot.massProduction()
            return bot.upgrade(indexes[0], bot.locateItem(scroll), offering ? bot.locateItem(offering) : undefined)
        }
    }
}

export async function startMerchant(context: Strategist<Merchant>, friends: Strategist<PingCompensatedCharacter>[], options?: MerchantMoveStrategyOptions) {
    const itemsToBuy = new Map<ItemName, number>(DEFAULT_ITEMS_TO_BUY.entries())
    for (const [itemName, price] of itemsToBuy) {
        if (price < 0) {
            const gItem = AL.Game.G.items[itemName]
            itemsToBuy.set(itemName, gItem.g * (-price))
        }
    }

    for (const iN in AL.Game.G.items) {
        const itemName = iN as ItemName
        const gItem = AL.Game.G.items[itemName]
        if (itemsToBuy.has(itemName)) continue // Price is already set

        if (gItem.e) {
            // Buy all exchangables
            itemsToBuy.set(itemName, gItem.g * AL.Constants.PONTY_MARKUP)
            continue
        }

        if (gItem.type == "token") {
            // Buy all tokens
            itemsToBuy.set(itemName, gItem.g * AL.Constants.PONTY_MARKUP)
            continue
        }

        if (gItem.type == "bank_key" || gItem.type == "dungeon_key") {
            // Buy all keys
            itemsToBuy.set(itemName, gItem.g * AL.Constants.PONTY_MARKUP)
            continue
        }

        if (gItem.tier >= 4) {
            // Buy all super high tier items
            itemsToBuy.set(itemName, gItem.g * AL.Constants.PONTY_MARKUP)
            continue
        }

        if (gItem.name.includes("Darkforge")) {
            // Buy all darkforge items
            itemsToBuy.set(itemName, gItem.g * AL.Constants.PONTY_MARKUP)
            continue
        }

        // TODO: Add more logic for things to buy
    }

    context.applyStrategy(new BuyStrategy({
        contexts: friends,
        buyMap: itemsToBuy,
        enableBuyForProfit: true
    }))
    context.applyStrategy(new AvoidDeathStrategy())
    context.applyStrategy(new MerchantStrategy(friends, options))
    context.applyStrategy(new TrackerStrategy())
    context.applyStrategy(new AcceptPartyRequestStrategy())
    context.applyStrategy(new BaseAttackStrategy({
        contexts: friends,
        disableBasicAttack: true
    }))
    context.applyStrategy(new ToggleStandStrategy({
        offWhenMoving: true,
        onWhenNear: [
            { distance: 10, position: options.defaultPosition }
        ]
    }))
}
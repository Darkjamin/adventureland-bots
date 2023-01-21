import AL, { ItemName, Merchant, PingCompensatedCharacter, Priest, Mage, Warrior, ServerRegion, ServerIdentifier, MonsterName, ServerInfoDataLive, CharacterType, Paladin, Ranger, Rogue } from "alclient"
import { DEFAULT_ITEMS_TO_HOLD, DEFAULT_MERCHANT_ITEMS_TO_HOLD, DEFAULT_MERCHANT_MOVE_STRATEGY_OPTIONS, DEFAULT_REPLENISHABLES, DEFAULT_REPLENISH_RATIO, startMerchant } from "./merchant/strategy.js"
import { Strategist, Strategy } from "./strategy_pattern/context.js"
import { BaseStrategy } from "./strategy_pattern/strategies/base.js"
import { BuyStrategy } from "./strategy_pattern/strategies/buy.js"
import { FinishMonsterHuntStrategy, GetHolidaySpiritStrategy, GetMonsterHuntStrategy } from "./strategy_pattern/strategies/move.js"
import { AcceptPartyRequestStrategy, RequestPartyStrategy } from "./strategy_pattern/strategies/party.js"
import { RespawnStrategy } from "./strategy_pattern/strategies/respawn.js"
import { TrackerStrategy } from "./strategy_pattern/strategies/tracker.js"
import { ElixirStrategy } from "./strategy_pattern/strategies/elixir.js"
import { PartyHealStrategy } from "./strategy_pattern/strategies/partyheal.js"
import { Config, constructHelperSetups, constructSetups, Setups } from "./strategy_pattern/setups/base.js"
import { DebugStrategy } from "./strategy_pattern/strategies/debug.js"
import { getHalloweenMonsterPriority, getHolidaySeasonMonsterPriority, getLunarNewYearMonsterPriority, getServerHopMonsterPriority } from "./base/serverhop.js"
import { randomIntFromInterval, sleep } from "./base/general.js"
import { SellStrategy } from "./strategy_pattern/strategies/sell.js"
import { MagiportOthersSmartMovingToUsStrategy } from "./strategy_pattern/strategies/magiport.js"

import bodyParser from "body-parser"
import cors from "cors"
import express from "express"
import path from "path"
import { body, validationResult } from "express-validator"
import { ChargeStrategy } from "./strategy_pattern/strategies/charge.js"
import { GuiStrategy } from "./strategy_pattern/strategies/gui.js"
import { OptimizeItemsStrategy } from "./strategy_pattern/strategies/item.js"
import { AvoidStackingStrategy } from "./strategy_pattern/strategies/avoid_stacking.js"
import { GiveRogueSpeedStrategy } from "./strategy_pattern/strategies/rspeed.js"

await Promise.all([AL.Game.loginJSONFile("../credentials.json"), AL.Game.getGData(true)])
await AL.Pathfinder.prepare(AL.Game.G, { cheat: true })

// TODO: Make these configurable through /comm using a similar system to how lulz works
// Toggles
const ENABLE_EVENTS = true
const ENABLE_SERVER_HOPS = true
const ENABLE_SPECIAL_MONSTERS = true
const ENABLE_MONSTERHUNTS = true
const DEFAULT_MONSTER: MonsterName = "bee"
const SPECIAL_MONSTERS: MonsterName[] = ["crabxx", "cutebee", "franky", "fvampire", "goldenbat", "greenjr", "icegolem", "jr", "mvampire", "skeletor", "snowman", "stompy", "tinyp"]
const MAX_PUBLIC_CHARACTERS = 6

const MERCHANT = "earthMer"
const WARRIOR = "earthWar"
const MAGE = "earthMag"
const PRIEST = "earthPri"

const PARTY_LEADER = "earthWar"
const PARTY_ALLOWLIST = ["earthiverse", "earthMag", "earthPri", "earthWar"]

const DEFAULT_REGION: ServerRegion = "US"
const DEFAULT_IDENTIFIER: ServerIdentifier = "I"
let TARGET_REGION: ServerRegion = DEFAULT_REGION
let TARGET_IDENTIFIER: ServerIdentifier = DEFAULT_IDENTIFIER

/** My characters */
const PRIVATE_CONTEXTS: Strategist<PingCompensatedCharacter>[] = []
// /** Others that have joined */
const PUBLIC_CONTEXTS: Strategist<PingCompensatedCharacter>[] = []
/** All contexts */
const ALL_CONTEXTS: Strategist<PingCompensatedCharacter>[] = []

const guiStrategy = new GuiStrategy({ port: 8080 })
const baseStrategy = new BaseStrategy(ALL_CONTEXTS)
const privateBuyStrategy = new BuyStrategy({
    buyMap: undefined,
    enableBuyForProfit: true,
    replenishables: new Map<ItemName, number>([
        ["hpot1", 2500],
        ["mpot1", 2500],
        ["xptome", 1],
    ])
})
const publicBuyStrategy = new BuyStrategy({
    buyMap: undefined,
    replenishables: new Map<ItemName, number>([
        ["hpot1", 2500],
        ["mpot1", 2500],
        ["xptome", 1],
    ])
})

const privateSellStrategy = new SellStrategy({
    sellMap: new Map<ItemName, [number, number][]>([
        ["cclaw", undefined],
        ["coat1", undefined],
        ["dexring", undefined],
        ["gloves1", undefined],
        ["gphelmet", undefined],
        ["helmet1", undefined],
        ["hpamulet", undefined],
        ["hpbelt", undefined],
        ["iceskates", undefined],
        ["intring", undefined],
        ["intearring", undefined],
        ["monstertoken", [
            [undefined, 500_000]
        ]],
        ["mushroomstaff", undefined],
        ["pants1", undefined],
        ["phelmet", undefined],
        ["pickaxe", [
            [0, 1_000_000]
        ]],
        ["ringsj", undefined],
        ["rod", [
            [0, 1_000_000]
        ]],
        ["shoes1", undefined],
        ["slimestaff", undefined],
        ["snowball", undefined],
        ["stand0", undefined],
        ["stramulet", undefined],
        ["strearring", undefined],
        ["vitearring", undefined],
        ["vitring", undefined],
        ["xmace", undefined],
    ])
})
const publicSellStrategy = new SellStrategy({
    sellMap: new Map<ItemName, [number, number][]>([
        ["coat1", undefined],
        ["gloves1", undefined],
        ["gphelmet", undefined],
        ["helmet1", undefined],
        ["hpamulet", undefined],
        ["hpbelt", undefined],
        ["iceskates", undefined],
        ["pants1", undefined],
        ["phelmet", undefined],
        ["shoes1", undefined],
        ["stramulet", undefined],
        ["vitearring", undefined],
    ])
})

//// Strategies
// Debug
const debugStrategy = new DebugStrategy({
    logLimitDCReport: true
})
// Movement
const avoidStackingStrategy = new AvoidStackingStrategy()
const getHolidaySpiritStrategy = new GetHolidaySpiritStrategy()
const finishMonsterHuntStrategy = new FinishMonsterHuntStrategy()
const getMonsterHuntStrategy = new GetMonsterHuntStrategy()
// Party
const partyAcceptStrategy = new AcceptPartyRequestStrategy(/** TODO: TEMP: Allow anyone to join { allowList: PARTY_ALLOWLIST } */)
const partyRequestStrategy = new RequestPartyStrategy(PARTY_LEADER)
// Mage
const privateMagiportStrategy = new MagiportOthersSmartMovingToUsStrategy(PRIVATE_CONTEXTS)
const publicMagiportStrategy = new MagiportOthersSmartMovingToUsStrategy(ALL_CONTEXTS)
// Priest
const privatePartyHealStrategy = new PartyHealStrategy(PRIVATE_CONTEXTS)
const publicPartyHealStrategy = new PartyHealStrategy(ALL_CONTEXTS)
const trackerStrategy = new TrackerStrategy()
const respawnStrategy = new RespawnStrategy()
// Rogue
const rspeedStrategy = new GiveRogueSpeedStrategy()
// Warrior
const chargeStrategy = new ChargeStrategy()
// Setups
const privateSetups = constructSetups(ALL_CONTEXTS)
const publicSetups = constructHelperSetups(ALL_CONTEXTS)
// Etc.
const elixirStrategy = new ElixirStrategy("elixirluck")
const itemStrategy = new OptimizeItemsStrategy()

const currentSetups = new Map<Strategist<PingCompensatedCharacter>, { attack: Strategy<PingCompensatedCharacter>, move: Strategy<PingCompensatedCharacter> }>()
const applySetups = async (contexts: Strategist<PingCompensatedCharacter>[], setups: Setups) => {
    // Setup a list of ready contexts
    const setupContexts = [...contexts]
    for (let i = 0; i < setupContexts.length; i++) {
        const context = setupContexts[i]
        if (!context.isReady()) {
            setupContexts.splice(i, 1)
            i--
        }
    }
    if (setupContexts.length == 0) return

    const isDoable = (config: Config): Strategist<PingCompensatedCharacter>[] | false => {
        const tempContexts = [...setupContexts]
        const doableWith: Strategist<PingCompensatedCharacter>[] = []
        nextConfig:
        for (const characterConfig of config.characters) {
            for (let i = 0; i < tempContexts.length; i++) {
                const context = tempContexts[i]
                if (context.bot.ctype == characterConfig.ctype) {
                    doableWith.push(context)
                    tempContexts.splice(i, 1)
                    continue nextConfig
                }
            }
            return false // Not doable
        }
        return doableWith
    }

    const applyConfig = (config: Config): boolean => {
        const doableWith = isDoable(config)
        if (!doableWith) return false// Not doable
        nextConfig:
        for (const characterConfig of config.characters) {
            for (const context of doableWith) {
                if (context.bot.ctype == characterConfig.ctype) {
                    const current = currentSetups.get(context)

                    if (current) {
                        // Swap the strategies
                        if (current.attack !== characterConfig.attack) {
                            context.removeStrategy(current.attack)
                            context.applyStrategy(characterConfig.attack)
                        }
                        if (current.move !== characterConfig.move) {
                            context.removeStrategy(current.move)

                            // Stop smart moving if we are, so we can do the new strategy movement quicker
                            if (context.bot.smartMoving) context.bot.stopSmartMove().catch(console.error)

                            context.applyStrategy(characterConfig.move)
                        }
                    } else {
                        // Apply the strategy
                        context.applyStrategy(characterConfig.attack)
                        context.applyStrategy(characterConfig.move)
                    }

                    currentSetups.set(context, { attack: characterConfig.attack, move: characterConfig.move })
                    setupContexts.splice(setupContexts.indexOf(context), 1)
                    continue nextConfig
                }
            }
        }
        return true
    }

    // Priority of targets
    const priority: MonsterName[] = []

    if (ENABLE_EVENTS) {
        for (const context of contexts) {
            // Goobrawl
            if (
                (
                    // Can join
                    context.bot.S.goobrawl
                    && !context.bot.s.hopsickness
                    && !context.bot.map.startsWith("bank")
                ) || (
                    // Already there
                    context.bot.map == "goobrawl"
                    && context.bot.getEntity({ typeList: ["rgoo", "bgoo"] })
                )
            ) {
                priority.push("rgoo")
            }

            // Halloween
            if (context.bot.S.halloween) {
                if ((context.bot.S.mrgreen as ServerInfoDataLive)?.live) {
                    if ((context.bot.S.mrpumpkin as ServerInfoDataLive)?.live) {
                        // Both are alive, target the lower hp one
                        if ((context.bot.S.mrgreen as ServerInfoDataLive).hp > (context.bot.S.mrpumpkin as ServerInfoDataLive).hp) {
                            priority.push("mrpumpkin")
                        } else {
                            priority.push("mrgreen")
                        }
                    } else {
                        // Only mrgreen is alive
                        priority.push("mrgreen")
                    }
                } else if ((context.bot.S.mrpumpkin as ServerInfoDataLive)?.live) {
                    // Only mrpumpkin is alive
                    priority.push("mrpumpkin")
                }
            }

            // Christmas
            if (context.bot.S.holidayseason) {
                if ((context.bot.S.grinch as ServerInfoDataLive)?.live) priority.push("grinch")
            }

            // Lunar New Year
            if (context.bot.S.lunarnewyear) {
                if ((context.bot.S.dragold as ServerInfoDataLive)?.live) priority.push("dragold")
                if (
                    (context.bot.S.tiger as ServerInfoDataLive)?.live
                    && context.bot.serverData.name == DEFAULT_IDENTIFIER
                    && context.bot.serverData.region == DEFAULT_REGION
                ) priority.push("tiger")
            }
        }
    }

    if (ENABLE_SPECIAL_MONSTERS) {
        for (const context of contexts) {
            for (const specialMonster of context.bot.getEntities({
                couldGiveCredit: true,
                typeList: SPECIAL_MONSTERS
            })) {
                if (
                    specialMonster.s?.fullguard?.ms > 30000
                    || specialMonster.s?.fullguardx?.ms > 30000
                ) {
                    // Can't damage for another 30s
                    continue
                }
                priority.push(specialMonster.type)
            }

            for (const specialMonster of await AL.EntityModel.find({
                $and: [{
                    $or: [
                        { target: undefined },
                        { target: { $in: PARTY_ALLOWLIST } },
                        { type: { $in: ["phoenix", "pinkgoo", "snowman", "wabbit"] } } // Coop monsters will give credit
                    ]
                }, {
                    $or: [
                        { "s.fullguardx": undefined },
                        { "s.fullguardx.ms": { $lt: 30000 } }
                    ],
                }, {
                    $or: [
                        { "s.fullguard": undefined },
                        { "s.fullguard.ms": { $lt: 30000 } }
                    ]
                }],
                lastSeen: { $gt: Date.now() - 30000 },
                serverIdentifier: context.bot.serverData.name,
                serverRegion: context.bot.serverData.region,
                type: { $in: SPECIAL_MONSTERS }
            }, {
                type: 1
            }).lean().exec()) {
                priority.push(specialMonster.type)
            }
        }
    }

    if (ENABLE_MONSTERHUNTS && TARGET_REGION == DEFAULT_REGION && TARGET_IDENTIFIER == DEFAULT_IDENTIFIER) {
        for (const _context of contexts) {
            for (const contexts2 of [PRIVATE_CONTEXTS, PUBLIC_CONTEXTS]) {
                const monsterhunts: {
                    ms: number
                    id: MonsterName
                }[] = []
                for (const context2 of contexts2) {
                    if (!context2.isReady()) continue
                    const bot2 = context2.bot
                    if (!bot2.s.monsterhunt || bot2.s.monsterhunt.c == 0) continue
                    monsterhunts.push(bot2.s.monsterhunt)
                }

                monsterhunts.sort((a, b) => a.ms - b.ms) // Lower time remaining first

                for (const monsterhunt of monsterhunts) {
                    priority.push(monsterhunt.id)
                }
            }
        }
    }

    // Default targets
    for (const _context of contexts) {
        priority.push(DEFAULT_MONSTER)
    }

    for (const id of priority) {
        if (setupContexts.length == 0) break // All set up
        const setup = setups[id]
        if (!setup) continue // No setup for current

        for (const config of setup.configs) {
            if (applyConfig(config)) {
                break // We found a config that works
            }
        }
    }
}

const removeSetup = (context: Strategist<PingCompensatedCharacter>) => {
    const current = currentSetups.get(context)

    if (current) {
        context.removeStrategy(current.attack)
        context.removeStrategy(current.move)
        currentSetups.delete(context)
    }
}

const contextsLogic = async (contexts: Strategist<PingCompensatedCharacter>[], setups: Setups) => {
    try {
        const freeContexts: Strategist<PingCompensatedCharacter>[] = []

        // Check for server hop
        const bot1 = contexts[0]?.bot
        if (!bot1) return
        if (ENABLE_SERVER_HOPS) {
            // Default
            TARGET_REGION = DEFAULT_REGION
            TARGET_IDENTIFIER = DEFAULT_IDENTIFIER

            // Halloween
            if (bot1.S.halloween) {
                const monster = (await getHalloweenMonsterPriority(true))[0]
                if (monster) {
                    // We want to switch servers
                    TARGET_IDENTIFIER = monster.serverIdentifier
                    TARGET_REGION = monster.serverRegion
                }
            }

            // Christmas
            if (bot1.S.holidayseason) {
                const monster = (await getHolidaySeasonMonsterPriority(true))[0]
                if (monster) {
                    // We want to switch servers
                    TARGET_IDENTIFIER = monster.serverIdentifier
                    TARGET_REGION = monster.serverRegion
                }
            }

            // Lunar New Year
            if (bot1.S.lunarnewyear) {
                const monster = (await getLunarNewYearMonsterPriority(true))[0]
                if (monster) {
                    // We want to switch servers
                    TARGET_IDENTIFIER = monster.serverIdentifier
                    TARGET_REGION = monster.serverRegion
                }
            }

            // Everyday
            if (TARGET_REGION !== DEFAULT_REGION || TARGET_IDENTIFIER !== DEFAULT_IDENTIFIER) {
                const monster = (await getServerHopMonsterPriority(true)[0])
                if (monster) {
                    // We want to switch servers
                    TARGET_IDENTIFIER = monster.serverIdentifier
                    TARGET_REGION = monster.serverRegion
                }
            }
        }

        for (const context of contexts) {
            if (!context.isReady()) continue
            const bot = context.bot

            if (
                context.uptime() > 60_000
                && (bot.serverData.region !== TARGET_REGION || bot.serverData.name !== TARGET_IDENTIFIER)
            ) {
                await sleep(1000)
                console.log(bot.id, "is changing server from", bot.serverData.region, bot.serverData.name, "to", TARGET_REGION, TARGET_IDENTIFIER)
                context.changeServer(TARGET_REGION, TARGET_IDENTIFIER).catch(console.error)
                continue
            }

            if (bot.ctype == "merchant") continue

            if (ENABLE_MONSTERHUNTS && bot.serverData.region == DEFAULT_REGION && bot.serverData.name == DEFAULT_IDENTIFIER) {
                // Get a monster hunt
                if (!bot.s.monsterhunt) {
                    removeSetup(context)
                    context.applyStrategy(getMonsterHuntStrategy)
                    continue
                }

                // Turn in our monster hunt
                if (bot.s.monsterhunt?.c == 0) {
                    const [region, id] = bot.s.monsterhunt.sn.split(" ") as [ServerRegion, ServerIdentifier]
                    if (region == bot.serverData.region && id == bot.serverData.name) {
                        removeSetup(context)
                        context.applyStrategy(finishMonsterHuntStrategy)
                        continue
                    }
                }
            }

            // TODO: Add go to bank if full logic

            // Holiday spirit
            if (bot.S.holidayseason && !bot.s.holidayspirit) {
                removeSetup(context)
                context.applyStrategy(getHolidaySpiritStrategy)
                continue
            }

            freeContexts.push(context)
        }

        await applySetups(freeContexts, setups)
    } catch (e) {
        console.error(e)
    } finally {
        setTimeout(contextsLogic, 1000, contexts, setups)
    }
}
contextsLogic(PRIVATE_CONTEXTS, privateSetups)
contextsLogic(PUBLIC_CONTEXTS, publicSetups)

// Shared setup
async function startShared(context: Strategist<PingCompensatedCharacter>, privateContext = false) {
    context.applyStrategy(debugStrategy)
    context.applyStrategy(guiStrategy)
    if (context.bot.id == PARTY_LEADER) {
        context.applyStrategy(partyAcceptStrategy)
    } else {
        context.applyStrategy(partyRequestStrategy)
    }

    if (privateContext) {
        context.applyStrategy(privateBuyStrategy)
        context.applyStrategy(privateSellStrategy)
    } else {
        context.applyStrategy(publicBuyStrategy)
        context.applyStrategy(publicSellStrategy)
    }

    context.applyStrategy(avoidStackingStrategy)
    context.applyStrategy(respawnStrategy)
    context.applyStrategy(trackerStrategy)
    context.applyStrategy(elixirStrategy)
    context.applyStrategy(itemStrategy)
}

async function startMage(context: Strategist<Mage>, privateContext = false) {
    startShared(context, privateContext)
    if (privateContext) {
        context.applyStrategy(privateMagiportStrategy)
    } else {
        context.applyStrategy(publicMagiportStrategy)
    }
}

async function startPaladin(context: Strategist<Paladin>, privateContext = false) {
    startShared(context, privateContext)
}

async function startPriest(context: Strategist<Priest>, privateContext = false) {
    startShared(context, privateContext)
    if (privateContext) {
        context.applyStrategy(privatePartyHealStrategy)
    } else {
        context.applyStrategy(publicPartyHealStrategy)
    }
}

async function startRanger(context: Strategist<Ranger>, privateContext = false) {
    startShared(context, privateContext)
}

async function startRogue(context: Strategist<Rogue>, privateContext = false) {
    startShared(context, privateContext)
    context.applyStrategy(rspeedStrategy)
}

// Warrior setup
async function startWarrior(context: Strategist<Warrior>, privateContext = false) {
    context.applyStrategy(chargeStrategy)
    startShared(context, privateContext)
}

// Start my characters
const startMerchantContext = async () => {
    let merchant: Merchant
    try {
        merchant = await AL.Game.startMerchant(MERCHANT, TARGET_REGION, TARGET_IDENTIFIER)
    } catch (e) {
        if (merchant) merchant.disconnect()
        console.error(e)
        setTimeout(startMerchantContext, 10_000)
    }
    const CONTEXT = new Strategist<Merchant>(merchant, baseStrategy)
    startMerchant(CONTEXT, PRIVATE_CONTEXTS, { ...DEFAULT_MERCHANT_MOVE_STRATEGY_OPTIONS, debug: true, enableUpgrade: true })
    CONTEXT.applyStrategy(guiStrategy)
    CONTEXT.applyStrategy(privateSellStrategy)
    PRIVATE_CONTEXTS.push(CONTEXT)
    ALL_CONTEXTS.push(CONTEXT)
}
startMerchantContext()

const startWarriorContext = async () => {
    let warrior: Warrior
    try {
        warrior = await AL.Game.startWarrior(WARRIOR, TARGET_REGION, TARGET_IDENTIFIER)
    } catch (e) {
        if (warrior) warrior.disconnect()
        console.error(e)
        setTimeout(startWarriorContext, 10_000)
    }
    const CONTEXT = new Strategist<Warrior>(warrior, baseStrategy)
    startWarrior(CONTEXT, true).catch(console.error)
    PRIVATE_CONTEXTS.push(CONTEXT)
    ALL_CONTEXTS.push(CONTEXT)
}
startWarriorContext()

const startMageContext = async () => {
    let mage: Mage
    try {
        mage = await AL.Game.startMage(MAGE, TARGET_REGION, TARGET_IDENTIFIER)
    } catch (e) {
        if (mage) mage.disconnect()
        console.error(e)
        setTimeout(startMageContext, 10_000)
    }
    const CONTEXT = new Strategist<Mage>(mage, baseStrategy)
    startMage(CONTEXT, true).catch(console.error)
    PRIVATE_CONTEXTS.push(CONTEXT)
    ALL_CONTEXTS.push(CONTEXT)
}
startMageContext()

const startPriestContext = async () => {
    let priest: Priest
    try {
        priest = await AL.Game.startPriest(PRIEST, TARGET_REGION, TARGET_IDENTIFIER)
    } catch (e) {
        if (priest) priest.disconnect()
        console.error(e)
        setTimeout(startPriestContext, 10_000)
    }
    const CONTEXT = new Strategist<Priest>(priest, baseStrategy)
    startPriest(CONTEXT, true).catch(console.error)
    PRIVATE_CONTEXTS.push(CONTEXT)
    ALL_CONTEXTS.push(CONTEXT)
}
startPriestContext()

class DisconnectOnCommandStrategy implements Strategy<PingCompensatedCharacter> {
    private onCodeEval: (data: string) => Promise<void>

    public onApply(bot: PingCompensatedCharacter) {
        this.onCodeEval = async (data: string) => {
            data = data.toLowerCase()
            if (data == "stop" || data == "disconnect") {
                if (PARTY_ALLOWLIST.includes(bot.id)) {
                    // Don't allow them to party with us anymore
                    PARTY_ALLOWLIST.splice(PARTY_ALLOWLIST.indexOf(bot.id), 1)
                }
                stopPublicContext(bot.characterID).catch(console.error)
            }
        }

        bot.socket.on("code_eval", this.onCodeEval)
    }

    public onRemove(bot: PingCompensatedCharacter) {
        if (this.onCodeEval) bot.socket.removeListener("code_eval", this.onCodeEval)
    }
}
const disconnectOnCommandStrategy = new DisconnectOnCommandStrategy()

// Allow others to join me
const startPublicContext = async (type: CharacterType, userID: string, userAuth: string, characterID: string) => {
    // Checks
    if (type == "merchant") {
        for (const context of PUBLIC_CONTEXTS) {
            const character = context.bot
            if (character.owner == characterID) throw `There is a merchant with the ID '${characterID}' (${character.id}) already running. You can only run one merchant.`
        }
    } else {
        let numChars = 0
        for (const context of PUBLIC_CONTEXTS) {
            const character = context.bot
            if (character.ctype == "merchant") continue // Merchants don't count
            numChars++
        }
        if (numChars >= MAX_PUBLIC_CHARACTERS) throw `Too many characters are already running (We only support ${MAX_PUBLIC_CHARACTERS} characters simultaneously)`
        for (const context of PUBLIC_CONTEXTS) {
            const character = context.bot
            if (character.characterID == characterID) throw `There is a character with the ID '${characterID}' (${character.id}) already running. Stop the character first to change its settings.`
        }
    }

    let bot: PingCompensatedCharacter
    try {
        switch (type) {
            case "mage": {
                bot = new AL.Mage(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
            case "merchant": {
                bot = new AL.Merchant(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
            case "paladin": {
                bot = new AL.Paladin(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
            case "priest": {
                bot = new AL.Priest(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
            case "ranger": {
                bot = new AL.Ranger(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
            case "rogue": {
                bot = new AL.Rogue(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
            case "warrior": {
                bot = new AL.Warrior(userID, userAuth, characterID, AL.Game.G, AL.Game.servers[TARGET_REGION][TARGET_IDENTIFIER])
                break
            }
        }
        await bot.connect()
    } catch (e) {
        if (bot) bot.disconnect()
        console.error(e)
        setTimeout(startPublicContext, 10_000, type, userID, userAuth, characterID)
        return
    }
    let context: Strategist<PingCompensatedCharacter>
    switch (type) {
        case "mage": {
            context = new Strategist<Mage>(bot as Mage, baseStrategy)
            startMage(context as Strategist<Mage>).catch(console.error)
            break
        }
        case "merchant": {
            context = new Strategist<Merchant>(bot as Merchant, baseStrategy)
            startMerchant(context as Strategist<Merchant>, PUBLIC_CONTEXTS, {
                defaultPosition: {
                    map: "main",
                    x: randomIntFromInterval(-50, 50),
                    y: randomIntFromInterval(-50, 50)
                },
                // enableBuyAndUpgrade: {
                //     upgradeToLevel: 9
                // },
                enableBuyReplenishables: {
                    all: DEFAULT_REPLENISHABLES,
                    merchant: new Map([
                        ["offering", 1],
                        ["cscroll0", 100],
                        ["cscroll1", 10],
                        ["cscroll2", 2],
                        ["scroll0", 100],
                        ["scroll1", 10],
                        ["scroll2", 2],
                    ]),
                    ratio: DEFAULT_REPLENISH_RATIO,
                },
                enableFishing: true,
                enableMining: true,
                enableOffload: {
                    esize: 3,
                    goldToHold: 1_000_000,
                    itemsToHold: DEFAULT_ITEMS_TO_HOLD,
                },
                enableUpgrade: true,
                goldToHold: 50_000_000,
                itemsToHold: DEFAULT_MERCHANT_ITEMS_TO_HOLD,
            })
            context.applyStrategy(privateSellStrategy)
            break
        }
        case "paladin": {
            context = new Strategist<Paladin>(bot as Paladin, baseStrategy)
            startPaladin(context as Strategist<Paladin>).catch(console.error)
            break
        }
        case "priest": {
            context = new Strategist<Priest>(bot as Priest, baseStrategy)
            startPriest(context as Strategist<Priest>).catch(console.error)
            break
        }
        case "ranger": {
            context = new Strategist<Ranger>(bot as Ranger, baseStrategy)
            startRanger(context as Strategist<Ranger>).catch(console.error)
            break
        }
        case "rogue": {
            context = new Strategist<Rogue>(bot as Rogue, baseStrategy)
            startRogue(context as Strategist<Rogue>).catch(console.error)
            break
        }
        case "warrior": {
            context = new Strategist<Warrior>(bot as Warrior, baseStrategy)
            startWarrior(context as Strategist<Warrior>).catch(console.error)
            break
        }
    }
    if (PARTY_ALLOWLIST.indexOf(bot.id) < 0) PARTY_ALLOWLIST.push(bot.id)
    context.applyStrategy(disconnectOnCommandStrategy)
    PUBLIC_CONTEXTS.push(context)
    ALL_CONTEXTS.push(context)
}

async function stopPublicContext(characterID: string) {
    let context: Strategist<PingCompensatedCharacter>
    for (const find of PUBLIC_CONTEXTS) {
        if (find.bot.characterID !== characterID) continue
        context = find
        break
    }

    const publicIndex = PUBLIC_CONTEXTS.indexOf(context)
    const allIndex = ALL_CONTEXTS.indexOf(context)

    context.stop()
    PUBLIC_CONTEXTS.splice(publicIndex, 1)
    ALL_CONTEXTS.splice(allIndex, 1)
}

const app = express()
app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
const port = 80

app.get("/", (_req, res) => {
    res.sendFile(path.join(path.resolve(), "/earthiverse.html"))
})

app.post("/",
    body("user").trim().isLength({ max: 16, min: 16 }).withMessage("User IDs are exactly 16 digits."),
    body("user").trim().isNumeric().withMessage("User IDs are numeric."),
    body("auth").trim().isLength({ max: 21, min: 21 }).withMessage("Auth codes are exactly 21 characters."),
    body("auth").trim().isAlphanumeric("en-US", { ignore: /\s/ }).withMessage("Auth codes are alphanumeric."),
    body("char").trim().isLength({ max: 16, min: 16 }).withMessage("Character IDs are exactly 16 digits."),
    body("char").trim().isNumeric().withMessage("Character IDs are numeric."),
    body("char_type").trim().matches(/\b(?:mage|merchant|paladin|priest|ranger|rogue|warrior)\b/).withMessage("Character type not supported."),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const charType = req.body.char_type.trim()
            const userID = req.body.user.trim()
            const userAuth = req.body.auth.trim()
            const characterID = req.body.char.trim()
            startPublicContext(charType, userID, userAuth, characterID).catch(console.error)
            return res.status(200).send("Go to https://adventure.land/comm to observer your character.")
        } catch (e) {
            return res.status(500).send(e)
        }
    })

app.listen(port, async () => {
    console.log(`Ready on port ${port}!`)
})
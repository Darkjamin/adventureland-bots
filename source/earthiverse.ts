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
import { getHalloweenMonsterPriority } from "./base/serverhop.js"
import { randomIntFromInterval, sleep } from "./base/general.js"
import { SellStrategy } from "./strategy_pattern/strategies/sell.js"
import { MagiportOthersSmartMovingToUsStrategy } from "./strategy_pattern/strategies/magiport.js"

import bodyParser from "body-parser"
import cors from "cors"
import express from "express"
import path from "path"
import { body, validationResult } from "express-validator"
import { ChargeStrategy } from "./strategy_pattern/strategies/charge.js"

await Promise.all([AL.Game.loginJSONFile("../credentials.json"), AL.Game.getGData(true)])
await AL.Pathfinder.prepare(AL.Game.G, { cheat: true })

// TODO: Make these configurable through /comm using a similar system to how lulz works
// Toggles
const ENABLE_EVENTS = true
const ENABLE_SERVER_HOPS = false
const ENABLE_SPECIAL_MONSTERS = true
const SPECIAL_MONSTERS: MonsterName[] = ["cutebee", "fvampire", "goldenbat", "greenjr", "jr", "mvampire", "pinkgoo", "snowman", "stompy", "tinyp"]
const ENABLE_MONSTERHUNTS = true
const MAX_PUBLIC_CHARACTERS = 6

const MERCHANT = "earthMer"
const WARRIOR = "earthWar"
const MAGE = "earthMag"
const PRIEST = "earthPri"

const PARTY_LEADER = "earthWar"
const PARTY_ALLOWLIST = ["earthiverse", "earthMag", "earthPri", "earthWar"]

let TARGET_REGION: ServerRegion = "US"
let TARGET_IDENTIFIER: ServerIdentifier = "I"

/** My characters */
const PRIVATE_CONTEXTS: Strategist<PingCompensatedCharacter>[] = []
// /** Others that have joined */
const PUBLIC_CONTEXTS: Strategist<PingCompensatedCharacter>[] = []
/** All contexts */
const ALL_CONTEXTS: Strategist<PingCompensatedCharacter>[] = []

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
        ["coat1", undefined],
        ["gloves1", undefined],
        ["gphelmet", undefined],
        ["helmet1", undefined],
        ["pants1", undefined],
        ["phelmet", undefined],
        ["pickaxe", [
            [0, 1_000_000]
        ]],
        ["rod", [
            [0, 1_000_000]
        ]],
        ["shoes1", undefined],
        ["stand0", undefined],
        ["stramulet", undefined]
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
        ["pants1", undefined],
        ["phelmet", undefined],
        ["shoes1", undefined],
        ["stramulet", undefined],
        ["vitearring", undefined]
    ])
})

//// Strategies
// Debug
const debugStrategy = new DebugStrategy({
    logLimitDCReport: true
})
// Movement
const getHolidaySpiritStrategy = new GetHolidaySpiritStrategy()
const finishMonsterHuntStrategy = new FinishMonsterHuntStrategy()
const getMonsterHuntStrategy = new GetMonsterHuntStrategy()
// Party
const partyAcceptStrategy = new AcceptPartyRequestStrategy({ allowList: PARTY_ALLOWLIST })
const partyRequestStrategy = new RequestPartyStrategy(WARRIOR)
// Mage
const privateMagiportStrategy = new MagiportOthersSmartMovingToUsStrategy(PRIVATE_CONTEXTS)
const publicMagiportStrategy = new MagiportOthersSmartMovingToUsStrategy(ALL_CONTEXTS)
// Priest
const privatePartyHealStrategy = new PartyHealStrategy(PRIVATE_CONTEXTS)
const publicPartyHealStrategy = new PartyHealStrategy(ALL_CONTEXTS)
const trackerStrategy = new TrackerStrategy()
const respawnStrategy = new RespawnStrategy()
// Warrior
const chargeStrategy = new ChargeStrategy()
// Setups
const privateSetups = constructSetups(ALL_CONTEXTS)
const publicSetups = constructHelperSetups(ALL_CONTEXTS)
// Etc.
const elixirStrategy = new ElixirStrategy("elixirluck")

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

    for (const context of contexts) {
        if (ENABLE_EVENTS) {
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

            // Special monsters
            for (const id in context.bot.S) {
                if (!AL.Game.G.monsters[id]) continue // Not a monster
                if ((context.bot.S[id] as ServerInfoDataLive)?.live) {
                    priority.push(id as MonsterName)
                }
            }
        }

        if (ENABLE_SPECIAL_MONSTERS) {
            for (const specialMonster of await AL.EntityModel.find({
                $or: [
                    { target: undefined },
                    { target: { $in: PARTY_ALLOWLIST } },
                    { type: { $in: ["pinkgoo", "snowman", "wabbit"] } } // Coop monsters will give credit
                ],
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

        if (ENABLE_MONSTERHUNTS) {
            for (const contexts of [PRIVATE_CONTEXTS, PUBLIC_CONTEXTS]) {
                const monsterhunts: {
                    ms: number
                    id: MonsterName
                }[] = []
                for (const context2 of contexts) {
                    if (!context2.isReady()) continue
                    const bot2 = context2.bot
                    if (!bot2.s.monsterhunt || bot2.s.monsterhunt.c == 0) continue
                    monsterhunts.push(bot2.s.monsterhunt)
                }

                monsterhunts.sort((a, b) => a.ms - b.ms) // Lower time remaining first

                for (const monsterhunt of monsterhunts) priority.push(monsterhunt.id)
            }
        }

        // Default targets
        if (PRIVATE_CONTEXTS.includes(context)) {
            if (!context.bot.isPVP()) {
                priority.push("bscorpion")
            }
            if (context.bot.ctype == "mage") {
                priority.push("frog")
                priority.push("osnake")
            } else {
                priority.push("osnake")
            }
        } else {
            priority.push("bee")
        }
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

        for (const context of contexts) {
            if (!context.isReady()) continue
            const bot = context.bot

            if (ENABLE_SERVER_HOPS) {
                if (bot.S.halloween) {
                    const monster = (await getHalloweenMonsterPriority())[0]
                    if (
                        context.uptime() > 60_000
                        && monster
                        && (
                            monster.serverRegion !== bot.serverData.region
                            || monster.serverIdentifier !== bot.serverData.name
                        )
                    ) {
                        // We want to switch servers
                        TARGET_IDENTIFIER = monster.serverIdentifier
                        TARGET_REGION = monster.serverRegion
                        await sleep(1000)
                        console.log(bot.id, "is changing server from", bot.serverData.region, bot.serverData.name, "to", monster.serverRegion, monster.serverIdentifier)
                        context.changeServer(monster.serverRegion, monster.serverIdentifier).catch(console.error)
                        return
                    }
                }
            }

            if (bot.ctype == "merchant") continue

            if (ENABLE_MONSTERHUNTS) {
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

    context.applyStrategy(respawnStrategy)
    context.applyStrategy(trackerStrategy)
    context.applyStrategy(elixirStrategy)
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
        for (const context of ALL_CONTEXTS) {
            const character = context.bot
            if (character.owner == characterID) throw `There is a merchant with the ID '${characterID}' (${character.id}) already running. You can only run one merchant.`
        }
    } else {
        let numChars = 0
        for (const context of ALL_CONTEXTS) {
            const character = context.bot
            if (character.ctype == "merchant") continue // Merchants don't count
            numChars++
        }
        if (numChars >= MAX_PUBLIC_CHARACTERS) throw `Too many characters are already running (We only support ${MAX_PUBLIC_CHARACTERS} characters simultaneously)`
        for (const context of ALL_CONTEXTS) {
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
                enableBuyAndUpgrade: {
                    upgradeToLevel: 9
                },
                enableBuyReplenishables: {
                    all: DEFAULT_REPLENISHABLES,
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
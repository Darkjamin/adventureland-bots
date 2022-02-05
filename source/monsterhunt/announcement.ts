import AL, { IPosition, ItemName, Mage, Merchant, SlotType } from "alclient"
import { goToNearestWalkableToMonster, goToNPC, goToSpecialMonster, sleep, startTrackerLoop } from "../base/general.js"
import { desertlandPorcupines, halloweenMiniMushes, mainArmadillos, mainBeesNearTunnel, mainCrabs, mainCrabXs, mainCrocs, mainGoos, mainPoisios, mainScorpions, mainSquigs, offsetPosition, winterlandArcticBees } from "../base/locations.js"
import { attackTheseTypesMage } from "../base/mage.js"
import { partyLeader, partyMembers } from "../base/party.js"
import { getTargetServerFromPlayer } from "../base/serverhop.js"
import { Information, Strategy } from "../definitions/bot.js"
import { DEFAULT_IDENTIFIER, DEFAULT_REGION, startMage, startMerchant } from "./shared.js"

let TARGET_REGION = DEFAULT_REGION
let TARGET_IDENTIFIER = DEFAULT_IDENTIFIER

const information: Information = {
    friends: [undefined, undefined, undefined, undefined],
    // eslint-disable-next-line sort-keys
    bot1: {
        bot: undefined,
        name: "facilitating",
        target: undefined
    },
    bot2: {
        bot: undefined,
        name: "gratuitously",
        target: undefined
    },
    bot3: {
        bot: undefined,
        name: "hypothesized",
        target: undefined
    },
    merchant: {
        bot: undefined,
        name: "decisiveness",
        nameAlt: "decisiveness",
        target: undefined
    }
}

function prepareMage(bot: Mage) {
    const maxAttackSpeedEquipment: { [T in SlotType]?: ItemName } = { amulet: "intamulet", belt: "intbelt", cape: "cape", chest: "wattire", gloves: "wgloves", helmet: "wcap", mainhand: "wand", offhand: "wbook0", orb: "jacko", pants: "wbreeches", shoes: "wshoes" }
    const maxDamageEquipment: { [T in SlotType]?: ItemName } = { ...maxAttackSpeedEquipment, "mainhand": "firestaff" }

    const strategy: Strategy = {
        defaultTarget: "squigtoad",
        // eslint-disable-next-line sort-keys
        arcticbee: {
            attack: async () => { await attackTheseTypesMage(bot, ["arcticbee"], information.friends, { cburstWhenHPLessThan: bot.G.monsters.goo.hp + 1 }) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(winterlandArcticBees, 50, 0), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(winterlandArcticBees, 150, 0), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(winterlandArcticBees, 250, 0), { useBlink: true })
                }
            }
        },
        armadillo: {
            attack: async () => { await attackTheseTypesMage(bot, ["armadillo", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainArmadillos, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainArmadillos, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainArmadillos, 75, 75), { useBlink: true })
                }
            },
        },
        bee: {
            attack: async () => { await attackTheseTypesMage(bot, ["bee"], information.friends, { cburstWhenHPLessThan: bot.G.monsters.bee.hp + 1 }) },
            attackWhileIdle: true,
            equipment: maxAttackSpeedEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainBeesNearTunnel, 25, 0), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainBeesNearTunnel, 75, 0), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainBeesNearTunnel, 125, 0), { useBlink: true })
                }
            }
        },
        crab: {
            attack: async () => { await attackTheseTypesMage(bot, ["crab", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxAttackSpeedEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainCrabs, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainCrabs, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainCrabs, 75, 75), { useBlink: true })
                }
            },
        },
        crabx: {
            attack: async () => { await attackTheseTypesMage(bot, ["crabx", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await goToNearestWalkableToMonster(bot, ["crabx", "phoenix"], offsetPosition(mainCrabXs, -75, 75), bot.range - 25)
                } else if (bot.id == information.bot2.name) {
                    await goToNearestWalkableToMonster(bot, ["crabx", "phoenix"], offsetPosition(mainCrabXs, 0, 75), bot.range - 25)
                } else if (bot.id == information.bot3.name) {
                    await goToNearestWalkableToMonster(bot, ["crabx", "phoenix"], offsetPosition(mainCrabXs, 75, 75), bot.range - 25)
                }
            },
        },
        croc: {
            attack: async () => { await attackTheseTypesMage(bot, ["croc", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainCrocs, 0, 25), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainCrocs, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainCrocs, 0, 125), { useBlink: true })
                }
            },
        },
        franky: {
            attack: async () => { await attackTheseTypesMage(bot, ["nerfedmummy", "franky"], information.friends) },
            equipment: maxDamageEquipment,
            move: async () => {
                const nearest = bot.getEntity({ returnNearest: true, type: "franky" })
                if (nearest && AL.Tools.distance(bot, nearest) > 25) {
                    // Move close to Franky because other characters might help blast away mummies
                    await bot.smartMove(nearest, { getWithin: 25 })
                } else {
                    await goToSpecialMonster(bot, "franky")
                }
            }
        },
        frog: {
            attack: async () => { await attackTheseTypesMage(bot, ["frog", "tortoise"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => { await goToNearestWalkableToMonster(bot, ["frog", "tortoise"]) },
        },
        goldenbat: {
            attack: async () => { await attackTheseTypesMage(bot, ["goldenbat"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => { await goToSpecialMonster(bot, "goldenbat") },
        },
        goo: {
            attack: async () => { await attackTheseTypesMage(bot, ["goo"], information.friends, { cburstWhenHPLessThan: bot.G.monsters.goo.hp + 1 }) },
            attackWhileIdle: true,
            equipment: maxAttackSpeedEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainGoos, 50, 0), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainGoos, 150, 0), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainGoos, 250, 0), { useBlink: true })
                }
            }
        },
        greenjr: {
            attack: async () => { await attackTheseTypesMage(bot, ["greenjr", "snake", "osnake"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => { await goToSpecialMonster(bot, "greenjr") },
        },
        grinch: {
            attack: async () => { await attackTheseTypesMage(bot, ["grinch"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.S.grinch?.live && bot.S.grinch.hp <= 1_000_000) {
                    // Go to Kane when Grinch is nearing death for extra luck
                    await goToNPC(bot, "citizen0")
                    return
                }

                const grinch = bot.getEntity({ returnNearest: true, type: "grinch" })
                if (grinch) {
                    // TODO: If we see Kane, and the grinch is targeting us, kite him to Kane
                    if (!bot.smartMoving) bot.smartMove(grinch, { getWithin: Math.min(bot.range - 10, 50) }).catch(e => console.error(e))
                    else if (AL.Tools.distance(grinch, bot.smartMoving) > 100) bot.smartMove(grinch, { getWithin: Math.min(bot.range - 10, 50) }).catch(e => console.error(e))
                } else if (bot.S.grinch?.live) {
                    if (["woffice", "bank", "bank_b", "bank_u"].includes(bot.S.grinch.map)) return // Wait for the grinch to move to a place we can attack him

                    if (!bot.smartMoving) goToSpecialMonster(bot, "grinch").catch(e => console.error(e))
                    else if (AL.Tools.distance(bot.S.grinch as IPosition, bot.smartMoving) > 100) {
                        bot.smartMove(bot.S.grinch as IPosition, { getWithin: Math.min(bot.range - 10, 50) }).catch(e => console.error(e))
                    }
                }
            }
        },
        jr: {
            attack: async () => { await attackTheseTypesMage(bot, ["jr"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => { await goToSpecialMonster(bot, "jr") },
        },
        minimush: {
            attack: async () => { await attackTheseTypesMage(bot, ["minimush", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxAttackSpeedEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(halloweenMiniMushes, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(halloweenMiniMushes, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(halloweenMiniMushes, 75, 75), { useBlink: true })
                }
            }
        },
        mrgreen: {
            attack: async () => { await attackTheseTypesMage(bot, ["mrgreen"], information.friends) },
            equipment: maxDamageEquipment,
            move: async () => { await goToSpecialMonster(bot, "mrgreen") },
        },
        mrpumpkin: {
            attack: async () => { await attackTheseTypesMage(bot, ["mrpumpkin"], information.friends) },
            equipment: maxDamageEquipment,
            move: async () => { await goToSpecialMonster(bot, "mrpumpkin") },
        },
        mvampire: {
            attack: async () => { await attackTheseTypesMage(bot, ["mvampire", "bat"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => { await goToSpecialMonster(bot, "mvampire") },
        },
        poisio: {
            attack: async () => { await attackTheseTypesMage(bot, ["poisio"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainPoisios, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainPoisios, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainPoisios, 75, 75), { useBlink: true })
                }
            }
        },
        porcupine: {
            attack: async () => { await attackTheseTypesMage(bot, ["porcupine"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(desertlandPorcupines, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(desertlandPorcupines, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(desertlandPorcupines, 75, 75), { useBlink: true })
                }
            },
        },
        rat: {
            attack: async () => { await attackTheseTypesMage(bot, ["goo"], information.friends) },
            attackWhileIdle: true,
            equipment: maxAttackSpeedEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove({ map: "mansion", x: 240, y: -488 }, { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove({ map: "mansion", x: 223, y: -312 }, { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove({ map: "mansion", x: 223, y: -100 }, { useBlink: true })
                }
            }
        },
        scorpion: {
            attack: async () => { await attackTheseTypesMage(bot, ["scorpion", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await goToNearestWalkableToMonster(bot, ["scorpion", "phoenix"], offsetPosition(mainScorpions, -75, 75), bot.range - 25)
                } else if (bot.id == information.bot2.name) {
                    await goToNearestWalkableToMonster(bot, ["scorpion", "phoenix"], offsetPosition(mainScorpions, 0, 75), bot.range - 25)
                } else if (bot.id == information.bot3.name) {
                    await goToNearestWalkableToMonster(bot, ["scorpion", "phoenix"], offsetPosition(mainScorpions, 75, 75), bot.range - 25)
                }
            },
        },
        snowman: {
            attack: async () => { await attackTheseTypesMage(bot, ["snowman"], information.friends) },
            attackWhileIdle: true,
            equipment: maxAttackSpeedEquipment,
            move: async () => { await goToSpecialMonster(bot, "snowman") }
        },
        squig: {
            attack: async () => { await attackTheseTypesMage(bot, ["squig", "squigtoad", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainSquigs, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainSquigs, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainSquigs, 75, 75), { useBlink: true })
                }
            }
        },
        squigtoad: {
            attack: async () => { await attackTheseTypesMage(bot, ["squigtoad", "squig", "phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => {
                if (bot.id == information.bot1.name) {
                    await bot.smartMove(offsetPosition(mainSquigs, -75, 75), { useBlink: true })
                } else if (bot.id == information.bot2.name) {
                    await bot.smartMove(offsetPosition(mainSquigs, 0, 75), { useBlink: true })
                } else if (bot.id == information.bot3.name) {
                    await bot.smartMove(offsetPosition(mainSquigs, 75, 75), { useBlink: true })
                }
            }
        },
        tiger: {
            attack: async () => {
                const tiger = bot.getEntity({ returnNearest: true, type: "tiger" })
                if (tiger) {
                    if (bot.slots.offhand && bot.slots.offhand.l) await bot.unequip("offhand")
                    if (bot.slots.mainhand && bot.slots.mainhand.l) await bot.unequip("mainhand")
                    if (bot.slots.helmet && bot.slots.helmet.l) await bot.unequip("helmet")
                    if (bot.slots.chest && bot.slots.chest.l) await bot.unequip("chest")
                    if (bot.slots.pants && bot.slots.pants.l) await bot.unequip("pants")
                    if (bot.slots.shoes && bot.slots.shoes.l) await bot.unequip("shoes")
                    if (bot.slots.gloves && bot.slots.gloves.l) await bot.unequip("gloves")
                    if (bot.slots.orb && bot.slots.orb.l) await bot.unequip("orb")
                    if (bot.slots.amulet && bot.slots.amulet.l) await bot.unequip("amulet")
                    // if (bot.slots.earring1 && bot.slots.earring1.l) await bot.unequip("earring1")
                    // if (bot.slots.earring2 && bot.slots.earring2.l) await bot.unequip("earring2")
                    // if (bot.slots.ring1 && bot.slots.ring1.l) await bot.unequip("ring1")
                    // if (bot.slots.ring2 && bot.slots.ring2.l) await bot.unequip("ring2")
                    if (bot.slots.cape && bot.slots.cape.l) await bot.unequip("cape")
                }
                await attackTheseTypesMage(bot, ["tiger"], information.friends)
            },
            attackWhileIdle: true,
            move: async () => {
                const tiger = bot.getEntity({ returnNearest: true, type: "tiger" })
                if (tiger) {
                    bot.smartMove(tiger, { getWithin: 10 })
                } else {
                    await goToSpecialMonster(bot, "tiger", { requestMagiport: true })
                }
            }
        },
        tortoise: {
            attack: async () => { await attackTheseTypesMage(bot, ["tortoise", "frog"], information.friends) },
            attackWhileIdle: true,
            equipment: maxDamageEquipment,
            move: async () => { await goToNearestWalkableToMonster(bot, ["tortoise", "frog"]) },
        }
    }

    startMage(bot, information, strategy, partyLeader, partyMembers)
}

function prepareMerchant(bot: Merchant) {
    const strategy: Strategy = {
    }

    startMerchant(bot, information, strategy, { map: "main", x: -300, y: -100 }, partyLeader, partyMembers)
}

async function run() {
    // Login and prepare pathfinding
    await Promise.all([AL.Game.loginJSONFile("../../credentials.json"), AL.Game.getGData(true)])
    await AL.Pathfinder.prepare(AL.Game.G)

    // Start all characters
    console.log("Connecting...")

    const startMerchantLoop = async () => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.merchant.bot) information.merchant.bot.disconnect()
                if (TARGET_REGION == DEFAULT_REGION && TARGET_IDENTIFIER == DEFAULT_IDENTIFIER) {
                    information.merchant.bot = await AL.Game.startMerchant(information.merchant.name, TARGET_REGION, TARGET_IDENTIFIER)
                } else {
                    information.merchant.bot = await AL.Game.startMerchant(information.merchant.nameAlt, TARGET_REGION, TARGET_IDENTIFIER)
                }
                information.friends[0] = information.merchant.bot
                prepareMerchant(information.merchant.bot)
                information.merchant.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.merchant.bot) information.merchant.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 1000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else if (/ingame/.test(e)) {
                    setTimeout(async () => { loopBot() }, 500)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startMerchantLoop().catch(() => { /* ignore errors */ })

    const startMage1Loop = async () => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot1.bot) information.bot1.bot.disconnect()
                information.bot1.bot = await AL.Game.startMage(information.bot1.name, TARGET_REGION, TARGET_IDENTIFIER)
                information.friends[1] = information.bot1.bot
                prepareMage(information.bot1.bot as Mage)
                startTrackerLoop(information.bot1.bot)
                information.bot1.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.bot1.bot) information.bot1.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 1000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else if (/ingame/.test(e)) {
                    setTimeout(async () => { loopBot() }, 500)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startMage1Loop().catch(() => { /* ignore errors */ })

    const startMage2Loop = async () => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot2.bot) information.bot2.bot.disconnect()
                information.bot2.bot = await AL.Game.startMage(information.bot2.name, TARGET_REGION, TARGET_IDENTIFIER)
                information.friends[2] = information.bot2.bot
                prepareMage(information.bot2.bot as Mage)
                information.bot2.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.bot2.bot) information.bot2.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 1000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else if (/ingame/.test(e)) {
                    setTimeout(async () => { loopBot() }, 500)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startMage2Loop().catch(() => { /* ignore errors */ })

    const startMage3Loop = async () => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot3.bot) information.bot3.bot.disconnect()
                information.bot3.bot = await AL.Game.startMage(information.bot3.name, TARGET_REGION, TARGET_IDENTIFIER)
                information.friends[3] = information.bot3.bot
                prepareMage(information.bot3.bot as Mage)
                information.bot3.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.bot3.bot) information.bot3.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 1000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else if (/ingame/.test(e)) {
                    setTimeout(async () => { loopBot() }, 500)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startMage3Loop().catch(() => { /* ignore errors */ })

    let lastServerChangeTime = Date.now()
    const serverLoop = async () => {
        try {
            console.log("DEBUG: Checking target server...")
            // We haven't logged in yet
            if (!information.bot1.bot) {
                console.log("DEBUG: We haven't logged in yet")
                setTimeout(async () => { serverLoop() }, 1000)
                return
            }

            // Don't change servers too fast
            if (lastServerChangeTime > Date.now() - AL.Constants.RECONNECT_TIMEOUT_MS) {
                console.log("DEBUG: Don't change servers too fast")
                setTimeout(async () => { serverLoop() }, Math.max(1000, lastServerChangeTime + AL.Constants.RECONNECT_TIMEOUT_MS - Date.now()))
                return
            }

            const currentRegion = information.bot1.bot.server.region
            const currentIdentifier = information.bot1.bot.server.name

            const targetServer = await getTargetServerFromPlayer(currentRegion, currentIdentifier, partyLeader)
            if (currentRegion == targetServer[0] && currentIdentifier == targetServer[1]) {
                // We're already on the correct server
                console.log("DEBUG: We're already on the correct server")
                setTimeout(async () => { serverLoop() }, 1000)
                return
            }

            // Change servers to attack this entity
            TARGET_REGION = targetServer[0]
            TARGET_IDENTIFIER = targetServer[1]
            console.log(`Changing from ${currentRegion} ${currentIdentifier} to ${TARGET_REGION} ${TARGET_IDENTIFIER}`)

            // Sleep to give a chance to loot
            await sleep(5000)

            // Disconnect everyone
            console.log("Disconnecting characters")
            information.bot1.bot.disconnect(),
            information.bot2.bot?.disconnect(),
            information.bot3.bot?.disconnect(),
            information.merchant.bot?.disconnect()
            await sleep(5000)
            lastServerChangeTime = Date.now()
        } catch (e) {
            console.error(e)
        }
        setTimeout(async () => { serverLoop() }, 1000)
    }
    serverLoop()
}
run()
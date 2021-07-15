import AL, { Tools } from "alclient-mongo"
import { goToAggroMonster, goToNearestWalkableToMonster, goToPriestIfHurt, goToSpecialMonster, kiteInCircle, startTrackerLoop } from "../base/general.js"
import { attackTheseTypesMage } from "../base/mage.js"
import { attackTheseTypesMerchant } from "../base/merchant.js"
import { attackTheseTypesPriest } from "../base/priest.js"
import { attackTheseTypesRanger } from "../base/ranger.js"
import { attackTheseTypesWarrior } from "../base/warrior.js"
import { Information, Strategy } from "../definitions/bot.js"
import { DEFAULT_IDENTIFIER, DEFAULT_REGION, startMage, startMerchant, startPriest, startRanger, startWarrior } from "./shared.js"

const information: Information = {
    friends: [undefined, undefined, undefined, undefined],
    // eslint-disable-next-line sort-keys
    bot1: {
        bot: undefined,
        name: "earthPri",
        // name: "earthMag",
        target: undefined
    },
    bot2: {
        bot: undefined,
        name: "earthiverse",
        target: undefined
    },
    bot3: {
        bot: undefined,
        name: "earthWar",
        // name: "earthMag2",
        target: undefined
    },
    merchant: {
        bot: undefined,
        name: "earthMer",
        target: undefined
    }
}

function prepareMage(bot: AL.Mage) {
    const strategy: Strategy = {
        arcticbee: {
            attack: async () => { await attackTheseTypesMage(bot, ["arcticbee"], information.friends, { disableEnergize: true }) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand" },
            move: async () => {
                if (bot.id == "earthMag") {
                    await bot.smartMove({ map: "winterland", x: 1082, y: -883 })
                } else if (bot.id == "earthMag2") {
                    await bot.smartMove({ map: "winterland", x: 1082, y: -863 })
                }
            }
        },
        goo: {
            attack: async () => { await attackTheseTypesMage(bot, ["goo"], information.friends, { disableEnergize: true }) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand" },
            move: async () => {
                if (bot.id == "earthMag") {
                    await bot.smartMove({ map: "main", x: -132, y: 787 })
                } else if (bot.id == "earthMag2") {
                    await bot.smartMove({ map: "main", x: 68, y: 787 })
                }
            }
        },
        minimush: {
            attack: async () => { await attackTheseTypesMage(bot, ["minimush"], information.friends, { disableEnergize: true }) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand" },
            move: async () => {
                if (bot.id == "earthMag") {
                    await bot.smartMove({ map: "halloween", x: 8, y: 731 })
                } else if (bot.id == "earthMag2") {
                    await bot.smartMove({ map: "halloween", x: 8, y: 531 })
                }
            }
        }
    }
    startMage(bot, information, strategy)
}

function prepareMerchant(bot: AL.Merchant) {
    const chickenCoop = bot.locateMonster("hen")[0]
    const goos = bot.locateMonster("goo")[0]
    const strategy: Strategy = {
        goo: {
            attack: async () => { await attackTheseTypesMerchant(bot, ["goo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "dartgun", offhand: "wbook1" },
            move: async () => { await bot.smartMove(goos) }
        },
        hen: {
            attack: async () => { await attackTheseTypesMerchant(bot, ["hen"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "dartgun", offhand: "wbook1" },
            move: async () => { await bot.smartMove(chickenCoop) }
        },
        rooster: {
            attack: async () => { await attackTheseTypesMerchant(bot, ["rooster"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "dartgun", offhand: "wbook1" },
            move: async () => { await bot.smartMove(chickenCoop) }
        },
        snowman: {
            attack: async () => { await attackTheseTypesMerchant(bot, ["snowman"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "dartgun", offhand: "wbook1" },
            move: async () => { await goToSpecialMonster(bot, "snowman") }
        }
    }
    startMerchant(bot, information, strategy, { map: "main", x: 0, y: 0 })
}

function preparePriest(bot: AL.Priest) {
    const bscorpionSpawn = bot.locateMonster("bscorpion")[0]
    const strategy: Strategy = {
        arcticbee: {
            attack: async () => { await attackTheseTypesPriest(bot, ["arcticbee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 1102, y: -873 }) },
        },
        armadillo: {
            attack: async () => { await attackTheseTypesPriest(bot, ["armadillo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "pmace", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 546, y: 1846 }) },
        },
        bat: {
            attack: async () => { await attackTheseTypesPriest(bot, ["bat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "cave", x: 324, y: -1107 }) },
        },
        bbpompom: {
            attack: async () => { await attackTheseTypesPriest(bot, ["bbpompom"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winter_cave", x: 71, y: -164 }) },
        },
        bee: {
            attack: async () => { await attackTheseTypesPriest(bot, ["bee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 152, y: 1487 }) },
        },
        bigbird: {
            attack: async () => { await attackTheseTypesPriest(bot, ["bigbird"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 1363, y: 248 }) },
        },
        boar: {
            attack: async () => { await attackTheseTypesPriest(bot, ["boar"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 40, y: -1109 }) },
        },
        booboo: {
            attack: async () => { await attackTheseTypesPriest(bot, ["booboo"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 265, y: -605 }) },
        },
        bscorpion: {
            attack: async () => {
                // Get the bscorpion to target us if it's attacking a friend
                const bscorpion = bot.getNearestMonster("bscorpion")?.monster
                if (bscorpion && bscorpion.target !== bot.id && bscorpion.couldGiveCreditForKill(bot)) {
                    await bot.absorbSins(bscorpion.target)
                }

                if (bscorpion && bscorpion.target == bot.id && bscorpion.hp < 50000) {
                    // Equip items that have more luck
                    if (bot.slots.mainhand?.name !== "lmace" && bot.hasItem("lmace")) await bot.equip(bot.locateItem("lmace"))
                    if (bot.slots.orb?.name !== "rabbitsfoot" && bot.hasItem("rabbitsfoot")) await bot.equip(bot.locateItem("rabbitsfoot"))
                    if (bot.slots.offhand?.name !== "mshield" && bot.hasItem("mshield")) await bot.equip(bot.locateItem("mshield"))
                    if (bot.slots.shoes?.name !== "wshoes" && bot.hasItem("wshoes")) await bot.equip(bot.locateItem("wshoes"))
                } else {
                    // Equip items that do more damage
                    if (bot.slots.mainhand?.name !== "firestaff") await bot.equip(bot.locateItem("firestaff"))
                    if (bot.slots.orb?.name !== "orbofint" && bot.hasItem("orbofint")) await bot.equip(bot.locateItem("orbofint"))
                    if (bot.slots.offhand?.name !== "wbook1" && bot.hasItem("wbook1")) await bot.equip(bot.locateItem("wbook1"))
                    if (bot.slots.shoes?.name !== "wingedboots" && bot.hasItem("wingedboots")) await bot.equip(bot.locateItem("wingedboots"))
                }

                await attackTheseTypesPriest(bot, ["bscorpion"], information.friends)
            },
            equipment: { /** We have custom equipment in the attack loop above */ },
            move: async () => { await kiteInCircle(bot, "bscorpion", bscorpionSpawn) }
        },
        cgoo: {
            attack: async () => { await attackTheseTypesPriest(bot, ["cgoo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["cgoo"], { map: "arena", x: 650, y: -500 }) },
        },
        crab: {
            attack: async () => { await attackTheseTypesPriest(bot, ["crab"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -1182, y: -66 }) },
        },
        crabx: {
            attack: async () => { await attackTheseTypesPriest(bot, ["crabx"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["crabx"], { map: "main", x: -964, y: 1762 }) },
        },
        croc: {
            attack: async () => { await attackTheseTypesPriest(bot, ["croc"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 821, y: 1710 }) },
        },
        cutebee: {
            attack: async () => { await attackTheseTypesPriest(bot, ["cutebee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => {
                const nearby = bot.getNearestMonster("cutebee")
                if (nearby) {
                    if (!nearby.monster.target) {
                        // The cutebee will avoid 99.9% of our attacks, so let's try to walk in front of it so that we can aggro it
                        await goToAggroMonster(bot, nearby.monster)
                    } else {
                        await goToNearestWalkableToMonster(bot, ["cutebee"])
                    }
                } else {
                    await goToSpecialMonster(bot, "cutebee")
                }
            }
        },
        dragold: {
            attack: async () => { await attackTheseTypesPriest(bot, ["dragold"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "dragold") },
        },
        fireroamer: {
            attack: async () => { await attackTheseTypesPriest(bot, ["fireroamer"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "lantern", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: 180, y: -675 }) },
        },
        franky: {
            attack: async () => { await attackTheseTypesPriest(bot, ["nerfedmummy", "franky"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => {
                const nearest = bot.getNearestMonster("franky")
                if (nearest && nearest.distance > 25) {
                    // Move close to Franky because other characters might help blast away mummies
                    await bot.smartMove(nearest.monster, { getWithin: 25 })
                } else {
                    await goToSpecialMonster(bot, "franky")
                }
            }
        },
        frog: {
            attack: async () => { await attackTheseTypesPriest(bot, ["frog"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["frog"], { map: "main", x: -1124, y: 1118 }) },
        },
        fvampire: {
            attack: async () => { await attackTheseTypesPriest(bot, ["fvampire"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "fvampire") },
        },
        ghost: {
            attack: async () => { await attackTheseTypesPriest(bot, ["ghost"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: 276, y: -1224 }) },
        },
        goldenbat: {
            attack: async () => { await attackTheseTypesPriest(bot, ["goldenbat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "goldenbat") },
        },
        goo: {
            attack: async () => { await attackTheseTypesPriest(bot, ["goo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -12, y: 787 }) },
        },
        greenjr: {
            attack: async () => { await attackTheseTypesPriest(bot, ["greenjr"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "greenjr") },
        },
        hen: {
            attack: async () => { await attackTheseTypesPriest(bot, ["hen"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -41.5, y: -282 }) },
        },
        iceroamer: {
            attack: async () => { await attackTheseTypesPriest(bot, ["iceroamer"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 1492, y: 104 }) },
        },
        jr: {
            attack: async () => { await attackTheseTypesPriest(bot, ["jr"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "jr") },
        },
        minimush: {
            attack: async () => { await attackTheseTypesPriest(bot, ["minimush"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: 28, y: 631 }) },
        },
        mole: {
            attack: async () => { await attackTheseTypesPriest(bot, ["mole"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "tunnel", x: -35, y: -329 }) },
        },
        mrgreen: {
            attack: async () => { await attackTheseTypesPriest(bot, ["mrgreen"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mrgreen") },
        },
        mrpumpkin: {
            attack: async () => { await attackTheseTypesPriest(bot, ["mrpumpkin"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mrpumpkin") },
        },
        mummy: {
            attack: async () => { await attackTheseTypesPriest(bot, ["mummy"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 270, y: -1129 }) },
        },
        mvampire: {
            attack: async () => { await attackTheseTypesPriest(bot, ["mvampire"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mvampire") },
        },
        nerfedmummy: {
            attack: async () => { await attackTheseTypesPriest(bot, ["nerfedmummy"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "franky") },
        },
        oneeye: {
            attack: async () => { await attackTheseTypesPriest(bot, ["oneeye"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level2w", x: -155, y: 0 }) },
        },
        osnake: {
            attack: async () => { await attackTheseTypesPriest(bot, ["osnake"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["osnake"], { map: "halloween", x: -488, y: -708 }) },
        },
        phoenix: {
            attack: async () => { await attackTheseTypesPriest(bot, ["phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "phoenix") },
        },
        plantoid: {
            attack: async () => { await attackTheseTypesPriest(bot, ["plantoid"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: -730, y: -125 }) },
        },
        poisio: {
            attack: async () => { await attackTheseTypesPriest(bot, ["poisio"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -101, y: 1360 }) },
        },
        porcupine: {
            attack: async () => { await attackTheseTypesPriest(bot, ["porcupine"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: -809, y: 135 }) },
        },
        pppompom: {
            attack: async () => { await attackTheseTypesPriest(bot, ["pppompom"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firestaff", offhand: "lantern", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level2n", x: 120, y: -130 }) },
            requireCtype: "warrior"
        },
        prat: {
            attack: async () => { await attackTheseTypesPriest(bot, ["prat"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level1", x: -296, y: 557 }) },
        },
        rat: {
            attack: async () => { await attackTheseTypesPriest(bot, ["rat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "mansion", x: -224, y: -313 }) },
        },
        rooster: {
            attack: async () => { await attackTheseTypesPriest(bot, ["rooster"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -41.5, y: -282 }) },
        },
        scorpion: {
            attack: async () => { await attackTheseTypesPriest(bot, ["scorpion"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 1598, y: -168 }) },
        },
        skeletor: {
            attack: async () => { await attackTheseTypesPriest(bot, ["skeletor"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "arena", x: 400, y: -575 }) },
        },
        snake: {
            attack: async () => { await attackTheseTypesPriest(bot, ["snake"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -62, y: 1901 }) },
        },
        snowman: {
            attack: async () => { await attackTheseTypesPriest(bot, ["snowman"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "wand", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "snowman") },
        },
        spider: {
            attack: async () => { await attackTheseTypesPriest(bot, ["spider"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 968, y: -144 }) },
        },
        squig: {
            attack: async () => { await attackTheseTypesPriest(bot, ["squig", "squigtoad"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -1155, y: 422 }) },
        },
        squigtoad: {
            attack: async () => { await attackTheseTypesPriest(bot, ["squigtoad", "squig"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -1155, y: 422 }) },
        },
        stoneworm: {
            attack: async () => { await attackTheseTypesPriest(bot, ["stoneworm"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 697, y: 129 }) },
        },
        tinyp: {
            attack: async () => { await attackTheseTypesPriest(bot, ["tinyp"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "tinyp") },
        },
        tortoise: {
            attack: async () => { await attackTheseTypesPriest(bot, ["tortoise"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["tortoise"], { map: "main", x: -1104, y: 1118 }) },
        },
        wabbit: {
            attack: async () => { await attackTheseTypesPriest(bot, ["wabbit"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "wabbit") },
        },
        wolf: {
            attack: async () => { await attackTheseTypesPriest(bot, ["wolf"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 420, y: -2525 }) },
        },
        wolfie: {
            attack: async () => { await attackTheseTypesPriest(bot, ["wolfie"], information.friends) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["wolfie"], { map: "winterland", x: -149, y: -2026 }) },
        },
        xscorpion: {
            attack: async () => { await attackTheseTypesPriest(bot, ["xscorpion"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firestaff", offhand: "wbook1", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: -325, y: 725 }) },
        }
    }
    startPriest(bot, information, strategy)
}

function prepareRanger(bot: AL.Ranger) {
    const bscorpionSpawn = bot.locateMonster("bscorpion")[0]
    const strategy: Strategy = {
        arcticbee: {
            attack: async () => { await attackTheseTypesRanger(bot, ["arcticbee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 1082, y: -873 }) },
        },
        armadillo: {
            attack: async () => { await attackTheseTypesRanger(bot, ["armadillo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 526, y: 1846 }) },
        },
        bat: {
            attack: async () => { await attackTheseTypesRanger(bot, ["bat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "cave", x: -194, y: -461 }) },
        },
        bbpompom: {
            attack: async () => { await attackTheseTypesRanger(bot, ["bbpompom"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winter_cave", x: 51, y: -164 }) },
        },
        bee: {
            attack: async () => { await attackTheseTypesRanger(bot, ["bee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 494, y: 1101 }) },
        },
        bigbird: {
            attack: async () => { await attackTheseTypesRanger(bot, ["bigbird"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 1343, y: 248 }) },
        },
        boar: {
            attack: async () => { await attackTheseTypesRanger(bot, ["boar"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 20, y: -1109 }) },
        },
        booboo: {
            attack: async () => { await attackTheseTypesRanger(bot, ["booboo"], information.friends) },
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 265, y: -645 }) },
        },
        bscorpion: {
            attack: async () => { return attackTheseTypesRanger(bot, ["bscorpion"], information.friends, { targetingPlayer: information.bot1.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await kiteInCircle(bot, "bscorpion", bscorpionSpawn) },
            requireCtype: "priest"
        },
        cgoo: {
            attack: async () => { return attackTheseTypesRanger(bot, ["cgoo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["cgoo"], { map: "arena", x: 0, y: -500 }) },
        },
        crab: {
            attack: async () => { return attackTheseTypesRanger(bot, ["crab"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -1202, y: -66 }) },
        },
        crabx: {
            attack: async () => { return attackTheseTypesRanger(bot, ["crabx"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["crabx"], { map: "main", x: -1202, y: -66 }) },
        },
        croc: {
            attack: async () => { return attackTheseTypesRanger(bot, ["croc"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 801, y: 1710 }) },
        },
        cutebee: {
            attack: async () => { return attackTheseTypesRanger(bot, ["cutebee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => {
                const nearby = bot.getNearestMonster("cutebee")
                if (nearby) {
                    if (!nearby.monster.target) {
                        // The cutebee will avoid 99.9% of our attacks, so let's try to walk in front of it so that we can aggro it
                        await goToAggroMonster(bot, nearby.monster)
                    } else {
                        await goToNearestWalkableToMonster(bot, ["cutebee"])
                    }
                } else {
                    await goToSpecialMonster(bot, "cutebee")
                }
            }
        },
        dragold: {
            attack: async () => { return attackTheseTypesRanger(bot, ["dragold"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "dragold") },
            requireCtype: "priest"
        },
        fireroamer: {
            attack: async () => { return attackTheseTypesRanger(bot, ["fireroamer"], information.friends, { targetingPlayer: information.bot1.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: 160, y: -675 }) },
            requireCtype: "priest"
        },
        franky: {
            attack: async () => { return attackTheseTypesRanger(bot, ["nerfedmummy", "franky"], information.friends) },
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => {
                const nearest = bot.getNearestMonster("franky")
                if (nearest && nearest.distance > 25) {
                    // Move close to Franky because other characters might help blast away mummies
                    await bot.smartMove(nearest.monster, { getWithin: 25 })
                } else {
                    await goToSpecialMonster(bot, "franky")
                }
            },
            requireCtype: "priest"
        },
        fvampire: {
            attack: async () => { return attackTheseTypesRanger(bot, ["fvampire"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "fvampire") },
            requireCtype: "priest"
        },
        ghost: {
            attack: async () => { return attackTheseTypesRanger(bot, ["ghost"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: 256, y: -1224 }) }
        },
        goldenbat: {
            attack: async () => { return attackTheseTypesRanger(bot, ["goldenbat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "goldenbat") },
        },
        goo: {
            attack: async () => { return attackTheseTypesRanger(bot, ["goo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -32, y: 787 }) },
        },
        greenjr: {
            attack: async () => { return attackTheseTypesRanger(bot, ["greenjr"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove("greenjr") },
        },
        hen: {
            attack: async () => { return attackTheseTypesRanger(bot, ["hen"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -61.5, y: -282 }) },
        },
        iceroamer: {
            attack: async () => { return attackTheseTypesRanger(bot, ["iceroamer"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 1512, y: 104 }) },
        },
        jr: {
            attack: async () => { return attackTheseTypesRanger(bot, ["jr"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "jr") },
        },
        minimush: {
            attack: async () => { return attackTheseTypesRanger(bot, ["minimush"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: 8, y: 631 }) },
        },
        mole: {
            attack: async () => { return attackTheseTypesRanger(bot, ["mole"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "tunnel", x: -15, y: -329 }) },
            requireCtype: "priest"
        },
        mrgreen: {
            attack: async () => { return attackTheseTypesRanger(bot, ["mrgreen"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mrgreen") },
            requireCtype: "priest"
        },
        mrpumpkin: {
            attack: async () => { return await attackTheseTypesRanger(bot, ["mrpumpkin"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mrpumpkin") },
            requireCtype: "priest"
        },
        mummy: {
            attack: async () => { return attackTheseTypesRanger(bot, ["mummy"], information.friends) },
            equipment: { mainhand: "firebow", offhand: "quiver", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 250, y: -1129 }) },
            requireCtype: "priest"
        },
        mvampire: {
            attack: async () => { return attackTheseTypesRanger(bot, ["mvampire"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mvampire") },
        },
        nerfedmummy: {
            attack: async () => { return attackTheseTypesRanger(bot, ["nerfedmummy"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove("franky") },
        },
        oneeye: {
            attack: async () => { return attackTheseTypesRanger(bot, ["oneeye"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level2w", x: -175, y: 0 }) },
            requireCtype: "priest",
        },
        osnake: {
            attack: async () => { return attackTheseTypesRanger(bot, ["osnake"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["osnake"], { map: "halloween", x: -589, y: -335 }) },
        },
        phoenix: {
            attack: async () => { return attackTheseTypesRanger(bot, ["phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "phoenix") },
        },
        plantoid: {
            attack: async () => { return attackTheseTypesRanger(bot, ["plantoid"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: -750, y: -125 }) },
            requireCtype: "priest"
        },
        poisio: {
            // TODO: If we can 1shot with hbow, use that instead
            attack: async () => { return await attackTheseTypesRanger(bot, ["poisio"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -121, y: 1360 }) },
        },
        porcupine: {
            attack: async () => { return attackTheseTypesRanger(bot, ["porcupine"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: -829, y: 135 }) },
        },
        pppompom: {
            attack: async () => { return attackTheseTypesRanger(bot, ["pppompom"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level2n", x: 120, y: -170 }) },
            requireCtype: "priest"
        },
        prat: {
            attack: async () => { return attackTheseTypesRanger(bot, ["prat"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level1", x: -280, y: 541 }) },
            requireCtype: "priest"
        },
        rat: {
            // TODO: Optimize positioning
            attack: async () => { return attackTheseTypesRanger(bot, ["rat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "mansion", x: 100, y: -225 }) },
        },
        rooster: {
            attack: async () => { return attackTheseTypesRanger(bot, ["rooster"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -61.5, y: -282 }) },
        },
        scorpion: {
            attack: async () => { return attackTheseTypesRanger(bot, ["scorpion"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 1578, y: -168 }) },
        },
        skeletor: {
            attack: async () => { return attackTheseTypesRanger(bot, ["skeletor"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "arena", x: 380, y: -575 }) },
            requireCtype: "priest",
        },
        snake: {
            attack: async () => { return attackTheseTypesRanger(bot, ["snake"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -82, y: 1901 }) },
        },
        snowman: {
            attack: async () => { return attackTheseTypesRanger(bot, ["snowman"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "hbow", orb: "orbofdex" },
            move: async () => { await goToSpecialMonster(bot, "snowman") },
        },
        spider: {
            attack: async () => { return attackTheseTypesRanger(bot, ["spider"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 948, y: -144 }) },
        },
        squig: {
            attack: async () => { return attackTheseTypesRanger(bot, ["squig", "squigtoad"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -1175, y: 422 }) },
        },
        squigtoad: {
            attack: async () => { return attackTheseTypesRanger(bot, ["squigtoad", "squig"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -1175, y: 422 }) },
        },
        stoneworm: {
            attack: async () => { return attackTheseTypesRanger(bot, ["stoneworm"], information.friends) },
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 677, y: 129 }) },
            requireCtype: "priest"
        },
        tinyp: {
            attack: async () => { return attackTheseTypesRanger(bot, ["tinyp"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "tinyp") },
        },
        tortoise: {
            attack: async () => { return attackTheseTypesRanger(bot, ["tortoise"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "crossbow", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["tortoise"], { map: "main", x: -1124, y: 1118 }) },
        },
        wabbit: {
            attack: async () => { return attackTheseTypesRanger(bot, ["wabbit"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "wabbit") }
        },
        wolf: {
            attack: async () => { return attackTheseTypesRanger(bot, ["wolf"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 400, y: -2525 }) },
            requireCtype: "priest"
        },
        wolfie: {
            attack: async () => { return await attackTheseTypesRanger(bot, ["wolfie"], information.friends) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["wolfie"], { map: "winterland", x: -169, y: -2026 }) },
            requireCtype: "priest"
        },
        xscorpion: {
            attack: async () => { return await attackTheseTypesRanger(bot, ["xscorpion"], information.friends, { targetingPlayer: information.bot3.name }) },
            equipment: { mainhand: "firebow", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: -325, y: 775 }) },
            requireCtype: "priest"
        }
    }

    startRanger(bot, information, strategy)
}

function prepareWarrior(bot: AL.Warrior) {
    const bscorpionSpawn = bot.locateMonster("bscorpion")[0]
    const strategy: Strategy = {
        arcticbee: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["arcticbee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["arcticbee"], { map: "winterland", x: 1062, y: -873 }) },
        },
        bat: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["bat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["bat"], { map: "cave", x: 1243, y: -27 }) },
        },
        bbpompom: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["bbpompom"], information.friends, { disableAgitate: true }) },
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToNearestWalkableToMonster(bot, ["bbpompom"], { map: "winter_cave", x: 31, y: -164 })
            },
        },
        bee: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["bee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["bee"], { map: "main", x: 737, y: 720 }) },
        },
        bigbird: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["bigbird"], information.friends) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: 1323, y: 248 }) },
            requireCtype: "priest",
        },
        boar: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["boar"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 0, y: -1109 }) },
            requireCtype: "priest"
        },
        booboo: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["booboo"], information.friends, { maximumTargets: 1 }) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "spookytown", x: 265, y: -625 }) },
            requireCtype: "priest"
        },
        bscorpion: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["bscorpion"], information.friends, { targetingPlayer: information.bot1.name }) },
            equipment: { mainhand: "fireblade", offhand: "fireblade", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["bscorpion"], bscorpionSpawn) },
            requireCtype: "priest"
        },
        cgoo: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["cgoo"], information.friends) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToNearestWalkableToMonster(bot, ["cgoo"], { map: "arena", x: 151.6, y: 40.82 })
            },
        },
        crab: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["crab"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["crab"], { map: "main", x: -1222, y: -66 }) },
        },
        crabx: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["crabx"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["crabx"], { map: "main", x: -1004, y: 1762 }) },
        },
        croc: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["croc"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["croc"], { map: "main", x: 781, y: 1710 }) },
        },
        cutebee: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["cutebee"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => {
                const nearby = bot.getNearestMonster("cutebee")
                if (nearby) {
                    if (!nearby.monster.target) {
                        // The cutebee will avoid 99.9% of our attacks, so let's try to walk in front of it so that we can aggro it
                        await goToAggroMonster(bot, nearby.monster)
                    } else {
                        await goToNearestWalkableToMonster(bot, ["cutebee"])
                    }
                } else {
                    await goToSpecialMonster(bot, "cutebee")
                }
            },
        },
        dragold: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["dragold"], information.friends) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToSpecialMonster(bot, "dragold")
            },
        },
        fireroamer: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["fireroamer"], information.friends, { targetingPlayer: information.bot1.name }) },
            equipment: { mainhand: "fireblade", offhand: "fireblade", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: 200, y: -675 }) },
            requireCtype: "priest"
        },
        franky: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["nerfedmummy", "franky"], information.friends) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "franky") },
            requireCtype: "priest"
        },
        fvampire: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["fvampire"], information.friends) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToSpecialMonster(bot, "fvampire")
            },
            requireCtype: "priest"
        },
        ghost: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["ghost"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToNearestWalkableToMonster(bot, ["ghost"], { map: "halloween", x: 236, y: -1224 })
            },
        },
        goldenbat: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["goldenbat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "goldenbat") },
        },
        goo: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["goo"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["goo"], { map: "main", x: -52, y: 787 }) },
        },
        greenjr: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["greenjr"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "greenjr") },
        },
        hen: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["hen"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -81.5, y: -282 }) },
        },
        iceroamer: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["iceroamer"], information.friends) },
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToNearestWalkableToMonster(bot, ["iceroamer"], { map: "winterland", x: 1532, y: 104 })
            }
        },
        jr: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["jr"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "jr") },
        },
        minimush: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["minimush"], information.friends, { disableAgitate: true }) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["minimush"], { map: "halloween", x: -18, y: 631 }) },
        },
        mole: {
            attack: async () => {
                // Agitate low level monsters that we can tank so the ranger can kill them quickly with 3shot and 5shot.
                let shouldAgitate = true
                const toAgitate = []
                for (const [, entity] of bot.entities) {
                    if (Tools.distance(bot, entity) > bot.G.skills.agitate.range) continue // Too far to agitate
                    if (entity.target == bot.name) continue // Already targeting us
                    if (entity.type !== "mole" || entity.level > 3) {
                        // Only agitate low level moles
                        shouldAgitate = false
                        break
                    }
                    toAgitate.push(entity)
                }
                if (shouldAgitate && toAgitate.length > 0) await bot.agitate()

                await attackTheseTypesWarrior(bot, ["mole"], information.friends, { maximumTargets: 3 })
            },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "tunnel", x: 5, y: -329 }) },
            requireCtype: "priest"
        },
        mrgreen: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["mrgreen"], information.friends) },
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mrgreen") },
            requireCtype: "priest"
        },
        mrpumpkin: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["mrpumpkin"], information.friends) },
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mrpumpkin") },
            requireCtype: "priest"
        },
        mummy: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["mummy"], information.friends, { maximumTargets: 3 }) },
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => {
                let highestMummyLevel = 0
                for (const [, entity] of bot.entities) {
                    if (entity.type !== "mummy") continue
                    if (entity.level > highestMummyLevel) highestMummyLevel = entity.level
                }
                if (highestMummyLevel <= 1) {
                    // Mummies are low level, stay and rage
                    await bot.smartMove({ map: "spookytown", x: 230, y: -1131 }).catch(() => { /* Suppress errors */ })
                } else {
                    // Stay back
                    await bot.smartMove({ map: "spookytown", x: 230, y: -1129 }).catch(() => { /* Suppress errors */ })
                }
            },
            requireCtype: "priest"
        },
        mvampire: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["mvampire"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "fireblade", offhand: "fireblade", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "mvampire") },
        },
        nerfedmummy: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["nerfedmummy"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "franky") },
        },
        oneeye: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["oneeye"], information.friends, { maximumTargets: 1 }) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level2w", x: -195, y: 0 }) },
            requireCtype: "priest"
        },
        osnake: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["osnake", "snake"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, [], { map: "halloween", x: 347, y: -747 }) },
        },
        phoenix: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["phoenix"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "phoenix") },
        },
        plantoid: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["plantoid"], information.friends, { maximumTargets: 1 }) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "desertland", x: -770, y: -125 }) },
            requireCtype: "priest"
        },
        poisio: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["poisio"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["poisio"], { map: "main", x: -141, y: 1360 }) },
        },
        pppompom: {
            attack: async () => { return attackTheseTypesWarrior(bot, ["pppompom"], information.friends, { maximumTargets: 1 }) },
            equipment: { mainhand: "fireblade", offhand: "fireblade", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "level2n", x: 120, y: -150 }) },
            requireCtype: "priest"
        },
        rat: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["rat"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["rat"], { map: "mansion", x: 0, y: -21 }) },
        },
        rooster: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["rooster"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "main", x: -81.5, y: -282 }) },
        },
        scorpion: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["scorpion"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["scorpion"], { map: "main", x: 1558, y: -168 }) },
        },
        skeletor: {
            attack: async () => { return await attackTheseTypesWarrior(bot, ["skeletor"], information.friends) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "arena", x: 360, y: -575 }) },
            requireCtype: "priest"
        },
        snake: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["snake"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["snake"], { map: "main", x: -102, y: 1901 }) },
        },
        snowman: {
            attack: async () => {
                // Agitate bees to farm them while attacking the snowman
                let shouldAgitate = false
                for (const entity of bot.getEntities({
                    couldGiveCredit: true,
                    targetingMe: false,
                    withinRange: bot.G.skills.agitate.range
                })) {
                    if (entity.type !== "snowman" && !strategy[entity.type].attackWhileIdle) {
                        // Something else is here, don't agitate
                        shouldAgitate = false
                        break
                    }
                    shouldAgitate = true
                }
                if (shouldAgitate && bot.canUse("agitate")) bot.agitate()
                await attackTheseTypesWarrior(bot, ["snowman"], information.friends)
            },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "snowman") },
        },
        spider: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["spider"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["spider"], { map: "main", x: 928, y: -144 }) },
        },
        squig: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["squig", "squigtoad"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["squig"], { map: "main", x: -1195, y: 422 }) },
        },
        squigtoad: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["squigtoad", "squig"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["squigtoad", "squig"], { map: "main", x: -1195, y: 422 }) },
        },
        stoneworm: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["stoneworm"], information.friends, { disableAgitate: true }) },
            equipment: { mainhand: "fireblade", offhand: "candycanesword", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToNearestWalkableToMonster(bot, ["stoneworm"], { map: "spookytown", x: 717, y: 129 })
            },
            requireCtype: "priest"
        },
        tinyp: {
            attack: async () => {
                await attackTheseTypesWarrior(bot, ["tinyp"], information.friends, { disableAgitate: true })
            },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "tinyp") },
        },
        tortoise: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["tortoise"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToNearestWalkableToMonster(bot, ["tortoise"], { map: "main", x: -1144, y: 1118 }) },
        },
        wabbit: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["wabbit"], information.friends) },
            attackWhileIdle: true,
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => { await goToSpecialMonster(bot, "wabbit") },
        },
        wolf: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["wolf"], information.friends, { maximumTargets: 1 }) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "winterland", x: 380, y: -2525 }) },
            requireCtype: "priest"
        },
        wolfie: {
            attack: async () => { await attackTheseTypesWarrior(bot, ["wolfie"], information.friends) },
            equipment: { mainhand: "bataxe", orb: "test_orb" },
            move: async () => {
                await goToPriestIfHurt(bot, information.bot1.bot)
                await goToNearestWalkableToMonster(bot, ["wolfie"], { map: "winterland", x: -189, y: -2026 }) },
            requireCtype: "priest"
        },
        xscorpion: {
            attack: async () => { return await attackTheseTypesWarrior(bot, ["xscorpion"], information.friends, { maximumTargets: 1 }) },
            equipment: { mainhand: "basher", orb: "test_orb" },
            move: async () => { await bot.smartMove({ map: "halloween", x: -325, y: 750 }) },
            requireCtype: "priest"
        }
    }
    startWarrior(bot, information, strategy)
}

async function run() {
    // Login and prepare pathfinding
    await Promise.all([AL.Game.loginJSONFile("../../credentials.json"), AL.Game.getGData(true)])
    await AL.Pathfinder.prepare(AL.Game.G)

    // Start all characters
    console.log("Connecting...")

    // const startMage1Loop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
    //     // Start the characters
    //     const loopBot = async () => {
    //         try {
    //             if (information.bot1.bot) await information.bot1.bot.disconnect()
    //             information.bot1.bot = await AL.Game.startMage(name, region, identifier)
    //             information.friends[1] = information.bot1.bot
    //             prepareMage(information.bot1.bot as AL.Mage)
    //             startTrackerLoop(information.bot1.bot)
    //             information.bot1.bot.socket.on("disconnect", async () => { loopBot() })
    //         } catch (e) {
    //             console.error(e)
    //             if (information.bot1.bot) await information.bot1.bot.disconnect()
    //             const wait = /wait_(\d+)_second/.exec(e)
    //             if (wait && wait[1]) {
    //                 setTimeout(async () => { loopBot() }, 2000 + Number.parseInt(wait[1]) * 1000)
    //             } else if (/limits/.test(e)) {
    //                 setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
    //             } else {
    //                 setTimeout(async () => { loopBot() }, 10000)
    //             }
    //         }
    //     }
    //     loopBot()
    // }
    // startMage1Loop(information.bot1.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    // const startMage2Loop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
    //     // Start the characters
    //     const loopBot = async () => {
    //         try {
    //             if (information.bot3.bot) await information.bot3.bot.disconnect()
    //             information.bot3.bot = await AL.Game.startMage(name, region, identifier)
    //             information.friends[2] = information.bot3.bot
    //             prepareMage(information.bot3.bot as AL.Mage)
    //             information.bot3.bot.socket.on("disconnect", async () => { loopBot() })
    //         } catch (e) {
    //             console.error(e)
    //             if (information.bot3.bot) await information.bot3.bot.disconnect()
    //             const wait = /wait_(\d+)_second/.exec(e)
    //             if (wait && wait[1]) {
    //                 setTimeout(async () => { loopBot() }, 2000 + Number.parseInt(wait[1]) * 1000)
    //             } else if (/limits/.test(e)) {
    //                 setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
    //             } else {
    //                 setTimeout(async () => { loopBot() }, 10000)
    //             }
    //         }
    //     }
    //     loopBot()
    // }
    // startMage2Loop(information.bot3.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startMerchantLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.merchant.bot) await information.merchant.bot.disconnect()
                information.merchant.bot = await AL.Game.startMerchant(name, region, identifier)
                information.friends[0] = information.merchant.bot
                prepareMerchant(information.merchant.bot)
                information.merchant.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.merchant.bot) await information.merchant.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startMerchantLoop(information.merchant.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startPriestLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot1.bot) await information.bot1.bot.disconnect()
                information.bot1.bot = await AL.Game.startPriest(name, region, identifier)
                information.friends[1] = information.bot1.bot
                preparePriest(information.bot1.bot as AL.Priest)
                information.bot1.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.bot1.bot) await information.bot1.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startPriestLoop(information.bot1.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startRangerLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot2.bot) await information.bot2.bot.disconnect()
                information.bot2.bot = await AL.Game.startRanger(name, region, identifier)
                information.friends[2] = information.bot2.bot
                prepareRanger(information.bot2.bot as AL.Ranger)
                startTrackerLoop(information.bot2.bot)
                information.bot2.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.bot2.bot) await information.bot2.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startRangerLoop(information.bot2.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startWarriorLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot3.bot) await information.bot3.bot.disconnect()
                information.bot3.bot = await AL.Game.startWarrior(name, region, identifier)
                information.friends[3] = information.bot3.bot
                prepareWarrior(information.bot3.bot as AL.Warrior)
                information.bot3.bot.socket.on("disconnect", async () => { loopBot() })
            } catch (e) {
                console.error(e)
                if (information.bot3.bot) await information.bot3.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(async () => { loopBot() }, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(async () => { loopBot() }, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(async () => { loopBot() }, 10000)
                }
            }
        }
        loopBot()
    }
    startWarriorLoop(information.bot3.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    // const startMerchantLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
    //     const connectLoop = async () => {
    //         try {
    //             information.merchant.bot = await AL.Game.startMerchant(name, region, identifier)
    //             information.friends[0] = information.merchant.bot
    //             prepareMerchant(information.merchant.bot)
    //         } catch (e) {
    //             console.error(e)
    //             if (information.merchant.bot) await information.merchant.bot.disconnect()
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     }

    //     const disconnectLoop = async () => {
    //         try {
    //             if (information.merchant.bot) await information.merchant.bot.disconnect()
    //             information.merchant.bot = undefined
    //             information.friends[0] = undefined
    //         } catch (e) {
    //             console.error(e)
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    //     }

    //     const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //     setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    // }
    // startMerchantLoop(information.merchant.name, DEFAULT_REGION, DEFAULT_IDENTIFIER)

    // const startPriestLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
    //     const connectLoop = async () => {
    //         try {
    //             information.bot1.bot = await AL.Game.startPriest(name, region, identifier)
    //             information.friends[1] = information.bot1.bot
    //             preparePriest(information.bot1.bot as AL.Priest)
    //         } catch (e) {
    //             console.error(e)
    //             if (information.bot1.bot) await information.bot1.bot.disconnect()
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     }

    //     const disconnectLoop = async () => {
    //         try {
    //             if (information.bot1.bot) await information.bot1.bot.disconnect()
    //             information.bot1.bot = undefined
    //             information.friends[1] = undefined
    //         } catch (e) {
    //             console.error(e)
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    //     }

    //     const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //     setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    // }
    // startPriestLoop(information.bot1.name, DEFAULT_REGION, DEFAULT_IDENTIFIER)

    // const startRangerLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
    //     const connectLoop = async () => {
    //         try {
    //             information.bot2.bot = await AL.Game.startRanger(name, region, identifier)
    //             information.friends[2] = information.bot2.bot
    //             prepareRanger(information.bot2.bot as AL.Ranger)
    //         } catch (e) {
    //             console.error(e)
    //             if (information.bot2.bot) await information.bot2.bot.disconnect()
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     }

    //     const disconnectLoop = async () => {
    //         try {
    //             if (information.bot2.bot) await information.bot2.bot.disconnect()
    //             information.bot2.bot = undefined
    //             information.friends[2] = undefined
    //         } catch (e) {
    //             console.error(e)
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    //     }

    //     const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //     setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    // }
    // startRangerLoop(information.bot2.name, DEFAULT_REGION, DEFAULT_IDENTIFIER)

    // const startWarriorLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
    //     const connectLoop = async () => {
    //         try {
    //             information.bot3.bot = await AL.Game.startWarrior(name, region, identifier)
    //             information.friends[3] = information.bot3.bot
    //             prepareWarrior(information.bot3.bot as AL.Warrior)
    //         } catch (e) {
    //             console.error(e)
    //             if (information.bot3.bot) await information.bot3.bot.disconnect()
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     }

    //     const disconnectLoop = async () => {
    //         try {
    //             if (information.bot3.bot) await information.bot3.bot.disconnect()
    //             information.bot3.bot = undefined
    //             information.friends[3] = undefined
    //         } catch (e) {
    //             console.error(e)
    //         }
    //         const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //         setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    //     }

    //     const msToNextMinute = 60_000 - (Date.now() % 60_000)
    //     setTimeout(async () => { connectLoop() }, msToNextMinute + 10000)
    //     setTimeout(async () => { disconnectLoop() }, msToNextMinute - 10000 < 0 ? msToNextMinute + 50_000 : msToNextMinute - 10000)
    // }
    // startWarriorLoop(information.bot3.name, DEFAULT_REGION, DEFAULT_IDENTIFIER)
}
run()
import AL, { Constants, IPosition, Mage, ServerIdentifier, ServerRegion } from "alclient"
import { startTrackerLoop } from "../base/general.js"
import { Information } from "../definitions/bot.js"
import { DEFAULT_IDENTIFIER, DEFAULT_REGION, startMerchant, startRatMageFarmer } from "./runners.js"

/** Config */
const information: Information = {
    friends: [undefined, undefined, undefined, undefined],
    // eslint-disable-next-line sort-keys
    bot1: {
        bot: undefined,
        name: "lolwutpear",
        target: undefined
    },
    bot2: {
        bot: undefined,
        name: "shoopdawhoop",
        target: undefined
    },
    bot3: {
        bot: undefined,
        name: "ytmnd",
        target: undefined
    },
    merchant: {
        bot: undefined,
        name: "orlyowl",
        nameAlt: "orlyowl",
        target: undefined
    }
}
const merchantLocation: IPosition = { map: "main", x: 50, y: 0 }

async function run() {
    // Login and prepare pathfinding
    await Promise.all([AL.Game.loginJSONFile("../../credentials.json"), AL.Game.getGData(true)])
    await AL.Pathfinder.prepare(AL.Game.G)

    // Start all characters
    console.log("Connecting...")

    const startMerchantLoop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.merchant.bot) information.merchant.bot.disconnect()
                information.merchant.bot = await AL.Game.startMerchant(name, region, identifier)
                information.friends[0] = information.merchant.bot
                startMerchant(information.merchant.bot, information.friends, merchantLocation)
                information.merchant.bot.socket.on("disconnect", loopBot)
            } catch (e) {
                console.error(e)
                if (information.merchant.bot) information.merchant.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(loopBot, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(loopBot, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(loopBot, 10000)
                }
            }
        }
        loopBot()
    }
    startMerchantLoop(information.merchant.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startMage1Loop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot1.bot) information.bot1.bot.disconnect()
                information.bot1.bot = await AL.Game.startMage(name, region, identifier)
                information.friends[1] = information.bot1.bot
                startRatMageFarmer(information.bot1.bot as Mage, information.friends, information.merchant.name, { map: "mansion", x: 240, y: -488 })
                startTrackerLoop(information.bot1.bot)
                information.bot1.bot.socket.on("disconnect", loopBot)
            } catch (e) {
                console.error(e)
                if (information.bot1.bot) information.bot1.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(loopBot, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(loopBot, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(loopBot, 10000)
                }
            }
        }
        loopBot()
    }
    startMage1Loop(information.bot1.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startMage2Loop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot2.bot) information.bot2.bot.disconnect()
                information.bot2.bot = await AL.Game.startMage(name, region, identifier)
                information.friends[2] = information.bot2.bot
                startRatMageFarmer(information.bot2.bot as Mage, information.friends, information.merchant.name, { map: "mansion", x: 223, y: -312 })
                information.bot2.bot.socket.on("disconnect", loopBot)
            } catch (e) {
                console.error(e)
                if (information.bot2.bot) information.bot2.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(loopBot, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(loopBot, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(loopBot, 10000)
                }
            }
        }
        loopBot()
    }
    startMage2Loop(information.bot2.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })

    const startMage3Loop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        // Start the characters
        const loopBot = async () => {
            try {
                if (information.bot3.bot) information.bot3.bot.disconnect()
                information.bot3.bot = await AL.Game.startMage(name, region, identifier)
                information.friends[3] = information.bot3.bot
                startRatMageFarmer(information.bot3.bot as Mage, information.friends, information.merchant.name, { map: "mansion", x: 223, y: -100 })
                information.bot3.bot.socket.on("disconnect", loopBot)
            } catch (e) {
                console.error(e)
                if (information.bot3.bot) information.bot3.bot.disconnect()
                const wait = /wait_(\d+)_second/.exec(e)
                if (wait && wait[1]) {
                    setTimeout(loopBot, 2000 + Number.parseInt(wait[1]) * 1000)
                } else if (/limits/.test(e)) {
                    setTimeout(loopBot, AL.Constants.RECONNECT_TIMEOUT_MS)
                } else {
                    setTimeout(loopBot, 10000)
                }
            }
        }
        loopBot()
    }
    startMage3Loop(information.bot3.name, DEFAULT_REGION, DEFAULT_IDENTIFIER).catch(() => { /* ignore errors */ })
}
run()
import AL from "alclient"
import { startHealLoop, startLootLoop, startAvoidStacking, goToKiteMonster, LOOP_MS, startScareLoop } from "../base/general.js"
import { attackTheseTypesMage } from "../base/mage.js"

/** Config */
const mageName = "earthMag"
const region: AL.ServerRegion = "US"
const identifier: AL.ServerIdentifier = "PVP"
const targets: AL.MonsterName[] = ["bscorpion"]

let bot: AL.Mage

async function startKite(bot: AL.Mage) {
    startHealLoop(bot)
    startLootLoop(bot)
    startScareLoop(bot)

    startAvoidStacking(bot)

    async function attackLoop() {
        try {
            if (!bot.socket || bot.socket.disconnected) return

            if (!bot.canUse("scare", { ignoreEquipped: true })) {
                bot.timeouts.set("attackLoop", setTimeout(async () => { attackLoop() }, bot.getCooldown("scare")))
                return
            }

            await attackTheseTypesMage(bot, targets, [bot])
        } catch (e) {
            console.error(e)
        }
        bot.timeouts.set("attackloop", setTimeout(async () => { attackLoop() }, Math.max(LOOP_MS, bot.getCooldown("attack"))))
    }
    attackLoop()

    async function moveLoop() {
        try {
            if (!bot.socket || bot.socket.disconnected) return

            // If we are dead, respawn
            if (bot.rip) {
                await bot.respawn()
                bot.timeouts.set("moveloop", setTimeout(async () => { moveLoop() }, 1000))
                return
            }

            const nearest = bot.getNearestMonster(targets[0])
            if (!nearest) {
                await bot.smartMove(targets[0], { getWithin: 200 })
            }

            goToKiteMonster(bot, { kiteDistance: bot.range - 25, typeList: targets })
        } catch (e) {
            console.error(e)
        }

        bot.timeouts.set("moveloop", setTimeout(async () => { moveLoop() }, 250))
    }
    moveLoop()
}

async function run() {
    // Login and prepare pathfinding
    await Promise.all([AL.Game.loginJSONFile("../../credentials.json"), AL.Game.getGData(true)])
    await AL.Pathfinder.prepare(AL.Game.G)

    // Start all characters
    console.log("Connecting...")
    const startWarriorLoop = async (name: string, region: AL.ServerRegion, identifier: AL.ServerIdentifier) => {
        const connectLoop = async () => {
            try {
                bot = await AL.Game.startMage(name, region, identifier)
                startKite(bot)
            } catch (e) {
                console.error(e)
                if (bot) await bot.disconnect()
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(async () => { connectLoop() }, msToNextMinute + 5000)
        }

        const disconnectLoop = async () => {
            try {
                if (bot) await bot.disconnect()
                bot = undefined
            } catch (e) {
                console.error(e)
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(async () => { disconnectLoop() }, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
        }

        const msToNextMinute = 60_000 - (Date.now() % 60_000)
        setTimeout(async () => { connectLoop() }, msToNextMinute + 5000)
        setTimeout(async () => { disconnectLoop() }, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
    }
    startWarriorLoop(mageName, region, identifier)
}
run()
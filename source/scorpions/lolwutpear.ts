import AL, { IPosition, MonsterName, ServerIdentifier, ServerRegion, Warrior } from "alclient"
import { goToPotionSellerIfLow, startBuyLoop, startElixirLoop, startHealLoop, startLootLoop, startPartyLoop, startSellLoop, startAvoidStacking, goToNearestWalkableToMonster, goToBankIfFull } from "../base/general.js"
import { mainScorpions, offsetPosition } from "../base/locations.js"
import { attackTheseTypesWarrior, startChargeLoop, startWarcryLoop } from "../base/warrior.js"

/** Config */
const partyLeader = "fgsfds"
const partyMembers = ["fgsfds", "fsjal", "funny"]
const warrior1Name = "fgsfds"
const warrior2Name = "fsjal"
const warrior3Name = "funny"
const region: ServerRegion = "US"
const identifier: ServerIdentifier = "I"
const targets: MonsterName[] = ["scorpion"]
const defaultLocation: IPosition = mainScorpions

let warrior1: Warrior
let warrior2: Warrior
let warrior3: Warrior

async function startWarrior(bot: Warrior, positionOffset: { x: number, y: number } = { x: 0, y: 0 }) {
    startBuyLoop(bot, new Set())
    startElixirLoop(bot, "elixirluck")
    startHealLoop(bot)
    startLootLoop(bot)
    startPartyLoop(bot, partyLeader, partyMembers)
    startSellLoop(bot)

    async function attackLoop() {
        try {
            if (!bot.socket || bot.socket.disconnected) return
            await attackTheseTypesWarrior(bot, targets, [warrior1, warrior2, warrior3], { disableAgitate: true })
        } catch (e) {
            console.error(e)
        }

        bot.timeouts.set("attackLoop", setTimeout(attackLoop, Math.max(10, bot.getCooldown("attack"))))
    }
    attackLoop()

    startAvoidStacking(bot)
    startChargeLoop(bot)

    async function moveLoop() {
        try {
            if (!bot.socket || bot.socket.disconnected) return

            // If we are dead, respawn
            if (bot.rip) {
                await bot.respawn()
                bot.timeouts.set("moveLoop", setTimeout(moveLoop, 250))
                return
            }

            await goToPotionSellerIfLow(bot)
            await goToBankIfFull(bot)

            await goToNearestWalkableToMonster(bot, targets, offsetPosition(defaultLocation, positionOffset.x, positionOffset.y))
        } catch (e) {
            console.error(e)
        }

        bot.timeouts.set("moveLoop", setTimeout(moveLoop, 250))
    }
    moveLoop()

    startWarcryLoop(bot)
}

async function run() {
    // Login and prepare pathfinding
    await Promise.all([AL.Game.loginJSONFile("../../credentials.json"), AL.Game.getGData(true)])
    await AL.Pathfinder.prepare(AL.Game.G)

    // Start all characters
    console.log("Connecting...")
    const startWarrior1Loop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        const connectLoop = async () => {
            try {
                warrior1 = await AL.Game.startWarrior(name, region, identifier)
                startWarrior(warrior1)
            } catch (e) {
                console.error(e)
                if (warrior1) warrior1.disconnect()
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(connectLoop, msToNextMinute + 5000)
        }

        const disconnectLoop = async () => {
            try {
                if (warrior1) warrior1.disconnect()
                warrior1 = undefined
            } catch (e) {
                console.error(e)
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(disconnectLoop, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
        }

        const msToNextMinute = 60_000 - (Date.now() % 60_000)
        setTimeout(connectLoop, msToNextMinute + 5000)
        setTimeout(disconnectLoop, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
    }
    startWarrior1Loop(warrior1Name, region, identifier)

    const startwarrior2Loop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        const connectLoop = async () => {
            try {
                warrior2 = await AL.Game.startWarrior(name, region, identifier)
                startWarrior(warrior2)
            } catch (e) {
                console.error(e)
                if (warrior2) warrior2.disconnect()
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(connectLoop, msToNextMinute + 5000)
        }

        const disconnectLoop = async () => {
            try {
                if (warrior2) warrior2.disconnect()
                warrior2 = undefined
            } catch (e) {
                console.error(e)
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(disconnectLoop, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
        }

        const msToNextMinute = 60_000 - (Date.now() % 60_000)
        setTimeout(connectLoop, msToNextMinute + 5000)
        setTimeout(disconnectLoop, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
    }
    startwarrior2Loop(warrior2Name, region, identifier)

    const startwarrior3Loop = async (name: string, region: ServerRegion, identifier: ServerIdentifier) => {
        const connectLoop = async () => {
            try {
                warrior3 = await AL.Game.startWarrior(name, region, identifier)
                startWarrior(warrior3)
            } catch (e) {
                console.error(e)
                if (warrior3) warrior3.disconnect()
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(connectLoop, msToNextMinute + 5000)
        }

        const disconnectLoop = async () => {
            try {
                if (warrior3) warrior3.disconnect()
                warrior3 = undefined
            } catch (e) {
                console.error(e)
            }
            const msToNextMinute = 60_000 - (Date.now() % 60_000)
            setTimeout(disconnectLoop, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
        }

        const msToNextMinute = 60_000 - (Date.now() % 60_000)
        setTimeout(connectLoop, msToNextMinute + 5000)
        setTimeout(disconnectLoop, msToNextMinute - 5000 < 0 ? msToNextMinute + 55_000 : msToNextMinute - 5000)
    }
    startwarrior3Loop(warrior3Name, region, identifier)
}
run()
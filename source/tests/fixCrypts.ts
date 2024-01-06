import AL, { EntitiesData, MonsterName, Rogue, ServerIdentifier, ServerRegion } from "alclient"
import { Strategist } from "../strategy_pattern/context.js"
import { AlwaysInvisStrategy } from "../strategy_pattern/strategies/invis.js"
import { RespawnStrategy } from "../strategy_pattern/strategies/respawn.js"
import { CRYPT_MONSTERS } from "../base/crypt.js"

const credentials = "../../credentials.json"
const rogueName = "earthRog"
const serverRegion: ServerRegion = "US"
const serverIdentifier: ServerIdentifier = "III"

async function run() {
    console.log("Connecting...")
    await Promise.all([AL.Game.loginJSONFile(credentials, false), AL.Game.getGData(true)])
    await AL.Pathfinder.prepare(AL.Game.G, { cheat: false })

    const rogue = await AL.Game.startRogue(rogueName, serverRegion, serverIdentifier)
    const context = new Strategist<Rogue>(rogue)
    context.applyStrategy(new AlwaysInvisStrategy())
    context.applyStrategy(new RespawnStrategy())
    // TODO: Add strategy to scare if we have a target

    const instances = await AL.InstanceModel.find({
        serverIdentifier: serverIdentifier,
        serverRegion: serverRegion,
        map: "crypt"
    }).lean().exec();

    let num = 1
    const total = instances.length

    // TODO: Add support if we find all the missing entities to stop searching and go to the next one
    for (const instance of instances) {
        console.debug(`Trying to fix ${instance.map} ${instance.in} (${num}/${total})...`)

        let found = new Map<MonsterName, Set<string>>()
        let error = false

        const listener = (data: EntitiesData) => {
            for (const monster of data.monsters) {
                if (CRYPT_MONSTERS.includes(monster.type)) {
                    if (found.has(monster.type)) {
                        // Make sure the ID is in the set
                        const ids = found.get(monster.type)
                        ids.add(monster.id)
                    } else {
                        // Create the set with the ID
                        console.debug(`We found a ${monster.type} in ${instance.map} ${instance.in}`)
                        found.set(monster.type, new Set([monster.id]))
                    }
                }
            }
        }
        context.bot.socket.on("entities", listener)

        // Top right of map
        await rogue.smartMove({
            in: instance.in,
            map: instance.map,
            x: 2750,
            y: -1750
        }).catch((e) => {
            console.error(e)
            error = true
        })

        // Near crypt bats
        await rogue.smartMove({
            in: instance.in,
            map: instance.map,
            x: 1450,
            y: -550
        }).catch((e) => {
            console.error(e)
            error = true
        })

        // End of crypt
        await rogue.smartMove({
            in: instance.in,
            map: instance.map,
            x: 2500,
            y: 450
        }).catch((e) => {
            console.error(e)
            error = true
        })

        context.bot.socket.off("entities", listener)
        if (found.size === 0 && !error) {
            console.debug(`No monsters were found on ${instance.map} ${instance.in}, deleting...`)
            await AL.InstanceModel.deleteOne({ _id: instance._id }).lean().exec()
            await AL.EntityModel.deleteMany({ in: instance.in, serverIdentifier: instance.serverIdentifier, serverRegion: instance.serverRegion }).lean().exec()
        }
        num += 1
    }

    console.debug("Disconnecting...")
    context.stop()
    AL.Database.disconnect()
}

run()

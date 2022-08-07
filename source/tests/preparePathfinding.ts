import AL, { IPosition, Pathfinder } from "alclient"

async function run() {
    // Login and prepare pathfinding
    await Promise.all([AL.Game.loginJSONFile("../../credentials.json"), AL.Game.getGData(true)])
    const now1 = performance.now()
    await AL.Pathfinder.prepare(AL.Game.G, {
        maps: ["main", "winterland"]
    })
    console.log(`Took ${performance.now() - now1}ms to prepare pathfinding.`)

    // const x = 126
    // const y = -413
    // console.log(`${x},${y}: ${Pathfinder.canStand({ map: "main", x: x, y: y })}`)
    // for (const [dX, dY] of [[0, 0], [-10, 0], [10, 0], [0, -10], [0, 10], [-10, -10], [-10, 10], [10, -10], [10, 10]]) {
    //     const roundedX = Math.round((x + dX) / 10) * 10
    //     const roundedY = Math.round((y + dY) / 10) * 10
    //     console.log(`${roundedX},${roundedY}: ${Pathfinder.canStand({ map: "main", x: roundedX, y: roundedY })}`)
    // }

    // const closestTo = (position: IPosition) => {
    //     console.log(`Closest node to ${position.map}:${position.x},${position.y}`)
    //     console.log(Pathfinder.findClosestNode(position.map, position.x, position.y).id)
    // }

    // closestTo({ map: "level1", x: -296, y: 183 })
    // closestTo({ map: "level1", x: -296, y: 558 })

    // console.log(Pathfinder.locateMonster("goo"))

    console.log(Pathfinder.canWalkPath({
        map: "winterland",
        x: 633.5863705515645,
        y: 43.07499775832615
    },
    {
        map: "winterland",
        x: 867.5648224081189,
        y: -89.23400075771264
    }))

    // const now1 = performance.now()
    // await Pathfinder.getPath({ map: "main", x: 0, y: 0 }, { map: "spookytown", x: 0, y: 0 })
    // console.log(`Took ${performance.now() - now1}ms to perform the search from main to spookytown.`)

    const now2 = performance.now()
    await Pathfinder.getPath({ map: "main", x: 0, y: 0 }, { map: "main", x: -967, y: -169 })
    console.log(`Took ${performance.now() - now2}ms to perform the search from main to crab door.`)

    AL.Database.disconnect()
}
run().catch(console.error)
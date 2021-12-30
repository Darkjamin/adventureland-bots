import { PingCompensatedCharacter } from "alclient"
import { Loop, Loops } from "../context.js"

export class GetMonsterHuntStrategy<Type extends PingCompensatedCharacter> {
    public name = "GetMonsterHuntStrategy"
    public loops: Loops<Type> = new Map<string, Loop<Type>>()

    public constructor() {
        this.loops.set("move", {
            fn: async (bot: Type) => { await this.getMonsterHunt(bot) },
            interval: 100
        })
    }

    async getMonsterHunt(bot: Type) {
        if (bot.s.monsterhunt) return // We already have a monster hunt
        await bot.smartMove("monsterhunter", { getWithin: 350 })
        await bot.getMonsterHuntQuest()
    }
}

export class FinishMonsterHuntStrategy<Type extends PingCompensatedCharacter> {
    public name = "GetMonsterHuntStrategy"
    public loops: Loops<Type> = new Map<string, Loop<Type>>()

    public constructor() {
        this.loops.set("move", {
            fn: async (bot: Type) => { await this.turnInMonsterHunt(bot) },
            interval: 100
        })
    }

    async turnInMonsterHunt(bot: Type) {
        if (!bot.s.monsterhunt) return // We already have a monster hunt
        await bot.smartMove("monsterhunter", { getWithin: 350 })
        await bot.finishMonsterHuntQuest()
    }
}
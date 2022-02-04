import { PingCompensatedCharacter } from "alclient"
import { sleep } from "../../base/general.js"
import { Loop, Loops, Strategy } from "../context.js"

export class BaseStrategy<Type extends PingCompensatedCharacter> implements Strategy<Type> {
    public name = "BaseStrategy"
    public loops: Loops<Type> = new Map<string, Loop<Type>>()

    public constructor() {
        this.loops.set("heal", {
            fn: async (bot: Type) => { await this.heal(bot) },
            interval: ["use_hp"]
        })
        this.loops.set("loot", {
            fn: async (bot: Type) => { await this.loot(bot) },
            interval: 250
        })
    }

    async heal(bot: Type) {
        if (bot.rip)
            return

        const missingHP = bot.max_hp - bot.hp
        const missingMP = bot.max_mp - bot.mp
        const hpRatio = bot.hp / bot.max_hp
        const mpRatio = bot.mp / bot.max_mp
        const hpot1 = bot.locateItem("hpot1")
        const hpot0 = bot.locateItem("hpot0")
        const mpot1 = bot.locateItem("mpot1")
        const mpot0 = bot.locateItem("mpot0")
        if (hpRatio < mpRatio) {
            if (bot.c.town || bot.s.fishing) {
                await bot.regenHP()
            } else if (missingHP >= 400 && hpot1 !== undefined) {
                await bot.useHPPot(hpot1)
            } else if (missingHP >= 200 && hpot0 !== undefined) {
                await bot.useHPPot(hpot0)
            } else {
                await bot.regenHP()
            }
        } else if (mpRatio < hpRatio) {
            if (bot.c.town || bot.s.fishing) {
                await bot.regenHP()
            } else if (missingMP >= 500 && mpot1 !== undefined) {
                await bot.useMPPot(mpot1)
            } else if (missingMP >= 300 && mpot0 !== undefined) {
                await bot.useMPPot(mpot0)
            } else {
                await bot.regenMP()
            }
        } else if (hpRatio < 1) {
            if (bot.c.town || bot.s.fishing) {
                await bot.regenHP()
            } else if (missingHP >= 400 && hpot1 !== undefined) {
                await bot.useHPPot(hpot1)
            } else if (missingHP >= 200 && hpot0 !== undefined) {
                await bot.useHPPot(hpot0)
            } else {
                await bot.regenHP()
            }
        }
    }

    async loot(bot: Type) {
        const [chest] = bot.chests
        if (chest) await bot.openChest(chest[0])
        else return sleep(100)
    }
}
import AL, { Character } from "alclient"
import { Loop, LoopName, Strategy } from "../context.js"
import { tracker_monsters_killed, tracker_exchanges, monster_achievement_bonuses, updateMonsterAchievementBonuses } from "./metrics.js"

export type TrackerStrategyOptions = {
    /** How often to call to update statistics */
    interval: number
}

export class TrackerStrategy implements Strategy<Character> {
    public loops = new Map<LoopName, Loop<Character>>()

    public constructor(options: TrackerStrategyOptions = { interval: 300_000 }) {
        this.loops.set("tracker", {
            fn: async (bot: Character) => { await this.checkTracker(bot) },
            interval: options?.interval ?? 300_000
        })
    }

    private async checkTracker(bot: Character) {
        // This strategy is only useful if we have a database connection, because the only reason we're calling
        // `tracker` is to update the database with achievement progress.
        if (!AL.Database.connection) return

        if (bot.hasItem(["tracker", "supercomputer"]) && bot.cc < 100) {
            const trackerData = await bot.getTrackerData()
            this.updateTrackerMetrics(bot, trackerData)
        } else {
            console.debug(`[${bot.id}] Didn't check tracker!?`)
            console.debug(`[${bot.id}] tracker: ${bot.hasItem("tracker")}`)
            console.debug(`[${bot.id}] supercomputer: ${bot.hasItem("supercomputer")}`)
            console.debug(`[${bot.id}] bot.cc: ${bot.cc}`)
        }
    }

    private updateTrackerMetrics(bot: Character, trackerData: any) {
      
        //Add this line to update the monster achievement bonuses
    updateMonsterAchievementBonuses(trackerData);

        // Handle monsters killed
        if (trackerData.monsters) {
            for (const [monsterName, count] of Object.entries(trackerData.monsters)) {
               
                tracker_monsters_killed.labels({ 
                    character: bot.name, 
                    monster: monsterName 
                }).set(count as number);
            }
        }

        // Handle exchanges
        if (trackerData.exchanges) {
            for (const [itemName, count] of Object.entries(trackerData.exchanges)) {
              
                tracker_exchanges.labels({ 
                    character: bot.name, 
                    item: itemName 
                }).set(count as number);
            }
        }
    }
}
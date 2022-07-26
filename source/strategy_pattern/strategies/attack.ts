import AL, { Character, Entity, GetEntitiesFilters, Mage, SkillName } from "alclient"
import FastPriorityQueue from "fastpriorityqueue"
import { sortPriority } from "../../base/sort.js"
import { Loop, LoopName, Strategy } from "../context.js"

export type BaseAttackStrategyOptions = GetEntitiesFilters & {
    characters: Character[]
    disableCreditCheck?: boolean
    disableEnergize?: boolean
    disableZapper?: boolean
    maximumTargets?: number
}

export class BaseAttackStrategy<Type extends Character> implements Strategy<Type> {
    public loops = new Map<LoopName, Loop<Type>>()
    public options: BaseAttackStrategyOptions
    public sortPriority: (a: Entity, b: Entity) => boolean

    public constructor(options?: BaseAttackStrategyOptions) {
        this.options = options ?? {
            characters: []
        }
        if (!this.options.disableCreditCheck && this.options.couldGiveCredit === undefined) this.options.couldGiveCredit = true
        if (this.options.willDieToProjectiles === undefined) this.options.willDieToProjectiles = false

        this.loops.set("attack", {
            fn: async (bot: Type) => {
                if (!this.shouldAttack(bot)) return
                await this.attack(bot)
            },
            interval: ["attack"]
        })
    }

    protected async attack(bot: Type) {
        const priority = sortPriority(bot, this.options.typeList)

        await this.basicAttack(bot, priority)
        if (!this.options.disableZapper) await this.zapperAttack(bot, priority)
    }

    protected async basicAttack(bot: Type, priority: (a: Entity, b: Entity) => boolean): Promise<void> {
        if (!bot.canUse("attack")) return // We can't attack

        // Find all targets we want to attack
        this.options.withinRange = "attack"
        this.options.canDamage = "attack"
        const entities = bot.getEntities(this.options)
        if (entities.length == 0) return // No targets to attack

        // Prioritize the entities
        const targets = new FastPriorityQueue<Entity>(priority)
        for (const entity of entities) targets.add(entity)

        // Attack the highest priority entity
        const target = targets.poll()
        const canKill = bot.canKillInOneShot(target)
        if (canKill) this.preventOverkill(bot, target)
        if (!canKill || targets.size > 0) this.getEnergizeFromOther(bot)

        await bot.basicAttack(target.id).catch(console.error)
    }

    protected async zapperAttack(bot: Type, priority: (a: Entity, b: Entity) => boolean) {
        if (!bot.hasItem("zapper") && !bot.isEquipped("zapper")) return // We don't have a zapper
        if (!bot.canUse("zapperzap", { ignoreEquipped: true })) return // We can't use it

        // Find all targets we want to attack
        this.options.withinRange = "zapperzap"
        this.options.canDamage = "zapperzap"
        const entities = bot.getEntities(this.options)
        if (bot.mp < bot.max_mp - 500) {
            // When we're not near full mp, only zap if we can kill the entity in one shot
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i]
                if (!bot.canKillInOneShot(entity, "zapperzap")) {
                    entities.splice(i, 1)
                    i--
                    continue
                }
            }
        }

        if (entities.length == 0) return // No targets to attack

        // Prioritize the entities
        const targets = new FastPriorityQueue<Entity>(priority)

    }

    /**
     * If we have `options.characters` set, we look for a mage that can energize us.
     *
     * @param bot The bot to energize
     */
    protected getEnergizeFromOther(bot: Character) {
        if (!bot.s.energized && !this.options.disableEnergize) {
            for (const char of this.options.characters) {
                if (!char) continue // Friend is missing
                if (char.socket.disconnected) continue // Friend is disconnected
                if (char == bot) continue // Can't energize ourselves
                if (AL.Tools.distance(bot, char) > bot.G.skills.energize.range) continue // Too far away
                if (!char.canUse("energize")) continue // Friend can't use energize

                // Energize!
                (char as Mage).energize(bot.id, Math.min(100, Math.max(1, bot.max_mp - bot.mp))).catch(console.error)
                return
            }
        }
    }

    /**
     * Call this function if we are going to kill the target
     *
     * If we have `options.characters` set, calling this will remove the target from the other
     * characters so they won't attack it.
     *
     * @param bot The bot that is performing the attack
     * @param target The target we will kill
     */
    protected preventOverkill(bot: Character, target: Entity) {
        for (const char of this.options.characters) {
            if (!char) continue
            if (char == bot) continue // Don't remove it from ourself
            if (AL.Constants.SPECIAL_MONSTERS.includes(target.type)) continue // Don't delete special monsters
            char.deleteEntity(target.id)
        }
    }

    /**
     * Check if we should attack with the bot, or if there's a reason we shouldn't.
     *
     * @param bot The bot that is attacking
     */
    protected shouldAttack(bot: Character) {
        if (bot.c.town) return false // Don't attack if teleporting
        if (bot.isOnCooldown("scare")) return false // Don't attack if scare is on cooldown
        return true
    }
}
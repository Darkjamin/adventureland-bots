import AL from "alclient-mongo"
import FastPriorityQueue from "fastpriorityqueue"

export async function attackTheseTypesRogue(bot: AL.Rogue, types: AL.MonsterName[], friends: AL.Character[] = [], options?: {
    disableMentalBurst?: boolean
    disableQuickPunch?: boolean
    disableQuickStab?: boolean
    targetingPlayer?: string
}): Promise<void> {
    if (bot.c.town) return // Don't attack if teleporting
    const attackPriority = (a: AL.Entity, b: AL.Entity): boolean => {
        // Order in array
        const a_index = types.indexOf(a.type)
        const b_index = types.indexOf(b.type)
        if (a_index < b_index) return true
        else if (a_index > b_index) return false

        // Has a target -> higher priority
        if (a.target && !b.target) return true
        else if (!a.target && b.target) return false

        // Could die -> lower priority
        const a_couldDie = a.couldDieToProjectiles(bot.projectiles, bot.players, bot.entities)
        const b_couldDie = b.couldDieToProjectiles(bot.projectiles, bot.players, bot.entities)
        if (!a_couldDie && b_couldDie) return true
        else if (a_couldDie && !b_couldDie) return false

        // Will burn to death -> lower priority
        const a_willBurn = a.willBurnToDeath()
        const b_willBurn = b.willBurnToDeath()
        if (!a_willBurn && b_willBurn) return true
        else if (a_willBurn && !b_willBurn) return false

        // Lower HP -> higher priority
        if (a.hp < b.hp) return true
        else if (a.hp > b.hp) return false

        // Closer -> higher priority
        return AL.Tools.distance(a, bot) < AL.Tools.distance(b, bot)
    }

    if (bot.canUse("mentalburst")) {
        const targets: AL.Entity[] = []
        for (const entity of bot.getEntities({
            couldGiveCredit: true,
            targetingPlayer: options?.targetingPlayer,
            typeList: types,
            willDieToProjectiles: false,
            withinRange: (bot.range * bot.G.skills.mentalburst.range_multiplier) + bot.G.skills.mentalburst.range_bonus
        })) {
            if (!bot.canKillInOneShot(entity, "mentalburst")) continue
            targets.push(entity)
        }

        if (targets.length) {
            const target = targets[0]
            for (const friend of friends) {
                if (!friend) continue // No friend
                if (friend.id == bot.id) continue // Don't delete it from our own list
                friend.entities.delete(target.id)
            }
            await bot.mentalBurst(target.id)
        }
    }

    if (bot.canUse("attack")) {
        const targets = new FastPriorityQueue<AL.Entity>(attackPriority)
        for (const entity of bot.getEntities({
            couldGiveCredit: true,
            targetingPlayer: options?.targetingPlayer,
            typeList: types,
            willDieToProjectiles: false,
            withinRange: bot.range
        })) {
            targets.add(entity)
        }

        const target = targets.peek()
        if (!target) return // No target

        if (bot.canKillInOneShot(target)) {
            for (const friend of friends) {
                if (!friend) continue // No friend
                if (friend.id == bot.id) continue // Don't delete it from our own list
                friend.entities.delete(target.id)
            }
        }

        // Use our friends to energize
        if (!bot.s.energized) {
            for (const friend of friends) {
                if (!friend) continue // No friend
                if (friend.socket.disconnected) continue // Friend is disconnected
                if (friend.id == bot.id) continue // Can't energize ourselves
                if (AL.Tools.distance(bot, friend) > bot.G.skills.energize.range) continue // Too far away
                if (!friend.canUse("energize")) continue // Friend can't use energize

                // Energize!
                (friend as AL.Mage).energize(bot.id)
                break
            }
        }

        await bot.basicAttack(target.id)
    }

    if (!options?.disableQuickPunch && bot.canUse("quickpunch")) {
        const targets = new FastPriorityQueue<AL.Entity>(attackPriority)
        for (const entity of bot.getEntities({
            couldGiveCredit: true,
            targetingPlayer: options?.targetingPlayer,
            typeList: types,
            willDieToProjectiles: false,
            withinRange: bot.range
        })) {
            targets.add(entity)
        }

        const target = targets.peek()
        if (!target) return // No target

        if (bot.canKillInOneShot(target, "quickpunch")) {
            for (const friend of friends) {
                if (!friend) continue // No friend
                if (friend.id == bot.id) continue // Don't delete it from our own list
                friend.entities.delete(target.id)
            }
        }

        if (target) await bot.quickPunch(target.id)
    }

    if (!options?.disableQuickStab && bot.canUse("quickstab")) {
        const targets = new FastPriorityQueue<AL.Entity>(attackPriority)
        for (const entity of bot.getEntities({
            couldGiveCredit: true,
            targetingPlayer: options?.targetingPlayer,
            typeList: types,
            willDieToProjectiles: false,
            withinRange: bot.range
        })) {
            targets.add(entity)
        }

        const target = targets.peek()
        if (!target) return // No target

        if (bot.canKillInOneShot(target, "quickstab")) {
            for (const friend of friends) {
                if (!friend) continue // No friend
                if (friend.id == bot.id) continue // Don't delete it from our own list
                friend.entities.delete(target.id)
            }
        }

        if (target) await bot.quickStab(target.id)
    }
}
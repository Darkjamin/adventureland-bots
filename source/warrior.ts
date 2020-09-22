import { Character } from "./character"
import { MonsterName, Entity } from "./definitions/adventureland"
import { transferItemsToMerchant, sellUnwantedItems, transferGoldToMerchant } from "./trade"
import { TargetPriorityList } from "./definitions/bots"
import { getCooldownMS, calculateDamageRange, isAvailable, findItems, getEntities } from "./functions"

const DIFFICULT = 10
const MEDIUM = 20
const EASY = 30
const SPECIAL = 500

class Warrior extends Character {
    targetPriority: TargetPriorityList = {
        "arcticbee": {
            "priority": EASY,
            "equip": ["woodensword", "candycanesword", "jacko"]
        },
        "bat": {
            "priority": EASY,
            "farmingPosition": {
                "map": "cave",
                "x": 1250,
                "y": -800
            },
            "equip": ["basher", "jacko"]
        },
        "bbpompom": {
            "coop": ["priest"],
            "holdPositionFarm": true,
            "holdAttackWhileMoving": true,
            "priority": DIFFICULT,
            "farmingPosition": {
                "map": "winter_cave",
                "x": 0,
                "y": -100
            },
            "equip": ["basher", "jacko"]
        },
        "bee": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "boar": {
            // The ranger is fast enough to kill these without dying too much.
            "coop": ["warrior", "priest"],
            "priority": DIFFICULT,
            "holdAttackWhileMoving": true,
            "holdPositionFarm": true,
            farmingPosition: {
                "map": "winterland",
                "x": 0,
                "y": -850
            },
            "equip": ["basher", "jacko"]
        },
        "crab": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "crabx": {
            "priority": MEDIUM,
            "equip": ["basher", "jacko"]
        },
        "croc": {
            "priority": EASY,
            "equip": ["woodensword", "candycanesword", "orbg"]
        },
        // "dragold": {
        //     "coop": ["priest"],
        //     "priority": SPECIAL,
        //     "holdAttackWhileMoving": true
        // },
        "fireroamer": {
            "coop": ["priest"],
            "priority": 0,
            "holdPositionFarm": true,
            "holdAttackWhileMoving": true,
            "attackOnlySingleTarget": true,
            "farmingPosition": {
                "map": "desertland",
                "x": 200,
                "y": -700
            },
            "equip": ["basher", "jacko"]
        },
        "fvampire": {
            "coop": ["priest", "ranger"],
            "priority": 0,
            "holdAttackWhileMoving": true,
            "holdPositionFarm": true,
            "farmingPosition": {
                "map": "halloween",
                "x": -150,
                "y": -1575
            },
            "equip": ["basher", "jacko"]
        },
        "ghost": {
            "coop": ["priest"],
            "priority": 0,
            "holdAttackWhileMoving": true,
            "holdPositionFarm": true,
            "farmingPosition": {
                "map": "halloween",
                "x": 400,
                "y": -1100
            },
            "equip": ["basher", "jacko"]
        },
        "goldenbat": {
            "priority": SPECIAL,
            "farmingPosition": {
                "map": "cave",
                "x": 1250,
                "y": -800
            },
            "equip": ["basher", "jacko"]
        },
        "goo": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "greenjr": {
            "priority": DIFFICULT,
            "holdAttackInEntityRange": true,
            "holdAttackWhileMoving": true,
            "equip": ["basher", "jacko"]
        },
        "mechagnome": {
            "coop": ["priest", "ranger"],
            "holdPositionFarm": true,
            "holdAttackWhileMoving": true,
            "priority": DIFFICULT,
            "farmingPosition": {
                "map": "cyberland",
                "x": 150,
                "y": -100
            },
            "equip": ["basher", "jacko"]
        },
        "minimush": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "mole": {
            "coop": ["priest", "warrior"],
            "holdPositionFarm": true,
            "holdAttackWhileMoving": true,
            "priority": DIFFICULT,
            "farmingPosition": {
                "map": "tunnel",
                "x": 0,
                "y": -75
            },
            "equip": ["basher", "jacko"]
        },
        "mummy": {
            "coop": ["priest"],
            "priority": DIFFICULT,
            "holdPositionFarm": true,
            "holdAttackWhileMoving": true,
            "farmingPosition": {
                "map": "spookytown",
                "x": 255,
                "y": -1125
            },
            "equip": ["basher", "jacko"]
        },
        "mvampire": {
            priority: DIFFICULT,
            "coop": ["priest"],
            "equip": ["basher", "jacko"]
        },
        "oneeye": {
            "coop": ["ranger", "priest"],
            "priority": 0,
            "holdAttackWhileMoving": true,
            "holdPositionFarm": true,
            "farmingPosition": {
                "map": "level2w",
                "x": -150,
                "y": 0
            },
            "equip": ["basher", "jacko"]
        },
        "osnake": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "phoenix": {
            "priority": SPECIAL,
            "equip": ["woodensword", "candycanesword", "orbg"]
        },
        // "pinkgoblin": {
        //     "priority": 100,
        //     "holdAttackWhileMoving": true,
        //     "coop": ["priest", "ranger"],
        //     "equip": ["basher"]
        // },
        "pinkgoo": {
            "priority": 1000,
            "equip": ["candycanesword", "woodensword", "jacko"]
        },
        "plantoid": {
            "priority": 0,
            "holdAttackInEntityRange": true,
            "holdAttackWhileMoving": true,
            "attackOnlySingleTarget": true,
            "coop": ["priest"],
            "equip": ["firebow", "t2quiver", "jacko"]
        },
        "poisio": {
            priority: MEDIUM,
            "equip": ["woodensword", "candycanesword", "orbg"]
        },
        "rat": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "scorpion": {
            "priority": MEDIUM,
            "equip": ["woodensword", "candycanesword", "jacko"]
        },
        "snake": {
            // Farm them on the main map because of the +1000% luck and gold bonus chances
            "priority": EASY, // TODO: Temporary
            farmingPosition: {
                "map": "main",
                "x": -74,
                "y": 1904
            },
            "equip": ["bataxe", "orbg"]
        },
        "snowman": {
            "priority": SPECIAL,
            "equip": ["candycanesword", "woodensword", "jacko"]
        },
        "spider": {
            "priority": MEDIUM,
            "equip": ["woodensword", "candycanesword", "jacko"]
        },
        "squig": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "tinyp": {
            "priority": SPECIAL,
            "equip": ["basher", "orbg"],
            "attackOnlyWhenImmobile": true
        },
        "squigtoad": {
            "priority": EASY,
            "equip": ["bataxe", "orbg"]
        },
        "tortoise": {
            "priority": EASY,
            "equip": ["woodensword", "candycanesword", "orbg"]
        },
        "wolf": {
            "coop": ["priest"],
            "priority": 0,
            "holdPositionFarm": true,
            "holdAttackWhileMoving": true,
            "farmingPosition": {
                "map": "winterland",
                "x": 450,
                "y": -2500
            },
            "equip": ["basher", "jacko"]
        },
        "wolfie": {
            // The ranger is fast enough to kill these without dying too much.
            "coop": ["warrior", "priest"],
            "priority": DIFFICULT,
            "holdAttackWhileMoving": true,
            "holdPositionFarm": true,
            farmingPosition: {
                "map": "winterland",
                "x": 0,
                "y": -1825
            },
            "equip": ["basher", "jacko"]
        },
    }
    mainTarget: MonsterName = "scorpion"

    constructor() {
        super()
        this.itemsToKeep.push(
            // Weapons
            "basher", "bataxe", "candycanesword", "carrotsword", "fireblade", "fsword", "sword", "swordofthedead", "wblade", "woodensword",

            // Offhands
            "lantern",

            // Shields
            "mshield", "shield", "sshield", "xshield"
        )
    }

    async run() {
        await super.run()
        this.agitateLoop()
        this.chargeLoop()
        this.hardshellLoop()
        this.cleaveLoop()
        this.stompLoop()
        this.warcryLoop()
        this.tauntLoop()
    }

    async mainLoop(): Promise<void> {
        try {
            transferItemsToMerchant(process.env.MERCHANT, this.itemsToKeep)
            transferGoldToMerchant(process.env.MERCHANT, 100000)
            sellUnwantedItems(this.itemsToSell)

            await super.mainLoop()
        } catch (error) {
            console.error(error)
            setTimeout(async () => { this.mainLoop() }, 250)
        }
    }
    protected async scareLoop() {
        try {
            const targets = getEntities({ isAttackingUs: true, isRIP: false, isMonster: true })
            let wantToScare = false
            if (targets.length >= 4) {
                wantToScare = true
            } else if (targets.length && !this.targetPriority[targets[0].mtype]) {
                wantToScare = true
            } else if (targets.length && parent.character.c.town) {
                wantToScare = true
            } else {
                for (const target of targets) {
                    if (distance(target, parent.character) > target.range) continue // They're out of range
                    if (calculateDamageRange(target, parent.character)[1] * 6 * target.frequency <= parent.character.hp) continue // We can tank a few of their shots
                    // if (this.targets[target.mtype]) continue

                    wantToScare = true
                    break
                }
                if (targets.length > 1) {
                    for (const target of targets) {
                        if (this.targetPriority[target.mtype].attackOnlySingleTarget) {
                            // We have more than one target, but we have a monster we only want to attack as a single target
                            wantToScare = true
                            break
                        }
                    }
                }
            }

            if (wantToScare) {
                if (parent.character.slots.orb.name !== "jacko") {
                    // Equip the orb, then scare
                    const jackos = findItems("jacko")
                    if (jackos.length) {
                        equip(jackos[0].index) // Equip the jacko
                        await use_skill("scare") // Scare the monsters away
                        reduce_cooldown("scare", Math.min(...parent.pings))
                    }
                } else if (isAvailable("scare")) {
                    await use_skill("scare")
                    reduce_cooldown("scare", Math.min(...parent.pings))
                }
            }
        } catch (error) {
            console.error(error)
        }
        setTimeout(async () => { this.scareLoop() }, getCooldownMS("scare"))
    }

    // TODO: Improve. 
    protected async agitateLoop() {
        try {
            if (isAvailable("agitate")
                && !parent.character.c.town /* Don't use if we're teleporting */) {
                let inAgitateCount = 0
                let dps = 0
                let dpsLimit = 500
                const priests = getEntities({ isCtype: "priest", isPartyMember: true })
                for (const priest of priests) {
                    if (distance(parent.character, priest) > priest.range) continue // Priest is out of range
                    dpsLimit += (priest.attack * 0.9 * priest.frequency) / 2
                }

                // TODO: Improve getEntities to add isTargetingOtherPlayer
                // const entities = getEntities({isMonster: true, isRIP: false, isat})

                for (const id in parent.entities) {
                    const e = parent.entities[id]
                    if (e.type != "monster") continue
                    if (e.rip) continue

                    // You can't agitate monsters that are attacking other players, so don't count them
                    if (e.target && !parent.party_list.includes(e.target)) continue

                    const d = distance(parent.character, e)
                    if (d > G.skills["agitate"].range) continue // Out of range

                    if (!this.wantToAttack(e)) {
                        // Something we don't want is here
                        inAgitateCount = 10
                        dps = 9999
                        break
                    }

                    inAgitateCount++
                    dps += calculateDamageRange(e, parent.character)[1] * e.frequency
                }
                if (inAgitateCount > 0 && inAgitateCount <= 3 && dps < dpsLimit) {
                    await use_skill("agitate")
                    reduce_cooldown("agitate", Math.min(...parent.pings))
                }
            }
        } catch (error) {
            console.error(error)
        }
        setTimeout(async () => { this.agitateLoop() }, getCooldownMS("agitate"))
    }

    protected async warcryLoop() {
        if (isAvailable("warcry")) {
            await use_skill("warcry")
            reduce_cooldown("warcry", Math.min(...parent.pings))
        }
        setTimeout(async () => { this.warcryLoop() }, getCooldownMS("warcry"))
    }

    protected async stompLoop() {
        // Stomp monsters with high HP
        const attackingTargets = getEntities({ isAttackingUs: true, isRIP: false, isWithinDistance: parent.character.range })
        // Stomp tinyp's
        const tinyp = getEntities({ isMonsterType: ["tinyp"], isWithinDistance: parent.character.range })
        if (isAvailable("stomp")) {
            if (attackingTargets.length && attackingTargets[0].hp > 25000) {
                await use_skill("stomp")
                reduce_cooldown("stomp", Math.min(...parent.pings))
            } else if (tinyp.length) {
                await use_skill("stomp")
                reduce_cooldown("stomp", Math.min(...parent.pings))
            }
        }
        setTimeout(async () => { this.stompLoop() }, getCooldownMS("stomp"))
    }

    protected async cleaveLoop() {
        const wanted: Entity[] = []
        const unwanted: Entity[] = []
        for (const e of getEntities({ isMonster: true, isRIP: false, isWithinDistance: G.skills.cleave.range })) {
            if (parent.character.attack < calculateDamageRange(parent.character, e)[0]) {
                unwanted.push(e)
                continue
            }
            if (!this.targetPriority[e.mtype]) {
                unwanted.push(e)
                continue
            }
            if (this.wantToAttack(e, "cleave")) {
                wanted.push(e)
            }
        }

        let unwantedDamage = 0
        for (const e of unwanted) {
            unwantedDamage += calculateDamageRange(e, parent.character)[1]
        }

        if (isAvailable("cleave") && wanted.length > 3 && unwantedDamage < 1000) {
            await use_skill("cleave")
            reduce_cooldown("cleave", Math.min(...parent.pings))
        }
        setTimeout(async () => { this.cleaveLoop() }, getCooldownMS("cleave"))
    }

    protected async chargeLoop() {
        if (isAvailable("charge")) await use_skill("charge")
        setTimeout(async () => { this.chargeLoop() }, getCooldownMS("charge"))
    }

    protected async hardshellLoop() {
        const targets = getEntities({ isAttackingUs: true, isRIP: false })
        if (isAvailable("hardshell")
            && targets.length // We have a target
            && distance(targets[0], parent.character) <= targets[0].range // In range of their attacks
            && parent.character.hp < calculateDamageRange(targets[0], parent.character)[1] * 5) { // Not a lot of HP remaining
            await use_skill("hardshell")
            reduce_cooldown("hardshell", Math.min(...parent.pings))
        }
        setTimeout(async () => { this.hardshellLoop() }, getCooldownMS("hardshell"))
    }

    protected async tauntLoop(): Promise<void> {
        try {
            let dps = 0
            let dpsLimit = 500
            const priests = getEntities({ isCtype: "priest", isPartyMember: true })
            for (const priest of priests) {
                if (distance(parent.character, priest) > priest.range) continue // Priest is out of range
                dpsLimit += (priest.attack * 0.9 * priest.frequency) / 2
            }
            const attackingUs = getEntities({ isAttackingUs: true, isRIP: false, isMonster: true })
            for (const e of attackingUs) {
                // Entity is attacking us directly
                dps += calculateDamageRange(e, parent.character)[1] * e.frequency
            }
            if (dps < dpsLimit && attackingUs.length < 3) {
                const attackingParty = getEntities({ isAttackingParty: true, isAttackingUs: false, isMonster: true, isRIP: false, isWithinDistance: G.skills.taunt.range })
                for (const e of attackingParty) {
                    // Entity is attacking a party member
                    if (!this.wantToAttack(e, "taunt")) continue
                    const damage = calculateDamageRange(e, parent.character)[1] * e.frequency
                    if (dps + damage > dpsLimit) continue

                    await use_skill("taunt", e)
                    reduce_cooldown("taunt", Math.min(...parent.pings))
                    setTimeout(async () => { this.tauntLoop() }, getCooldownMS("taunt"))
                    return
                }

                const notAttacking = getEntities({ isAttackingParty: false, isMonster: true, isRIP: false, isWithinDistance: G.skills.taunt.range })
                for (const e of notAttacking) {
                    // Entity isn't attacking anyone in our party
                    if (!this.wantToAttack(e, "taunt")) continue
                    const damage = calculateDamageRange(e, parent.character)[1] * e.frequency
                    if (dps + damage > dpsLimit) continue

                    const d = distance(parent.character, e)
                    if (d > parent.character.range && e.range > parent.character.range * 4) continue // Monsters won't come close enough to let us attack them
                    // NOTE: The "4" is a magic number. I noticed monsters come to about 1/5 their range when you aggro them

                    await use_skill("taunt", e)
                    reduce_cooldown("taunt", Math.min(...parent.pings))
                    setTimeout(async () => { this.tauntLoop() }, getCooldownMS("taunt"))
                    return
                }
            }
        } catch (error) {
            console.error(error)
        }
        setTimeout(async () => { this.tauntLoop() }, getCooldownMS("taunt"))
    }
}

const warrior = new Warrior()
export { warrior }
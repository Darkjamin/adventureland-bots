import AL, { PingCompensatedCharacter } from "alclient"
import { Strategist } from "../context.js"
import { MageAttackStrategy } from "../strategies/attack_mage.js"
import { PriestAttackStrategy } from "../strategies/attack_priest.js"
import { WarriorAttackStrategy } from "../strategies/attack_warrior.js"
import { ImprovedMoveStrategy, KiteMonsterMoveStrategy } from "../strategies/move.js"
import { Requirements, Setup } from "./base.js"
import { MAGE_SPLASH, PRIEST_LUCK, WARRIOR_SPLASH } from "./equipment.js"
import { RangerAttackStrategy } from "../strategies/attack_ranger.js"

export function constructStoneWormSetup(contexts: Strategist<PingCompensatedCharacter>[]): Setup {
    const moveStrategy = new ImprovedMoveStrategy("stoneworm")

    return {
        configs: [
            {
                id: "stoneworm_mage,priest,warrior",
                characters: [
                    {
                        ctype: "mage",
                        attack: new MageAttackStrategy({
                            contexts: contexts,
                            disableEnergize: true,
                            ensureEquipped: { ...MAGE_SPLASH },
                            type: "stoneworm"
                        }),
                        move: moveStrategy
                    },
                    {
                        ctype: "priest",
                        attack: new PriestAttackStrategy({
                            contexts: contexts,
                            disableEnergize: true,
                            ensureEquipped: { ...PRIEST_LUCK },
                            type: "stoneworm",
                        }),
                        move: moveStrategy
                    },
                    {
                        ctype: "warrior",
                        attack: new WarriorAttackStrategy({
                            contexts: contexts,
                            enableEquipForCleave: true,
                            enableGreedyAggro: true,
                            ensureEquipped: { ...WARRIOR_SPLASH },
                            type: "stoneworm"
                        }),
                        move: moveStrategy
                    }
                ]
            },
        ]
    }
}

export function constructStoneWormHelperSetup(contexts: Strategist<PingCompensatedCharacter>[]): Setup {
    const moveStrategy = new KiteMonsterMoveStrategy({ contexts: contexts, disableCheckDB: true, typeList: ["stoneworm"] })
    const requirements: Requirements = {
        hp: 5000,
        range: AL.Game.G.monsters.stoneworm.range + 50,
        speed: AL.Game.G.monsters.stoneworm.charge
    }

    return {
        configs: [
            {
                id: "stoneworm_mage",
                characters: [
                    {
                        ctype: "mage",
                        attack: new MageAttackStrategy({
                            contexts: contexts,
                            disableEnergize: true,
                            type: "stoneworm"
                        }),
                        move: moveStrategy,
                        require: requirements
                    }
                ]
            },
            {
                id: "stoneworm_ranger",
                characters: [
                    {
                        ctype: "ranger",
                        attack: new RangerAttackStrategy({
                            contexts: contexts,
                            disableEnergize: true,
                            type: "stoneworm"
                        }),
                        move: moveStrategy,
                        require: requirements
                    }
                ]
            },
        ]
    }
}
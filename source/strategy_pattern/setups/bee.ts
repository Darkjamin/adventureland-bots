import { PingCompensatedCharacter } from "alclient"
import { Strategist } from "../context.js"
import { MageAttackStrategy } from "../strategies/attack_mage.js"
import { PriestAttackStrategy } from "../strategies/attack_priest.js"
import { RangerAttackStrategy } from "../strategies/attack_ranger.js"
import { WarriorAttackStrategy } from "../strategies/attack_warrior.js"
import { ImprovedMoveStrategy } from "../strategies/move.js"
import { Setup } from "./base.js"
import { MAGE_SPLASH, PRIEST_FAST, WARRIOR_SPLASH } from "./equipment.js"

export function constructBeeSetup(contexts: Strategist<PingCompensatedCharacter>[]): Setup {
    const moveStrategy = new ImprovedMoveStrategy("bee")

    return {
        configs: [
            {
                id: "bee_mage",
                characters: [
                    {
                        ctype: "mage",
                        attack: new MageAttackStrategy({
                            contexts: contexts,
                            ensureEquipped: { ...MAGE_SPLASH },
                            type: "bee"
                        }),
                        move: moveStrategy
                    }
                ]
            },
            {
                id: "bee_priest",
                characters: [
                    {
                        ctype: "priest",
                        attack: new PriestAttackStrategy({
                            contexts: contexts,
                            disableCurse: true,
                            ensureEquipped: { ...PRIEST_FAST },
                            type: "bee"
                        }),
                        move: moveStrategy
                    }
                ]
            },
            {
                id: "bee_ranger",
                characters: [
                    {
                        ctype: "ranger",
                        attack: new RangerAttackStrategy({ contexts: contexts, type: "bee" }),
                        move: moveStrategy
                    }
                ]
            },
            {
                id: "bee_warrior",
                characters: [
                    {
                        ctype: "warrior",
                        attack: new WarriorAttackStrategy({
                            contexts: contexts,
                            disableAgitate: true,
                            enableEquipForCleave: true,
                            enableGreedyAggro: true,
                            ensureEquipped: { ...WARRIOR_SPLASH },
                            type: "bee"
                        }),
                        move: moveStrategy
                    }
                ]
            }
        ]
    }
}
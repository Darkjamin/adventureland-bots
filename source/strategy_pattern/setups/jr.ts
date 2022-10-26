import { PingCompensatedCharacter } from "alclient"
import { Strategist } from "../context.js"
import { MageAttackStrategy } from "../strategies/attack_mage.js"
import { ImprovedMoveStrategy } from "../strategies/move.js"
import { Setup } from "./base"
import { MAGE_NORMAL } from "./equipment.js"

export function constructJrSetup(contexts: Strategist<PingCompensatedCharacter>[]): Setup {
    return {
        configs: [
            {
                id: "jr_mage",
                characters: [
                    {
                        ctype: "mage",
                        attack: new MageAttackStrategy({ contexts: contexts, ensureEquipped: { ...MAGE_NORMAL }, type: "jr" }),
                        move: new ImprovedMoveStrategy("jr")
                    }
                ]
            }
        ]
    }
}
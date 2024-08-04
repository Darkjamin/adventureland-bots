import AL, { Character, HitData, ServerIdentifier, ServerRegion } from "alclient"
import { prom } from "../../prom.js"
import fs from 'fs'
import path from 'path'

// Constants
const RECENT_EVENT_TIMEOUT = 5000; // 5s
const PUBLISH_INTERVAL = 1000; // 1s

// Global variables
let character: Character
let serverRegion: ServerRegion
let serverIdentifier: ServerIdentifier

// Logging setup
const isLoggingEnabled = false;
const logFilePath = path.join('C:/Dev/AL-DEV/adventureland-bots', 'metrics.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
const loggedEvents = new Set<string>();

// Utility functions
function logEvent(event: string, data: any) {
    if (!isLoggingEnabled) return;
    //if (!event.includes("upgrade")) return; // Only log events that contain the word "sell"

    const logEntry = `${new Date().toISOString()} - Event: ${event} - Data: ${JSON.stringify(data)}`;
    const logKey = `${event}_${JSON.stringify(data)}`; // Create a unique key for the event

    if (!loggedEvents.has(logKey)) {
        loggedEvents.add(logKey);
        logStream.write(logEntry + '\n');
    }
}

const recentEvents: { [key: string]: Set<string> } = {};
function isUniqueEvent(eventType: string, data: any): boolean {
    const now = Date.now();
    if (!recentEvents[eventType]) recentEvents[eventType] = new Set();

    let eventKey: string;
    switch (eventType) {
        case "hit":
            eventKey = `${data.id}_${data.damage}_${data.pid}`;
            break;
        case "chest_opened":
            eventKey = `${data.id}_${data.opener}`;
            break;
        case "buy":
            eventKey = `buy_${data.item.name}_${data.item.q || 1}_${data.id}`;
            break;
        case "sell":
            eventKey = `sell_${data.item.name}_${data.item.q || 1}_${data.num}`;
            break;
        case "item_sent":
            eventKey = `${data.sender}_${data.receiver}_${data.item.name}_${data.item.q || 1}_${data.num}`;
            break;
        default:
            eventKey = JSON.stringify(data);
    }

    const fullKey = `${eventKey}_${now}`;
    if (recentEvents[eventType].has(fullKey)) return false;

    recentEvents[eventType].add(fullKey);
    setTimeout(() => recentEvents[eventType].delete(fullKey), RECENT_EVENT_TIMEOUT);
    return true;
}

// Event processing functions
//2024-07-24T11:18:18.621Z - Event: ui - Data: {"type":"item_sent","receiver":"JoiNtor","sender":"JoiNtie","item":{"name":"seashell","q":1},"num":3,"fnum":25,"event":true}
function processEvent(eventType: string, data: any) {
    if (!isUniqueEvent(eventType, data)) return;

    switch (eventType) {
        case "hit":
            processHitEvent(data);
            break;
        case "chest_opened":
            processChestOpenedEvent(data);
            break;
        case "buy":
            processBuyEvent(data);
            break;
        case "sell":
            processSellEvent(data);
            break;
        case "item_sent":
            processItemSentToMerchant(data);
            break;
        case "death":
            processDeathEvent(data);
            break;
    }
}

function processHitEvent(data: HitData) {
    const entity = character.entities.get(data.id);

     //Event: hit - Data: {"hid":"JoiNtor","source":"attack","projectile":"momentum","damage_type":"physical","pid":"DHZzht","id":"84015350","damage":789,"kill":true}
     //Event: hit - Data: {"hid":"84016156","source":"attack","projectile":"stone","damage_type":"physical","pid":"QCA28X","id":"JoiNtor","damage":4,"dreturn":1}

    if (data.hid === character.name) {
        if (typeof data.damage === "number") {
            damage_dealt
                .labels({
                    character: data.hid ?? "_unknown",
                    monster: entity?.name ?? "_unknown",
                    projectile: data.projectile ?? "_unknown",
                    source: data.source ?? "_unknown",
                })
                .inc(data.damage);

            if (data.kill && entity?.name) {
                // Only increment kills if we have a valid entity name
                kills.labels({ enemy: entity.name }).inc();
            }
        }
    } else if (data.id === character.name) {
        if (typeof data.damage === "number") {
            damage_received
                .labels({
                    character: data.id ?? "_unknown",
                    monster: entity?.name ?? "_unknown",
                    projectile: data.projectile ?? "_unknown",
                    source: data.source ?? "_unknown",
                })
                .inc(data.damage);
        }
    }
}

function processDeathEvent(data: any) {
    if (data.id === character.name) {
        //console.log(`Character ${character.name} died!`);
        deaths.inc();
    }
}

const recentChests = new Map<string, number>();
const RECENT_CHEST_TIMEOUT = 10; // ms, adjust as needed

function isUniqueChest(chestId: string): boolean {
    const now = Date.now();
    const lastTime = recentChests.get(chestId);
    
    if (lastTime && now - lastTime < RECENT_CHEST_TIMEOUT) {
        return false;
    }
    
    recentChests.set(chestId, now);
    return true;
}

function processChestOpenedEvent(data: any) {
    const chestId = data.id.split('_')[0]; // Extract the unique part of the chest ID

    //chest_opened - Data: {"id":"bLMnXS1ad45it02dhaW0GOFkdD2Vmx","goldm":1.06,"opener":"JoiNty","items":[],"party":true,"gold":4}
    
    if (data.opener === character.name && isUniqueChest(chestId)) {
     
        looted_gold.inc(data.gold);
        opened_chests.inc(1);
       
        if (data.items && data.items.length) {
            for (const item of data.items) {
                if (item.looter === character.name) {
                    // console.log(`Looted item: ${item.name}, quantity: ${item.q ?? 1}`);
                    looted_items
                        .labels({
                            item: item.name,
                            level: item.level ?? 0,
                        })
                        .inc(item.q ?? 1);
                }
            }
        }
    } else {
        // console.log(`Duplicate or non-matching chest event: ${chestId}_${data.opener}`);
    }
}

function processBuyEvent(data: any) {
    const quantity = data.item?.q || 1;
    const itemName = data.item?.name || "unknown";

    bought_items
        .labels({
            item: itemName,
            from: "npc",
        })
        .inc(quantity);

  /*   spent_gold
        .labels({
            for: "npc",
        })
        .inc(cost);*/
} 

function processSellEvent(data: any) {
    const quantity = data.item?.q || 1;
    const itemName = data.item?.name || "unknown";
    const gold = parseInt(data.num || "0");

    sold_items
        .labels({
            item: itemName,
            to: "npc",
        })
        .inc(quantity);

    sales_gold
        .labels({
            to: "npc",
        })
        .inc(gold);
}

function processItemSentToMerchant(data: any) {
    const quantity = data.item.q || 1;
    const itemName = data.item.name;
    const receiver = data.receiver;

    if (receiver === "JoiNta") { // Assuming JoiNta is still your merchant
        items_sent_to_merchant
            .labels({
                item: itemName,
            })
            .inc(quantity);
        
        console.log(`Item sent to merchant: ${itemName} x${quantity}`); // Add this for debugging
    }
}

// New metric for monster achievement bonuses
export const monster_achievement_bonuses = new prom.Gauge({
    name: "al_monster_achievement_bonuses",
    help: "Bonuses gained from monster kill achievements",
    labelNames: ["stat"],
});

// Add this function to calculate and update the monster achievement bonuses
export function updateMonsterAchievementBonuses(trackerData: any) {
    if (!trackerData.monsters) return;

    const scores = Object.entries(trackerData.monsters)
        .map(([monster, count]) => ({ monster, score: count as number }));

    const bonus = Object.entries(AL.Game.G.monsters)
        .map(([monster, data]: [string, any]) => (data.achievements ?? []).map((achievement: any) => [monster, ...achievement]))
        .flat()
        .filter(([m, req, type]: [string, number, string]) => 
            type === 'stat' && (scores.find(({ monster }) => m === monster)?.score ?? 0) > req
        )
        .reduce((memo: {[key: string]: number}, [, , , stat, value]: [string, number, string, string, number]) => {
            memo[stat] = (memo[stat] || 0) + value;
            return memo;
        }, {});

    // Update the metric for each stat bonus
    Object.entries(bonus).forEach(([stat, value]) => {
        monster_achievement_bonuses.labels({ stat }).set(value);
    });
}

// Initialization functions
export function initializeMetrics(bot: Character) {
    if (!bot) {
        //console.log("initializeMetrics called with an undefined bot");
        return;
    }

    character = bot
    prom.register.setDefaultLabels({
        character: character.name,
  
    });

    // Setup event listeners

    character.socket.onAny((event, data) => {
        logEvent(event, data); // Log all events
    });



    //2024-07-24T11:16:17.968Z - Event: ui - Data: {"type":"-$","id":"scrolls","name":"Hierophant","item":{"name":"whiteegg","q":2},"num":"25","event":"sell"}
    //2024-07-22T08:48:37.234Z - Event: ui - Data: {"type":"+$","id":"fancypots","name":"earthMag","item":{"name":"hpot1","q":10},"event":"buy"}

    //2024-07-24T11:18:18.621Z - Event: ui - Data: {"type":"item_sent","receiver":"JoiNtor","sender":"JoiNtie","item":{"name":"seashell","q":1},"num":3,"fnum":25,"event":true}

    character.socket.on("ui", (data: any) => {
        if (data.type === "item_sent") {
            processItemSentToMerchant(data);
        }
    
        if (data.name === character.name) { // Only process buy/sell events for the current character
            if (data.event === "buy") {
                processEvent("buy", data);
            } else if (data.event === "sell") {
                processEvent("sell", data);
            }
        }
    });

    bot.socket.on("hit", (data: HitData) => {
        processEvent("hit", data);
    });

    bot.socket.on("chest_opened", (data) => {
        processChestOpenedEvent(data);
    });

    bot.socket.on("death", (data: any) => {
        processEvent("death", data);
    });

    // Clean up old chest entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [chestId, time] of recentChests.entries()) {
            if (now - time > RECENT_CHEST_TIMEOUT) {
                recentChests.delete(chestId);
            }
        }
    }, RECENT_CHEST_TIMEOUT);

    // Clean up old events periodically
    setInterval(() => {
        const now = Date.now();
        for (const eventType in recentEvents) {
            for (const key of recentEvents[eventType]) {
                const [, timestamp] = key.split('_');
                if (now - parseInt(timestamp) > RECENT_EVENT_TIMEOUT) {
                    recentEvents[eventType].delete(key);
                }
            }
        }
    }, RECENT_EVENT_TIMEOUT);
}

export function updateServerInfo(region: ServerRegion, identifier: ServerIdentifier) {
    serverRegion = region
    serverIdentifier = identifier
    
    serv.set(
        {
            fullname: `${region}${identifier}`,
            // Ensure these properties exist on serverData
            //mode: character.serverData?.mode ?? "unknown",
            //pvp: `${character.serverData?.pvp ?? false}`,
            region: region,
            id: identifier,
        },
        1
    )
}

export function updateCharacterInfo(bot: Character) {
    if (!bot) {
        console.error("updateCharacterInfo called with an undefined bot");
        return;
    }
    character = bot
    
    char.set(
        {
            name: character.name,
            class: character.ctype,
            owner: character.owner,
        },
        1
    )
}


// The following monstrosity is used because I want to precisely store the total xp points.
// prettier-ignore
export const cumulatedXp = [0,0,200,450,760,1140,1610,2190,2910,3810,4910,6210,7810,9810,12310,15410,19210,23910,29710,36910,45910,56910,69910,85910,105910,130910,161910,199910,246910,304910,376910,466910,576910,706910,866910,1066910,1316910,1626910,2006910,2476910,3056910,3776910,4676910,5776910,7076910,8676910,10676910,13176910,16276910,20076910,24776910,30576910,37776910,46776910,57776910,70776910,86776910,106776910,131776910,162776910,200776910,247776910,304776910,373776910,457776910,557776910,677776910,817776910,987776910,1187776910,1427776910,1717776910,2067776910,2487776910,2997776910,3617776910,4367776910,5267776910,6267776910,7467776910,8867776910,10467776910,12467776910,14967776910,18067776910,21967776910,26867776910,33067776910,40967776910,50967776910,62967776910,77967776910,97967776910,124967776910,161967776910,211967776910,279967776910,372967776910,492967776910,652967776910,872967776910,1172967776910,1502967776910,1862967776910,2252967776910,2672967776910,3132967776910,3632967776910,4182967776910,4782967776910,5442967776910,6162967776910,6952967776910,7812967776910,8752967776910,9752967776910,10852967776910,12052967776910,13352967776910,14752967776910,16252967776910,17852967776910,19552967776910,21352967776910,23252967776910,25252967776910,27452967776910,29852967776910,32452967776910,35252967776910,38252967776910,41552967776910,45152967776910,49052967776910,53252967776910,57852967776910,62852967776910,68352967776910,74352967776910,80952967776910,836052967776910,908052967776910,989052967776910,1075052967776910,1167052967776910,1267052967776910,1377052967776910,1497052967776910,1627052967776910,1767052967776910,1917052967776910,2077052967776910,2247052967776910,2427052967776910,2617052967776910,2817052967776910,3037052967776910,3277052967776910,3537052967776910,3817052967776910,4117052967776910,4447052967776910,4807052967776910,5197052967776910,5617052967776910,6077052967776910,6577052967776910,7127052967776910,7727052967776910,8387052967776910,9107052967776910,9897052967776910,10757052967776910];

// =====================
//     Info metrics
// =====================
export const char = new prom.Gauge({
    name: "al_character_info",
    help: "Informations regarding the character",
    labelNames: ["name", "class", "owner"],
});


export const serv = new prom.Gauge({
    name: "al_server_info",
    help: "Informations regarding the server",
    labelNames: ["fullname", "mode", "pvp", "region", "id"],
});


// =====================
//    Server metrics
// =====================
export const kills = new prom.ServerCounter({
    name: "al_kills_total",
    help: "How many kills my characters did",
    labelNames: ["enemy"],
});

export const damage_dealt = new prom.ServerCounter({
    name: "al_damage_dealt_total",
    help: "How much damage my characters dealt",
    labelNames: ["character", "monster", "projectile", "source"],
});

export const damage_received = new prom.ServerCounter({
    name: "al_damage_received_total",
    help: "How much damage my characters received",
    labelNames: ["character", "monster", "projectile", "source"],
});

export const used_skills = new prom.ServerCounter({
    name: "al_used_skills_total",
    help: "How many skills my characters used",
    labelNames: ["skill"],
});

export const deaths = new prom.ServerCounter({
    name: "al_deaths_total",
    help: "How many deaths my characters suffered",
});

export const opened_chests = new prom.ServerCounter({
    name: "al_opened_chests_total",
    help: "How many chests did my characters open",
    labelNames: ["skin"],
});

export const looted_items = new prom.ServerCounter({
    name: "al_looted_items_total",
    help: "How many items did my characters loot",
    labelNames: ["item", "level"],
});

export const looted_gold = new prom.Counter({
    name: "al_looted_gold_total",
    help: "How much gold did my characters loot",
});

export const bought_items = new prom.ServerCounter({
    name: "al_bought_items_total",
    help: "How many items I bought",
    labelNames: ["item", "from"],
});

export const spent_gold = new prom.ServerCounter({
    name: "al_spent_gold_total",
    help: "How many gold I spent",
    labelNames: ["for"],
});

export const sold_items = new prom.ServerCounter({
    name: "al_sold_items_total",
    help: "How many items I sold",
    labelNames: ["item", "to"],
});

export const sales_gold = new prom.ServerCounter({
    name: "al_sales_gold_total",
    help: "How many gold I gained from sales",
    labelNames: ["to"],
});

export const items_sent_to_merchant = new prom.ServerCounter({
    name: "al_items_sent_to_merchant_total",
    help: "How many items were sent to the merchant character",
    labelNames: ["item"],
});

export const ping = new prom.ServerGauge({
    name: "al_ping_seconds",
    help: "How is the ping with the server",
    collect() {
        if (character.pings && character.pings.length > 0) {
            this.set(character.pings.reduce((a, b) => a + b, 0) / character.pings.length / 1000);
        }
        // If there are no pings, we don't set any value
    },
}); 

// ======================
//  Non-server metricsS
// ======================


export const level = new prom.Gauge({   //OK
    name: "al_level_total",
    help: "How many levels my characters have",
    collect() {
        this.set(character.level);
    },
});

export const life = new prom.Gauge({   //OK
    name: "al_hp_total",
    help: "How many HP my characters have",
    collect() {
        this.set(character.hp);
    },
});

export const exp = new prom.Gauge({ //OK
    name: "al_exp_total",
    help: "How many exp points my characters have",
    collect() {
        this.set(character.xp);
    },
});

export const expremaininginlevel = new prom.Gauge({
    name: "al_exp_remaining_in_level",
    help: "How many exp points my characters have remaining in this level",
    collect() {
        const currentLevelXP = cumulatedXp[character.level + 1] - cumulatedXp[character.level];
        const xpInCurrentLevel = character.xp;
        const remainingXP = currentLevelXP - xpInCurrentLevel;
        this.set(remainingXP);
    },
});

export const percent_level_done = new prom.Gauge({
    name: "al_percent_level_done",
    help: "Percentage of current level completed (0-100)",
    collect() {
        const currentLevelXP = cumulatedXp[character.level + 1] - cumulatedXp[character.level];
        const xpInCurrentLevel = character.xp;
        const percentDone = (xpInCurrentLevel / currentLevelXP) * 100;
        this.set(Number(percentDone.toFixed(2)));
    },
});

export const gold = new prom.Gauge({    //OK
    name: "al_gold_total",
    help: "How much gold do I have",
    collect() {
        this.set(character.gold);
    },
});

export const sent_gold = new prom.Counter({
    name: "al_sent_gold_total",
    help: "How much gold have I sent to others",
    labelNames: ["to"],
});

export const received_gold = new prom.Counter({
    name: "al_received_gold_total",
    help: "How much gold have I received from others",
    labelNames: ["from"],
});

export const failed_upgrades = new prom.Counter({
    name: "al_failed_upgrades_total",
    help: "How many upgrades I failed",
    labelNames: ["item", "level"],
});

export const success_upgrades = new prom.Counter({
    name: "al_success_upgrades_total",
    help: "How many upgrades I did successfully",
    labelNames: ["item", "level"],
});

export const failed_compounds = new prom.Counter({
    name: "al_failed_compounds_total",
    help: "How many compounds I failed",
    labelNames: ["item", "level"],
});

export const success_compounds = new prom.Counter({
    name: "al_success_compounds_total",
    help: "How many compounds I did successfully",
    labelNames: ["item", "level"],
});

export const tracker_monsters_killed = new prom.Gauge({
    name: "al_tracker_monsters_killed",
    help: "Total number of monsters killed by each character",
    labelNames: ["character", "monster"],
});

export const tracker_exchanges = new prom.Gauge({
    name: "al_tracker_exchanges",
    help: "Number of item exchanges made by each character",
    labelNames: ["character", "item"],
});

export const potions_used = new prom.ServerCounter({
    name: "al_potions_used_total",
    help: "How many potions were used by my characters",
    labelNames: ["potion", "character"],
});


// ======================
//    Events handling
// ======================


export async function publish_metrics(bot: Character) {
    if (!bot) {
        console.error("publish_metrics called with an undefined bot");
        return;
    }
    
    await prom.pushToVM("http://192.168.1.52:8428/api/v1/import/prometheus");

}

export async function loop_publish_metrics(bot: Character) {
    try {
        initializeMetrics(bot)
        updateServerInfo(bot.serverData.region, bot.serverData.name)
        updateCharacterInfo(bot)
        await publish_metrics(bot);
    } catch (err) {
        console.error(err);
    }
    setTimeout(() => loop_publish_metrics(bot), PUBLISH_INTERVAL);
}




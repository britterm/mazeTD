export const towerDefinitions = [
    {
        id: "wall",
        name: "Wall",
        description: "Blocks enemy movement and shapes the maze.",
        category: "blocker",
        attackMode: "instant",
        targeting: "first",
        baseCooldown: 0,
        passable: false,
        color: '#6c757d',
        levels: [
            {
                level: 1,
                cost: 5,
                range: 0,
                damage: 0,
                fireRate: 0
            }
        ]
    },
    {
        id: "lightning",
        name: "Lightning Coil",
        description: "Fires instant bolts at leading targets.",
        category: "damage",
        attackMode: "instant",
        targeting: "first",
        baseCooldown: 0,
        passable: false,
        color: '#c76dff',
        levels: [
            {
                level: 1,
                cost: 40,
                range: 1.5,
                damage: 18,
                fireRate: 1.6,
                instantHit: true
            },
            {
                level: 2,
                cost: 80,
                range: 1.75,
                damage: 25,
                fireRate: 1.8,
                instantHit: true
            },
            {
                level: 3,
                cost: 160,
                range: 2,
                damage: 32,
                fireRate: 2,
                instantHit: true,
                effects: ["chain-prep"]
            }
        ]
    },
    {
        id: "fire",
        name: "Fire Spire",
        description: "Launches fireballs that deal splash damage.",
        category: "damage",
        attackMode: "projectile",
        targeting: "closest",
        baseCooldown: 0,
        passable: false,
        color: '#ff7849',
        levels: [
            {
                level: 1,
                cost: 50,
                range: 1.25,
                damage: 14,
                fireRate: 1.2,
                splashRadius: 1.1,
                projectileSpeed: 6
            },
            {
                level: 2,
                cost: 100,
                range: 1.375,
                damage: 22,
                fireRate: 1.3,
                splashRadius: 1.35,
                projectileSpeed: 7
            },
            {
                level: 3,
                cost: 200,
                range: 1.5,
                damage: 32,
                fireRate: 1.45,
                splashRadius: 1.6,
                projectileSpeed: 8
            }
        ]
    },
    {
        id: "ice",
        name: "Cryo Totem",
        description: "Blasts frost orbs that slow enemies in an area.",
        category: "control",
        attackMode: "projectile",
        targeting: "closest",
        baseCooldown: 0,
        passable: false,
        color: '#7ff0ff',
        levels: [
            {
                level: 1,
                cost: 45,
                range: 1.25,
                damage: 8,
                fireRate: 1,
                splashRadius: 0.4,
                projectileSpeed: 8,
                slowFactor: 0.6,
                slowDuration: 2
            },
            {
                level: 2,
                cost: 90,
                range: 1.35,
                damage: 12,
                fireRate: 1.1,
                splashRadius: 0.5,
                projectileSpeed: 9,
                slowFactor: 0.55,
                slowDuration: 2.2
            },
            {
                level: 3,
                cost: 180,
                range: 1.45,
                damage: 16,
                fireRate: 1.2,
                splashRadius: .6,
                projectileSpeed: 10,
                slowFactor: 0.50,
                slowDuration: 2.5
            }
        ]
    },
    {
        id: "earth",
        name: "Earth Shaker",
        description: "Hurls stones that damage and briefly stun a target.",
        category: "damage",
        attackMode: "projectile",
        targeting: "strongest",
        baseCooldown: 0,
        passable: false,
        color: '#c8a35a',
        levels: [
            {
                level: 1,
                cost: 55,
                range: 1.7,
                damage: 20,
                fireRate: 0.9,
                projectileSpeed: 10,
                stunDuration: 0.23
            },
            {
                level: 2,
                cost: 110,
                range: 1.9,
                damage: 28,
                fireRate: 1,
                projectileSpeed: 11,
                stunDuration: 0.28
            },
            {
                level: 3,
                cost: 220,
                range: 2.25,
                damage: 38,
                fireRate: 1.1,
                projectileSpeed: 11.5,
                stunDuration: 0.35
            }
        ]
    }
];
export const towerDefinitionMap = new Map(towerDefinitions.map((def) => [def.id, def]));
export const getTowerSellValue = (towerId, level) => {
    const definition = towerDefinitionMap.get(towerId);
    if (!definition) {
        return 0;
    }
    if (definition.id === "wall") {
        return 2;
    }
    let invested = 0;
    for (const towerLevel of definition.levels) {
        if (towerLevel.level <= level) {
            invested += towerLevel.cost;
        }
    }
    return Math.round(invested * 0.6);
};

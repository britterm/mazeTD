import { aStar } from "../pathfinding/aStar";
const DEFAULT_CELL_PROPERTIES = {
    variant: 'default',
    buildable: true,
    passable: true
};
export class GridManager {
    topology;
    blueprint;
    cellMap = new Map();
    occupancy = new Map();
    baseOccupancy = new Map();
    cellProperties = new Map();
    constructor(topology, blueprint) {
        this.topology = topology;
        this.blueprint = blueprint;
        for (const cell of blueprint.cells) {
            this.cellMap.set(this.topology.keyOf(cell), cell);
        }
        this.applyCellVariants(blueprint.cellVariants ?? []);
    }
    get spawn() {
        return this.blueprint.spawn;
    }
    get goal() {
        return this.blueprint.goal;
    }
    applyCellVariants(variants) {
        for (const { coord, variant } of variants) {
            this.updateCellVariantInternal(coord, variant);
        }
    }
    resolveCellProperties(variant) {
        switch (variant) {
            case 'hole':
            case 'clearable':
                return { variant, buildable: false, passable: false };
            case 'water':
                return { variant, buildable: false, passable: true };
            default:
                return DEFAULT_CELL_PROPERTIES;
        }
    }
    getCellProperties(coord) {
        const key = this.topology.keyOf(coord);
        return this.cellProperties.get(key) ?? DEFAULT_CELL_PROPERTIES;
    }
    getCellVariant(coord) {
        return this.getCellProperties(coord).variant;
    }
    setCellVariant(coord, variant) {
        this.updateCellVariantInternal(coord, variant);
    }
    resetCellVariant(coord) {
        this.updateCellVariantInternal(coord, 'default');
    }
    updateCellVariantInternal(coord, variant) {
        const key = this.topology.keyOf(coord);
        if (!this.cellMap.has(key)) {
            return;
        }
        if (key === this.topology.keyOf(this.spawn) || key === this.topology.keyOf(this.goal)) {
            return;
        }
        if (variant === 'default') {
            const base = this.baseOccupancy.get(key);
            this.cellProperties.delete(key);
            if (base) {
                const occupant = this.occupancy.get(key);
                if (occupant && occupant.entityId === base.entityId) {
                    this.occupancy.delete(key);
                }
                this.baseOccupancy.delete(key);
            }
            return;
        }
        const properties = this.resolveCellProperties(variant);
        this.cellProperties.set(key, properties);
        if (!properties.passable) {
            const state = { entityId: `__terrain_${variant}__`, passable: false };
            this.baseOccupancy.set(key, state);
            const occupant = this.occupancy.get(key);
            if (!occupant || occupant.entityId.startsWith('__terrain_')) {
                this.occupancy.set(key, state);
            }
        }
        else {
            const occupant = this.occupancy.get(key);
            if (occupant && occupant.entityId.startsWith('__terrain_')) {
                this.occupancy.delete(key);
            }
            this.baseOccupancy.delete(key);
        }
    }
    isBuildable(coord) {
        if (!this.isWithinBounds(coord)) {
            return false;
        }
        return this.getCellProperties(coord).buildable;
    }
    getAllCells() {
        return Array.from(this.cellMap.values());
    }
    isWithinBounds(coord) {
        return this.cellMap.has(this.topology.keyOf(coord));
    }
    isBlocked(coord) {
        const key = this.topology.keyOf(coord);
        const occupant = this.occupancy.get(key);
        return Boolean(occupant && !occupant.passable);
    }
    getOccupant(coord) {
        return this.occupancy.get(this.topology.keyOf(coord));
    }
    setOccupant(coord, state) {
        const key = this.topology.keyOf(coord);
        if (state) {
            this.occupancy.set(key, state);
            return;
        }
        const base = this.baseOccupancy.get(key);
        if (base) {
            this.occupancy.set(key, base);
        }
        else {
            this.occupancy.delete(key);
        }
    }
    canPlace(coord, passable) {
        if (!this.isWithinBounds(coord)) {
            return false;
        }
        const key = this.topology.keyOf(coord);
        if (key === this.topology.keyOf(this.spawn) || key === this.topology.keyOf(this.goal)) {
            return false;
        }
        const existing = this.occupancy.get(key);
        if (!this.isBuildable(coord)) {
            return false;
        }
        if (existing && !existing.passable) {
            return false;
        }
        if (!passable && existing?.passable === true) {
            return this.pathExistsAfterPlacement(coord, passable);
        }
        if (!passable) {
            return this.pathExistsAfterPlacement(coord, passable);
        }
        return true;
    }
    pathExistsAfterPlacement(coord, passable) {
        const key = this.topology.keyOf(coord);
        const previous = this.occupancy.get(key);
        this.occupancy.set(key, { entityId: "__temp__", passable });
        const path = this.findPath();
        if (previous) {
            this.occupancy.set(key, previous);
        }
        else {
            this.occupancy.delete(key);
        }
        return Boolean(path);
    }
    findPath() {
        return aStar({
            topology: this.topology,
            start: this.spawn,
            goal: this.goal,
            isBlocked: (coord) => !this.isWithinBounds(coord) || this.isBlocked(coord)
        });
    }
    toWorld(coord) {
        return this.topology.toWorld(coord);
    }
    fromWorld(point) {
        const candidate = this.topology.fromWorld(point);
        if (candidate && this.isWithinBounds(candidate)) {
            return candidate;
        }
        return null;
    }
}

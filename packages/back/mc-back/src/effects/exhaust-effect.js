import {Calc} from '../engine/calc.js';

import {Effect} from './effect.js';

export class ExhaustEffect extends Effect {
    constructor(params) {
        super(params);

        this.targetCountCalc = params.targetCountCalc;
        this.exhaustedTargets = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.exhaustedTargets = [];
    }
    canRollbackCost() {
        return this.resolved &&
            this.fullResolved &&
            this.exhaustedTargets.length > 0;
    }
    async rollbackCost() {
        if (!this.canRollbackCost()) {
            throw new Error('Cannot roll back an unresolved exhaust cost.');
        }

        const gameZones = new Set();
        for (const target of this.exhaustedTargets) {
            if (!target.exhausted) {
                continue;
            }

            target.ready();
            await target.refresh();

            const gameZone = target.gameZone ||
                target.controller?.gameZone ||
                target.owner?.gameZone;
            if (gameZone) {
                gameZones.add(gameZone);
            }
        }

        await this.promisesSequential([...gameZones], gameZone => gameZone.refresh());
        this.exhaustedTargets = [];
        this.resolved = false;
        this.fullResolved = false;

        return true;
    }
    async resolveParams(params) {
        const resolvedParams = await super.resolveParams(params);

        if (!this.targetCountCalc) {
            return resolvedParams;
        }

        const selectCount = await new Calc(this.targetCountCalc)
            .calculate({
                ...resolvedParams,
                match: resolvedParams.match ?? this.match,
                effect: this,
            });
        if (!Number.isSafeInteger(selectCount) || selectCount < 0) {
            throw new Error(
                'El número calculado de objetivos debe ser un entero no negativo.'
            );
        }

        this.selectCount = selectCount;

        return {
            ...resolvedParams,
            selectCount,
        };
    }
    filterTarget(card) {
        return !card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async execute() {
        const selectedTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const gameZones = new Set();

        for (const target of selectedTargets) {
            const wasExhausted = target.exhausted;
            target.exhaust();
            if (!wasExhausted) {
                this.exhaustedTargets.push(target);
            }
            await target.refresh();

            const gameZone = target.gameZone ||
                target.controller?.gameZone ||
                target.owner?.gameZone;
            if (gameZone) {
                gameZones.add(gameZone);
            }
        }

        await this.promisesSequential([...gameZones], gameZone => gameZone.refresh());
    }
}
import {
    EFFECT_MOVE_THREAT,
    TARGET_YOU,
    TRIGGER_MOVE_THREAT,
    TRIGGER_PLACE_THREAT,
    TRIGGER_REMOVE_THREAT,
    TRIGGER_WOULD_PLACE_THREAT,
} from 'mc-shared';

import {ValidTarget} from '../targets/valid-target.js';
import {getMovementTriggerContext} from '../utils/movement-trigger-context.js';
import {
    completeMainSchemeIfThresholdReached,
    defeatSideSchemeIfEmpty,
} from '../utils/scheme-threat-resolution.js';
import {moveThreatTokens} from '../utils/token-mutations.js';
import {Effect} from './effect.js';

export class MoveThreatEffect extends Effect {
    constructor({
        fromTarget,
        target,
        threat,
    }) {
        super({
            ...arguments[0],
            effectType: EFFECT_MOVE_THREAT,
            target: fromTarget,
        });

        if (!fromTarget || !target) {
            throw new TypeError('MoveThreatEffect requires fromTarget and target.');
        }

        this.fromTarget = fromTarget;
        this.toTarget = target;
        this.baseThreat = threat;
        this._threat = threat;
        this.preventThreat = 0;
        this.selectedDestination = undefined;
        this.movedThreat = 0;
        this.movementResolved = false;
    }
    get threat() {
        return this._threat - this.preventThreat;
    }
    set threat(threat) {
        this._threat = threat;
    }
    createDestinationValidTarget() {
        return new ValidTarget({
            effect: this,
            filter: this.filterDestinationTarget.bind(this),
            match: this.match,
        });
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.selectedDestination = undefined;
        this.preventThreat = 0;
        this._threat = this.baseThreat;
        this.movedThreat = 0;
        this.movementResolved = false;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_PLACE_THREAT,
                TRIGGER_REMOVE_THREAT,
                TRIGGER_MOVE_THREAT,
            ]);
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_WOULD_PLACE_THREAT,
            ]);
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat([
                TRIGGER_PLACE_THREAT,
                TRIGGER_REMOVE_THREAT,
                TRIGGER_MOVE_THREAT,
            ]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            effect: getMovementTriggerContext(this, {
                getDestinationTarget: () => this.selectedDestination,
                getSourceTarget: () => this.selectedTarget,
            }),
        };
    }
    checkTrigger() {
        return this.movementResolved ?
            this.movedThreat > 0 :
            this.threat > 0;
    }
    async resolveThreat(params) {
        const lastStepThreat = this.getLastStepParam('threat', params);
        const threat = lastStepThreat !== undefined ?
            lastStepThreat :
            this.paramsCalc ?
                await this.calculate(params) :
                this.baseThreat ?? params.threat;

        if (!Number.isFinite(threat) || threat < 0) {
            throw new TypeError('MoveThreatEffect requires a non-negative numeric threat value.');
        }

        return threat;
    }
    getThreatSource(target, params) {
        return this.fromTarget === TARGET_YOU ?
            params.player?.superhero :
            target;
    }
    filterTarget(card, params) {
        const source = this.getThreatSource(card, params);

        if (!source ||
            typeof source.canRemoveThreat !== 'function' ||
            !source.canRemoveThreat() ||
            !Number.isFinite(source.threat) ||
            source.threat < 1 ||
            !Number.isFinite(this.threat)) {
            return false;
        }

        return super.filterTarget.apply(this, arguments);
    }
    filterDestinationTarget(card, params) {
        return typeof card?.placeThreat === 'function' &&
            Effect.prototype.filterTarget.call(this, card, params);
    }
    getValidDestination(params) {
        return this.createDestinationValidTarget().getValidTarget({
            ...params,
            ability: this.ability,
            effect: this,
            match: this.match,
            target: this.toTarget,
        });
    }
    async canRun(params) {
        if (!this.selectedDestination) {
            this.threat = await this.resolveThreat(params);
        }

        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.getValidDestination(params).length) {
            return false;
        }

        if (!this.selectedTarget || !this.selectedDestination) {
            return true;
        }

        const sourceTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];

        return sourceTargets.every(sourceTarget => {
            const source = this.getThreatSource(sourceTarget, params);

            return source &&
                source.canRemoveThreat() &&
                source.threat > 0;
        });
    }
    async prepare(params) {
        this.threat = await this.resolveThreat(params);
        await super.prepare(params);

        if (!this.selectedTarget ||
            (Array.isArray(this.selectedTarget) && !this.selectedTarget.length)) {
            return;
        }

        this.selectedDestination = await this.createDestinationValidTarget().selectTarget({
            ...params,
            ability: this.ability,
            dialogTitle: 'Elige dónde trasladar la amenaza',
            effect: this,
            match: this.match,
            target: this.toTarget,
        });

        const sourceTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const sources = sourceTargets.map(sourceTarget =>
            this.getThreatSource(sourceTarget, params)
        );
        const destinationCount = Array.isArray(this.selectedDestination) ?
            this.selectedDestination.length :
            this.selectedDestination ? 1 : 0;

        if (destinationCount && sources.length) {
            const availableThreat = Math.floor(
                Math.min(...sources.map(source => source.threat)) /
                    destinationCount
            );
            this._threat = Math.min(this.threat, availableThreat);
        }
    }
    async execute(params) {
        this.movementResolved = true;
        const sourceTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const destinationTargets = Array.isArray(this.selectedDestination) ?
            this.selectedDestination :
            [this.selectedDestination];

        if (!sourceTargets.length || !destinationTargets.length) {
            return;
        }

        const sources = [];
        for (const sourceTarget of sourceTargets) {
            const source = this.getThreatSource(sourceTarget, params);
            if (!source ||
                source.threat < destinationTargets.length ||
                !source.canRemoveThreat()) {
                continue;
            }

            sources.push(source);
        }

        if (!sources.length || this.threat <= 0) {
            return;
        }

        const amountPerDestination = Math.min(
            this.threat,
            Math.floor(Math.min(...sources.map(source => source.threat)) /
                destinationTargets.length)
        );
        if (amountPerDestination <= 0) {
            return;
        }
        this._threat = amountPerDestination + this.preventThreat;
        this.movedThreat = amountPerDestination *
            sources.length *
            destinationTargets.length;
        sources.forEach(source => destinationTargets.forEach(destination => {
            moveThreatTokens(source, destination, amountPerDestination);
        }));

        const refreshedTargets = new Set([...sources, ...destinationTargets]);
        await Promise.all([...refreshedTargets].map(target => target.refresh?.()));

        for (const source of sources) {
            await defeatSideSchemeIfEmpty(
                source,
                this.match,
                this.ability,
                params
            );
        }

        for (const destination of destinationTargets) {
            await completeMainSchemeIfThresholdReached(
                destination,
                this.match,
                params
            );
        }
    }
}

import {
    EFFECT_MOVE_COUNTERS,
    TARGET_YOU,
    TRIGGER_MOVE_COUNTERS,
    TRIGGER_THIS_COUNTERS_REMOVED,
} from 'mc-shared';

import {ValidTarget} from '../targets/valid-target.js';
import {getMovementTriggerContext} from '../utils/movement-trigger-context.js';
import {moveCounterTokens} from '../utils/token-mutations.js';
import {Effect} from './effect.js';
import {DiscardFromGameEffect} from './discard-from-game-effect.js';

export class MoveCountersEffect extends Effect {
    constructor({
        fromTarget,
        target,
        counters,
    }) {
        super({
            ...arguments[0],
            effectType: EFFECT_MOVE_COUNTERS,
            target: fromTarget,
        });

        if (!fromTarget || !target) {
            throw new TypeError('MoveCountersEffect requires fromTarget and target.');
        }

        this.fromTarget = fromTarget;
        this.toTarget = target;
        this.baseCounters = counters;
        this.movedCounters = 0;
        this.selectedDestination = undefined;
        this.movementResolved = false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.movedCounters = 0;
        this.selectedDestination = undefined;
        this.movementResolved = false;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([TRIGGER_MOVE_COUNTERS]);
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat(this.movedCounters > 0 ?
                [TRIGGER_MOVE_COUNTERS, TRIGGER_THIS_COUNTERS_REMOVED] :
                []);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            effect: getMovementTriggerContext(this, {
                getDestinationTarget: () => this.selectedDestination,
                getSourceTarget: () => this.getCounterSource(this.selectedTarget, params),
            }),
        };
    }
    checkTrigger() {
        return this.movementResolved ?
            this.movedCounters > 0 :
            true;
    }
    getCounterSource(target, params) {
        return this.fromTarget === TARGET_YOU ?
            params.player?.superhero :
            target;
    }
    async resolveCounters(params) {
        const lastStepCounters = this.getLastStepParam('counters', params);
        const counters = lastStepCounters !== undefined ?
            lastStepCounters :
            this.paramsCalc ?
                await this.calculate(params) :
                this.baseCounters ?? params.counters;

        if (!Number.isSafeInteger(counters) || counters < 1) {
            throw new TypeError(
                'MoveCountersEffect requires a positive integer counter count.',
            );
        }

        return counters;
    }
    filterTarget(card, params) {
        const source = this.getCounterSource(card, params);

        return source &&
            typeof source.removeCounters === 'function' &&
            Number.isSafeInteger(source.counters) &&
            source.counters > 0 &&
            super.filterTarget.apply(this, arguments);
    }
    filterDestinationTarget(card, params) {
        const source = params.sourceTarget ?? this.selectedTarget;

        return card !== source &&
            typeof card?.placeCounters === 'function' &&
            Effect.prototype.filterTarget.call(this, card, params);
    }
    createDestinationValidTarget() {
        return new ValidTarget({
            effect: this,
            filter: this.filterDestinationTarget.bind(this),
            match: this.match,
            condition: this.condition,
        });
    }
    getValidDestination(params, sourceTarget = this.selectedTarget) {
        return this.createDestinationValidTarget().getValidTarget({
            ...params,
            ability: this.ability,
            effect: this,
            match: this.match,
            sourceTarget,
            target: this.toTarget,
        });
    }
    async canRun(params) {
        const counters = await this.resolveCounters(params);
        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.selectedTarget || !this.selectedDestination) {
            const sources = this.validTarget.getValidTarget({
                ...params,
                ability: this.ability,
                effect: this,
                match: this.match,
                target: this.fromTarget,
            });
            return sources.some(source =>
                source.counters >= counters &&
                this.getValidDestination(params, source).length > 0
            );
        }

        const source = this.getCounterSource(this.selectedTarget, params);
        return source?.counters >= counters &&
            this.getValidDestination(params).includes(this.selectedDestination);
    }
    async prepare(params) {
        await this.resolveCounters(params);
        await super.prepare(params);

        if (!this.selectedTarget) {
            return;
        }

        this.selectedDestination = await this.createDestinationValidTarget()
            .selectTarget({
                ...params,
                ability: this.ability,
                dialogTitle: 'Elige dónde trasladar el contador',
                effect: this,
                match: this.match,
                sourceTarget: this.selectedTarget,
                target: this.toTarget,
            });
    }
    async execute(params) {
        this.movementResolved = true;
        const source = this.getCounterSource(this.selectedTarget, params);
        const destination = this.selectedDestination;
        const counters = await this.resolveCounters(params);

        if (!source ||
            !destination ||
            source.counters < counters ||
            typeof source.removeCounters !== 'function' ||
            typeof destination.placeCounters !== 'function' ||
            !this.filterDestinationTarget(destination, {
                ...params,
                sourceTarget: this.selectedTarget,
            })) {
            return;
        }

        moveCounterTokens(source, destination, counters);
        this.movedCounters = counters;
        await Promise.all([
            source.refresh?.(),
            destination.refresh?.(),
        ]);

        if (source.counters < 1 && source.uses) {
            const discardFromGameEffect = new DiscardFromGameEffect({
                selectedTarget: source,
                match: this.match,
            });
            await discardFromGameEffect.runEffect(params);
        }
    }
}

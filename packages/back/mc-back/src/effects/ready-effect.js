import {
    TRIGGER_CHARACTER_READIED,
    TRIGGER_CHARACTER_WOULD_READY,
} from 'mc-shared';
import {Effect} from './effect.js';

export class ReadyEffect extends Effect {
    constructor(params) {
        super(params);
        this.canceledTargets = new Set();
        this.readiedTargets = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.canceledTargets.clear();
        this.readiedTargets = [];
    }
    getSelectedTargets() {
        return Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            this.selectedTarget ? [this.selectedTarget] : [];
    }
    isTargetCanceled(target) {
        return this.canceledTargets.has(target);
    }
    cancel({triggeredTarget} = {}) {
        const targets = this.getSelectedTargets();
        if (triggeredTarget && !targets.includes(triggeredTarget)) {
            throw new Error('ReadyEffect could not find the replaced ready target.');
        }
        for (const target of triggeredTarget ? [triggeredTarget] : targets) {
            this.canceledTargets.add(target);
        }
    }
    checkTrigger(params) {
        return this.isActivationActive(params) &&
            (this.readiedTargets.length > 0 ||
                this.getSelectedTargets().some(target =>
                    target.exhausted && !this.isTargetCanceled(target)));
    }
    getTriggersWould(params) {
        return super.getTriggersWould(params).concat([TRIGGER_CHARACTER_WOULD_READY]);
    }
    getTriggersEnds(params) {
        const triggerTypes = super.getTriggersEnds(params);

        return this.readiedTargets.length > 0 ?
            triggerTypes.concat([TRIGGER_CHARACTER_READIED]) :
            triggerTypes;
    }
    isResolved() {
        return this.readiedTargets.length > 0;
    }
    isFullResolved() {
        return this.isResolved() &&
            this.readiedTargets.length === this.getSelectedTargets().length;
    }
    filterTarget(card) {
        return card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async canReadyTarget(target, params) {
        if (!target) {
            return true;
        }

        const owner = target.owner;

        if (!owner?.isPlayer || typeof owner.canReady !== 'function') {
            return true;
        }

        const card = target.parent?.sides?.includes(target) ?
            target.parent :
            target;

        return owner.canReady({...params, card});
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const targets = (await this.getValidTarget(params)).flat(Infinity);

        return this.promisesSequentialSome(targets, target =>
            this.canReadyTarget(target, params));
    }
    async prepare(params) {
        await super.prepare(params);
        const targets = await this.promisesSequentialFilter(
            this.getSelectedTargets(),
            target => target.exhausted && this.canReadyTarget(target, params),
        );
        this.selectedTarget = Array.isArray(this.selectedTarget) ?
            targets : targets[0];
    }
    async execute(params) {
        for (const target of this.getSelectedTargets()) {
            if (this.isTargetCanceled(target) ||
                !await this.canReadyTarget(target, params)) {
                continue;
            }

            await target.ready();
            this.readiedTargets.push(target);
            await target.refresh();
        }
    }
}
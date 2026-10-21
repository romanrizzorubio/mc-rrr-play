import {
    EFFECT_CATEGORY_DAMAGE,
    TARGET_YOU,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_MOVE_DAMAGE,
    TRIGGER_PLACE_DAMAGE,
    TRIGGER_REMOVE_DAMAGE,
} from 'mc-shared';
import {path} from '../engine/utils.js';

import {
    canResolveDamageWithStatus,
    defeatCharacterIfLethal,
    getDamageStatusTarget,
    resolveDamageStatus,
    resolveToughDamage,
} from '../utils/damage-resolution.js';
import {getMovementTriggerContext} from '../utils/movement-trigger-context.js';
import {moveDamageTokens} from '../utils/token-mutations.js';
import {Effect} from './effect.js';

export class MoveDamageEffect extends Effect {
    constructor({
        damage,
        fromTarget,
    }) {
        super(arguments[0]);

        this.baseDamage = damage;
        this.fromTarget = fromTarget;
        this.preventDamage = 0;
        this.movedDamage = 0;
        this.movementResolved = false;
        this.defeated = false;
    }

    get takenDamage() {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const damage = Array.isArray(this.damage) ?
            this.damage :
            targets.map(() => this.damage);
        const prevention = Array.isArray(this.preventDamage) ?
            this.preventDamage :
            targets.map(() => this.preventDamage || 0);
        const takenDamage = damage.map((amount, index) =>
            Math.max(0, amount - (prevention[index] || 0))
        );

        return Array.isArray(this.selectedTarget) ?
            takenDamage :
            takenDamage[0] || 0;
    }

    resetResolutionData() {
        super.resetResolutionData();
        this.preventDamage = 0;
        this.damage = this.baseDamage;
        this.movedDamage = 0;
        this.movementResolved = false;
        this.defeated = false;
    }

    checkTrigger(params) {
        if (!this.isActivationActive(params)) {
            return false;
        }

        if (this.movementResolved) {
            return this.movedDamage > 0;
        }

        const {takenDamage} = this;
        return Array.isArray(takenDamage) ?
            takenDamage.some(damage => damage > 0) :
            takenDamage > 0;
    }

    checkStatus() {
        return canResolveDamageWithStatus(this.selectedTarget, {
            piercing: this.isAttack && this.piercing,
        });
    }

    getStatusTarget(target) {
        return getDamageStatusTarget(target);
    }

    resolveStatus() {
        return resolveDamageStatus(this.selectedTarget);
    }

    async triggerWould(params) {
        const canResolve = await super.triggerWould(params);
        const {selectedTarget} = this;
        const piercing = this.isAttack && this.piercing;
        const multiTarget = Array.isArray(selectedTarget);

        if (!canResolve || (!multiTarget && !piercing)) {
            return canResolve;
        }

        const targets = multiTarget ? selectedTarget : [selectedTarget];
        const result = await resolveToughDamage({
            targets,
            damage: this.damage,
            preventDamage: this.preventDamage,
            getStatusTarget: target => this.getStatusTarget(target),
            piercing,
        });

        this.damage = result.damage;

        return result.hasDamage;
    }

    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_PLACE_DAMAGE,
                TRIGGER_REMOVE_DAMAGE,
                TRIGGER_MOVE_DAMAGE,
            ]);
    }

    getTriggersEnds(params) {
        const triggers = super.getTriggersEnds(params)
            .concat([
                TRIGGER_PLACE_DAMAGE,
                TRIGGER_REMOVE_DAMAGE,
                TRIGGER_MOVE_DAMAGE,
                TRIGGER_ATTACHED_TAKES_DAMAGE,
            ]);

        return this.checkTrigger(params) ?
            triggers.concat([TRIGGER_CHARACTER_TAKES_DAMAGE]) :
            triggers;
    }

    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
                TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
            ]);
    }

    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            effect: getMovementTriggerContext(this, {
                getDestinationTarget: () => this.selectedTarget,
                getSourceTarget: () => this.getDamageSource(params),
            }),
        };
    }

    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }

    getDamageSource(params) {
        if (this.fromTarget === TARGET_YOU) {
            return params.player.superhero;
        }

        return path(params, this.fromTarget);
    }

    async prepare(params) {
        await super.prepare(params);

        const lastStepDamage = this.getLastStepParam('damage', params);
        if (lastStepDamage !== undefined) {
            this.damage = lastStepDamage;
        } else if (this.paramsCalc) {
            this.damage = await this.calculate(params);
        } else {
            this.damage = this.baseDamage ?? params.damage;
        }

        const source = this.getDamageSource(params);
        const targetCount = Array.isArray(this.selectedTarget) ?
            this.selectedTarget.length :
            1;

        if (source && targetCount > 0 && Number.isFinite(source.damage)) {
            this.damage = Math.min(
                this.damage,
                Math.floor(source.damage / targetCount)
            );
        }
    }

    filterTarget(card, params) {
        const source = this.getDamageSource(params);
        const damage = this.getLastStepParam('damage', params) ??
            (this.paramsCalc ?
                this.calculate(params) :
                this.baseDamage ?? params.damage);

        if (!source ||
            !Number.isFinite(source.damage) ||
            !Number.isFinite(damage) ||
            damage < 1 ||
            source.damage < damage ||
            typeof source.removeDamage !== 'function' ||
            typeof card?.placeDamage !== 'function' ||
            typeof card?.getLife !== 'function') {
            return false;
        }

        return super.filterTarget.apply(this, arguments);
    }

    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const {selectedTarget} = this;
        if (!selectedTarget) {
            return true;
        }

        const source = this.getDamageSource(params);
        const takenDamage = this.takenDamage;
        const totalDamage = Array.isArray(takenDamage) ?
            takenDamage.reduce((total, amount) => total + amount, 0) :
            takenDamage;

        return source?.damage >= totalDamage;
    }

    async execute(params) {
        this.movementResolved = true;
        this.defeated = false;
        const {selectedTarget} = this;
        const source = this.getDamageSource(params);

        const targets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];
        const takenDamage = Array.isArray(this.takenDamage) ?
            this.takenDamage :
            [this.takenDamage];
        const totalDamage = takenDamage.reduce((total, amount) => total + amount, 0);

        if (!source ||
            !targets.length ||
            !Number.isFinite(totalDamage) ||
            totalDamage <= 0 ||
            source.damage < totalDamage ||
            typeof source.removeDamage !== 'function' ||
            targets.some(target =>
                typeof target?.placeDamage !== 'function' ||
                typeof target?.getLife !== 'function'
            )) {
            return;
        }

        targets.forEach((target, index) => {
            moveDamageTokens(source, target, takenDamage[index]);
        });
        this.movedDamage = totalDamage;

        const refreshedTargets = new Set([source, ...targets]);
        await Promise.all([...refreshedTargets].map(target => target.refresh?.()));

        for (const target of targets) {
            this.defeated = await defeatCharacterIfLethal(target, {
                match: this.match,
                ability: this.ability,
                activation: this.activation,
                params,
            }) || this.defeated;
        }
    }
}

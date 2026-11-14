import {
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_TAKE_DAMAGE,
    DIALOG_ASSIGN,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';
import {AttackEffect} from './attack-effect.js';
import {Calc} from '../engine/calc.js';

export class DealDamageEffect extends AttackEffect(Effect) {
    constructor(params) {
        super(params);
        const {
            character,
            damage,
            additionalDamageCalc,
            ignoreTough = false,
            preventDamage = 0,
            distribute = false,
            attackKeywordSource,
        } = params;

        this._character = character;
        this.attackKeywordSource = attackKeywordSource;
        this.ignoreTough = ignoreTough;
        this.preventDamageAmount = preventDamage;
        this.baseDamage = damage;
        this.additionalDamageCalc = additionalDamageCalc;
        this.additionalDamage = 0;
        this.damageModifier = 0;
        this.modifyAttack = 0;
        this.targetCountCalc = params.targetCountCalc;
        this.selectCount = params.selectCount;
        this.distribute = distribute;

        this.damage = undefined;
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
        this.defeated = false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.additionalDamage = 0;
        this.modifyAttack = 0;
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
        this.defeated = false;
    }
    get character() {
        return this._character || super.character;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    checkTrigger(params) {
        if (!this.isActivationActive(params)) {
            return false;
        }

        if (this.isAttack) {
            return true;
        }

        if (Array.isArray(this.damage)) {
            if (Array.isArray(this.preventDamage)) {
                return this.damage.some((d, index) => d > this.preventDamage[index]);
            }
            return this.damage.some(d => d > this.preventDamage);
        }
        if (Array.isArray(this.preventDamage)) {
            return this.preventDamage.some(prevention => this.damage > prevention);
        }
        return this.damage > this.preventDamage;
    }
    getTriggersParams(params) {
        const {selectedTarget} = this;

        const newParams = super.getTriggersParams(params);

        if (!newParams.card) {
            newParams.card = selectedTarget;
        }

        return newParams;
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params);
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
            ]);
    }
    async resolveParams(params) {
        const resolvedParams = await super.resolveParams(params);

        if (this.targetCountCalc) {
            const selectCount = await new Calc(this.targetCountCalc)
                .calculate({...resolvedParams, effect: this});
            if (!Number.isSafeInteger(selectCount) || selectCount < 0) {
                throw new Error('El número calculado de objetivos debe ser un entero no negativo.');
            }
            this.selectCount = selectCount;
        }

        if (!this.paramsCalc ||
            this.getLastStepParam('damage', resolvedParams) !== undefined) {
            return resolvedParams;
        }

        const damage = await this.calculate({
            ...resolvedParams,
            source: this.source,
        });

        return {
            ...resolvedParams,
            damage,
        };
    }
    async canRun(params) {
        const resolvedParams = await this.resolveParams(params);
        const lastStepDamage = this.getLastStepParam('damage', resolvedParams);
        const damage = lastStepDamage !== undefined ?
            lastStepDamage :
            resolvedParams.damage;
        const paramsCalcTarget = this.paramsCalc?.target;
        const dependsOnUnpaidArrowCost =
            !params.arrowPaid &&
            typeof paramsCalcTarget === 'string' &&
            paramsCalcTarget.startsWith('effect.ability.arrow.cost.');
        if (this.paramsCalc && !(damage > 0) &&
            !dependsOnUnpaidArrowCost) {
            return false;
        }

        return super.canRun(resolvedParams);
    }
    async prepare(params) {
        this.damage = undefined;
        this.additionalDamage = 0;
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
        this.defeated = false;

        await super.prepare(params);

        this.additionalDamage = this.additionalDamageCalc ?
            await new Calc(this.additionalDamageCalc).calculate({
                ...params,
                match: params.match ?? this.match,
                effect: this,
            }) :
            0;
        if (!Number.isFinite(this.additionalDamage)) {
            throw new TypeError(
                'DealDamageEffect additionalDamageCalc requires a numeric damage value.'
            );
        }

        if (this.damage === undefined) {
            const lastStepDamage = this.getLastStepParam('damage', params);
            if (lastStepDamage !== undefined) {
                this.damage = lastStepDamage;
            } else if (this.paramsCalc) {
                if (params.damage === undefined) {
                    throw new Error('El daño calculado no llegó en los parámetros de DealDamageEffect.');
                }
                this.damage = params.damage;
            } else {
                this.damage = this.baseDamage ?? params.damage;
            }
        }
        const damageModifier = this.damageModifier + this.additionalDamage;
        if (Array.isArray(this.damage)) {
            this.damage = this.damage.map(damage => damage + damageModifier);
        } else if (Number.isFinite(this.damage)) {
            this.damage += damageModifier;
        } else if (damageModifier) {
            throw new TypeError('DealDamageEffect requires a numeric damage value to modify.');
        }

    }
    /** @returns {Promise<void>} */
    async execute(params) {
        this.defeated = false;

        if (Array.isArray(this.selectedTarget) &&
            this.selectedTarget.length === 0) {
            return;
        }

        const {ability} = this;
        if (this.isAttack && ability?.isBasic &&
            typeof ability.getAttackValue === 'function') {
            const previousTarget = this.target;
            const attackValue = await ability.getAttackValue(params);
            await this.refreshTargetSelection(previousTarget, params);
            this.damage = attackValue +
                (this.modifyAttack ?? 0) +
                this.damageModifier +
                this.additionalDamage;
        }

        await this.distributeDamage(params);

        const {activation} = this;
        if (this.isAttack && !this.isAttackDamageOnly && activation) {
            if (activation.getOverkill?.(params)) {
                await activation.applyOverkill(params, this);
            } else if (activation.calculateExcessDamage) {
                await activation.calculateExcessDamage(params, this);
            }
        }

        const {selectedTarget} = this;
        const damage = Array.isArray(selectedTarget) &&
            Array.isArray(this.preventDamage) && !Array.isArray(this.damage) ?
            selectedTarget.map(() => this.damage) : this.damage;
        const preventDamage = Array.isArray(damage) ?
            damage.map((amount, index) => Math.min(amount,
                (Array.isArray(this.preventDamage) ?
                    this.preventDamage[index] ?? 0 : this.preventDamage ?? 0) +
                this.preventDamageAmount)) :
            Math.min(damage, (this.preventDamage ?? 0) + this.preventDamageAmount);
        const takeDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_TAKE_DAMAGE,
            selectedTarget,
            damage,
            preventDamage,
            ignoreTough: this.ignoreTough,
            character: this.character,
            ability: this.ability,
            activation: this.activation,
            isAttack: this.isAttack,
            isAttackDamageOnly: this.isAttackDamageOnly,
            attackKeywordSource: this.attackKeywordSource ?? this,
        });

        await takeDamageEffect.runEffect(params);

        this.takenDamage = takeDamageEffect.takenDamage;
        this.defeated = takeDamageEffect.defeated === true;

        if (this.activation && !this.isAttackDamageOnly) {
            if (Number.isFinite(takeDamageEffect.excessDamage)) {
                this.activation.excessDamage = takeDamageEffect.excessDamage;
            }

            if (this.activation.excessDamageTarget) {
                this.activation.excessDamageTaken = this.defeated ?
                    this.activation.excessDamageTaken ?? 0 :
                    0;

                if (this.defeated) {
                    this.takenDamage = [
                        this.takenDamage,
                        this.activation.excessDamageTaken,
                    ];
                }
            }

            this.activation.takenDamage = this.takenDamage;
            this.excessDamage = this.activation.excessDamage;
        }
    }
    static validateDamageAssignment(assigned, targets, damage) {
        if (!assigned ||
            typeof assigned !== 'object' ||
            Array.isArray(assigned) ||
            Object.keys(assigned).length !== targets.length) {
            throw new Error('La distribución del daño no es válida.');
        }

        const assignments = targets.map(target => {
            const amount = assigned[target.id];
            if (!Object.hasOwn(assigned, target.id) ||
                !Number.isSafeInteger(amount) ||
                amount < 0 ||
                amount > damage) {
                throw new Error('La distribución del daño no es válida.');
            }

            return {amount, target};
        });
        const assignedTotal = assignments.reduce((total, {amount}) =>
            total + amount, 0);
        if (assignedTotal !== damage) {
            throw new Error('La distribución del daño no es válida.');
        }

        return assignments;
    }
    async distributeDamage(params) {
        if (!this.distribute) {
            return;
        }

        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            this.selectedTarget ? [this.selectedTarget] : [];
        if (targets.length < 2) {
            return;
        }

        if (!Number.isSafeInteger(this.damage) || this.damage < 0) {
            throw new TypeError(
                'La distribución del daño requiere una cantidad entera no negativa.',
            );
        }
        if (this.damage === 0) {
            this.selectedTarget = [targets[0]];

            return;
        }

        const {player} = params;
        const {assigned} = await this.openDialog({
            dialogType: DIALOG_ASSIGN,
            targetPlayer: player,
            title: `Reparte ${this.damage} de Daño entre objetivos`,
            hand: player.hand.cards.map(card => card.toObj(params)),
            data: {
                assignInitially: true,
                autoAssignRemainderToSingleTarget: true,
                count: this.damage,
                field: 'damage',
                ...(targets.some(({id}) =>
                    id === params.activationTargetId) ?
                    {initialTargetId: params.activationTargetId} :
                    {}),
                preserveRemainderOnDecrease: true,
                transferIncreaseFromMostAssigned: true,
                cards: targets.map(target => ({
                    ...target.toObj(params),
                    damage: this.damage,
                })),
            },
        });
        const assignments = DealDamageEffect.validateDamageAssignment(
            assigned,
            targets,
            this.damage,
        ).filter(({amount}) => amount > 0);

        this.selectedTarget = assignments.map(({target}) => target);
        this.damage = assignments.map(({amount}) => amount);
    }
}
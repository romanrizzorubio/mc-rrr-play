import {DIALOG_DEFENSE,TARGET_CARD,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_THIS_ATTACK,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU
} from 'mc-shared';

import {DealDamageEffect} from './deal-damage-effect.js';
import {EnemyActivationEffect} from './enemy-activation-effect.js';
import {ExhaustEffect} from './exhaust-effect.js';
import {checkCondition} from '../engine/utils.js';


export class EnemyAttackEffect extends EnemyActivationEffect {
    constructor(params = {}) {
        super({
            ...params,
            isAttack: true,
        });

        this.defender = null;
        this.defValue = 0;
        this.defendersByTarget = new Map();
        this.defenseValues = new Map();
        this.originalAttackTarget = undefined;
        this.defenderConditions = [];
    }
    get isDefended() {
        return Boolean(this.defender || this.defendersByTarget.size);
    }
    getTargetDialog() {
        const selectedTarget = Array.isArray(this.selectedTarget) ?
            this.selectedTarget[0] :
            this.selectedTarget;

        return selectedTarget.superhero;
    }
    getBoostTarget() {
        return this.originalAttackTarget || super.getBoostTarget();
    }
    async getAttackValue(params) {
        const {character} = this;

        return character.getAttackValue(params);
    }
    async getDefenseValue(params, defender = this.defender) {
        return defender.getDefenseValue(params);
    }
    async defense(params) {
        const attackTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];

        for (const attackTarget of attackTargets) {
            const requiredDefenders = this.getRequiredDefenders(attackTarget);
            const mustDefend = requiredDefenders.length > 0;
            const defenders = mustDefend ?
                requiredDefenders :
                this.getDefenders(attackTarget);
            if (defenders.length) {
                const attack = this.toObj(arguments[0]);
                attack.target = attackTarget.toObj(arguments[0]);

                const {defender} = await this.openDialog({
                    dialogType: DIALOG_DEFENSE,
                    hand: attackTarget.owner.hand.cards.map(card => card.toObj(arguments[0])),
                    hideOk: mustDefend,
                    data: {
                        attack,
                        defenders: defenders.map(d => d.toObj(arguments[0])),
                    },
                });

                const objDefender = defender &&
                    defenders.find(d => d.id === defender.id);
                if (mustDefend && !objDefender) {
                    throw new Error('EnemyAttackEffect requires a qualifying defender.');
                }

                if (objDefender) {
                    await this.setDefender(objDefender, attackTarget);

                    if (objDefender.isSuperhero) {
                        const selectedDefender = this.defendersByTarget.get(attackTarget);
                        const defenseValue = await this.getDefenseValue(
                            params,
                            selectedDefender
                        );

                        if (Array.isArray(this.selectedTarget)) {
                            this.defenseValues.set(attackTarget, defenseValue);
                        } else {
                            this.defValue = defenseValue;
                        }
                    }
                }
            }
        }
    }
    getDefenders(target = this.selectedTarget) {
        if (Array.isArray(target)) {
            return target.flatMap(attackTarget => this.getDefenders(attackTarget));
        }

        const defenders = target.defenders;
        const requiredDefenders = this.getRequiredDefenders(target);

        return requiredDefenders.length ? requiredDefenders : defenders;
    }
    getRequiredDefenders(target) {
        if (Array.isArray(target)) {
            return target.flatMap(attackTarget => this.getRequiredDefenders(attackTarget));
        }

        if (!this.defenderConditions.length) {
            return [];
        }

        return target.defenders.filter(defender =>
            this.defenderConditions.every(condition => checkCondition(defender, condition)));
    }
    changeAttackTargets(targets) {
        if (!Array.isArray(targets) || !this.selectedTarget) {
            throw new Error('EnemyAttackEffect requires attack targets and an existing target.');
        }

        if (!this.originalAttackTarget) {
            this.originalAttackTarget = this.selectedTarget;
        }
        this.selectedTarget = targets;
    }
    addDefenderCondition(condition) {
        this.defenderConditions.push(condition);
    }
    getTitleDialog() {
        const {character} = this;
        const target = this.getTargetDialog();

        return `${character.name} ataca a ${target.name}`;
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_ATTACHED_WOULD_ATTACK,
                TRIGGER_THIS_ATTACK,
            ]);
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_VILLAIN_ATTACKS,
                TRIGGER_VILLAIN_ATTACKS_YOU,
            ]);
    }
    getTriggersEnds(params) {
        return this.activation.getTriggersEnds(params)
            .concat([TRIGGER_VILLAIN_ATTACKS_YOU]);
    }
    async setDefender(defender, attackTarget = this.selectedTarget) {
        if (defender) {
            this.defender = defender.isSuperhero ? defender.currentSide : defender;
            this.defendersByTarget.set(attackTarget, this.defender);
            if (!Array.isArray(this.selectedTarget)) {
                this.selectedTarget = defender.owner;
            }

            const exhaustEffect = new ExhaustEffect({
                target: TARGET_CARD,
                match: this.match,
            });

            await exhaustEffect.runEffect({
                card: defender,
            });
        }
    }
    async execute(params) {
        const {character, selectedTarget} = this;
        const isMultiTarget = Array.isArray(selectedTarget);
        const attackTargets = isMultiTarget ? selectedTarget : [selectedTarget];

        await this.dealBoostCards(params);
        await this.defense(params);
        const boost = await this.resolveBoostCards(params);
        const atkValue = await this.getAttackValue(params);
        const attackedTargets = attackTargets.map(attackTarget =>
            this.defendersByTarget.get(attackTarget) ||
                (isMultiTarget ? attackTarget : this.defender || attackTarget));
        const damages = attackTargets.map(attackTarget => {
            const defValue = isMultiTarget ?
                this.defenseValues.get(attackTarget) || 0 :
                this.defValue;

            return Math.max(0, atkValue + boost - defValue);
        });

        this.attacked = isMultiTarget ? attackedTargets : attackedTargets[0];

        const dealDamageEffect = new DealDamageEffect({
            character,
            damage: isMultiTarget ? damages : damages[0],
            activation: this.activation,
            isAttack: true,
            match: this.match,
            selectedTarget: isMultiTarget ? attackedTargets : attackedTargets[0],
            ability: this.ability,
        });

        await dealDamageEffect.runEffect(params);

        this.activation.takenDamage = dealDamageEffect.takenDamage;
    }
}
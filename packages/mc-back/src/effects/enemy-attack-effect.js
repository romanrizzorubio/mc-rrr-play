import {DIALOG_DEFENSE,TARGET_CARD,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU
} from 'mc-shared';

import {DealDamageEffect} from './deal-damage-effect.js';
import {EnemyActivationEffect} from './enemy-activation-effect.js';
import {ExhaustEffect} from './exhaust-effect.js';


export class EnemyAttackEffect extends EnemyActivationEffect {
    constructor() {
        super({
            ...arguments[0],
            isAttack: true,
        });

        this.defender = null;
        this.defValue = 0;
    }
    get isDefended() {
        return !!this.defender;
    }
    getTargetDialog() {
        const {selectedTarget} = this;

        return selectedTarget.superhero;
    }
    async getAttackValue(params) {
        const {character} = this;

        return character.getAttackValue(params);
    }
    async getDefenseValue(params) {
        const {defender} = this;

        return defender.getDefenseValue(params);
    }
    async defense(params) {
        const defenders = this.getDefenders();
        if (defenders.length) {
            const {defender} = await this.openDialog({
                dialogType: DIALOG_DEFENSE,
                hand: this.selectedTarget.owner.hand.cards.map(card => card.toObj(arguments[0])),
                data: {
                    attack: this.toObj(arguments[0]),
                    defenders: defenders.map(d => d.toObj(arguments[0])),
                },
            });

            if (defender) {
                const objDefender = defenders.find(d => d.id === defender.id);

                await this.setDefender(objDefender);

                if (objDefender.isSuperhero) {
                    this.defValue = await this.getDefenseValue(params);
                }
            }
        }
    }
    getDefenders() {
        return this.selectedTarget.defenders;
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
    async setDefender(defender) {
        if (defender) {
            this.defender = defender.isSuperhero ? defender.currentSide : defender;
            this.selectedTarget = defender.owner;

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

        await this.dealBoostCards(params);
        await this.defense(params);
        const boost = await this.resolveBoostCards(params);
        const atkValue = await this.getAttackValue(params);
        const defValue = this.defValue;
        const damage = atkValue + boost - defValue;

        this.attacked = this.defender || selectedTarget;

        const dealDamageEffect = new DealDamageEffect({
            character,
            damage,
            activation: this.activation,
            isAttack: true,
            match: this.match,
            selectedTarget: this.attacked,
            ability: this.ability,
        });

        await dealDamageEffect.runEffect(params);

        this.activation.takenDamage = dealDamageEffect.takenDamage;
    }
}
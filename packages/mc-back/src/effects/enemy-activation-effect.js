import {DIALOG_ACTIVATE} from '../constants/dialogs.js';
import {ValidTarget} from '../targets/valid-target.js';

import {DealBoostEffect} from './deal-boost-effect.js';
import {Effect} from './effect.js';
import {ResolveBoostEffect} from './resolve-boost-effect.js';

export class EnemyActivationEffect extends Effect {
    constructor({
        enemy,
        enemyType,
    }) {
        super(arguments[0]);

        this.enemy = enemy;
        this.enemyType = enemyType;

        this.boostCards = [];
        this.canceled = false;
    }
    get character() {
        return this.enemy;
    }
    cancelActivation() {
        this.canceled = true;
    }
    checkTrigger() {
        return !this.canceled;
    }
    dealBoostCards(params) {
        const dealBoostEffect = new DealBoostEffect({
            ability: this.ability,
            enemyActivation: this,
            match: this.match,
        });

        return dealBoostEffect.runEffect(params);
    }
    getTriggersParams(params) {
        const {character} = this;

        return {
            ...super.getTriggersParams(params),
            character,
        };
    }
    getTargetDialog() {
        const {selectedTarget} = this;

        return selectedTarget;
    }
    getTitleDialog(params) {
        const {character} = this;
        const target = this.getTargetDialog(params);

        return `${character.name} se activa con ${target.name}`;
    }
    async prepare(params) {
        await super.prepare(params);

        const {enemy} = this;

        if (!enemy) {
            await this.selectEnemy(params);
        }

        const {character} = this;
        const target = this.getTargetDialog(params);

        await this.openDialog({
            dialogType: DIALOG_ACTIVATE,
            title: this.getTitleDialog(params),
            data: {
                character: character.toObj(arguments[0]),
                target: target.toObj(arguments[0]),
            },
        });
    }
    resolveBoostCards(params) {
        const {boostCards, selectedTarget} = this;

        return boostCards.reduce(async (b, card) => {
            const resolveBoostEffect = new ResolveBoostEffect({
                activation: this.activation,
                match: this.match,
                selectedTarget,
                card,
            });

            await resolveBoostEffect.runEffect(params);

            b += resolveBoostEffect.value;

            await card.discard();

            return b;
        }, 0);
    }
    async selectEnemy(params) {
        const {enemyType, ability} = this;

        const validTarget = new ValidTarget({
            effect: this,
            match: this.match,
        });

        this.enemy = await validTarget.selectTarget({
            ...params,
            ability,
            target: enemyType,
        });
    }
    toObj() {
        const {
            character,
            selectedTarget,
            boostCards,
        } = this;

        return {
            ...super.toObj(arguments[0]),
            character: character.toObj(arguments[0]),
            target: selectedTarget.toObj(arguments[0]),
            boostCards: boostCards.map(card => card.toObj(arguments[0])),
        };
    }
}
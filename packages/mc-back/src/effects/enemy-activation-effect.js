import {DIALOG_ACTIVATE, DIALOG_BOOST_DEALT} from 'mc-shared';
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
    getBoostTarget() {
        return this.selectedTarget;
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
    async showBoostCards() {
        const {boostCards, enemy} = this;

        if (!boostCards.length || this.match.skipBoostDealtNotification) {
            return;
        }

        const count = boostCards.length;
        const countText = count === 1 ?
            'una carta de aumento' :
            `${count} cartas de aumento`;

        const response = await this.openDialog({
            dialogType: DIALOG_BOOST_DEALT,
            title: `${enemy.name} recibe ${countText}`,
            data: {
                allowHideFuture: true,
                cardCount: count,
            },
        });

        if (response?.skipBoostDealtNotification) {
            this.match.skipBoostDealtNotification = true;
        }
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
    showActivationSkippedDialog(statusType, statusMessage) {
        return this.openDialog({
            dialogType: DIALOG_ACTIVATE,
            title: 'Activación omitida',
            data: {
                statusMessage,
                statusType,
            },
        });
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
    async resolveBoostCards(params) {
        const {boostCards} = this;
        const selectedTarget = this.getBoostTarget();
        let totalBoost = 0;

        for (const [cardIndex, card] of boostCards.entries()) {
            const resolveBoostEffect = new ResolveBoostEffect({
                activation: this.activation,
                enemyActivation: this,
                match: this.match,
                selectedTarget,
                card,
                cardIndex,
            });

            await resolveBoostEffect.runEffect(params);

            totalBoost += resolveBoostEffect.value;

            if (!card.isInPlay) {
                await card.discard();
            }
        }

        return totalBoost;
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
            target: Array.isArray(selectedTarget) ?
                selectedTarget.map(target => target.toObj(arguments[0])) :
                selectedTarget.toObj(arguments[0]),
            boostCards: boostCards.map(card => card.toObj(arguments[0])),
        };
    }
}
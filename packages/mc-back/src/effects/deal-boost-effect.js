import {DIALOG_BOOST_DEALT} from '../constants/dialogs.js';

import {Effect} from './effect.js';

export class DealBoostEffect extends Effect {
    constructor({
        enemyActivation,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
    }
    async execute(_params) {
        const {enemyActivation} = this;
        const {enemy} = enemyActivation;

        if (enemy.isVillain ||
            (enemy.isMinion && enemy.villainous)) {
            const cards = await this.match.drawEncounterCards();

            enemyActivation.boostCards = enemyActivation.boostCards.concat(cards);

            if (cards.length) {
                await this.openDialog({
                    dialogType: DIALOG_BOOST_DEALT,
                    title: `${enemy.name} recibe una carta de aumento`,
                    data: {},
                });
            }
        }
    }
}
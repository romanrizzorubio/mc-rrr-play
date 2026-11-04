import {DIALOG_LIST} from 'mc-shared';

import {Effect} from './effect.js';

export class ChooseAbilityEffect extends Effect {
    constructor({
        options = [],
    }) {
        super(arguments[0]);

        this.options = options;

        this.options.forEach(option => {
            option.parent = this;
        });

        this.isChooseAbility = true;
    }
    get isTargetSelectionWrapper() {
        return !this.hasExplicitTarget;
    }
    get ability() {
        return super.ability;
    }
    async getTargetSelectionChildren(params) {
        const validOptions = await this.getValidOptions(params, true);
        const options = validOptions.length ?
            validOptions :
            await this.getValidOptions(params, false);

        return [
            ...super.getTargetSelectionChildren(params),
            ...options.map(option => option.effect).filter(Boolean),
        ];
    }
    set ability(ability) {
        super.ability = ability;
        this.options.forEach(option => {
            option.card = ability?.card;
        });
    }
    get keepTriggering() {
        return this.options.some(option =>
            option.keepTriggering
        );
    }
    canRun(params) {
        return this.promisesSequentialSome(this.options, option =>
            option.canRun(params));
    }
    getValidOptions(params, matchAll) {
        const {options} = this;

        return this.promisesSequentialFilter(options, option => option.canRun({
            ...params,
            matchAll,
        }));
    }
    async execute(params) {
        const {player} = params;
        const {ability: {card}} = this;

        while (true) {
            let options = await this.getValidOptions(params, true);
            if (!options.length) {
                options = await this.getValidOptions(params, false);
            }
            if (!options.length) {
                return;
            }

            const {selected} = await this.openDialog({
                dialogType: DIALOG_LIST,
                hideOk: true,
                targetPlayer: player,
                hand: player.hand.cards.map(card => card.toObj(arguments[0])),
                title: 'Elige una opción',
                data: {
                    card: card.toObj(arguments[0]),
                    options: options.map((option, index) => ({
                        id: index,
                        text: option.getTitle(),
                    }))
                },
            });

            const ability = options[selected.id];
            await ability.resolveAbility(params);
            if (!ability.paymentCancelled) {
                return;
            }
        }
    }
}
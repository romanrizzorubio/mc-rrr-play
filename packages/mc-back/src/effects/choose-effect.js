import {DIALOG_LIST} from '../constants/dialogs.js';

import {Effect} from './effect.js';

export class ChooseEffect extends Effect {
    constructor({
        options = [],
    }) {
        super(arguments[0]);

        this.options = options;

        options.forEach(effect => {
            if (!effect.target) {
                effect.target = this.target;
            }

            return effect;
        });

        this.isChoose = true;
    }
    get ability() {
        return super.ability;
    }
    set ability(ability) {
        this._ability = ability;
        this.options.forEach(option => {
            option.ability = ability;
        });
    }
    canRun(params) {
        return this.promisesSequentialSome(this.options, option => option.canRun(params));
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

        let options = await this.getValidOptions(params, true);

        if (!options.length) {
            options = await this.getValidOptions(params, false);
        }

        if (options.length) {
            const {selected} = await this.openDialog({
                dialogType: DIALOG_LIST,
                hideOk: true,
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

            const effect = options[selected.id];

            return effect.runEffect(params);
        }
    }
}
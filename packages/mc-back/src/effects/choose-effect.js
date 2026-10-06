import {DIALOG_LIST} from 'mc-shared';

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
    getOptionParams(params) {
        return params.isCost || params.costPaymentSession?.requireAllCosts ?
            params :
            {...params, matchAll: false};
    }
    canRun(params) {
        const optionParams = this.getOptionParams(params);

        return this.promisesSequentialSome(this.options, option =>
            option.canRun(optionParams));
    }
    getValidOptions(params) {
        const {options} = this;
        const optionParams = this.getOptionParams(params);

        return this.promisesSequentialFilter(options, option =>
            option.canRun(optionParams));
    }
    async execute(params) {
        const {player} = params;
        const {ability: {card}} = this;
        const optionParams = this.getOptionParams(params);

        const options = await this.getValidOptions(params);
        if (options.length === 1) {
            return options[0].runEffect(optionParams);
        }

        if (options.length > 1) {
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

            return effect.runEffect(optionParams);
        }
    }
}
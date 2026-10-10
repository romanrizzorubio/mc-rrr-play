import {DIALOG_LIST, TARGET_ALL_PLAYERS, TARGET_YOU} from 'mc-shared';

import {Effect} from './effect.js';

export class ChooseEffect extends Effect {
    constructor({
        options = [],
        players = TARGET_YOU,
    }) {
        super(arguments[0]);

        this.options = options;
        this.playersTarget = players;

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
    getPlayers(params) {
        if (this.playersTarget !== TARGET_ALL_PLAYERS) {
            return [params.player];
        }

        const {players, initialPlayer} = this.match;
        const initialPlayerIndex = players.indexOf(initialPlayer);

        if (initialPlayerIndex < 0) {
            throw new Error('No se pudo determinar al primer jugador para resolver las elecciones.');
        }

        return players.slice(initialPlayerIndex).concat(players.slice(0, initialPlayerIndex));
    }
    resetOptionTargets() {
        if (this.playersTarget === TARGET_ALL_PLAYERS) {
            this.options.forEach(option => {
                option.selectedTarget = undefined;
            });
        }
    }

    async canRun(params) {
        const players = this.getPlayers(params);

        return this.promisesSequentialSome(players, async player => {
            const optionParams = this.getOptionParams({...params, player});

            this.resetOptionTargets();

            return this.promisesSequentialSome(this.options, option =>
                option.canRun(optionParams));
        });
    }
    getValidOptions(params) {
        const {options} = this;
        const optionParams = this.getOptionParams(params);

        return this.promisesSequentialFilter(options, option =>
            option.canRun(optionParams));
    }
    async execute(params) {
        const card = this.ability.card || params.card;

        for (const player of this.getPlayers(params)) {
            let returnToChoice = false;

            while (true) {
                const playerParams = {...params, player};
                const optionParams = this.getOptionParams(playerParams);

                this.resetOptionTargets();

                const options = await this.getValidOptions(playerParams);
                if (!options.length) {
                    break;
                }
                if (options.length === 1 && !returnToChoice) {
                    await options[0].runEffect(optionParams);
                    break;
                }

                const {selected} = await this.openDialog({
                    dialogType: DIALOG_LIST,
                    hideOk: true,
                    hand: player.hand.cards.map(card => card.toObj(playerParams)),
                    title: 'Elige una opción',
                    ...(this.playersTarget === TARGET_ALL_PLAYERS ?
                        {targetPlayer: player.name} :
                        {}),
                    data: {
                        card: card.toObj(playerParams),
                        options: options.map((option, index) => ({
                            id: index,
                            text: option.getTitle(),
                        }))
                    },
                });

                const selectedOption = options[selected.id];
                await selectedOption.runEffect({
                    ...optionParams,
                    isChosenOption: true,
                });
                if (!selectedOption.paymentCancelled) {
                    break;
                }

                returnToChoice = true;
            }
        }
    }
}
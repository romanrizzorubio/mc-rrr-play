import {CARD_TYPES, DIALOG_LIST} from 'mc-shared';

import {Effect} from './effect.js';

export class ChooseCardTypeEffect extends Effect {
    constructor(params) {
        super(params);

        const excludedCardTypes = new Set(params.excludeCardTypes ?? []);
        this.cardTypes = CARD_TYPES.filter(cardType =>
            !excludedCardTypes.has(cardType));
        this.selectedType = undefined;
        this.outputParams = ['namedCardType'];
        this.isChoose = true;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.selectedType = undefined;
    }
    async canRun(params) {
        return this.cardTypes.length > 0 && super.canRun(params);
    }
    async execute(params) {
        const {player} = params;
        const card = this.ability?.card ?? params.card;
        if (!player) {
            throw new TypeError('ChooseCardTypeEffect requires a player.');
        }
        if (!card || typeof card.toObj !== 'function') {
            throw new TypeError(
                'ChooseCardTypeEffect requires a card to display.'
            );
        }

        delete params.namedCardType;
        const response = await this.openDialog({
            dialogType: DIALOG_LIST,
            targetPlayer: player.id ?? player.userId ?? player.name,
            targetPlayerName: player.name,
            data: {
                cardTypeOptions: true,
                card: card.toObj({...params, player}),
                options: this.cardTypes.map((cardType, id) => ({
                    id,
                    cardType,
                })),
            },
        });
        const selected = response?.selected;
        if (!Number.isInteger(selected?.id) ||
            !this.cardTypes[selected.id] ||
            selected.cardType !== this.cardTypes[selected.id]) {
            throw new Error(
                'ChooseCardTypeEffect received an invalid card type selection.'
            );
        }

        this.selectedType = this.cardTypes[selected.id];
        params.namedCardType = this.selectedType;
    }
}

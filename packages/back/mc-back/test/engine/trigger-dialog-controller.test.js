import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_LIST,
    DIALOG_USE_CARD,
    PRIORITY_INTERRUPT,
    TRIGGER_ENCOUNTER_REVEAL,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

describe('trigger dialog controller', () => {
    test('routes choices to the trigger controller without replacing the event player', async () => {
        const revealingPlayer = {
            hand: {
                cards: [{
                    toObj: () => ({id: 'revealer-card'}),
                }],
            },
            isPlayer: true,
            name: 'Jugador que revela',
        };
        const controller = {
            hand: {
                cards: [{
                    toObj: () => ({id: 'controller-card'}),
                }],
            },
            isPlayer: true,
            name: 'Controlador',
        };
        const createCard = (id, name) => ({
            controller,
            id,
            name,
            owner: controller,
            toObj() {
                return {id: this.id, name: this.name};
            },
        });
        const blackWidow = createCard('black-widow', 'Viuda Negra');
        const otherCard = createCard('other-card', 'Otra carta');
        const createAbility = (id, name) => ({
            effect: {},
            hideDialog: false,
            id,
            isEndLasting: false,
            name,
            async resolveAbility(params) {
                this.resolved = true;
                this.resolutionParams = params;
            },
            getTitle({player}) {
                return `${this.name} (${player.name})`;
            },
        });
        const triggers = [
            new Trigger({
                ability: createAbility('black-widow-change', 'Cambiar encuentro'),
                card: blackWidow,
                trigger: TRIGGER_ENCOUNTER_REVEAL,
            }),
            new Trigger({
                ability: createAbility('black-widow-skip', 'Omitir encuentro'),
                card: blackWidow,
                trigger: TRIGGER_ENCOUNTER_REVEAL,
            }),
            new Trigger({
                ability: createAbility('other-card-response', 'Otra respuesta'),
                card: otherCard,
                trigger: TRIGGER_ENCOUNTER_REVEAL,
            }),
        ];
        const revealedCard = {name: 'Carta de Encuentros'};
        const params = {
            card: revealedCard,
            effect: {},
            player: revealingPlayer,
        };
        const dialogs = [];
        const engine = new Engine();

        engine.match = {suppressedInformationalDialogIds: []};
        engine.openDialog = async dialog => {
            dialogs.push(dialog);

            return dialog.dialogType === DIALOG_USE_CARD ?
                {selected: {id: blackWidow.id}} :
                {selected: {id: '0'}};
        };

        await engine._openTriggersDialog(triggers, PRIORITY_INTERRUPT, params);

        assert.equal(dialogs.length, 2);
        assert.equal(dialogs[0].dialogType, DIALOG_USE_CARD);
        assert.equal(dialogs[0].targetPlayer, controller);
        assert.deepEqual(dialogs[0].hand, [{id: 'controller-card'}]);
        assert.equal(dialogs[1].dialogType, DIALOG_LIST);
        assert.equal(dialogs[1].targetPlayer, controller);
        assert.deepEqual(dialogs[1].hand, [{id: 'controller-card'}]);
        assert.equal(dialogs[1].data.options[0].text, 'Cambiar encuentro (Controlador)');
        assert.strictEqual(params.player, revealingPlayer);
        assert.strictEqual(triggers[0].ability.resolutionParams.player, controller);
        assert.strictEqual(triggers[0].ability.resolutionParams.triggeredCard, revealedCard);
    });
});

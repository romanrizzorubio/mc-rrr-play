import {DIALOG_ENCOUNTERS_REVEAL} from '../constants/dialogs.js';
import {TARGET_PLAYER, TARGET_SCENARIO} from '../constants/targets.js';
import {TRIGGER_TREACHERY_REVEAL} from '../constants/triggers.js';

import {CANCEL_ENCOUNTER_FULL, CANCEL_ENCOUNTER_NOT, CANCEL_ENCOUNTER_REVEAL} from './cancel-encounter-effect.js';
import {DelayedEffect} from './delayed-effect.js';
import {Effect} from './effect.js';
import {EngageEffect} from './engage-effect.js';
import {GetSurgeEffect} from './get-surge-effect.js';
import {PutPlayEffect} from './put-play-effect.js';

export class RevealEncounterEffect extends Effect {
    constructor({
        card,
        player,
    }) {
        super(arguments[0]);

        this.card = card;
        this.player = player;

        this.surge = false;
        this.canceled = CANCEL_ENCOUNTER_NOT;
    }
    async applySurge(params) {
        const {player} = params;

        const cards = await this.match.drawEncounterCards();
        const card = cards.shift();
        const surge = new RevealEncounterEffect({
            selectedTarget: card,
            player,
            match: this.match,
        });
        const delayed = new DelayedEffect({
            selectedTarget: this,
            effect: surge,
            match: this.match,
        });

        await delayed.runEffect({
            ...params,
            card: card,
        });

        this.selectedTarget.endTriggers(true);
    }
    checkTrigger() {
        const {canceled} = this;

        return canceled !== CANCEL_ENCOUNTER_FULL;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_TREACHERY_REVEAL,
            ]);
    }
    async prepare(params) {
        await super.prepare(params);

        const {selectedTarget} = this;
        const {player} = params;

        this.card = selectedTarget;
        this.player = player;

        await this.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            data: {
                card: selectedTarget.toObj(arguments[0]),
            },
        });
    }
    reveal(params) {
        const {selectedTarget} = this;

        if (selectedTarget.abilities) {
            const ability = selectedTarget.abilities.find(_ability => _ability.isWhenRevealed && _ability.isValidIdentity(params));

            if (ability) {
                return ability.resolveAbility({
                    ...params,
                    card: selectedTarget,
                });
            }
        }
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.selectedTarget,
        };
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {preventSurge, player} = params;

        if (this.match.isUniqueCard(selectedTarget)) {
            this.canceled = CANCEL_ENCOUNTER_FULL;

            await selectedTarget.discard();

            if (!preventSurge) {
                return await this.applySurge(params);
            }
        }

        const getSurgeEffect = new GetSurgeEffect({
            selectedTarget,
            match: this.match,
        });
        await getSurgeEffect.runEffect({
            effect: getSurgeEffect,
            player,
        });
        this.surge = getSurgeEffect.surge;

        if (selectedTarget.isMain) {
            selectedTarget.refresh();
        } else {
            if (selectedTarget.isMinion) {
                const engageEffect = new EngageEffect({
                    card: selectedTarget,
                    controller: this.match.scenario,
                    target: selectedTarget.faceTo,
                    match: this.match,
                });

                await engageEffect.runEffect(params);
            } else if (!selectedTarget.isTreachery) {
                let target;
                let controller = this.match.scenario;
                if (selectedTarget.isAttachment) {
                    target = selectedTarget.card.attach;
                } else if (selectedTarget.isSideScheme) {
                    target = TARGET_SCENARIO;
                } else if (selectedTarget.giveToOwner) {
                    controller = selectedTarget.owner;
                    target = TARGET_PLAYER;
                    params.player = selectedTarget.owner;
                }

                const putPlayEffect = new PutPlayEffect({
                    card: selectedTarget,
                    controller,
                    target,
                    match: this.match,
                });

                await putPlayEffect.runEffect({
                    ...params,
                    card: selectedTarget,
                    reveal: this,
                });
            }
        }

        if (this.canceled !== CANCEL_ENCOUNTER_REVEAL) {
            await this.reveal({
                ...params,
                effect: this,
                reveal: this,
                card: selectedTarget,
            });
        }

        if (selectedTarget.isTreachery) {
            await selectedTarget.discard();
        }

        if (this.surge) {
            await this.applySurge(params);
        }
    }
}
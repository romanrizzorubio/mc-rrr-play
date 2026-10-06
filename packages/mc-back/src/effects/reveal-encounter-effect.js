import {
    DIALOG_ENCOUNTERS_REVEAL,
    PLACE_ENCOUNTER_DECK,
    PLACE_PLAYER_ENCOUNTERS,
    TARGET_PLAYER,
    TARGET_SCENARIO,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_TREACHERY_REVEAL,
} from 'mc-shared';

import {
    CANCEL_ENCOUNTER_FULL,
    CANCEL_ENCOUNTER_NOT,
    CANCEL_ENCOUNTER_REVEAL,
} from './cancel-encounter-constants.js';
import {DelayedEffect} from './delayed-effect.js';
import {Effect} from './effect.js';
import {EngageEffect} from './engage-effect.js';
import {GetSurgeEffect} from './get-surge-effect.js';
import {PutPlayEffect} from './put-play-effect.js';

export class RevealEncounterEffect extends Effect {
    constructor({
        card,
        player,
        from = PLACE_PLAYER_ENCOUNTERS,
        selectedTarget,
    }) {
        super(arguments[0]);

        if (from !== PLACE_PLAYER_ENCOUNTERS && from !== PLACE_ENCOUNTER_DECK) {
            throw new Error(`Unsupported encounter reveal source: ${from}`);
        }

        this.card = card;
        this.player = player;
        this.from = from;
        this.hasPreselectedCard = Boolean(selectedTarget?.isEncounterCard);

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
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        if (this.hasPreselectedCard) {
            return true;
        }

        if (this.from === PLACE_PLAYER_ENCOUNTERS) {
            return Boolean(params.player?.encounters.length);
        }

        const {cards, discardPile} = this.match.scenario.deck;
        return cards.length > 0 || discardPile.length > 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_ENCOUNTER_REVEAL,
                TRIGGER_TREACHERY_REVEAL,
            ]);
    }
    async triggerInit(params) {
        const shouldResolve = await super.triggerInit(params);

        if (!shouldResolve && this.canceled === CANCEL_ENCOUNTER_FULL) {
            await this.selectedTarget.discard();
        }

        return shouldResolve;
    }
    async prepare(params) {
        if (!this.hasPreselectedCard) {
            if (this.from === PLACE_PLAYER_ENCOUNTERS) {
                const {player} = params;
                if (!player) {
                    throw new Error('A player is required to reveal a dealt encounter card');
                }

                this.selectedTarget = player.encounters.shift();
            } else if (this.from === PLACE_ENCOUNTER_DECK) {
                const [card] = await this.match.drawEncounterCards();
                this.selectedTarget = card;
            }
        }

        if (!this.selectedTarget?.isEncounterCard) {
            throw new Error(`No encounter card is available from ${this.from}`);
        }

        await super.prepare(params);

        const {selectedTarget} = this;
        const {player} = params;

        this.card = selectedTarget;
        this.player = player;

        if (!selectedTarget.isMainScheme) {
            await this.openDialog({
                dialogType: DIALOG_ENCOUNTERS_REVEAL,
                data: {
                    card: selectedTarget.toObj(arguments[0]),
                    horizontal: Boolean(selectedTarget.isMainScheme || selectedTarget.isSideScheme),
                },
            });
        }
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
                let attachTarget;
                let skipPutPlay = false;
                if (selectedTarget.isAttachment) {
                    const attachmentCard = selectedTarget.card;
                    const attachConfig = attachmentCard.getAttachConfig();
                    target = attachConfig.target;

                    if (attachmentCard.attach && typeof attachmentCard.attach === 'object') {
                        const attachEffect = attachmentCard.createAttachEffect(selectedTarget);
                        attachTarget = await attachEffect.selectTarget({
                            ...params,
                            effect: attachEffect,
                        });

                        if (!attachTarget) {
                            await selectedTarget.discard();
                            if (attachConfig.ifNot) {
                                const ifNotEffect = this.match.abilitiesFactory.effectsFactory
                                    .createEffect(attachConfig.ifNot);
                                if (!ifNotEffect) {
                                    throw new Error('Unable to create attachment fallback effect.');
                                }

                                await ifNotEffect.runEffect({
                                    ...params,
                                    card: selectedTarget,
                                    reveal: this,
                                });
                            }
                            skipPutPlay = true;
                        }
                    }
                } else if (selectedTarget.isSideScheme) {
                    target = TARGET_SCENARIO;
                } else if (selectedTarget.giveToOwner) {
                    controller = selectedTarget.owner;
                    target = TARGET_PLAYER;
                    params.player = selectedTarget.owner;
                }

                if (!skipPutPlay) {
                    const putPlayEffect = new PutPlayEffect({
                        card: selectedTarget,
                        controller,
                        target,
                        selectedTarget: attachTarget,
                        match: this.match,
                    });

                    await putPlayEffect.runEffect({
                        ...params,
                        card: selectedTarget,
                        reveal: this,
                    });
                }
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
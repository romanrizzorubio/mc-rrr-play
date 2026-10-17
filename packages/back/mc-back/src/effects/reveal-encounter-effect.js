import {
    DIALOG_ENCOUNTERS_REVEAL,
    PRIORITY_CONSTANT,
    TARGET_PLAYER,
    TARGET_SCENARIO,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_ENCOUNTER_ABILITY_RESOLVED,
    TRIGGER_TREACHERY_REVEAL,
} from 'mc-shared';

import {InciteAbility} from '../abilities/misc/incite-ability.js';
import {
    CANCEL_ENCOUNTER_FULL,
    CANCEL_ENCOUNTER_NOT,
    CANCEL_ENCOUNTER_REVEAL,
} from './cancel-encounter-constants.js';
import {checkCondition, path} from '../engine/utils.js';
import {DelayedEffect} from './delayed-effect.js';
import {DealEncounterEffect} from './deal-encounter-effect.js';
import {Effect} from './effect.js';
import {EngageEffect} from './engage-effect.js';
import {GetSurgeEffect} from './get-surge-effect.js';
import {PutPlayEffect} from './put-play-effect.js';
import {ResolveSurgeEffect} from './resolve-surge-effect.js';

export class RevealEncounterEffect extends Effect {
    constructor(params = {}) {
        const {
            card,
            player,
            putInPlay = false,
        } = params;
        super({
            ...params,
            selectedTarget: params.selectedTarget ??
                (card?.isEncounterCard ? card : undefined),
        });

        this.card = card ?? params.selectedTarget;
        this.player = player;
        this.putInPlay = putInPlay;

        this.surge = false;
        this.canceled = CANCEL_ENCOUNTER_NOT;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.surge = false;
        this.canceled = CANCEL_ENCOUNTER_NOT;
    }
    getCard(params) {
        const source = typeof this.card === 'string' ?
            path(params, this.card) :
            this.selectedTarget ?? this.card;
        if (Array.isArray(source)) {
            return source.find(card => card?.isEncounterCard);
        }

        return source?.isEncounterCard ? source : undefined;
    }
    async applySurge(params) {
        const {player} = params;
        const resolveSurgeEffect = new ResolveSurgeEffect({
            match: this.match,
        });
        await resolveSurgeEffect.runEffect(params);

        if (resolveSurgeEffect.card) {
            const surgeReveal = new RevealEncounterEffect({
                selectedTarget: resolveSurgeEffect.card,
                player,
                match: this.match,
            });
            const delayed = new DelayedEffect({
                selectedTarget: this,
                effect: surgeReveal,
                match: this.match,
            });

            await delayed.runEffect({
                ...params,
                card: resolveSurgeEffect.card,
            });
        }

        this.selectedTarget.endTriggers(true);
    }
    checkTrigger() {
        const {canceled} = this;

        return canceled !== CANCEL_ENCOUNTER_FULL;
    }
    async canRun(params) {
        return Boolean(this.getCard(params));
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
        const card = this.getCard(params);
        if (!card) {
            throw new Error('RevealEncounterEffect requires an encounter card.');
        }

        this.selectedTarget = card;
        await super.prepare(params);

        const {selectedTarget} = this;
        const {player} = params;

        this.card = selectedTarget;
        this.player = player;

        if (!selectedTarget.isMainScheme) {
            await this.openDialog({
                dialogType: DIALOG_ENCOUNTERS_REVEAL,
                ...(selectedTarget.isVillain ? {title: 'Mostrando al villano'} : {}),
                data: {
                    card: selectedTarget.toObj(arguments[0]),
                    horizontal: Boolean(selectedTarget.isMainScheme || selectedTarget.isSideScheme),
                },
            });
        }
    }
    async reveal(params) {
        const {selectedTarget} = this;
        const abilities = [
            ...(selectedTarget.currentSide?.abilities || selectedTarget.abilities || []),
        ];
        if (selectedTarget.incite > 0) {
            abilities.push(new InciteAbility({
                card: selectedTarget,
                match: this.match,
            }));
        }

        const whenRevealedAbilities = abilities.filter(ability =>
            ability.isWhenRevealed &&
                ability.isValidIdentity(params) &&
                (!ability.condition || checkCondition(params, ability.condition))
        );

        for (const ability of whenRevealedAbilities) {
            await ability.resolveAbility({
                ...params,
                card: selectedTarget,
            });

            if (ability.resolved) {
                await this.trigger(
                    PRIORITY_CONSTANT,
                    [TRIGGER_ENCOUNTER_ABILITY_RESOLVED],
                    {
                        ...params,
                        effect: ability.effect || ability,
                        card: selectedTarget,
                        revealedAbility: ability,
                    }
                );
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

            if (selectedTarget.isEncounterCard && !selectedTarget.isVillain) {
                const encounterPlayer = player || this.player;
                if (!encounterPlayer) {
                    throw new Error(
                        'A player is required to receive a facedown encounter card.'
                    );
                }

                const dealEncounterEffect = new DealEncounterEffect({
                    match: this.match,
                    selectedTarget: encounterPlayer,
                });
                await dealEncounterEffect.runEffect({
                    ...params,
                    player: encounterPlayer,
                });
            } else if (!preventSurge) {
                await this.applySurge(params);
            }

            return;
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

        let engageEffect;
        if (selectedTarget.isMain) {
            if (this.putInPlay && selectedTarget.isVillain) {
                const putPlayEffect = new PutPlayEffect({
                    card: selectedTarget,
                    controller: this.match.scenario,
                    match: this.match,
                });
                await putPlayEffect.runEffect({
                    ...params,
                    force: true,
                    card: selectedTarget,
                });
            } else {
                await selectedTarget.refresh();
            }
        } else {
            if (selectedTarget.isMinion) {
                engageEffect = new EngageEffect({
                    card: selectedTarget,
                    controller: this.match.scenario,
                    target: selectedTarget.faceTo,
                    deferEngageHeroTrigger: true,
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
                        ...(this.putInPlay ? {force: true} : {}),
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

        if (engageEffect) {
            await engageEffect.resolveDeferredEngageHeroTrigger(params);
        }

        if (selectedTarget.isTreachery) {
            await selectedTarget.discard();
        }

        if (this.surge) {
            await this.applySurge(params);
        }
    }
}
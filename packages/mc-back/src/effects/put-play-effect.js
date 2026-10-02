import {PRIORITY_CONSTANT} from '../constants/priorities.js';
import {TARGET_ALLY, TARGET_YOU} from '../constants/targets.js';
import {TRIGGER_INSTANT, TRIGGER_THIS_ENTER_PLAY} from '../constants/triggers.js';

import {AttachEffect} from './attach-effect.js';
import {DelayedEffect} from './delayed-effect.js';
import {DiscardFromGameEffect} from './discard-from-game-effect.js';
import {Effect} from './effect.js';
import {GetMaxAlliesEffect} from './get-max-allies-effect.js';


export class PutPlayEffect extends Effect {
    constructor({
        card,
        controller,
    }) {
        super(arguments[0]);

        this.card = card;
        this.controller = controller;
    }
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_THIS_ENTER_PLAY,
            ]);
    }
    async execute(params) {
        const {card, controller, selectedTarget} = this;
        const {force, player} = params;

        if (!card.isInPlay || force) {
            if (controller) {
                if (!card.isMinion) {
                    controller.gameZone.addToGameZone(card);
                }
                card.controller = controller;
            }

            await card.initTriggers(params);

            if (card.uses) {
                card.counters = card.uses;
            }

            if (card.toughness) {
                card.setTough();
            }

            if (card.isAttachable && card.card.attach !== TARGET_YOU) {
                const attachEffect = new AttachEffect({
                    card,
                    selectedTarget,
                    player: controller,
                    match: this.match,
                });
                await attachEffect.runEffect(params);
            }

            if (card.isSideScheme) {
                card.initScheme();
            }

            if (!card.isMinion && !card.attachedTo && controller && controller.gameZone) {
                await controller.gameZone.refresh();
            }

            if (card.isAlly) {
                const getMaxAlliesEffect = new GetMaxAlliesEffect({
                    match: this.match,
                });

                await getMaxAlliesEffect.runEffect(params);
                const allies = player.allies;

                if (allies.length > getMaxAlliesEffect.maxAllies) {
                    const discardFromGameEffect = new DiscardFromGameEffect({
                        target: TARGET_ALLY,
                        match: this.match,
                    });

                    const delayed = new DelayedEffect({
                        selectedTarget: params.effect,
                        effect: discardFromGameEffect,
                    });

                    await delayed.runEffect({
                        ...params,
                        card: card,
                    });
                }
            }

            if (card.triggerInstant) {
                await this.trigger(PRIORITY_CONSTANT, TRIGGER_INSTANT, params);
            }
        }
    }
}
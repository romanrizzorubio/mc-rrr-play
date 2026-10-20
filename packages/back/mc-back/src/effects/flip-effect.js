import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_RESPONSE,
    TARGET_ALTEREGO_SIDE,
    TARGET_HERO_SIDE,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_THIS_FLIP,
} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';

import {Effect} from './effect.js';
import {RevealEncounterEffect} from './reveal-encounter-effect.js';

export class FlipEffect extends Effect {
    constructor({
        formTarget,
        selectedFormTarget,
    }) {
        super(arguments[0]);

        this.formTarget = formTarget;
        this.selectedFormTarget = selectedFormTarget;
        this.blocked = false;
    }
    async canFlipTarget(target, params) {
        if (!target) {
            return true;
        }

        const owner = target.owner;

        if (!owner?.isPlayer || typeof owner.canFlip !== 'function') {
            return true;
        }

        const card = target.parent?.sides?.includes(target) ?
            target.parent :
            target;

        return owner.canFlip({...params, card});
    }
    filterTarget(card) {
        if (super.filterTarget.apply(this, arguments)) {
            const {formTarget} = this;

            switch (formTarget) {
                case TARGET_ALTEREGO_SIDE:
                    return !card.isAlterEgo;
                case TARGET_HERO_SIDE:
                    return !card.isHero;
            }

            return true;
        }

        return false;
    }

    async prepare(params) {
        await super.prepare(params);

        if (!this.selectedFormTarget) {
            const {formTarget} = this;

            const validTarget = new ValidTarget({
                match: this.match,
            });

            this.selectedFormTarget = await validTarget.selectTarget({
                ...params,
                card: this.selectedTarget,
                target: formTarget,
            });
        }
    }

    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const targets = (await this.getValidTarget(params)).flat(Infinity);

        return this.promisesSequentialSome(targets, target =>
            this.canFlipTarget(target, params));
    }

    async execute(params) {
        const {selectedTarget, selectedFormTarget} = this;
        const {sides} = selectedTarget;
        const {own} = params;
        const sideIndex = sides.indexOf(selectedFormTarget);

        this.blocked = !await this.canFlipTarget(selectedTarget, params);
        if (this.blocked) {
            return;
        }

        if (own) {
            selectedTarget.flipped = true;
        }

        if (typeof selectedTarget.flipToSide === 'function') {
            await selectedTarget.flipToSide(sideIndex, {
                ...params,
                reveal: async card => {
                    const revealEffect = new RevealEncounterEffect({
                        selectedTarget: card,
                        putInPlay: true,
                        match: this.match,
                    });
                    await revealEffect.runEffect({
                        ...params,
                        player: params.player || this.match.initialPlayer,
                    });
                },
            });
        } else {
            selectedTarget.endTriggers();
            selectedTarget.selectedSide = sideIndex;
            await selectedTarget.initTriggers(params);
        }

        if (typeof selectedTarget.flipToSide !== 'function') {
            await selectedTarget.refresh();
        }
        const {owner} = selectedTarget;
        if (owner && owner.isPlayer) {
            await owner.hand.refresh();
        }

        const triggerTypes = [TRIGGER_THIS_FLIP];
        if (owner?.isPlayer) {
            triggerTypes.push(TRIGGER_SUPERHERO_FLIPS);
        }
        const triggerParams = {
            ...params,
            card: selectedTarget,
            triggeredCard: selectedTarget,
            ...(owner?.isPlayer ? {player: owner} : {}),
        };

        await this.trigger(PRIORITY_CONSTANT, triggerTypes, triggerParams);
        await this.trigger(PRIORITY_FORCED_RESPONSE, triggerTypes, triggerParams);
        await this.trigger(PRIORITY_RESPONSE, triggerTypes, triggerParams);
    }
    isResolved() {
        return !this.blocked;
    }
}
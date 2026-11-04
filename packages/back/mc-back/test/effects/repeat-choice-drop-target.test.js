import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_ENEMY, TARGET_SCHEME} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {OptionAbility} from '../../src/abilities/misc/option-ability.js';
import {ChooseAbilityEffect} from '../../src/effects/choose-ability-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {RepeatEffect} from '../../src/effects/repeat-effect.js';

describe('Repeat choice event drop targets', () => {
    test('combines option targets and only preselects a compatible choice', async () => {
        const enemy = {id: 'enemy-1'};
        const scheme = {id: 'scheme-1'};
        const targets = new Map([
            [TARGET_ENEMY, [enemy]],
            [TARGET_SCHEME, [scheme]],
        ]);
        const resolvedTargets = [];
        const selectedOptions = [1, 0];
        let dialogCount = 0;
        const match = {
            async openDialog() {
                return {
                    selected: {id: selectedOptions[dialogCount++]},
                };
            },
            triggerCards: {},
        };
        const createOption = (name, target) => {
            const effect = new Effect({match, target});
            effect.getValidTarget = async () => targets.get(target);
            effect.runEffect = async function (params) {
                this.selectedTarget ??=
                    (await this.getValidTarget(params))[0];
                resolvedTargets.push(this.selectedTarget);
                this.resolved = true;
                this.fullResolved = true;
            };
            const option = new OptionAbility({effect, match, name});
            option.canRun = async () => true;
            option.payCosts = async () => true;

            return option;
        };
        const options = [
            createOption('Damage an enemy', TARGET_ENEMY),
            createOption('Remove threat from a scheme', TARGET_SCHEME),
        ];
        match.effectsFactory = {
            parseEffect: () => {
                const effect = new ChooseAbilityEffect({
                    match,
                    options,
                });
                effect.runEffect = async params => {
                    await effect.execute(params);
                    effect.resolved = true;
                    effect.fullResolved = true;
                };

                return effect;
            },
        };

        const card = {
            abilities: [],
            isEvent: true,
            isUpgrade: false,
            toObj: () => ({name: 'Por partida doble'}),
        };
        const repeatEffect = new RepeatEffect({
            count: 2,
            effectDefinition: {type: 'choose'},
            match,
        });
        repeatEffect.runEffect = async params => {
            await repeatEffect.execute(params);
            repeatEffect.resolved = true;
            repeatEffect.fullResolved = true;
        };
        const ability = new Ability({
            card,
            effect: repeatEffect,
            match,
        });
        ability.canRun = async () => true;
        ability.payCosts = async () => true;
        card.abilities.push(ability);

        const playCardEffect = new PlayCardEffect({
            ability,
            card,
            match,
            targetId: scheme.id,
        });
        const player = {hand: {cards: []}};

        await playCardEffect.preselectDroppedTarget({
            card,
            match,
            player,
        });

        assert.strictEqual(playCardEffect.preselectedEventTarget, scheme);
        assert.equal(playCardEffect.preselectedEventEffects.size, 0);

        await ability.resolveAbility({
            card,
            match,
            player,
            preselectedEffectTargets:
                playCardEffect.preselectedEventEffects,
            preselectedEventTarget: playCardEffect.preselectedEventTarget,
        });

        assert.equal(dialogCount, 2);
        assert.deepEqual(resolvedTargets, [scheme, enemy]);
    });
});

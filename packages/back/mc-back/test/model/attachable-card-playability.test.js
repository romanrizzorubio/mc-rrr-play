import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_INTERRUPT,
    TARGET_SIDE_SCHEME,
    TARGET_YOUR_HERO,
    TRIGGER_ATTACHED_DEFEAT,
} from 'mc-shared';
import justiceUpgrades from '../../../mc-data/seed/catalog/aspects/justice/upgrades.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Seguimiento requires an available side scheme and is limited per scheme', async () => {
    const seguimiento = justiceUpgrades.find(({_id}) =>
        _id === 'justice-seguimiento');
    assert.ok(seguimiento);
    assert.equal(seguimiento.card.params.attach, TARGET_SIDE_SCHEME);
    assert.equal(seguimiento.card.params.maxAttach, 1);
    assert.equal(
        seguimiento.card.params.abilities[0].type,
        ABILITY_INTERRUPT
    );

    const match = {
        isUniqueCard: () => false,
        schemes: [],
        sideSchemes: [],
    };
    const player = {match};
    const cardsFactory = new CardsFactory({match});
    const printedCard = cardsFactory.createCard(seguimiento.card);
    const card = cardsFactory.createGameCard({
        card: printedCard,
        owner: player,
    });
    const [ability] = card.abilities;
    assert.equal(ability.isInterrupt, true);
    assert.equal(ability.trigger, TRIGGER_ATTACHED_DEFEAT);
    const canPlay = () => card.canPlay({
        abilityType: ABILITY_ACTION,
        checkOnly: true,
        player,
    });

    match.schemes.push({attached: []});
    assert.equal(await canPlay(), false);

    const firstSideScheme = {attached: []};
    const secondSideScheme = {attached: []};
    match.sideSchemes.push(firstSideScheme, secondSideScheme);
    assert.equal(await canPlay(), true);

    firstSideScheme.attached.push({card: {id: printedCard.id}});
    assert.equal(await canPlay(), true);

    const playEffect = new PlayCardEffect({card, match});
    assert.deepEqual(
        await playEffect.getValidTarget({match, player}),
        [secondSideScheme]
    );

    secondSideScheme.attached.push({card: {id: printedCard.id}});
    assert.equal(await canPlay(), false);
});

test('hero-form attachments link to the superhero and remain form-gated', async () => {
    const catalog = await loadCatalog();
    const doctorStrange = catalog.heroes.find(({_id}) =>
        _id === 'doctor-strange');
    assert.ok(doctorStrange);
    const counterspell = doctorStrange.config.nemesis.find(({card}) =>
        card.params.name === 'Contrahechizo');
    const match = {
        initialPlayer: {},
        isUniqueCard: () => false,
        triggerCards: {},
    };
    const heroSide = {
        id: 'hero-side',
        isHero: true,
        isSuperhero: true,
        attached: [],
    };
    const superhero = {
        id: 'superhero',
        isSuperhero: true,
        currentSide: heroSide,
        attached: [],
        async refresh() {},
    };
    heroSide.parent = superhero;
    const player = {
        isHero: true,
        superhero,
    };
    const cardsFactory = new CardsFactory({match});
    assert.ok(counterspell);
    assert.deepEqual(counterspell.card.params.attach, {
        target: TARGET_YOUR_HERO,
    });

    const printedCard = cardsFactory.createCard(counterspell.card);
    const attachment = cardsFactory.createGameCard({
        card: printedCard,
    });
    const attachEffect = printedCard.createAttachEffect(attachment);

    assert.deepEqual(
        await attachEffect.getValidTarget({match, player}),
        [heroSide],
    );

    attachEffect.selectedTarget = heroSide;
    await attachEffect.execute({player});

    assert.deepEqual(superhero.attached, [attachment]);
    assert.deepEqual(heroSide.attached, []);
    assert.equal(attachment.attachedTo, superhero);

    printedCard.maxAttach = 1;
    const maxAttachEffect = printedCard.createAttachEffect(attachment);

    assert.deepEqual(
        await maxAttachEffect.getValidTarget({match, player}),
        [],
    );

    printedCard.maxAttach = 0;
    player.isHero = false;
    superhero.currentSide = {isHero: false};

    const alterEgoAttachEffect = printedCard.createAttachEffect(attachment);

    assert.deepEqual(
        await alterEgoAttachEffect.getValidTarget({match, player}),
        [],
    );
    assert.deepEqual(superhero.attached, [attachment]);
});

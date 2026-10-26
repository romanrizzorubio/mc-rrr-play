import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McPlayer} = await import(
    '../src/components/match/mc-player/mc-player.js'
);
const {SuperheroCardComponent} = await import(
    '../src/components/cards/characters/mc-superhero-card/mc-superhero-card.js'
);
const {McCardImage} = await import(
    '../src/components/cards/mc-card-image/mc-card-image.js'
);
const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);

describe('superhero aspect markers', () => {
    test('passes aspect markers from the player state to the superhero card', () => {
        const aspectMarkers = ['aggression', 'justice'];
        const component = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                superhero: {
                    name: 'Spiderwoman',
                    image: 'spiderwoman.png',
                    aspectMarkers,
                    attached: [],
                    tuckedCards: [],
                },
                gameZone: {cards: []},
            },
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            canEndTurn: false,
        });
        const template = component.renderSuperhero();

        assert.match(template.strings.join(''), /\.aspectMarkers=/);
        assert.ok(template.values.includes(aspectMarkers));
    });

    test('renders centered colored dots above the image without a border', () => {
        const component = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                aspectMarkers: [
                    'aggression',
                    'justice',
                    'aggression',
                    'unknown',
                ],
                abilities: [],
                tuckedCards: [],
                obligations: [],
                canEndTurn: false,
                extraTraits: [],
                extraKeywords: [],
            }
        );
        const template = component.render();
        assert.match(template.strings.join(''), /\.aspectMarkers=/);
        assert.ok(template.values.includes(component.aspectMarkers));

        const image = Object.assign(Object.create(McCardImage.prototype), {
            aspectMarkers: component.aspectMarkers,
            src: 'spiderwoman.png',
            size: 'm',
            horizontal: false,
            rotated: false,
        });
        const imageTemplate = image.render();
        const markersTemplate = imageTemplate.values.find(value =>
            value?.strings?.join('').includes('aspect-markers')
        );

        assert.ok(markersTemplate);
        assert.match(markersTemplate.strings.join(''), /aspect-markers/);
        const markerDots = markersTemplate.values[0];
        assert.equal(markerDots.length, 2);
        assert.ok(markerDots[0].values.includes('aggression'));
        assert.ok(markerDots[0].values.includes('Agresividad'));
        assert.ok(markerDots[1].values.includes('justice'));
        assert.ok(markerDots[1].values.includes('Justicia'));

        const styles = McCardImage.styles.cssText;
        assert.match(
            styles,
            /:host\(\.has-aspect-markers\)\s*\{[^}]*margin-top:\s*var\(--aspect-marker-space,\s*16px\)/s
        );
        assert.match(styles, /\.aspect-markers\s*\{[^}]*top:\s*-4px/s);
        assert.match(styles, /\.aspect-markers\s*\{[^}]*left:\s*50%/s);
        assert.match(
            styles,
            /\.aspect-markers\s*\{[^}]*translate\(-50%,\s*-100%\)/s
        );
        assert.doesNotMatch(styles, /\.aspect-marker\s*\{[^}]*border:/s);
        assert.match(
            styles,
            /\.aspect-marker\.aspect-aggression/
        );
        assert.match(
            styles,
            /\.aspect-marker\.aspect-justice/
        );
    });

    test('aligns basic stat labels with the image top edge', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            aspectMarkers: ['aggression'],
            showBasicStats: true,
            thwart: 1,
            attack: 1,
            defense: 1,
            scheme: undefined,
            recovery: undefined,
            emphasizedStats: [],
            nameWithStage: false,
            stage: undefined,
            unprintedStats: [],
        });
        const template = card.renderStats();

        assert.ok(template.values.includes('aspect-markers-aligned'));
        assert.match(
            CardComponent.styles.cssText,
            /\.character-stats\.aspect-markers-aligned\s*\{[^}]*margin-top:\s*var\(--aspect-marker-space\)/s
        );
        assert.match(
            CardComponent.styles.cssText,
            /--aspect-marker-space:\s*16px/
        );
    });

    test('omits the marker overlay when no aspect has been played', () => {
        const component = Object.assign(
            Object.create(McCardImage.prototype),
            {aspectMarkers: []}
        );

        assert.equal(component.renderAspectMarkers(), '');
    });
});
